/**
 * @typedef {import('./xmlrpc-client.js').XmlRpcClient} XmlRpcClient
 */

/**
 * Get information about a user account
 * @param {XmlRpcClient} client XML-RPC client instance
 * @param {string} userName the user name
 * @returns {Promise<Object>} user information
 */
function getUserInfo (client, userName) {
  return client.methodCall('getAccount', [userName])
}

/**
 * list users
 * @param {XmlRpcClient} client XML-RPC client instance
 * @returns {Promise<Array>} array of user names
 */
function list (client) {
  return client.methodCall('getAccounts')
}

export {
  getUserInfo,
  list
}
