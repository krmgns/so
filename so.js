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

    // base helpers
    function mix() {
        var sources = arguments, source, target = sources[0], i = 1, k;
        if (target) {
            while (source = sources[i++]) {
                for (k in source) {
                    if (source.hasOwnProperty(k)) {
                        target[k] = source[k];
                    }
                }
            }
        }
        return target;
    }

    function extend(target, source) {
        return mix(target, source);
    }

    function isNumeric(s) {
        return !isNaN(parseFloat(s)) && isFinite(s);
    }

    extend(String.prototype, {
        isNumeric: function() {
            return isNumeric(this);
        },
        toInt: function(base) {
            return isNumeric(this)
                ? parseInt(this.replace(/^-?\.(.+)/, '0.$1'), base || 10) : null;
        },
        toFloat: function() {
            return isNumeric(this) ? parseFloat(this) : null;
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
            var s = this, ms = s.match(/(%s)/g) || [], i = 0, m;
            if (ms.length > arguments.length) {
                throw ('No arguments enough!');
            }
            while (m = ms.shift()) {
                s = s.replace(/(%s)/, arguments[i++]);
            }
            return s;
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

    var so = {ext: {}, array: {}, object: {}},
        _uuid = 0, fn_toString = {}.toString;

    // so: base functions
    extend(so, {
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
            return (s != null) ? s.trim(chars) : '';
        },
        trimLeft: function(s, chars) {
            return (s != null) ? s.trimLeft(chars) : '';
        },
        trimRight: function(s, chars) {
            return (s != null) ? s.trimRight(chars) : '';
        },
        dig: function(input, key) {
            if (input && typeof input == 'object') {
                var keys = (''+ key).split('.'), key = keys.shift();
                if (!keys.length) {
                    return input[key];
                }
                return this.dig(input[key], keys.join('.'));
            }
        },
        freeze: function(object, opt_deep) {
            if (opt_deep !== false) {
                var _this = this;
                Object.getOwnPropertyNames(object).forEach(function(name) {
                    if (object[name] && typeof object[name] == 'object') {
                        _this.freeze(object[name]);
                    }
                });
            }
            return Object.freeze(object);
        },
        typeOf: function(input, opt_real) {
            if (input === null) return 'null';
            if (input === undefined) return 'undefined';
            if (opt_real) {
                if (isNumeric(input)) return 'numeric';
                if (input.nodeType == 1) return 'element';
                if (input.nodeType == 9) return 'document';
            }
            return fn_toString.call(input).slice(8, -1).toLowerCase();
        },
        isSet: function(input, opt_key) {
            return (opt_key == null) ? input != null : this.dig(input, opt_key) != null;
        },
        isEmpty: function(input) {
            if (!input) return true; // '', null, undefined, false, 0, NaN
            if (typeof input.length == 'number') return !input.length;
            if (typeof input == 'object') return !Object.keys(input).length;
            return false;
        },
        forEach: function(input, fn, opt_scope) {
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
        },
        // notation: options = $.mix({}, defaultOptions, options);
        mix: function() {
            return mix.apply(null, arguments);
        },
        extend: function(target, source) {
            var targetType = typeof target, sourceType = typeof source;

            // self extend
            if (targetType == 'object' && sourceType == 'undefined') {
                source = target, target = this;
            } else if (targetType == 'string') {
                target = !this[target] ? this[target] = {} : this[target];
            }

            return mix(target, source);
        },
        toString: function(name, opt_object) {
            if (!name) {
                return '[object so]';
            }

            var target = opt_object ? opt_object : this[name];

            // define `toString` methods of modules
            target.toString = function() {
                return '[object so.'+ name +']';
            };
        }
    });

    // so: type functions
    extend(so, {
        isNone: function(x) {
            return x == null;
        },
        isNull: function(x) {
            return x === null;
        },
        isUndefined: function(x) {
            return x === undefined;
        },
        isInt: function(x) {
            return this.isNumber(x) && x % 1 == 0 && x != 1.0;
        },
        isFloat: function(x) {
            return this.isNumber(x) && x % 1 != 0 || x == 1.0;
        },
        isString: function(x) {
            return typeof x == 'string';
        },
        isBool: function(x) {
            return x === true || x === false;
        },
        isNumber: function(x) {
            return typeof x == 'number';
        },
        isFunction: function(x) {
            return typeof x == 'function';
        },
        isArray: function(x) {
            return x && x.constructor == Array;
        },
        isObject: function(x) {
            return x && x.constructor == Object;
        },
        isIterable: function(x) {
            return this.isArray(x) || this.isObject(x);
        },
        isPrimitive: function(x) {
            return x == null || /^(string|number|boolean|symbol)$/.test(typeof x);
        },
        isTypeOf: function(x, type) {
            return this.typeOf(x) == type;
        }
    });

    var callbacks = [];

    function fireCallbacks() {
        while (callbacks.length) {
            callbacks.shift()(so);
        }
    }

    // oh baybe..
    so.onReady = function(callback, document) {
        if (typeof callback == 'function') {
            callbacks.push(callback);
        }

        // iframe support
        document = document || window.document;

        document.addEventListener('DOMContentLoaded', function _(){
            document.removeEventListener('DOMContentLoaded', _, false);
            fireCallbacks();
        }, false);
    };

    // add global
    window.so = so;

})(window);
