// createCollection
function create (client, name) {
  return client.promisedMethodCall('createCollection', [name])
}

// removeCollection
function remove (client, name) {
  return client.promisedMethodCall('removeCollection', [name])
}

// describeCollection
function describe (client, name) {
  return client.promisedMethodCall('describeCollection', [name])
}

// getCollectionDesc
function read (client, name) {
  return client.promisedMethodCall('getCollectionDesc', [name])
}

// collection exists?
function exists (client, name) {
  return client.promisedMethodCall('hasCollection', [name])
}

// convenience function
// throws an exception if and only if
// the collection exists but cannot be written by the user
function existsAndCanOpen (client, name) {
  return client.promisedMethodCall('existsAndCanOpenCollection', [name])
}

module.exports = {
  create,
  remove,
  describe,
  read,
  exists,
  existsAndCanOpen
}
