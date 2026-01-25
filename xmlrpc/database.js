/**
 * @typedef {import('../xmlrpc-client.js').XmlRpcClient} XmlRpcClient
 */

/**
 * Call the sync method to write all in-memory data to disk
 * @param {XmlRpcClient} client XML-RPC client instance
 * @returns {Promise<boolean>} true when sync was successful
 */
function syncDbToDisk (client) {
  return client.methodCall('sync', [])
}

/**
 * Shutdown the database
 * @param {XmlRpcClient} client XML-RPC client instance
 * @returns {Promise<boolean>} true when sync was successful
 */
function shutdownDb (client) {
  return client.methodCall('shutdown', [])
}

/**
 * Get the database version
 * @param {XmlRpcClient} client XML-RPC client instance
 * @returns {Promise<string>} the database version
 */
function version (client) {
  return client.methodCall('getVersion', [])
}

export {
  shutdownDb as shutdown,
  syncDbToDisk as syncToDisk,
  version
}
