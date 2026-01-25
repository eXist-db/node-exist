import { describe, it } from 'node:test'
import assert from 'node:assert'
import { getXmlRpcClient } from '../../index.js'
import { envOptions } from '../connection.js'
const testCollection = '/tests'
const db = getXmlRpcClient(envOptions)

async function testGetPermissions () {
  // setup
  try {
    const result = await db.resources.getPermissions(testCollection)
    assert.strictEqual(result.owner, 'admin', 'expected owner')
    assert.strictEqual(result.permissions, 493, 'expected permissions')
    assert.deepStrictEqual(result.acl, [], 'expected acl')
    assert.strictEqual(result.group, 'dba', 'expected group')
  } catch (e) {
    assert.fail(e)
  }
}

async function testDescribeResource () {
  const expectedInfo = {
    owner: 'admin',
    'content-length': 1,
    'mime-type': 'application/xquery',
    'content-length-64bit': '1',
    permissions: 420,
    created: new Date(),
    name: testCollection + '/test.xql',
    modified: new Date(),
    acl: [],
    type: 'BinaryResource',
    group: 'dba'
  }

  try {
    const info = await db.resources.describe(testCollection + '/test.xql')
    assert.strictEqual(info.name, expectedInfo.name, 'returns expected path')
    assert.strictEqual(info.owner, expectedInfo.owner, 'returns expected owner')
    assert.strictEqual(info.permissions, expectedInfo.permissions, 'returns expected owner')
    assert.strictEqual(info['content-length'], expectedInfo['content-length'], 'returns expected length')
  } catch (e) {
    assert.fail(e)
  }
}

async function testSetPermissions () {
  const resourcePath = testCollection + '/test.xql'
  const permissions = 666

  try {
    const result = await db.resources.setPermissions(resourcePath, permissions)
    assert.ok(result, 'permissions set successfully')
    const permResult = await db.resources.getPermissions(resourcePath)
    assert.strictEqual(permResult.permissions, permissions, 'expected permissions')
  } catch (e) {
    assert.fail(e)
  }
}

await describe('resources:', async function () {
  const db = getXmlRpcClient(envOptions)

  await it('setup', async function () {
    try {
      await db.collections.create(testCollection)
      const fh = await db.documents.upload(Buffer.from('1'))
      const r = await db.documents.parseLocal(fh, testCollection + '/test.xql')
      assert.ok(r, 'setup ended')
    } catch (e) {
      assert.fail('setup failed')
    }
  })

  await it('describe resource', testDescribeResource)
  await it('get resource permissions', testGetPermissions)
  await it('set resource permissions', testSetPermissions)

  await it('tearDown', async function () {
    try {
      const r = await db.collections.remove(testCollection)
      assert.ok(r, 'tearDown ended')
    } catch (e) {
      assert.fail(e)
    }
  })
})
