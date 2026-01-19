/**
 * @typedef { import("xmlrpc").Client } XMLRPCClient
 */

/**
 * @typedef {Object} NormalizedQueryResult
 * @prop {boolean} success true, if operation succeeded
 * @prop {Object} [result] detailed information, if the operation succeeded
 * @prop {Error | {code:string, value:string}} [error] detailed information, if the operation failed
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as queries from './queries.js'
import * as documents from './documents.js'
import * as collections from './collections.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const xqueryPath = path.resolve(__dirname, '../xquery/')
const installQueryString = fs.readFileSync(path.join(xqueryPath, 'install-package.xq'))
const removeQueryString = fs.readFileSync(path.join(xqueryPath, 'remove-package.xq'))
const defaultPackageRepo = 'https://exist-db.org/exist/apps/public-repo'
const packageCollection = '/db/pkgtmp'

/**
 * Upload XAR package to an existdb instance
 *
 * @param {XMLRPCClient} client db connection
 * @param {Buffer} xarBuffer XAR package contents (binary zip)
 * @param {String} xarName the filename that will be stored in ${app.packageCollection}
 * @returns {NormalizedQueryResult} the result of the action
 */
function upload (client, xarBuffer, xarName) {
  return collections.existsAndCanOpen(client, packageCollection)
    .then(exists => {
      if (exists) {
        return Promise.resolve()
      }
      return collections.create(client, packageCollection)
    })
    .then(_ => documents.upload(client, xarBuffer))
    .then(fh => documents.parseLocal(client, fh, `${packageCollection}/${xarName}`, {}))
    .then(success => { return { success } })
    .catch(error => { return { success: false, error } })
}

/**
 * Install and deploy a XAR that was uploaded to the database instance
 * A previously installed version will be removed
 *
 * @param {XMLRPCClient} client db connection
 * @param {String} xarName the name of a XAR file, must be present in ${packageCollection}
 * @param {String} [customPackageRepoUrl] a different repository to resolve package dependencies
 * @returns {NormalizedQueryResult} the result of the action
 */
function install (client, xarName, customPackageRepoUrl) {
  const publicRepoURL = customPackageRepoUrl || defaultPackageRepo
  const queryOptions = { variables: { xarPath: `${packageCollection}/${xarName}`, publicRepoURL } }

  return queries.readAll(client, installQueryString, queryOptions)
    .then(result => JSON.parse(result.pages.toString()))
    .then(result => {
      if (!result.success) {
        const errorMessage = result.error.code + ' ' + (result.error.description || result.error.value)
        return {
          success: false,
          error: new Error(errorMessage)
        }
      }
      return result
    })
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

export {
  install,
  upload,
  remove,
  deploy,
  packageCollection
}
