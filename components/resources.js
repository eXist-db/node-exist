function describe (client, resourceIdentifier) {
  return client.promisedMethodCall('describeResource', [resourceIdentifier])
}

function setPermissions (client, resourceIdentifier, permission) {
  return client.promisedMethodCall('setPermissions', [resourceIdentifier, permission])
}

function getPermissions (client, resourceIdentifier) {
  return client.promisedMethodCall('getPermissions', [resourceIdentifier])
}

module.exports = {
  describe: describe,
  setPermissions: setPermissions,
  getPermissions: getPermissions
}
