var exist = require('../../index')

var db = exist.connect({
  basic_auth: {
    user: 'hans',
    pass: '********************'
  }
})

var collection = 'fo0o'

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
