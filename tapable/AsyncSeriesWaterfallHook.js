class AsyncSeriesWaterfallHook {
  constructor() {
    this.fns = []
  }

  tapAsync(name, fn) {
    this.fns.push(fn)
  }

  callAsync(...args) {
    const finalCallBack = args.pop(), length = this.fns.length
    let index = 0
    const next = (error, data) => {
      if (error || index === length) {
        finalCallBack()
      }
      if (index === 0) {
        this.fns[index++](...args, next)
      } else if (index < length) {
        this.fns[index++](data, next)
      }
    }
    next()
  }

  tapPromise(name, fn) {
    this.fns.push(fn)
  }

  promise(...args) {
    const [first, ...other] = this.fns
    return other.reduce((previous, current) => {
      return previous.then((data) => current(data))
    }, first(...args))
  }
}

class Test {
  constructor() {
    this.hooks = {
      arch: new AsyncSeriesWaterfallHook()
    }
  }

  tapAsync() {
    this.hooks.arch.tapAsync('1', (data, cd) => {
      setTimeout(() => {
        console.log('1', data)
        cd(null, '巴拉拉小魔仙~')
      }, 1000)
    })
    this.hooks.arch.tapAsync('2', (data, cd) => {
      setTimeout(() => {
        console.log('2', data)
        cd(null, '变！')
      }, 1000)
    })
    this.hooks.arch.tapAsync('3', (data, cd) => {
      setTimeout(() => {
        console.log('3', data)
        cd()
      }, 1000)
    })
  }

  start() {
    this.hooks.arch.callAsync('Junhong', function () {
      console.log('end')
    })
  }

  tapPromise() {
    this.hooks.arch.tapPromise('1', (data) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log('1', data)
          resolve('巴拉拉小魔仙~')
        }, 1000)
      })
    })
    this.hooks.arch.tapPromise('2', (data) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log('2', data)
          resolve('变！')
        }, 2000)
      })
    })
    this.hooks.arch.tapPromise('3', (data) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log('3', data)
          resolve()
        }, 3000)
      })
    })
  }

  startPromise() {
    this.hooks.arch.promise('Junhong').then(function () {
      console.log('end')
    })
  }
}

const test = new Test()

// test.tapAsync()
// test.start()

test.tapPromise()
test.startPromise()
