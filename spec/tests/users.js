var test = require('tape')
var exist = require('../../index')
var connectionOptions = require('../db-connection')

test.skip('list users', function (t) {
  var db = exist.connect(connectionOptions)
  db.users.list()
    .then(function (r) {
      console.log(r)
      t.end()
    })
    .catch(function (e) {
      console.error(e)
      t.end()
    })
})

test.skip('get user info', function (t) {
  var db = exist.connect(connectionOptions)
  db.users.byName('admin')
    .then(function (info) {
      console.log(info)
      t.end()
    })
    .catch(function (e) {
      console.error(e)
      t.end()
    })
})
