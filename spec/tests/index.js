// tests

import { test, describe, it } from 'node:test'
import assert from 'node:assert'
import { getXmlRpcClient, getMimeType, defineMimeTypes } from '../../index.js'
import { envOptions } from '../connection.js'

test('check for default mime type extensions', () => {
  assert.strictEqual(getMimeType('test.xq'), 'application/xquery')
  assert.strictEqual(getMimeType('test.xqs'), 'application/xquery')
  assert.strictEqual(getMimeType('test.xquery'), 'application/xquery')
  assert.strictEqual(getMimeType('test.xql'), 'application/xquery')
  assert.strictEqual(getMimeType('test.xqm'), 'application/xquery')
  assert.strictEqual(getMimeType('test.xconf'), 'application/xml')
  assert.strictEqual(getMimeType('test.odd'), 'application/xml')
})

test('raw command', async () => {
  const db = getXmlRpcClient()
  const res = await db.methodCall('getVersion', [])
  assert.ok(res, res)
})

test('get version', async () => {
  const db = getXmlRpcClient()
  const res = await db.server.version()
  assert.ok(res, res)
})

test('extend mime type definitions', () => {
  const testPath = 'test.bar'
  const testExtension = 'bar'
  const testMimeType = 'text/x-test'
  const testTypeMap = {}
  testTypeMap[testMimeType] = [testExtension]

  assert.notStrictEqual(getMimeType(testPath), testMimeType, 'previously undefined extension for ' + testExtension)
  defineMimeTypes(testTypeMap)
  assert.strictEqual(getMimeType(testPath), testMimeType, 'added new extension for ' + testExtension)
})

test('create connection with default settings', () => {
  const db = getXmlRpcClient()
  const components = ['collections', 'queries', 'documents', 'users', 'indices']

  components.forEach(function (component) {
    assert.ok(component in db, 'component ' + component + ' found')
  })
  assert.ok(db.connection.secure, 'secure client used')
})

test('create connection using http:', () => {
  const db = getXmlRpcClient({ protocol: 'http:', port: 8080 })
  assert.strictEqual(db.connection.secure, false, 'insecure client used')
})

test('create insecure client using legacy option', () => {
  const db = getXmlRpcClient({ secure: false, port: 8080 })
  assert.strictEqual(db.connection.secure, false, 'insecure client used')
})

await describe('create secure client to remote db', async () => {
  const host = 'exist-db.org'
  const protocol = 'https:'
  const remoteDb = port => getXmlRpcClient({ host, protocol, port })
  const check = async function (db) {
    assert.strictEqual(db.connection.secure, true, 'secure client used')

    try {
      await db.resources.describe('/db')
      assert.fail('should have thrown')
    } catch (e) {
      assert.strictEqual(e.message, 'XML-RPC fault: Wrong password for user [guest]', e)
    }
  }

  await it('using standard port', async () => {
    await check(remoteDb('443'))
  })

  await it('using empty port', async () => {
    await check(remoteDb(''))
  })
})

test('get collection permissions', async () => {
  const db = getXmlRpcClient(envOptions)
  const result = await db.resources.getPermissions('/db')
  assert.ok(result)
})
