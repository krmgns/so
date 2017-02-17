/**
 * @package so
 * @object  so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, undefined) { 'use strict';

    // simply support check
    if (!''.trim) {
        throw ('Archaic browser!');
    }

    // minify tools
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

    /**
     * Shortcut for 'so'.
     * @type {Object}
     * @private
     */
    var $ = {};

    // globals
    window.so = $;
    window.so.VERSION = '5.0.0';
    window.so.DOMLevel = document.adoptNode ? 3 : 2;
    window[NAME_DOCUMENT][NAME_WINDOW] = window;

    /**
     * To value, int, float, bool, string, json.
     * @param  {Any} input
     * @return {Int|Float|Bool|String}
     * @private
     */
    function toValue(input) {
        return (input != NULL && input.valueOf) ? input.valueOf() : input;
    }
    function toInt(input) {
        return !$.isNumeric(input = toString(input)) ? NULL : parseInt(input.replace(/^-?\./, '0.'), 10);
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
     * For each.
     * @param  {Array|Object} input
     * @param  {Function}     fn
     * @param  {Object}       opt__this
     * @return {Array|Object}
     * @private
     */
    function forEach(input, fn, opt__this) {
        var _this = opt__this || input, len = input && input.length, i = 0, key;

        if (len != NULL) {
            for (; i < len; i++) {
                if (fn.call(_this, input[i], i, i) === 0) break;
            }
        } else {
            for (key in input) {
                if (input.hasOwnProperty(key)) {
                    if (fn.call(_this, input[key], key, i++) === 0) break;
                }
            }
        }

        return _this;
    }

    /**
     * so: type functions.
     */
    extend($, {
        /** Is void. @param {Any} input @return {Bool} */
        isVoid: function(input) {
            return (input == NULL);
        },

        /** Is null. @param {Any} input @return {Bool} */
        isNull: function(input) {
            return (input === NULL);
        },

        /** Is nulls. @param {Any} input @return {Bool} */
        isNulls: function(input) {
            return (input === NULLS);
        },

        /** Is undefined. @param {Any} input @return {Bool} */
        isUndefined: function(input) {
            return (input === undefined);
        },

        /** Is string. @param {Any} input @return {Bool} */
        isString: function(input) {
            return (typeof input == 'string');
        },

        /** Is bool. @param {Any} input @return {Bool} */
        isBool: function(input) {
            return (typeof input == 'boolean');
        },

        /** Is number. @param {Any} input @return {Bool} */
        isNumber: function(input) {
            return (typeof input == 'number');
        },

        /** Is numeric. @param {Any} input @return {Bool} */
        isNumeric: function(input) {
            return !$.isVoid(input) && !$.isNulls(input) && isFinite(input) && !isNaN(parseFloat(input));
        },

        /** Is function. @param {Any} input @return {Bool} */
        isFunction: function(input) {
            return (typeof input == 'function');
        },

        /** Is array.@param {Any} input @return {Bool} */
        isArray: function(input) {
            return Array.isArray(input);
        },

        /** Is object. @param {Any} input @return {Bool} */
        isObject: function(input) {
            return input && (input.constructor == Object);
        },

        /** Is list. @param {Any} input @return {Bool} */
        isList: function(input) {
            return input && (input.constructor && input.constructor.name == 'List');
        },

        /** Is int. @param {Any} input @return {Bool} */
        isInt: function(input) {
            return $.isNumber(input) && input == (input | 0);
        },

        /** Is float. @param {Any} input @return {Bool} */
        isFloat: function(input) {
            return $.isNumber(input) && input != (input | 0);
        },

        /** Is iterable.     @param {Any} input @return {Bool} */
        isIterable: function(input) {
            return $.isArray(input) || $.isObject(input) || $.isList(input) || (input && (
                (input.length != NULL && !input[NAME_NODE_TYPE]) // dom, nodelist, string etc.
            ));
        },

        /** Is primitive. @param {Any} input @return {Bool} */
        isPrimitive: function(input) {
            return $.isVoid(input) || /^(string|number|boolean)$/.test(typeof input);
        },

        /** Is window. @param {Any} input @return {Bool} */
        isWindow: function(input) {
            return toBool(input && input == input[NAME_WINDOW] && input == input[NAME_WINDOW].window);
        },

        /** Is document. @param {Any} input @return {Bool} */
        isDocument: function(input) {
            return toBool(input && input[NAME_NODE_TYPE] === NODE_TYPE_DOCUMENT);
        },

        /** Is node. @param {Any} input @return {Bool} */
        isNode: function(input) {
            return toBool(input && (input[NAME_NODE_TYPE] === NODE_TYPE_ELEMENT
                || input[NAME_NODE_TYPE] === NODE_TYPE_DOCUMENT_FRAGMENT));
        },

        /** Is node element. @param {Any} input @return {Bool} */
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
        return ret = [], forEach(object, function(_, key) { ret.push(key); }), ret;
    };
    Object.values = Object.values || function(object, ret) {
        return ret = [], forEach(object, function(value) { ret.push(value); }), ret;
    };

    // shortcut
    function index(input, search) {
        return input.indexOf(search) > -1;
    }

    /**
     * Array extends.
     */
    extend(Array[NAME_PROTOTYPE], {
        /**
         * Index.
         * @param  {Any} search
         * @return {Boolean}
         */
        index: function(search) {
            return index(this, search);
        },
        /**
         * Get.
         * @param  {Int} key
         * @param  {Any} valueDefault
         * @return {Any}
         */
        get: function(key, valueDefault) {
            return (key in this) ? this[key] : valueDefault;
        }
    });

    /**
     * To trim chars.
     * @param  {String|undefined} chars
     * @param  {Boolean}          opt_isLeft
     * @return {String}
     * @private
     */
    function toTrimRegExp(chars, opt_isLeft) {
        return new RegExp((opt_isLeft ? '^[%s]+' : '[%s]+$')
            .format(chars ? chars.replace(/([\[\]\\])/g, '$1') : '\\s'));
    }

    /**
     * To search stuff.
     * @param  {String}  str
     * @param  {String}  search
     * @param  {Integer} index
     * @param  {Boolean} opt_noCase
     * @return {Object}
     * @private
     */
    function toSearchStuff(str, search, index, opt_noCase) {
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
         * Index.
         * @param  {Any} search
         * @return {Boolean}
         */
        index: function(search) {
            return index(this, search);
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
         * @param  {Bool} all @default=true
         * @return {String}
         */
        toCapitalCase: function(all) {
            var str = toString(this).toLowerCase(), i;

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

            if (args.length != match.length) {
                throw ('Arguments and matches length must be equal!');
            }

            while (match.shift()) {
                str = str.replace(/(%s)/, args[i++]);
            }

            return str;
        },

        /**
         * Append.
         * @param  {String} input
         * @return {String}
         */
        append: function(input) {
            return toString(this) + toString(input);
        },

        /**
         * Prepen.
         * @param  {String} input
         * @return {String}
         */
        prepend: function(input) {
            return toString(input) + toString(this);
        },

        /**
         * Wrap.
         * @param  {String} input
         * @return {String}
         */
        wrap: function(input) {
            return input = toString(input), input + toString(this) + input;
        },

        /**
         * Unwrap.
         * @param  {String} input
         * @return {String}
         */
        unwrap: function(input) {
            var str = toString(this);
            input = toString(input);

            if (str.index(input)) {
                return str.substr(input.length).substr(-input.length);
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
            var str = toString(this), re = toTrimRegExp(chars, TRUE);

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
            var str = toString(this), re = toTrimRegExp(chars);

            while (re.test(str)) {
                str = str.replace(re, NULLS);
            }

            return str;
        },

        /**
         * Starts with.
         * @param  {String}  search
         * @param  {Int}     index
         * @param  {Bool}    opt_noCase
         * @param  @internal str
         * @return {Bool}
         * @override For no-case option.
         */
        startsWith: function(search, index, opt_noCase, str) {
            return (str = toSearchStuff(this, search, index, opt_noCase))
                && str.ss === str.s.substr(str.i || 0, str.ss.length);
        },

        /**
         * Ends with.
         * @param  {String}  search
         * @param  {Int}     index
         * @param  {Bool}    opt_noCase
         * @param  @internal str
         * @return {Bool}
         * @override For no-case option.
         */
        endsWith: function(search, index, opt_noCase, str) {
            return (str = toSearchStuff(this, search, index, opt_noCase))
                && str.ss === str.s.substr(0, str.i || str.ss.length);
        },

        /**
         * Contains.
         * @param  {String}  search
         * @param  {Bool}    opt_noCase
         * @param  @internal str
         * @return {Bool}
         */
        contains: function(search, opt_noCase, str) {
            return (str = toSearchStuff(this, search, opt_noCase))
                && str.s !== str.s.split(str.ss)[0];
        }
    });

    // internal vars
    var _uuid = 0,
        fn_slice = [].slice,
        fn_toString = {}.toString
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

    /**
     * so: base functions.
     */
    extend($, {
        /**
         * Debug tools.
         * @return {void}
         */
        log: function() { _log('log', arguments); },
        logInfo: function() { _log('info', arguments); },
        logWarn: function() { _log('warn', arguments); },
        logError: function() { _log('error', arguments); },
        throw: function(message) { throw (message); },

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
         * Window.
         * @param  {Any} node
         * @return {Window|undefined}
         */
        window: function(input) {
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
         * Document.
         * @param  {Any} input
         * @return {Document|undefined}
         */
        document: function(input) {
            var ret;

            if (input) {
                if (input[NAME_OWNER_DOCUMENT]) { // document or node
                    ret = input[NAME_OWNER_DOCUMENT];
                } else if (input[NAME_DOCUMENT]) {
                    ret = input[NAME_DOCUMENT]; // window
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

        /**
         * For each.
         * @param  {Array|Object} input
         * @param  {Function}     fn
         * @param  {Object}       opt__this
         * @return {Array|Object}
         * @private
         */
        forEach: function(input, fn, opt__this) {
            return forEach(input, fn, opt__this);
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
                if (!keys.index(key)) {
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
         * @param  {Boolean} isPrototype
         * @usage  $.extend(target, source)
         * @usage  $.extend(target, source, true)
         * @usage  $.extend('@x', ...), $.extend('@', {x: ...}) @self
         * @return {Any}
         */
        extend: function(target, source, isPrototype) {
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

            if (isPrototype) {
                target = target.prototype;
            }

            // any extend
            return extend.apply(NULL, [target, source].concat(makeArray(arguments, 2)));
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
            $.forEach(properties, function(value, key) {
                properties[key] = {
                    value: value[0],
                    writable: value[1] != NULL ? !!value[1] : TRUE,
                    enumerable: value[2] != NULL ? !!value[2] : TRUE,
                    configurable: value[3] != NULL ? !!value[3] : FALSE
                }
            });

            return Object.create(object, properties);
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

            forEach(input, function(value, key) {
                // if ($.isNumeric(key)) key *= 1; // fix for index
                if (keys.index(key)) {
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
        },

        /**
         * Define property.
         * @param  {Object} object
         * @param  {String} name
         * @param  {Object} property
         * @return {Object}
         */
        defineProperty: function(object, name, property) {
            if ($.isVoid(property[2])) {
                property[2] = TRUE; // always visible
            }

            return Object.defineProperty(object, name, {
                value: property[0],
                writable: property[1] != NULL ? !!property[1] : TRUE,
                enumerable: property[2] != NULL ? !!property[2] : TRUE,
                configurable: property[3] != NULL ? !!property[3] : FALSE
            });
        },

        /**
         * Define property all.
         * @param  {Object} object
         * @param  {Object} properties
         * @return {Object}
         */
        definePropertyAll: function(object, properties) {
            return $.forEach(properties, function(property) {
                $.defineProperty(object, name, property);
            });
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
            // create constructor
            function createConstructor(contents) {
                return window.eval('(function(){'+ contents +'})()'); // direct eval breaks minify tool
            }

            // create a named constructor
            var Constructor = createConstructor(
                'var Constructor = function '+ name +'() {' +
                ' if (this.init) {' +
                '   this.init.apply(this, arguments);' +
                ' }' +
                '};' +
                'return Constructor;'
            );

            // add constructor prototype and constructor constructor
            if (prototype) {
                Constructor[NAME_PROTOTYPE] = Object.create(prototype, {
                    constructor: {value: createConstructor(
                        'var Constructor = function '+ name +'(){};' +
                        'Constructor.prototype = prototype;' +
                        'Constructor.prototype.constructor = Constructor;' +
                        'return Constructor;'
                    )}
                });
            }

            return Constructor;
        },

        /**
         * Extend.
         * @param  {Function} targetClass
         * @param  {Object}   prototype
         * @return {Function}
         */
        extend: function(targetClass, prototype) {
            forEach(prototype, function(value, name) {
                targetClass[NAME_PROTOTYPE][name] = value;
            });

            return targetClass
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

            forEach(prototype, function(value, name) {
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

            options = $.extend({type: type}, options);

            this.type = options.type;
            this.data = {};
            this.size = 0;

            $.forEach(data, function(value, key) {
                this.data[key] = value;
                this.size++; // why naming as 'length' sucks?!
            }, this);

            return this;
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
         * For each all.
         * @param  {Function} fn
         * @return {this}
         */
        forEachAll: function(fn) {
            var key, value, i = 0;

            return this.forEach(function(list) {
                for (key in list.data) {
                    value = list.data[key];
                    if (fn.call(this, value, key, i++) === 0) {
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
            // return this.data[key != NULL ? key : this.size] = value, this.size++, this;
            return key = key != NULL ? key : this.size, !(key in this.data) && this.size++,
                this.data[key] = value, this;
        },

        /**
         * Get.
         * @param  {Int|String} key
         * @param  {Any}        opt_defaultValue
         * @return {Any}
         */
        get: function(key, opt_defaultValue) {
            return this.hasKey(key) ? this.data[key] : opt_defaultValue;
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
            return this.forEach(function(value, key) {
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
         * @param  {Any}     searchValue
         * @param  {Boolean} strict @default=true
         * @return {Boolean}
         */
        has: function(searchValue, strict, ret /* @internal */) {
            return ret = FALSE, this.forEach(function(value) {
                if (strict ? value === searchValue : value == searchValue) {
                    ret = TRUE; return 0; // break
                }
            }), !!ret;
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

            this.forEach(function(value, key) {
                $.isNumeric(key) && key++; // push key
                data[key] = value;
            });

            return this.init(data);
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
         * @param  {Any} opt_defaultValue
         * @param  {Int} opt_return
         * @return {Any}
         */
        find: function(searchValue, opt_defaultValue, opt_return) {
            var test = searchValue, ret = opt_defaultValue;

            // make test function
            if (!$.isFunction(searchValue)) {
                test = function(value) { return value === searchValue; };
            }

            this.forEach(function(value, key, i) {
                if (test(value)) {
                    ret = opt_return == NULL ? value : opt_return == 0 ? key : i;
                    return 0; // break
                }
            });

            return ret;
        },

        /**
         * Find index.
         * @param  {Any} searchValue
         * @return {String|null}
         */
        findKey: function(searchValue) {
            return this.find(searchValue, NULL, 0);
        },

        /**
         * Find index.
         * @param  {Any} searchValue
         * @return {Int|null}
         */
        findIndex: function(searchValue) {
            return this.find(searchValue, NULL, 1);
        },

        /**
         * Pick.
         * @param  {Any} key
         * @param  {Any} opt_defaultValue
         * @return {Any}
         */
        pick: function(key, opt_defaultValue) {
            var ret = opt_defaultValue;

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
            return this.forEach(function(value, key, i) {
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
            return this.forEach(function(value, key, i) {
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

            return this.forEach(function(value, key, i) {
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

            return this.forEach(function(value, key, i) {
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

            return this.forEachAll(function(value, key, i) {
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

            return this.forEach(function(value, key) {
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
         * @param  {Any} opt_defaultValue
         * @return {Any}
         */
        first: function(opt_defaultValue) {
            return this.forEach(function(value) {
                opt_defaultValue = value; return 0; //break
            }), opt_defaultValue;
        },

        /**
         * Last.
         * @param  {Any} opt_defaultValue
         * @return {Any}
         */
        last: function(opt_defaultValue) {
            return this.forEach(function(value, key, i) {
                opt_defaultValue = value;
            }), opt_defaultValue;
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
            return !this.isEmpty()
                ? (this.type == 'string' ? this.values().join('')
                : $.jsonEncode(this.type == 'array' ? this.values() : this.data)) : '';
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

})(window);

/**
 * Shortcut for 'console.log'.
 * @param  {Object} ...arguments
 * @return {void}
 * @public
 */
function log() { console.log.apply(console, arguments); }
