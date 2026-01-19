import { test, describe, it } from 'node:test'
import assert from 'node:assert'
import { readFileSync } from 'fs'
import semverGt from 'semver/functions/gt.js'
import { connect } from '../../index.js'
import { envOptions } from '../connection.js'

await describe('binary document', async function () {
  const path = '/db/test.txt'
  const content = Buffer.from('test')
  const db = connect(envOptions)

  await it('should upload', async function () {
    try {
      const db = connect(envOptions)
      const fh = await db.documents.upload(content, content.length)
      assert.ok(fh >= 0, 'returned filehandle:' + fh)
      const r = await db.documents.parseLocal(fh, path)
      assert.ok(r, 'was parsed')
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('can be read', async function () {
    try {
      const readContent = await db.documents.readBinary(path)
      assert.deepStrictEqual(content, readContent, 'returned contents equal')
    } catch (e) {
      assert.fail(e)
    }
  })
})

await test('upload invalid XML', async function () {
  const db = connect(envOptions)
  const buffer = readFileSync('spec/files/invalid.xml')

  try {
    const result = await db.documents.upload(buffer, buffer.length)
    assert.ok(result >= 0, 'returned filehandle')
    const parseResult = await db.documents.parseLocal(result, '/tmp/testfile.xml')
    assert.fail(parseResult)
  } catch (e) {
    assert.ok(e, 'was rejected')
  }
})

await describe('valid XML', async function () {
  const db = connect(envOptions)
  const version = await db.server.version()
  const remoteFileName = '/test.xml'
  const contents = readFileSync('spec/files/test.xml')

  await it('can be uploaded', async function () {
    try {
      const fh = await db.documents.upload(contents)
      assert.ok(fh >= 0, 'returned filehandle')
      const result = await db.documents.parseLocal(fh, remoteFileName)
      assert.ok(result, 'file could be parsed')
      const info = await db.resources.describe(remoteFileName)
      assert.ok(info, 'file was written to collection')
    } catch (e) {
      assert.fail(e, 'errored')
    }
  })

  await it('read with empty options uses defaults', async function () {
    try {
      const contentBuffer = await db.documents.read(remoteFileName, {})
      const lines = contents.toString().split('\n')

      // default serialization removes first (XML declaration) line
      lines.shift()

      // and last line (final newline)
      lines.pop()
      const expectedContents = lines.join('\n')

      assert.strictEqual(contentBuffer.toString(), expectedContents, 'file was read')
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('read without passing options', async function () {
    try {
      // calling read with just one argument, effectively passing null for options
      const contentBuffer = await db.documents.read(remoteFileName)
      const lines = contents.toString().split('\n')

      // default serialization removes first (XML declaration) line
      lines.shift()

      // and last line (final newline)
      lines.pop()
      const expectedContents = lines.join('\n')

      assert.strictEqual(contentBuffer.toString(), expectedContents, 'file was read')
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('serialized without XML declaration', async function () {
    try {
      const options = { 'omit-xml-declaration': 'yes' }
      const lines = contents.toString().split('\n')

      // default serialization removes first (XML declaration) line
      lines.shift()
      // and last line (final newline)
      lines.pop()
      const expectedContents = lines.join('\n')

      const contentBuffer = await db.documents.read(remoteFileName, options)
      assert.strictEqual(contentBuffer.toString(), expectedContents, 'expected file contents received')
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('serialized with XML declaration', async function () {
    try {
      // this forces an XML-declaration whether it was part of the original document or not
      const options = { 'omit-xml-declaration': 'no' }

      const lines = contents.toString().split('\n')
      // eXist-db does not add a final newline by default
      lines.pop()
      const expectedContents = lines.join('\n')

      const result = await db.documents.read(remoteFileName, options)
      assert.strictEqual(result.toString(), expectedContents, 'expected file contents received')
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('serialized with XML declaration and final newline', async function () {
    try {
      // skip this test for older versions as
      // insert-final-newline is only available with eXist-db >6.0.1
      if (!semverGt(version, '6.0.1')) {
        return // skip this test
      }

      // options to serialize to local contents with XML-declaration and final newline
      const options = {
        'omit-xml-declaration': 'no',
        'insert-final-newline': 'yes'
      }

      const result = await db.documents.read(remoteFileName, options)
      assert.deepStrictEqual(contents, result, 'equal')
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('cleanup', async function () {
    try {
      await db.documents.remove(remoteFileName)
    } catch (e) {
      // ignore errors
    }
  })
})

// xquery file with permission changes
await test('xql-change-perms', async function () {
  // not implemented yet
})

// upload HTML5 file without retry
await test('up-html5-no-retry', async function () {
  // not implemented yet
})

// upload HTML5 file with retry
await test('up-html5-with-retry', async function () {
  // not implemented yet
})

await test('non well formed XML will not be uploaded as binary', async function () {
  // not implemented yet
})

await test('upload document with duplicate xml:id', async function () {
  try {
    const db = connect(envOptions)
    const buffer = Buffer.from('<root><item xml:id="i1" /><item xml:id="i1" /></root>')

    await db.collections.create('/db/tmp')

    const fh = await db.documents.upload(buffer, buffer.length)
    assert.ok(fh >= 0, 'returned filehandle')
    const result = await db.documents.parseLocal(fh, '/db/tmp/testfile.xml')
    assert.ok(result, 'duplicate XML-IDs are allowed')
  } catch (e) {
    assert.fail(e)
  }
})
