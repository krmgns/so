/**
 * @name: so.ext
 * @deps: so
 */

;(function($) { 'use strict';

    $.extend('@ext', {
        toCamelCaseFromDashCase: function(input) {
            return (''+ input).replace(/-([a-z])/gi, function($0, $1) {
                return $1.toUpperCase();
            });
        },
        toDashCaseFromUpperCase: function(input) {
            return (''+ input).replace(/([A-Z])/g, function($0, $1) {
                return '-'+ $1.toLowerCase();
            });
        }
    });

})(so);
