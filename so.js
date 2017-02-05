/**
 * @name: so
 */

/**
 * Shortcut for 'console.log'.
 */
function log() { console.log.apply(console, arguments); }

;(function(window, undefined) {
    'use strict';

    // simply support check
    if (!''.trim) {
        throw ('Archaic browser!');
    }

    // for minify advantages
    var NULL = null, NULLS = '';

    /**
     * Shortcut for 'so'.
     * @type {Object}
     */
    var $ = {};

    // globals
    window.so = $;
    window.so.VERSION = '5.0.0';
    window.document.window = window;

    /**
     * Value of.
     * @param  {Any} input
     * @return {Any}
     */
    function valueOf(input) {
        return (input && input.valueOf) ? input.valueOf() : input;
    }

    /**
     * To bool.
     * @param  {Any} input
     * @return {Bool}
     */
    function toBool(input) {
        return !!valueOf(input);
    }

    /**
     * To string.
     * @param  {String} input
     * @return {String}
     */
    function toString(input) {
        return valueOf(input).toString();
    }

    /**
     * So class.
     * @param  {Function} subClass
     * @return {Object}
     */
    $.class = function(subClass) { return {
        /**
         * Create.
         * @param  {String} name
         * @param  {Object} prototype
         * @usage  $.class.create('Foo', {...})
         * @usage  $.class.create('Foo', {init: function() {...}, ...})
         * @return {Function}
         */
        create: function(name, prototype) {
            var createConstructor = function(content) {
                return eval('(function(){'+ content +'})()');
            };

            // create a named constructor
            var Constructor = createConstructor(
                'var Constructor = function '+ name +'() {' +
                '  if (this.init) {' +
                '    this.init.apply(this, arguments);' +
                '  }' +
                '};' +
                'return Constructor;'
            );

            // add constructor prototype and constructor constructor
            Constructor.prototype = Object.create(prototype, {
                constructor: {value: createConstructor(
                    'var Constructor = function '+ name +'(){}; ' +
                    'Constructor.prototype = prototype;' +
                    'Constructor.prototype.constructor = Constructor;' +
                    'return Constructor;'
                )}
            });

            return Constructor;
        },
        /**
         * Extends.
         * @param  {Function} supClass
         * @param  {Object}   prototype
         * @usage  $.class(Foo).extends(FooBase);
         * @usage  $.class(Foo).extends(FooBase, {...});
         * @return {Function}
         */
        extends: function(supClass, prototype) {
            if (supClass) {
                subClass.prototype = Object.create(supClass.prototype, {
                    constructor: {value: subClass},
                          super: {value: supClass}
                });
            }

            // add subClass prototype if provided
            prototype && forEach(prototype, function(name, value) {
                subClass.prototype[name] = value;
            });

            return subClass;
        }
    }};

    // add shortcut for create
    $.class.create = $.class().create;

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
     * So: Type Functions.
     * @param  {Any} input
     * @return {Bool}
     */
    extend($, {
        isNone: function(input) {
            return (input == NULL);
        },
        isNull: function(input) {
            return (input === NULL);
        },
        isNulls: function(input) {
            return (input === NULLS);
        },
        isUndefined: function(input) {
            return (input === undefined);
        },
        isString: function(input) {
            return (typeof input == 'string');
        },
        isBool: function(input) {
            return (typeof input == 'boolean');
        },
        isNumber: function(input) {
            return (typeof input == 'number');
        },
        isNumeric: function(input) {
            return !$.isNone(input) && !$.isNulls(input)
                && isFinite(input) && !isNaN(parseFloat(input));
        },
        isFunction: function(input) {
            return (typeof input == 'function');
        },
        isArray: function(input) {
            return input && (input.constructor == Array);
        },
        isObject: function(input) {
            return input && (input.constructor == Object);
        },
        isInt: function(input) {
            return $.isNumber(input) && (input % 1 == 0 && input != 1.0);
        },
        isFloat: function(input) {
            return $.isNumber(input) && (input % 1 != 0 || input == 1.0);
        },
        isIterable: function(input) {
            return $.isArray(input) || $.isObject(input)
                || (input && input.length && !input.nodeType); // dom, nodelist, string etc.
        },
        isPrimitive: function(input) {
            return $.isNone(input) || /^(string|number|boolean|symbol)$/.test(typeof input);
        },
        isWindow: function(input) {
            return toBool(input && input == input.window
                && input.top == input.window.top
                && input.location == input.window.location); // more strict
        },
        isDocument: function(input) {
            return toBool(input && input.nodeType == 9);
        },
        isNode: function(input) {
            return toBool(input && (input.nodeType === 1 || input.nodeType == 11));
        },
        isNodeElement: function(input) {
            return toBool(input && input.nodeType === 1);
        }
    });

    /**
     * Object extends.
     */
    extend(Object.prototype, {
        /**
         * Object for each.
         * @param  {Function} fn
         * @return {Object}
         */
        forEach: function(fn) {
            return forEach(this, function(key, value) {
                return fn(key, value);
            });
        },
        /**
         * To source.
         * @return {Any}
         */
        toSource: function() {
            return valueOf(this);
        }
    });

    /**
     * String extends.
     */
    extend(String.prototype, {
        /**
         * Is numeric.
         * @return {Bool}
         */
        isNumeric: function() {
            return $.isNumeric(toString(this));
        },
        /**
         * To int.
         * @param  {Int}    base
         * @param  {String} str  @internal
         * @return {Int|NULL}
         */
        toInt: function(base, str) {
            return $.isNumeric(str = toString(this))
                ? parseInt(str.replace(/^-?\./, '0.'), base || 10) : NULL;
        },
        /**
         * To float.
         * @param  {String} str @internal
         * @return {Float|NULL}
         */
        toFloat: function(str) {
            return $.isNumeric(str = toString(this)) ? parseFloat(str) : NULL;
        },
        /**
         * To capital case.
         * @param  {Bool} all
         * @return {String}
         */
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
        /**
         * Format.
         * @return {String}
         * @throws
         */
        format: function() {
            var str = toString(this), args = arguments, match = str.match(/(%s)/g) || [], i = 0;

            if (args.length < match.length) {
                throw ('No arguments enough!');
            }

            while (match.shift()) {
                str = str.replace(/(%s)/, args[i++]);
            }

            return str;
        },
        /**
         * For each.
         * @param  {Function} fn
         * @return {String}
         */
        forEach: function(fn) {
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
        valueOf: function(input) {
            return valueOf(input);
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
