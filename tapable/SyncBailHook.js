class SyncBailHook {
  constructor() {
    this.tasks = []
  }

  tap(name, task) {
    this.tasks.push(task)
  }

  call(...args) {
    let result, index = 0, length = this.tasks.length
    do {
      result = this.tasks[index++](...args)
    } while (result === undefined && index < length)
  }
}

class Test {
  constructor() {
    this.hooks = {
      arch: new SyncBailHook()
    }
  }

  tap() {
    this.hooks.arch.tap('1', (data) => {
      console.log('1', data)
    })
    this.hooks.arch.tap('2', (data) => {
      console.log('2', data)
      return true
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