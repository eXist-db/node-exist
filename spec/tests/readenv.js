const test = require('tape')

const { readOptionsFromEnv } = require('../../index')

test('connection options from environment', function (t) {
  const optionsFromEnv = readOptionsFromEnv()
  const userIsSet = process.env.EXISTDB_USER && process.env.EXISTDB_PASS
  const serverIsSet = 'EXISTDB_SERVER' in process.env

  if (serverIsSet) {
    const { hostname, port, protocol } = new URL(process.env.EXISTDB_SERVER)
    t.equal(optionsFromEnv.port, port)
    t.equal(optionsFromEnv.secure, protocol === 'https:')
    t.equal(optionsFromEnv.host, hostname)
    t.equal(optionsFromEnv.protocol, protocol)
  } else {
    t.false('port' in optionsFromEnv)
    t.false('secure' in optionsFromEnv)
    t.false('host' in optionsFromEnv)
    t.false('protocol' in optionsFromEnv)
  }

  if (userIsSet) {
    t.ok(optionsFromEnv.basic_auth)
    t.equal(optionsFromEnv.basic_auth.user, process.env.EXISTDB_USER)
    t.equal(optionsFromEnv.basic_auth.pass, process.env.EXISTDB_PASS)
  } else {
    t.false('basic_auth' in optionsFromEnv)
  }

  t.end()
})

test('test user set in env', function (t) {
  process.env.EXISTDB_USER = 'test'
  process.env.EXISTDB_PASS = 'test'
  const optionsFromEnv = readOptionsFromEnv()
  t.ok(optionsFromEnv.basic_auth)
  t.equal(optionsFromEnv.basic_auth.user, 'test')
  t.equal(optionsFromEnv.basic_auth.pass, 'test')
  t.end()
})

test('test user set in env with empty password', function (t) {
  process.env.EXISTDB_USER = 'test'
  process.env.EXISTDB_PASS = ''
  const optionsFromEnv = readOptionsFromEnv()
  t.ok(optionsFromEnv.basic_auth)
  t.equal(optionsFromEnv.basic_auth.user, 'test')
  t.equal(optionsFromEnv.basic_auth.pass, '')
  t.end()
})

test('empty user set in env', function (t) {
  process.env.EXISTDB_USER = ''
  process.env.EXISTDB_PASS = 'test1234'
  const optionsFromEnv = readOptionsFromEnv()
  t.false('basic_auth' in optionsFromEnv)
  t.end()
})

test('only user set in env', function (t) {
  process.env.EXISTDB_USER = 'test'
  delete process.env.EXISTDB_PASS
  const optionsFromEnv = readOptionsFromEnv()
  t.notOk(optionsFromEnv.basic_auth)
  t.end()
})
