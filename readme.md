# node-exist

![semantic release status](https://github.com/exist-db/node-exist/actions/workflows/semantic-release.yml/badge.svg)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Mostly a shallow wrapper for [eXist's XML-RPC API](http://exist-db.org/exist/apps/doc/devguide_xmlrpc.xml).
Attempts to translate terminologies into node world. Uses promises.

- [Install](#install)
- [Use](#use)
- [Command Line Scripts](#command-line-scripts)
- [Test](#test)
- [Roadmap](#roadmap)
- [Compatibility](#compatibility)
- [Disclaimer](#disclaimer)

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
[examples](spec/examples) for more use-cases.

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

### Read configuration from environment variables

`readOptionsFromEnv` offers an comfortable way to read the connection options
from a set of environment variables

| variable name | default | description
|----|----|----
| `EXISTDB_USER` | _none_ | the user used to connect to the database and to execute queries with
| `EXISTDB_PASS` | _none_ | the password to authenticate the user against the database
| `EXISTDB_SERVER` | `https://localhost:8443` | the URL of the database instance to connect to (only http and https protocol allowed)

```js
const {connect, readOptionsFromEnv} = require('@existdb/node-exist')
const db = connect(readOptionsFromEnv())
```

For more details you can have a look how it is used in the [connection script](spec/connection.js)
that is used for testing and in all example scripts and the [examples](spec/examples).

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

You can use this library to interact with local or remote existdb instances on the command line.
You can find a few basic [examples](spec/examples) in this repository.

To give you a taste all example scripts are exposed as binaries in the __node_modules/.bin__ folder when you install this package.

You can run them using `npx`

```bash
npx -p @existdb/node-exist exist-ls /db/apps
```

If you want you can even install this package globally and then use these scripts like `ls` or `cd`.

```bash
npm install -g @existdb/node-exist
```

Now you can type

```bash
exist-ls /db/apps
```

anywhere on the system.

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

- [ ] switch to use eXist-db's REST-API.
- [ ] refactor to ES6 modules
- [ ] better type hints

## Compatibility

**node-exist** is tested to be compatible with **eXist-db 4, 5 and 6**.
It should be compatible with version 3, except for the XAR installation.

## Disclaimer

**Use at your own risk.**

This software is safe for development.
It may be used to work with a production instance, but think twice before your data is lost.
