xquery version "3.1";

declare variable $packageUri external;

try {
    let $found := $packageUri = repo:list()
    let $removed :=
        if ($found)
        then 
            (repo:undeploy($packageUri)/@result = "ok") and
            repo:remove($packageUri)
        else true()

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
