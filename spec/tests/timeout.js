import { test, describe, it } from 'node:test'
import assert from 'node:assert'

import { getXmlRpcClient, getRestClient, readOptionsFromEnv } from '../../index.js'
import * as app from '../../xmlrpc/app.js'
import * as queries from '../../xmlrpc/queries.js'
import * as verbs from '../../rest/verbs.js'
import { envOptions } from '../connection.js'

// a timeout set in the environment of the test run must not leak into these tests
const { timeout, ...connectionOptions } = envOptions

// takes longer than shortTimeout, but keeps the suite fast
const slowQuery = 'util:wait(1500), "done"'
const shortTimeout = 500

/**
 * stands in for an XML-RPC client and records every call
 * @param {Object} responses canned result per method name
 * @returns {{calls: Array, methodCall: function}} recording client
 */
function recordingClient (responses) {
  const calls = []
  const methodCall = async (methodName, params, callOptions) => {
    calls.push({ methodName, params, callOptions })
    return responses[methodName]
  }
  return { calls, methodCall }
}

const queryResponses = {
  executeQuery: 1,
  getHits: 1,
  retrieve: Buffer.from('{"success":true,"result":{}}'),
  releaseQueryResult: true,
  query: Buffer.from('<exist:result/>')
}

/**
 * stands in for an undici client and records every request
 * @returns {{requests: Array, request: function}} recording client
 */
function recordingRestClient () {
  const requests = []
  const request = async (options) => {
    requests.push(options)
    return { statusCode: 200, headers: {}, body: { text: async () => 'done' } }
  }
  return { requests, request }
}

test('EXISTDB_TIMEOUT', async (t) => {
  await t.test('is not set when absent or empty', () => {
    delete process.env.EXISTDB_TIMEOUT
    assert.ok(!('timeout' in readOptionsFromEnv()))
    process.env.EXISTDB_TIMEOUT = ''
    assert.ok(!('timeout' in readOptionsFromEnv()))
  })

  await t.test('is read in milliseconds', () => {
    process.env.EXISTDB_TIMEOUT = '600000'
    assert.strictEqual(readOptionsFromEnv().timeout, 600000)
  })

  await t.test('accepts 0 to disable the timeout', () => {
    process.env.EXISTDB_TIMEOUT = '0'
    assert.strictEqual(readOptionsFromEnv().timeout, 0)
  })

  await t.test('rejects anything but a non-negative integer', () => {
    for (const value of ['-1', '1.5', 'ten', '1e3']) {
      process.env.EXISTDB_TIMEOUT = value
      assert.throws(() => readOptionsFromEnv(), /EXISTDB_TIMEOUT/, value)
    }
  })

  delete process.env.EXISTDB_TIMEOUT
})

test('connections have no timeout by default', () => {
  assert.strictEqual(getXmlRpcClient(connectionOptions).connection.timeout, 0)
  assert.strictEqual(getRestClient(connectionOptions).connection.timeout, 0)
})

test('connection timeout option is passed on', () => {
  const options = { ...connectionOptions, timeout: 1000 }
  assert.strictEqual(getXmlRpcClient(options).connection.timeout, 1000)
  assert.strictEqual(getRestClient(options).connection.timeout, 1000)
})

test('per-call timeout', async (t) => {
  await t.test('queries.execute uses it for the call and does not send it', async () => {
    const client = recordingClient(queryResponses)
    await queries.execute(client, '1', { variables: { a: 1 }, timeout: 0 })
    const [call] = client.calls
    assert.deepStrictEqual(call.params[1], { variables: { a: 1 } })
    assert.deepStrictEqual(call.callOptions, { timeout: 0 })
  })

  await t.test('queries.read uses it for the call and does not send it', async () => {
    const client = recordingClient(queryResponses)
    await queries.read(client, '1', { start: 2, limit: 1, timeout: 0 })
    const [call] = client.calls
    assert.deepStrictEqual(call.params, ['1', 1, 2, {}])
    assert.deepStrictEqual(call.callOptions, { timeout: 0 })
  })

  await t.test('queries.readAll passes it on to every call', async () => {
    const client = recordingClient(queryResponses)
    const result = await queries.readAll(client, '1', { timeout: 250 })
    assert.deepStrictEqual(
      client.calls.map(call => call.methodName),
      ['executeQuery', 'getHits', 'retrieve', 'releaseQueryResult']
    )
    for (const call of client.calls) {
      assert.deepStrictEqual(call.callOptions, { timeout: 250 }, call.methodName)
    }
    assert.deepStrictEqual(client.calls[0].params[1], {})
    assert.strictEqual(result.hits, 1)
  })

  await t.test('queries.readAll without it leaves the connection default', async () => {
    const client = recordingClient(queryResponses)
    await queries.readAll(client, '1', { variables: {} })
    for (const call of client.calls) {
      assert.strictEqual(call.callOptions?.timeout, undefined, call.methodName)
    }
  })

  await t.test('rest post uses it for the request and does not send it', async () => {
    const client = recordingRestClient()
    await verbs.post(client, '1', 'db', { start: 1, timeout: 0 })
    const [request] = client.requests
    assert.strictEqual(request.headersTimeout, 0)
    assert.strictEqual(request.bodyTimeout, 0)
    assert.doesNotMatch(request.body, /timeout/)
    assert.match(request.body, /start="1"/)
  })

  await t.test('rest post without it leaves the connection default', async () => {
    const client = recordingRestClient()
    await verbs.post(client, '1', 'db')
    const [request] = client.requests
    assert.ok(!('headersTimeout' in request))
    assert.ok(!('bodyTimeout' in request))
  })
})

test('package operations never time out', async (t) => {
  await t.test('app.upload', async () => {
    const client = recordingClient({ existsAndCanOpenCollection: true, upload: 'handle', parseLocal: true })
    const result = await app.upload(client, Buffer.from('xar'), 'test.xar')
    assert.strictEqual(result.success, true)
    const transfers = client.calls.filter(call => ['upload', 'parseLocal'].includes(call.methodName))
    assert.strictEqual(transfers.length, 2)
    for (const call of transfers) {
      assert.deepStrictEqual(call.callOptions, { timeout: 0 }, call.methodName)
    }
  })

  for (const [operation, argument] of [['install', 'test.xar'], ['deploy', 'http://test'], ['remove', 'http://test']]) {
    await t.test(`app.${operation}`, async () => {
      const client = recordingClient(queryResponses)
      const result = await app[operation](client, argument)
      assert.notStrictEqual(result.success, false, result.error?.message)
      assert.ok(client.calls.length > 0)
      for (const call of client.calls) {
        assert.deepStrictEqual(call.callOptions, { timeout: 0 }, call.methodName)
      }
    })
  }
})

await describe('XML-RPC timeouts against the database', async () => {
  const db = getXmlRpcClient({ ...connectionOptions, timeout: shortTimeout })

  await it('aborts a query exceeding the connection timeout', async () => {
    await assert.rejects(db.queries.readAll(slowQuery), { code: 'UND_ERR_HEADERS_TIMEOUT' })
  })

  await it('lets the same query finish with a per-call timeout of 0', async () => {
    const { pages } = await db.queries.readAll(slowQuery, { timeout: 0 })
    assert.strictEqual(Buffer.concat(pages).toString(), 'done')
  })

  await it('applies a per-call timeout on a connection without one', async () => {
    const unlimited = getXmlRpcClient(connectionOptions)
    await assert.rejects(unlimited.queries.read(slowQuery, { timeout: shortTimeout }), { code: 'UND_ERR_HEADERS_TIMEOUT' })
  })
})

await describe('REST timeouts against the database', async () => {
  const rest = getRestClient({ ...connectionOptions, timeout: shortTimeout })

  await it('aborts a query exceeding the connection timeout', async () => {
    await assert.rejects(rest.post(slowQuery, 'db'), { code: 'UND_ERR_HEADERS_TIMEOUT' })
  })

  await it('lets the same query finish with a per-call timeout of 0', async () => {
    const response = await rest.post(slowQuery, 'db', { timeout: 0 })
    assert.strictEqual(response.statusCode, 200)
    assert.match(response.bodyText, /done/)
  })
})
