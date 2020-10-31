const queries = require('./queries')
const documents = require('./documents')

function upload (client, xarBuffer, xarName) {
  return documents.upload(client, xarBuffer)
    .then(fh => documents.parseLocal(client, fh, `/db/system/repo/${xarName}`, {}))
    .then(results => results)
    .catch(e => e)
}

function install (client, xarName) {
  const installQueryString = 'repo:install-and-deploy-from-db("/db/system/repo/" || $xarName)'
  const queryOptions = { variables: { xarName } }

  return queries.readAll(client, installQueryString, queryOptions)
    .then(result => result.pages.toString())
    .catch(e => e)
}

function deploy (client, uri) {
  const installQueryString = 'repo:deploy($uri)'
  const queryOptions = { variables: { uri } }

  return queries.readAll(client, installQueryString, queryOptions)
    .then(result => result.pages.toString())
    .catch(e => e)
}

function remove (client, uri) {
  const removeQueryString = '(repo:undeploy($uri), repo:remove($uri))'
  const queryOptions = { variables: { uri } }

  return queries.readAll(client, removeQueryString, queryOptions)
    .then(result => result.pages.toString())
    .catch(e => e)
}

module.exports = {
  install: install,
  upload: upload,
  remove: remove,
  deploy: deploy
}
