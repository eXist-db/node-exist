function getUserInfo (client, userName) {
  return client.promisedMethodCall('getAccount', [userName])
}

function list (client) {
  return client.promisedMethodCall('getAccounts', [])
}

module.exports = {
  getUserInfo,
  list
}
