function syncDbToDisk (client) {
  return new Promise(function (resolve, reject) {
    client.methodCall('sync', [], function (error, result) {
      if (error) { return reject(error) }
      resolve(result)
    })
  })
}

function shutdownDb (client) {
  return new Promise(function (resolve, reject) {
    client.methodCall('shutdown', [], function (error, result) {
      if (error) { return reject(error) }
      resolve(result)
    })
  })
}

module.exports = {
  shutdown: shutdownDb,
  syncToDisk: syncDbToDisk
}
