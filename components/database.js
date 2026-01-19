function syncDbToDisk (client) {
  return client.promisedMethodCall('sync', [])
}

function shutdownDb (client) {
  return client.promisedMethodCall('shutdown', [])
}

function version (client) {
  return client.promisedMethodCall('getVersion', [])
}

export {
  shutdownDb as shutdown,
  syncDbToDisk as syncToDisk,
  version
}
