/**
 * @typedef { import("xmlrpc").Client } XMLRPCClient
 */

/**
 * @typedef {Object} NormalizedQueryResult
 * @prop {boolean} success
 * @prop {Object} [result] detailed information, if the operation succeeded
 * @prop {Error | {code:string, value:string}} [error] detailed information, if the operation failed
 */

const fs = require('fs')
const queries = require('./queries')
const documents = require('./documents')
const installQueryString = fs.readFileSync('xquery/install-package.xq')
const removeQueryString = fs.readFileSync('xquery/remove-package.xq')
const defaultPackageRepo = 'http://exist-db.org/exist/apps/public-repo'

/**
 * Upload XAR package to an existdb instance
 *
 * @param {XMLRPCClient} client db connection
 * @param {Buffer} xarBuffer XAR package contents (binary zip)
 * @param {String} xarName the filename that will be stored in /db/system/repo
 * @returns {NormalizedQueryResult} the result of the action
 */
function upload (client, xarBuffer, xarName) {
  return documents.upload(client, xarBuffer)
    .then(fh => documents.parseLocal(client, fh, `/db/system/repo/${xarName}`, {}))
    .then(success => { return { success } })
    .catch(error => { return { success: false, error } })
}

/**
 * Install and deploy a XAR that was uploaded to the database instance
 * A previously installed version will be removed
 *
 * @param {XMLRPCClient} client db connection
 * @param {String} xarName the name of a XAR file, must be present in /db/system/repo
 * @param {String} packageUri unique package descriptor
 * @param {String} [customPackageRepoUrl] a different repository to resolve package dependencies
 * @returns {NormalizedQueryResult} the result of the action
 */
function install (client, xarName, packageUri, customPackageRepoUrl) {
  const publicRepoURL = customPackageRepoUrl || defaultPackageRepo
  const queryOptions = { variables: { xarName, packageUri, publicRepoURL } }

  return queries.readAll(client, installQueryString, queryOptions)
    .then(result => JSON.parse(result.pages.toString()))
    .catch(error => { return { success: false, error } })
}

/**
 * experimental: only deploy an application that is already installed
 *
 * @param {XMLRPCClient} client db connection
 * @param {String} packageUri unique package descriptor
 * @returns {NormalizedQueryResult | Object} the result of the action
 */
function deploy (client, packageUri) {
  const installQueryString = 'repo:deploy($packageUri)'
  const queryOptions = { variables: { packageUri } }

  return queries.readAll(client, installQueryString, queryOptions)
    .then(result => result.pages.toString())
    .catch(error => { return { success: false, error } })
}

/**
 * Remove an installed application
 * will report success if the application was not found
 *
 * @param {XMLRPCClient} client db connection
 * @param {String} packageUri unique package descriptor
 * @returns {NormalizedQueryResult} the result of the action
 */
function remove (client, packageUri) {
  const queryOptions = { variables: { packageUri } }
  return queries.readAll(client, removeQueryString, queryOptions)
    .then(result => JSON.parse(result.pages.toString()))
    .catch(error => { return { success: false, error } })
}

module.exports = {
  install: install,
  upload: upload,
  remove: remove,
  deploy: deploy
}
