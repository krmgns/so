/**
 * @name: so
 */

/**
 * Shortcut log.
 */
function log() { console.log.apply(console, arguments); }

;(function(window, undefined) {
    'use strict';

    // simply support check
    if (!''.trim) {
        throw ('Archaic browser!');
    }

    /**
     * So object.
     * @type {Object}
     */
    var $ = {};

    // globals
    window.so = $;
    window.so.VERSION = '5.0.0';
    window.document.window = window;

    // for minify advantages
    var NULL = null, NULLS = '';

    /**
     * Extend.
     * @return {Object}
     */
    function extend() {
        var i = 1, key, args = arguments, source, target = args[0] || {};
        while (source = args[i++]) {
            for (key in source) {
                if (source.hasOwnProperty(key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    }

    /**
     * For each.
     * @param  {Array|Object} input
     * @param  {Function}     fn
     * @param  {Object}       opt_scope @optional
     * @return {Array|Object}
     */
    function forEach(input, fn, opt_scope) {
        var len = input && input.length, i;
        if (len != NULL) { // array: value => i
            for (i = 0; i < len; i++) {
                if (false === fn.call(opt_scope || input[i], input[i], i, input)) {
                    break;
                }
            }
        } else { // object: key => value
            for (i in input) {
                if (input.hasOwnProperty(i)) {
                    if (false === fn.call(opt_scope || input[i], i, input[i], input)) {
                        break;
                    }
                }
            }
        }

        return opt_scope || input;
    }

    /**
     * To bool.
     * @param  {Any} input
     * @return {Boolean}
     */
    function toBool(input) {
        return !!input;
    }
    /**
     * To string.
     * @param  {String} input
     * @return {String}
     */
    function toString(input) {
        return (input == NULL) ? NULLS : input.toString();
    }

    /**
     * So: Type Functions.
     * @param  {Any} a
     * @return {Boolean}
     */
    extend($, {
        isNone: function(a) {
            return (a == NULL);
        },
        isNull: function(a) {
            return (a === NULL);
        },
        isNulls: function(a) {
            return (a === NULLS);
        },
        isUndefined: function(a) {
            return (a === undefined);
        },
        isString: function(a) {
            return (typeof a == 'string');
        },
        isBool: function(a) {
            return (typeof a == 'boolean');
        },
        isNumber: function(a) {
            return (typeof a == 'number');
        },
        isNumeric: function(a) {
            return !$.isNone(a) && !$.isNulls(a) && isFinite(a) && !isNaN(parseFloat(a));
        },
        isFunction: function(a) {
            return (typeof a == 'function');
        },
        isArray: function(a) {
            return a && (a.constructor == Array);
        },
        isObject: function(a) {
            return a && (a.constructor == Object);
        },
        isInt: function(a) {
            return $.isNumber(a) && (a % 1 == 0 && a != 1.0);
        },
        isFloat: function(a) {
            return $.isNumber(a) && (a % 1 != 0 || a == 1.0);
        },
        isIterable: function(a) {
            return $.isArray(a) || $.isObject(a)
                || (a && a.length && !a.nodeType); // dom, nodelist, string etc.
        },
        isPrimitive: function(a) {
            return $.isNone(a) || /^(string|number|boolean|symbol)$/.test(typeof a);
        },
        isWindow: function(a) {
            return toBool(a && a == a.window && a.top == a.window.top && a.location == a.window.location);
        },
        isDocument: function(a) {
            return toBool(a && a.nodeType == 9);
        },
        isNode: function(a) {
            return toBool(a && (a.nodeType === 1 || a.nodeType == 11));
        },
        isNodeElement: function(a) {
            return toBool(a && a.nodeType === 1);
        }
    });

    extend(String.prototype, {
        isNumeric: function() {
            return $.isNumeric(this);
        },
        toInt: function(base, str /* internal */) {
            return $.isNumeric(str = toString(this))
                ? parseInt(str.replace(/^-?\./, '0.'), base || 10) : NULL;
        },
        toFloat: function(str /* internal */) {
            return $.isNumeric(str = toString(this)) ? parseFloat(str) : NULL;
        },
        toCapitalCase: function(all) {
            var str = toString(this).toLowerCase(), i;
            if (all !== false) {
                for (i = 0, str = str.split(' '); i < str.length; i++) {
                    str[i] = str[i].toCapitalCase(false);
                }
                return str.join(' ');
            }
            return str.charAt(0).toUpperCase() + str.slice(1);
        },
        format: function() {
            var str = toString(this), args = arguments, matches = str.match(/(%s)/g) || [], i = 0;
            if (args.length < matches.length) {
                throw ('No arguments enough!');
            }
            while (matches.shift()) {
                str = str.replace(/(%s)/, args[i++]);
            }
            return str;
        },
        forEach: function(fn) { // @test
            return forEach(toString(this), fn, this);
        }
    });

    function toTrimChars(chars) {
        return chars ? chars.replace(/([\[\]\\])/g, '\\$1') : '\\s';
    }

    extend(String.prototype, {
        trimLeft: function(chars) {
            var str = toString(this), re = new RegExp('^['+ toTrimChars(chars) +']+');;
            while (re.test(str)) {
                str = str.replace(re, NULLS);
            }
            return str;
        },
        trimRight: function(chars) {
            var str = toString(this), re = new RegExp('['+ toTrimChars(chars) +']+$');
            while (re.test(str)) {
                str = str.replace(re, NULLS);
            }
            return str;
        },
        trim: function(chars) {
            return this.trimLeft(chars).trimRight(chars);
        }
    });

    function toSearchStuff(str, search, index, opt_noCase) {
        if (str && search) {
            if (index === true) {
                opt_noCase = true, index = 0;
            }
            str = toString(str);
            if (opt_noCase) {
                str = s.toLowerCase(), search = search.toLowerCase();
            }
            return {s: str, ss: search, i: index};
        }
    }

    extend(String.prototype, {
        startsWith: function(search, index, opt_noCase, str /* internal */) {
            return (str = toSearchStuff(this, search, index, opt_noCase))
                && str.ss === str.s.substr(str.i || 0, str.ss.length);
        },
        endsWith: function(search, index, opt_noCase, str /* internal */) {
            return (str = toSearchStuff(this, search, index, opt_noCase))
                && str.ss === str.s.substr(0, str.i || str.ss.length);
        },
        contains: function(search, index, opt_noCase, str /* internal */) {
            return (str = toSearchStuff(this, search, index, opt_noCase))
                && str.s !== str.s.split(str.ss)[0];
        }
    });

    var _uuid = 0,
        fn_slice = [].slice,
        fn_toString = {}.toString
    ;

    // so: base functions
    extend($, {
        log: function() {
            log.apply(NULL, ['>> so:'].concat(fn_slice.call(arguments)));
        },
        fun: function() {
            return function(){};
        },
        now: function() {
            return Date.now();
        },
        uuid: function() {
            return ++_uuid;
        },
        win: function(node) {
            var win;
            if (!node || $.isWindow(node)) {
                win = window;
            } else if ($.isDocument(node)) {
                win = node.window; // find document window
            } else if ($.isNode(node)) {
                win = node.ownerDocument.window; // find node document window
            }

            return win;
        },
        doc: function(node) {
            return node ? node.ownerDocument : window.document;
        },
        trim: function(s, chars) {
            return s == NULL ? NULLS : s.trim(chars);
        },
        trimLeft: function(s, chars) {
            return s == NULL ? NULLS : s.trimLeft(chars);
        },
        trimRight: function(s, chars) {
            return s == NULL ? NULLS : s.trimRight(chars);
        },
        dig: function(input, key) {
            if ($.isObject(input)) {
                var keys = toString(key).split('.'), key = keys.shift();
                if (!keys.length) {
                    return input[key];
                }
                return $.dig(input[key], keys.join('.'));
            }
        },
        freeze: function(object, opt_deep) {
            if (opt_deep !== false) {
                Object.getOwnPropertyNames(object).forEach(function(name) {
                    if ($.isObject(object[name])) {
                        $.freeze(object[name]);
                    }
                });
            }
            return Object.freeze(object);
        },
        typeOf: function(input, opt_real) {
            var type;

            if ($.isNull(input)) {
                type = 'null';
            } else if ($.isUndefined(input)) {
                type = 'undefined';
            } else if ($.isWindow(input)) {
                type = 'window';
            } else if ($.isDocument(input)) {
                type = 'document';
            } else if ($.isNodeElement(input)) {
                type = 'element';
            } else {
                type = fn_toString.call(input).slice(8, -1).toLowerCase();
            }

            return type;
        },
        isSet: function(input, opt_key) { // @test
            return ((opt_key != NULL) ? $.dig(input, opt_key) : input) != NULL;
        },
        isEmpty: function(input) { // @test
            return !input // '', null, undefined, false, 0, NaN
                || ($.isNumber(input) && !input.length)
                || ($.isObject(input) && !Object.keys(input).length);
        },
        forEach: function(input, fn, opt_scope) {
            return forEach(input, fn, opt_scope);
        },
        mix: function() {
            throw '@todo Remove method $.mix()!';
        },
        extend: function(target, source) {
            // self extend
            if ($.isObject(target) && $.isUndefined(source)) {
                return extend($, target);
            }

            // self extend
            if ($.isString(target)) {
                var tmp = target.split('.'), property = tmp[0], propertyProperty = tmp[1],
                    target = $[property] || {};

                // notation: $.extend('foo', ...)
                if (!propertyProperty) {
                    target[property] = source;
                }
                // notation: $.extend('foo.bar', ...)
                // notation: $.extend('foo.bar', function() { ... })
                else {
                    (target.prototype ? target.prototype : target)[propertyProperty] = source;
                }

                return extend($, target);
            }

            // any extend
            return extend.apply(NULL, [target, source].concat(fn_slice.call(arguments, 2)));
        },
        toString: function(name, opt_object) {
            throw '@todo Remove method $.toString()!';
        }
    });

    var callbacks = [];

    function fireCallbacks() {
        while (callbacks.length) {
            callbacks.shift()($);
        }
    }

    // oh baybe..
    $.onReady = function(callback, document) {
        if ($.isFunction(callback)) {
            callbacks.push(callback);
        }

        // iframe support
        document = document || window.document;

        document.addEventListener('DOMContentLoaded', function _(){
            document.removeEventListener('DOMContentLoaded', _, false);
            fireCallbacks();
        }, false);
    };

})(window);
