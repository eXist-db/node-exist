import { Agent } from 'undici'

// Map to escape XML special characters
const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;'
}
const matchEscapeChars = /[&<>"']/g

/**
 * Escape XML special characters using character map
 */
function escapeXml (str) {
  return str.replace(matchEscapeChars, char => ESCAPE_MAP[char])
}

// Reverse map for unescaping
const UNESCAPE_MAP = {
  '&apos;': "'",
  '&quot;': '"',
  '&gt;': '>',
  '&lt;': '<',
  '&amp;': '&'
}
const matchEntities = /&apos;|&quot;|&gt;|&lt;|&amp;/g

/**
 * Unescape XML special characters using entity map
 */
function unescapeXml (str) {
  if (!str.includes('&')) {
    return str
  }
  return str.replace(matchEntities, entity => UNESCAPE_MAP[entity])
}

function buildNumberXml (num) {
  return Number.isInteger(num) ? `<int>${num}</int>` : `<double>${num}</double>`
}

function buildArrayValueXml (result, value) {
  return result + `<value>${valueToXml(value)}</value>`
}
function buildArrayXml (arr = []) {
  return `<array><data>${arr.reduce(buildArrayValueXml, '')}</data></array>`
}

function buildMemberXml (result, [key, value]) {
  return result + `<member><name>${escapeXml(key)}</name><value>${valueToXml(value)}</value></member>`
}
function buildStructXml (obj) {
  return `<struct>${Object.entries(obj).reduce(buildMemberXml, '')}</struct>`
}

/**
 * Convert a value to XML-RPC format
 */
function valueToXml (value) {
  const type = typeof value
  switch (type) {
    case 'string':
      return `<string>${escapeXml(value)}</string>`
    case 'number':
      return buildNumberXml(value)
    case 'boolean':
      return `<boolean>${value ? '1' : '0'}</boolean>`
    case 'object':
      if (value === null) {
        return '<nil/>'
      }
      if (Array.isArray(value)) {
        return buildArrayXml(value)
      }
      if (value instanceof Date) {
        return `<dateTime.iso8601>${value.toISOString()}</dateTime.iso8601>`
      }
      if (Buffer.isBuffer(value)) {
        return `<base64>${value.toString('base64')}</base64>`
      }
      return buildStructXml(value)
    default:
      return `<string>${escapeXml(String(value))}</string>`
  }
}

function renderParams (params = []) {
  return params
    .map(param => `<param><value>${valueToXml(param)}</value></param>`)
    .join('')
}

/**
 * Build XML-RPC method call
 * @param {string} methodName method name
 * @param {Array} params method parameters
 * @returns {string} XML-RPC request body
 */
function buildXmlRpcCall (methodName, params = []) {
  return `<?xml version="1.0"?><methodCall><methodName>${escapeXml(methodName)}</methodName><params>${renderParams(params)}</params></methodCall>`
}

// Pre-compiled regex patterns for reuse
const matchNCNameCharacter = /[a-zA-Z0-9._:-]/
const matchWhiteSpaceCharacters = /\s/

/**
 * Simple but proper XML tokenizer and parser
 */
class XmlParser {
  constructor (xml) {
    this.xml = xml
    this.pos = 0
  }

  parse () {
    return this.parseElement()
  }

  parseElement () {
    this.skipWhitespace()
    if (this.xml[this.pos] !== '<') {
      throw new Error(`Expected '<' at position ${this.pos}`)
    }
    this.pos++ // skip '<'

    // Check for comment or declaration
    if (this.xml.substring(this.pos, this.pos + 3) === '!--') {
      this.skipComment()
      return this.parseElement()
    }
    if (this.xml[this.pos] === '?') {
      this.skipDeclaration()
      return this.parseElement()
    }

    // Check for closing tag
    if (this.xml[this.pos] === '/') {
      throw new Error(`Unexpected closing tag at position ${this.pos}`)
    }

    // Parse tag name
    const name = this.parseNCName()
    const attributes = this.parseAttributes()

    // Check for self-closing tag
    if (this.xml.substring(this.pos, this.pos + 2) === '/>') {
      this.pos += 2
      return { name, attributes, text: '', children: [] }
    }

    if (this.xml[this.pos] !== '>') {
      throw new Error(`Expected '>' at position ${this.pos}`)
    }
    this.pos++ // skip '>'

    // Parse content
    const { text, children } = this.parseContent(name)

    return { name, attributes, text, children }
  }

  parseNCName () {
    const start = this.pos
    while (this.pos < this.xml.length && matchNCNameCharacter.test(this.xml[this.pos])) {
      this.pos++
    }
    return this.xml.substring(start, this.pos)
  }

  parseAttributes () {
    const attributes = {}
    while (true) {
      this.skipWhitespace()
      if (this.xml[this.pos] === '>' || this.xml.substring(this.pos, this.pos + 2) === '/>') {
        break
      }
      const name = this.parseNCName()
      this.skipWhitespace()
      if (this.xml[this.pos] !== '=') {
        throw new Error(`Expected '=' at position ${this.pos}`)
      }
      this.pos++
      this.skipWhitespace()
      const value = this.parseAttributeValue()
      attributes[name] = value
    }
    return attributes
  }

  parseAttributeValue () {
    const quote = this.xml[this.pos]
    if (quote !== '"' && quote !== "'") {
      throw new Error(`Expected quote at position ${this.pos}`)
    }
    this.pos++
    const start = this.pos
    while (this.pos < this.xml.length && this.xml[this.pos] !== quote) {
      this.pos++
    }
    const value = this.xml.substring(start, this.pos)
    this.pos++ // skip closing quote
    return unescapeXml(value)
  }

  parseContent (closingTag) {
    const children = []
    let text = ''

    while (this.pos < this.xml.length) {
      if (this.xml[this.pos] === '<') {
        if (this.xml.substring(this.pos, this.pos + 2) === '</') {
          // Check if this is the closing tag we're looking for
          const tagStart = this.pos + 2
          let tagEnd = tagStart
          while (tagEnd < this.xml.length && this.xml[tagEnd] !== '>') {
            tagEnd++
          }
          const tag = this.xml.substring(tagStart, tagEnd).trim()
          if (tag === closingTag) {
            this.pos = tagEnd + 1
            return { text: unescapeXml(text.trim()), children }
          }
        }
        if (text.trim()) {
          children.push({ type: 'text', value: unescapeXml(text.trim()) })
        }
        text = ''
        children.push(this.parseElement())
      } else {
        text += this.xml[this.pos]
        this.pos++
      }
    }

    throw new Error(`Unclosed tag: ${closingTag}`)
  }

  skipWhitespace () {
    while (this.pos < this.xml.length && matchWhiteSpaceCharacters.test(this.xml[this.pos])) {
      this.pos++
    }
  }

  skipComment () {
    while (this.pos < this.xml.length && this.xml.substring(this.pos, this.pos + 3) !== '-->') {
      this.pos++
    }
    this.pos += 3
  }

  skipDeclaration () {
    while (this.pos < this.xml.length && this.xml.substring(this.pos, this.pos + 2) !== '?>') {
      this.pos++
    }
    this.pos += 2
  }
}

function filterByTagName (tagName) {
  return element => element.name === tagName
}

function reduceStruct (result, member) {
  const nameElement = member.children.find(filterByTagName('name'))
  const valueElement = member.children.find(filterByTagName('value'))
  if (!(nameElement || valueElement)) {
    return result
  }
  const key = nameElement.text
  const value = parseValueElement(valueElement)
  result[key] = value
  return result
}

/**
 * Convert parsed XML element to JavaScript value based on XML-RPC type
 * @param {{tag:string, text:string|null, children:Array|null}} [element] parsed XML element
 * @returns {any} converted JavaScript value
 */
function parseValueElement (element) {
  if (!element || typeof element !== 'object' || element.name !== 'value') {
    throw new Error('Invalid XML element')
  }

  if (!element.children.length) {
    return element.text || '' // Untyped string
  }

  const { name, text, children } = element.children[0]
  switch (name) {
    case 'int':
    case 'i4':
      return parseInt(text, 10)

    case 'double':
      return parseFloat(text)

    case 'boolean':
      return text === '1'

    case 'string':
      return unescapeXml(text)

    case 'base64':
      return Buffer.from(text, 'base64')

    case 'dateTime.iso8601':
      return new Date(text)

    case 'nil':
      return null

    case 'array': {
      const dataElement = children.find(filterByTagName('data'))
      if (!dataElement) throw new Error('Invalid array structure')
      return dataElement.children
        .filter(filterByTagName('value'))
        .map(valueElement => parseValueElement(valueElement))
    }

    case 'struct': {
      return children
        .filter(filterByTagName('member'))
        .reduce(reduceStruct, {})
    }

    default:
      throw new Error(`Unsupported XML-RPC value type: ${name}`)
  }
}

/**
 * Parse XML-RPC response using proper XML parser
 */
function parseXmlRpcResponse (xmlResponse) {
  try {
    const parser = new XmlParser(xmlResponse)
    const root = parser.parse()
    if (root.name !== 'methodResponse') {
      throw new Error('Not a methodResponse')
    }
    const params = root.children.find(filterByTagName('params'))
    const fault = root.children.find(filterByTagName('fault'))

    if (!(params || fault)) {
      throw new Error('No params or fault in methodResponse')
    }

    // Handle fault responses
    if (fault) {
      const value = fault.children.find(filterByTagName('value'))
      if (value) {
        const faultValue = parseValueElement(value)
        return { fault: faultValue }
      }
    }

    // Handle normal responses
    const param = params.children.find(filterByTagName('param'))
    if (param) {
      const value = param.children.find(filterByTagName('value'))
      if (value) {
        return parseValueElement(value)
      }
    }
  } catch (e) {
    throw new Error(`Failed to parse XML-RPC response: ${e.message}`)
  }
}

/**
 * Create a native XML-RPC client
 */
export function createClient (options) {
  /* eslint camelcase: "off" */
  const { basic_auth, protocol, host, port, path, rejectUnauthorized } = options
  const auth = basic_auth ? `${basic_auth.user}:${basic_auth.pass}` : null
  const authorizationHeaderValue = auth ? 'Basic ' + Buffer.from(auth).toString('base64') : null

  const client = {
    isSecure: protocol === 'https:',
    agent: new Agent({
      connect: {
        rejectUnauthorized
      }
    }),
    async methodCall (methodName, params = []) {
      const body = buildXmlRpcCall(methodName, params)
      // TRACE - debug XML-RPC request
      // console.log('XML-RPC Request Body:', body)

      const headers = {
        Accept: 'text/xml, application/xml',
        'Content-Type': 'text/xml',
        'Content-Length': Buffer.byteLength(body)
      }
      if (authorizationHeaderValue) {
        headers.Authorization = authorizationHeaderValue
      }
      const requestOptions = {
        dispatcher: this.agent,
        method: 'POST',
        headers,
        body
      }
      const requestUrl = `${protocol}//${host}:${port}${path}`
      const response = await fetch(requestUrl, requestOptions)
      const rpcResponse = await response.text()

      // TRACE - debug XML-RPC request
      // console.log('XML-RPC response:', rpcResponse)

      const parsedResult = parseXmlRpcResponse(rpcResponse)
      if (parsedResult.fault) {
        const error = new Error('XML-RPC fault: ' + parsedResult.fault.faultString)
        error.faultString = parsedResult.fault.faultString
        throw error
      } else {
        return parsedResult
      }
    }
  }

  return client
}

/**
 * Create a secure XML-RPC client (HTTPS)
 */
export function createSecureClient (options) {
  return createClient({ ...options, protocol: 'https:', rejectUnauthorized: options.rejectUnauthorized !== false })
}
