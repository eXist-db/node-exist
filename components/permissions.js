const complexQuery = require('./queries').complex
const parseResult = require('./result-parser').exist

function readPermissions (client, path) {
  const q = `xquery version "3.1";

    declare variable $local:file := xs:anyURI("${path}");
    declare variable $local:error := QName('node/exist', 'read-permission-error');
    
    try {
        if (not(sm:has-access($local:file, 'r--')))
        then error($local:error, 'No access')
        else (
            sm:get-permissions($local:file)
        )
    }
    catch * { <error>{$err:description}</error> }`

  return complexQuery(client, q).then(parseResult)
}

function setPermissions (client, path, permissions) {
  const q = `xquery version "3.1";

declare variable $local:file := xs:anyURI("${path}");
declare variable $local:owner := "${permissions.owner}";
declare variable $local:group := "${permissions.group}";
declare variable $local:mode := "${permissions.mode}";
declare variable $local:error := QName('node/exist', 'set-permission-error');

try {
    if (not(doc-available("${path}") or xmldb:collection-available("${path}")))
    then error($local:error, 'Not found')
    else if (not(sm:has-access($local:file, 'rwx')))
    then error($local:error, 'No access')
    else if (not(sm:user-exists($local:owner)))
    then error($local:error, 'No such user', $local:owner)
    else if (not(sm:group-exists($local:group)))
    then error($local:error, 'No such group', $local:group)
    else (
        sm:chgrp($local:file, $local:group),
        sm:chown($local:file, $local:owner),
        sm:chmod($local:file, $local:mode),
        sm:get-permissions($local:file)
    )
}
catch * {
    <error code="{$err:code}">{$err:description}</error>
}`

  return complexQuery(client, q).then(parseResult)
}

exports.set = setPermissions
exports.read = readPermissions
