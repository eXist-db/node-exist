const test = require('tape')
const { readFileSync } = require('fs')
const { connect } = require('../../index')
const connectionOptions = require('../connection')

test('upload document', function (t) {
  const db = connect(connectionOptions)
  const buffer = Buffer.from('test')

  db.documents.upload(buffer, buffer.length)
    .then(function (result) {
      t.ok(result >= 0, 'returned filehandle')
      t.end()
    })
    .catch(function (e) {
      t.fail(e)
      t.end()
    })
})

test('upload invalid XML', function (t) {
  const db = connect(connectionOptions)
  const buffer = readFileSync('spec/files/invalid.xml')

  db.documents.upload(buffer, buffer.length)
    .then(function (result) {
      t.ok(result >= 0, 'returned filehandle')
      return db.documents.parseLocal(result, '/tmp/testfile.xml')
    })
    .then(function (result) {
      t.fail(result, 'was not rejected')
      t.end()
    })
    .catch(function (e) {
      t.ok(e, 'was rejected')
      t.end()
    })
})

test('upload valid XML', function (t) {
  const db = connect(connectionOptions)
  const remoteFileName = '/test.xml'

  db.documents.upload(readFileSync('spec/files/test.xml'))
    .then(function (fh) {
      t.ok(fh >= 0, 'returned filehandle')
      return db.documents.parseLocal(fh, remoteFileName, {})
    })
    .then(function (result) {
      t.ok(result, 'file could be parsed')
      return db.resources.describe(remoteFileName)
    })
    .then(function (result) {
      t.ok(result, 'file was written to collection')
      t.end()
    })
    .catch(function (e) {
      t.fail(e, 'errored')
      t.end()
    })
})

test('download test.xml', function (t) {
  const db = connect(connectionOptions)
  const localContents = readFileSync('spec/files/test.xml').toString()
  const expectedContents = localContents.substring(0, localContents.length - 1) // for some reason the last newline is removed
  const options = { 'omit-xml-declaration': 'no' } // xml header is cut off by default
  const remoteFileName = '/test.xml'

  db.documents.read(remoteFileName, options)
    .then(function (result) {
      t.equal(result.toString(), expectedContents, 'expected file contents received')
      t.end()
    })
    .catch(function (e) {
      t.fail(e, 'errored')
      t.end()
    })
})

// xquery file with permission changes
test('xql-change-perms', function (t) {
  t.skip('not implemented yet')
  t.end()
})

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
