const test = require('tape')
const { readFileSync, createReadStream, createWriteStream, unlinkSync } = require('fs')
const { getRestClient, connect } = require('../../index')
const { envOptions } = require('../connection')

// rest client interactions
test('with rest client', async function (t) {
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

  t.test('upload file (buffer) returns Created', async function (st) {
    try {
      const res = await rc.put(readFileSync('spec/files/test.xml'), 'db/rest-test/from-buffer.xml')
      st.equal(res.statusCode, 201)
      st.end()
    } catch (e) {
      st.fail(e)
      st.end()
    }
  })

  t.test('create file from string returns Created', async function (st) {
    try {
      const res = await rc.put('this is a test', 'db/rest-test/from-string.txt')
      st.equal(res.statusCode, 201)
      st.end()
    } catch (e) {
      st.fail(e)
      st.end()
    }
  })

  t.test('upload invalid file (buffer) fails with Bad Request', async function (st) {
    try {
      const res = await rc.put(readFileSync('spec/files/invalid.xml'), 'db/rest-test/from-buffer-invalid.xml')
      st.fail(res)
      st.end()
    } catch (e) {
      st.equal(e.response.statusCode, 400)
      st.end()
    }
  })

  t.test('upload file (stream) returns Created', async function (st) {
    try {
      const res = await rc.put(createReadStream('spec/files/test.xml'), 'db/rest-test/from-stream.xml')
      st.equal(res.statusCode, 201)
      st.end()
    } catch (e) {
      st.fail(e)
      st.end()
    }
  })

  t.test('upload invalid file (stream) fails with Bad Request', async function (st) {
    try {
      const res = await rc.put(createReadStream('spec/files/invalid.xml'), 'db/rest-test/from-stream-invalid.xml')
      st.fail(res)
      st.end()
    } catch (e) {
      st.equal(e.response.statusCode, 400)
      st.end()
    }
  })

  t.test('create file from Generator returns Created', async function (st) {
    try {
      const generator = function * () {
        let index = 0

        while (index < 3) {
          yield `${index++}\n`
        }
      }
      const res = await rc.put(generator, 'db/rest-test/from-generator.txt')
      st.equal(res.statusCode, 201)
      const { body } = await rc.get('db/rest-test/from-generator.txt')
      st.equal(body, '0\n1\n2\n')
      st.end()
    } catch (e) {
      st.fail(e)
      st.end()
    }
  })

  t.test('create file from Async Generator returns Created', async function (st) {
    try {
      const generator = async function * () {
        let index = 0

        while (index < 3) {
          yield await new Promise(resolve => setTimeout(resolve(`${index++}\n`), 100))
        }
      }
      const res = await rc.put(generator, 'db/rest-test/from-async-generator.txt')
      st.equal(res.statusCode, 201)
      const { body } = await rc.get('db/rest-test/from-async-generator.txt')
      st.equal(body, '0\n1\n2\n')
      st.end()
    } catch (e) {
      st.fail(e)
      st.end()
    }
  })

  t.test('create file from FormData returns Created', async function (st) {
    st.skip('FormData is still experimental')
    // try {
    //   const data = new FormData()
    //   data.append('test', 'value')
    //   data.append('another', 'value')
    //   const res = await rc.put(data, 'db/rest-test/from-form-data.txt')
    //   st.equal(res.statusCode, 201)
    //   const { body } = await rc.get('db/rest-test/from-form-data.txt')
    //   st.equal(body, '0\n1\n2\n')
    // } catch (e) {
    //   st.fail(e)
    // }
  })

  t.test('read xml file (buffer)', async function (st) {
    try {
      await rc.put(testBuffer, 'db/rest-test/read-test-buffer.xml')
      const res = await rc.get('db/rest-test/read-test-buffer.xml')
      st.equal(res.statusCode, 200)
      st.equal(res.body, '<collection>\n    <item property="value"/>\n</collection>')
      st.end()
    } catch (e) {
      st.fail(e)
      st.end()
    }
  })

  t.test('non-existent file returns 404', async function (st) {
    try {
      const res = await rc.get('db/rest-test/non-existent.file')
      st.fail(res)
      st.end()
    } catch (e) {
      st.equal(e.response.statusCode, 404)
      st.end()
    }
  })

  t.test('stream xml file from db', async function (st) {
    try {
      await rc.put(testBuffer, 'db/rest-test/read-test-stream.xml')
      const writeStream = createWriteStream('stream-test.xml')
      const res = await rc.get('db/rest-test/read-test-stream.xml', {}, writeStream)
      st.equal(res.statusCode, 200)
      const written = readFileSync('stream-test.xml')
      st.equal(written.toString(), '<collection>\n    <item property="value"/>\n</collection>')
      unlinkSync('stream-test.xml')
      st.end()
    } catch (e) {
      st.equal(e.response.statusCode, 400)
      st.end()
    }
  })
  t.test('stream non-existent file returns error, does not write file', async function (st) {
    const writeStream = createWriteStream('stream-fail-test.xml')

    try {
      const res = await rc.get('db/rest-test/non-existent.file', {}, writeStream)
      st.fail(res)
      st.end()
    } catch (e) {
      st.ok(writeStream.destroyed)
      st.equal(writeStream.bytesWritten, 0)
      st.equal(e.response.statusCode, 404)
      st.end()
    }
  })

  t.test('stream xml file from db', async function (st) {
    try {
      await rc.put(testBuffer, 'db/rest-test/read-test-stream.xml')
      const writeStream = createWriteStream('stream-test.xml')
      const res = await rc.get('db/rest-test/read-test-stream.xml', {}, writeStream)
      st.equal(res.statusCode, 200, 'server responded with status ' + res.statusCode)
      const written = readFileSync('stream-test.xml')
      st.equal(written.toString(), '<collection>\n    <item property="value"/>\n</collection>')
      st.end()
    } catch (e) {
      st.fail(e)
      st.end()
    }
  })

  t.test('getting a collection will return the file listing as xml', async function (st) {
    try {
      const res = await rc.get('db/rest-test')
      st.equal(res.statusCode, 200, 'server responded with status ' + res.statusCode)

      const lines = res.body.split('\n')
      st.equal(lines[0], '<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist">')
      st.ok(lines[1].startsWith('    <exist:collection name="/db/rest-test"'))

      st.end()
    } catch (e) {
      st.fail(e)
      st.end()
    }
  })

  t.test('collection listing does honor neither _wrap nor _indent', async function (st) {
    try {
      const res = await rc.get('db/rest-test', { _wrap: 'no', _indent: 'no' })
      st.equal(res.statusCode, 200, 'server responded with status ' + res.statusCode)

      const lines = res.body.split('\n')
      st.equal(lines[0], '<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist">')
      st.ok(lines[1].startsWith('    <exist:collection name="/db/rest-test"'))

      st.end()
    } catch (e) {
      st.fail(e)
      st.end()
    }
  })

  t.test('get in combination with _query allows to get unindented, unwrapped result', async function (st) {
    try {
      const res = await rc.get('db/rest-test', { _wrap: 'no', _indent: 'no', _query })
      st.equal(res.statusCode, 200, 'server responded with status ' + res.statusCode)
      const lines = res.body.split('\n')
      st.equal(lines.length, 1, 'body is a single line')
      st.ok(lines[0].startsWith('<c name="/db/rest-test"><r name="from-async-generator.txt"/><r name='), lines[0])

      st.end()
    } catch (e) {
      st.fail(e)
      st.end()
    }
  })

  t.test('get in combination with _query allows to get indented, wrapped result', async function (st) {
    try {
      const res = await rc.get('db/rest-test', { _wrap: 'yes', _indent: 'yes', _query })
      st.equal(res.statusCode, 200, 'server responded with status ' + res.statusCode)
      st.equal(res.hits, 1, 'result returned ' + res.hits + ' hit(s)')
      st.equal(res.start, 1, 'start is ' + res.start)
      st.equal(res.count, 1, 'count is ' + res.count)

      const lines = res.body.split('\n')
      st.ok(lines[0].startsWith('<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist"'))
      st.equal(lines[1], '    <c name="/db/rest-test">')
      st.equal(lines[2], '        <r name="from-async-generator.txt"/>')

      st.end()
    } catch (e) {
      st.fail(e)
      st.end()
    }
  })

  t.test('post returns wrapped and indented result', async function (st) {
    try {
      const res = await rc.post(_query, 'db/rest-test')
      st.equal(res.statusCode, 200, 'server responded with status ' + res.statusCode)
      st.equal(res.hits, 1, 'result returned ' + res.hits + ' hit(s)')
      st.equal(res.start, 1, 'start is ' + res.start)
      st.equal(res.count, 1, 'count is ' + res.count)

      const lines = res.body.split('\n')
      st.ok(lines[0].startsWith('<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist"'))
      st.equal(lines[1], '    <c name="/db/rest-test">')
      st.equal(lines[2], '        <r name="from-async-generator.txt"/>')

      st.end()
    } catch (e) {
      st.fail(e)
      st.end()
    }
  })

  t.test('post returns wrapped and unindented result', async function (st) {
    try {
      const res = await rc.post(_query, 'db/rest-test', { indent: 'no' })
      st.equal(res.statusCode, 200, 'server responded with status ' + res.statusCode)
      st.equal(res.hits, 1, 'result returned ' + res.hits + ' hit(s)')
      st.equal(res.start, 1, 'start is ' + res.start)
      st.equal(res.count, 1, 'count is ' + res.count)
      const lines = res.body.split('\n')
      st.equal(lines.length, 1, 'body consists of a single line')
      st.ok(lines[0].startsWith('<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist"'))
      st.ok(lines[0].includes('<c name="/db/rest-test">'), 'contains result')
      st.end()
    } catch (e) {
      st.fail(e)
      st.end()
    }
  })

  t.test('post honors start and max', async function (st) {
    try {
      const res = await rc.post(xqueryMainModule, 'db/rest-test', { start: 1, max: 1 })
      st.equal(res.statusCode, 200, 'server responded with status ' + res.statusCode)
      st.equal(res.hits, 7, 'result returned ' + res.hits + ' hit(s)')
      st.equal(res.start, 1, 'start is ' + res.start)
      st.equal(res.count, 1, 'count is ' + res.count)

      const lines = res.body.split('\n')
      st.equal(lines.length, 3, 'body consists of 3 lines')
      st.ok(lines[0].startsWith('<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist"'))
      st.equal(lines[1], '    <exist:value exist:type="xs:string">from-async-generator.txt</exist:value>')
      st.end()
    } catch (e) {
      st.fail(e)
      st.end()
    }
  })

  t.test('post honors just start', async function (st) {
    try {
      const res = await rc.post(xqueryMainModule, 'db/rest-test', { start: 2 })
      st.equal(res.statusCode, 200, 'server responded with status ' + res.statusCode)
      st.equal(res.hits, 7, 'result returned ' + res.hits + ' hit(s)')
      st.equal(res.start, 2, 'start is ' + res.start)
      st.equal(res.count, 6, 'count is ' + res.count)
      const lines = res.body.split('\n')
      st.equal(lines.length, 8, 'body consists of 8 lines')
      st.ok(lines[0].startsWith('<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist"'))
      st.equal(lines[1], '    <exist:value exist:type="xs:string">from-buffer.xml</exist:value>')
      st.end()
    } catch (e) {
      st.fail(e)
      st.end()
    }
  })

  t.test('post honors cache', async function (st) {
    try {
      const res = await rc.post(xqueryMainModule, 'db/rest-test', { cache: 'yes', start: 1, max: 1 })
      st.equal(res.statusCode, 200, 'server responded with status ' + res.statusCode)
      st.isNotEqual(res.session, -1, 'Got session ' + res.session)
      st.equal(res.hits, 7, 'result returned ' + res.hits + ' hit(s)')
      st.equal(res.start, 1, 'start is ' + res.start)
      st.equal(res.count, 1, 'count is ' + res.count)

      const lines = res.body.split('\n')
      st.equal(lines.length, 3, 'body consists of 3 lines')
      st.equal(lines[1], '    <exist:value exist:type="xs:string">from-async-generator.txt</exist:value>')

      const res2 = await rc.post(xqueryMainModule, 'db/rest-test', { session: res.session, start: 2, max: 1 })
      const lines2 = res2.body.split('\n')
      st.equal(res.session, res2.session, 'same session was returned (' + res.session + ', ' + res2.session + ')')
      st.equal(res2.hits, 7, 'result returned ' + res2.hits + ' hit(s)')
      st.equal(res2.start, 2, 'start is ' + res2.start)
      st.equal(res2.count, 1, 'count is ' + res2.count)

      st.equal(lines2.length, 3, 'body consists of 3 lines')
      st.equal(lines2[1], '    <exist:value exist:type="xs:string">from-buffer.xml</exist:value>')

      const { statusCode } = await rc.get('db', { _release: res.session })
      st.equal(statusCode, 200, 'session ' + res.session + ' released')
      st.end()
    } catch (e) {
      console.error(e)
      st.fail(e)
      st.end()
    }
  })

  t.teardown(async _ => {
    await db.collections.remove(testCollection)
    unlinkSync('stream-fail-test.xml')
    unlinkSync('stream-test.xml')
  })
})
