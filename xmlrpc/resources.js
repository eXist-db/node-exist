/**
 * @typedef { import("./xmlrpc-client.js").XmlRpcClient } XmlRpcClient
 */

/**
 * @typedef {Object} ResourceInfo
 * @prop {string} name resource name or path
 * @prop {"BinaryRerource"|"XMLResource"} type Resource type (XML or binary)
 * @prop {string} owner DB user name
 * @prop {string} group DB group name
 * @prop {number} permissions as octet (e.g. 420)
 * @prop {number} content-length length as 32-bit integer
 * @prop {string} content-length-64bit length as BigInt string
 * @prop {string} mime-type mimetype
 * @prop {Date} created date the resource was created
 * @prop {Date} modified date when the resource was last modified
 * @prop {Array} acl Access Control List entries
 * @prop {Buffer} [digest] only set for BinaryResources
 * @prop {'BLAKE2B-256'|string} [digest-algorithm] only set for BinaryResources
 * @prop {Buffer} [blob-id] only set for BinaryResources
 */

/**
 * Gather information on a resource
 * throws when resource does not exist, path points to a collection
 *
 * @param {XmlRpcClient} client RPC client instance
 * @param {string} resourceIdentifier path to resource
 * @returns {Promise<ResourceInfo>} Resource information
 */
function describe (client, resourceIdentifier) {
  return client.methodCall('describeResource', [resourceIdentifier])
}

/**
 * Set the permissions for a resource or collection
 *
 * @param {XmlRpcClient} client RPC client instance
 * @param {string} resourceIdentifier path to resource
 * @param {number} permission octet number
 * @returns {Promise<boolean>} true if the action was succesful
 */
function setPermissions (client, resourceIdentifier, permission) {
  return client.methodCall('setPermissions', [resourceIdentifier, permission])
}

/**
 * Get the permissions for a resource or collection
 *
 * @param {XmlRpcClient} client RPC client instance
 * @param {string} resourceIdentifier path to resource
 * @returns {Promise<number>} permissions as octet number
 */
function getPermissions (client, resourceIdentifier) {
  return client.methodCall('getPermissions', [resourceIdentifier])
}

export {
  describe,
  setPermissions,
  getPermissions
}
