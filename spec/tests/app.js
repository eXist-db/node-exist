const fs = require('fs')
const test = require('tape')
const app = require('../../components/app')
const { connect } = require('../../index')
const connectionOptions = require('../connection')

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
  const db = connect(connectionOptions)

  const xarBuffer = fs.readFileSync('spec/files/test-app.xar')
  const xarName = 'test-app.xar'
  const packageUri = 'http://exist-db.org/apps/test-app'
  const packageTarget = '/db/apps/test-app'

  t.test('upload app', function (st) {
    st.plan(1)
    db.app.upload(xarBuffer, xarName)
      .then(result => st.equal(result.success, true))
      .catch(e => {
        st.fail(e)
        st.end()
      })
  })

  t.test('install app', function (st) {
    db.app.install(xarName)
      .then(response => {
        if (!response.success) { return Promise.reject(response.error) }
        st.plan(3)
        st.equal(response.success, true, 'the application should have been installed')
        st.equal(response.result.update, false, 'there should be no previous installation')
        st.equal(response.result.target, packageTarget, 'the correct target should be returned')
      })
      .catch(e => {
        st.fail(e)
        st.end()
      })
  })

  t.test('re-install app', function (st) {
    db.app.install(xarName)
      .then(response => {
        if (!response.success) { return Promise.reject(response.error) }
        st.plan(3)
        st.equal(response.success, true)
        st.equal(response.result.update, true)
        st.equal(response.result.target, packageTarget, 'the correct target should be returned')
      })
      .catch(e => {
        st.fail(e)
        st.end()
      })
  })

  t.test('remove installed app', function (st) {
    st.plan(2)
    db.app.remove(packageUri)
      .then(response => st.equal(response.success, true, 'uninstalled'))
      .then(_ => db.documents.remove('/db/system/repo/test-app.xar'))
      .then(response => st.equal(response, true, 'removed'))
      .catch(e => st.fail(e))
  })
})

test('empty application XAR', function (t) {
  const db = connect(connectionOptions)

  const xarBuffer = Buffer.from('')
  const xarName = 'test-empty-app.xar'

  t.test('upload app', function (st) {
    st.plan(1)
    db.app.upload(xarBuffer, xarName)
      .then(response => st.equal(response.success, true))
      .catch(e => st.fail(e))
  })

  t.test('install app', function (st) {
    db.app.install(xarName)
      .then(response => {
        st.plan(2)
        st.equal(response.success, false)
        st.equal(response.error.message, 'experr:EXPATH00 Missing descriptor from package: /db/system/repo/test-empty-app.xar')
      })
      .catch(e => {
        st.fail(e)
        st.end()
      })
  })

  t.test('cleanup', function (st) {
    st.plan(1)
    db.documents.remove('/db/system/repo/test-empty-app.xar')
      .then(response => st.equal(response, true))
      .catch(e => st.fail(e))
  })
})
