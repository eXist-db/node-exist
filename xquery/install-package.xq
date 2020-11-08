xquery version "3.1";

declare variable $packageUri external;
declare variable $xarName external;
declare variable $publicRepoURL external;

try {
    let $found := exists(repo:list()[. = $packageUri])
    let $removed := 
        $found and
        (repo:undeploy($packageUri)/@result = "ok") and
        repo:remove($packageUri)
    let $can-install := not($found) or $removed
    let $installation :=
        if ($can-install)
        then (repo:install-and-deploy-from-db(
            "/db/system/repo/" || $xarName,
            $publicRepoURL || "/modules/find.xql"
        ))
        else (error(xs:QName("installation-error"), "package could not be installed"))
    let $installed := $installation/@result = "ok"

    return
    serialize(
        map {
            "success": $installed,
            "result": map {
                "update": $found,
                "target": $installation/@target/string()
            }
        }, 
        map { "method": "json" }
    )
}
catch * {
    serialize(
        map {
            "success": false(),
            "error": map {
                "code": $err:code,
                "description": $err:description,
                "value": $err:value
            }
        }, 
        map { "method": "json" }
    )
}
