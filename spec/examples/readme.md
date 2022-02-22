# node-exist Command Line Scripts

- `exist-ls` list the contents of a collection in eXist-db
- `exist-tree` list the contents of a collection in eXist-db as a tree
- `exist-upload` upload a files and folders to a collection in eXist-db
- `exist-install` upload and install a package into eXist-db
- `exist-exec` execute queries in an eXist-db

**NOTE:** These scripts connect to a running eXist-db instance and XML-RPC has
to be enabled.

## connecting to your eXist-db instance

The command line scripts allow you to connect to any instance that has XML-RPC
enabled. By default they will attempt to connect to a local development server
with default passwords.

Override any of the default connection parameters by setting environment 
variables prefixed with `EXISTDB`. In the following table you see a list of the 
parameters with their default values and a description.

| variable name | default | description
|----|----|----
| `EXISTDB_USER` | `admin` | the user used to connect to the database and to execute queries with
| `EXISTDB_PASS` | _empty_ | the password to authenticate the user against the database
| `EXISTDB_SERVER` | `https://localhost:8443` | the URL of the database instance to connect to (only http and https protocols are allowed)

## dotenv

dotenv(-cli) is a small script that allows you to read environment variables from a file in the filesystem.

### preparation

- Install [dotenv-cli](https://www.npmjs.com/package/dotenv-cli) globally
    ```bash
    npm install -g dotenv-cli
    ```

- create .env file in a folder with the settings that you need
    ```bash
    EXISTDB_USER=admin
    EXISTDB_PASS=
    EXISTDB_SERVER=http://localhost:8080
    ```


### use

prepend command line script with `dotenv` in the folder you created the .env file in

#### Examples

If you installed node-exist globally (`npm install -g @existdb/node-exist`)

```bash
dotenv exist-ls /db/apps
```

If you installed node-exist as a local package (npm dependency)

```bash
dotenv node_modules/.bin/exist-ls /db/apps
```

If you cloned this repository

```bash
dotenv spec/examples/exist-ls /db/apps
```

That also works when running the tests (on a remote server maybe or a different user)

```bash
dotenv npm test
```