const test = require('tape')
const fs = require('fs')
const exist = require('../../index')
const connectionOptions = require('../db-connection')

test('upload document', function (t) {
  const db = exist.connect(connectionOptions)
  const buffer = Buffer.from('test')

  db.documents.upload('/db/node-exist-test.txt', buffer, 'text/plain')
    .then(function (result) {
      console.log(result.status)
      t.ok(result.status === 201, 'file created')
      t.end()
    })
    .catch(function (e) {
      t.fail(e)
      t.end()
    })
})

test('upload invalid XML', function (t) {
  const db = exist.connect(connectionOptions)
  const buffer = fs.readFileSync('spec/files/invalid.xml')

  db.documents.upload('/db/tmp/testfile-invalid.xml', buffer, 'application/xml')
    .then(function (result) {
      t.fail(result, 'was not rejected')
      t.end()
    })
    .catch(function (e) {
      t.equal(e.status, 400, e.statusMessage)
      t.end()
    })
})

test('upload valid XML', function (t) {
  const db = exist.connect(connectionOptions)
  const remoteFileName = '/db/tmp/testfile-valid.xml'

  db.documents.upload(remoteFileName, fs.readFileSync('spec/files/test.xml'))
    .then(function (result) {
      t.equal(result.status, 201, 'created')
      t.end()
    })
    .catch(function (e) {
      t.fail(e, 'errored')
      t.end()
    })
})

test('download test.xml', function (t) {
  const db = exist.connect(connectionOptions)
  const localContents = fs.readFileSync('spec/files/test.xml').toString()
  const expectedContents = localContents.substr(0, localContents.length - 1) // for some reason the last newline is removed
  const remoteFileName = '/db/tmp/testfile-valid.xml'

  db.documents.read(remoteFileName)
    .then(function (result) {
      t.equal(result.body.toString(), expectedContents, 'expected file contents received')
      t.end()
    })
    .catch(function (e) {
      t.fail(e, 'errored')
      t.end()
    })
})

// well formed xml
test('well-formed-xml', function (t) {
  t.skip('not implemented yet')
  t.end()
})

// xquery file with permission changes
// test('xql-change-perms', function (t) {
//   t.skip('slow')
//   const db = exist.connect(connectionOptions)
//   const data = fs.readFileSync('spec/files/test.xql')
//   const remoteFileName = '/db/tmp/test.xql'

//   db.put(remoteFileName, data, exist.getMimeType(remoteFileName))
//     .then(result => {
//       // const contents = result.json
//       console.log(result.json)
//       t.ok(result, 'expected content returned')
//       t.end()
//     })
//     .catch(e => {
//       console.error(e)
//       t.fail(e, 'damn')
//       t.end()
//     })
// })

// upload HTML5 file without retry
test('up-html5-no-retry', function (t) {
  t.skip('not implemented yet')
  t.end()
})

// upload HTML5 file with retry
test('up-html5-with-retry', function (t) {
  t.skip('not implemented yet')
  t.end()
})

test('non well formed XML will not be uploaded as binary', function (t) {
  t.skip('not implemented yet')
  t.end()
})
