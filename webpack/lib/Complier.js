const _path = require('path')
const fs = require('fs')
const ejs = require('ejs')

// 把代码转换成 AST
const babylon = require('babylon')
// 遍历 AST 节点
const traverse = require('@babel/traverse').default
// 替换 AST 节点
const types = require('@babel/types')
// 生成 AST
const generator = require('@babel/generator').default

module.exports = class Complier {
  constructor(config) {
    this.config = config

    // 存放所有模块
    this.modules = {}
    // 获取打包入口文件的路径
    this.entry = config.entry
    // 运行时的路径
    this.root = process.cwd()
    // 入口的完整路径
    this.entryID
    // 输出的资源
    this.assets = {}
  }

  getSource(path) { // 获取目标路径资源
    let content = fs.readFileSync(path, 'utf8')
    const rules = this.config.module.rules
    for (let rule of rules) {
      const { test, use } = rule
      let length = use.length - 1
      if (test.test(path)) { // 匹配到对应的文件
        function normalLoader() { // for 循环好像也可以，没搞懂这里为什么要用递归，虽然这是尾递归
          let loader = require(use[length--])
          content = loader(path, content)
          if (length >= 0) {
            normalLoader()
          }
        }
        normalLoader()
      }
    }
    return content
  }

  parse(source, parentPath) { // 解析AST（抽象语法树）
    const AST = babylon.parse(source)
    const dependencies = []
    traverse(AST, {
      CallExpression(path) {
        const node = path.node
        if (node.callee.name === 'require') {
          node.callee.name = '__webpack_require__' // 替换源码中的 require
          let moduleName = node.arguments[0].value // 引用的文件名
          moduleName = moduleName + (_path.extname(moduleName) ? '' : '.js') // 给文件名添加后缀
          moduleName = `./${_path.join(parentPath, moduleName)}`
          dependencies.push(moduleName) // 更新依赖关系
          node.arguments = [types.stringLiteral(moduleName)] // 替换源码中的文件名
        }
      }
    })
    const sourceCode = generator(AST).code
    return { sourceCode, dependencies }
  }

  buildModule(modulePath, isEntry) {
    // 模块内容
    const source = this.getSource(modulePath)
    // 设置模块的名称，类似 ./src/index.js
    const moduleName = `./${_path.relative(this.root, modulePath)}`
    if (isEntry) {
      this.entryID = moduleName
    }
    
    const { sourceCode, dependencies } = this.parse(source, _path.dirname(moduleName))

    this.modules[moduleName] = sourceCode // 更新模块

    dependencies.forEach(path => {
      this.buildModule(path, false)
    })

  }
  
  emitFile() { // 输出打包后的文件
    const path = _path.join(this.config.output.path, this.config.output.filename) // 输出的路径
    const template = this.getSource(_path.resolve(__dirname, 'template.ejs')) // 获取模板资源
    const code = ejs.render(template, { entryID: this.entryID, modules: this.modules })
    this.assets[path] = code
    fs.writeFileSync(path, code) // 输出
  }

  run() {
    this.buildModule(_path.resolve(this.root, this.entry), true)
    this.emitFile()
  }
}