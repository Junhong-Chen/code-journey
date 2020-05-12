class Dep {
  constructor() {
    this.subs = []
  }
  addSub(sub) {
    this.subs.push(sub)
  }
  notify() {
    this.subs.forEach(sub => {
      sub.update() 
    })
  }
}

function observer(data) {
  if (!data || typeof data !== 'object') return
  Object.keys(data).forEach(key => {
    defineReactive(data, key, data[key])
  })
}

function defineReactive(data, key, value) {
  observer(value)
  const dep = new Dep() // 注意每个属性都有自己单独的 dep 实例
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get: function() {
      if (Dep.target) {
        dep.addSub(Dep.target)
      }
      return value
    },
    set: function(newValue) {
      if (value !== newValue) {
        value = newValue
        console.log(`${key}值改为了${newValue}`)
        dep.notify()
      }
    }
  })
}
