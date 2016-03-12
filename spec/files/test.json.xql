xquery version "3.0";

(: this is the important part for JSON results :)
declare option exist:serialize "method=json media-type=text/javascript";

(: return something :)
<result>
    {
        for $item in (1, 2, 3)
            return <item>{$item}</item>
    }
</result>
