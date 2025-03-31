const test = require('tape')
const { connect } = require('../../index')
const { envOptions } = require('../connection')

test('call remote procedure through methodCall', function (t) {
  const db = connect(envOptions)
  let resultHandle = null
  const queryString = '<result>{for $i in (1,2) return <i>{$i + $a}</i>}</result>'
  const queryOptions = { variables: { a: 1 } }
  const resultMatcher = /^<result>\s*<i>2<\/i>\s*<i>3<\/i>\s*<\/result>$/

  db.queries.execute(queryString, queryOptions, null)
    .then(function (handle) {
      resultHandle = handle
      t.ok(handle >= 0, 'got handle')
      return db.queries.count(handle)
    })
    .then(function (hits) {
      t.equal(hits, 1, 'got one hit')
      return db.queries.retrieveAll(resultHandle, hits)
    })
    .then(function (results) {
      const concatenatedBuffers = Buffer.concat(results)

      t.ok(resultMatcher.test(concatenatedBuffers.toString()), 'got expected result')
      return db.queries.releaseResult(resultHandle)
    })
    .then(function () {
      t.end()
    })
    .catch(function (e) {
      t.fail(e)
      t.end()
    })
})

test('call promised query', function (t) {
  const db = connect(envOptions)
  const queryString = 'for $i in (1, 2, 3) return $i'
  const options = { start: 2, limit: 1 }
  const expectedResult = '<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist" hits="3" start="2" count="1">\n<exist:value type="xs:integer">2</exist:value>\n</exist:result>'

  db.queries.read(queryString, options)
    .then(function (result) {
      t.equal(result.toString(), expectedResult, 'got expected result')
      t.end()
    })
    .catch(function (e) {
      t.fail(e)
      t.end()
    })
})

test('call queryAll method', function (t) {
  const db = connect(envOptions)
  const queryString = 'for $i in (1,2) return $i + $a'
  const queryOptions = { variables: { a: 10 } }
  const expectedResult = '11,12'

  db.queries.readAll(queryString, queryOptions)
    .then(function (result) {
      const csv = result.pages.map(function (p) { return p.toString() }).join(',')
      t.equal(result.pages.length, result.hits, 'all pages retrieved')
      t.equal(csv, expectedResult, 'got expected result')
      t.end()
    })
    .catch(function (e) {
      t.fail(e)
      t.end()
    })
})

test('call queryAll method without options', function (t) {
  const db = connect(envOptions)
  const queryString = 'for $i in (1,2) return $i + 10'
  const expectedResult = '11,12'

  db.queries.readAll(queryString)
    .then(function (result) {
      const csv = result.pages.map(function (p) { return p.toString() }).join(',')
      t.equal(result.pages.length, result.hits, 'all pages retrieved')
      t.equal(csv, expectedResult, 'got expected result')
      t.deepEqual(result.options, {}, 'options default to empty object')
      t.end()
    })
    .catch(function (e) {
      t.fail(e)
      t.end()
    })
})

test('run query, expect XML', function (t) {
  t.skip('not implemented yet')
  t.end()
})

test('run query, expect json', function (t) {
  t.skip('not implemented yet')
  t.end()
})
