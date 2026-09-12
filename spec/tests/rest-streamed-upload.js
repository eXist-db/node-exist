import { describe, it, after } from 'node:test'
import assert from 'node:assert'
import dc from 'node:diagnostics_channel'
import { createReadStream, readFileSync } from 'node:fs'
import { getRestClient, getXmlRpcClient } from '../../index.js'
import { envOptions } from '../connection.js'

// eXist-db 4 (Jetty 9.4.14) can close a connection right after it answered a
// streamed upload, without announcing it. The next request on that connection
// then fails with "other side closed". Streamed uploads to eXist-db 4 must not
// leave their connection open, later versions keep reusing connections.
await describe('connections after streamed uploads', async () => {
  const collection = 'db/rest-stream-test'
  const db = getXmlRpcClient(envOptions)
  const major = parseInt(await db.server.version(), 10)

  const requests = []
  const recordRequest = ({ request, socket }) => {
    requests.push({ method: request.method, path: request.path, socket })
  }
  dc.subscribe('undici:client:sendHeaders', recordRequest)
  after(() => dc.unsubscribe('undici:client:sendHeaders', recordRequest))

  const isVersionQuery = request => request.path.includes('get-version')
  const isForCollection = request => request.path.includes(collection)
  const generator = function * () {
    yield 'streamed\n'
  }

  await it('does not ask for the server version for uploads of known length', async () => {
    const rc = getRestClient(envOptions)
    requests.length = 0
    await rc.put(readFileSync('spec/files/test.xml'), `${collection}/from-buffer.xml`)
    await rc.put('<from-string/>', `${collection}/from-string.xml`)
    assert.strictEqual(requests.filter(isVersionQuery).length, 0)
  })

  await it('asks for the server version once per client for streamed uploads', async () => {
    const rc = getRestClient(envOptions)
    requests.length = 0
    await rc.put(createReadStream('spec/files/test.xml'), `${collection}/from-stream.xml`)
    await rc.put(generator, `${collection}/from-generator.txt`)
    assert.strictEqual(requests.filter(isVersionQuery).length, 1)
  })

  const expectation = major < 5
    ? 'opens a new connection after a streamed upload to eXist-db 4'
    : 'reuses the connection after a streamed upload'

  await it(expectation, async () => {
    const rc = getRestClient(envOptions)
    // the first streamed upload of a client also asks for the server version
    await rc.put(generator, `${collection}/warm-up.txt`)
    requests.length = 0

    await rc.put(createReadStream('spec/files/test.xml'), `${collection}/reuse.xml`)
    await rc.get(`${collection}/reuse.xml`)

    const [upload, read] = requests.filter(isForCollection)
    assert.strictEqual(upload.method, 'PUT')
    assert.strictEqual(read.method, 'GET')
    if (major < 5) {
      assert.notStrictEqual(read.socket, upload.socket, 'connection was reused')
    } else {
      assert.strictEqual(read.socket, upload.socket, 'connection was not reused')
    }
  })

  await it('teardown', async () => {
    await db.collections.remove(`/${collection}`)
  })
})
