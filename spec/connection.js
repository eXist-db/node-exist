/**
 * Gather connection options suitable for automated and manual testing
 * of an off-the-shelf exist-db instance (e.g. in a CI environment)
 * Allows overriding specific setting via environment variables.
 *
 * EXISTDB_SERVER - URL to the exist-db you want to connect to
 * EXISTDB_USER - username of the user the queries should be executed with
 *     defaults to "admin"
 * EXISTDB_PASS - password to authenticate EXISTDB_USER
 *     must be set for EXISTDB_USER to take effect
 */

/**
 * @type {import('../components/connection').NodeExistConnectionOptions}
 */
const { readOptionsFromEnv } = require('../index')
const envOptions = readOptionsFromEnv()
// test with admin user by default
if (!envOptions.basic_auth) {
  envOptions.basic_auth = { user: 'admin', pass: '' }
}
// console.log(envOptions)
module.exports = envOptions
