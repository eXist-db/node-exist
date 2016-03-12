// createCollection
function create (client, name) {
  return new Promise(function (resolve, reject) {
    client.methodCall('createCollection', [ name ], function (error, result) {
      if (error) { return reject(error) }
      resolve(result)
    })
  })
}

// removeCollection
function remove (client, name) {
  return new Promise(function (resolve, reject) {
    client.methodCall('removeCollection', [ name ], function (error, result) {
      if (error) { return reject(error) }
      resolve(result)
    })
  })
}

// describeCollection
function describe (client, name) {
  return new Promise(function (resolve, reject) {
    client.methodCall('describeCollection', [ name ], function (error, result) {
      if (error) { return reject(error) }
      resolve(result)
    })
  })
}

// getCollectionDesc
function read (client, name) {
  return new Promise(function (resolve, reject) {
    client.methodCall('getCollectionDesc', [ name ], function (error, result) {
      if (error) { return reject(error) }
      resolve(result)
    })
  })
}

module.exports = {
  create: create,
  remove: remove,
  describe: describe,
  read: read
}
