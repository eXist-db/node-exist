import { describe, it } from 'node:test'
import assert from 'node:assert'
import { readFileSync, createReadStream, createWriteStream, unlinkSync } from 'fs'
import { getRestClient, connect } from '../../index.js'
import { envOptions } from '../connection.js'

// rest client interactions
await describe('with rest client', async function () {
  const testCollection = '/db/rest-test'
  const _query = '<c name="/db/rest-test">{' +
    'for $r in xmldb:get-child-resources("/db/rest-test") order by $r return <r name="{$r}" />' +
    '}</c>'

  const xqueryMainModule = `xquery version "3.1";
for $r in xmldb:get-child-resources("/db/rest-test")
order by $r
return $r
`

  const db = connect(envOptions)
  const rc = await getRestClient(envOptions)

  await db.collections.create(testCollection)
  const testBuffer = Buffer.from('<collection>\n    <item property="value"/>\n</collection>')

  await it('upload file (buffer) returns Created', async function () {
    try {
      const res = await rc.put(readFileSync('spec/files/test.xml'), 'db/rest-test/from-buffer.xml')
      assert.strictEqual(res.statusCode, 201)
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('create file from string returns Created', async function () {
    try {
      const res = await rc.put('this is a test', 'db/rest-test/from-string.txt')
      assert.strictEqual(res.statusCode, 201)
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('upload invalid file (buffer) fails with Bad Request', async function () {
    try {
      const res = await rc.put(readFileSync('spec/files/invalid.xml'), 'db/rest-test/from-buffer-invalid.xml')
      assert.fail(res)
    } catch (e) {
      assert.strictEqual(e.response.statusCode, 400)
    }
  })

  await it('upload file (stream) returns Created', async function () {
    try {
      const res = await rc.put(createReadStream('spec/files/test.xml'), 'db/rest-test/from-stream.xml')
      assert.strictEqual(res.statusCode, 201)
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('upload invalid file (stream) fails with Bad Request', async function () {
    try {
      const res = await rc.put(createReadStream('spec/files/invalid.xml'), 'db/rest-test/from-stream-invalid.xml')
      assert.fail(res)
    } catch (e) {
      assert.strictEqual(e.response.statusCode, 400)
    }
  })

  await it('create file from Generator returns Created', async function () {
    try {
      const generator = function * () {
        let index = 0

        while (index < 3) {
          yield `${index++}\n`
        }
      }
      const res = await rc.put(generator, 'db/rest-test/from-generator.txt')
      assert.strictEqual(res.statusCode, 201)
      const { body } = await rc.get('db/rest-test/from-generator.txt')
      assert.strictEqual(body, '0\n1\n2\n')
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('create file from Async Generator returns Created', async function () {
    try {
      const generator = async function * () {
        let index = 0

        while (index < 3) {
          yield await new Promise(resolve => setTimeout(resolve(`${index++}\n`), 100))
        }
      }
      const res = await rc.put(generator, 'db/rest-test/from-async-generator.txt')
      assert.strictEqual(res.statusCode, 201)
      const { body } = await rc.get('db/rest-test/from-async-generator.txt')
      assert.strictEqual(body, '0\n1\n2\n')
    } catch (e) {
      assert.fail(e)
    }
  })

  // await t.test('create file from FormData returns Created', async function () {
  // FormData is still experimental
  // try {
  //   const data = new FormData()
  //   data.append('test', 'value')
  //   data.append('another', 'value')
  //   const res = await rc.put(data, 'db/rest-test/from-form-data.txt')
  //   assert.strictEqual(res.statusCode, 201)
  //   const { body } = await rc.get('db/rest-test/from-form-data.txt')
  //   assert.strictEqual(body, '0\n1\n2\n')
  // } catch (e) {
  //   assert.fail(e)
  // }
  // })

  await it('read xml file (buffer)', async function () {
    try {
      await rc.put(testBuffer, 'db/rest-test/read-test-buffer.xml')
      const res = await rc.get('db/rest-test/read-test-buffer.xml')
      assert.strictEqual(res.statusCode, 200)
      assert.strictEqual(res.body, '<collection>\n    <item property="value"/>\n</collection>')
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('non-existent file returns 404', async function () {
    try {
      const res = await rc.get('db/rest-test/non-existent.file')
      assert.fail(res)
    } catch (e) {
      assert.strictEqual(e.response.statusCode, 404)
    }
  })

  await it('stream xml file from db', async function () {
    try {
      await rc.put(testBuffer, 'db/rest-test/read-test-stream.xml')
      const writeStream = createWriteStream('stream-test.xml')
      const res = await rc.get('db/rest-test/read-test-stream.xml', {}, writeStream)
      assert.strictEqual(res.statusCode, 200)
      const written = readFileSync('stream-test.xml')
      assert.strictEqual(written.toString(), '<collection>\n    <item property="value"/>\n</collection>')
      unlinkSync('stream-test.xml')
    } catch (e) {
      assert.strictEqual(e.response.statusCode, 400)
    }
  })

  await it('stream non-existent file returns error, does not write file', async function () {
    const writeStream = createWriteStream('stream-fail-test.xml')

    try {
      const res = await rc.get('db/rest-test/non-existent.file', {}, writeStream)
      assert.fail(res)
    } catch (e) {
      assert.ok(writeStream.destroyed)
      assert.strictEqual(writeStream.bytesWritten, 0)
      assert.strictEqual(e.response.statusCode, 404)
    }
  })

  await it('stream xml file from db', async function () {
    try {
      await rc.put(testBuffer, 'db/rest-test/read-test-stream.xml')
      const writeStream = createWriteStream('stream-test.xml')
      const res = await rc.get('db/rest-test/read-test-stream.xml', {}, writeStream)
      assert.strictEqual(res.statusCode, 200, 'server responded with status ' + res.statusCode)
      const written = readFileSync('stream-test.xml')
      assert.strictEqual(written.toString(), '<collection>\n    <item property="value"/>\n</collection>')
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('getting a collection will return the file listing as xml', async function () {
    try {
      const res = await rc.get('db/rest-test')
      assert.strictEqual(res.statusCode, 200, 'server responded with status ' + res.statusCode)

      const lines = res.body.split('\n')
      assert.strictEqual(lines[0], '<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist">')
      assert.ok(lines[1].startsWith('    <exist:collection name="/db/rest-test"'))
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('collection listing does honor neither _wrap nor _indent', async function () {
    try {
      const res = await rc.get('db/rest-test', { _wrap: 'no', _indent: 'no' })
      assert.strictEqual(res.statusCode, 200, 'server responded with status ' + res.statusCode)

      const lines = res.body.split('\n')
      assert.strictEqual(lines[0], '<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist">')
      assert.ok(lines[1].startsWith('    <exist:collection name="/db/rest-test"'))
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('get in combination with _query allows to get unindented, unwrapped result', async function () {
    try {
      const res = await rc.get('db/rest-test', { _wrap: 'no', _indent: 'no', _query })
      assert.strictEqual(res.statusCode, 200, 'server responded with status ' + res.statusCode)
      const lines = res.body.split('\n')
      assert.strictEqual(lines.length, 1, 'body is a single line')
      assert.ok(lines[0].startsWith('<c name="/db/rest-test"><r name="from-async-generator.txt"/><r name='), lines[0])
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('get in combination with _query allows to get indented, wrapped result', async function () {
    try {
      const res = await rc.get('db/rest-test', { _wrap: 'yes', _indent: 'yes', _query })
      assert.strictEqual(res.statusCode, 200, 'server responded with status ' + res.statusCode)
      assert.strictEqual(res.hits, 1, 'result returned ' + res.hits + ' hit(s)')
      assert.strictEqual(res.start, 1, 'start is ' + res.start)
      assert.strictEqual(res.count, 1, 'count is ' + res.count)

      const lines = res.body.split('\n')
      assert.ok(lines[0].startsWith('<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist"'))
      assert.strictEqual(lines[1], '    <c name="/db/rest-test">')
      assert.strictEqual(lines[2], '        <r name="from-async-generator.txt"/>')
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('post returns wrapped and indented result', async function () {
    try {
      const res = await rc.post(_query, 'db/rest-test')
      assert.strictEqual(res.statusCode, 200, 'server responded with status ' + res.statusCode)
      assert.strictEqual(res.hits, 1, 'result returned ' + res.hits + ' hit(s)')
      assert.strictEqual(res.start, 1, 'start is ' + res.start)
      assert.strictEqual(res.count, 1, 'count is ' + res.count)

      const lines = res.body.split('\n')
      assert.ok(lines[0].startsWith('<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist"'))
      assert.strictEqual(lines[1], '    <c name="/db/rest-test">')
      assert.strictEqual(lines[2], '        <r name="from-async-generator.txt"/>')
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('post returns wrapped and unindented result', async function () {
    try {
      const res = await rc.post(_query, 'db/rest-test', { indent: 'no' })
      assert.strictEqual(res.statusCode, 200, 'server responded with status ' + res.statusCode)
      assert.strictEqual(res.hits, 1, 'result returned ' + res.hits + ' hit(s)')
      assert.strictEqual(res.start, 1, 'start is ' + res.start)
      assert.strictEqual(res.count, 1, 'count is ' + res.count)
      const lines = res.body.split('\n')
      assert.strictEqual(lines.length, 1, 'body consists of a single line')
      assert.ok(lines[0].startsWith('<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist"'))
      assert.ok(lines[0].includes('<c name="/db/rest-test">'), 'contains result')
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('post honors start and max', async function () {
    try {
      const res = await rc.post(xqueryMainModule, 'db/rest-test', { start: 1, max: 1 })
      assert.strictEqual(res.statusCode, 200, 'server responded with status ' + res.statusCode)
      assert.strictEqual(res.hits, 7, 'result returned ' + res.hits + ' hit(s)')
      assert.strictEqual(res.start, 1, 'start is ' + res.start)
      assert.strictEqual(res.count, 1, 'count is ' + res.count)

      const lines = res.body.split('\n')
      assert.strictEqual(lines.length, 3, 'body consists of 3 lines')
      assert.ok(lines[0].startsWith('<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist"'))
      assert.strictEqual(lines[1], '    <exist:value exist:type="xs:string">from-async-generator.txt</exist:value>')
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('post honors just start', async function () {
    try {
      const res = await rc.post(xqueryMainModule, 'db/rest-test', { start: 2 })
      assert.strictEqual(res.statusCode, 200, 'server responded with status ' + res.statusCode)
      assert.strictEqual(res.hits, 7, 'result returned ' + res.hits + ' hit(s)')
      assert.strictEqual(res.start, 2, 'start is ' + res.start)
      assert.strictEqual(res.count, 6, 'count is ' + res.count)
      const lines = res.body.split('\n')
      assert.strictEqual(lines.length, 8, 'body consists of 8 lines')
      assert.ok(lines[0].startsWith('<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist"'))
      assert.strictEqual(lines[1], '    <exist:value exist:type="xs:string">from-buffer.xml</exist:value>')
    } catch (e) {
      assert.fail(e)
    }
  })

  await it('post honors cache', async function () {
    try {
      const res = await rc.post(xqueryMainModule, 'db/rest-test', { cache: 'yes', start: 1, max: 1 })
      assert.strictEqual(res.statusCode, 200, 'server responded with status ' + res.statusCode)
      assert.notStrictEqual(res.session, -1, 'Got session ' + res.session)
      assert.strictEqual(res.hits, 7, 'result returned ' + res.hits + ' hit(s)')
      assert.strictEqual(res.start, 1, 'start is ' + res.start)
      assert.strictEqual(res.count, 1, 'count is ' + res.count)

      const lines = res.body.split('\n')
      assert.strictEqual(lines.length, 3, 'body consists of 3 lines')
      assert.strictEqual(lines[1], '    <exist:value exist:type="xs:string">from-async-generator.txt</exist:value>')

      const res2 = await rc.post(xqueryMainModule, 'db/rest-test', { session: res.session, start: 2, max: 1 })
      const lines2 = res2.body.split('\n')
      assert.strictEqual(res.session, res2.session, 'same session was returned (' + res.session + ', ' + res2.session + ')')
      assert.strictEqual(res2.hits, 7, 'result returned ' + res2.hits + ' hit(s)')
      assert.strictEqual(res2.start, 2, 'start is ' + res2.start)
      assert.strictEqual(res2.count, 1, 'count is ' + res2.count)

      assert.strictEqual(lines2.length, 3, 'body consists of 3 lines')
      assert.strictEqual(lines2[1], '    <exist:value exist:type="xs:string">from-buffer.xml</exist:value>')

      const { statusCode } = await rc.get('db', { _release: res.session })
      assert.strictEqual(statusCode, 200, 'session ' + res.session + ' released')
    } catch (e) {
      console.error(e)
      assert.fail(e)
    }
  })

  await it('teardown', async _ => {
    await db.collections.remove(testCollection)
    unlinkSync('stream-fail-test.xml')
    unlinkSync('stream-test.xml')
  })
})

await describe('with rest client over http', async function () {
  const modifiedOptions = Object.assign({ protocol: 'http:', port: '8080' }, envOptions)
  const rc = await getRestClient(modifiedOptions)

  await it('non-existent file returns 404', async function () {
    try {
      const res = await rc.get('db/rest-test/non-existent.file')
      assert.fail(res)
    } catch (e) {
      assert.strictEqual(e.response.statusCode, 404)
    }
  })

  await it('getting a collection will return the file listing as xml', async function () {
    try {
      const res = await rc.get('db')
      assert.strictEqual(res.statusCode, 200, 'server responded with status ' + res.statusCode)

      const lines = res.body.split('\n')
      assert.strictEqual(lines[0], '<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist">')
    } catch (e) {
      assert.fail(e)
    }
  })
})

await describe('with rest client connecting to exist-db.org as guest with standard port', async function () {
  const rc = await getRestClient({ host: 'exist-db.org', port: 443 })

  await it('getting a collection listing is rejected as unauthorized', async function () {
    try {
      const res = await rc.get('db')
      assert.fail(res)
    } catch (e) {
      assert.strictEqual(e.response.statusCode, 401)
    }
  })
})

await describe('with rest client connecting to exist-db.org from URL', async function () {
  const { protocol, hostname, port } = new URL('https://exist-db.org/')
  // NOTE: that host is mapped to hostname
  const rc = await getRestClient({ protocol, host: hostname, port })

  await it('getting a collection listing is rejected as unauthorized', async function () {
    try {
      const res = await rc.get('db')
      assert.fail(res)
    } catch (e) {
      assert.strictEqual(e.response.statusCode, 401)
    }
  })
})
