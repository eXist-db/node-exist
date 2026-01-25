/**
 *  @typedef { import("./xmlrpc-client.js").XmlRpcClient } XmlRpcClient
 */

/**
 * createCollection
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {string} name collection name
 * @returns {Promise<boolean>} true when collection was created
 */
function create (client, name) {
  return client.methodCall('createCollection', [name])
}

/**
 * removeCollection
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {string} name collection name
 * @returns {Promise<boolean>} true when collection was removed
 */
function remove (client, name) {
  return client.methodCall('removeCollection', [name])
}

/**
 * describeCollection
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {string} name collection name
 * @returns {Promise<Object>} collection information
 */
function describe (client, name) {
  return client.methodCall('describeCollection', [name])
}

/**
 * getCollectionDesc
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {string} name collection name
 * @returns {Promise<Object>} collection description
 */
function read (client, name) {
  return client.methodCall('getCollectionDesc', [name])
}

/**
 * Does the collection exist
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {string} name collection name
 * @returns {Promise<boolean>} true when the collection exists
 */
function exists (client, name) {
  return client.methodCall('hasCollection', [name])
}

/**
 * convenience function
 * throws an exception if and only if
 * the collection exists but cannot be written by the user
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {string} name collection name
 * @returns {Promise<boolean>} true when collection exists and can be opened, false when it does not exist
 * @throws {Error} when collection exists but cannot be opened by the user
 */
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
