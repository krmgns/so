/**
 * @package so
 * @object  so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $, undefined) { 'use strict';

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

    // globals
    window.so = $;
    window.so.VERSION = '5.3.8';
    window.so[NAME_WINDOW] = window;
    window.so[NAME_DOCUMENT] = window[NAME_DOCUMENT];
    window.so.DOMLevel = window[NAME_DOCUMENT].adoptNode ? 3 : 2;

    // safe bind for ie9 (yes, still ie..)
    function consoleBind(fn, args) {
        Function[NAME_PROTOTYPE].bind.call(window.console[fn], window.console)
            .apply(window.console, args);
    }

    // shortcut for 'console.log'
    window.log = function() {
        var args = arguments, i = 0;
        while (i < args.length) {
            if (typeof args[i] == 'string') {
                args[i] = '"'+ args[i] +'"'; // show strings in quotes
            }
            i++;
        }
        consoleBind('log', args);
    };

    var _reCache = {};
    var re_dot = /^[-+]?\./;
    var re_time = /(\d+)(\w+)/;
    var re_numeric = /^[-+]?(?:\.?\d+|\d+\.\d+)$/;
    var re_trimSpace = /^\s+|\s+$/g;
    var re_primitive = /^(string|number|boolean)$/;
    var RegExp = window.RegExp;

    // faster trim for space only
    function trimSpace(input) {
        return (input != null) ? (''+ input).replace(re_trimSpace, '') : '';
    }

    // shortcut convert helpers
    function toValue(input, valueDefault) {
        return (input != null) ? input : valueDefault;
    }
    function toInt(input, base) {
        return input = input.replace(re_dot, '0.'),
            ((base == null) ? parseInt(input) : parseInt(input, base)) || 0;
    }
    function toFloat(input) {
        return parseFloat(input) || 0;
    }
    function toString(input) {
        return ((input != null) && input.toString) ? input.toString() : (''+ input);
    }
    function toBool(input) {
        return !!input;
    }

    function toTimeInt(input) {
        var tmp = input.split(re_time),
            time = toInt(tmp[1]), timeDir = tmp[2];

        switch (timeDir) {
            case 's': case 'sec': input = time * 1000; break;
            case 'm': case 'min': input = time * 1000 * 60; break;
            case 'h': case 'hour': input = time * 1000 * 60 * 60; break;
        }

        return input;
    }

    // cacheable regexp stuff
    function toRegExp(pattern, flags, ttl) {
        flags = flags || '';
        if ($.isInt(flags)) {
            ttl = flags, flags = '';
        }

        if (!ttl) { // no cache
            return new RegExp(pattern, flags);
        }

        if ($.isString(ttl)) {
            ttl = toTimeInt(ttl, true);
        }
        ttl = (ttl > -1) ? ttl : 60 * 60 * 24; // one day

        var i = pattern + (flags || ''), ret = _reCache[i];
        if (!ret) {
            ret = _reCache[i] = new RegExp(pattern, flags);
        }

        // simple gc
        $.fire(ttl, function(){ _reCache = {}; });

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
     * @param  {Boolean}      useKey?
     * @param  {Boolean}      useLength?
     * @return {Array|Object}
     * @private
     */
    function loop(input, fn, _this, useKey, useLength) {
        var _this = _this || input, length = input && input.length, i = 0, key, value;

        if (length != null && useLength != false) {
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
            return loop(input, fn, _this, false, useLength);
        },
        /**
         * For each: (key => value, i)
         * @inheritDoc
         */
        forEach: function(input, fn, _this, useLength) {
            return loop(input, fn, _this, true, useLength);
        }
    });

    // so: type functions.
    extend($, {
        /** Is void. @param {Any} input @return {Boolean} */
        isVoid: function(input) {
            return (input == null);
        },

        /** Is null. @param {Any} input @return {Boolean} */
        isNull: function(input) {
            return (input === null);
        },

        /** Is nulls. @param {Any} input @return {Boolean} */
        isNulls: function(input) {
            return (input === '');
        },

        /** Is undefined. @param {Any} input @return {Boolean} */
        isUndefined: function(input) {
            return (input === undefined);
        },

        /** Is string. @param {Any} input @return {Boolean} */
        isString: function(input) {
            return (typeof input == 'string' || (input && input.constructor == String));
        },

        /** Is int. @param {Any} input @return {Boolean} */
        isInt: function(input) {
            return $.isNumber(input) && input == (input | 0);
        },

        /** Is float. @param {Any} input @return {Boolean} */
        isFloat: function(input) {
            return $.isNumber(input) && input != (input | 0);
        },

        /** Is bool. @param {Any} input @return {Boolean} */
        isBool: function(input) {
            return (input === true || input === false);
        },

        /** Is true. @param {Any} input @return {Boolean} */
        isTrue: function(input) {
            return input === true;
        },

        /** Is false. @param {Any} input @return {Boolean} */
        isFalse: function(input) {
            return input === false;
        },

        /** Is number. @param {Any} input @return {Boolean} */
        isNumber: function(input) {
            return (typeof input == 'number');
        },

        /** Is numeric. @param {Any} input @return {Boolean} */
        isNumeric: function(input) {
            return $.isNumber(input) || re_numeric.test(input);
        },

        /** Is RegExp. @param {Any} input @return {Boolean} */
        isRegExp: function(input) {
            return input && input.constructor == RegExp;
        },

        /** Is function. @param {Any} input @return {Boolean} */
        isFunction: function(input) {
            return (typeof input == 'function');
        },

        /** Is array.@param {Any} input @return {Boolean} */
        isArray: function(input) {
            return Array.isArray(input);
        },

        /** Is object. @param {Any} input @return {Boolean} */
        isObject: function(input) {
            return input && (input.constructor == Object);
        },

        /** Is iterable.     @param {Any} input @return {Boolean} */
        isIterable: function(input) {
            return $.isArray(input) || $.isObject(input) || (input && (
                (input.length != null && !input[NAME_NODE_TYPE]) // dom, nodelist, string etc.
            ));
        },

        /** Is primitive. @param {Any} input @return {Boolean} */
        isPrimitive: function(input) {
            return $.isVoid(input) || re_primitive.test(typeof input);
        },

        /** Is window. @param {Any} input @return {Boolean} */
        isWindow: function(input) {
            return toBool(input && input == input[NAME_WINDOW] && input == input[NAME_WINDOW][NAME_WINDOW]);
        },

        /** Is document. @param {Any} input @return {Boolean} */
        isDocument: function(input) {
            return toBool(input && input[NAME_NODE_TYPE] === 9);
        }
    });

    /**
     * Object keys, values, copy.
     * @param  {Object} object
     * @param  @internal ret
     * @return {Array}
     */
    Object.keys = Object.keys || function(object, ret) {
        return ret = [], $.forEach(object, function(key) { ret.push(key); }), ret;
    };
    Object.values = Object.values || function(object, ret) {
        return ret = [], $.forEach(object, function(_, value) { ret.push(value); }), ret;
    };
    // Object[NAME_PROTOTYPE].copy = function() {
    //     var _this = this, ret = {}, i;
    //     for (i in _this) {
    //         if (_this.hasOwnProperty(i)) {
    //             ret[i] = _this[i];
    //         }
    //     }
    //     return ret;
    // };
    // Object[NAME_PROTOTYPE].append = function(source) {
    //     var _this = this, i;
    //     for (i in source) {
    //         if (source.hasOwnProperty(i)) {
    //             _this[i] = source[i];
    //         }
    //     }
    //     return _this;
    // };

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
         * @param  {Any}     search
         * @param  {Boolean} strict?
         * @return {Boolean}
         */
        has: function(search, strict) {
            return has(this, search, strict);
        },

        /**
         * Get.
         * @param  {Int} key
         * @param  {Any} valueDefault
         * @return {Any}
         */
        get: function(key, valueDefault) {
            return (key in this) ? this[key] : valueDefault;
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
            if (index === false) {
                noCase = false, index = 0;
            }

            str = toString(str);
            if (noCase) {
                str = s.toLowerCase(), search = search.toLowerCase();
            }

            return {s: str, ss: search, i: index};
        }
    }

    /**
     * String extends.
     */
    extend(String[NAME_PROTOTYPE], {
        /**
         * Has.
         * @param  {Any}     search
         * @param  {Boolean} strict?
         * @return {Boolean}
         */
        has: function(search, strict) {
            return has(this, search, strict);
        },

        /**
         * Test.
         * @param  {RegExp} re
         * @return {Boolean}
         */
        test: function(re) {
            return re.test(this);
        },

        /**
         * Is numeric.
         * @return {Boolean}
         */
        isNumeric: function() {
            return $.isNumeric(this);
        },

        /**
         * To int.
         * @param  {Int} base
         * @return {Int|null}
         */
        toInt: function(base) { return toInt(this, base); },

        /**
         * To float.
         * @return {Float|null}
         */
        toFloat: function() { return toFloat(this); },

        /**
         * To capital case.
         * @param  {Boolean} all   @default=true
         * @param  {Boolean} lower @default=false
         * @return {String}
         */
        toCapitalCase: function(all, lower) {
            var str = toString(this), i;

            if (lower) str = str.toLowerCase();

            if (all !== false) {
                for (i = 0, str = str.split(' '); i < str.length; i++) {
                    str[i] = str[i].toCapitalCase(false);
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
            var str = toString(this), args = arguments, match = str.match(/(%s)/g) || [], i = 0;

            if (args.length < match.length) {
                $.logWarn('No enough arguments!');
            }

            while (match.shift()) {
                str = str.replace(/(%s)/, args[i++]);
            }

            return str;
        },

        /**
         * Match all.
         * @param  {RegExp} pattern
         * @return {Array|null}
         */
        matchAll: function(pattern) {
            pattern = toString(pattern);

            var slashPosition = pattern.lastIndexOf('/'),
                source = pattern.substr(1, slashPosition - 1),
                flags  = pattern.substr(slashPosition + 1),
                r, re, ret = [];

            // never forget or lost in infinite loops..
            if (!flags.has('g')) flags += 'g';

            re = toRegExp(source, flags);
            while (r = re.exec(this)) {
                ret.push(r);
            }

            return ret.length ? ret : null;
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
            return this.trimLeft(chars).trimRight(chars);
        },

        /**
         * Trim left.
         * @param  {String} chars?
         * @return {String}
         * @override For chars option.
         */
        trimLeft: function(chars) {
            var str = toString(this), re = prepareTrimRegExp(chars, true);

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
            var str = toString(this), re = prepareTrimRegExp(chars);

            while (re.test(str)) {
                str = str.replace(re, '');
            }

            return str;
        },

        /**
         * Trim space.
         * @return {String}
         */
        trimSpace: function() {
            return trimSpace(this);
        },

        /**
         * Starts with.
         * @param  {String}  search
         * @param  {Int}     index
         * @param  {Boolean} noCase?
         * @return {Boolean}
         * @override For no-case option.
         */
        startsWith: function(search, index, noCase) {
            var src = prepareSearchStuff(this, search, index, noCase);
            return src.ss === src.s.substr(src.i || 0, src.ss.length);
        },

        /**
         * Ends with.
         * @param  {String}  search
         * @param  {Int}     index
         * @param  {Boolean} noCase?
         * @return {Boolean}
         * @override For no-case option.
         */
        endsWith: function(search, index, noCase) {
            var src = prepareSearchStuff(this, search, index, noCase);
            return src.ss === src.s.substr(0, src.i || src.ss.length);
        },

        /**
         * Contains.
         * @param  {String}  search
         * @param  {Boolean} noCase?
         * @return {Boolean}
         */
        contains: function(search, noCase) {
            var src = prepareSearchStuff(this, search, noCase);
            return src.s !== src.s.split(src.ss)[0];
        },

        /**
         * To RegExp
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
    var fn_eval = window.eval; // direct eval breaks minify tool
    var fn_slice = [].slice;
    var fn_toString = {}.toString;

    /**
     * Array.
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
            || input[NAME_NODE_TYPE] || $.isVoid(input.length)) {
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
         * Sid.
         * @param  {String} prefix
         * @return {String}
         */
        sid: function(prefix) {
            return (prefix || '__so_sid_') + $.id();
        },

        /**
         * Re.
         * @param  {String} pattern
         * @param  {String} flags
         * @param  {Int}    ttl
         * @return {RegExp}
         */
        re: function(pattern, flags, ttl) {
            return toRegExp(pattern, flags, ttl);
        },

        /**
         * Fire & fire(r)ecursive.
         * @param  {Int}      delay (ms)
         * @param  {Function} fn
         * @param  {Array}    fnArgs?
         * @return {void}
         */
        fire: function(delay, fn, fnArgs) {
            if ($.isString(delay)) {
                delay = toTimeInt(delay);
            }

            return setTimeout(function() {
                fn.apply(null, fnArgs || []);
            }, delay || 1);
        },
        firer: function(delay, fn, fnArgs) {
            if ($.isString(delay)) {
                delay = toTimeInt(delay);
            }

            return setInterval(function() {
                fn.apply(null, fnArgs || []);
            }, delay || 1);
        },

        /**
         * Get window.
         * @param  {Any} node
         * @return {Window|undefined}
         */
        getWindow: function(input) {
            var ret;

            if (!input) {
                ret = window;
            } else {
                if ($.isWindow(input)) {
                    ret = input;
                } else if ($.isDocument(input)) {
                    ret = input[NAME_DEFAULT_VIEW]; // document window
                } else if (input[NAME_NODE_TYPE] === 1 || input[NAME_NODE_TYPE] === 9 || input[NAME_NODE_TYPE] === 11) {
                    ret = input[NAME_OWNER_DOCUMENT][NAME_DEFAULT_VIEW]; // node document window
                }
            }

            return ret;
        },

        /**
         * Get document.
         * @param  {Any} input
         * @return {Document|undefined}
         */
        getDocument: function(input) {
            var ret;

            if (!input) {
                ret = window[NAME_DOCUMENT];
            } else {
                if ($.isDocument(input)) {
                    ret = input;
                } else if (input[NAME_DOCUMENT]) { // window
                    ret = input[NAME_DOCUMENT];
                } else if (input[NAME_OWNER_DOCUMENT]) { // document or node
                    ret = input[NAME_OWNER_DOCUMENT];
                }
            }

            return ret;
        },

        /**
         * Trim.
         * @param  {String} input
         * @param  {String} chars?
         * @return {String}
         */
        trim: function(input, chars) {
            return (input != null) ? (''+ input).trim(chars) : '';
        },

        /**
         * Trim left.
         * @param  {String} input
         * @param  {String} chars?
         * @return {String}
         */
        trimLeft: function(input, chars) {
            return (input != null) ? (''+ input).trimLeft(chars) : '';
        },

        /**
         * Trim right.
         * @param  {String} input
         * @param  {String} chars?
         * @return {String}
         */
        trimRight: function(input, chars) {
            return (input != null) ? (''+ input).trimRight(chars) : '';
        },

        /**
         * Trim space.
         * @param  {String} input
         * @return {String}
         */
        trimSpace: function(input) {
            return trimSpace(input);
        },

        /**
         * Dig.
         * @param  {Object} input
         * @param  {String} key
         * @return {Any}
         */
        dig: function(input, key) {
            if ($.isArray(input) || $.isObject(input)) {
                var keys = toString(key).split('.'), key = keys.shift();

                if (!keys.length) {
                    return input[key];
                }

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
        int: function(input, base) { return toInt(input, base); },
        float: function(input) { return toFloat(input); },
        string: function(input) { return toString(input); },
        bool: function(input) { return toBool(input); },
        value: function(input, valueDefault) { return toValue(input, valueDefault); },

        /**
         * Json encode / decode.
         * @param  {Any}     input
         * @param  {Boolean} to @default=parse
         * @return {String}
         */
        json: function(input, to) {
            return to ? JSON.stringify(input) : JSON.parse(input);
        },

        /**
         * Has.
         * @param  {Any}     input
         * @param  {Any}     search
         * @param  {Boolean} strict?
         * @return {Boolean}
         */
        has: function(input, search, strict) {
            return has(input, search, strict);
        },

        /**
         * Is set.
         * @param  {Any}    input
         * @param  {String} key?
         * @return {Boolean}
         */
        isSet: function(input, key) {
            return ((key != null) ? $.dig(input, key) : input) != null;
        },

        /**
         * Is empty.
         * @param  {Any} input
         * @return {Boolean}
         */
        isEmpty: function(input) {
            return !input // '', null, undefined, false, 0, -0, NaN
                || ($.isArray(input) && !Object.keys(input).length)
                || ($.isNumber(input.length) && !input.length)
                || ($.isObject(input) && !Object.keys(input).length);
        },

        /**
         * Copy.
         * @param  {Array|Object} input
         * @param  {Array}        keysExclude?
         * @return {Array|Object}
         */
        copy: function(input, keysExclude) {
            return $.copyTo($.isArray(input) ? [] : {}, input, keysExclude, true);
        },

        /**
         * Copy to.
         * @param  {Array|Object} inputTo
         * @param  {Array|Object} inputFrom
         * @param  {Array}        keysExclude
         * @param  {Boolean}      overwrite? @default=true
         * @return {Array|Object}
         */
        copyTo: function(inputTo, inputFrom, keysExclude, overwrite) {
            var keys = keysExclude || [], key;

            for (key in inputFrom) {
                if (!keys.has(key)) {
                    if (overwrite !== false && key in inputTo) {
                        continue;
                    }
                    inputTo[key] = inputFrom[key];
                }
            };

            return inputTo;
        },

        /**
         * Extend.
         * @param  {Any}     target
         * @param  {Any}     source
         * @return {Any}
         */
        extend: function(target, source) {
            if ($.isArray(target)) {
                while (target.length) {
                    $.extend(target.shift(), source);
                }
            } else {
                return extend.apply(null, [target, source].concat(makeArray(arguments, 2)));
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
                    writable: toBool(property[1] != null ? property[1] : true),
                    enumerable: toBool(property[2] != null ? property[2] : true),
                    configurable: toBool(property[3] != null ? property[3] : false),
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
            return $.extend.apply(null, [options || {}].concat(makeArray(arguments, 1)));
        },

        /**
         * Pick.
         * @param  {Array|Object} input
         * @param  {String}       key
         * @param  {Any}          valueDefault?
         * @return {Any|undefined}
         * @throws
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
         * Pick all
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
     * @param  {Function}           callback
     * @param  {Document|undefined} document
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
            document.removeEventListener(type, _, false);
            onReadyCallbacksFire();
        }, false);
    };

    // for later
    $.ext = {};

})(window, {});
