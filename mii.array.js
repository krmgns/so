;(function($) {

"use strict"; // @tmp

function makeArray(input) {
    if ($.typeOf(input) === "array") {
        return input;
    }

    var i = 0, arr = [];

    if (!input || // null, undefined, "", 0 etc.
            typeof input === "string" || input.nodeType ||
                   input.length === undefined || input == window) {
        arr = [input];
    } else {
        try {
            arr = fn_slice.call(input);
        } catch (e) {
            while (i < input.length) {
                arr.push(input[i++]);
            }
        }
    }

    return arr;
}

$.extend($.array, {
    make: function(input) {
        var i = 0, len = arguments.length, result = [];
        while (i < len) {
            result = result.concat(makeArray(arguments[i++]));
        }
        return result;
    },
    filter: function(input, fn) {
        var i = 0, len = input.length, result = [];
        for (i; i < len; i++) {
            if (fn.call(input, input[i], i)) {
                result.push(input[i]);
            }
        }
        return result;
    },
    has: function(input, src) {
        for (var i = input.length - 1; i >= 0; i--) {
            if (src == input[i]) {
                return true;
            }
        }
        return false;
    }
});

// Define exposer
$.toString("array", "mii.array");

})(mii);