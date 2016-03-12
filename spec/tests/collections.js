var test = require('tape')
var exist = require('../../index')
var connectionOptions = require('../db-connection')

test('get collection info', function (t) {
  var db = exist.connect(connectionOptions)
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
  var db = exist.connect(connectionOptions)
  db.collections.describe('/foo')
    .then(function (r) {
      t.fail(r, 'no error')
      t.end()
    })
    .catch(function (e) {
      t.ok(e.faultString.match(/\/foo not found!$/), 'not found error')
      t.end()
    })
})

test('create collection', function (t) {
  var db = exist.connect(connectionOptions)
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
  var db = exist.connect(connectionOptions)
  var testCollection = '/remove-collection'
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
