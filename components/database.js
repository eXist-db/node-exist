function syncDbToDisk (client) {
  return client.promisedMethodCall('sync', [])
}

function shutdownDb (client) {
  return client.promisedMethodCall('shutdown', [])
}

module.exports = {
  shutdown: shutdownDb,
  syncToDisk: syncDbToDisk
}
