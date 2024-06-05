class Watcher {
  constructor(vm, exp, cd) {
    this.vm = vm
    this.exp = exp
    this.cd = cd
    this.value = this.get() // 既初始化了 Watcher 实例的值，也把它添加到了 subs 列表里
  }

  update() {
    this.run()
  }

  run() {
    let value = this.vm.data[this.exp]
    let oldValue = this.value
    if (value !== oldValue) {
      this.value = value
      this.cd.call(this.vm, value, oldValue)
    }
  }

  get() {
    Dep.target = this
    const value = this.vm.data[this.exp] // 如果属性不是在 data 的下面呢？
    Dep.target = null
    return value
  }
}
