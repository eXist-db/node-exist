const { promisify } = require('util')
const stream = require('stream')
const { isGeneratorFunction } = require('util').types
const pipeline = promisify(stream.pipeline)
const { getMimeType } = require('./util')

/**
 * remove leading slash from path
 * @param {string} path database path
 * @returns {string} normalized path
 */
function normalizeDBPath (path) {
  return path.startsWith('/') ? path.substring(1) : path
}

/**
 * create resource in DB
 * @param {Object} restClient Got-instance
 * @param {string | Buffer | stream.Readable | Generator | AsyncGenerator | FormData} body contents of the resource
 * @param {string} path where to create resource
 * @param {string | undefined} [mimetype] enforce specific mimetype
 * @returns {Object} Response with headers
 */
async function put (restClient, body, path, mimetype) {
  const url = normalizeDBPath(path)
  const contentType = getMimeType(path, mimetype)

  if (body instanceof stream.Readable) {
    const writeStream = restClient.stream.put({
      url,
      headers: {
        'content-type': contentType
      }
    })
    let _response
    writeStream.on('response', response => {
      _response = response
    })

    await pipeline(
      body,
      writeStream,
      new stream.PassThrough() // necessary to receive read errors
    )

    return _response
  }

  if (isGeneratorFunction(body)) {
    console.log('GENERATOR FUNCTION')
    return restClient.put({
      url,
      headers: {
        'content-type': contentType
      },
      body: body()
    })
  }

  return restClient.put({
    url,
    headers: {
      'content-type': contentType,
      'content-length': body.length
    },
    body
  })
}

/**
 * read resource in DB
 * @param {Object} restClient Got-instance
 * @param {string} path which resource to read
 * @param {stream.Writable | undefined} [writableStream] if provided allows to stream onto the file system for instance
 * @returns {Object} Response with body and headers
 */
async function get (restClient, path, writableStream) {
  const url = normalizeDBPath(path)

  if (writableStream instanceof stream.Writable) {
    const readStream = restClient.stream({ url })

    let _response
    readStream.on('response', response => {
      _response = response
    })

    await pipeline(
      readStream,
      writableStream
    )
    return _response
  }

  return restClient.get(url)
}

/**
 * delete a resource from the database
 * @param {Object} restClient Got-instance
 * @param {string} path which resource to delete
 * @returns {Object} Response with body and headers
 */
function del (restClient, path) {
  const url = normalizeDBPath(path)
  return restClient({
    url,
    method: 'delete'
  })
}

module.exports = {
  put,
  get,
  del
}
