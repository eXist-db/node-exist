const s = require('superagent')

const defaults = {
  collections: '',
  host: 'localhost',
  port: '8080',
  path: '/exist/rest',
  basic_auth: {
    user: 'guest',
    pass: 'guest'
  }
}

function connection (options) {
  const protocol = options.protocol ? options.protocol : 'http'
  const port = options.port ? ':' + options.port : ''
  const path = options.path.startsWith('/') ? options.path : '/' + options.path
  const prefix = `${protocol}://${options.host}${port}${path}`
  return (request) => {
    request.url = prefix + request.url
    request.auth(options.basic_auth.user, options.basic_auth.pass)
    return request
  }
}

// The complete list of methods that the agent can use to set defaults is:
// use, on, once, set, query, type, accept, auth, withCredentials,
// sortQuery, retry, ok, redirects, timeout, buffer, serialize, parse, ca, key, pfx, cert.
function connect (options) {
  const agent = s.agent().use(
    connection(
      Object.assign({}, defaults, options)))

  return agent
}

module.exports = connect
