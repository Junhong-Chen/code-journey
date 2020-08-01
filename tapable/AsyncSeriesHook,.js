class AsyncSeriesHook {
  constructor() {
    this.fns = []
  }

  tapAsync(name, fn) {
    this.fns.push(fn)
  }

  callAsync(...args) {
    const finalCallBack = args.pop(), length = this.fns.length
    let index = 0
    const next = () => {
      if (index === length) return finalCallBack()
      this.fns[index++](...args, next)
    }
    next()
  }

  tapPromise(name, fn) {
    this.fns.push(fn)
  }

  promise(...args) {
    const [first, ...other] = this.fns
    return other.reduce((previous, current) => {
      return previous.then(() => current(...args))
    }, first(...args))
  }
}

class Test {
  constructor() {
    this.hooks = {
      arch: new AsyncSeriesHook()
    }
  }

  tapAsync() {
    this.hooks.arch.tapAsync('1', (data, cd) => {
      setTimeout(() => {
        console.log('1', data)
        cd()
      }, 1000)
    })
    this.hooks.arch.tapAsync('2', (data, cd) => {
      setTimeout(() => {
        console.log('2', data)
        cd()
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
          resolve()
        }, 1000)
      })
    })
    this.hooks.arch.tapPromise('2', (data) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log('2', data)
          resolve()
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
