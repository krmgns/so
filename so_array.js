/**
 * @name: so.array
 * @deps: so
 */

;(function($) { 'use strict';

    $.extend('@array', {
        has: function(input, search, strict) {
            for (var i = 0, len = input.length; i < len; i++) {
                if (!strict ? search == input[i] : search === input[i]) {
                    return true;
                }
            }
            return false;
        },
        find: function(input, search, opt_retDefault) {
            var ret = opt_retDefault;

            $.forEach(input, function(value) {
                if (search(value)) {
                    ret = value;
                    return false; // break
                }
            });

            return ret;
        },
        findIndex: function(input, search, opt_retDefault) {
            var ret = opt_retDefault;

            $.forEach(input, function(value, key) {
                if (search(value)) {
                    ret = key;
                    return false; // break
                }
            });

            return ret;
        }
    });

})(so);
