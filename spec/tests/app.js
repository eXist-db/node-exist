const test = require('tape')
const exist = require('../../index')

const fs = require('fs')
const app = require('../../components/app')
const connectionOptions = require('../db-connection')

const appUri = 'http://exist-db.org/apps/test-app'
const xarBuffer = fs.readFileSync('spec/files/test-app.xar')
const xarTarget = 'uploadTest.xar'

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
  const db = exist.connect(connectionOptions)

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
  const db = exist.connect(connectionOptions)
  const expected = '<status xmlns="http://exist-db.org/xquery/repo" result="ok" target="/db/apps/test-app"/>'

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
  const db = exist.connect(connectionOptions)
  const expected = '<status xmlns="http://exist-db.org/xquery/repo" result="ok" target="test-app"/>,true'

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
  const db = exist.connect(connectionOptions)
  function logAndEnd (r) {
    console.log(r)
    t.end()
  }

  db.documents.remove(xarTarget)
    .then(logAndEnd)
    .catch(logAndEnd)
})
