function byName (client, userName) {
  return client.promisedMethodCall('getUser', [ userName ])
}

function list (client) {
  return client.promisedMethodCall('getUsers', [])
}

module.exports = {
  getUserInfo: byName,
  list: list
}
