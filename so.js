/**
 * @package so
 * @object  so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, NULL, TRUE, FALSE, UNDEFINED) { 'use strict';

    // simply support check
    if (!''.trim) {
        throw ('Archaic browser!');
    }

    /**
     * So.
     * @param  {String|Object|Function} a
     * @param  {Object}                 b?
     * @return {Object}
     */
    function $(a, b) {
        return isFunction(a) ? $.ready(a, b) /* (callback, document?) */ : $.dom(a, b) /* (selector, root?) */
    }

    // minify candies
    var NAME_WINDOW = 'window', NAME_DOCUMENT = 'document';
    var NAME_NODE_TYPE = 'nodeType', NAME_PROTOTYPE = 'prototype';
    var NAME_DEFAULT_VIEW = 'defaultView', NAME_OWNER_DOCUMENT = 'ownerDocument';
    var NAME_LENGTH = 'length';
    var Array = window.Array, Object = window.Object;
    var String = window.String, Number = window.Number;
    var Date = window.Date, RegExp = window.RegExp, Math = window.Math;

    // globals
    window.so = $;
    window.so.VERSION = '5.74.0';
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
        return (input == NULL);
    }

    // faster trim for space only
    function trim(input, opt_side) {
        return !isVoid(input) ? (''+ input).replace(
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
        return (''+ input);
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
        // @note slash (/) is escaped already
        return toString(input).replace(/[.*+?^$|{}()\[\]\\]/g, '\\$&');
    }

    // safer length getter
    function len(input) {
        return input && input[NAME_LENGTH];
    }

    /**
     * Extend.
     * @param  {Object} ...arguments
     * @return {Object}
     * @private
     */
    function extend() {
        var name, source, args = arguments, target = args[0] || {}, i = 1;

        while (source = args[i++]) {
            for (name in source) {
                if (source.hasOwnProperty(name)) {
                    target[name] = source[name];
                }
            }
        }

        return target;
    }

    // loop breaker (for, forEach)
    var _break = 0;

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


    // so: for, forEach
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
         * For each: (key => value, i)
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
    function isObject(input) {
        return toBool(input && (input.constructor == Object));
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

        /** Is object. @param {Any} input @return {Bool} */
        isObject: function(input) {
            return isObject(input);
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

    // shortcuts
    function has(input, search, opt_strict) {
        var ret;

        if (isString(input)) {
            ret = isNulls(search) ? -1 // fix empty search issue
                : isRegExp(search) ? input.search(search) : input.indexOf(search); // simply
        } else if (isArray(input) || isObject(input)) {
            $.for(input, function(value, i) {
                if (opt_strict ? value === search : value == search) {
                    return (ret = i), _break;
                }
            });
        }

        return ret > -1;
    }

    function equals(a, b, opt_sort, opt_deep /* @todo */) {
        if (a === b) return TRUE;

        if (isArray(a) && isArray(b)) {
            if (len(a) !== len(b)) return FALSE;
            if (opt_sort) {
                // make copies (do not modify original inputs)
                a = makeArray(a).sort(), makeArray(b).sort();
            }
            for (var i = 0, il = len(a); i < il; i++) {
                if (a[i] !== b[i]) return FALSE;
            }
            return TRUE;
        }

        return FALSE;
    }

    function toUniqUnuniq(array, opt_ununiq) {
        return opt_ununiq
            ? array.filter(function(el, i, _array) { return _array.indexOf(el) != i; })
            : array.filter(function(el, i, _array) { return _array.indexOf(el) == i; });
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
         * @param  {Any}  search
         * @param  {Bool} opt_strict?
         * @return {Bool}
         */
        has: function(search, opt_strict) {
            return has(this, search, opt_strict);
        },

        /**
         * Equals.
         * @param  {Array} input
         * @return {Bool}
         */
        equals: function(input, opt_sort) {
            return equals(this, input, opt_sort);
        },

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
            // prevent: undefined is not a function
            fn = fn || function(el) { return trim(el) };

            var _this = this, ret = [];

            _this.each(function(el, i) {
                fn(el, i, _this) && ret.push(el);
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
            chars.split('').uniq().map(toRegExpEsc).join('|').wrap(['(', ')'])
        ), opt_noCase ? 'i' : '');
    }
    function prepareSearchRegExp(search, opt_noCase, opt_side, opt_esc) {
        return toRegExp((!opt_side ? '%s' : opt_side == 1 ? '^%s' : '%s$').format(
            opt_esc ? toRegExpEsc(search): search
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
         * @param  {Any}  search
         * @param  {Bool} opt_strict?
         * @return {Bool}
         */
        has: function(search, opt_strict) {
            return has(this, search, opt_strict);
        },

        /**
         * Equals.
         * @param  {String} input
         * @return {Bool}
         */
        equals: function(input) {
            return equals(this, input);
        },

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
         * Splits.
         * @param  {String} separator
         * @param  {Int}    limit?
         * @return {Array}
         */
        splits: function(separator, limit) {
            var s = this.split(separator);

            if (limit) {
                var sRest = s.slice(limit - 1);
                s = s.slice(0, limit - 1);
                if (len(sRest)) {
                    s = s.concat(sRest.join(separator));
                }
            }

            return s;
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

            return ret ? ret[i | 0] : NULL;
        },

        /**
         * Grep all.
         * @param  {RegExp} re
         * @return {Array|null}
         */
        grepAll: function(re) {
            var r = this.matchAll(re), ret = NULL;

            if (r) {
                ret = [];
                while (len(r)) {
                    ret.push(r.shift().filter(function(value, i) {
                        // skip 0 index & or (|) ops' undefined
                        return (i && value != NULL);
                    })[0]);
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
            var r, re, ret = [], slashPos;

            if (!flags) { // hellö ie.. ?}/=%&'|#)"^*1...!
                slashPos = (pattern = toString(pattern)).pos('/', TRUE);
                source = pattern.sub(1, slashPos);
                flags = pattern.sub(slashPos + 1);
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
         * Wrap.
         * @param  {String|Array} input
         * @return {String}
         */
        wrap: function(input, s /* @internal */) {
            return (s = this), isString(input) ? input + s + input : input[0] + s + input[1];
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
         * Pos.
         * @param  {String} search
         * @param  {Bool}   opt_last?
         * @return {Int}
         */
        pos: function(search, opt_last) {
            var s = this, ret = -1;

            if (!isNulls(search)) { // fix empty search issue
                ret = !opt_last ? s.indexOf(search) : s.lastIndexOf(search);
            }

            return ret;
        },

        /**
         * Sub.
         * @param  {Int} start?
         * @param  {Int} end?
         * @return {String}
         */
        sub: function(start, end) {
            var s = this;
            if (start < 0) {
                start = len(s) + start; // eg: 'Kerem'.(-3) => 'rem', not 'Kerem'
            } else {
                end = end > 0 ? end : len(s) + (end | 0); // eg: 'Kerem'.(1, -2) => 'er', not 'K'
            }

            return s.substring(start, end);
        },

        /**
         * Contains.
         * @param  {String} search
         * @param  {Int}    offset?
         * @param  {Bool}   opt_noCase?
         * @return {Bool}
         */
        contains: function(search, offset, opt_noCase) {
            return this.sub(offset).test(prepareSearchRegExp(search, opt_noCase, NULL, TRUE));
        },

        /**
         * Contains any.
         * @param  {String|Array} chars
         * @param  {Int}          offset?
         * @param  {Bool}         opt_noCase?
         * @return {Bool}
         */
        containsAny: function(chars, offset, opt_noCase) {
            return this.sub(offset).test(prepareSearchRegExp((
                isString(chars) ? chars.split('') : chars // array
            ).uniq().map(toRegExpEsc).join('|').wrap(['(', ')']), opt_noCase));
        },

        /**
         * Starts with.
         * @param  {String} search
         * @param  {Int}    offset?
         * @param  {Bool}   opt_noCase?
         * @return {Bool}
         * @override For no-case option.
         */
        startsWith: function(search, offset, opt_noCase) {
            return this.sub(offset).test(prepareSearchRegExp(search, opt_noCase, 1, TRUE));
        },

        /**
         * Ends with.
         * @param  {String} search
         * @param  {Int}    offset?
         * @param  {Bool}   opt_noCase?
         * @return {Bool}
         * @override For no-case option.
         */
        endsWith: function(search, offset, opt_noCase) {
            return this.sub(offset).test(prepareSearchRegExp(search, opt_noCase, 2, TRUE));
        }
    });

    /**
     * Number extends.
     */
    extend(Number[NAME_PROTOTYPE], {
        /**
         * Equals.
         * @param  {Number} input
         * @return {Bool}
         */
        equals: function(input) {
            return equals(this, input);
        }
    });

    var _id = 0;
    var fn_slice = [].slice;
    var fn_toString = {}.toString;

    // array maker
    function makeArray(input, begin, end) {
        var ret = [], inputType = $.type(input);

        if (!input || inputType == 'string' || inputType == 'window'
            || input[NAME_NODE_TYPE] || isVoid(input[NAME_LENGTH])) {
            ret = [input];
        } else {
            ret = fn_slice.call(input, begin, end);
        }

        return ret;
    }

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
         * @return {Int|null|undefined}
         */
        len: function(input) {
            return len(input);
        },

        /**
         * Fire & ifire.
         * @param  {Int|String} delay (ms)
         * @param  {Function}   fn
         * @param  {Array}      fnArgs?
         * @return {void}
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
         * Get window.
         * @param  {Any} object
         * @return {Window}
         */
        getWindow: function(object) {
            if (!object)                     return window;
            if (object[NAME_OWNER_DOCUMENT]) return object[NAME_OWNER_DOCUMENT][NAME_DEFAULT_VIEW];
            if (isWindow(object))            return object;
            if (isDocument(object))          return object[NAME_DEFAULT_VIEW];
        },

        /**
         * Get document.
         * @param  {Any} object
         * @return {Document}
         */
        getDocument: function(object) {
            if (!object)                     return window[NAME_DOCUMENT];
            if (object[NAME_OWNER_DOCUMENT]) return object[NAME_OWNER_DOCUMENT]; // node
            if (isDocument(object))          return object;
            if (isWindow(object))            return object[NAME_DOCUMENT];
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
         * @param  {Any} input
         * @return {String}
         */
        type: function(input) {
            return isNull(input) ? 'null'
                : isUndefined(input) ? 'undefined'
                : isWindow(input) ? NAME_WINDOW
                : isDocument(input) ? NAME_DOCUMENT
                : lower(fn_toString.call(input).slice(8, -1));
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
         * @param  {Any}          search
         * @param  {Array|String} input
         * @return {Bool}
         */
        in: function(search, input) {
            return input.indexOf(search) > -1;
        },

        /**
         * Has.
         * @param  {Any}  input
         * @param  {Any}  search
         * @param  {Bool} opt_strict?
         * @return {Bool}
         */
        has: function(input, search, opt_strict) {
            return has(input, search, opt_strict);
        },

        /**
         * Is set.
         * @param  {Any}    input
         * @param  {String} key?
         * @return {Bool}
         */
        isSet: function(input, key) {
            return !isVoid(!isVoid(key) ? $.dig(input, key) : input);
        },

        /**
         * Is empty.
         * @param  {Any} input
         * @return {Bool}
         */
        isEmpty: function(input) {
            return toBool(!input // '', null, undefined, false, 0, -0, NaN
                || (isNumber(input[NAME_LENGTH]) && !len(input))
                || (isObject(input) && !len(Object.keys(input)))
            );
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
         * Options.
         * @param  {Object} optionsDefault
         * @param  {Object} options
         * @return {Object}
         */
        options: function(optionsDefault, options) {
            return $.extend({}, optionsDefault, options);
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
        }
    });

    var readyCallbacks = [];
    var readyCallbacksFire = function() {
        while (len(readyCallbacks)) {
            readyCallbacks.shift()($, $.dom /* will be ready on call */);
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
        document = document || window[NAME_DOCUMENT];

        var type = 'DOMContentLoaded';
        document.addEventListener(type, function _() {
            document.removeEventListener(type, _, FALSE);
            readyCallbacksFire();
        }, FALSE);
    };

    // for later
    $.ext = {};

})(window, null, true, false);
