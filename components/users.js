function byName (client, userName) {
  return new Promise(function (resolve, reject) {
    client.methodCall('getUser', [ userName ], function (error, info) {
      if (error) { return reject(error) }
      resolve(info)
    })
  })
}

function list (client) {
  return new Promise(function (resolve, reject) {
    client.methodCall('getUsers', [], function (error, info) {
      if (error) { return reject(error) }
      resolve(info)
    })
  })
}

module.exports = {
  getUserInfo: byName,
  list: list
}
