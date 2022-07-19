const test = require('tape')
const { readFileSync, createReadStream, createWriteStream, unlinkSync } = require('fs')
const { getRestClient, connect } = require('../../index')
const connectionOptions = require('../connection')

// rest client interactions
test('with rest client', async function (t) {
  const testCollection = '/db/rest-test'

  const db = connect(connectionOptions)
  const rc = await getRestClient(connectionOptions)

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
      const res = await rc.get('db/rest-test/read-test-stream.xml', writeStream)
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
      const res = await rc.get('db/rest-test/non-existent.file', writeStream)
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
      const res = await rc.get('db/rest-test/read-test-stream.xml', writeStream)
      st.equal(res.statusCode, 200)
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
      st.equal(res.statusCode, 200)

      const lines = res.body.split('\n')
      st.equal(lines[0], '<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist">')
      st.ok(lines[1].startsWith('    <exist:collection name="/db/rest-test"'))

      st.end()
    } catch (e) {
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
