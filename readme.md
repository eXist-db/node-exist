# node-exist

![semantic release status](https://github.com/exist-db/node-exist/actions/workflows/semantic-release.yml/badge.svg)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Mostly a shallow wrapper for [eXist's XML-RPC API](http://exist-db.org/exist/apps/doc/devguide_xmlrpc.xml) and [eXist's REST API](https://exist-db.org/exist/apps/doc/devguide_rest.xml).
Attempts to translate terminologies into node world. Uses promises.

- [Install](#install)
- [Use](#use)
- [Connection Options](#connection-options)
- [Components](#components)
- [Command Line Scripts](#command-line-scripts)
- [Test](#test)
- [Roadmap](#roadmap)
- [Compatibility](#compatibility)
- [Disclaimer](#disclaimer)

## Install

```sh
npm install @existdb/node-exist
```

__NOTE:__ If you are looking for a command line client have a look at [xst](https://github.com/eXist-db/xst)

## Use

In addition to eXist-db's XML-RPC API you do now also have the option to
leverage the potential of its REST-API.
This allows to choose the best tool for any particular task.
Both APIs are used in combination in the [upload example](spec/examples/exist-upload).

### REST

Status: unstable

__NOTE:__ eXist-db's REST-API has its on methodology and available options
may differ between instances. Especially, the ability
to download the source code of XQuery files is 
prohibited by default (`_source=yes` is only availabe if enabled in `descriptor.xml`).
For details of available `options` for each method please see the [REST-API documentation](https://exist-db.org/exist/apps/doc/devguide_rest.xml)

First, we need an instance of the restClient.

```js
import { getRestClient } from '@existdb/node-exist'
const rc = await getRestClient()
```

For more information see also [Connection Options](#connection-options).

The returned HTTP client has 4 methods

- `post(query, path[, options])`: execute `query` in the context of `path`.
  The `query` is expected to be a XQuery main module and will be wrapped in the XML-fragment that exist expects.

  ```js
  await rc.post('count(//p)', '/db')
  ```

- `put(data, path)`: create resources in the database.
  If sub-collections in path are missing, they will be created for you.
  The server will respond with StatusCode 400, Bad Request, for not-well-
  formed XML resources. In this case, the body contains a detailed 
  description of the validation error.

  ```js
  await rc.put('<root />', '/db/rest-test/test.xml')
  ```

- `get(path [, options][, writableStream])`: read data from the database.
  The response body will contain the contents of the resource or
  a file listing, if the provided path is a collection.
  If a writableStream is passed in, the response body will be streamed into it.

  ```js
  const { body } = await rc.get('/db/rest-test/test.xml')
  console.log(body)
  ```

- `del(path)`: remove resources and collections from an existdb instance

  ```js
  await rc.del('/db/rest-test/test.xml')
  ```

Have a look at [the rest-client example](spec/examples/rest.mjs).
The REST-client uses the [Got](https://github.com/sindresorhus/got#readme) library 
and works with streams and generators.
Look at the [rest tests](spec/tests/rest.js) to see examples.

### XML-RPC

Creating, reading and removing a collection:

```js
const {connect} = require('@existdb/node-exist')
const db = connect()

db.collections.create('/db/apps/test')
  .then(result => db.collections.describe('/db/apps/test'))
  .then(result => console.log('collection description:', result))
  .catch(e => console.error('fail', e))
```

Uploading an XML file into the database

```js
const {connect} = require('@existdb/node-exist')
const db = connect()

db.documents.upload(Buffer.from('<root/>'))
  .then(fileHandle => db.documents.parseLocal(fileHandle, '/db/apps/test/file.xml'))
  .then(result => db.documents.read('/db/apps/test/file.xml'))
  .then(result => console.log('test file contents', result))
  .catch(error => console.error('fail', error))
```

Since all interactions with the database are promises you can also use async functions

```js
const {connect} = require('@existdb/node-exist')
const db = connect()

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

You can now also import node-exist into an ES module

```js
import {connect} from '@existdb/node-exist'
const db = connect()

// do something with the db connection
db.collections.describe('/db/apps')
  .then(result => console.log(result))
```

You can also have a look at the 
[examples](spec/examples) for more use-cases.

## Connection Options

In the previous section you learned that there are two
APIs you can use to interact with an exist-db instance.

Both client constructor functions do accept an option argument of type
`NodeExistConnectionOptions`.
Calling them without arguments, as in the examples above will use
default options.

```js
{
  basic_auth: {
    user: 'guest',
    pass: 'guest'
  },
  protocol: 'https:',
  host: 'localhost',
  port: '8443',
  path: '/exist/rest'|'/exist/xmlrpc'
}
```

**NOTE:** The `path` property, the endpoint to reach an API,
is different for REST (`'/exist/xmlrpc'`) and XML-RPC (`'/exist/xmlrpc'`).
You most likely do not need to change it. However, if you need
to you can override those.

### RESTClient with defaults

```js
import {getRestClient} from '@existdb/node-exist'
const rest = await getRestClient({
  basic_auth: {
    user: 'guest',
    pass: 'guest'
  },
  protocol: 'https:',
  host: 'localhost',
  port: '8443',
  path: '/exist/rest'
})
```

### XMLRPCClient with defaults

```js
import {connect} from '@existdb/node-exist'
const db = connect({
  basic_auth: {
    user: 'guest',
    pass: 'guest'
  },
  protocol: 'https:',
  host: 'localhost',
  port: '8443',
  path: '/exist/xmlrpc'
})
```

### Examples

- Connect as someone else than guest 
  ```js
  {
    basic_auth: {
      user: 'me',
      pass: '1 troubadour artisanal #compost'
    }
  }
  ```

- Connect to a **local development** server using HTTP
  ```js
  {
    protocol: 'http:',
    port: 8080
  }
  ```

- Connect to a server with an **invalid** or **expired** certificate.
  ```js
  {
    host: 'here.be.dragons',
    rejectUnauthorized: false
  }
  ```
  **NOTE:** For remote hosts this is considered _bad practice_ as it does only
  offer a false sense of security.
  For hosts considered local - `localhost`, `127.0.0.1` and `[::1]` -
  this is set automatically, because it is impossible to have trusted certificates
  for local hosts.

### Read options from environment

`readOptionsFromEnv` offers a comfortable way to read the connection options
from a set of environment variables

| variable name | default | description
|----|----|----
| `EXISTDB_USER` | _none_ | the user used to connect to the database and to execute queries with
| `EXISTDB_PASS` | _none_ | the password to authenticate the user against the database
| `EXISTDB_SERVER` | `https://localhost:8443` | the URL of the database instance to connect to (only http and https protocol allowed)

**NOTE:** In order to connect to an instance as a user other than `guest`
_both_ `EXISTDB_USER` _and_ `EXISTDB_PASS` have to be set!

```js
const {connect, restClient, readOptionsFromEnv} = require('@existdb/node-exist')
const db = connect(readOptionsFromEnv())
const rest = await getRestClient(readOptionsFromEnv())
```

For more details you can have a look how it is used in the [connection script](spec/connection.js)
that is used for testing and in all [example scripts](spec/examples).

## Components

The **XML-RPC** commands are grouped into components by what they operate on.
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
const query = `xquery version "3.1";
xmldb:get-child-collections($collection)
  => string-join(",\n")
`
const options = { variables: collection: "/db/apps" }

db.queries.readAll(query, options)
  .then(result => {
    const response = Buffer.concat(result.pages).toString() 
    console.log(response)
  })
  .catch(error => console.error(error))
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
db.documents.parseLocal(fileHandle, 'foo/test.txt')
```

#### read

Reads resources stored as XML (`XMLResource`). You can control how they are
serialized by setting 
[serialization options](https://exist-db.org/exist/apps/doc/xquery.xml?field=all&id=D3.49.19#serialization)
in the options parameter.

Use default serialization options.

```js
db.documents.read('foo.xml')
```

Force XML declaration to be returned.

```js
db.documents.read('foo.xml', { "omit-xml-declaration": "no" })
```

Force the file to end in a blank line (available since eXist-db v6.0.1).

```js
db.documents.read('foo.xml', { "insert-final-newline": "yes" })
```

#### readBinary

Reads resources stored as binary (`BinaryResource`) inside existdb such as XQuery,
textfiles, PDFs, CSS, images and the like.

```js
db.documents.readBinary('foo.xml')
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

#### exists

This function checks if the collection exists.

- returns `true` if the collection exists and the current user can open it
- returns `false` if the collection does not exist
- throws an exception if the collection exists but the current user cannot
  access it

```js
db.collections.exists(collectionPath)
```

#### existsAndCanOpen

This function checks if the collection exists and if it does, if the current user can access it.

- returns `true` if the collection exists and the current user can open it
- returns `false` if the collection does not exist
- throws an exception if the collection exists but the current user cannot
  access it

```js
db.collections.existsAndCanOpen(collectionPath)
```

### App

Status: working

#### upload

After uploading a XAR you can install it

```js
db.app.upload(xarBuffer, xarName)
```

**Example:**

```js
const xarContents = fs.readFileSync('spec/files/test-app.xar')

db.app.upload(xarContents, 'test-app.xar')
  .then(result => console.log(result))
  .catch(error => console.error(error))
```

#### install

Install an uploaded XAR (this will call `repo:install-and-deploy-from-db`).
For extra safety a previously installed version will be removed before
installing the new version.

Dependencies will be resolved from <http://exist-db.org/exist/apps/public-repo>
by default.
If you want to use a different repository provide the optional `customPackageRepoUrl`.

```js
db.app.install(xarName[, customPackageRepoUrl])
```

**Example:**

```js
db.app.install('test-app.xar')
  .then(result => console.log(result))
  .catch(error => console.error(error))
```

**Returns**

```js
{
  "success": true,
  "result": {
    "update": false, // true if a previous version was found
    "target": "/db/apps/test-app"
  }
}
```

**Error**

```js
{
  success: false,
  error: Error
}
```

#### remove

Uninstall _and_ remove the application identified by its namespace URL.
If no app with `packageUri` could be found then this counts as success.

```js
db.app.remove(packageUri)
```

**Example:**

```js
db.app.remove('http://exist-db.org/apps/test-app')
  .then(result => console.log(result))
  .catch(error => console.error(error))
```

**Returns**

```js
{ success: true }
```

**Error**

```js
{
  success: false,
  error: Object | Error
}
```

#### packageCollection

The path to the collection where node-exist will upload
packages to (`/db/pkgtmp`). Useful for cleanup after
succesful installation.

**Example:**

```js
db.documents.remove(`${db.app.packageCollection}/test-app.xar`)
```

### Indices

Status: TODO

### Users

Status: working

#### getUserInfo

Will return the information about the given user.

```js
db.users.getUserInfo(username)
```

Example:

```js
db.users.getUserInfo('admin')
```

Returns:

```js
{
    uid: 1048574,
    'default-group-id': 1048575,
    umask: 18,
    metadata: {
      'http://exist-db.org/security/description': 'System Administrator',
      'http://axschema.org/namePerson': 'admin'
    },
    'default-group-name': 'dba',
    'default-group-realmId': 'exist',
    name: 'admin',
    groups: [ 'dba' ],
    enabled: 'true'
}
```

#### list

```js
db.users.list()
```

Returns an array of user info objects (see [getUserInfo()](#getuserinfo)).

### server

Status: working

#### version

Query the eXist-db version running on the server.
Returns the SemVer version as a string (e.g. `5.4.1` or `6.1.0-SNAPSHOT`).

```js
db.server.version()
```

#### syncToDisk

```js
db.server.syncToDisk()
```

#### shutdown

```js
db.server.shutdown()
```

Note: There is no way to bring it up again.

## Command Line Scripts

You can use this library to build a command line interface that interacts with existdb instances.
A few basic [examples](spec/examples) how to do this are included in this repository.

Example:

```bash
spec/examples/exist-ls /db/apps
```

__NOTE:__ Have a look at [xst](https://github.com/eXist-db/xst) for a CLI client built with node-exist.

## Test

All tests are in **spec/tests** and written for [tape](https://npmjs.org/tape)

```bash
npm test
```

__NOTE:__ You can override connection settings with environment variables. See [examples](spec/examples/readme.md) for more information.

To execute a single run using a different server you can also just define the variable directly:

```bash
EXISTDB_SERVER=http://localhost:8888 npm test
```

## Roadmap

- [x] switch to use eXist-db's REST-API (available through [rest-client](#rest-client))
- [ ] refactor to ES6 modules
- [ ] better type hints

## Compatibility

**node-exist** is tested to be compatible with **eXist-db 4, 5 and 6**.
It should be compatible with version 3, except for the XAR installation.

## Disclaimer

**Use at your own risk.**

This software is safe for development.
It may be used to work with a production instance, but think twice before your data is lost.
