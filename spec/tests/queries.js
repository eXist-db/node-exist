var test = require('tape')
var exist = require('../../index')
var connectionOptions = require('../db-connection')

test('call remote procedure through methodCall', function (t) {
  var db = exist.connect(connectionOptions)
  var resultHandle = null
  var queryString = '<result>{for $i in (1,2) return <i>{$i + $a}</i>}</result>'
  var queryOptions = { variables: { a: 1 } }
  var resultMatcher = /^<result>\s*<i>2<\/i>\s*<i>3<\/i>\s*<\/result>$/

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
      var concatenatedBuffers = Buffer.concat(results)

      t.ok(resultMatcher.test(concatenatedBuffers.toString()), 'got expected result')
      return db.queries.releaseResult(resultHandle)
    })
    .catch(function (e) {
      t.fail(e)
      return db.queries.releaseResult(resultHandle)
    })
    .then(function () {
      t.end()
    })
})

test('call promised query', function (t) {
  var db = exist.connect(connectionOptions)
  var queryString = 'for $i in (1, 2, 3) return $i'
  var options = { start: 2, limit: 1 }
  var expectedResult = '<exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist" hits="3" start="2" count="1">\n<exist:value type="xs:integer">2</exist:value>\n</exist:result>'

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
  var db = exist.connect(connectionOptions)
  var queryString = 'for $i in (1,2) return $i + $a'
  var queryOptions = { variables: { a: 10 } }
  var expectedResult = '11,12'

  db.queries.readAll(queryString, queryOptions)
    .then(function (result) {
      var csv = result.pages.map(function (p) { return p.toString() }).join(',')
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
