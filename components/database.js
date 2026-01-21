function syncDbToDisk (client) {
  return client.methodCall('sync', [])
}

function shutdownDb (client) {
  return client.methodCall('shutdown', [])
}

function version (client) {
  return client.methodCall('getVersion', [])
}

export {
  shutdownDb as shutdown,
  syncDbToDisk as syncToDisk,
  version
}
