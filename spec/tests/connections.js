import { test, describe, it } from 'node:test'
import assert from 'node:assert'

import { getXmlRpcClient, getRestClient, readOptionsFromEnv } from '../../index.js'
import { envOptions } from '../connection.js'

// connections set in the environment of the test run must not leak into these tests
const { connections, ...connectionOptions } = envOptions

const wait = 600
const slowQuery = `util:wait(${wait}), "done"`
const parallel = 4

/**
 * run the same slow query several times at once
 * @param {function(): Promise} run runs the query once
 * @returns {Promise<number>} milliseconds until all of them finished
 */
async function elapsed (run) {
  const start = Date.now()
  await Promise.all(Array.from({ length: parallel }, run))
  return Date.now() - start
}

test('connections option', async (t) => {
  await t.test('opens one connection by default', () => {
    assert.strictEqual(getXmlRpcClient(connectionOptions).connection.connections, 1)
    assert.strictEqual(getRestClient(connectionOptions).connection.connections, 1)
  })

  await t.test('is passed on to the XML-RPC and the REST client', () => {
    assert.strictEqual(getXmlRpcClient({ ...connectionOptions, connections: 4 }).connection.connections, 4)
    assert.strictEqual(getRestClient({ ...connectionOptions, connections: 4 }).connection.connections, 4)
  })

  await t.test('rejects anything but a positive integer', () => {
    for (const value of [0, -1, 1.5, '4']) {
      assert.throws(() => getXmlRpcClient({ ...connectionOptions, connections: value }), /connections/, String(value))
    }
  })
})

test('EXISTDB_CONNECTIONS', async (t) => {
  await t.test('is not set when absent or empty', () => {
    delete process.env.EXISTDB_CONNECTIONS
    assert.ok(!('connections' in readOptionsFromEnv()))
    process.env.EXISTDB_CONNECTIONS = ''
    assert.ok(!('connections' in readOptionsFromEnv()))
  })

  await t.test('is read as a number of connections', () => {
    process.env.EXISTDB_CONNECTIONS = '8'
    assert.strictEqual(readOptionsFromEnv().connections, 8)
  })

  await t.test('rejects anything but a positive integer', () => {
    for (const value of ['0', '-1', '1.5', 'four']) {
      process.env.EXISTDB_CONNECTIONS = value
      assert.throws(() => readOptionsFromEnv(), /EXISTDB_CONNECTIONS/, value)
    }
  })

  delete process.env.EXISTDB_CONNECTIONS
})

await describe('XML-RPC calls over several connections', async () => {
  await it('run one after the other over one connection (HTTP/1.1)', { skip: envOptions.protocol === 'https:' && 'HTTP/2 multiplexes one connection' }, async () => {
    const db = getXmlRpcClient(connectionOptions)
    const ms = await elapsed(() => db.queries.readAll(slowQuery))
    assert.ok(ms >= parallel * wait * 0.9, `${parallel} queries took ${ms} ms`)
  })

  await it('run in parallel over as many connections', async () => {
    const db = getXmlRpcClient({ ...connectionOptions, connections: parallel })
    const ms = await elapsed(async () => {
      const { pages } = await db.queries.readAll(slowQuery)
      assert.strictEqual(Buffer.concat(pages).toString(), 'done')
    })
    assert.ok(ms < 2 * wait, `${parallel} queries took ${ms} ms`)
  })
})

await describe('REST requests over several connections', async () => {
  await it('run in parallel over as many connections', async () => {
    const rest = getRestClient({ ...connectionOptions, connections: parallel })
    const ms = await elapsed(async () => {
      const response = await rest.post(slowQuery, 'db')
      assert.strictEqual(response.statusCode, 200)
    })
    assert.ok(ms < 2 * wait, `${parallel} requests took ${ms} ms`)
  })
})
