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
        for (var i = 0, len = input.length, result = []; i < len; i++) {
            result[i] = fn.call(input, i, input[i]);
        }
        return result;
    },
    filter: function(input, fn) {
        for (var i = 0, len = input.length, result = []; i < len; i++) {
            if (fn.call(input, i, input[i])) {
                result.push(input[i]);
            }
        }
        return result;
    },
    has: function(input, search, strict) {
        for (var i = 0, len = input.length, ok; i < len; i++) {
            if (!strict ? search == input[i] : search === input[i]) {
                return true;
            }
        }
        return false;
    }
});

// define exposer
$.toString("array", "so.array");

})(so);
