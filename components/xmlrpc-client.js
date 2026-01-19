import http from 'node:http'
import https from 'node:https'

/**
 * Escape XML special characters
 */
function escapeXml (str) {
  if (typeof str !== 'string') return str
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Unescape XML special characters
 */
function unescapeXml (str) {
  if (typeof str !== 'string') return str
  return str
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
}

/**
 * Convert a value to XML-RPC format
 */
function valueToXml (value) {
  if (typeof value === 'string') {
    return `<string>${escapeXml(value)}</string>`
  } else if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return `<int>${value}</int>`
    } else {
      return `<double>${value}</double>`
    }
  } else if (typeof value === 'boolean') {
    return `<boolean>${value ? '1' : '0'}</boolean>`
  } else if (value instanceof Date) {
    return `<dateTime.iso8601>${value.toISOString()}</dateTime.iso8601>`
  } else if (Buffer.isBuffer(value)) {
    return `<base64>${value.toString('base64')}</base64>`
  } else if (Array.isArray(value)) {
    const items = value.map(v => `<value>${valueToXml(v)}</value>`).join('')
    return `<array><data>${items}</data></array>`
  } else if (value === null || value === undefined) {
    return '<nil/>'
  } else if (typeof value === 'object') {
    const members = Object.entries(value)
      .map(([key, val]) => `<member><name>${escapeXml(key)}</name><value>${valueToXml(val)}</value></member>`)
      .join('')
    return `<struct>${members}</struct>`
  }
  return `<string>${escapeXml(String(value))}</string>`
}

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
    const tagName = this.parseTagName()
    const attributes = this.parseAttributes()

    // Check for self-closing tag
    if (this.xml.substring(this.pos, this.pos + 2) === '/>') {
      this.pos += 2
      return { tag: tagName, attributes, text: '', children: [] }
    }

    if (this.xml[this.pos] !== '>') {
      throw new Error(`Expected '>' at position ${this.pos}`)
    }
    this.pos++ // skip '>'

    // Parse content
    const content = this.parseContent(tagName)

    return { tag: tagName, attributes, text: content.text, children: content.children }
  }

  parseTagName () {
    const start = this.pos
    while (this.pos < this.xml.length && /[a-zA-Z0-9._:-]/.test(this.xml[this.pos])) {
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
      const name = this.parseTagName()
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
            return { text: text.trim(), children }
          }
        }
        if (text.trim()) {
          children.push({ type: 'text', value: text.trim() })
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
    while (this.pos < this.xml.length && /\s/.test(this.xml[this.pos])) {
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

/**
 * Convert parsed XML element to JavaScript value based on XML-RPC type
 */
function xmlElementToValue (element) {
  if (!element || typeof element !== 'object') return element

  const tag = element.tag
  const text = element.text || ''
  const children = element.children || []

  switch (tag) {
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
      const dataElement = children.find(c => c.tag === 'data')
      if (!dataElement) return []
      return dataElement.children
        .filter(c => c.tag === 'value')
        .map(valueElement => xmlElementToValue(valueElement.children[0] || { tag: 'string', text: valueElement.text }))
    }

    case 'struct': {
      const result = {}
      children.forEach(member => {
        if (member.tag === 'member') {
          const nameElement = member.children.find(c => c.tag === 'name')
          const valueElement = member.children.find(c => c.tag === 'value')
          if (nameElement && valueElement) {
            const key = nameElement.text
            const value = valueElement.children[0]
              ? xmlElementToValue(valueElement.children[0])
              : valueElement.text
            result[key] = value
          }
        }
      })
      return result
    }

    case 'value':
      // Value with no explicit type - check if it has child elements
      if (children.length === 0) {
        return text // Untyped string
      }
      return xmlElementToValue(children[0])

    default:
      return text
  }
}

/**
 * Create a native XML-RPC client
 */
export function createClient (options) {
  const client = {
    host: options.host,
    port: options.port,
    path: options.path,
    secure: options.protocol === 'https:',
    auth: options.basic_auth ? `${options.basic_auth.user}:${options.basic_auth.pass}` : null,
    rejectUnauthorized: options.rejectUnauthorized !== false,
    isSecure: options.protocol === 'https:',

    methodCall (methodName, args, callback) {
      const requestBody = buildXmlRpcCall(methodName, args)

      const requestOptions = {
        hostname: this.host,
        port: this.port,
        path: this.path,
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'Content-Length': Buffer.byteLength(requestBody)
        }
      }

      if (this.auth) {
        requestOptions.headers.Authorization = 'Basic ' + Buffer.from(this.auth).toString('base64')
      }

      if (this.secure) {
        requestOptions.rejectUnauthorized = this.rejectUnauthorized
      }

      const transport = this.secure ? https : http

      const req = transport.request(requestOptions, (res) => {
        let body = ''
        res.on('data', chunk => { body += chunk })
        res.on('end', () => {
          try {
            const result = parseXmlRpcResponse(body)
            if (result.fault) {
              const error = new Error(result.fault.faultString)
              error.faultString = result.fault.faultString
              error.code = result.fault.faultCode
              callback(error)
            } else {
              callback(null, result)
            }
          } catch (e) {
            callback(e)
          }
        })
      })

      req.on('error', (err) => {
        callback(err)
      })

      req.write(requestBody)
      req.end()
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

/**
 * Build XML-RPC method call
 */
function buildXmlRpcCall (methodName, args) {
  const params = args.map(arg => `<param><value>${valueToXml(arg)}</value></param>`).join('')
  return `<?xml version="1.0"?>
<methodCall>
<methodName>${escapeXml(methodName)}</methodName>
<params>${params}</params>
</methodCall>`
}

/**
 * Parse XML-RPC response using proper XML parser
 */
function parseXmlRpcResponse (xmlResponse) {
  try {
    const parser = new XmlParser(xmlResponse)
    const root = parser.parse()

    if (root.tag === 'methodResponse') {
      // Handle fault responses
      const fault = root.children.find(c => c.tag === 'fault')
      if (fault) {
        const value = fault.children.find(c => c.tag === 'value')
        if (value) {
          const faultValue = xmlElementToValue(value)
          return { fault: faultValue }
        }
      }

      // Handle normal responses
      const params = root.children.find(c => c.tag === 'params')
      if (params) {
        const param = params.children.find(c => c.tag === 'param')
        if (param) {
          const value = param.children.find(c => c.tag === 'value')
          if (value) {
            return xmlElementToValue(value)
          }
        }
      }

      throw new Error('No params or fault in methodResponse')
    }

    throw new Error('Not a methodResponse')
  } catch (e) {
    throw new Error(`Failed to parse XML-RPC response: ${e.message}`)
  }
}
