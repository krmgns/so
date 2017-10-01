/**
 * @package so
 * @object  so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $, NULL, TRUE, FALSE, UNDEFINED) { 'use strict';

    // simply support check
    if (!''.trim) {
        throw ('Archaic browser!');
    }

    // minify candies
    var NAME_NODE_TYPE = 'nodeType';
    var NAME_PROTOTYPE = 'prototype';
    var NAME_DEFAULT_VIEW = 'defaultView';
    var NAME_OWNER_DOCUMENT = 'ownerDocument';
    var NAME_WINDOW = 'window', NAME_DOCUMENT = 'document';
    var Array = window.Array, Object = window.Object, JSON = window.JSON;
    var String = window.String, RegExp = window.RegExp, Function = window.Function;

    // globals
    window.so = $;
    window.so.VERSION = '5.31.1';
    window.so[NAME_WINDOW] = window;
    window.so[NAME_DOCUMENT] = window[NAME_DOCUMENT];

    // safe bind for ie9 (yes, still ie..)
    function consoleBind(fn, args) {
        return Function[NAME_PROTOTYPE].bind.call(window.console[fn], window.console)
            .apply(window.console, args);
    }

    // shortcut for 'console.log'
    window.log = function() {
        consoleBind('log', arguments);
    };

    var _reCache = {};
    var re_dot = /^[-+]?\./;
    var re_time = /([\d.]+)(\w+)/;
    var re_numeric = /^[-+]?(?:\.?\d+|\d+\.\d+)$/;
    var re_trim = /^\s+|\s+$/g;
    var re_trimLeft = /^\s+/g;
    var re_trimRight = /\s+$/g;
    var re_primitive = /^(string|number|boolean)$/;

    // null/undefined checker
    function isVoid(input) {
        return input == NULL;
    }

    // faster trim for space only
    function trim(input, side) {
        return !isVoid(input) ? (''+ input)
            .replace(side ? (side == 1 ? re_trimLeft : re_trimRight) : re_trim, '') : '';
    }

    // shortcut convert helpers
    function toValue(input, valueDefault) {
        return isVoid(input) ? valueDefault : input;
    }
    function toInt(input, base) {
        return parseInt(trim(input).replace(re_dot, '0.'), base || 10) || 0;
    }
    function toFloat(input) {
        return parseFloat(input) || 0;
    }
    function toString(input) {
        return (''+ input);
    }
    function toBool(input) {
        return !!input;
    }

    function toMilliseconds(time) {
        var s = time.split(re_time);
        var time = toFloat(s[1]);
        var timeDir = s[2];

        switch (timeDir) {
            case 's': case 'sec': time *= 1000; break;
            case 'm': case 'min': time *= 1000 * 60; break;
            case 'h': case 'hour': time *= 1000 * 60 * 60; break;
        }

        return time;
    }

    // cacheable regexp stuff with ttl (for gc)
    function toRegExp(pattern, flags, ttl) {
        flags = flags || '';
        if ($.isInt(flags)) {
            ttl = flags, flags = '';
        }

        if (!ttl) { // no cache
            return new RegExp(pattern, flags);
        }

        if ($.isString(ttl)) {
            ttl = toMilliseconds(ttl);
        }
        ttl = (ttl > -1) ? ttl : 3600; // one hour

        var i = pattern + (flags || '');
        var ret = _reCache[i] || new RegExp(pattern, flags);

        // simple gc
        $.fire(ttl, function(){ delete _reCache[i]; });

        return ret;
    }

    /**
     * Extend.
     * @param  {Object} ...arguments
     * @return {Object}
     * @private
     */
    function extend() {
        var i = 1, key, value, args = arguments, source, target = args[0] || {};

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
     * Loop.
     * @param  {Array|Object} input
     * @param  {Function}     fn
     * @param  {Object}       _this?
     * @param  {Bool}         useKey?
     * @param  {Bool}         useLength?
     * @return {Array|Object}
     * @private
     */
    function loop(input, fn, _this, useKey, useLength) {
        var _this = _this || input, length = input && input.length, i = 0, key, value;

        if (!isVoid(length) && useLength) {
            for (; i < length; i++) {
                value = input[i];
                if (0 === fn.apply(_this, !useKey ?
                        [value, i] /* for */ : [i, value, i] /* forEach */)) {
                    break;
                }
            }
        } else {
            for (key in input) {
                if (input.hasOwnProperty(key)) {
                    value = input[key];
                    if (0 === fn.apply(_this, !useKey ?
                            [value, i++] /* for */ : [key, value, i++] /* forEach */)) {
                        break;
                    }
                }
            }
        }

        return _this;
    }


    // so: for, forEach
    extend($, {
        /**
         * For: (value, i)
         * @inheritDoc
         */
        for: function(input, fn, _this, useLength) {
            return loop(input, fn, _this, FALSE, useLength);
        },
        /**
         * For each: (key => value, i)
         * @inheritDoc
         */
        forEach: function(input, fn, _this, useLength) {
            return loop(input, fn, _this, TRUE, useLength);
        }
    });

    // so: type functions.
    extend($, {
        /** Is void. @param {Any} input @return {Bool} */
        isVoid: function(input) {
            return isVoid(input);
        },

        /** Is null. @param {Any} input @return {Bool} */
        isNull: function(input) {
            return (input === NULL);
        },

        /** Is nulls. @param {Any} input @return {Bool} */
        isNulls: function(input) {
            return (input === '');
        },

        /** Is defined. @param {Any} input @return {Bool} */
        isDefined: function(input) {
            return (input !== UNDEFINED);
        },

        /** Is undefined. @param {Any} input @return {Bool} */
        isUndefined: function(input) {
            return (input === UNDEFINED);
        },

        /** Is string. @param {Any} input @return {Bool} */
        isString: function(input) {
            return (typeof input == 'string' || (input && input.constructor == String));
        },

        /** Is int. @param {Any} input @return {Bool} */
        isInt: function(input) {
            return $.isNumber(input) && input == (input | 0);
        },

        /** Is float. @param {Any} input @return {Bool} */
        isFloat: function(input) {
            return $.isNumber(input) && input != (input | 0);
        },

        /** Is bool. @param {Any} input @return {Bool} */
        isBool: function(input) {
            return (input === TRUE || input === FALSE);
        },

        /** Is true. @param {Any} input @return {Bool} */
        isTrue: function(input) {
            return input === TRUE;
        },

        /** Is false. @param {Any} input @return {Bool} */
        isFalse: function(input) {
            return input === FALSE;
        },

        /** Is number. @param {Any} input @return {Bool} */
        isNumber: function(input) {
            return (typeof input == 'number');
        },

        /** Is numeric. @param {Any} input @return {Bool} */
        isNumeric: function(input) {
            return $.isNumber(input) || re_numeric.test(input);
        },

        /** Is RegExp. @param {Any} input @return {Bool} */
        isRegExp: function(input) {
            return input && input.constructor == RegExp;
        },

        /** Is function. @param {Any} input @return {Bool} */
        isFunction: function(input) {
            return (typeof input == 'function');
        },

        /** Is array. @param {Any} input @return {Bool} */
        isArray: function(input) {
            return Array.isArray(input);
        },

        /** Is object. @param {Any} input @return {Bool} */
        isObject: function(input) {
            return input && (input.constructor == Object);
        },

        /** Is iterable. @param {Any} input @return {Bool} */
        isIterable: function(input) {
            return $.isArray(input) || $.isObject(input) || (input && (
                (!isVoid(input.length) && !input[NAME_NODE_TYPE]) // dom, nodelist, string etc.
            ));
        },

        /** Is primitive. @param {Any} input @return {Bool} */
        isPrimitive: function(input) {
            return isVoid(input) || re_primitive.test(typeof input);
        },

        /** Is window. @param {Any} input @return {Bool} */
        isWindow: function(input) {
            return toBool(input && input == input[NAME_WINDOW] && input == input[NAME_WINDOW][NAME_WINDOW]);
        },

        /** Is document. @param {Any} input @return {Bool} */
        isDocument: function(input) {
            return toBool(input && input[NAME_NODE_TYPE] === 9);
        }
    });

    /**
     * Object keys & values.
     * @param  {Object} object
     * @return {Array}
     */
    Object.keys = Object.keys || function(object) {
        var ret = []; $.forEach(object, function(key) { ret.push(key) }); return ret;
    };
    Object.values = Object.values || function(object) {
        var ret = []; $.forEach(object, function(_, value) { ret.push(value) }); return ret;
    };

    // shortcut
    function has(input, search, strict) {
        var ret;

        if ($.isString(input)) {
            ret = $.isRegExp(search) ? input.search(search) : input.indexOf(search); // simply
        } else if ($.isArray(input) || $.isObject(input)) {
            $.for(input, function(value, i) {
                if (strict ? value === search : value == search) {
                    ret = i; return 0; // break
                }
            });
        }

        return ret > -1;
    }

    /**
     * Array extends.
     */
    extend(Array[NAME_PROTOTYPE], {
        /**
         * Has.
         * @param  {Any}  search
         * @param  {Bool} strict?
         * @return {Bool}
         */
        has: function(search, strict) {
            return has(this, search, strict);
        },

        /**
         * First.
         * @return {Any}
         */
        first: function() {
            return this[0];
        },

        /**
         * Last.
         * @return {Any}
         */
        last: function() {
            return this[this.length - 1];
        },

        /**
         * Extract.
         * @return {Object}
         */
        extract: function() {
            var keys = makeArray(arguments), values = {};

            return $.for(keys, function(key, i) {
                values[key] = this[i];
            }, this), values;
        }
    });

    // string helpers
    function prepareTrimRegExp(chars, isLeft) {
        return toRegExp((isLeft ? '^[%s]+' : '[%s]+$')
            .format(chars ? chars.replace(/([\[\]\\])/g, '\\$1') : '\\s'));
    }

    function prepareSearchStuff(str, search, index, noCase) {
        if (str && search) {
            // swap arguments
            if (index === FALSE) {
                noCase = FALSE, index = UNDEFINED;
            }

            str = toString(str);
            if (noCase) {
                str = s.toLowerCase();
                search = search.toLowerCase();
            }

            return {s: str, ss: search, i: index || 0};
        }
    }

    /**
     * String extends.
     */
    extend(String[NAME_PROTOTYPE], {
        /**
         * Has.
         * @param  {Any}  search
         * @param  {Bool} strict?
         * @return {Bool}
         */
        has: function(search, strict) {
            return has(this, search, strict);
        },

        /**
         * Test.
         * @param  {RegExp} re
         * @return {Bool}
         */
        test: function(re) {
            return re.test(this);
        },

        /**
         * Is numeric.
         * @return {Bool}
         */
        isNumeric: function() {
            return $.isNumeric(this);
        },

        /**
         * To int.
         * @param  {Int} base
         * @return {Int}
         */
        toInt: function(base) {
            return toInt(this, base);
        },

        /**
         * To float.
         * @return {Float}
         */
        toFloat: function() {
            return toFloat(this);
        },

        /**
         * To capital case.
         * @param  {Bool} all   @default=true
         * @param  {Bool} lower @default=false
         * @return {String}
         */
        toCapitalCase: function(all, lower) {
            var str = toString(this), i;

            if (lower) {
                str = str.toLowerCase();
            }

            if (all !== FALSE) {
                for (i = 0, str = str.split(' '); i < str.length; i++) {
                    str[i] = str[i].toCapitalCase(FALSE);
                }
                return str.join(' ');
            }

            return str[0].toUpperCase() + str.slice(1);
        },

        /**
         * Format.
         * @param  {Object} ...arguments
         * @return {String}
         * @throws
         */
        format: function() {
            var str = toString(this),
                arg, args = arguments,
                match = str.match(/(%s)/g) || [], i = 0;

            if (args.length < match.length) {
                $.logWarn('No enough arguments!');
            }

            while (match.shift()) {
                arg = args[i++];
                if (!isVoid(arg)) {
                    str = str.replace(/(%s)/, arg);
                }
            }

            return str;
        },

        /**
         * Match all.
         * @param  {RegExp} pattern
         * @return {Array?}
         */
        matchAll: function(pattern) {
            pattern = toString(pattern);

            var slashPosition = pattern.lastIndexOf('/');
            var source = pattern.substr(1, slashPosition - 1);
            var flags = pattern.substr(slashPosition + 1);
            var r, re, ret = [];

            // never forget or lost in infinite loops..
            if (!flags.has('g')) flags += 'g';

            re = toRegExp(source, flags);
            while (r = re.exec(this)) {
                ret.push(r);
            }

            return ret.length ? ret : NULL;
        },

        /**
         * Append.
         * @param  {String} ...arguments
         * @return {String}
         */
        append: function() {
            var str = toString(this); return $.for(arguments, function(value) {
                str = str + value;
            }), str;
        },

        /**
         * Prepen.
         * @param  {String} ...arguments
         * @return {String}
         */
        prepend: function() {
            var str = toString(this); return $.for(arguments, function(value) {
                str = value + str;
            }), str;
        },

        /**
         * Wrap.
         * @param  {String|Array} input
         * @return {String}
         */
        wrap: function(input) {
            return $.isString(input)
                ? input + toString(this) + input
                : input[0] + toString(this) + input[1];
        },

        /**
         * Unwrap.
         * @param  {String} input
         * @return {String}
         */
        unwrap: function(input) {
            var str = toString(this);
            input = toString(input);

            if (str.has(input)) {
                return str.substr(input.length).substr(-input.length);
            }

            return str;
        },

        /**
         * Replace all.
         * @param  {String} searchValue
         * @param  {String} replaceValue
         * @return {String}
         */
        replaceAll: function(searchValue, replaceValue) {
            return this.replace(toRegExp(searchValue, 'g'), replaceValue);
        },

        /**
         * For.
         * @param  {Function} fn
         * @return {String}
         */
        for: function(fn) {
            return $.for(toString(this), fn, this);
        },

        /**
         * For each.
         * @param  {Function} fn
         * @return {String}
         */
        forEach: function(fn) {
            return $.forEach(toString(this), fn, this);
        },

        /**
         * Trim.
         * @param  {String} chars?
         * @return {String}
         * @override For chars option.
         */
        trim: function(chars) {
            if (!chars) {
                return trim(this);
            }
            return this.trimLeft(chars).trimRight(chars);
        },

        /**
         * Trim left.
         * @param  {String} chars?
         * @return {String}
         * @override For chars option.
         */
        trimLeft: function(chars) {
            if (!chars) {
                return trim(this, 1);
            }

            var str = toString(this), re = prepareTrimRegExp(chars, TRUE);
            while (re.test(str)) {
                str = str.replace(re, '');
            }
            return str;
        },

        /**
         * Trim right.
         * @param  {String} chars?
         * @return {String}
         * @override For chars option.
         */
        trimRight: function(chars) {
            if (!chars) {
                return trim(this, 2);
            }

            var str = toString(this), re = prepareTrimRegExp(chars);
            while (re.test(str)) {
                str = str.replace(re, '');
            }
            return str;
        },

        /**
         * Starts with.
         * @param  {String} search
         * @param  {Int}    index?
         * @param  {Bool}   noCase?
         * @return {Bool}
         * @override For no-case option.
         */
        startsWith: function(search, index, noCase) {
            var src = prepareSearchStuff(this, search, index, noCase);
            return (src.ss === src.s.substr(src.i, src.ss.length));
        },

        /**
         * Ends with.
         * @param  {String} search
         * @param  {Int}    index?
         * @param  {Bool}   noCase?
         * @return {Bool}
         * @override For no-case option.
         */
        endsWith: function(search, index, noCase) {
            var src = prepareSearchStuff(this, search, index, noCase);
            return (src.ss === src.s.substr(0, src.i || src.ss.length));
        },

        /**
         * Contains.
         * @param  {String} search
         * @param  {Bool}   noCase?
         * @return {Bool}
         */
        contains: function(search, noCase) {
            var src = prepareSearchStuff(this, search, noCase);
            return (src.s !== src.s.split(src.ss)[0]);
        },

        /**
         * To reg exp.
         * @param  {String} flags?
         * @return {RegExp}
         */
        toRegExp: function(flags) {
            return toRegExp(this, flags);
        }
    });

    /**
     * Function extends.
     */
    extend(Function[NAME_PROTOTYPE], {
        /**
         * Extend.
         * @param  {Object} properties
         * @return {Function}
         */
        extend: function(properties) {
            return extend(this, properties, this);
        },
        /**
         * Extend prototype.
         * @param  {Object} prototype
         * @return {Function}
         */
        extendPrototype: function(prototype) {
            return extend(this[NAME_PROTOTYPE], prototype, this);
        }
    });

    var _id = 0;
    var fn_slice = [].slice;
    var fn_toString = {}.toString;

    /**
     * Make array.
     * @param  {Any} input
     * @param  {Int} begin?
     * @param  {Int} end?
     * @return {Array}
     */
    function makeArray(input, begin, end) {
        var ret = [], inputType = $.type(input);

        if (inputType == 'array') {
            return input;
        }

        if (!input || inputType == 'string' || inputType == 'window'
            || input[NAME_NODE_TYPE] || isVoid(input.length)) {
            ret = [input];
        } else {
            ret = fn_slice.call(input, begin, end);
        }

        return ret;
    }

    // shortcut
    function _log(fn, args) {
        consoleBind(fn, ['>> so:'].concat(makeArray(args)));
    }

    // so: base functions.
    extend($, {
        /**
         * Debug tools.
         * @return {void}
         */
        log: function() { _log('log', arguments); },
        logInfo: function() { _log('info', arguments); },
        logWarn: function() { _log('warn', arguments); },
        logError: function() { _log('error', arguments); },

        /**
         * Fn.
         * @return {Function}
         */
        fn: function() {
            return function() {};
        },

        /**
         * Now.
         * @return {Int}
         */
        now: function() {
            return Date.now();
        },

        /**
         * Id.
         * @return {Int}
         */
        id: function() {
            return ++_id;
        },

        /**
         * Sid (string id).
         * @param  {String} prefix?
         * @return {String}
         */
        sid: function(prefix) {
            return toValue(prefix,  '__so_sid_') + $.id();
        },

        /**
         * Rid (random id).
         * @param  {String} prefix?
         * @return {String}
         */
        rid: function(prefix) {
            return toValue(prefix, '__so_rid_') + $.now() + toString(Math.random()).slice(-8);
        },

        /**
         * Re.
         * @param  {String} pattern
         * @param  {String} flags?
         * @param  {Int}    ttl?
         * @return {RegExp}
         */
        re: function(pattern, flags, ttl) {
            return toRegExp(pattern, flags, ttl);
        },

        /**
         * Fire & firer(recursive).
         * @param  {Int|String} delay (ms)
         * @param  {Function}   fn
         * @param  {Array}      fnArgs?
         * @return {void}
         */
        fire: function(delay, fn, fnArgs) {
            if ($.isString(delay)) {
                delay = toMilliseconds(delay);
            }

            return setTimeout(function() {
                fn.apply(NULL, fnArgs || []);
            }, delay || 1);
        },
        firer: function(delay, fn, fnArgs) {
            if ($.isString(delay)) {
                delay = toMilliseconds(delay);
            }

            return setInterval(function() {
                fn.apply(NULL, fnArgs || []);
            }, delay || 1);
        },

        /**
         * Get window.
         * @param  {Any} object
         * @return {Window?}
         */
        getWindow: function(object) {
            if (!object) {
                return window;
            } if (object[NAME_OWNER_DOCUMENT]) {
                return object[NAME_OWNER_DOCUMENT][NAME_DEFAULT_VIEW];
            } if ($.isWindow(object)) {
                return object;
            } if ($.isDocument(object)) {
                return object[NAME_DEFAULT_VIEW];
            }
        },

        /**
         * Get document.
         * @param  {Any} object
         * @return {Document?}
         */
        getDocument: function(object) {
            if (!object) {
                return window[NAME_DOCUMENT];
            } if (object[NAME_OWNER_DOCUMENT]) {
                return object[NAME_OWNER_DOCUMENT]; // node
            } if ($.isDocument(object)) {
                return object;
            } if ($.isWindow(object)) {
                return object[NAME_DOCUMENT];
            }
        },

        /**
         * Trim.
         * @param  {String} input
         * @param  {String} chars?
         * @return {String}
         */
        trim: function(input, chars) {
            return !isVoid(input) ? toString(input).trim(chars) : '';
        },

        /**
         * Trim left.
         * @param  {String} input
         * @param  {String} chars?
         * @return {String}
         */
        trimLeft: function(input, chars) {
            return !isVoid(input) ? toString(input).trimLeft(chars) : '';
        },

        /**
         * Trim right.
         * @param  {String} input
         * @param  {String} chars?
         * @return {String}
         */
        trimRight: function(input, chars) {
            return !isVoid(input) ? toString(input).trimRight(chars) : '';
        },

        /**
         * Dig.
         * @param  {Array|Object} input
         * @param  {Int|String}   key
         * @return {Any}
         */
        dig: function(input, key) {
            if ($.isArray(input) || $.isObject(input)) {
                var keys = trim(key).split('.'), key = keys.shift();

                if (!keys.length) {
                    return input[key];
                }

                // recursion
                return $.dig(input[key], keys.join('.'));
            }
        },

        /**
         * Type of.
         * @param  {Any} input
         * @return {String}
         */
        type: function(input) {
            var type;

            if ($.isNull(input))             type = 'null';
            else if ($.isUndefined(input))   type = 'undefined';
            else if ($.isWindow(input))      type = NAME_WINDOW;
            else if ($.isDocument(input))    type = NAME_DOCUMENT;
            else type = fn_toString.call(input).slice(8, -1).toLowerCase();

            return type;
        },

        /**
         * Int, float, string, bool, value.
         * @param  {Any} input
         * @return {Any}
         */
        int:    function(input, base) { return toInt(input, base); },
        float:  function(input) { return toFloat(input); },
        string: function(input) { return toString(input); },
        bool:   function(input) { return toBool(input); },
        value:  function(input, valueDefault) { return toValue(input, valueDefault); },

        /**
         * Json encode / decode.
         * @param  {Any}    input
         * @param  {Bool}   encode @default=false (parse)
         * @param  {Object} options?
         * @return {String}
         */
        json: function(input, encode, options) {
            return (options = options || {}),
                encode ? JSON.stringify(input, options.replacer, options.space)
                       : JSON.parse(input, options.reviver);
        },

        /**
         * Has.
         * @param  {Any}  input
         * @param  {Any}  search
         * @param  {Bool} strict?
         * @return {Bool}
         */
        has: function(input, search, strict) {
            return has(input, search, strict);
        },

        /**
         * Is set.
         * @param  {Any}    input
         * @param  {String} key?
         * @return {Bool}
         */
        isSet: function(input, key) {
            return !isVoid(isVoid(key) ? input : $.dig(input, key));
        },

        /**
         * Is empty.
         * @param  {Any} input
         * @return {Bool}
         */
        isEmpty: function(input) {
            return !input // '', null, undefined, false, 0, -0, NaN
                || ($.isNumber(input.length) && !input.length)
                || ($.isObject(input) && !Object.keys(input).length)
                || ($.isArray(input) && !Object.values(input).length);
        },

        /**
         * Copy.
         * @param  {Array|Object} input
         * @param  {Array}        keysExclude?
         * @return {Array|Object}
         */
        copy: function(input, keysExclude) {
            return $.copyTo($.isArray(input) ? [] : {}, input, keysExclude);
        },

        /**
         * Copy to.
         * @param  {Array|Object} inputTo
         * @param  {Array|Object} inputFrom
         * @param  {Array}        keysExclude
         * @param  {Bool}         overwrite? @default=true
         * @return {Array|Object}
         */
        copyTo: function(inputTo, inputFrom, keysExclude, overwrite) {
            var keys = keysExclude || [], key;

            for (key in inputFrom) {
                if (!keys.has(key)) {
                    if (overwrite !== FALSE && key in inputTo) {
                        continue;
                    }
                    inputTo[key] = inputFrom[key];
                }
            };

            return inputTo;
        },

        /**
         * Extend.
         * @param  {Object} target
         * @param  {Object} source
         * @return {Object}
         */
        extend: function(target, source) {
            if ($.isArray(target)) {
                while (target.length) {
                    $.extend(target.shift(), source);
                }
            } else {
                return extend.apply(NULL, [target, source].concat(makeArray(arguments, 2)));
            }
        },

        /**
         * Extend prototype.
         * @param  {Function} target
         * @param  {Object}   prototype
         * @return {Function}
         */
        extendPrototype: function(target, prototype) {
            if ($.isArray(target)) {
                while (target.length) {
                    $.extendPrototype(target.shift(), prototype);
                }
            } else {
                return extend(target[NAME_PROTOTYPE], prototype);
            }
        },

        /**
         * Array.
         * @param  {Object} ...arguments
         * @return {Array}
         */
        array: function() {
            var ret = [], args = arguments, argsLen = args.length, i = 0;

            while (i < argsLen) {
                ret = ret.concat(makeArray(args[i++]));
            }

            return ret;
        },

        /**
         * Object.
         * @param  {Object} object
         * @param  {Object} properties
         * @return {Object}
         */
        object: function(object, properties) {
            $.forEach(properties, function(name, property) {
                properties[name] = {
                    value: property[0],
                    writable: toBool(!isVoid(property[1]) ? property[1] : TRUE),
                    enumerable: toBool(!isVoid(property[2]) ? property[2] : TRUE),
                    configurable: toBool(!isVoid(property[3]) ? property[3] : TRUE)
                }
            });

            return Object.create(object, properties);
        },

        /**
         * Options.
         * @param  {Object|void} options
         * @param  {Object}      ...arguments
         * @return {Object}
         */
        options: function(options) {
            return $.extend.apply(NULL, [options || {}].concat(makeArray(arguments, 1)));
        },

        /**
         * Pick.
         * @param  {Array|Object} input
         * @param  {String}       key
         * @param  {Any}          valueDefault?
         * @return {Any?}
         */
        pick: function(input, key, valueDefault) {
            var value = valueDefault;

            if (key in input) {
                if ($.isArray(input)) {
                    value = input.splice(key, 1)[0];
                } else {
                    value = input[key], delete input[key];
                    if (input.length) input.length--; // fix length
                }
            }

            return value;
        },

        /**
         * Pick all.
         * @param  {Array|Object} input
         * @param  {Object}       ...arguments
         * @return {Object}
         */
        pickAll: function(input) {
            var keys = makeArray(arguments, 1), values = {};

            $.forEach(input, function(key, value) {
                // if ($.isNumeric(key)) key *= 1; // fix for index
                if (keys.has(key)) {
                    values[key] = value, delete input[key];
                }
            });

            if (input.length && !$.isEmpty(values)) {
                input.length -= values.length; // fix keys & length
            }

            return values;
        },

        /**
         * Split.
         * @param  {String} input
         * @param  {String} separator
         * @param  {Int}    limit?
         * @return {Array}
         */
        split: function(input, separator, limit) {
            input = input.split(separator);
            if (limit) {
                input = input.slice(0, limit - 1).concat(input.slice(limit - 1).join(separator));
            }
            return input;
        }
    });

    // onReady stuff
    var onReadyCallbacks = [];
    var onReadyCallbacksFire = function() {
        while (onReadyCallbacks.length) {
            onReadyCallbacks.shift()($);
        }
    };

    /**
     * Oh baby..
     * @param  {Function}  callback
     * @param  {Document?} document
     * @return {none}
     */
    $.onReady = function(callback, document) {
        if ($.isFunction(callback)) {
            onReadyCallbacks.push(callback);
        }

        // iframe support
        document = document || window[NAME_DOCUMENT];

        var type = 'DOMContentLoaded';
        document.addEventListener(type, function _() {
            document.removeEventListener(type, _, FALSE);
            onReadyCallbacksFire();
        }, FALSE);
    };

    // for later
    $.ext = {};

})(window, {}, null, true, false);
