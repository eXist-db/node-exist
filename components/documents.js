
function upload (client, path, contentBuffer, mimetype) {
  return client
    .set('content-type', mimetype || 'application/octet-stream')
    .set('content-length', contentBuffer.length)
    .put(path)
    .send(contentBuffer)
}

function read (client, documentName, options) {
  return client
    .get(documentName)
    .query(options)
}

module.exports = {
  upload: upload,
  read: read,
  remove: (client, documentName) => client.delete(documentName)
}
