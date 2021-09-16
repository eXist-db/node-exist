const user = process.env.EXISTDB_USER || 'admin'
const pass = process.env.EXISTDB_PASS || ''
const server = process.env.EXISTDB_SERVER || 'http://localhost:8080'
const { port, hostname, protocol } = new URL(server)
const secure = protocol === 'https:'

const connectionOptions = {
  rejectUnauthorized: secure && hostname !== 'localhost',
  secure,
  basic_auth: { user, pass },
  host: hostname,
  port
}

module.exports = connectionOptions
