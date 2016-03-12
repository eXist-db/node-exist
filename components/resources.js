function describe (client, resourceIdentifier) {
  return new Promise(function (resolve, reject) {
    client.methodCall('describeResource', [resourceIdentifier], function (error, resourceInfo) {
      if (error) { return reject(error) }
      resolve(resourceInfo)
    })
  })
}

function setPermissions (client, resourceIdentifier, permission) {
  return new Promise(function (resolve, reject) {
    client.methodCall('setPermissions', [resourceIdentifier, permission], function (error, result) {
      if (error) { return reject(error) }
      resolve(result)
    })
  })
}

function getPermissions (client, resourceIdentifier) {
  return new Promise(function (resolve, reject) {
    client.methodCall('getPermissions', [resourceIdentifier], function (error, permissions) {
      if (error) { return reject(error) }
      resolve(permissions)
    })
  })
}

module.exports = {
  describe: describe,
  setPermissions: setPermissions,
  getPermissions: getPermissions
}
