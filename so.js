/**
 * @name: so
 */

function log(s) { console.log.apply(console, arguments); }

;(function(window, undefined) {

"use strict"; // @tmp

var _uuid = 0,
    re_trim = /^\s+|\s+$/g,
    re_browsers = {
        chrome: /chrome\/([\d\.]+)/,
        safari: /webkit.*?version\/([\d\.]+)/,
        firefox: /firefox\/([\d\.]+)/,
        opera: /opera.*?version\/([\d\.]+)/,
        ie: /msie\s+([\d\.]+)/
    },
    fn_toString = {}.toString;

// shorthand string helpers
var sp = String.prototype;
if (!sp.toInt) { sp.toInt = function(base) {
    return this.isNumeric(this) ? parseInt(this, base || 10) : null;
}}
if (!sp.toFloat) { sp.toFloat = function() {
    return this.isNumeric(this) ? parseFloat(this) : null;
}}
if (!sp.isNumeric) { sp.isNumeric = function(s /* internal */) {
    return (s = (s != null) ? s : this) !== "" && !isNaN(parseFloat(this)) && isFinite(this);
}}
if (!sp.format) { sp.format = function() {
    var s = this, ms = s.match(/(%s)/g) || [], i = 0, m;
    if (ms.length > arguments.length) {
        throw ("No arguments enough!");
    }
    while (m = ms.shift()) {
        s = s.replace(/(%s)/, arguments[i++]);
    }
    return s;
}}

/*** the so ***/
var so = {
    fun: function() {
        return function(){};
    },
    now: function() {
        return +(new Date);
    },
    uuid: function() {
        return ++_uuid;
    },
    win: function(el) {
        if (!el) {
            return window;
        }
        if (el == el.window) {
            return el;
        }
        return el.nodeType == 9 ? (el.defaultView || el.parentWindow) : null;
    },
    doc: function(el) {
        return el ? el.ownerDocument : window.document;
    },
    trim: function(s) {
        return (s != null) ? (""+ s).replace(re_trim, "") : "";
    },
    dig: function(input, key) {
        if (input && typeof input == "object") {
            var keys = (""+ key).split("."), key = keys.shift();
            if (!keys.length) {
                return input[key];
            }
            return this.dig(input[key], keys.join("."));
        }
    },
    typeOf: function(x) {
        if (x === null) {
            return "null";
        }
        if (typeof x == "undefined") {
            return "undefined";
        }
        if (x == x.window) {
            return "window";
        }
        if (x.nodeType == 9) {
            return "document";
        }
        return fn_toString.call(x).slice(8, -1).toLowerCase();
    },
    isNone: function() {
        if (arguments.length) {
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] == null) {
                    return true;
                }
            }
            return false;
        }
    },
    isSet: function(x, i) {
        return (i == null) ? x != null : this.dig(x, i) != null;
    },
    isEmpty: function(x) {
        if (arguments.length) {
            for (var i = 0, x; i < arguments.length; i++) {
                x = arguments[i];
                // "", null, undefined, false, 0, NaN
                if (!x) {
                    return true;
                }
                if (typeof x.length == "number") {
                    return !x.length;
                }
                if (typeof x == "object") {
                    for (i in x) { return false; } return true;
                }
            }
            return false;
        }
    },
    forEach: function(input, fn, scope) {
        var len = input && input.length, i;
        if (len != null) {
            // array: value => i
            for (i = 0; i < len; i++) {
                if (false === fn.call(scope || input[i], input[i], i, input)) {
                    break;
                }
            }
        } else {
            // object: key => value
            for (i in input) {
                if (false === fn.call(scope || input[i], i, input[i], input)) {
                    break;
                }
            }
        }
        return scope || input;
    },
    // notation: options = $.mix({}, defaultOptions, options);
    mix: function() {
        var args = arguments, i = 1, target, source;
        if (args.length < 2) {
            throw ("so.mix(): Function accepts at least 2 arguments.");
        }
        target = args[0];
        while (source = args[i++]) {
            for (var key in source) {
                source.hasOwnProperty(key) && (target[key] = source[key]);
            }
        }
        return target;
    },
    extend: function(target, source) {
        var targetType = typeof target,
            sourceType = typeof source;

        if (targetType == "object" && sourceType == "undefined") {
            source = target, target = this; // self extend
        } else if (targetType == "string") {
            target = !this[target] ? this[target] = {} : this[target];
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
so.onReady = function(callback, document) {
    if (typeof callback == "function") {
        callbacks.push(callback);
    }

    // iframe support
    document = document || window.document;

    // come on..
    if (document.addEventListener) {
        return document.addEventListener("DOMContentLoaded", function DOMContentLoaded(){
            document.removeEventListener("DOMContentLoaded", DOMContentLoaded, false);
            fireCallbacks();
        }, false);
    }

    // credits https://developer.mozilla.org/DOM/document.readyState
    document.onreadystatechange = function() {
        if (this.readyState == "complete") {
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

    if (re) {
        browser[k] = true;
        if (re[1]) {
            var versionArray = (function() {
                var i = 0, nums = re[1].split(".");
                while (i < nums.length) {
                    nums[i] = nums[i].toInt();
                    i++;
                }
                return nums;
            })();
            var versionString = versionArray.slice(0,2).join(".");
            browser["version"] = versionString.toFloat();
            browser["versionArray"] = versionArray;
            browser["versionString"] = versionString;
            browser["versionOrig"] = re[1];
        }
    }

    return browser;
}();

// some more tools..
so.ext = {}, so.array = {}, so.object = {};

// `so` to window
window.so = so;

})(window);
