import { test, describe, it } from 'node:test'
import assert from 'node:assert'
import { getXmlRpcClient } from '../../index.js'
import { envOptions } from '../connection.js'
const asGuest = Object.assign({},
  envOptions,
  { basic_auth: { user: 'guest', pass: 'guest' } }
)

await describe('collections.exists', async () => {
  const db = getXmlRpcClient(envOptions)

  await it('true for existing collection', async () => {
    const result = await db.collections.exists('/db')
    assert.ok(result, '/db exists')
  })

  await it('false for non-existing collection', async () => {
    const result = await db.collections.exists('/foo')
    assert.ok(!result, '/foo does not exist')
  })

  await it('throws with insufficient access', async () => {
    try {
      const dbAsGuest = getXmlRpcClient()
      const result = await dbAsGuest.collections.exists('/db/system/security')
      assert.ok(!result, 'Guest should not see /db/system/security')
    } catch (e) {
      // Guest should not see /db/system/security
      // because it throws with a PermissionDeniedException
      // it is obvious the collection exists
      assert.ok(e)
    }
  })
})

await test('get collection info', async () => {
  const db = getXmlRpcClient(envOptions)
  const info = await db.collections.describe('/db')
  assert.strictEqual(info.owner, 'SYSTEM')
  assert.ok(Array.isArray(info.collections))
  assert.ok(Array.isArray(info.acl))
  assert.ok(info.created)
  assert.strictEqual(info.permissions, 493)
  assert.strictEqual(info.name, '/db')
  assert.strictEqual(info.group, 'dba')
})

await test('read collection', async () => {
  const db = getXmlRpcClient(envOptions)
  const collection = await db.collections.read('/db/system/security')
  assert.strictEqual(collection.owner, 'SYSTEM')
  assert.strictEqual(collection.collections[0], 'exist')
  assert.strictEqual(collection.documents[0].name, 'config.xml')
  assert.ok(collection.created)
  assert.strictEqual(collection.permissions, 504)
  assert.strictEqual(collection.name, '/db/system/security')
})

await test('get info for non existent collection', async () => {
  const db = getXmlRpcClient(envOptions)
  try {
    await db.collections.describe('/foo')
    assert.fail('no error')
  } catch (e) {
    if (!e.faultString) {
      assert.fail('no faultString, something else must have gone wrong')
    }
    assert.ok(e.faultString.match(/\/foo not found!$/), 'not found error')
  }
})

await test('create collection', async () => {
  const db = getXmlRpcClient(envOptions)
  const r = await db.collections.create('new-test-collection')
  assert.ok(r, 'created')
})

await test('remove collection', async () => {
  const db = getXmlRpcClient(envOptions)
  const testCollection = '/remove-collection'
  await db.collections.create(testCollection)
  const success = await db.collections.remove(testCollection)
  assert.ok(success, 'removed')
})

await test('collection exists and guest cannot open it', async () => {
  const db = getXmlRpcClient(asGuest)
  try {
    await db.collections.existsAndCanOpen('/db/system/security')
    assert.fail()
  } catch (e) {
    assert.ok(e, '/db/system/security exists and user guest cannot access it')
  }
})

await test('collection exists and guest can open it', async () => {
  const db = getXmlRpcClient(asGuest)
  const success = await db.collections.existsAndCanOpen('/db/apps')
  assert.ok(success, '/db/apps exists and user guest can access it')
})

await test('collection does not exist (guest)', async () => {
  const db = getXmlRpcClient(asGuest)
  const success = await db.collections.existsAndCanOpen('/db/apps/asdf')
  assert.ok(!success, '/db/apps/asdf does not exist')
})

await test('collection exists and admin can open it', async () => {
  const db = getXmlRpcClient(envOptions)
  const success = await db.collections.existsAndCanOpen('/db/system/security')
  assert.ok(success)
})

await test('collection does not exist (admin)', async () => {
  const db = getXmlRpcClient(envOptions)
  const success = await db.collections.existsAndCanOpen('/db/apps/asdf')
  assert.ok(!success, '/db/apps/asdf does not exist')
})
