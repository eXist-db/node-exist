const test = require('tape')
const { connect } = require('../../index')
const connectionOptions = require('../connection')
const asGuest = Object.assign({},
  connectionOptions,
  { basic_auth: { user: 'guest', pass: 'guest' } }
)

test('list users', function (t) {
  const db = connect(connectionOptions)
  db.users.list()
    .then(function (list) {
      t.plan(7)
      t.ok(list.length, 'Returns a non-empty list of users')

      const names = list.map(u => u.name)
      t.true(names.includes('SYSTEM'), 'found user SYSTEM')
      t.true(names.includes('admin'), 'found user admin')
      t.true(names.includes('nobody'), 'found user nobody')
      t.true(names.includes('guest'), 'found user guest')
      t.true(names.includes('monex'), 'found user monex')
      t.true(names.includes('eXide'), 'found user eXide')
      // exist 4.7.1 does not have this user
      // t.true(names.includes('packageservice'), 'found user packageservice')
      t.end()
    })
    .catch(function (e) {
      t.fail()
      t.end()
    })
})

test('list users as guest', function (t) {
  const db = connect(asGuest)
  db.users.list()
    .then(function (list) {
      t.ok(list.length, 'Returns a non-empty list of users')
      t.end()
    })
    .catch(function (e) {
      t.fail(e)
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
