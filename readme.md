# node-exist

[![Build Status](https://travis-ci.org/eXist-db/node-exist.svg)](https://travis-ci.org/eXist-db/node-exist)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Mostly a shallow wrapper for [eXist's XML-RPC API](http://exist-db.org/exist/apps/doc/devguide_xmlrpc.xml).
Attempts to translate terminologies into node world. Uses promises.

## Disclaimer

This software is in early development stage and may not be ready for production!
Think twice before your data is lost.

**Use at your own risk.**

## Install

    npm install @existdb/node-exist

## Use

Creating, reading and removing a collection:

```js
var exist = require('node-exist')

var db = exist.connect()

db.collections.create('/db/apps/test')
    .then(function (result) {
        console.log('create returned with:', result)
        return db.collections.describe('/db/apps/test')
    })
    .then(function (result) {
        console.log('collection description:', result)
        return db.collections.remove('/db/apps/test')
    })
    .then(function (result) {
        console.log('test collection removed', result)
    })
    .catch(function (e) {
        console.log('fail', e)
    })
```
Uploading an XML file into the database

```js
var exist = require('node-exist')

var db = exist.connect()

db.document.upload(Buffer.from('<root/>'))
  .then(function (fileHandle) {
    return db.document.parseLocal(fileHandle, '/db/apps/test/file.xml', {})
  })
  .then(function (result) {
    return db.documents.read('/db/apps/test/file.xml')
  })
  .then(function (result) {
    console.log('test file contents', result)
    return db.documents.remove('/db/apps/test/file.xml')
  })
  .then(function (result) {
      console.log('test file removed', result)
  })
  .catch(function (e) {
      console.log('fail', e)
  })

```

## Components

The methods are grouped into components by what they operate on.
Every method returns a promise.

### Queries

Status: working

#### execute

    db.queries.execute(query, options)

#### read

    db.queries.read(query, options)

#### readAll

This convenience function calls queries.count then retrieves all result pages and returns them in an array.

    db.queries.readAll(query, options)
	    .then(function (result) {
        result.pages.forEach(function () {
          console.log(page)
        })
	    })


#### count

    db.queries.count(resultHandle)

#### retrieve

    db.queries.retrieveResult(resultHandle, page)

#### retrieveAll

    db.queries.retrieveAll(resultHandle)

#### releaseResult

free result on server

    db.queries.releaseResult(resultHandle)

### Documents

A document can be seen as a file. It might be indexed if it's type is not binary.

#### upload

Resolves into a file handle which can then be used by `db.documents.parseLocal`.

    db.documents.upload(Buffer.from('test'))

#### parseLocal

    db.documents.parseLocal(fileHandle, 'foo/test.txt', {})

#### read

    db.documents.read('foo.xml')

#### remove

    db.documents.remove('foo.xml')


### Resources

Status: working

A resource is identified by its path in the database.
Documents *and* collections are resources.

#### describe

    db.resources.describe(resourcePath)

#### setPermissions

    db.resources.setPermissions(resourcePath, 400)

#### getPermissions

    db.resources.getPermissions(resourcePath)


### Collections

Status: working

#### create

    db.collections.create(collectionPath)

#### remove

    db.collections.remove(collectionPath)

#### describe

    db.collections.describe(collectionPath)

#### read

    db.collections.read(collectionPath)


### Indices

Status: TODO


### Users

Status: failing

#### byName

    db.users.byName(username)

#### list

    db.users.list()

### server

Status: working

#### syncToDisk

    db.server.syncToDisk()

#### shutdown

    db.server.shutdown()

Note: There is no way to bring it up again.

## Test

All tests are in **spec/tests** and written for [tape](https://npmjs.org/tape)

    npm test
