const test = require('tape')
const { connect } = require('../../index')
const connectionOptions = require('../connection')
const asGuest = Object.assign({},
  connectionOptions,
  { basic_auth: { user: 'guest', pass: 'guest' } }
)

test('get collection info', function (t) {
  const db = connect(connectionOptions)
  db.collections.describe('/db')
    .then(function (info) {
      t.equal(info.owner, 'SYSTEM')
      t.end()
    })
    .catch(function (e) {
      t.fail(e)
      t.end()
    })
})

test('get info for non existent collection', function (t) {
  const db = connect(connectionOptions)
  db.collections.describe('/foo')
    .then(function (r) {
      t.fail(r, 'no error')
      t.end()
    })
    .catch(function (e) {
      if (!e.faultString) {
        t.fail(e, 'no faultString, something else must have gone wrong')
        t.end()
        return
      }
      t.ok(e.faultString.match(/\/foo not found!$/), 'not found error')
      t.end()
    })
})

test('create collection', function (t) {
  const db = connect(connectionOptions)
  db.collections.create('new-test-collection')
    .then(function (r) {
      console.log(r, 'create')
      t.ok(r, 'created')
      t.end()
    })
    .catch(function (e) {
      t.fail(e, 'creation error')
      t.end()
    })
})

test('remove collection', function (t) {
  const db = connect(connectionOptions)
  const testCollection = '/remove-collection'
  db.collections.create(testCollection)
    .then(function () {
      return db.collections.remove(testCollection)
    })
    .then(function (success) {
      t.ok(success, 'removed')
      t.end()
    })
    .catch(function (e) {
      t.fail(e, 'remove failed')
      t.end()
    })
})

test('collection exists and guest cannot open it', function (t) {
  const db = connect(asGuest)
  db.collections.existsAndCanOpen('/db/system/security')
    .then(function () {
      t.fail()
      t.end()
    })
    .catch(function (e) {
      t.ok(e, '/db/system/security exists and user guest cannot access it')
      t.end()
    })
})

test('collection exists and guest can open it', function (t) {
  const db = connect(asGuest)
  db.collections.existsAndCanOpen('/db/apps')
    .then(function (success) {
      t.true(success, '/db/apps exists and user guest can access it')
      t.end()
    })
    .catch(function (e) {
      t.fail(e)
      t.end()
    })
})

test('collection does not exist (guest)', function (t) {
  const db = connect(asGuest)
  db.collections.existsAndCanOpen('/db/apps/asdf')
    .then(function (success) {
      t.false(success, '/db/apps/asdf does not exist')
      t.end()
    })
    .catch(function (e) {
      t.fail(e)
      t.end()
    })
})

test('collection exists and admin can open it', function (t) {
  const db = connect(connectionOptions)
  db.collections.existsAndCanOpen('/db/system/security')
    .then(function (success) {
      t.true(success)
      t.end()
    })
    .catch(function (e) {
      t.fail(e)
      t.end()
    })
})

test('collection does not exist (admin)', function (t) {
  const db = connect(connectionOptions)
  db.collections.existsAndCanOpen('/db/apps/asdf')
    .then(function (success) {
      t.false(success, '/db/apps/asdf does not exist')
      t.end()
    })
    .catch(function (e) {
      t.fail(e)
      t.end()
    })
})
