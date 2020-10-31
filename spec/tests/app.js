const fs = require('fs')
const test = require('tape')
const app = require('../../components/app')
const exist = require('../../index')

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

test('upload and install application XAR', function (t) {
  const db = exist.connect(require('../db-connection'))

  const xarBuffer = fs.readFileSync('spec/files/test-app.xar')
  const xarName = 'test-app.xar'
  const appNamespace = 'http://exist-db.org/apps/test-app'

  t.test('upload app', function (st) {
    st.plan(1)
    db.app.upload(xarBuffer, xarName)
      .then(result => st.equal(result, true))
      .catch(e => st.fail(e))
  })

  t.test('install app', function (st) {
    const expected = '<status xmlns="http://exist-db.org/xquery/repo" result="ok" target="/db/apps/test-app"/>'

    st.plan(1)
    db.app.install(xarName)
      .then(result => st.equal(result, expected))
      .catch(e => st.fail(e))
  })

  t.test('remove installed app', function (st) {
    const expected = '<status xmlns="http://exist-db.org/xquery/repo" result="ok" target="test-app"/>,true'

    st.plan(1)
    db.app.remove(appNamespace)
      .then(result => st.equal(result, expected))
      .catch(e => st.fail(e))
  })
})
