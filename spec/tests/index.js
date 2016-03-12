// tests

var test = require('tape')
var exist = require('../../index')
var connectionOptions = require('../db-connection')

test('check for default mime type extensions', function (t) {
  var types = exist.getMimeTypes()

  t.equal(types['xq'], 'application/xquery')
  t.equal(types['xql'], 'application/xquery')
  t.equal(types['xqm'], 'application/xquery')
  t.equal(types['xconf'], 'application/xml')
  t.end()
})

test('extend mime type definitions', function (t) {
  exist.defineMimeTypes({'text/foo': ['bar']})

  t.equal(exist.getMimeTypes()['bar'], 'text/foo')
  t.end()
})

test('create connection with default settings', function (t) {
  var db = exist.connect()
  var components = ['collections', 'queries', 'documents', 'users', 'indices']

  components.forEach(function (component) {
    t.ok(component in db, 'component ' + component + ' found')
  })
  t.end()
})

test('get collection permissions', function (t) {
  var db = exist.connect(connectionOptions)
  db.resources.getPermissions('/db')
    .then(function (result) {
      t.ok(result)
      t.end()
    })
    .catch(function (e) {
      t.fail(e)
      t.end()
    })
})

