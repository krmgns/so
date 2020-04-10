/**
 * @package so
 * @object  so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function($win, NULL, TRUE, FALSE, UNDEFINED) { 'use strict';

    // simply support check
    if (!''.trim) {
        throw ('Archaic browser!');
    }

    /**
     * So.
     * @param  {String|Object|Function} a
     * @param  {String|Object|Function} b?
     * @param  {Bool|Object}            c?
     * @return {Object|void}
     */
    function $(a, b, c) {
        return !isFunction(a) ? $.dom(a, b, c) // (selector, root?, one?)
                              : $.ready(a, b)  // (callback, document?)
    }

    // globalize
    $win.so = $;
    $win.so.VERSION = '5.98.2';

    // minify candies
    var NAME_WINDOW = 'window', NAME_DOCUMENT = 'document';
    var NAME_NODE_TYPE = 'nodeType', NAME_PROTOTYPE = 'prototype';
    var NAME_DEFAULT_VIEW = 'defaultView', NAME_OWNER_DOCUMENT = 'ownerDocument';
    var NAME_LENGTH = 'length';
    var Array = $win.Array, Object = $win.Object, String = $win.String, Number = $win.Number;
    var Date = $win.Date, RegExp = $win.RegExp, Math = $win.Math;

    // global Int & Float objects
    $win.Int = function(num) { return toInt(num, 10) };
    $win.Float = function(num) { return toFloat(num) };

    // safe bind for ie9 (yes, still ie..)
    function consoleBind(fn, args) {
        return Function[NAME_PROTOTYPE].bind
            .call($win.console[fn], $win.console)
                .apply($win.console, args);
    }

    // shortcut for 'console.log'
    $win.log = function() { consoleBind('log', arguments); };

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
        return (input == NULL);
    }

    // faster trim for space only purposes
    function trim(input, opt_side) {
        return (input != NULL) ? (''+ input).replace(
            opt_side ? (opt_side == 1 ? re_trimLeft : re_trimRight) : re_trim, ''
        ) : '';
    }

    // convert helpers
    function toInt(input, base) {
        return parseInt(trim(input).replace(re_dot, '0.'), base || 10) || 0;
    }
    function toFloat(input) {
        return parseFloat(input) || 0;
    }
    function toString(input) {
        return (''+ (input != NULL ? input : '')); // null/undefined safe
    }
    function toBool(input) {
        return !!input;
    }

    function lower(input) {
        return toString(input).toLowerCase();
    }
    function upper(input) {
        return toString(input).toUpperCase();
    }

    function toMilliseconds(time) {
        var t = time.split(re_time);
        var time = toFloat(t[1]);
        var timeDir = t[2];

        switch (timeDir) {
            case 's': case 'sec': time *= 1000; break;
            case 'm': case 'min': time *= 1000 * 60; break;
            case 'h': case 'hour': time *= 1000 * 60 * 60; break;
        }

        return time;
    }

    // cacheable regexp stuff with ttl (for gc)
    function toRegExp(pattern, flags, ttl, opt_esc) {
        if (!pattern) {
            throw ('Pattern required!');
        }

        flags = flags || '';
        if (flags && isInt(flags)) {
            ttl = flags, flags = '';
        }

        if (opt_esc && !isRegExp(pattern)) { // escape
            pattern = toRegExpEsc(pattern);
        }

        if (!ttl) { // no cache
            return new RegExp(pattern, flags);
        }

        if (isString(ttl)) {
            ttl = toMilliseconds(ttl);
        }
        ttl = (ttl >= 0) ? ttl : 60000; // 1min

        var i = pattern + flags;
        var ret = _reCache[i] || new RegExp(pattern, flags);

        // simple gc
        $.fire(ttl, function(){ delete _reCache[i] });

        return ret;
    }

    function toRegExpEsc(input) {
        // @note slash (/) is escaped already by RegExp
        return toString(input).replace(/[.*+?^$|{}()\[\]\\]/g, '\\$&');
    }

    // safer length getter
    function len(input) {
        return (input && input[NAME_LENGTH]);
    }

    var _id = 0;
    var _break = 0; // loop breaker (for, forEach, each)
    var fn_slice = [].slice;
    var fn_toString = {}.toString;

    // array maker
    function makeArray(input, begin, end) {
        var ret = [];

        if (!input || isString(input) || isWindow(input)
                   || input[NAME_NODE_TYPE] || input[NAME_LENGTH] == NULL) {
            ret = [input];
        } else {
            ret = fn_slice.call(input, begin, end);
        }

        return ret;
    }

    // object mix/extend
    function extend() {
        var args = makeArray(arguments), source, target = args.shift() || {}, k;

        while (len(args)) {
            source = args.shift();
            if (isObject(source, TRUE)) {
                for (k in source) {
                    if (source.hasOwnProperty(k)) {
                        target[k] = source[k];
                    }
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
     * @param  {Bool}         opt_useKey?
     * @param  {Bool}         opt_useLen?
     * @return {Array|Object}
     * @private
     */
    function loop(input, fn, _this, opt_useKey, opt_useLen) {
        var _this = _this || input, inputLen = len(input), i = 0, key, value;

        if (inputLen && opt_useLen) {
            while (i < inputLen) {
                value = input[i];
                if (_break === fn.apply(_this, !opt_useKey ?
                        [value, i++] /* for */ : [i, value, i++] /* forEach */)) {
                    break;
                }
            }
        } else {
            for (key in input) {
                if (input.hasOwnProperty(key)) {
                    value = input[key];
                    if (_break === fn.apply(_this, !opt_useKey ?
                            [value, i++] /* for */ : [key, value, i++] /* forEach */)) {
                        break;
                    }
                }
            }
        }

        return _this;
    }


    // so: each, for, forEach
    extend($, {
        /**
         * Each: (value, i), (key, value, i)
         * @see loop()
         */
        each: function(input, fn, _this, opt_useKey, opt_useLen) {
            return loop(input, fn, _this, opt_useKey, opt_useLen);
        },

        /**
         * For: (value, i)
         * @see loop()
         */
        for: function(input, fn, _this, opt_useLen) {
            return loop(input, fn, _this, FALSE, opt_useLen);
        },

        /**
         * For each: (key, value, i)
         * @see loop()
         */
        forEach: function(input, fn, _this, opt_useLen) {
            return loop(input, fn, _this, TRUE, opt_useLen);
        }
    });

    // checkers
    function isNull(input) {
        return (input === NULL);
    }
    function isNulls(input) {
        return (input === '');
    }
    function isDefined(input) {
        return (input !== UNDEFINED);
    }
    function isUndefined(input) {
        return (input === UNDEFINED);
    }
    function isNumber(input) {
        return (typeof input == 'number');
    }
    function isNumeric(input) {
        return isNumber(input) || re_numeric.test(input);
    }
    function isInt(input) {
        return isNumber(input) && (input === (input | 0));
    }
    function isFloat(input) {
        return isNumber(input) && (input !== (input | 0));
    }
    function isString(input) {
        return (typeof input == 'string' || toBool(input && input.constructor == String));
    }
    function isRegExp(input) {
        return toBool(input && input.constructor == RegExp);
    }
    function isFunction(input) {
        return (typeof input == 'function');
    }
    function isArray(input) {
        return Array.isArray(input);
    }
    function isObject(input, opt_typeOnly) {
        return toBool(input && !opt_typeOnly ? input.constructor == Object
                                             : typeof input == 'object');
    }
    function isWindow(input) {
        return toBool(input && input == input[NAME_WINDOW]
                            && input == input[NAME_WINDOW][NAME_WINDOW] /* window.window.window... */);
    }
    function isDocument(input) {
        return toBool(input && input[NAME_NODE_TYPE] === 9);
    }

    // so: type functions.
    extend($, {
        /** Is void. @param {Any} input @return {Bool} */
        isVoid: function(input) {
            return isVoid(input);
        },

        /** Is null. @param {Any} input @return {Bool} */
        isNull: function(input) {
            return isNull(input);
        },

        /** Is nulls. @param {Any} input @return {Bool} */
        isNulls: function(input) {
            return isNulls(input);
        },

        /** Is defined. @param {Any} input @return {Bool} */
        isDefined: function(input) {
            return isDefined(input);
        },

        /** Is undefined. @param {Any} input @return {Bool} */
        isUndefined: function(input) {
            return isUndefined(input);
        },

        /** Is number. @param {Any} input @return {Bool} */
        isNumber: function(input) {
            return isNumber(input);
        },

        /** Is numeric. @param {Any} input @return {Bool} */
        isNumeric: function(input) {
            return isNumeric(input);
        },

        /** Is int. @param {Any} input @return {Bool} */
        isInt: function(input) {
            return isInt(input);
        },

        /** Is float. @param {Any} input @return {Bool} */
        isFloat: function(input) {
            return isFloat(input);
        },

        /** Is string. @param {Any} input @return {Bool} */
        isString: function(input) {
            return isString(input);
        },

        /** Is bool. @param {Any} input @return {Bool} */
        isBool: function(input) {
            return (input === TRUE || input === FALSE);
        },

        /** Is true. @param {Any} input @return {Bool} */
        isTrue: function(input) {
            return (input === TRUE);
        },

        /** Is false. @param {Any} input @return {Bool} */
        isFalse: function(input) {
            return (input === FALSE);
        },

        /** Is RegExp. @param {Any} input @return {Bool} */
        isRegExp: function(input) {
            return isRegExp(input);
        },

        /** Is function. @param {Any} input @return {Bool} */
        isFunction: function(input) {
            return isFunction(input);
        },

        /** Is array. @param {Any} input @return {Bool} */
        isArray: function(input) {
            return isArray(input);
        },

        /** Is object. @param {Any} input @param {Bool} opt_typeOnly? @return {Bool} */
        isObject: function(input, opt_typeOnly) {
            return isObject(input, opt_typeOnly);
        },

        /** Is iterable. @param {Any} input @return {Bool} */
        isIterable: function(input) {
            return isArray(input) || isObject(input) || toBool(input && (
                input[NAME_LENGTH] != NULL && !input[NAME_NODE_TYPE] // dom, nodelist, string etc.
            ));
        },

        /** Is primitive. @param {Any} input @return {Bool} */
        isPrimitive: function(input) {
            return isVoid(input) || re_primitive.test(typeof input);
        },

        /** Is window. @param {Any} input @return {Bool} */
        isWindow: function(input) {
            return isWindow(input);
        },

        /** Is document. @param {Any} input @return {Bool} */
        isDocument: function(input) {
            return isDocument(input);
        }
    });

    /**
     * Object keys & values.
     * @param  {Object} object
     * @return {Array}
     */
    Object.keys = Object.keys || function(object, ret /* @internal */) {
        return (ret = []), $.forEach(object, function(key) { ret.push(key) }), ret;
    };
    Object.values = Object.values || function(object, ret /* @internal */) {
        return (ret = []), $.forEach(object, function(_, value) { ret.push(value) }), ret;
    };

    // equal comparator
    function equals(a, b, opt_sort, opt_deep /* @todo? */) {
        if (a === b) return TRUE;

        if (isArray(a) && isArray(b)) {
            if (len(a) !== len(b)) return FALSE;
            if (opt_sort) {
                // make copies (do not modify original inputs)
                a = makeArray(a).sort(), b = makeArray(b).sort();
            }
            for (var i = 0, il = len(a); i < il; i++) {
                if (a[i] !== b[i]) return FALSE;
            }
            return TRUE;
        }

        return FALSE;
    }

    /**
     * Object.equals() for String, Number, Array etc. objects.
     */
    Object.defineProperty(Object[NAME_PROTOTYPE], 'equals', {
        value: function() {
            return equals.apply(NULL, $.array(this, arguments));
        },
        writable: TRUE // allow override if needed
    });

    // shortcuts
    function index(s, stack, opt_last) {
        return stack && (
            isRegExp(s) ? stack.search(s)
                : (!opt_last ? stack.indexOf(s) : stack.lastIndexOf(s))
        );
    }

    function has(s, stack, opt_strict) {
        var ret;

        if (isNulls(s) || isNulls(stack)) { // fix empty stuff issue
            ret = -1;
        } else if (isString(stack)) {
            ret = index(s, stack);
        } else if (isArray(stack)) {
            ret = index(s, stack);
        } else if (isObject(stack)) {
            $.for(stack, function(value, i) {
                if (opt_strict ? value === s : value == s) {
                    return (ret = i), _break;
                }
            });
        }

        return (ret > -1);
    }

    function toUniqUnuniq(array, opt_ununiq) {
        return opt_ununiq
            ? array.filter(function(el, i, array) { return index(el, array) !== i; })
            : array.filter(function(el, i, array) { return index(el, array) === i; });
    }

    /**
     * Array extends.
     */
    extend(Array[NAME_PROTOTYPE], {
        /**
         * Len.
         * @return {Int}
         */
        len: function() {
            return len(this);
        },

        /**
         * Has.
         * @param  {Any}  src
         * @param  {Bool} opt_strict?
         * @return {Bool}
         */
        has: function(src, opt_strict) {
            return has(src, this, opt_strict);
        },

        /**
         * Index.
         * @param  {Any} src
         * @return {Int|null}
         */
        index: function(src) {
            var ret = index(src, this);

            return (ret > -1) ? ret : NULL;
        },

        /**
         * Equals.
         * @param  {Array} input
         * @return {Bool}
         */
        // equals: function(input, opt_sort) {
        //     return equals(this, input, opt_sort);
        // },

        /**
         * Each.
         * @param  {Function} fn
         * @return {Array}
         */
        each: function(fn) {
            return loop(this, fn, this, FALSE, TRUE);
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
            return this[len(this) - 1];
        },

        /**
         * Uniq.
         * @return {Array}
         */
        uniq: function() {
            return toUniqUnuniq(this);
        },

        /**
         * Ununiq.
         * @return {Array}
         */
        ununiq: function() {
            return toUniqUnuniq(this, TRUE);
        },

        /**
         * Filter.
         * @param  {Function} fn
         * @return {Array}
         * @override
         */
        filter: function(fn) {
            // prevent: "undefined isn't a function" error
            fn = fn || function(value) { return trim(value) };

            var _this = this, ret = [];

            _this.each(function(value, i) {
                if (fn(value, i, _this)) {
                    ret.push(value);
                }
            });

            return ret;
        },

        /**
         * Rand.
         * @return {Any}
         * @source https://stackoverflow.com/a/23976260/362780
         */
        rand: function() {
            return this[~~(len(this) * Math.random())];
        },

        /**
         * Extract.
         * @param  {String} ...arguments
         * @return {Object}
         */
        extract: function() {
            var keys = makeArray(arguments), values = {};

            $.for(keys, function(key, i) {
                // [1,2,3].extract('one', '', 'three') => {one: 1, three: 3}
                key && (values[key] = this[i]);
            }, this);

            return values;
        }
    });

    // string helpers
    function prepareTrimRegExp(chars, opt_noCase, opt_side) {
        return toRegExp((opt_side == 1 ? '^%s+' : '%s+$').format(
            '('+ chars.split('').uniq().map(toRegExpEsc).join('|') +')'
        ), opt_noCase ? 'i' : '');
    }
    function prepareSearchRegExp(src, opt_noCase, opt_side, opt_esc) {
        return toRegExp((!opt_side ? '%s' : opt_side == 1 ? '^%s' : '%s$').format(
            opt_esc ? toRegExpEsc(src): src
        ), opt_noCase ? 'i' : '');
    }

    /**
     * String extends.
     */
    extend(String[NAME_PROTOTYPE], {
        /**
         * Len.
         * @return {Int}
         */
        len: function() {
            return len(this);
        },

        /**
         * Has.
         * @param  {Any}  src
         * @param  {Bool} opt_strict?
         * @return {Bool}
         */
        has: function(src, opt_strict) {
            return has(src, this, opt_strict);
        },

        /**
         * Index.
         * @param  {String|RegExp} src
         * @return {Int|null}
         */
        index: function(src) {
            var ret = index(src, this);

            return (ret > -1) ? ret : NULL;
        },

        /**
         * Equals.
         * @param  {String} input
         * @return {Bool}
         */
        // equals: function(input) {
        //     return equals(this, input);
        // },

        /**
         * Is numeric.
         * @return {Bool}
         */
        isNumeric: function() {
            return isNumeric(this);
        },

        /**
         * To int.
         * @param  {Int} base?
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
         * To number.
         * @return {Number}
         */
        toNumber: function() {
            return Number(this);
        },

        /**
         * To reg exp.
         * @param  {String} flags?
         * @param  {int}    ttl?
         * @param  {Bool}   opt_esc?
         * @return {RegExp}
         */
        toRegExp: function(flags, ttl, opt_esc) {
            return toRegExp(this, flags, ttl, opt_esc);
        },

        /**
         * Lower.
         * @return {String}
         */
        lower: function() {
            return lower(this);
        },

        /**
         * Upper.
         * @return {String}
         */
        upper: function() {
            return upper(this);
        },

        /**
         * To camel case.
         * @param  {String|RegExp} separator
         * @return {String}
         */
        toCamelCase: function(separator) {
            var s = this, ss;

            if (s) { // prevent empty string craps
                ss = s.split(separator || ' ');
                s = ss[0].lower() + ss.slice(1).map(function(s) {
                    return s.lower().toCapitalCase();
                }).join('');
            }

            return s;
        },

        /**
         * To capital case.
         * @param  {Bool} opt_all?
         * @param  {Bool} opt_lower?
         * @return {String}
         */
        toCapitalCase: function(opt_all, opt_lower) {
            var s = this, i, il;

            if (s) { // prevent empty string craps
                opt_lower && (s = lower(s));
                if (opt_all) {
                    for (i = 0, s = s.split(' '), il = len(s); i < il; i++) {
                        s[i] = s[i].toCapitalCase(FALSE);
                    }
                    s = s.join(' ');
                } else {
                    s = upper(s[0]) + s.slice(1);
                }
            }

            return s;
        },

        /**
         * Strip (alias of trim() without opt_noCase).
         * @param  {String} chars?
         * @return {String}
         */
        strip: function(chars) {
            return this.trim(chars);
        },

        /**
         * Splits.
         * @param  {String|RegExp} separator
         * @param  {Int}           limit?
         * @return {Array}
         */
        splits: function(separator, limit) {
            var s = this.split(separator);

            if (limit) {
                var slice = s.slice(limit - 1); // rest
                s = s.slice(0, limit - 1);
                if (len(slice)) {
                    s = s.concat(slice.join(separator));
                }
            }

            return s;
        },

        /**
         * Slice at.
         * @param  {String|RegExp} src
         * @param  {Int}           limit?
         * @return {String}
         */
        sliceAt: function(src, limit) {
            return (this.splits(src, 2)[0] || '').slice(0, limit);
        },

        /**
         * Slice from.
         * @param  {String|RegExp} src
         * @param  {Int}           limit?
         * @return {String}
         */
        sliceFrom: function(src, limit) {
            return (this.splits(src, 2)[1] || '').slice(0, limit);
        },

        /**
         * Format.
         * @param  {Any} ...arguments
         * @return {String}
         */
        format: function() {
            var s = this, args = arguments, i = 0, match = s.match(/(%s)/g) || [];

            if (len(args) < len(match)) {
                $.logWarn('No enough arguments for format().');
            }

            while (match.shift()) {
                s = s.replace(/(%s)/, args[i++]);
            }

            return s;
        },

        /**
         * Test.
         * @param  {RegExp|String} re
         * @return {Bool}
         */
        test: function(re) {
            if (!isRegExp(re)) {
                re = toRegExp(re);
            }

            return re.test(this);
        },

        /**
         * Grep.
         * @param  {RegExp} re
         * @param  {Int}    i?
         * @return {String|null}
         */
        grep: function(re, i) {
            var ret = this.grepAll(re);

            return ret ? ret[0][i | 0] : NULL;
        },

        /**
         * Grep all.
         * @param  {RegExp} re
         * @param  {Int}    i?
         * @return {Array|null}
         */
        grepAll: function(re, i) {
            var re = this.matchAll(re), ret = NULL;

            if (re) {
                ret = [];
                while (len(re)) {
                    ret.push(re.shift().filter(function(value, i) {
                        // skip 0 index & nones
                        return (i && !isVoid(value));
                    }));
                }

                if (!isVoid(i)) {
                    return ret[i | 0];
                }
            }

            return ret;
        },

        /**
         * Match all.
         * @param  {RegExp} pattern
         * @return {Array|null}
         */
        matchAll: function(pattern) {
            var source = pattern.source;
            var flags = pattern.flags;
            var r, re, ret = [], slashIndex;

            if (isVoid(flags)) { // hellö ie.. ?}/=%&'|#)"^*1...!
                slashIndex = index('/', (pattern = toString(pattern)), TRUE)
                source = pattern.slice(1, slashIndex);
                flags = pattern.slice(slashIndex + 1);
            }

            // never forget or lost in infinite loops..
            if (!flags.has('g')) {
                flags += 'g';
            }

            re = toRegExp(source, flags);
            while (r = re.exec(this)) {
                ret.push(r);
            }

            return len(ret) ? ret : NULL;
        },

        /**
         * Remove.
         * @param  {String} searchValue
         * @return {String}
         */
        remove: function(searchValue) {
            return this.replace(toRegExp(searchValue, NULL, NULL, TRUE), '');
        },

        /**
         * Remove all.
         * @param  {String} searchValue
         * @return {String}
         */
        removeAll: function(searchValue) {
            return this.replace(toRegExp(searchValue, 'g', NULL, TRUE), '');
        },

        /**
         * Replace all.
         * @param  {String} searchValue
         * @param  {String} replaceValue
         * @return {String}
         */
        replaceAll: function(searchValue, replaceValue) {
            return this.replace(toRegExp(searchValue, 'g', NULL, TRUE), replaceValue);
        },

        /**
         * Translate.
         * @param  {Object} charMap
         * @return {String}
         */
        translate: function(charMap) {
            var s = this, i = 0, c;

            while (c = s[i++]) {
                if (c in charMap) {
                    s = s.replace(c, charMap[c]);
                }
            }

            return s;
        },

        /**
         * Trim.
         * @param  {String} chars?
         * @param  {Bool}   opt_noCase?
         * @return {String}
         * @override For chars option.
         */
        trim: function(chars, opt_noCase, s /* @internal */) {
            return (s = this), !chars ? trim(s)
                : s.trimLeft(chars, opt_noCase).trimRight(chars, opt_noCase);
        },

        /**
         * Trim left.
         * @param  {String} chars?
         * @param  {Bool}   opt_noCase?
         * @return {String}
         * @override For chars option.
         */
        trimLeft: function(chars, opt_noCase) {
            var s = this, re;
            if (!chars) return trim(s, 1);

            re = prepareTrimRegExp(chars, opt_noCase, 1);
            while (re.test(s)) {
                s = s.replace(re, '');
            }

            return s;
        },

        /**
         * Trim right.
         * @param  {String} chars?
         * @param  {Bool}   opt_noCase?
         * @return {String}
         * @override For chars option.
         */
        trimRight: function(chars, opt_noCase) {
            var s = this, re;
            if (!chars) return trim(s, 2);

            re = prepareTrimRegExp(chars, opt_noCase, 2);
            while (re.test(s)) {
                s = s.replace(re, '');
            }

            return s;
        },

        /**
         * Contains.
         * @param  {String} src
         * @param  {Int}    offset?
         * @param  {Bool}   opt_noCase?
         * @return {Bool}
         */
        contains: function(src, offset, opt_noCase) {
            return this.slice(offset).test(prepareSearchRegExp(src, opt_noCase, NULL, TRUE));
        },

        /**
         * Contains any.
         * @param  {String|Array} chars
         * @param  {Int}          offset?
         * @param  {Bool}         opt_noCase?
         * @return {Bool}
         */
        containsAny: function(chars, offset, opt_noCase) {
            return this.slice(offset).test(prepareSearchRegExp('('+ (
                isString(chars) ? chars.split('') : chars // array
            ).uniq().map(toRegExpEsc).join('|') +')', opt_noCase));
        },

        /**
         * Starts with.
         * @param  {String} src
         * @param  {Int}    offset?
         * @param  {Bool}   opt_noCase?
         * @return {Bool}
         * @override For no-case option.
         */
        startsWith: function(src, offset, opt_noCase) {
            return this.slice(offset).test(prepareSearchRegExp(src, opt_noCase, 1, TRUE));
        },

        /**
         * Ends with.
         * @param  {String} src
         * @param  {Int}    offset?
         * @param  {Bool}   opt_noCase?
         * @return {Bool}
         * @override For no-case option.
         */
        endsWith: function(src, offset, opt_noCase) {
            return this.slice(offset).test(prepareSearchRegExp(src, opt_noCase, 2, TRUE));
        }
    });

    // /**
    //  * Number extends.
    //  */
    // extend(Number[NAME_PROTOTYPE], {
    //     /**
    //      * Equals.
    //      * @param  {Number} input
    //      * @return {Bool}
    //      */
    //     equals: function(input) {
    //         return equals(this, input);
    //     }
    // });

    // /**
    //  * Boolean extends.
    //  */
    // extend(Boolean[NAME_PROTOTYPE], {
    //     /**
    //      * To int.
    //      * @return {Int}
    //      */
    //     toInt = function() { return this | 0; }
    //
    //     /**
    //      * To value.
    //      * @return {String}
    //      */
    //     toValue = function() { return this ? '1' : ''; }
    // });

    // so: base functions.
    extend($, {
        /**
         * Debug tools.
         * @return {void}
         */
        log: function() { consoleBind('log', arguments); },
        logInfo: function() { consoleBind('info', arguments); },
        logWarn: function() { consoleBind('warn', arguments); },
        logError: function() { consoleBind('error', arguments); },

        /**
         * Fn.
         * @return {Function}
         */
        fn: function() {
            return function() {};
        },

        /**
         * Now.
         * @param  {Bool} opt_unix?
         * @return {Int}
         */
        now: function(opt_unix) {
            return !opt_unix ? Date.now() : Math.round(Date.now() / 1000);
        },

        /**
         * Id.
         * @return {Int}
         */
        id: function() {
            return ++_id;
        },

        /**
         * Rid (random id).
         * @return {String}
         */
        rid: function() {
            return $.now() + Math.random().toFixed(7).slice(2);
        },

        /**
         * Re.
         * @param  {String}  pattern
         * @param  {String}  flags?
         * @param  {Int}     ttl?
         * @param  {Bool}    opt_esc?
         * @return {RegExp}
         */
        re: function(pattern, flags, ttl, opt_esc) {
            return toRegExp(pattern, flags, ttl, opt_esc);
        },

        /**
         * Re esc.
         * @param  {String} input
         * @return {String}
         */
        reEsc: function(input) {
            return toRegExpEsc(input);
        },

        /**
         * Len.
         * @param  {Any} input
         * @return {Int|undefined}
         */
        len: function(input) {
            return len(input);
        },

        /**
         * Fire & ifire.
         * @param  {Int|String} delay (ms)
         * @param  {Function}   fn
         * @param  {Array}      fnArgs?
         * @return {Int}
         */
        fire: function(delay, fn, fnArgs) {
            if (isString(delay)) {
                delay = toMilliseconds(delay);
            }

            return setTimeout(function() {
                fn.apply(NULL, fnArgs || []);
            }, delay || 1);
        },
        ifire: function(delay, fn, fnArgs) {
            if (isString(delay)) {
                delay = toMilliseconds(delay);
            }

            return setInterval(function() {
                fn.apply(NULL, fnArgs || []);
            }, delay || 1);
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
            if (isArray(input) || isObject(input)) {
                var keys = trim(key).split('.');

                key = keys.shift();
                if (!len(keys)) {
                    return input[key];
                }

                // keep searching with recursion
                return $.dig(input[key], keys.join('.'));
            }
        },

        /**
         * Type of.
         * @param  {Any} x
         * @return {String}
         */
        type: function(x) {
            return isNull(x)      ? 'null'
                 : isUndefined(x) ? 'undefined'
                 : isWindow(x)    ? NAME_WINDOW
                 : isDocument(x)  ? NAME_DOCUMENT
                 : lower(fn_toString.call(x).slice(8, -1));
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

        /**
         * In.
         * @param  {Any}          src
         * @param  {Array|String} stack
         * @return {Bool}
         */
        in: function(src, stack) {
            return index(src, stack) > -1;
        },

        /**
         * Has.
         * @param  {Any}  src
         * @param  {Any}  stack
         * @param  {Bool} opt_strict?
         * @return {Bool}
         */
        has: function(src, stack, opt_strict) {
            return has(src, stack, opt_strict);
        },

        /**
         * Empty.
         * @param  {Any} input
         * @return {Bool}
         */
        empty: function(input) {
            return toBool(!input // '', null, undefined, false, 0, -0, NaN
                || (isNumber(input[NAME_LENGTH]) && !len(input))
                || (isObject(input) && !len(Object.keys(input)))
            );
        },

        /**
         * Mix.
         * @param  {Object} ...arguments
         * @return {Object}
         */
        mix: function() {
            return extend.apply(NULL, [{}].concat(makeArray(arguments)));
        },

        /**
         * Extend.
         * @param  {Object} target
         * @param  {Object} source
         * @return {Object}
         */
        extend: function(target, source) {
            return extend.apply(NULL, [target, source].concat(makeArray(arguments, 2)));
        },

        /**
         * Options.
         * @param  {Object} optionsDefault
         * @param  {Object} options
         * @return {Object}
         */
        options: function(optionsDefault, options) {
            return $.extend({}, optionsDefault, options);
        },

        /**
         * Equals.
         * @param  {Any} a
         * @param  {Any} b
         * @param  {Bool} opt_sort?
         * @param  {Bool} opt_deep?
         * @return {Bool}
         */
        equals: function(a, b, opt_sort, opt_deep) {
            return equals(a, b, opt_sort, opt_deep);
        },

        /**
         * Array.
         * @param  {Object} ...arguments
         * @return {Array}
         */
        array: function() {
            var ret = [], args = arguments, argsLen = len(args), i = 0;

            while (i < argsLen) {
                ret = ret.concat(makeArray(args[i++]));
            }

            return ret;
        },

        /**
         * Win,Doc (alias of getWindow(),getDocument())
         */
        win: function(x) {
            return $.getWindow(x);
        },
        doc: function(x) {
            return $.getDocument(x);
        },

        /**
         * Get window.
         * @param  {Any} x
         * @return {Window}
         */
        getWindow: function(x) {
            if (!x)                     return $win;
            if (x[NAME_OWNER_DOCUMENT]) return x[NAME_OWNER_DOCUMENT][NAME_DEFAULT_VIEW];
            if (isWindow(x))            return x;
            if (isDocument(x))          return x[NAME_DEFAULT_VIEW];
        },

        /**
         * Get document.
         * @param  {Any} x
         * @return {Document}
         */
        getDocument: function(x) {
            if (!x)                     return $win[NAME_DOCUMENT];
            if (x[NAME_OWNER_DOCUMENT]) return x[NAME_OWNER_DOCUMENT]; // node
            if (isDocument(x))          return x;
            if (isWindow(x))            return x[NAME_DOCUMENT];
        }
    });

    var readyCallbacks = [];
    var readyCallbacksFire = function() {
        while (len(readyCallbacks)) {
            readyCallbacks.shift()($, $.dom /* will be ready on call time */);
        }
    };

    /**
     * Oh baby..
     * @param  {Function} callback
     * @param  {Document} document?
     * @return {none}
     */
    $.ready = $.onReady = function(callback, document) {
        if (isFunction(callback)) {
            readyCallbacks.push(callback);
        }

        // iframe support
        document = document || $win[NAME_DOCUMENT];

        var type = 'DOMContentLoaded';
        document.addEventListener(type, function _() {
            document.removeEventListener(type, _, FALSE);
            readyCallbacksFire();
        }, FALSE);
    };

    // for later
    $.ext = {};

})(window, null, true, false);
