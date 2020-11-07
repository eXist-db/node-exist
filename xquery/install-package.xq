xquery version "3.1";

declare variable $packageUri external;
declare variable $xarName external;

try {
    let $found := exists(repo:list()[. = $packageUri])
    let $removed := 
        $found and
        (repo:undeploy($packageUri)/@result = "ok") and
        repo:remove($packageUri)
    let $can-install := not($found) or $removed
    let $installation :=
        if ($can-install)
        then (repo:install-and-deploy-from-db("/db/system/repo/" || $xarName))
        else (error(xs:QName("installation-error"), "package could not be installed"))
    let $installed := $installation/@result = "ok"

    return
    serialize(
        map {
            "update": $found,
            "success": $installed,
            "target": $installation/@target/string()
        }, 
        map { "method": "json" }
    )
}
catch * {
    serialize(
        map {
            "error": map {
                "code": $err:code,
                "description": $err:description,
                "value": $err:value
            },
            "success": false()
        }, 
        map { "method": "json" }
    )
}
