# node-exist Command Line Scripts

- `exist-ls` list the contents of a collection in exist-db
- `upload` upload a file to an exist-db instance
- `install-package` upload and install a package into an existdb-instance

The three command line script examples allow you to override the connection
by setting environment variables prefixed with `EXISTDB`.

| variable name | default | description
|----|----|----
| `EXISTDB_USER` | `admin` | the user used to connect to the database and to execute queries with
| `EXISTDB_PASS` | _empty_ | the password to authenticate the user against the database
| `EXISTDB_SERVER` | `http://localhost:8080` | the URL of the database instance to connect, using https is possible if you have a correct certificate

## dotenv

dotenv(-cli) is a small script that allows you to read environment variables from a file in the filesystem.

### preparation

- create .env file
    ```bash
    EXISTDB_USER=admin
    EXISTDB_PASS=
    EXISTDB_SERVER=http://localhost:8080
    ```

- Install [dotenv-cli](https://www.npmjs.com/package/dotenv-cli) globally
    
```bash
npm install -g dotenv-cli
```

### use

- prepend command line script with `dotenv`

example

```bash
dotenv ./exist /db/apps
```