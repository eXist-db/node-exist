import { types } from 'node:util'
import { Readable, Writable } from 'node:stream'
import { getMimeType } from '../util/mime.js'

/**
 * @typedef { import("undici").Client } Client
 */

const isGeneratorFunction = types.isGeneratorFunction

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
 * @param {Client} client undici.Client instance
 * @param {string | Buffer | Readable | Generator | AsyncGenerator | FormData} body contents of the resource
 * @param {string} rawPath where to create resource
 * @param {string | undefined} [mimetype] enforce specific mimetype
 * @returns {Promise<any>} Response with headers
 */
async function put (client, body, rawPath, mimetype) {
  const path = normalizeDBPath(rawPath)
  const headers = {
    'content-type': getMimeType(rawPath, mimetype)
  }

  if (body instanceof Readable) {
    return client.request({
      method: 'PUT',
      path,
      headers,
      body
    })
  }

  if (isGeneratorFunction(body)) {
    return client.request({
      method: 'PUT',
      path,
      headers,
      body: body()
    })
  }

  return client.request({
    method: 'PUT',
    path,
    headers: {
      ...headers,
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

function extendIfWrapped (response, bodyText) {
  if (!isExistResult(bodyText)) {
    response.bodyText = bodyText
    return response
  }
  const session = getAttributeValueByRegex(bodyText, sessionRegex)
  const hits = getAttributeValueByRegex(bodyText, hitsRegex)
  const start = getAttributeValueByRegex(bodyText, startRegex)
  const count = getAttributeValueByRegex(bodyText, countRegex)
  const compilationTime = getAttributeValueByRegex(bodyText, compilationTimeRegex)
  const executionTime = getAttributeValueByRegex(bodyText, executionTimeRegex)
  const wrapped = Object.assign(response, {
    session,
    hits,
    start,
    count,
    compilationTime,
    executionTime,
    bodyText
  })
  return wrapped
}

/**
 * create resource in DB
 * @param {Client} client REST interface with a database instance
 * @param {string | Buffer } query XQuery main module
 * @param {string} rawPath context path
 * @param {Object} [options] query options
 * @returns {Promise<any>} Response with headers and exist specific values
 */
async function post (client, query, rawPath, options) {
  const path = normalizeDBPath(rawPath)
  const attributes = []
  const properties = []

  if (options) {
    for (const attributeIndex in postAttributeNames) {
      const attributeName = postAttributeNames[attributeIndex]
      if (attributeName in options) {
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

  const response = await client.request({
    method: 'POST',
    path,
    headers: {
      'content-type': 'application/xml',
      'content-length': body.length
    },
    body
  })
  const bodyText = await response.body.text()
  return Promise.resolve(extendIfWrapped(response, bodyText))
}

/**
 * read resources and collection contents in DB
 * @param {Client} client undici.Client instance
 * @param {string} rawPath which resource to read
 * @param {Object} [searchParams] query options
 * @param {Writable} [writableStream] if provided allows to stream onto the file system for instance
 * @returns {Promise<any>} Response with body and headers
 */
async function get (client, rawPath, searchParams, writableStream) {
  const _path = normalizeDBPath(rawPath)
  let queryString
  if (searchParams) {
    const p = new URLSearchParams(searchParams)
    queryString = p.toString()
  }

  const path = _path + (queryString ? '?' + queryString : '')
  if (writableStream instanceof Writable) {
    let _statusCode
    let _headers
    await client.stream({
      path,
      method: 'GET'
      // opaque: { bufs }
    }, ({ statusCode, headers }) => {
      _statusCode = statusCode
      _headers = headers
      return writableStream
    })

    return {
      statusCode: _statusCode, headers: _headers
    }
    // extendIfWrapped(_response)
  }
  const response = await client.request({ path, method: 'GET' })
  const bodyText = await response.body.text()
  return Promise.resolve(extendIfWrapped(response, bodyText))
}

/**
 * delete a resource from the database
 * @param {Client} client undici.Client instance
 * @param {string} rawPath which resource to delete
 * @returns {Promise<any>} Response with body and headers
 */
async function del (client, rawPath) {
  const path = normalizeDBPath(rawPath)
  return await client.request({ path, method: 'DELETE' })
}

export {
  get,
  post,
  put,
  del
}
