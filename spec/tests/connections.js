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
  await t.test('is not set by default', () => {
    assert.strictEqual(getXmlRpcClient(connectionOptions).connection.connections, undefined)
    assert.strictEqual(getRestClient(connectionOptions).connection.connections, undefined)
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
 * the requests ran in batches of `atOnce`, over `connections` connections
 * @param {{ms: number, opened: number}} measured what the client did
 * @param {{atOnce: number, connections: number, what: string}} expected how many ran at the same time, over how
 *   many connections, and what was sent, for the messages
 */
function assertBatches ({ ms, opened }, { atOnce, connections, what }) {
  const batches = Math.ceil(parallel / atOnce)
  const message = `${parallel} ${what} over ${transport}, ${atOnce} at a time, took ${ms} ms`
  assert.strictEqual(opened, connections, `${parallel} ${what} over ${transport} opened ${opened} connections`)
  assert.ok(ms >= batches * wait * 0.9, message)
  if (batches < parallel) {
    // allow for TLS handshakes of new connections, but stay below one more batch
    assert.ok(ms < Math.min(batches * wait + 1200, (parallel - 0.5) * wait), message)
  }
}

/**
 * the clients to test, each with a function that sends the slow query once
 */
const clients = {
  'XML-RPC calls': {
    what: 'queries',
    connect: options => {
      const db = getXmlRpcClient(options)
      return async () => {
        const { pages } = await db.queries.readAll(slowQuery)
        assert.strictEqual(Buffer.concat(pages).toString(), 'done')
      }
    }
  },
  'REST requests': {
    what: 'requests',
    connect: options => {
      const rest = getRestClient(options)
      return async () => {
        const response = await rest.post(slowQuery, 'db')
        assert.strictEqual(response.statusCode, 200)
      }
    }
  }
}

for (const [name, { what, connect }] of Object.entries(clients)) {
  await describe(name, async () => {
    // not limited: the protocol decides
    await it(http2
      ? 'run in parallel over one connection by default (HTTP/2)'
      : 'run one after the other over one connection by default (HTTP/1.1)', async () => {
      const run = connect(connectionOptions)
      assertBatches(await measure(run), { atOnce: http2 ? parallel : 1, connections: 1, what })
    })

    // limited: at most `connections` at a time, whatever the protocol
    for (const limit of [parallel, 2, 1]) {
      await it(`run ${limit} at a time over ${limit} connection${limit > 1 ? 's' : ''} with connections: ${limit} (${transport})`, async () => {
        const run = connect({ ...connectionOptions, connections: limit })
        assertBatches(await measure(run), { atOnce: limit, connections: limit, what })
      })
    }
  })
}
