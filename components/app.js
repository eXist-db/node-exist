const queries = require('./queries')
const documents = require('./documents')

function upload (client, xarBuffer, targetXarPath) {
  return documents.upload(client, xarBuffer)
    .then(function (fh) {
      console.info('got handle:' + fh)
      return documents.parseLocal(client, fh, targetXarPath, {})
    })
    .then(function (results) {
      console.info(targetXarPath, 'deployed')
      return results
    })
    .catch(function (e) {
      return false
    })
}

function install (client, uploadedXarPath) {
  const installQueryString = 'repo:install-and-deploy-from-db($path)'
  const queryOptions = { variables: { path: uploadedXarPath } }

  return queries.readAll(client, installQueryString, queryOptions)
    .then(function (result) {
      return result.pages.toString()
    })
    .catch(function () {
      return false
    })
}

function deploy (client, uri) {
  const installQueryString = 'repo:deploy($app)'
  const queryOptions = { variables: { app: uri } }

  return queries.readAll(client, installQueryString, queryOptions)
    .then(function (result) {
      return result.pages.toString()
    })
    .catch(function () {
      return false
    })
}

function remove (client, appIdentifier) {
  const removeQueryString = '(repo:undeploy($app), repo:remove($app))'
  const queryOptions = { variables: { app: appIdentifier } }

  return queries.readAll(client, removeQueryString, queryOptions)
    .then(function (result) {
      return result.pages.toString()
    })
    .catch(function () {
      return false
    })
}

module.exports = {
  install: install,
  upload: upload,
  remove: remove,
  deploy: deploy
}
