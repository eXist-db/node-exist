const test = require('tape')
const { connect } = require('../../index')
const { envOptions } = require('../connection')
const testCollection = '/tests'
const db = connect(envOptions)

function testGetPermissions (t) {
  // setup
  db.resources.getPermissions(testCollection)
    .then(function (result) {
      t.equal(result.owner, 'admin', 'expected owner')
      t.equal(result.permissions, 493, 'expected permissions')
      t.deepEqual(result.acl, [], 'expected acl')
      t.equal(result.group, 'dba', 'expected group')
      t.end()
    })
    .catch(function (e) {
      t.fail(e)
      t.end()
    })
}

function testDescribeResource (t) {
  const expectedInfo = {
    owner: 'admin',
    'content-length': 1,
    'mime-type': 'application/xquery',
    'content-length-64bit': '1',
    permissions: 420,
    created: new Date(),
    name: testCollection + '/test.xql',
    modified: new Date(),
    acl: [],
    type: 'BinaryResource',
    group: 'dba'
  }

  db.resources.describe(testCollection + '/test.xql')
    .then(function (info) {
      t.equal(info.name, expectedInfo.name, 'returns expected path')
      t.equal(info.owner, expectedInfo.owner, 'returns expected owner')
      t.equal(info.permissions, expectedInfo.permissions, 'returns expected owner')
      t.equal(info['content-length'], expectedInfo['content-length'], 'returns expected length')
      t.end()
    })
    .catch(function (e) {
      t.fail(e)
      t.end()
    })
}

function testSetPermissions (t) {
  const resourcePath = testCollection + '/test.xql'
  const permissions = 666

  db.resources.setPermissions(resourcePath, permissions)
    .then(function (result) {
      t.ok(result, 'permissions set successfully')
      return db.resources.getPermissions(resourcePath)
    })
    .then(function (result) {
      t.equal(result.permissions, permissions, 'expected permissions')
      t.end()
    })
    .catch(function (e) {
      t.fail(e)
      t.end()
    })
}

test('resources:', function (t) {
  const db = connect(envOptions)

  t.test('setup', function (setup) {
    db.collections.create(testCollection)
      .then(function () {
        return db.documents.upload(Buffer.from('1'))
      })
      .then(function (fh) {
        return db.documents.parseLocal(fh, testCollection + '/test.xql')
      })
      .then(function (r) {
        setup.ok(r, 'setup ended')
        setup.end()
      })
      .catch(function (e) {
        t.fail('setup failed')
        t.end()
      })
  })

  t.test('describe resource', testDescribeResource)
  t.test('get resource permissions', testGetPermissions)
  t.test('set resource permissions', testSetPermissions)

  t.test('tearDown', function tearDown (td) {
    db.collections.remove(testCollection)
      .then(function (r) {
        td.ok(r, 'tearDown ended')
        td.end()
      })
      .catch(function (e) {
        td.fail(e)
        td.end()
      })
  })
})
