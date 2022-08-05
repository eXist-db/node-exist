import { getRestClient } from '../../index.js'
import { envOptions } from '../connection.js'

const rc = await getRestClient(envOptions)

const resourcePath = '/db/rest-test/test.xml'

const xquery = `xquery version "3.1";

declare variable $collection := "/db/rest-test";

<collection name="{$collection}">
{
  for $resource in xmldb:get-child-resources($collection)
  return
    <resource name="{$resource}" />
}
</collection>
`

try {
  const { statusCode } = await rc.put('<root />', resourcePath)
  console.log('Creation response: ', statusCode)
  const { body } = await rc.get(resourcePath)
  console.log('File contents:', body)
  const post = await rc.post(xquery, 'db/rest-test', { indent: 'yes' })
  console.log('Post response:', post)
  const deletion = await rc.del('/db/rest-test')
  console.log('Deletion response: ', deletion.statusCode)
} catch (e) {
  console.error(e)
}
