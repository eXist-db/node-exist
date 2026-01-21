// createCollection
function create (client, name) {
  return client.methodCall('createCollection', [name])
}

// removeCollection
function remove (client, name) {
  return client.methodCall('removeCollection', [name])
}

// describeCollection
function describe (client, name) {
  return client.methodCall('describeCollection', [name])
}

// getCollectionDesc
function read (client, name) {
  return client.methodCall('getCollectionDesc', [name])
}

// collection exists?
function exists (client, name) {
  return client.methodCall('hasCollection', [name])
}

// convenience function
// throws an exception if and only if
// the collection exists but cannot be written by the user
function existsAndCanOpen (client, name) {
  return client.methodCall('existsAndCanOpenCollection', [name])
}

export {
  create,
  remove,
  describe,
  read,
  exists,
  existsAndCanOpen
}
