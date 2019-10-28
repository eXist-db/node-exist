const test = require('tape')
const exist = require('../../index')
const connectionOptions = require('../db-connection')

test('call remote procedure through methodCall', function (t) {
  const db = exist.connect(connectionOptions)
  // let resultHandle = null
  const queryString = '<result>{for $i in (1,2) return <i>{$i + $a}</i>}</result>'
  // const resultMatcher = /^<result>\s*<i>2<\/i>\s*<i>3<\/i>\s*<\/result>$/
  const queryOptions = { variables: { a: 1 } }

  db.queries.complex(queryString, queryOptions, null)
    .then(function (result) {
      console.log(result.json)
      t.ok(result.json, 'got handle')
      t.end()
      // return db.queries.count(handle)
    })
    // .then(function (hits) {
    //   t.equal(hits, 1, 'got one hit')
    //   return db.queries.retrieveAll(resultHandle, hits)
    // })
    // .then(function (results) {
    //   const concatenatedBuffers = Buffer.concat(results)

    //   t.ok(resultMatcher.test(concatenatedBuffers.toString()), 'got expected result')
    //   return db.queries.releaseResult(resultHandle)
    // })
    .catch(function (e) {
      t.fail(e)
      // return db.queries.releaseResult(resultHandle)
    })
    // .then(function () {
    //   t.end()
    // })
})

test('call promised query', function (t) {
  const db = exist.connect(connectionOptions)
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
  const db = exist.connect(connectionOptions)
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

test('run query, expect XML', function (t) {
  t.skip('not implemented yet')
  t.end()
})

test('run query, expect json', function (t) {
  t.skip('not implemented yet')
  t.end()
})
