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

test.skip('get user info', function (t) {
  const db = connect(connectionOptions)
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
