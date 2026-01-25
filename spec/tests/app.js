import fs from 'fs'
import { test, describe, it } from 'node:test'
import assert from 'node:assert'
import * as app from '../../components/app.js'
import { getXmlRpcClient } from '../../index.js'
import { envOptions } from '../connection.js'

test('app component exports install method', () => {
  assert.strictEqual(typeof app.install, 'function')
})

test('app component exports remove method', () => {
  assert.strictEqual(typeof app.remove, 'function')
})

test('app component exports upload method', () => {
  assert.strictEqual(typeof app.upload, 'function')
})

await describe('upload and install application XAR', async () => {
  const db = getXmlRpcClient(envOptions)

  const xarBuffer = fs.readFileSync('spec/files/test-app.xar')
  const xarName = 'test-app.xar'
  const packageUri = 'http://exist-db.org/apps/test-app'
  const packageTarget = '/db/apps/test-app'

  await it('upload app', async () => {
    const result = await db.app.upload(xarBuffer, xarName)
    assert.strictEqual(result.success, true)
  })

  await it('install app', async () => {
    const response = await db.app.install(xarName)
    if (!response.success) { throw response.error }
    assert.strictEqual(response.success, true, 'the application should have been installed')
    assert.strictEqual(response.result.update, false, 'there should be no previous installation')
    assert.strictEqual(response.result.target, packageTarget, 'the correct target should be returned')
  })

  await it('re-install app', async () => {
    const response = await db.app.install(xarName)
    if (!response.success) { throw response.error }
    assert.strictEqual(response.success, true)
    assert.strictEqual(response.result.update, true)
    assert.strictEqual(response.result.target, packageTarget, 'the correct target should be returned')
  })

  await it('remove installed app', async () => {
    const response = await db.app.remove(packageUri)
    assert.strictEqual(response.success, true, 'uninstalled')
    const removed = await db.documents.remove(`${app.packageCollection}/test-app.xar`)
    assert.strictEqual(removed, true, 'removed')
  })
})

await describe('empty application XAR', async () => {
  const db = getXmlRpcClient(envOptions)

  const xarBuffer = Buffer.from('')
  const xarName = 'test-empty-app.xar'

  await it('upload app', async () => {
    const response = await db.app.upload(xarBuffer, xarName)
    assert.strictEqual(response.success, true)
  })

  await it('install app', async () => {
    const response = await db.app.install(xarName)
    assert.strictEqual(response.success, false)
    assert.strictEqual(response.error.message, `experr:EXPATH00 Missing descriptor from package: ${app.packageCollection}/test-empty-app.xar`)
  })

  await it('cleanup', async () => {
    const response = await db.documents.remove(`${app.packageCollection}/test-empty-app.xar`)
    assert.strictEqual(response, true)
  })
})
