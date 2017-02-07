/**
 * @name: so.object
 * @deps: so
 */

;(function($) {

"use strict"; // @tmp

$.extend($.object, {
    map: function(input, fn) {
        for (var i in input) {
            input[i] = fn.call(input, input[i], i);
        }
        return input;
    },
    filter: function(input, fn) {
        for (var i in input) {
            if (!fn.call(input, input[i], i)) {
                delete input[i];
            }
        }
        return input;
    },
    hasKey: function(input, search, strict) {
        for (var i in input) {
            if (!strict ? search == i : search === i) {
                return true;
            }
        }
        return false;
    },
    hasValue: function(input, search, strict) {
        for (var i in input) {
            if (!strict ? search == input[i] : search === input[i]) {
                return true;
            }
        }
        return false;
    }
});

// define exposer
$.toString("object");

})(so);
