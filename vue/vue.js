class Vue {
  constructor(options) {
    this.data = options.data
    this.methods = options.methods // 因为访问 vue 的属性被代理成了 vue.data 所以这里要把 methods 设为 data 的属性

    Object.keys(this.data).forEach(key => {
      this.proxyKeys(key)
    })

    observer(this.data)
    new Compile(this, options.el)
    options.mounted.call(this)
  }

  proxyKeys(key) {
    Object.defineProperty(this, key, {
      enumerable: true,
      configurable: true,
      get: () => {
        return this.data[key]
      },
      set: value => {
        this.data[key] = value
      }
    })
  }
}
