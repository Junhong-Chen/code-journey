const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class Promise {
  constructor(fn) {
    if (!isFunction(fn)) {
      throw new TypeError('constructor argument have to be a function')
    }
    this.status = PENDING // 这里没有使用静态属性，因为静态属性是 es2016 的规范
    // 当 resolve() 在异步中执行时，会在 .then 之后调用，这时 status 状态为 pending，也就导致 .then 中的函数无法执行（状态不为 pending 才执行）。
    // 所以需要一个数组依次将 .then 中的函数存储起来，当执行到 resolve() 时再依次执行它们。
    this.fulfilledFns = []
    this.rejectedFns = []
    const resolve = this.onFulfilled.bind(this) // 绑定 this 到当前的类，否则 this 是默认绑定，为 undefined(strict)
    const reject = this.onRejected.bind(this)
    try { // 执行出错执行 reject
      fn(resolve, reject)
    } catch (e) {
      console.log(e)
      reject(e)
    }
  }

  onFulfilled(value) {
    if (this.status !== PENDING) { // 由于状态是不可逆的，所以必须先判断当前状态是否合法
      return
      // throw new Error('onRejected was called multiple times')
    } else {
      this.value = value
    }
    this.status = FULFILLED
    setTimeout(() => { // 在 promise 中的主体代码异步执行后（意味着 fulfilledFns 列表不为空），在执行 resolve 或 reject 时也需要异步执行
      this.fulfilledFns.forEach(fn => {
        fn(this.value)
      })
    }, null)
  }

  onRejected(error) {
    if (this.status !== PENDING) { // 由于状态是不可逆的，所以必须先判断当前状态是否合法
      return
      // throw new Error('onRejected was called multiple times')
    } else {
      this.error = error
    }
    this.status = REJECTED
    setTimeout(() => {
      this.rejectedFns.forEach(fn => {
        fn(this.error)
      })
    }, null)
  }

  then(onFulfilled, onRejected) {
    const that = this
    const _promise = new Promise((resolve, reject) => { // “箭头函数” 的 this，总是指向定义时所在的对象，而不是运行时所在的对象(注: 只有函数运行后，箭头函数才会按照定义生成)。也可以简单理解为 ——> 总是指向所在函数运行时的 this。
      // console.log(this === that) // this 指向上一个 promise。因为这里的 then() 是被上一个 promise 调用的，而当前 Promise 中的 fn(箭头函数) 的 this 指向 then，
      // then 被上一个 Promise 调用，所以会隐式地绑定到上一个 Promise 上，所以 this 指向上一个 promise。
      switch (this.status) {
        case PENDING:
          this.fulfilledFns.push(realFulfilled)
          this.rejectedFns.push(realRejected)
          break

        case FULFILLED:
          setTimeout(realFulfilled, null, this.value) // then方法是异步回调，所以放在 setTimeout 里。
          break

        case REJECTED:
          setTimeout(realRejected, null, this.error)
          break
      }

      function realFulfilled(value) {
        if (!isFunction(onFulfilled)) {
          return resolve(value) // then() 穿透
        }
        that.hookNext(_promise, onFulfilled(value), resolve, reject)
      }

      function realRejected(error) {
        if (!isFunction(onRejected)) {
          return reject(error)
        }
        that.hookNext(_promise, onRejected(error), resolve, reject)
      }

    })
    return _promise
  }

  hookNext(p, r, resolve, reject) {
    if (p === r) { // 不允许 then 中的 onFulfilled 返回自身的 promise
      throw new TypeError('Chaining cycle detected for promise')
    }
    try {
      // 这里简单的假设 r 是一个promise，如果只是个有 then 方法的对象，还要做特殊处理，但其传值原理一样
      // const then = r.then
      // new Promise(then.bind(r)).then(resolve, reject)
      if (isThenable(r)) {
        // 这里的r是一个已经 resolve()/reject() 的内部 promise
        // 这句话的含义是把外部 promise 的 resolve/reject 传进去，在其在内部 promise.then 函数中执行，并将内部 promise 的 value 作为参数赋值给外部 promise 的 resolve/reject
        // 总感觉写得不是很清晰，但这个是处理 then 中返回 promise 后取其值的关键
        r.then(resolve, reject) // 让内部 promise 在 then 中去执行外部 promise 的 resolve/reject，并把 value/error 值传给外部 promise
      } else {
        // console.log('成功调用 then，现在我要调用新 promise 中的 resolve() 了')
        resolve(r) // 注意，上一个 promise 的处理结果不影响当前 promise 的状态，当前 promise 默认状态为成功
      }
    } catch (e) { // 发生错误则抛给 reject 处理
      reject(e)
    }
  }

  static resolve(value) {
    return new Promise((resolve, reject) => {
      if (isThenable(value)) { // 如果返回的是一个 promise
        value.then(resolve, reject)
      } else {
        resolve(value)
      }
    })
  }

  static reject(reason) {
    return new Promise((resolve, reject) => {
      reject(reason)
    })
  }

  static all(promises) {
    return new Promise((resolve, reject) => {
      const values = []
      promises.forEach(promise => {
        promise.then(value => {
          values.push(value)
          if (values.length === promises.length) {
            resolve(values)
          }
        }, reason => {
          reject(reason)
        })
      })
    })
  }

  static race(promises) {
    return new Promise((resolve, reject) => {
      promises.forEach(promise => {
        promise.then(value => {
          resolve(value)
        }, reason => {
          reject(reason)
        })
      })
    })
  }
}

function isThenable(obj) {
  return obj && isFunction(obj.then)
}

function isFunction(obj) {
  return typeof obj === 'function'
}

module.exports = Promise
