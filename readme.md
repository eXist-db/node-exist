# node-exist

[![Build Status](https://travis-ci.com/eXist-db/node-exist.svg)](https://travis-ci.com/eXist-db/node-exist)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Mostly a shallow wrapper for [eXist's XML-RPC API](http://exist-db.org/exist/apps/doc/devguide_xmlrpc.xml).
Attempts to translate terminologies into node world. Uses promises.

## Disclaimer

**Use at your own risk.**

This software is safe for development.
It may be used to work with a production instance, but think twice before your data is lost.

## Roadmap

- [ ] switch to use eXist-db's REST-API.
- [ ] refactor to ES6 modules

## Install

```sh
npm install @existdb/node-exist
```

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
  .catch(error => console.error('fail', error))
```

Since all interactions with the database are promises you can also use async functions

```js
const exist = require('@existdb/node-exist')
const db = exist.connect()

async function uploadAndParse (filePath, contents) {
  const fileHandle = await db.documents.upload(contents)
  await db.documents.parseLocal(fileHandle, filePath, {})
  return filePath
}

// top-level await is not available everywhere, yet
uploadAndParse('/db/apps/test-file.xml', Buffer.from('<root/>'))
  .then(filePath => console.log("uploaded", filePath))
  .catch(error => console.error(error))
```

You can also have a look at the 
[examples](https://github.com/eXist-db/node-exist/tree/master/spec/examples) for more use-cases.

## Configuration

Connect as someone else than guest 

```js
exist.connect({
  basic_auth: {
    user: 'me',
    pass: '1 troubadour artisanal #compost'
  }
})
```

Connect to a **local development** server using HTTP

```js
exist.connect({ secure: false, port: 8080 })
```

Connect to a server with an **invalid** or **expired** certificate

```js
exist.connect({ rejectUnauthorized: false })
```

### Defaults

```js
{
  host: 'localhost',
  port: '8443',
  path: '/exist/xmlrpc', // you most likely do not need to change that
  basic_auth: {
    user: 'guest',
    pass: 'guest'
  },
  secure: true
}
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

```js
db.queries.count(resultHandle)
```

#### retrieve

```js
db.queries.retrieveResult(resultHandle, page)
```

#### retrieveAll

```js
db.queries.retrieveAll(resultHandle)
```

#### releaseResult

free result on server

```js
db.queries.releaseResult(resultHandle)
```

### Documents

A document can be seen as a file. It might be indexed if it's type is not binary.

#### upload

Resolves into a file handle which can then be used by `db.documents.parseLocal`.

```js
db.documents.upload(Buffer.from('test'))
```

#### parseLocal

```js
db.documents.parseLocal(fileHandle, 'foo/test.txt', {})
```

#### read

```js
db.documents.read('foo.xml')
```

#### remove

```js
db.documents.remove('foo.xml')
```

### Resources

Status: working

A resource is identified by its path in the database.
Documents *and* collections are resources.

#### describe

```js
db.resources.describe(resourcePath)
```

#### setPermissions

```js
db.resources.setPermissions(resourcePath, 400)
```

#### getPermissions

```js
db.resources.getPermissions(resourcePath)
```

### Collections

Status: working

#### create

```js
db.collections.create(collectionPath)
```

#### remove

```js
db.collections.remove(collectionPath)
```

#### describe

```js
db.collections.describe(collectionPath)
```

#### read

```js
db.collections.read(collectionPath)
```

### App

Status: working

#### upload

```js
db.app.upload(xarBuffer, xarName)
```

**Example:**

```js
db.app.upload(fs.readFileSync('spec/files/test-app.xar'), 'test-app.xar')
  .then(result => console.log(result))
  .catch(e => console.error(e))
```

#### install

```js
db.app.install(xarName)
```

**Example:**

```js
db.app.install('test-app.xar')
  .then(result => console.log(result))
  .catch(e => console.error(e))
```

#### remove

```js
db.app.remove(applicationNamespace)
```

**Example:**

```js
db.app.remove('http://exist-db.org/apps/test-app')
  .then(result => console.log(result))
  .catch(e => console.error(e))
```

### Indices

Status: TODO

### Users

Status: failing

#### byName

```js
db.users.byName(username)
```

#### list

```js
db.users.list()
```

### server

Status: working

#### syncToDisk

```js
db.server.syncToDisk()
```

#### shutdown

```js
db.server.shutdown()
```

Note: There is no way to bring it up again.

## Test

All tests are in **spec/tests** and written for [tape](https://npmjs.org/tape)

```sh
npm test
```
