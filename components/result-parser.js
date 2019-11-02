const xmljs = require('xml-js')

/*
    <exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist">
        <exist:collection name="/db/xinclude" owner="guest" group="guest" permissions="rwur-ur-u">
            <exist:resource name="disclaimer.xml" owner="guest" group="guest" permissions="rwur-ur--"/>
            <exist:resource name="sidebar.xml" owner="guest" group="guest" permissions="rwur-ur--"/>
            <exist:resource name="xinclude.xml" owner="guest" group="guest" permissions="rwur-ur--"/>
        </exist:collection>
    </exist:result>
*/
/*
    <exist:result xmlns:exist="http://exist.sourceforge.net/NS/exist" exist:hits="1" exist:start="1" exist:count="1" exist:compilation-time="0" exist:execution-time="0">
        <sm:permission xmlns:sm="http://exist-db.org/xquery/securitymanager" owner="ibo" group="ibuser" mode="rwx------">
            <sm:acl entries="0"/>
        </sm:permission>
    </exist:result>
*/

function existResultParser (response) {
  return new Promise(function (resolve, reject) {
    const body = response.body.toString()
    try {
      response.json = xmljs.xml2js(body, { compact: true })
      if (response.json['exist:result'].error) {
        response.error = response.json['exist:result'].error._text
      }
      resolve(response)
    } catch (e) {
      reject(e)
    }
  })
}

exports.exist = existResultParser
