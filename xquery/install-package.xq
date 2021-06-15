xquery version "3.1";

declare namespace expath="http://expath.org/ns/pkg";
(: declare namespace output="http://www.w3.org/2010/xslt-xquery-serialization";
declare option output:method "json";
declare option output:media-type "application/json"; :)

declare variable $xarPath external;
declare variable $publicRepoURL external;


declare function local:remove ($package-uri as xs:string) as xs:boolean {
    (repo:undeploy($package-uri)/@result = "ok") and
    repo:remove($package-uri)
};

declare function local:only-package-meta (
    $path as xs:anyURI,
    $type as xs:string,
    $param as item()*
) as xs:boolean {
    $path = "expath-pkg.xml"
};

declare function local:pass-through-data (
    $path as xs:anyURI,
    $type as xs:string,
    $data as item()?,
    $param as item()*
) {
    $data
};

declare function local:get-package-meta ($xar-path as xs:string) {
    compression:unzip(
        util:binary-doc($xar-path),
        local:only-package-meta#3, (),
        local:pass-through-data#4, ()
    )
};

try {
    let $meta := local:get-package-meta($xarPath)

    let $package-uri := $meta//expath:package/string(@name)
    let $found := $package-uri = repo:list()

    let $removed := 
        if ($found)
        then local:remove($package-uri)
        else ()

    let $can-install := not($found) or $removed
    let $installation :=
        if ($can-install)
        then repo:install-and-deploy-from-db(
            $xarPath,
            $publicRepoURL || "/find"
        )
        else error(
            xs:QName("installation-error"), 
            "package could not be installed"
        )

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
