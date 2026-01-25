import test from 'node:test'
import assert from 'node:assert'
import { getXmlRpcClient } from '../../index.js'
import { envOptions } from '../connection.js'
const asGuest = Object.assign({},
  envOptions,
  { basic_auth: { user: 'guest', pass: 'guest' } }
)

await test('list users', async () => {
  const db = getXmlRpcClient(envOptions)
  const list = await db.users.list()
  assert.ok(list.length, 'Returns a non-empty list of users')

  const names = list.map(u => u.name)
  assert.ok(names.includes('SYSTEM'), 'found user SYSTEM')
  assert.ok(names.includes('admin'), 'found user admin')
  assert.ok(names.includes('guest'), 'found user guest')
  // when testing on a package-less installation these users will not be created
  // assert.ok(names.includes('monex'), 'found user monex')
  // assert.ok(names.includes('eXide'), 'found user eXide')
  // assert.ok(names.includes('packageservice'), 'found user packageservice')
  // exist 4.7.1 does not have this user
  // assert.ok(names.includes('nobody'), 'found user nobody')
})

await test('list users as guest', async () => {
  const db = getXmlRpcClient(asGuest)
  const list = await db.users.list()
  assert.ok(list.length, 'Returns a non-empty list of users')
})

await test('get user info for admin', async () => {
  const db = getXmlRpcClient(envOptions)
  const info = await db.users.getUserInfo('admin')
  assert.ok(info)
})

await test('get user info for guest', async () => {
  const db = getXmlRpcClient(envOptions)
  const info = await db.users.getUserInfo('guest')
  assert.ok(info)
})

await test('get user info for non-existent user', async () => {
  const db = getXmlRpcClient(envOptions)
  try {
    await db.users.getUserInfo('thisuserschouldnotexist')
    assert.fail('should have thrown')
  } catch (e) {
    assert.ok(e)
  }
})
