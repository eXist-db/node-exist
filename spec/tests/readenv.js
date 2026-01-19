import test from 'node:test'
import assert from 'node:assert'

import { readOptionsFromEnv } from '../../index.js'

test('connection options from environment', () => {
  const optionsFromEnv = readOptionsFromEnv()
  const userIsSet = process.env.EXISTDB_USER && process.env.EXISTDB_PASS
  const serverIsSet = 'EXISTDB_SERVER' in process.env

  if (serverIsSet) {
    const { hostname, port, protocol } = new URL(process.env.EXISTDB_SERVER)
    assert.strictEqual(optionsFromEnv.port, port)
    assert.strictEqual(optionsFromEnv.protocol === 'https:' ? 'https:' : optionsFromEnv.protocol, optionsFromEnv.protocol)
    assert.strictEqual(optionsFromEnv.host, hostname)
    assert.strictEqual(optionsFromEnv.protocol, protocol)
  } else {
    assert.ok(!('port' in optionsFromEnv))
    assert.ok(!('secure' in optionsFromEnv))
    assert.ok(!('host' in optionsFromEnv))
    assert.ok(!('protocol' in optionsFromEnv))
  }

  if (userIsSet) {
    assert.ok(optionsFromEnv.basic_auth)
    assert.strictEqual(optionsFromEnv.basic_auth.user, process.env.EXISTDB_USER)
    assert.strictEqual(optionsFromEnv.basic_auth.pass, process.env.EXISTDB_PASS)
  } else {
    assert.ok(!('basic_auth' in optionsFromEnv))
  }
})

test('test user set in env', () => {
  process.env.EXISTDB_USER = 'test'
  process.env.EXISTDB_PASS = 'test'
  const optionsFromEnv = readOptionsFromEnv()
  assert.ok(optionsFromEnv.basic_auth)
  assert.strictEqual(optionsFromEnv.basic_auth.user, 'test')
  assert.strictEqual(optionsFromEnv.basic_auth.pass, 'test')
})

test('test user set in env with empty password', () => {
  process.env.EXISTDB_USER = 'test'
  process.env.EXISTDB_PASS = ''
  const optionsFromEnv = readOptionsFromEnv()
  assert.ok(optionsFromEnv.basic_auth)
  assert.strictEqual(optionsFromEnv.basic_auth.user, 'test')
  assert.strictEqual(optionsFromEnv.basic_auth.pass, '')
})

test('empty user set in env', () => {
  process.env.EXISTDB_USER = ''
  process.env.EXISTDB_PASS = 'test1234'
  const optionsFromEnv = readOptionsFromEnv()
  assert.ok(!('basic_auth' in optionsFromEnv))
})

test('only user set in env', () => {
  process.env.EXISTDB_USER = 'test'
  delete process.env.EXISTDB_PASS
  const optionsFromEnv = readOptionsFromEnv()
  assert.ok(!optionsFromEnv.basic_auth)
})
