import { test, describe, it } from 'node:test'
import assert from 'node:assert'
import diagnosticsChannel from 'node:diagnostics_channel'

import { getXmlRpcClient, getRestClient, readOptionsFromEnv } from '../../index.js'
import { envOptions } from '../connection.js'

// connections set in the environment of the test run must not leak into these tests
const { connections, ...connectionOptions } = envOptions

const wait = 600
const slowQuery = `util:wait(${wait}), "done"`
const parallel = 4
// queued requests take at least this long; parallel ones well below, even with TLS handshakes for new connections
const serial = parallel * wait

/**
 * collect the connections undici opens while run is pending
 * @param {function(): Promise} run sends the requests
 * @returns {Promise<Array<string|undefined>>} the ALPN protocol of each connection, undefined for plain http:
 */
async function openedConnections (run) {
  const protocols = []
  const onConnected = ({ socket }) => { protocols.push(socket.alpnProtocol || undefined) }
  diagnosticsChannel.subscribe('undici:client:connected', onConnected)
  try {
    await run()
  } finally {
    diagnosticsChannel.unsubscribe('undici:client:connected', onConnected)
  }
  return protocols
}

/**
 * whether the client and the server agree on HTTP/2 (TLS ALPN), which undici offers by default for https:
 * over HTTP/2 requests are multiplexed on one connection, so they never queue
 * @returns {Promise<boolean>} true if the connection the client opens speaks h2
 */
async function negotiatesHttp2 () {
  const [protocol] = await openedConnections(() => getXmlRpcClient(connectionOptions).queries.readAll('1'))
  return protocol === 'h2'
}

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

// envOptions.protocol is only set from EXISTDB_SERVER, ask the connection the client opens instead
const http2 = await negotiatesHttp2()

const transport = http2 ? 'HTTP/2' : 'HTTP/1.1'

/**
 * send the slow query several times at once, count the connections that opens and time it
 * @param {function(): Promise} run sends the query once
 * @returns {Promise<{ms: number, opened: number}>} milliseconds until all finished, connections opened
 */
async function measure (run) {
  let ms
  const opened = await openedConnections(async () => { ms = await elapsed(run) })
  return { ms, opened: opened.length }
}

/**
 * over HTTP/1.1 one connection serves one request at a time, over HTTP/2 requests share it
 * @param {{ms: number, opened: number}} measured what one client with a single connection did
 * @param {string} what what was sent, for the message
 */
function assertOneConnection ({ ms, opened }, what) {
  assert.strictEqual(opened, 1, `${parallel} ${what} over ${transport} opened ${opened} connections`)
  const message = `${parallel} ${what} over one ${transport} connection took ${ms} ms`
  if (http2) {
    assert.ok(ms < serial * 0.75, message)
  } else {
    assert.ok(ms >= serial * 0.9, message)
  }
}

/**
 * a pool runs the requests in parallel: over HTTP/1.1 it opens a connection per request,
 * over HTTP/2 it multiplexes them on the one connection it already has
 * @param {{ms: number, opened: number}} measured what one client with `parallel` connections did
 * @param {string} what what was sent, for the message
 */
function assertPool ({ ms, opened }, what) {
  assert.strictEqual(opened, http2 ? 1 : parallel, `${parallel} ${what} over ${transport} opened ${opened} connections`)
  assert.ok(ms < serial * 0.75, `${parallel} ${what} over ${transport} took ${ms} ms`)
}

const oneConnection = http2
  ? 'run in parallel over one connection (HTTP/2)'
  : 'run one after the other over one connection (HTTP/1.1)'

const pool = http2
  ? `run in parallel over one connection, ${parallel} allowed (HTTP/2)`
  : `run in parallel over ${parallel} connections (HTTP/1.1)`

await describe('XML-RPC calls over several connections', async () => {
  await it(oneConnection, async () => {
    const db = getXmlRpcClient(connectionOptions)
    assertOneConnection(await measure(() => db.queries.readAll(slowQuery)), 'queries')
  })

  await it(pool, async () => {
    const db = getXmlRpcClient({ ...connectionOptions, connections: parallel })
    assertPool(await measure(async () => {
      const { pages } = await db.queries.readAll(slowQuery)
      assert.strictEqual(Buffer.concat(pages).toString(), 'done')
    }), 'queries')
  })
})

await describe('REST requests over several connections', async () => {
  await it(oneConnection, async () => {
    const rest = getRestClient(connectionOptions)
    assertOneConnection(await measure(() => rest.post(slowQuery, 'db')), 'requests')
  })

  await it(pool, async () => {
    const rest = getRestClient({ ...connectionOptions, connections: parallel })
    assertPool(await measure(async () => {
      const response = await rest.post(slowQuery, 'db')
      assert.strictEqual(response.statusCode, 200)
    }), 'requests')
  })
})
