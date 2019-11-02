const test = require('tape')
const exist = require('../../index')
const connectionOptions = require('../db-connection')
const remoteFileName = '/db/tmp/permission-test-1.xml'

test('change-permissions__setup', function (t) {
  const db = exist.connect(connectionOptions)

  db.put(remoteFileName, '<permission test="1" />', 'application/xml')
    .then(result => {
      t.ok(result, 'expected content returned')
      t.end()
    })
    .catch(e => {
      console.error(e.response.statusMessage)
      t.fail(e, 'damn')
      t.end()
    })
})

// xquery file with permission changes
test('change-permissions__valid', function (t) {
  const db2 = exist.connect(connectionOptions)
  const db = exist.connect(connectionOptions)
  const rf = '/db/tmp/permission-test-2.xml'
  const permissions = { mode: 'rwx------', owner: 'admin', group: 'dba' }

  db2.put(rf, '<permission test="2" />', 'application/xml')
    .then(_ => db.permissions.set(rf, permissions))
    .then(result => {
      const actual = result.json['exist:result']['sm:permission']._attributes
      delete actual['xmlns:sm']
      t.deepEqual(actual, permissions, 'expected content returned')
      t.end()
    })
    .catch(e => {
      console.error(e.response.statusMessage)
      t.fail(e, 'damn')
      t.end()
    })
})

// xquery file with permission changes
test('change-permissions__invalid-file', function (t) {
  const db = exist.connect(connectionOptions)
  const non = '/db/tmp/non-existent'
  const permissions = { mode: 'r--r--r--', owner: 'u', group: 'g' }

  db.permissions.set(non, permissions)
    .then(result => {
      t.equal(result.error, 'Not found', 'expected content returned')
      t.end()
    })
    .catch(e => {
      console.error(e.response.statusMessage)
      t.fail(e, 'damn')
      t.end()
    })
})

// xquery file with permission changes
test('change-permissions__invalid-user', function (t) {
  const db = exist.connect(connectionOptions)
  const permissions = { mode: 'r--r--r--', owner: 'u', group: 'g' }

  // db.put(remoteFileName, '<permission test="2" />', 'application/xml')
  //   .then(_ =>
  db.permissions.set(remoteFileName, permissions)
    .then(result => {
      t.equal(result.error, 'No such user', 'expected content returned')
      t.end()
    })
    .catch(e => {
      console.error(e.response.statusMessage)
      t.fail(e, 'damn')
      t.end()
    })
})

// xquery file with permission changes
test('change-permissions__invalid-group', function (t) {
  const db = exist.connect(connectionOptions)
  const permissions = { mode: 'r--r--r--', owner: 'admin', group: 'non-existent' }

  db.permissions.set(remoteFileName, permissions)
    .then(result => {
      t.equal(result.error, 'No such group', 'expected content returned')
      t.end()
    })
    .catch(e => {
      console.error(e.response.statusMessage)
      t.fail(e, 'damn')
      t.end()
    })
})

test('change-permissions__empty-group', function (t) {
  const db = exist.connect(connectionOptions)
  const permissions = { mode: 'r--r--r--', owner: 'admin', group: 'non-existent' }

  db.permissions.set(remoteFileName, permissions)
    .then(result => {
      t.equal(result.error, 'No such group', 'expected content returned')
      t.end()
    })
    .catch(e => {
      console.error(e.response.statusMessage)
      t.fail(e, 'damn')
      t.end()
    })
})

test('change-permissions__invalid-mode', function (t) {
  const db = exist.connect(connectionOptions)
  const permissions = { mode: 'xyz', owner: 'admin', group: 'dba' }

  db.permissions.set(remoteFileName, permissions)
    .then(result => {
      t.true(result.error.includes('Unrecognised mode syntax'), 'expected content returned')
      t.end()
    })
    .catch(e => {
      console.error(e.response.statusMessage)
      t.fail(e, 'damn')
      t.end()
    })
})

// upload HTML5 file without retry
test('change-permissions__recursive', function (t) {
  t.skip('not implemented yet')
  // const db = exist.connect(connectionOptions)
  // db.permissions.setRecursive(collection, permissions)
  t.end()
})

//     .then(_ => db.setPermissions(remoteFileName, {mode: 'rwx------', user: 'not', group: 'existent'}))
