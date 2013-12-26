;(function($) {

"use strict"; // @tmp

$.extend($.ext, {
    toCamelCase: function(input) {
        return (""+ input).replace(/-([a-z])/g, function($0, $1) {
            return $1.toUpperCase();
        });
    }
});

// Define exposer
$.toString("ext", "mii.ext");

})(mii);