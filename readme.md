# node-exist

[![Build Status](https://travis-ci.com/eXist-db/node-exist.svg)](https://travis-ci.com/eXist-db/node-exist)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Mostly a shallow wrapper for [eXist's XML-RPC API](http://exist-db.org/exist/apps/doc/devguide_xmlrpc.xml).
Attempts to translate terminologies into node world. Uses promises.

## Disclaimer

This software is safe for development but should not be used to alter a production database instance!
Think twice before your data is lost.

## Roadmap

This package will switch to use eXist-db's REST-API.

**Use at your own risk.**

## Install

    npm install @existdb/node-exist

## Use

Creating, reading and removing a collection:

```js
const exist = require('@existdb/node-exist')
const db = exist.connect()

db.collections.create('/db/apps/test')
    .then(result => db.collections.describe('/db/apps/test'))
    .then(result => console.log('collection description:', result))
    .catch(e => console.error('fail', e))

```

Uploading an XML file into the database

```js
const exist = require('@existdb/node-exist')
const db = exist.connect()

db.documents.upload(Buffer.from('<root/>'))
  .then(fileHandle => db.documents.parseLocal(fileHandle, '/db/apps/test/file.xml', {}))
  .then(result => db.documents.read('/db/apps/test/file.xml'))
  .then(result => console.log('test file contents', result))
  .catch(e => console.error('fail', e))

```

## Components

The methods are grouped into components by what they operate on.
Every method returns a promise.

### Queries

Status: working

#### execute

```js
    db.queries.execute(query, options)
```

#### read

```js
    db.queries.read(query, options)
```

#### readAll

This convenience function calls queries.count then retrieves all result pages and returns them in an array.

```js
    db.queries.readAll(query, options)
```

**Example:**

```js
db.queries.readAll('xquery version "3.1"; xmldb:get-child-collections("/db/apps") => string-join(",\n")', {})
  .then(result => console.log(
    Buffer.concat(result.pages).toString()))
  .catch(e => console.error(e))

```


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

### App

Status: **Experimental**

#### upload

    db.app.upload(xarBuffer, xarName)

#### install

    db.app.install(xarName)

#### remove

    db.app.remove(xarName)

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
