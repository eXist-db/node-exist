// tests

const test = require('tape')
const exist = require('../../index')
const connectionOptions = require('../db-connection')

test('check for default mime type extensions', function (t) {
  t.equal(exist.getMimeType('test.xq'), 'application/xquery')
  t.equal(exist.getMimeType('test.xql'), 'application/xquery')
  t.equal(exist.getMimeType('test.xqm'), 'application/xquery')
  t.equal(exist.getMimeType('test.xconf'), 'application/xml')
  t.end()
})

test('extend mime type definitions', function (t) {
  const testPath = 'test.bar'
  const testExtension = 'bar'
  const testMimeType = 'text/x-test'
  const testTypeMap = {}
  testTypeMap[testMimeType] = [testExtension]

  t.notEqual(exist.getMimeType(testPath), testMimeType, 'previously undefined extension for ' + testExtension)
  exist.defineMimeTypes(testTypeMap)
  t.equal(exist.getMimeType(testPath), testMimeType, 'added new extension for ' + testExtension)
  t.end()
})

test('create connection with default settings', function (t) {
  const db = exist.connect()
  const components = ['collections', 'queries', 'documents', 'users', 'indices']

  components.forEach(function (component) {
    t.ok(component in db, 'component ' + component + ' found')
  })
  t.end()
})

test('get collection permissions', function (t) {
  const db = exist.connect(connectionOptions)
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
