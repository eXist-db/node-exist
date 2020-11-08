xquery version "3.1";

declare variable $packageUri external;

try {
    let $found := exists(repo:list()[. = $packageUri])
    let $removed := 
        not($found) or
        (repo:undeploy($packageUri)/@result = "ok") and
        repo:remove($packageUri)

    return
        serialize(
            map {"success": $removed},
            map {"method":"json"}
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
        map {"method":"json"}
    )
}
