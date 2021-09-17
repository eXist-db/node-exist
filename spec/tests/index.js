// tests

const test = require('tape')
const { connect, getMimeType, defineMimeTypes } = require('../../index')
const connectionOptions = require('../connection')

test('check for default mime type extensions', function (t) {
  t.equal(getMimeType('test.xq'), 'application/xquery')
  t.equal(getMimeType('test.xqs'), 'application/xquery')
  t.equal(getMimeType('test.xquery'), 'application/xquery')
  t.equal(getMimeType('test.xql'), 'application/xquery')
  t.equal(getMimeType('test.xqm'), 'application/xquery')
  t.equal(getMimeType('test.xconf'), 'application/xml')
  t.equal(getMimeType('test.odd'), 'application/xml')
  t.end()
})

test('extend mime type definitions', function (t) {
  const testPath = 'test.bar'
  const testExtension = 'bar'
  const testMimeType = 'text/x-test'
  const testTypeMap = {}
  testTypeMap[testMimeType] = [testExtension]

  t.notEqual(getMimeType(testPath), testMimeType, 'previously undefined extension for ' + testExtension)
  defineMimeTypes(testTypeMap)
  t.equal(getMimeType(testPath), testMimeType, 'added new extension for ' + testExtension)
  t.end()
})

test('create connection with default settings', function (t) {
  const db = connect()
  const components = ['collections', 'queries', 'documents', 'users', 'indices']

  components.forEach(function (component) {
    t.ok(component in db, 'component ' + component + ' found')
  })
  t.ok(db.client.isSecure, 'secure client used')
  t.end()
})

test('create connection using http://', function (t) {
  const db = connect({ secure: false, port: 8080 })
  t.equal(db.client.isSecure, false, 'insecure client used')
  t.end()
})

test('get collection permissions', function (t) {
  const db = connect(connectionOptions)
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
