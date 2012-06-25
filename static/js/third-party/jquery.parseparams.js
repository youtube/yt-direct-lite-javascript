/**
 * $.parseParams - parse query string paramaters into an object.
 */
(function($) {
var re = /([^&=]+)=?([^&]*)/g;
var decodeRE = /\+/g;  // Regex for replacing addition symbol with a space
var decode = function (str) { return decodeURIComponent( str.replace(decodeRE, " ") ); };
$.parseParams = function(query) {
    var params = {}, e;
    while ( e = re.exec(query) ) params[ decode(e[1]) ] = decode( e[2] );
    return params;
};
})(jQuery);