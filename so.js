/**
 * @name: so
 */

function log(s) { console.log(s) }

;(function(window, undefined) {

"use strict"; // @tmp

var document = window.document,

    fn_slice = [].slice,
    fn_toString = {}.toString,

    re_trim = /^\s+|\s+$/g,
    re_browsers = {
        firefox: /firefox\/([\d\.]+)/,
        chrome: /chrome\/([\d\.]+)/,
        safari: /webkit.*?version\/([\d\.]+)/,
        opera: /opera.*?version\/([\d\.]+)/,
        ie: /msie\s+([\d\.]+)/
    },

    _uuid = 0
;

/*** the so ***/
var so = {
    fun: function() {return function(){}; },

    now: function() {
        return Date.now ? Date.now() : (new Date).getTime();
    },

    uuid: function() {
        return ++_uuid;
    },

    win: function(el) {
        if (!el) {
            return window;
        }
        return (el == el.window)
            ? el : el.nodeType === 9
            ? (el.defaultView || el.parentWindow) : null;
    },

    doc: function(el) {
        return (el && el.ownerDocument) || document;
    },

    trim: function(s) {
        return (s != null) ? (""+ s).replace(re_trim, "") : "";
    },

    typeOf: function(x) {
        if (x === null) {
            return "null";
        }
        if (x === undefined || typeof x === "undefined") {
            return "undefined";
        }
        if (x.alert && x == x.window) {
            return "window";
        }
        if (x.nodeType === 9) {
            return "document";
        }

        return fn_toString.call(x).slice(8, -1).toLowerCase();
    },

    isSet: function(x, i) {
        return (i == null) ? x != null : x[i] != null;
    },

    isEmpty: function(x) {
        var type = this.typeOf(x), i;

        // "", null, false, undefined, 0, NaN
        if (!x || type === "undefined") {
            return true;
        }
        if (type === "array" || typeof x.length === "number") {
            return !x.length;
        }
        if (type === "object") {
            for (i in x) {
                return false;
            }
            return true;
        }

        return false;
    },

    forEach: function(input, fn, scope) {
        var len = input && input.length, i;
        if (len !== undefined) {
            // value => i
            for (i = 0; i < len; i++) {
                if (fn.call(scope || input[i], input[i], i, input) === false) {
                    break;
                }
            }
        } else {
            // key => value
            for (i in input) {
                if (fn.call(scope || input[i], i, input[i], input) === false) {
                    break;
                }
            }
        }
        return scope || input;
    },

    // note: options = $.mix({}, defaultOptions, options);
    mix: function() {
        var args = arguments, i = 1, target, source;
        if (args.length < 2) {
            throw ("so.mix(): Function accepts at least 2 arguments.");
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
            return "[object so]";
        }
        // define `toString` methods of modules
        this[args[0]].toString = function() {
            return "[object "+ args[1] +"]";
        };
    }
};

var callbacks = [];

function fireCallbacks() {
    while (callbacks.length) {
        callbacks.shift()(so);
    }
}

// on ready
so.onReady = function(callback) {
    if (typeof callback === "function") {
        callbacks.push(callback);
    }

    // come on..
    if (document.addEventListener) {
        return document.addEventListener("DOMContentLoaded", function DOMContentLoaded(){
            document.removeEventListener("DOMContentLoaded", DOMContentLoaded, false);
            fireCallbacks();
        }, false);
    }

    // credits https://developer.mozilla.org/DOM/document.readyState
    document.onreadystatechange = function() {
        if (this.readyState === "complete") {
            document.onreadystatechange = null;
            fireCallbacks();
        }
    };
};


// browser
so.browser = function() {
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

// some more extensions...
so.ext = {};
so.array = {};
so.object = {};

// `so` to window
window.so = so;

})(window);
