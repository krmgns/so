/**
 * @name: so
 */

// log shotcut
function log(s) { console.log.apply(console, arguments); }

;(function(window, undefined) {

    'use strict';

    // simple support check
    if (!''.trim) {
        throw ('Archaic browser!');
    }

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

    function forEach(input, fn, opt_scope) {
        var len = input && input.length, i;
        if (len != null) { // array: value => i
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

    /* so */
    var $ = {};

    // so: type functions
    extend($, {
        isNone: function(a) {
            return (a == null);
        },
        isNull: function(a) {
            return (a === null);
        },
        isNulls: function(a) {
            return (a === '');
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
            return (a != null && a != '') && !isNaN(parseFloat(a)) && isFinite(a);
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
            return $.isArray(a) || $.isObject(a) || (a && a.length && !a.nodeType); // dom, nodelist, string etc.
        },
        isPrimitive: function(a) {
            return (a == null) || /^(string|number|boolean|symbol)$/.test(typeof a);
        }
    });

    extend(String.prototype, {
        isNumeric: function() {
            return $.isNumeric(this);
        },
        toInt: function(base) {
            return $.isNumeric(this) ? parseInt(this.replace(/^-?\.(.+)/, '0.$1'), base || 10) : null;
        },
        toFloat: function() {
            return $.isNumeric(this) ? parseFloat(this) : null;
        },
        toCapitalCase: function(all) {
            var s = this.toLowerCase(), i;
            if (all !== false) {
                for (i = 0, s = s.split(' '); i < s.length; i++) {
                    s[i] = s[i].toCapitalCase(false);
                }
                return s.join(' ');
            }
            return s.charAt(0).toUpperCase() + s.slice(1);
        },
        format: function() {
            var s = this, m, ms = s.match(/(%s)/g) || [], i = 0, args = arguments;
            if (ms.length > args.length) {
                throw ('No arguments enough!');
            }
            while (m = ms.shift()) {
                s = s.replace(/(%s)/, args[i++]);
            }
            return s;
        },
        forEach: function(fn) { // @test
            return forEach(''+ this, fn, this);
        }
    });

    function prepareTrimChars(chars) {
        return chars ? chars.replace(/([\[\]\\])/g, '\\$1') : '\\s';
    }

    extend(String.prototype, {
        trimLeft: function(chars) {
            var s = this, re = new RegExp('^['+ prepareTrimChars(chars) +']+');;
            while (re.test(s)) {
                s = s.replace(re, '');
            }
            return s;
        },
        trimRight: function(chars) {
            var s = this, re = new RegExp('['+ prepareTrimChars(chars) +']+$');
            while (re.test(s)) {
                s = s.replace(re, '');
            }
            return s;
        },
        trim: function(chars) {
            return this.trimLeft(chars).trimRight(chars);
        }
    });

    function prepareSearchStuff(string, searchString, index, opt_noCase) {
        if (string && searchString) {
            if (index === true) {
                opt_noCase = true, index = 0;
            }
            if (opt_noCase) {
                string = s.toLowerCase(), searchString = searchString.toLowerCase();
            }
            return {s: string, ss: searchString, i: index};
        }
    }

    extend(String.prototype, {
        startsWith: function(searchString, index, opt_noCase, _s /* internal */) {
            return (_s = prepareSearchStuff(this, searchString, index, opt_noCase))
                && _s.s.substr(_s.i || 0, _s.ss.length) === _s.ss;
        },
        endsWith: function(searchString, index, opt_noCase, _s /* internal */) {
            return (_s = prepareSearchStuff(this, searchString, index, opt_noCase))
                && _s.s.substr(0, _s.i || _s.ss.length) === _s.ss;
        },
        contains: function(searchString, index, opt_noCase, _s /* internal */) {
            return (_s = prepareSearchStuff(this, searchString, index, opt_noCase))
                && _s.s !== _s.s.split(_s.ss)[0];
        }
    });

    var _uuid = 0,
        fn_slice = [].slice,
        fn_toString = {}.toString
    ;

    // so: base functions
    extend($, {
        log: function() {
            log.apply(null, ['>> so:'].concat(fn_slice.call(arguments)));
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
        win: function(el) {
            if (!el) return window;
            if (el == el.window) return el;
            var elType = el.nodeType;
            if (elType == 1) {
                el = el.ownerDocument; // find el document
            }
            return elType == 9 ? el.defaultView : null;
        },
        doc: function(el) {
            return el ? el.ownerDocument : window.document;
        },
        trim: function(s, chars) {
            return s == null ? '' : s.trim(chars);
        },
        trimLeft: function(s, chars) {
            return s == null ? '' : s.trimLeft(chars);
        },
        trimRight: function(s, chars) {
            return s == null ? '' : s.trimRight(chars);
        },
        dig: function(input, key) {
            if ($.isObject(input)) {
                var keys = (''+ key).split('.'), key = keys.shift();
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
            if (input === null) return 'null';
            if (input === undefined) return 'undefined';
            if (opt_real) {
                if ($.isNumeric(input)) return 'numeric';
                if (input.nodeType == 1) return 'element';
                if (input.nodeType == 9) return 'document';
            }
            return fn_toString.call(input).slice(8, -1).toLowerCase();
        },
        isSet: function(input, opt_key) { // @test
            return ((opt_key != null) ? $.dig(input, opt_key) : input) != null;
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
            return extend.apply(null, [target, source].concat(fn_slice.call(arguments, 2)));
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

    // make global
    window.so = $;

})(window);
