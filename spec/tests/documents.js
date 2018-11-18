var test = require('tape')
var fs = require('fs')
var exist = require('../../index')
var connectionOptions = require('../db-connection')

test('upload document', function (t) {
  var db = exist.connect(connectionOptions)
  var buffer = Buffer.from('test')

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
  var db = exist.connect(connectionOptions)
  var buffer = fs.readFileSync('spec/files/invalid.xml')

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
  var db = exist.connect(connectionOptions)
  var remoteFileName = '/test.xml'

  db.documents.upload(fs.readFileSync('spec/files/test.xml'))
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
  var db = exist.connect(connectionOptions)
  var localContents = fs.readFileSync('spec/files/test.xml').toString()
  var expectedContents = localContents.substr(0, localContents.length - 1) // for some reason the last newline is removed
  var options = { 'omit-xml-declaration': 'no' } // xml header is cut off by default
  var remoteFileName = '/test.xml'

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

// well formed xml
test('well-formed-xml', function (t) {
  t.skip('not implemented yet')
  t.end()
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
