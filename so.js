/**
 * @name: so
 */

// simple compatibility check
if (![].forEach) {
    throw ('Archaic browser!');
}

// log shotcut
function log(s) {
    console.log.apply(console, arguments);
}

;(function(window) {

'use strict';

// shorthand string helpers
function isNumeric(s) {
    return !isNaN(parseFloat(s)) && isFinite(s);
}

String.prototype.toInt = function(base) {
    return isNumeric(this) ? parseInt(this.replace(/^-?\.(.+)/, '0.\$1'), base || 10) : null;
}
String.prototype.toFloat = function() {
    return isNumeric(this) ? parseFloat(this) : null;
}
String.prototype.isNumeric = function() {
    return isNumeric(this);
}
String.prototype.format = function() {
    var s = this, ms = s.match(/(%s)/g) || [], i = 0, m;
    if (ms.length > arguments.length) {
        throw ('No arguments enough!');
    }
    while (m = ms.shift()) {
        s = s.replace(/(%s)/, arguments[i++]);
    }
    return s;
}
String.prototype.toCapitalCase = function(all) {
    var s = this.toLowerCase(), i;
    if (all !== false) {
        for (i = 0, s = s.split(' '); i < s.length; i++) {
            s[i] = s[i].toCapitalCase(false);
        }
        return s.join(' ');
    }
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function forEach(input, fn, scope) {
    var len = input && input.length, i;
    if (len != null) { // array: value => i
        for (i = 0; i < len; i++) {
            if (false === fn.call(scope || input[i], input[i], i, input)) {
                break;
            }
        }
    } else { // object: key => value
        for (i in input) {
            if (input.hasOwnProperty(i)) {
                if (false === fn.call(scope || input[i], i, input[i], input)) {
                    break;
                }
            }
        }
    }
    return scope || input;
}

function freeze(object, deep) {
    if (deep !== false) {
        Object.getOwnPropertyNames(object).forEach(function(name) {
            if (object[name] && typeof object[name] == 'object') {
                freeze(object[name]);
            }
        });
    }
    return Object.freeze(object);
}

var uuid = 0;

/*** the so ***/
var so = {
    fun: function() {
        return function(){};
    },
    now: function() {
        return +(new Date);
    },
    uuid: function() {
        return ++uuid;
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
    trim: function(s, chars) {
        return (s != null) ? (""+ s).trim() : "";
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
    freeze: function(input, deep) {
        return freeze(input, deep);
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
        return {}.toString.call(x).slice(8, -1).toLowerCase();
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
    isEmpty: function() {
        if (arguments.length) {
            for (var i = 0, key, value; i < arguments.length; i++) {
                value = arguments[i];
                log(value)
                if (!value) return true; // "", null, undefined, false, 0, NaN
                if (typeof value.length == "number") return !value.length;
                if (typeof value == "object") { for (key in value) { return false; } return true; }
            }
            return false;
        }
    },
    forEach: function(input, fn, scope) {
        return forEach(input, fn, scope);
    },
    // notation: options = $.mix({}, defaultOptions, options);
    mix: function() {
        var args = arguments, i = 1, target = args[0], source;
        if (args.length < 2) {
            throw ("$.mix() accepts at least 2 arguments!");
        }

        while (source = args[i++]) {
            for (var key in source) {
                if (source.hasOwnProperty(key)) target[key] = source[key];
            }
        }

        return target;
    },
    extend: function(target, source) {
        var targetType = typeof target,
            sourceType = typeof source;

        // self extend
        if (targetType == "object" && sourceType == "undefined") {
            source = target, target = this;
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

so.browser = (function() {
    var foo, nav = window.navigator, re, name,
        ua = nav.userAgent.toLowerCase(), uap = nav.platform.toLowerCase(),
        browser = {}, src = /(chrome|safari|firefox|opera|msie|trident(?=\/))\/?\s*([\d.]+)/,
        fns_os = ['isMac', 'isWindows', 'isLinux', 'isUnix'],
        fns_ua = ['isChrome', 'isSafari', 'isFirefox', 'isOpera', 'isIE', 'isTrident'],
        ret_isTouchDevice = nav.maxTouchPoints > 0 || 'ontouchstart' in window,
        ret_isMobileDevice = /android|ip(hone|od|ad)|opera *mini|webos|blackberry|mobile|windows *phone/.test(ua);

    browser.isTouchDevice = function() { return ret_isTouchDevice; };
    browser.isMobileDevice = function() { return ret_isMobileDevice; };

    function search(src, s) {
        return src.indexOf(s) > -1;
    }

    // set 'is' functions for os
    fns_os.forEach(function(fn) {
        var osName = fn.slice(2).toLowerCase();
        browser[fn] = (fn == 'isUnix')
            ? function() { return search(ua, 'x11') && !search(ua, 'linux'); }
            : function() { return search(ua, osName); };
        // set os name testing
        if (browser[fn]()) {
            browser['osName'] = osName;
        }
    });

    // set 'is' functions for browser
    fns_ua.forEach(function(fn) {
        browser[fn] = function() { return false; };
    });

    if (re = src.exec(ua)) {
        if (re[1]) {
            browser['name'] = (re[1] == 'msie') ? 'ie' : re[1];
            // re-set 'is' function
            browser['is'+ (browser['name'] == 'ie'
                ? browser['name'].toUpperCase()
                : browser['name'].toCapitalCase(false))] = function() { return true; };
        }
        if (re[2]) {
            var versionArray = re[2].split('.').map(function(value, key) {
                return value.toInt();
            }), versionString;
            versionString = versionArray.slice(0,2).join('.');
            browser['version'] = versionString.toFloat();
            browser['versionArray'] = versionArray;
            browser['versionString'] = versionString;
            browser['versionOrig'] = re[2];
       }
    }

    if (browser['osName']) {
        /* x86_64 x86-64 x64; amd64 amd64 wow64 x64_64 ia64 sparc64 ppc64 irix64
            linux i386 linux i686 linux x86_64 win32 win64 macintel? */
        foo = browser.isOpera() ? ua : uap;
        if (/64/.test(foo)) {
            browser['osBit'] = 64;
        } else if (/32|86/.test(foo)) {
            browser['osBit'] = 32;
        }
    }

    return freeze(browser);
})();

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

// some more tools..
so.ext = {}, so.array = {}, so.object = {};

// `so` to window
window.so = so;

})(window);
