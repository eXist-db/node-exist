const test = require('tape')
const exist = require('../../index')
const connectionOptions = require('../db-connection')

test('get collection info', function (t) {
  const db = exist.connect(connectionOptions)
  db.collections.describe('/db')
    .then(function (info) {
      t.equal(info.owner, 'SYSTEM')
      t.end()
    })
    .catch(function (e) {
      t.fail(e)
      t.end()
    })
})

test('get info for non existent collection', function (t) {
  const db = exist.connect(connectionOptions)
  db.collections.describe('/foo')
    .then(function (r) {
      t.fail(r, 'no error')
      t.end()
    })
    .catch(function (e) {
      if (!e.faultString) {
        t.fail(e, 'no faultString, something else must have gone wrong')
        t.end()
        return
      }
      t.ok(e.faultString.match(/\/foo not found!$/), 'not found error')
      t.end()
    })
})

test('create collection', function (t) {
  const db = exist.connect(connectionOptions)
  db.collections.create('new-test-collection')
    .then(function (r) {
      console.log(r, 'create')
      t.ok(r, 'created')
      t.end()
    })
    .catch(function (e) {
      t.fail(e, 'creation error')
      t.end()
    })
})

test('remove collection', function (t) {
  const db = exist.connect(connectionOptions)
  const testCollection = '/remove-collection'
  db.collections.create(testCollection)
    .then(function () {
      return db.collections.remove(testCollection)
    })
    .then(function (success) {
      t.ok(success, 'removed')
      t.end()
    })
    .catch(function (e) {
      t.fail(e, 'remove failed')
      t.end()
    })
})
