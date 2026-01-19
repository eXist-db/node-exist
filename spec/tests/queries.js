import test from 'node:test'
import assert from 'node:assert'
import { connect } from '../../index.js'
import { envOptions } from '../connection.js'

await test('call remote procedure through methodCall', async function () {
  const db = connect(envOptions)
  let resultHandle = null
  const queryString = '<result>{for $i in (1,2) return <i>{$i + $a}</i>}</result>'
  const queryOptions = { variables: { a: 1 } }
  const resultMatcher = /^<result>\s*<i>2<\/i>\s*<i>3<\/i>\s*<\/result>$/

  try {
    resultHandle = await db.queries.execute(queryString, queryOptions, null)
    assert.ok(resultHandle >= 0, 'got handle')
    const hits = await db.queries.count(resultHandle)
    assert.strictEqual(hits, 1, 'got one hit')
    const results = await db.queries.retrieveAll(resultHandle, hits)
    const concatenatedBuffers = Buffer.concat(results)
    assert.ok(resultMatcher.test(concatenatedBuffers.toString()), 'got expected result')
    await db.queries.releaseResult(resultHandle)
  } catch (e) {
    assert.fail(e)
  }
})

await test('call promised query', async function () {
  const db = connect(envOptions)
  const queryString = 'for $i in (1, 2, 3) return $i'
  const options = { start: 2, limit: 1 }
  const expectedResult = '<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist" hits="3" start="2" count="1">\n<exist:value type="xs:integer">2</exist:value>\n</exist:result>'

  try {
    const result = await db.queries.read(queryString, options)
    assert.strictEqual(result.toString(), expectedResult, 'got expected result')
  } catch (e) {
    assert.fail(e)
  }
})

await test('call queryAll method', async function () {
  const db = connect(envOptions)
  const queryString = 'for $i in (1,2) return $i + $a'
  const queryOptions = { variables: { a: 10 } }
  const expectedResult = '11,12'

  try {
    const result = await db.queries.readAll(queryString, queryOptions)
    const csv = result.pages.map(function (p) { return p.toString() }).join(',')
    assert.strictEqual(result.pages.length, result.hits, 'all pages retrieved')
    assert.strictEqual(csv, expectedResult, 'got expected result')
  } catch (e) {
    assert.fail(e)
  }
})

await test('call queryAll method without options', async function () {
  const db = connect(envOptions)
  const queryString = 'for $i in (1,2) return $i + 10'
  const expectedResult = '11,12'

  try {
    const result = await db.queries.readAll(queryString)
    const csv = result.pages.map(function (p) { return p.toString() }).join(',')
    assert.strictEqual(result.pages.length, result.hits, 'all pages retrieved')
    assert.strictEqual(csv, expectedResult, 'got expected result')
    assert.deepStrictEqual(result.options, {}, 'options default to empty object')
  } catch (e) {
    assert.fail(e)
  }
})

await test('run query, expect XML', async function () {
  // not implemented yet
})

await test('run query, expect json', async function () {
  // not implemented yet
})
