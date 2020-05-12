class Compile {
  constructor(vm, el) {
    this.vm = vm
    this.el = document.querySelector(el)
    this.fragment = null
    this.init()
  }

  init() {
    if (this.el) {
      this.fragment = this.nodeToFragment(this.el)
      this.compileElement(this.fragment)
      this.el.appendChild(this.fragment)
    } else {
      alert('#app元素不存在!')
    }
  }

  nodeToFragment(el) {
    const fragment = document.createDocumentFragment()
    let child = el.firstChild
    while(child) {
      fragment.appendChild(child)
      child = el.firstChild
    }
    return fragment
  }

  compileElement(el) {
    const childNodes = el.childNodes
    const reg = /\{\{(.*)\}\}/
    Array.prototype.slice.call(childNodes).forEach(node => {
      const text = node.textContent

      if (this.isElementNode(node)) {
        this.compile(node)
      } else if (this.isTextNode(node) && reg.test(text)) { // 判断是否是符合大胡子表达式 {{}}
        this.compileText(node, reg.exec(text)[1])
      }
  
      if (node.childNodes && node.childNodes.length) {
        this.compileElement(node)
      }
    })
  }

  compile(node) {
    const nodeAttrs = node.attributes
    Array.prototype.forEach.call(nodeAttrs, (attr) => {
        const attrName = attr.name
        if (this.isDirective(attrName)) {
            const exp = attr.value
            const dir = attrName.substring(2)
            if (this.isEventDirective(dir)) {  // 事件指令
              this.compileEvent(node, this.vm, exp, dir)
            } else {  // v-model 指令
              this.compileModel(node, this.vm, exp)
            }
            node.removeAttribute(attrName)
        }
    })
  }

  compileText(node, exp) {
    const initText = this.vm[exp]
    this.updateText(node, initText) // 初始化 {{}} 中的数据
    new Watcher(this.vm, exp, value => { // 给这个属性绑定 watcher 实例
      this.updateText(node, value)
    })
  }

  compileEvent(node, vm, exp, dir) {
    const eventType = dir.split(':')[1]
    const cb = vm.methods && vm.methods[exp]

    if (eventType && cb) {
      node.addEventListener(eventType, cb.bind(vm), false)
    }
  }

  compileModel (node, vm, exp) {
    let value = vm[exp]
    this.modelUpdater(node, value)
    new Watcher(vm, exp, (value) => {
      this.modelUpdater(node, value)
    })

    node.addEventListener('input', (e) => {
      const newValue = e.target.value
      if (value === newValue) return
      this.vm[exp] = newValue
      value = newValue
    })
  }

  updateText(node, value) {
    node.textContent = typeof value === 'undefined' ? '' : value
  }

  modelUpdater(node, value) {
    node.value = typeof value === 'undefined' ? '' : value
  }

  isDirective(attr) {
    return attr.indexOf('v-') === 0
  }

  isEventDirective(dir) {
    return dir.indexOf('on:') === 0
  }

  isElementNode (node) {
    return node.nodeType === 1
  }

  isTextNode(node) {
    return node.nodeType === 3
  }
}
