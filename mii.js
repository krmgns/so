function log(s) { console.log(s) }

;(function(window, undefined) {

"use strict"; // @tmp

var document = window.document,
    fn_slice = [].slice,
    fn_toString = {}.toString,
    re_trim = /^\s+|\s+$/g,
    _uuid = 0
;

function makeArray(input) {
    if (mii.typeOf(input) === "array") {
        return input;
    }

    var array = [],
        i = 0;

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

var mii = {
    fun: function() {},

    now: function() {
        return +(new Date);
    },

    uuid: function() {
        return ++_uuid;
    },

    win: function(el) {
        if (!el) return window;
        return el == el.window ?
                   el : el.nodeType === 9 ?
                       (el.defaultView || el.parentWindow) : null;
    },

    doc: function(el) {
        return (el && el.ownerDocument) || document;
    },

    typeOf: function(x) {
        if (x === null)               return "null";
        if (typeof x === "undefined") return "undefined";
        if (x.alert && x == x.window) return "window";
        if (x.nodeType === 9)         return "document";
        // if (!isNaN(parseFloat(x)) && isFinite(x)) return "numeric";
        // if (typeof x !== "number" && /^\d+$/.test(x)) return "numeric";
        return fn_toString.call(x).slice(8, -1).toLowerCase();
    },

    trim: function(s) {
        return (s != null) ? s.replace(re_trim, "") : "";
    },

    isEmpty: function(x) {
        var type = this.typeOf(x);
        if (type === "undefined" || !x) return true; // "", null, false, undefined, 0, NaN
        if (type === "array" || typeof x.length === "number") return !x.length;
        if (type === "object") for (var i in x) return false; return true;
        return false;
    },

    forEach: function(input, fn, scope) {
        var len = input && input.length, i;
        if (len !== undefined) {
            for (i = 0; i < len; i++) {        // val => i
                if (fn.call(scope || input[i], input[i], i, input) === false) break;
            }
        } else {
            for (i in input) {                 // key => val
                if (fn.call(scope || input[i], i, input[i], input) === false) break;
            }
        }
        return scope || input;
    },

    filter: function(array, fn) {
        array = array || [];
        for (var i = 0, len = array.length, result = []; i < len; i++) {
            if (fn(array[i], i)) {
                result.push(array[i]);
            }
        }
        return result;
    },

    toArray: function(input) {
        var i = 0, len = arguments.length, array = [];
        while (i < len) {
            array = array.concat(makeArray(arguments[i++]));
        }
        return array;
    },

    inArray: function(src, array) {
        for (var i = array.length - 1; i >= 0; i--) {
            if (array[i] == src) {
                return true;
            }
        }
        return false;
    },

    mix: function() {
        var args = arguments, i = 1, target, source;
        if (args.length < 2) {
            throw ("mii.mix(): Function accepts at least 2 arguments.");
        }
        target = args[0];
        while (source = args[i++]) {
            for (var key in source) {
                source.hasOwnProperty(key)
                    && (target[key] = source[key]);
            }
        }
        return target;
    },

    extend: function(target, source) {
        var targetType = typeof target,
            sourceType = typeof source;

        if (targetType === "object" && sourceType === "undefined") {
            // self extend
            source = target, target = this;
        } else if (targetType === "string") {
            target = !this[target]
                ? this[target] = {}
                : this[target];
        }

        return this.mix(target, source);
    },

    toString: function() {
        var args = arguments;
        if (!args.length) {
            return "[object mii]";
        }
        // Define `toString` methods of modules
        this[args[0]].toString = function() {
            return "[object "+ args[1] +"]";
        };
    }
};

// On ready
var onReadyCallbacks = [];

mii.onReady = function(callback) {
    if (typeof callback === "function") {
        onReadyCallbacks.push(callback);
    }
    // I think enough so.. <https://developer.mozilla.org/en-US/docs/DOM/document.readyState>
    document.onreadystatechange = function() {
        if (this.readyState === "complete") {
            document.onreadystatechange = null;
            while (onReadyCallbacks.length) {
                onReadyCallbacks.shift()(mii);
            }
        }
    };
};


// Browser
var re_browsers = {
    firefox: /firefox\/([\d\.]+)/,
    chrome: /chrome\/([\d\.]+)/,
    safari: /webkit.*?version\/([\d\.]+)/,
    opera: /opera.*?version\/([\d\.]+)/,
    ie: /msie\s+([\d\.]+)/
};

mii.browser = function() {
    var ua = window.navigator.userAgent.toLowerCase(), k, re, browser = {};
    for (k in re_browsers) {
        if (re = re_browsers[k].exec(ua)) {
            break;
        }
    }
    browser[k] = true;
    browser["version"] = parseFloat(re && re[1]);
    browser["versionOrig"] = re[1];
    return browser;
}();

// `mii` to window
window.mii = mii;

})(window);
