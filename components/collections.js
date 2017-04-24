// createCollection
function create (client, name) {
  return client.promisedMethodCall('createCollection', [ name ])
}

// removeCollection
function remove (client, name) {
  return client.promisedMethodCall('removeCollection', [ name ])
}

// describeCollection
function describe (client, name) {
  return client.promisedMethodCall('describeCollection', [ name ])
}

// getCollectionDesc
function read (client, name) {
  return client.promisedMethodCall('getCollectionDesc', [ name ])
}

module.exports = {
  create: create,
  remove: remove,
  describe: describe,
  read: read
}
