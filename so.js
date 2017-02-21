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
    var NULL = null, NULLS = '',
        TRUE = true, FALSE = false,

        NAME_WINDOW = 'window',
        NAME_DOCUMENT = 'document',
        NAME_OWNER_DOCUMENT = 'ownerDocument',
        NAME_DEFAULT_VIEW = 'defaultView',
        NAME_PROTOTYPE = 'prototype',
        NAME_NODE_TYPE = 'nodeType',

        NODE_TYPE_ELEMENT = 1,
        NODE_TYPE_DOCUMENT = 9,
        NODE_TYPE_DOCUMENT_FRAGMENT = 11
    ;

    // globals
    window.so = $;
    window.so.VERSION = '5.0.0';
    window.so[NAME_WINDOW] = window;
    window.so[NAME_DOCUMENT] = window[NAME_DOCUMENT];
    window.so.DOMLevel = window[NAME_DOCUMENT].adoptNode ? 3 : 2;

    // shortcut convert helpers
    function toValue(input) {
        return (input != NULL && input.valueOf) ? input.valueOf() : input;
    }
    function toInt(input) {
        return !$.isNumeric(input = toString(input)) ? NULL : parseInt(input.replace(/^-?\./, '0.'));
    }
    function toFloat(input) {
        return !$.isNumeric(input = toString(input)) ? NULL : parseFloat(input);
    }
    function toString(input) {
        return (input != NULL && input.toString) ? input.toString() : (''+ input);
    }
    function toBool(input) {
        return !!toValue(input);
    }

    // re stuff
    var _re_cache = {};

    function toRegExp(pattern, flags, ttl) {
        flags = flags || NULLS;
        if ($.isInt(flags)) {
            ttl = flags, flags = NULLS;
        }

        if (!ttl) { // no cache
            return new RegExp(pattern, flags);
        }

        if ($.isString(ttl)) {
            var s = ttl.split(/(\d+)(\w+)/),
                time = parseInt(s[1]), timeDir = s[2];
            switch (timeDir) {
                case 's': case 'sec': ttl = time; break;
                case 'm': case 'min': ttl = time * 60; break;
            }
        }
        ttl = (ttl > -1) ? ttl : 60 * 60 * 24; // one day

        var i = pattern + (flags || ''), ret = _re_cache[i];
        if (!ret) {
            ret = _re_cache[i] = new RegExp(pattern, flags);
        }

        // simple gc
        $.fire(1000 * ttl, function(){
            _re_cache = {};
        });

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
     * @param  {Object}       opt__this
     * @param  {Boolean}      useKey
     * @return {Array|Object}
     * @private
     */
    function loop(input, fn, opt__this, useKey) {
        var _this = opt__this || input, len = input && input.length, i = 0, key, value;

        if (len != NULL) {
            for (; i < len; i++) {
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
         * For: value, i
         * @inheritDoc
         */
        for: function(input, fn, opt__this) {
            return loop(input, fn, opt__this);
        },
        /**
         * For each: key, value, i
         * @inheritDoc
         */
        forEach: function(input, fn, opt__this) {
            return loop(input, fn, opt__this, TRUE);
        }
    });

    // so: type functions.
    extend($, {
        /** Is void. @param {Any} input @return {Boolean} */
        isVoid: function(input) {
            return (input == NULL);
        },

        /** Is null. @param {Any} input @return {Boolean} */
        isNull: function(input) {
            return (input === NULL);
        },

        /** Is nulls. @param {Any} input @return {Boolean} */
        isNulls: function(input) {
            return (input === NULLS);
        },

        /** Is undefined. @param {Any} input @return {Boolean} */
        isUndefined: function(input) {
            return (input === undefined);
        },

        /** Is string. @param {Any} input @return {Boolean} */
        isString: function(input) {
            return (typeof input == 'string');
        },

        /** Is bool. @param {Any} input @return {Boolean} */
        isBool: function(input) {
            return (typeof input == 'boolean');
        },

        /** Is number. @param {Any} input @return {Boolean} */
        isNumber: function(input) {
            return (typeof input == 'number');
        },

        /** Is numeric. @param {Any} input @return {Boolean} */
        isNumeric: function(input) {
            return re_numeric.test(input);
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

        /** Is list. @param {Any} input @return {Boolean} */
        isList: function(input) {
            return input && (input.constructor && input.constructor.name == 'List');
        },

        /** Is int. @param {Any} input @return {Boolean} */
        isInt: function(input) {
            return $.isNumber(input) && input == (input | 0);
        },

        /** Is float. @param {Any} input @return {Boolean} */
        isFloat: function(input) {
            return $.isNumber(input) && input != (input | 0);
        },

        /** Is iterable.     @param {Any} input @return {Boolean} */
        isIterable: function(input) {
            return $.isArray(input) || $.isObject(input) || $.isList(input) || (input && (
                (input.length != NULL && !input[NAME_NODE_TYPE]) // dom, nodelist, string etc.
            ));
        },

        /** Is primitive. @param {Any} input @return {Boolean} */
        isPrimitive: function(input) {
            return $.isVoid(input) || /^(string|number|boolean)$/.test(typeof input);
        },

        /** Is window. @param {Any} input @return {Boolean} */
        isWindow: function(input) {
            return toBool(input && input == input[NAME_WINDOW] && input == input[NAME_WINDOW].window);
        },

        /** Is document. @param {Any} input @return {Boolean} */
        isDocument: function(input) {
            return toBool(input && input[NAME_NODE_TYPE] === NODE_TYPE_DOCUMENT);
        },

        /** Is node. @param {Any} input @return {Boolean} */
        isNode: function(input) {
            return toBool(input && (input[NAME_NODE_TYPE] === NODE_TYPE_ELEMENT
                || input[NAME_NODE_TYPE] === NODE_TYPE_DOCUMENT_FRAGMENT));
        },

        /** Is node element. @param {Any} input @return {Boolean} */
        isNodeElement: function(input) {
            return toBool(input && input[NAME_NODE_TYPE] === NODE_TYPE_ELEMENT);
        }
    });

    /**
     * Object keys & values.
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

    // shortcut
    function has(input, searchValue, strict) {
        var ret;

        if ($.isString(input)) {
            ret = $.isRegExp(searchValue) ? input.search(searchValue) : input.indexOf(searchValue); // simply
        } else if ($.isArray(input) || $.isObject(input)) {
            $.for(input, function(value, i) {
                if (strict ? value === searchValue : value == searchValue) {
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
         * @param  {Boolean} strict
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
    function prepareTrimRegExp(chars, opt_isLeft) {
        return toRegExp((opt_isLeft ? '^[%s]+' : '[%s]+$')
            .format(chars ? chars.replace(/([\[\]\\])/g, '\\$1') : '\\s'));
    }
    function prepareSearchStuff(str, search, index, opt_noCase) {
        if (str && search) {
            // swap arguments
            if (index === FALSE) {
                opt_noCase = FALSE, index = 0;
            }

            str = toString(str);
            if (opt_noCase) {
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
         * @param  {Boolean} strict
         * @return {Boolean}
         */
        has: function(search, strict) {
            return has(this, search, strict);
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
         * @return {Int|null}
         */
        toInt: function() { return toInt(this); },

        /**
         * To float.
         * @param  @internal str
         * @return {Float|null}
         */
        toFloat: function(str) { return toFloat(this); },

        /**
         * To capital case.
         * @param  {Boolean} all   @default=true
         * @param  {Boolean} lower @default=false
         * @return {String}
         */
        toCapitalCase: function(all, lower) {
            var str = toString(this), i;

            if (lower) str = str.toLowerCase();

            if (all !== FALSE) {
                for (i = 0, str = str.split(' '); i < str.length; i++) {
                    str[i] = str[i].toCapitalCase(FALSE);
                }

                return str.join(' ');
            }

            return str.charAt(0).toUpperCase() + str.slice(1);
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
                throw ('No enough arguments!');
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
         * @param  {String} input
         * @return {String}
         */
        prepend: function(input) {
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
         * @param  {String|undefined} chars @optional
         * @return {String}
         * @override For chars option.
         */
        trim: function(chars) {
            return this.trimLeft(chars).trimRight(chars);
        },

        /**
         * Trim left.
         * @param  {String|undefined} chars @optional
         * @return {String}
         * @override For chars option.
         */
        trimLeft: function(chars) {
            var str = toString(this), re = prepareTrimRegExp(chars, TRUE);

            while (re.test(str)) {
                str = str.replace(re, NULLS);
            }

            return str;
        },

        /**
         * Trim right.
         * @param  {String|undefined} chars @optional
         * @return {String}
         * @override For chars option.
         */
        trimRight: function(chars) {
            var str = toString(this), re = prepareTrimRegExp(chars);

            while (re.test(str)) {
                str = str.replace(re, NULLS);
            }

            return str;
        },

        /**
         * Starts with.
         * @param  {String}  search
         * @param  {Int}     index
         * @param  {Boolean}    opt_noCase
         * @param  @internal str
         * @return {Boolean}
         * @override For no-case option.
         */
        startsWith: function(search, index, opt_noCase, str) {
            return (str = prepareSearchStuff(this, search, index, opt_noCase))
                && str.ss === str.s.substr(str.i || 0, str.ss.length);
        },

        /**
         * Ends with.
         * @param  {String}  search
         * @param  {Int}     index
         * @param  {Boolean}    opt_noCase
         * @param  @internal str
         * @return {Boolean}
         * @override For no-case option.
         */
        endsWith: function(search, index, opt_noCase, str) {
            return (str = prepareSearchStuff(this, search, index, opt_noCase))
                && str.ss === str.s.substr(0, str.i || str.ss.length);
        },

        /**
         * Contains.
         * @param  {String}  search
         * @param  {Boolean}    opt_noCase
         * @param  @internal str
         * @return {Boolean}
         */
        contains: function(search, opt_noCase, str) {
            return (str = prepareSearchStuff(this, search, opt_noCase))
                && str.s !== str.s.split(str.ss)[0];
        },

        /**
         * To RegExp
         * @param  {String|undefined} flags
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

    // internal vars
    var _uuid = 0,
        fn_eval = window.eval, // direct eval breaks minify tool
        fn_slice = [].slice,
        fn_toString = {}.toString,
        re_numeric = /^-?(\.?\d+|\d+\.\d+)$/
    ;

    /**
     * Array.
     * @param  {Any} input
     * @param  {Int} begin
     * @param  {Int} end
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
        console[fn].apply(NULL, ['>> so:'].concat(makeArray(args)));
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
         * Fun.
         * @return {Function}
         */
        fun: function() {
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
         * Uuid.
         * @return {Int}
         */
        uuid: function() {
            return ++_uuid;
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
         * Fire.
         * @param  {Int}      delay (seconds)
         * @param  {Function} fn
         * @param  {Array}    fnArgs
         * @param  {Boolean}  repeat
         * @return {void}
         */
        fire: function(delay, fn, fnArgs, repeat) {
            var id, fnArgs = fnArgs || []; delay *= 1000;
            if (!repeat) {
                id = setTimeout(function() {
                    fn.apply(window, fnArgs), clearTimeout(id);
                }, delay);
            } else {
                id = setInterval(function() {
                    fn.apply(window, fnArgs), clearInterval(id);
                }, delay);
            }
        },

        /**
         * Get window.
         * @param  {Any} node
         * @return {Window|undefined}
         */
        getWindow: function(input) {
            var ret;

            if (input) {
                if ($.isNode(input)) {
                    ret = input[NAME_OWNER_DOCUMENT][NAME_DEFAULT_VIEW]; // node document window
                } else if ($.isDocument(input)) {
                    ret = input[NAME_DEFAULT_VIEW]; // document window
                } else if ($.isWindow(input)) {
                    ret = input;
                }
            } else {
                ret = window;
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

            if (input) {
                if (input[NAME_OWNER_DOCUMENT]) { // document or node
                    ret = input[NAME_OWNER_DOCUMENT];
                } else if (input[NAME_DOCUMENT]) { // window
                    ret = input[NAME_DOCUMENT];
                } else if ($.isDocument(input)) {
                    ret = input;
                }
            } else {
                ret = window[NAME_DOCUMENT];
            }

            return ret;
        },

        /**
         * Trim.
         * @param  {String}           str
         * @param  {String|undefined} chars @optional
         * @return {String}
         */
        trim: function(str, chars) {
            return (str == NULL) ? NULLS : (''+ str).trim(chars);
        },

        /**
         * Trim left.
         * @param  {String}           str
         * @param  {String|undefined} chars @optional
         * @return {String}
         */
        trimLeft: function(str, chars) {
            return (str == NULL) ? NULLS : (''+ str).trimLeft(chars);
        },

        /**
         * Trim right.
         * @param  {String}           str
         * @param  {String|undefined} chars @optional
         * @return {String}
         */
        trimRight: function(str, chars) {
            return (str == NULL) ? NULLS : (''+ str).trimRight(chars);
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
            else if ($.isNodeElement(input)) type = 'element';
            else if ($.isNode(input))        type = 'node';
            else if ($.isList(input))        type = 'list';
            else type = fn_toString.call(input).slice(8, -1).toLowerCase();

            return type;
        },

        /**
         * To value, int, float, string, bool
         * @param  {Any} input
         * @return {Any}
         */
        value: function(input) { return toValue(input); },
        int: function(input) { return toInt(input); },
        float: function(input) { return toInt(input); },
        string: function(input) { return toString(input); },
        bool: function(input) { return toBool(input); },

        /**
         * Json encode.
         * @param  {Any}      input
         * @param  {Function} inputReplacer
         * @param  {String}   space
         * @return {String}
         */
        jsonEncode: function(input, inputReplacer, space) {
            return JSON.stringify(input, inputReplacer, space);
        },

        /**
         * Json decode.
         * @param  {String}   input
         * @param  {Function} inputReviver
         * @return {Any}
         */
        jsonDecode: function(input, inputReviver) {
            return JSON.parse(input, inputReviver);
        },

        /**
         * Is set.
         * @param  {Any}    input
         * @param  {String} opt_key
         * @return {Boolean}
         */
        isSet: function(input, opt_key) {
            return ((opt_key != NULL) ? $.dig(input, opt_key) : input) != NULL;
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

        mix: function() {
            throw '@todo Remove method $.mix()!';
        },

        /**
         * Copy.
         * @param  {Array|Object} input
         * @param  {Array}        opt_keysExclude
         * @return {Array|Object}
         */
        copy: function(input, opt_keysExclude) {
            return $.copyTo($.isArray(input) ? [] : {}, input, opt_keysExclude, TRUE);
        },

        /**
         * Copy to.
         * @param  {Array|Object} inputTo
         * @param  {Array|Object} inputFrom
         * @param  {Array}        opt_keysExclude
         * @param  {Boolean}      opt_overwrite @default=true
         * @return {Array|Object}
         */
        copyTo: function(inputTo, inputFrom, opt_keysExclude, opt_overwrite) {
            var keys = opt_keysExclude || [], key;
            for (key in inputFrom) {
                if (!keys.has(key)) {
                    if (opt_overwrite !== FALSE && key in inputTo) {
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
         * @param  {Object}  prototype
         * @usage  $.extend(target, source)
         * @usage  $.extend(target, null, prototype)
         * @usage  $.extend('@x', ...), $.extend('@', {x: ...}) @self
         * @return {Any}
         */
        extend: function(target, source, prototype) {
            // self extend
            if ($.isString(target) && target.charAt(0) == '@') {
                var targetName = target.slice(1), tmpSource;

                // $.extend('@x', ...)
                if (targetName) {
                    target = $;
                    if ($[targetName]) {
                        target = $[targetName][NAME_PROTOTYPE] || $[targetName];
                    } else {
                        tmpSource = {};
                        tmpSource[targetName] = source;
                        source = tmpSource;
                    }

                    return extend(target, source);
                }

                // $.extend('@', {x: ...})
                return extend($, source);
            }

            if ($.isArray(target)) {
                while (target.length) {
                    $.extend(target.shift(), source, prototype);
                }
            } else {
                var args = makeArray(arguments);

                if (source == NULL) { // prototype
                    source = prototype;
                    target = target[NAME_PROTOTYPE];
                    args = args.slice(3);
                } else {
                    args = args.slice(2);
                }

                return extend.apply(NULL, [target, source].concat(args));
            }
        },

        /**
         * Extend prototype.
         * @param  {Function} target
         * @param  {Object}   prototype
         * @return {Function}
         */
        extendPrototype: function(target, prototype) {
            return $.extend(target, NULL, prototype);
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
                    writable: property[1] != NULL ? !!property[1] : TRUE,
                    enumerable: property[2] != NULL ? !!property[2] : TRUE,
                    configurable: property[3] != NULL ? !!property[3] : FALSE
                }
            });

            return Object.create(object, properties);
        },

        /**
         * Options.
         * @param  {Object|void} options
         * @return {Object}
         */
        options: function(options) {
            return $.extend.apply(NULL, [options || {}].concat(makeArray(arguments, 1)));
        },

        /**
         * List
         * @param  {Array|Object} data
         * @param  {Object}       options
         * @return {List}
         */
        list: function(data, options) {
            return new List(data, options);
        },

        /**
         * Pick.
         * @param  {Array|Object} input
         * @param  {String}       key
         * @param  {Any}          opt_value
         * @return {Any|undefined}
         * @throws
         */
        pick: function(input, key, opt_value) {
            var value = opt_value;

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
        },

        toString: function(name, opt_object) {
            throw '@todo Remove method $.toString()!';
        }
    });

    /**
     * So class.
     * @param  {Function} subClass For $.class.extends()
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
            // create constructor with original name (minify tools change the original name)
            function createConstructor(contents) {
                return new Function('return function '+ name +'(){'+ contents +'}')();
            }

            var Class = createConstructor('if(this.init)this.init.apply(this,arguments)');

            if (prototype) {
                Class[NAME_PROTOTYPE] = Object.create(prototype, {
                    constructor: {value: (function() {
                        var Constructor = createConstructor();
                        Constructor[NAME_PROTOTYPE] = prototype;
                        Constructor[NAME_PROTOTYPE].constructor = Constructor;
                        return Constructor;
                    })()}
                });
            }

            return Class;
        },

        /**
         * Extend.
         * @param  {Function} target
         * @param  {Object}   prototype
         * @return {Function}
         */
        extend: function(target, prototype) {
            return $.extend(target, NULL, prototype);
        },

        /**
         * Extends.
         * @param  {Function} supClass
         * @param  {Function} subClass  From $.class(subClass)
         * @usage  $.class(Foo).extends(FooBase)
         * @return {Function}
         */
        extends: function(supClass) {
            // subClass[NAME_PROTOTYPE] = Object.create(supClass[NAME_PROTOTYPE], {
            //     constructor: {value: subClass},
            //           super: {value: supClass}
            // });

            var prototype = extend({
                constructor: subClass,
                      super: supClass
            }, supClass[NAME_PROTOTYPE], subClass[NAME_PROTOTYPE]);

            $.forEach(prototype, function(name, value) {
                subClass[NAME_PROTOTYPE][name] = value;
            });

            return subClass;
        }
    }};

    // add shortcuts for without ()'s.
    $.class.create = $.class().create;
    $.class.extend = $.class().extend;

    /**
     * List.
     * @param  {Iterable} data
     * @param  {Object}   options
     * @return {List}
     * @private
     */
    function List(data, options) {
        this.init(data || {}, options);
    }

    extend(List[NAME_PROTOTYPE], {
        /**
         * Init.
         * @param  {Iterable} data
         * @param  {Object}   options
         * @return {List}
         */
        init: function(data, options) {
            if (!$.isIterable(data)) {
                throw ('Only iterable objects accepted for List.');
            }

            var type = $.type(data);
            if (data instanceof List) {
                type = data.type;
                data = data.data;
            }

            options = $.extend({}, {type: type}, options);

            this.type = options.type;
            this.data = {};
            this.size = 0;

            $.forEach(data, function(key, value) {
                this.data[key] = value;
                this.size++; // why naming as 'length' sucks?!
            }, this);

            return this;
        },

        /**
         * For.
         * @param  {Function} fn
         * @return {this}
         */
        for: function(fn) {
            return $.for(this.data, fn, this);
        },

        /**
         * For each.
         * @param  {Function} fn
         * @return {this}
         */
        forEach: function(fn) {
            return $.forEach(this.data, fn, this);
        },

        /**
         * For all.
         * @param  {Function} fn
         * @return {this}
         */
        forAll: function(fn) {
            var key, value, i = 0;

            return this.for(function(list) {
                for (key in list.data) {
                    value = list.data[key];
                    if (fn.call(this, value, i++) === 0) {
                        return 0; // break;
                    }
                }
            });
        },

        /**
         * For each all.
         * @param  {Function} fn
         * @return {this}
         */
        forEachAll: function(fn) {
            var key, value, i = 0;

            return this.for(function(list) {
                for (key in list.data) {
                    value = list.data[key];
                    if (fn.call(this, key, value, i++) === 0) {
                        return 0; // break;
                    }
                }
            });
        },

        /**
         * Set.
         * @param {Int|String|undefined} key
         * @param {Any} value
         */
        set: function(key, value) {
            return key = (key != NULL ? key : this.size), !(key in this.data) && this.size++,
                this.data[key] = value, this;
        },

        /**
         * Get.
         * @param  {Int|String} key
         * @param  {Any}        valueDefault
         * @return {Any}
         */
        get: function(key, valueDefault) {
            return this.hasKey(key) ? this.data[key] : valueDefault;
        },

        /**
         * Remove.
         * @param  {Any} value
         * @return {this}
         */
        remove: function(value) {
            return this.pick(this.findKey(value)), this;
        },

        /**
         * Remove at.
         * @param  {Int|String} key
         * @return {this}
         */
        removeAt: function(key) {
            return this.pick(key), this;
        },

        /**
         * Replace.
         * @param  {Any} searchValue
         * @param  {Any} replaceValue
         * @return {this}
         */
        replace: function(searchValue, replaceValue) {
            return this.forEach(function(key, value) {
                if (value === searchValue) {
                    this.data[key] = replaceValue;
                }
            });
        },

        /**
         * Replace at.
         * @param  {Int|String} key
         * @param  {Any}        replaceValue
         * @return {this}
         */
        replaceAt: function(key, replaceValue) {
            return this.data[key] = replaceValue, this;
        },

        /**
         * Empty.
         * @return {this}
         */
        empty: function() {
            return this.data = {}, this.size = 0, this;
        },

        /**
         * Keys.
         * @return {Array}
         */
        keys: function() { return Object.keys(this.data); },

        /**
         * Values.
         * @return {Array}
         */
        values: function() { return Object.values(this.data); },

        /**
         * Has.
         * @param  {Any}     search
         * @param  {Boolean} strict
         * @return {Boolean}
         */
        has: function(search, strict) {
            return has(this.data, search, strict);
        },

        /**
         * Has key.
         * @param  {Int|String} key
         * @return {Boolean}
         */
        hasKey: function(key) {
            return (key in this.data);
        },

        /**
         * Append.
         * @param  {Any} value
         * @return {this}
         */
        append: function(value) {
            return this.set(NULL, value);
        },

        /**
         * Prepend.
         * @param  {Any} value
         * @return {this}
         */
        prepend: function(value) {
            var data = {0: value};

            return this.forEach(function(key, value) {
                if ($.isNumeric(key)) key++; // push key
                data[key] = value;
            }), this.init(data);
        },

        /**
         * Pop.
         * @return {Any}
         */
        pop: function() { return this.pick(this.keys().pop()); },

        /**
         * Top.
         * @return {any}
         */
        top: function() { return  this.pick(this.keys().shift()); },

        /**
         * Find.
         * @param  {Any} searchValue
         * @param  {Any} valueDefault
         * @param  {Int} opt_return
         * @return {Any}
         */
        find: function(searchValue, valueDefault, opt_return) {
            var search = searchValue, ret = valueDefault;

            // make test function
            if (!$.isFunction(searchValue)) {
                search = function(value) { return value === searchValue; };
            }

            this.forEach(function(key, value, i) {
                if (search(value)) {
                    ret = opt_return == NULL ? value : opt_return == 0 ? key : i;
                    return 0; // break
                }
            });

            return ret;
        },

        /**
         * Find index.
         * @param  {Any} searchValue
         * @return {String|undefined}
         */
        findKey: function(searchValue) {
            return this.find(searchValue, undefined, 0);
        },

        /**
         * Find index.
         * @param  {Any} searchValue
         * @return {Int|undefined}
         */
        findIndex: function(searchValue) {
            return this.find(searchValue, undefined, 1);
        },

        /**
         * Pick.
         * @param  {Any} key
         * @param  {Any} valueDefault
         * @return {Any}
         */
        pick: function(key, valueDefault) {
            var ret = valueDefault;

            if (key in this.data) {
                ret = this.data[key], delete this.data[key], this.size--;
            }

            return ret;
        },

        /**
         * Pick all.
         * @param  {Object} ...arguments
         * @return {Object}
         */
        pickAll: function() {
            var ret = {};

            $.forEach(makeArray(arguments), function(key) {
                if (key in this.data) {
                    ret[key] = this.data[key], delete this.data[key], this.size--;
                }
            }, this);

            return ret;
        },

        /**
         * Copy.
         * @param  {Object} options
         * @return {List}
         */
        copy: function(options) {
            return new List(this, options);
        },

        /**
         * Copy to.
         * @param  {List} list
         * @param  {Object} options
         * @return {List}
         */
        copyTo: function(list, options) {
            return list.init(this.data, options);
        },

        /**
         * Copy with.
         * @param  {Object} data
         * @param  {Object} options
         * @return {[type]}
         */
        copyWith: function(list, options) {
            return list.init($.extend({}, this.data, list.data), options);
        },

        /**
         * Map.
         * @param  {Function} fn
         * @return {this}
         */
        map: function(fn) {
            return this.forEach(function(key, value, i) {
                this.data[key] = fn(value, key, i);
            });
        },

        /**
         * Reduce.
         * @param  {Any}      inValue
         * @param  {Function} fn
         * @return {Any}
         */
        reduce: function(inValue, fn) {
            return this.forEach(function(key, value, i) {
                inValue = fn(value, key, i, inValue);
            }), inValue;
        },

        /**
         * Filter.
         * @param  {Function|undefined} fn
         * @return {this}
         */
        filter: function(fn) {
            var _this = this, list = new List();
            fn = fn || function(value) { return !!value; }; // set default tester

            return this.forEach(function(key, value, i) {
                if (fn(value, key, i)) {
                    list.set(key, value);
                }
            }), this.init(list.data, {type: _this.type});
        },

        /**
         * Select.
         * @param  {Function} fn
         * @return {List}
         */
        select: function(fn) {
            var list = new List();

            return this.forEach(function(key, value, i) {
                if (fn(value, key, i)) {
                    list.set(key, value);
                }
            }), list;
        },

        /**
         * Select all.
         * @param  {Function|undefined} fn
         * @return {List}
         */
        selectAll: function(fn) {
            var list = new List();
            fn = fn || function() { return TRUE; }; // set default tester

            return this.forEachAll(function(key, value, i) {
                if (fn(value, key, i)) {
                    list.append(value);
                }
            }), list;
        },

        /**
         * Uniq.
         * @return {this}
         */
        uniq: function() {
            var _this = this, list = new List();

            return this.forEach(function(key, value) {
                if (!list.has(value)) {
                    list.set(key, value);
                }
            }), this.init(list.data, {type: _this.type});
        },

        /**
         * Revers.
         * @return {this}
         */
        reverse: function() {
            var _this = this, data = {};

            if (this.type == 'array' || this.type == 'string') {
                data = this.values().reverse();
            } else {
                $.forEach(this.keys().reverse(), function(key) {
                    data[key] = this.data[key];
                }, this);
            }

            return this.init(data, {type: _this.type});
        },

        /**
         * First.
         * @param  {Any} valueDefault
         * @return {Any}
         */
        first: function(valueDefault) {
            return this.for(function(value) {
                valueDefault = value; return 0; //break
            }), valueDefault;
        },

        /**
         * Last.
         * @param  {Any} valueDefault
         * @return {Any}
         */
        last: function(valueDefault) {
            return this.for(function(value) {
                valueDefault = value;
            }), valueDefault;
        },

        /**
         * Is empty.
         * @return {Boolean}
         */
        isEmpty: function() {
            return !this.size;
        },

        /**
         * To string
         * @return {String}
         */
        toString: function() {
            return this.isEmpty() ? ''
                : this.type == 'string' ? this.values().join('')
                    : $.jsonEncode(this.type == 'array' ? this.values() : this.data);
        }
    });

    // onReady callbacks
    var callbacks = [];

    // onReady callbacks firer
    function fireCallbacks() {
        while (callbacks.length) {
            callbacks.shift()($);
        }
    }

    /**
     * Oh baby..
     * @param  {Function}           callback
     * @param  {Document|undefined} document
     * @return {none}
     */
    $.onReady = function(callback, document) {
        if ($.isFunction(callback)) {
            callbacks.push(callback);
        }

        // iframe support
        document = document || window[NAME_DOCUMENT];

        var type = 'DOMContentLoaded';
        document.addEventListener(type, function _() {
            document.removeEventListener(type, _, FALSE);
            fireCallbacks();
        }, FALSE);
    };

})(window, {});

/**
 * Shortcut for 'console.log'.
 * @param  {Object} ...arguments
 * @return {void}
 * @public
 */
function log() { console.log.apply(console, arguments); }
