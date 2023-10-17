const test = require('tape')
const { readFileSync } = require('fs')
const semverGt = require('semver/functions/gt')
const { connect } = require('../../index')
const { envOptions } = require('../connection')

test('binary document', function (t) {
  const path = '/db/test.txt'
  const content = Buffer.from('test')
  const db = connect(envOptions)

  t.test('should upload', async function (st) {
    try {
      const db = connect(envOptions)
      const fh = await db.documents.upload(content, content.length)
      st.ok(fh >= 0, 'returned filehandle:' + fh)
      const r = await db.documents.parseLocal(fh, path)
      st.ok(r, 'was parsed')
    } catch (e) {
      t.fail(e)
    }
  })

  t.test('can be read', async function (st) {
    try {
      const readContent = await db.documents.readBinary(path)
      st.deepEqual(content, readContent, 'returned contents equal')
    } catch (e) {
      st.fail(e)
    }
  })
})

test('upload invalid XML', function (t) {
  const db = connect(envOptions)
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

test('valid XML', async function (t) {
  const db = connect(envOptions)
  const version = await db.server.version()
  const remoteFileName = '/test.xml'
  const contents = readFileSync('spec/files/test.xml')

  t.test('can be uploaded', async function (st) {
    try {
      const fh = await db.documents.upload(contents)
      st.ok(fh >= 0, 'returned filehandle')
      const result = await db.documents.parseLocal(fh, remoteFileName, {})
      st.ok(result, 'file could be parsed')
      const info = await db.resources.describe(remoteFileName)
      st.ok(info, 'file was written to collection')
    } catch (e) {
      t.fail(e, 'errored')
    }
  })

  t.test('serialized with default options', async function (st) {
    try {
      const contentBuffer = await db.documents.read(remoteFileName, {})
      const lines = contents.toString().split('\n')

      // default serialization removes first (XML declaration) line
      lines.shift()

      // and last line (final newline)
      lines.pop()
      const expectedContents = lines.join('\n')

      st.equal(contentBuffer.toString(), expectedContents, 'file was read')
    } catch (e) {
      st.fail(e, 'errored')
    }
  })

  t.test('serialized without XML declaration', async function (st) {
    try {
      const options = { 'omit-xml-declaration': 'yes' }
      const lines = contents.toString().split('\n')

      // default serialization removes first (XML declaration) line
      lines.shift()
      // and last line (final newline)
      lines.pop()
      const expectedContents = lines.join('\n')

      const contentBuffer = await db.documents.read(remoteFileName, options)
      st.equal(contentBuffer.toString(), expectedContents, 'expected file contents received')
    } catch (e) {
      st.fail(e, 'errored')
    }
  })

  t.test('serialized with XML declaration', async function (st) {
    try {
      // this forces an XML-declaration whether it was part of the original document or not
      const options = { 'omit-xml-declaration': 'no' }

      const lines = contents.toString().split('\n')
      // eXist-db does not add a final newline by default
      lines.pop()
      const expectedContents = lines.join('\n')

      const result = await db.documents.read(remoteFileName, options)
      st.equal(result.toString(), expectedContents, 'expected file contents received')
    } catch (e) {
      st.fail(e, 'errored')
    }
  })

  t.test('serialized with XML declaration and final newline', async function (st) {
    try {
      // skip this test for older versions as
      // insert-final-newline is only available with eXist-db >6.0.1
      if (!semverGt(version, '6.0.1')) {
        return st.skip('insert-final-newline not implemented in ' + version)
      }

      // options to serialize to local contents with XML-declaration and final newline
      const options = {
        'omit-xml-declaration': 'no',
        'insert-final-newline': 'yes'
      }

      const result = await db.documents.read(remoteFileName, options)
      st.deepEqual(contents, result, 'equal')
    } catch (e) {
      st.fail(e, 'errored')
    }
  })

  t.test('cleanup', async function (st) {
    try {
      await db.documents.remove(remoteFileName)
    } catch (e) {
      t.end()
    }
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

test('upload document with duplicate xml:id', async function (t) {
  try {
    const db = connect(envOptions)
    const buffer = Buffer.from('<root><item xml:id="i1" /><item xml:id="i1" /></root>')

    await db.collections.create('/db/tmp')

    const fh = await db.documents.upload(buffer, buffer.length)
    t.ok(fh >= 0, 'returned filehandle')
    const result = await db.documents.parseLocal(fh, '/db/tmp/testfile.xml')
    t.ok(result, 'duplicate XML-IDs are allowed')
  } catch (e) {
    t.fail(e)
  }
})
