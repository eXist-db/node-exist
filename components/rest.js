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

const postAttributeNames = [
  'start',
  'max',
  'session',
  'cache'
]

const existResultRegex = /^<exist:result/
/**
 * Tests if body is a wrapped result from exist=db
 *
 * @param {String} body server response body
 * @returns {Boolean}
 */
function isExistResult (body) {
  return existResultRegex.test(body)
}

const sessionRegex = /exist:session="(\d+)"/
const hitsRegex = /exist:hits="(\d+)"/
const startRegex = /exist:start="(\d+)"/
const countRegex = /exist:count="(\d+)"/
const compilationTimeRegex = /exist:compilation-time="(\d+)"/
const executionTimeRegex = /exist:execution-time="(\d+)"/

/**
 * Extract numerical attribute value with a regular expression from exist:result
 * Returns -1, if the attribute is not set(the regular expression does not match)
 *
 * @param {RegExp} regex regular expression to extract numerical attribute value
 * @returns {Number} parsed attribute value or -1
 */
function getAttributeValueByRegex (existResult, regex) {
  return regex.test(existResult) ? parseInt(regex.exec(existResult)[1], 10) : -1
}

function extendIfWrapped (response) {
  const { body } = response
  if (!isExistResult(body)) {
    return response
  }

  const session = getAttributeValueByRegex(body, sessionRegex)
  const hits = getAttributeValueByRegex(body, hitsRegex)
  const start = getAttributeValueByRegex(body, startRegex)
  const count = getAttributeValueByRegex(body, countRegex)
  const compilationTime = getAttributeValueByRegex(body, compilationTimeRegex)
  const executionTime = getAttributeValueByRegex(body, executionTimeRegex)

  return Object.assign(response, {
    session,
    hits,
    start,
    count,
    compilationTime,
    executionTime
  })
}

/**
 * create resource in DB
 * @param {Object} restClient Got-instance
 * @param {string | Buffer } query XQuery main module
 * @param {string} path context path
 * @param {Object} [options] query options
 * @returns {Object} Response with headers and exist specific values
 */
async function post (restClient, query, path, options) {
  const url = normalizeDBPath(path)
  const attributes = []
  const properties = []

  if (options) {
    for (const attributeIndex in postAttributeNames) {
      const attributeName = postAttributeNames[attributeIndex]
      if (options[attributeName]) {
        attributes.push(`${attributeName}="${options[attributeName]}"`)
        delete options[attributeName]
      }
    }

    for (const option in options) {
      properties.push(`<property name="${option}" value="${options[option]}"/>`)
    }
  }

  const body = `<query xmlns="http://exist.sourceforge.net/NS/exist"
    ${attributes.join(' ')}>
  <text><![CDATA[
    ${query.toString()}
  ]]></text>
  <properties>
    ${properties.join('\n')}
  </properties>
</query>`

  const response = await restClient.post({
    url,
    headers: {
      'content-type': 'application/xml',
      'content-length': body.length
    },
    body
  })

  return extendIfWrapped(response)
}

/**
 * read resources and collection contents in DB
 * @param {Object} restClient Got-instance
 * @param {string} path which resource to read
 * @param {Object} [searchParams] query options
 * @param {stream.Writable | undefined} [writableStream] if provided allows to stream onto the file system for instance
 * @returns {Object} Response with body and headers
 */
async function get (restClient, path, searchParams, writableStream) {
  const url = normalizeDBPath(path)
  if (writableStream instanceof stream.Writable) {
    const readStream = restClient.stream({ url, searchParams })

    let _response
    readStream.on('response', response => {
      _response = response
    })

    await pipeline(
      readStream,
      writableStream
    )
    return extendIfWrapped(_response)
  }

  const response = await restClient.get({ url, searchParams })
  return extendIfWrapped(response)
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
  get,
  post,
  put,
  del
}
