/**
 * @name: so.object
 * @deps: so
 */

;(function($) {

"use strict"; // @tmp

$.extend($.object, {
    filter: function(input, fn) {
        for (var i in input) {
            if (!fn.call(input, input[i], i)) {
                delete input[i];
            }
        }
        return input;
    },
    hasKey: function(input, src) {
        for (var i in input) {
            if (src == i) {
                return true;
            }
        }
        return false;
    },
    hasVal: function(input, src) {
        for (var i in input) {
            if (src == input[i]) {
                return true;
            }
        }
        return false;
    },
    keys: function(input) {
        var i, result = [];
        for (i in input) {
            result.push(i);
        }
        return result;
    },
    vals: function(input) {
        var i, result = [];
        for (i in input) {
            result.push(input[i]);
        }
        return result;
    },
    pick: function(source, key, deleting) {
        source || (source = {});
        var value = source[key];
        if (deleting !== false) {
            delete source[key];
        }
        return value;
    }
});

// define exposer
$.toString("object", "so.object");

})(so);
