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
const defaultConnections = 16

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
 * @param {number} count how many times
 * @returns {Promise<number>} milliseconds until all of them finished
 */
async function elapsed (run, count) {
  const start = Date.now()
  await Promise.all(Array.from({ length: count }, run))
  return Date.now() - start
}

test('connections option', async (t) => {
  await t.test('is 16 by default', () => {
    assert.strictEqual(getXmlRpcClient(connectionOptions).connection.connections, defaultConnections)
    assert.strictEqual(getRestClient(connectionOptions).connection.connections, defaultConnections)
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
 * @param {number} [count] how many times
 * @returns {Promise<{ms: number, opened: number, count: number}>} milliseconds until all finished,
 *   connections opened, requests sent
 */
async function measure (run, count = parallel) {
  let ms
  const opened = await openedConnections(async () => { ms = await elapsed(run, count) })
  return { ms, opened: opened.length, count }
}

/**
 * the requests ran in batches of `atOnce`, over as many connections
 * @param {{ms: number, opened: number, count: number}} measured what the client did
 * @param {{atOnce: number, limit: number, what: string, upperBound?: boolean}} expected how many ran at the same
 *   time, the client's limit, what was sent, for the messages, and whether to check that they did not take longer
 */
function assertBatches ({ ms, opened, count }, { atOnce, limit, what, upperBound = true }) {
  const batches = Math.ceil(count / atOnce)
  const message = `${count} ${what} over ${transport}, ${atOnce} at a time, took ${ms} ms`
  // never more connections than the limit; below it XML-RPC may open a few more than requests in
  // flight, as each query is several calls in a row and the pool does not see a connection free
  // again right away
  const connections = `${count} ${what} over ${transport}, limit ${limit}, opened ${opened} connections`
  assert.ok(opened >= atOnce, connections)
  assert.ok(opened <= limit, connections)
  assert.ok(ms >= batches * wait * 0.9, message)
  if (upperBound) {
    // less than one more batch, but at least two, for the TLS handshakes of new connections
    assert.ok(ms < Math.max(batches + 1, 3) * wait, message)
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
  await describe(`${name} (${transport})`, async () => {
    await it(`run ${parallel} at a time over ${parallel} connections by default`, async () => {
      assertBatches(await measure(connect(connectionOptions)), { atOnce: parallel, limit: defaultConnections, what })
    })

    // eXist-db has 20 brokers by default, so 20 requests would run at once without the limit;
    // how long that many take in parallel depends on the server's load, so only check the lower bound
    await it(`run at most ${defaultConnections} at a time by default`, async () => {
      const run = connect(connectionOptions)
      assertBatches(await measure(run, defaultConnections + parallel), { atOnce: defaultConnections, limit: defaultConnections, what, upperBound: false })
    })

    for (const limit of [2, 1]) {
      await it(`run ${limit} at a time over ${limit} connection${limit > 1 ? 's' : ''} with connections: ${limit}`, async () => {
        const run = connect({ ...connectionOptions, connections: limit })
        assertBatches(await measure(run), { atOnce: limit, limit, what })
      })
    }
  })
}
