class SyncHook {
  constructor() {
    this.tasks = []
  }

  tap(name, task) {
    this.tasks.push(task)
  }

  call(...args) {
    this.tasks.forEach(task => {
      task(...args)
    })
  }
}

class Test {
  constructor() {
    this.hooks = {
      arch: new SyncHook()
    }
  }

  tap() {
    this.hooks.arch.tap('1', (data) => {
      console.log('1', data)
    })
    this.hooks.arch.tap('2', (data) => {
      console.log('2', data)
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
