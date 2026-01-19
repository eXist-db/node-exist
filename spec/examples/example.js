import { connect } from '../../index.js'
import { envOptions as connectionOptions } from '../connection.js'
const db = connect(connectionOptions)

const collection = 'foO0o'

db.collections.create(collection)
  .then(function (result) {
    console.log('created:', result)
    return db.collections.describe(collection)
  })
  .then(function (result) {
    console.log('description:', result)
    return db.collections.remove(collection)
  })
  .then(function (result) {
    console.log('removed:', result)
    return db.collections.remove(collection)
  })
  .catch(function (e) {
    console.log('fail', e)
  })
