var test = require('tape')
var exist = require('../../index')

var fs = require('fs')
var app = require('../../components/app')
var connectionOptions = require('../db-connection')

var appUri = 'http://exist-db.org/apps/test-app'
var xarBuffer = fs.readFileSync('spec/files/test-app.xar')
var xarTarget = 'uploadTest.xar'

test('app component exports install method', function (t) {
  t.equal(typeof app.install, 'function')
  t.end()
})

test('app component exports remove method', function (t) {
  t.equal(typeof app.remove, 'function')
  t.end()
})

test('app component exports upload method', function (t) {
  t.equal(typeof app.upload, 'function')
  t.end()
})

test('upload app', function (t) {
  var db = exist.connect(connectionOptions)

  t.plan(1)
  db.app.upload(xarBuffer, xarTarget)
    .then(function (result) {
      t.equal(result, true)
    })
    .catch(function (e) {
      t.fail(e)
    })
})

test('install app', function (t) {
  var db = exist.connect(connectionOptions)
  var expected = '<status xmlns="http://exist-db.org/xquery/repo" result="ok" target="/db/apps/test-app"/>'

  t.plan(1)
  db.app.install(xarTarget)
    .then(function (result) {
      t.equal(result, expected)
    })
    .catch(function (e) {
      t.fail(e)
    })
})

test('remove installed app', function (t) {
  var db = exist.connect(connectionOptions)
  var expected = '<status xmlns="http://exist-db.org/xquery/repo" result="ok" target="test-app"/>,true'

  t.plan(1)
  db.app.remove(appUri)
    .then(function (result) {
      t.equal(result, expected)
    })
    .catch(function (e) {
      t.fail(e)
    })
})

test('teardown', function tearDown (t) {
  var db = exist.connect(connectionOptions)
  function logAndEnd (r) {
    console.log(r)
    t.end()
  }

  db.documents.remove(xarTarget)
    .then(logAndEnd)
    .catch(logAndEnd)
})
