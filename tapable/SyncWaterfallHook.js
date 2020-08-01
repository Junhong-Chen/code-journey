class SyncWaterfallHook {
  constructor() {
    this.fns = []
  }

  tap(name, task) {
    this.fns.push(task)
  }

  call(...args) {
    const [first, ...other] = this.fns
    const result = first(...args)

    other.reduce((previous, current) => {
      return current(previous)
    }, result)
  }
}

class Test {
  constructor() {
    this.hooks = {
      arch: new SyncWaterfallHook()
    }
  }

  tap() {
    this.hooks.arch.tap('1', (data) => {
      console.log('1', data)
      return '巴拉拉小魔仙~'
    })
    this.hooks.arch.tap('2', (data) => {
      console.log('2', data)
      return '变！'
    })
    this.hooks.arch.tap('3', (data) => {
      console.log('3', data)
    })
  }

  start() {
    this.hooks.arch.call('Junhong')
  }
}

const test = new Test()

test.tap()
test.start()
