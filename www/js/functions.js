/**
 * ...................................................................
 *
 * Functions
 *
 * ...................................................................
 */
function reload() {
    location.reload(true);
}
/**
 * URL: https://www.onfis.com:10443/0.0.6.html?a=b&c=d&number=4
 * Output : Object {a: "b", c: "d", number: "4"}
 */
function getQueryString() {
    var query = location.href.split('?')[1];
    var qs = {};
    if ( query ) {
        var kvs = query.split('&');
        if ( kvs ) {
            for ( var i in kvs ) {
                var kv = kvs[i].split('=');
                qs[ kv[0] ] = kv[1];
            }
        }
    }
    return qs;
}