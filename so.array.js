/**
 * @name: so.array
 * @deps: so
 */

;(function($) {

"use strict"; // @tmp

var fn_slice = [].slice;

function make(input) {
    if ($.typeOf(input) === "array") {
        return input;
    }

    var i = 0, array = [];

    if (!input || // null, undefined, "", 0 etc.
            typeof input === "string" || input.nodeType ||
                   input.length === undefined || input == window) {
        array = [input];
    } else {
        try {
            array = fn_slice.call(input);
        } catch (e) {
            while (i < input.length) {
                array.push(input[i++]);
            }
        }
    }

    return array;
}

$.extend($.array, {
    make: function() {
        var i = 0, len = arguments.length, result = [];
        while (i < len) {
            result = result.concat(make(arguments[i++]));
        }
        return result;
    },
    map: function(input, fn){
        var i = 0, len = input.length, result = [];
        for (i; i < len; i++) {
            result.push(fn.call(input, input[i], i))
        }
        return result;
    }
    filter: function(input, fn) {
        var i = 0, len = input.length, result = [];
        for (i; i < len; i++) {
            if (fn.call(input, input[i], i)) {
                result.push(input[i]);
            }
        }
        return result;
    },
    has: function(input, search) {
        for (var i = input.length - 1; i >= 0; i--) {
            if (search == input[i]) {
                return true;
            }
        }
        return false;
    }
});

// define exposer
$.toString("array", "so.array");

})(so);
