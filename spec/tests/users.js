const test = require('tape')
const { connect } = require('../../index')
const connectionOptions = require('../connection')

test.skip('list users', function (t) {
  const db = connect(connectionOptions)
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

test('get user info for admin', function (t) {
  const db = connect(connectionOptions)
  db.users.getUserInfo('admin')
    .then(function (info) {
      t.ok(info)
      t.end()
    })
    .catch(function (e) {
      t.fail()
      t.end()
    })
})

test('get user info for guest', function (t) {
  const db = connect(connectionOptions)
  db.users.getUserInfo('guest')
    .then(function (info) {
      t.ok(info)
      t.end()
    })
    .catch(function (e) {
      t.fail()
      t.end()
    })
})

test('get user info for non-existent user', function (t) {
  const db = connect(connectionOptions)
  db.users.getUserInfo('thisuserschouldnotexist')
    .then(function (info) {
      t.fail()
      t.end()
    })
    .catch(function (e) {
      t.ok(e)
      t.end()
    })
})
