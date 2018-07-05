function promisify (client) {
  return function promisedCall (methodName, argsArray) {
    return new Promise(function promiseHandler (resolve, reject) {
      function methodCallback (error, result) {
        if (error) {
          // console.trace('methodCallback:error', error)
          return reject(error)
        }
        // console.trace('methodCallback:result', result)
        resolve(result)
      }
      // console.trace('methodCallback:method', methodName)
      // console.trace('methodCallback:argument', argsArray)
      client.methodCall(methodName, argsArray, methodCallback)
    })
  }
}

module.exports = promisify
