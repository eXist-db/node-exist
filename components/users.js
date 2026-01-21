function getUserInfo (client, userName) {
  return client.methodCall('getAccount', [userName])
}

function list (client) {
  return client.methodCall('getAccounts', [])
}

export {
  getUserInfo,
  list
}
