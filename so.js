;(function(window, undefined) { 'use strict';

    /**
     * @package so
     * @object  so
     * @author  Kerem Güneş <k-gun@mail.com>
     * @license The MIT License <https://opensource.org/licenses/MIT>
     */

    // simply support check
    if (!''.trim) {
        throw ('Archaic browser!');
    }

    // for minify advantage
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
    window.so.DOMLevel = window[NAME_DOCUMENT].adoptNode ? 3 : 2;
    window[NAME_DOCUMENT][NAME_WINDOW] = window;

    /**
     * Value of.
     * @param  {Any} input
     * @return {Any}
     * @private
     */
    function valueOf(input) {
        return (input != NULL && input.valueOf) ? input.valueOf() : input;
    }

    /**
     * To bool.
     * @param  {Any} input
     * @return {Bool}
     * @private
     */
    function toBool(input) {
        return !!valueOf(input);
    }

    /**
     * To string.
     * @param  {String} input
     * @return {String}
     * @private
     */
    function toString(input) {
        return (input != NULL && input.toString) ? input.toString() : (''+ input);
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
     * @param  {Object}       opt__this @optional
     * @return {Array|Object}
     * @private
     */
    function forEach(input, fn, opt__this) {
        var _this = opt__this || input, len = input && input.length, i = 0, key;

        if (len != NULL) {
            for (; i < len; i++) {
                if (fn.call(_this, input[i], i, i) === 0) {
                    break;
                }
            }
        } else {
            for (key in input) {
                if (input.hasOwnProperty(key)) {
                    if (fn.call(_this, input[key], key, i++) === 0) {
                        break;
                    }
                }
            }
        }

        return _this;
    }

    /**
     * so: type functions.
     */
    extend($, {
        /** Is void.         @param {Any} input @return {Bool} */
        isVoid: function(input) {
            return (input == NULL);
        },

        /** Is null.         @param {Any} input @return {Bool} */
        isNull: function(input) {
            return (input === NULL);
        },

        /** Is nulls.        @param {Any} input @return {Bool} */
        isNulls: function(input) {
            return (input === NULLS);
        },

        /** Is undefined.    @param {Any} input @return {Bool} */
        isUndefined: function(input) {
            return (input === undefined);
        },

        /** Is string.       @param {Any} input @return {Bool} */
        isString: function(input) {
            return (typeof input == 'string');
        },

        /** Is bool.         @param {Any} input @return {Bool} */
        isBool: function(input) {
            return (typeof input == 'boolean');
        },

        /** Is number.       @param {Any} input @return {Bool} */
        isNumber: function(input) {
            return (typeof input == 'number');
        },

        /** Is numeric.      @param {Any} input @return {Bool} */
        isNumeric: function(input) {
            return !$.isVoid(input) && !$.isNulls(input) && isFinite(input) && !isNaN(parseFloat(input));
        },

        /** Is function.     @param {Any} input @return {Bool} */
        isFunction: function(input) {
            return (typeof input == 'function');
        },

        /** Is array.        @param {Any} input @return {Bool} */
        isArray: function(input) {
            return Array.isArray(input);
        },

        /** Is object.       @param {Any} input @return {Bool} */
        isObject: function(input) {
            return input && (input.constructor == Object);
        },

        /** Is int.          @param {Any} input @return {Bool} */
        isInt: function(input) {
            return $.isNumber(input) && (input % 1 == 0 && input != 1.0);
        },

        /** Is float.        @param {Any} input @return {Bool} */
        isFloat: function(input) {
            return $.isNumber(input) && (input % 1 != 0 || input == 1.0);
        },

        /** Is iterable.     @param {Any} input @return {Bool} */
        isIterable: function(input) {
            return $.isArray(input) || $.isObject(input) || (input &&
                    (input.length && !input[NAME_NODE_TYPE]) // dom, nodelist, string etc.
                 || (input.constructor && input.constructor.name == 'List') // list
            );
        },

        /** Is primitive.    @param {Any} input @return {Bool} */
        isPrimitive: function(input) {
            return $.isVoid(input) || /^(string|number|boolean)$/.test(typeof input);
        },

        /** Is window.       @param {Any} input @return {Bool} */
        isWindow: function(input) {
            return toBool(input && input == input[NAME_WINDOW]
                && input.top == input[NAME_WINDOW].top
                && input.location == input[NAME_WINDOW].location);
        },

        /** Is document.     @param {Any} input @return {Bool} */
        isDocument: function(input) {
            return toBool(input && input[NAME_NODE_TYPE] === NODE_TYPE_DOCUMENT);
        },

        /** Is node.         @param {Any} input @return {Bool} */
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
     * To trim chars.
     * @param  {String|undefined} chars
     * @param  {Boolean}          opt_isLeft
     * @return {String}
     * @private
     */
    function toTrimRegExp(chars, opt_isLeft) {
        return new RegExp((opt_isLeft ? '^[%s]+' : '[%s]+$')
            .format(chars ? chars.replace(/([\[\]\\])/g, '\\$1') : '\\s'));
    }

    /**
     * To search stuff.
     * @param  {String}  str
     * @param  {String}  search
     * @param  {Integer} index
     * @param  {Boolean} opt_noCase @optional
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
         * @return {Int|null}
         */
        toInt: function(base, str) {
            return $.isNumeric(str = toString(this))
                ? parseInt(str.replace(/^-?\./, '0.'), base || 10) : NULL;
        },

        /**
         * To float.
         * @param  {String} str @internal
         * @return {Float|null}
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
         * Trim.
         * @param  {String|undefined} chars @optional
         * @return {String}
         * @override For chars option.
         */
        trim: function(chars) {
            return this.trimLeft(chars).trimRight(chars);
        },

        /**
         * Starts with.
         * @param  {String} search
         * @param  {Int}    index
         * @param  {Bool}   opt_noCase @optional
         * @param  {String} str        @internal
         * @return {Bool}
         * @override For no-case option.
         */
        startsWith: function(search, index, opt_noCase, str) {
            return (str = toSearchStuff(this, search, index, opt_noCase))
                && str.ss === str.s.substr(str.i || 0, str.ss.length);
        },

        /**
         * Ends with.
         * @param  {String} search
         * @param  {Int}    index
         * @param  {Bool}   opt_noCase @optional
         * @param  {String} str        @internal
         * @return {Bool}
         * @override For no-case option.
         */
        endsWith: function(search, index, opt_noCase, str) {
            return (str = toSearchStuff(this, search, index, opt_noCase))
                && str.ss === str.s.substr(0, str.i || str.ss.length);
        },

        /**
         * Contains.
         * @param  {String} search
         * @param  {Int}    index
         * @param  {Bool}   opt_noCase  @optional
         * @param  {String} str         @internal
         * @return {Bool}
         */
        contains: function(search, index, opt_noCase, str) {
            return (str = toSearchStuff(this, search, index, opt_noCase))
                && str.s !== str.s.split(str.ss)[0];
        }
    });

    // internal vars
    var _uuid = 0,
        fn_slice = [].slice,
        fn_toString = {}.toString,
        constants = {}
    ;

    /**
     * Array.
     * @param  {Any} input
     * @return {Array}
     */
    function makeArray(input) {
        var ret = [], inputType = $.typeOf(input);

        if (inputType == 'array') {
            return input;
        }

        if (!input || inputType == 'string' || inputType == 'window'
            || input[NAME_NODE_TYPE] || $.isVoid(input.length)) {
            ret = [input];
        } else {
            ret = fn_slice.call(input);
        }

        return ret;
    }

    /**
     * so: base functions.
     */
    extend($, {
        /**
         * Log.
         * @return {void}
         */
        log: function() {
            log.apply(NULL, ['>> so:'].concat(fn_slice.call(arguments)));
        },

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
            return (str == NULL) ? NULLS : str.trim(chars);
        },

        /**
         * Trim left.
         * @param  {String}           str
         * @param  {String|undefined} chars @optional
         * @return {String}
         */
        trimLeft: function(str, chars) {
            return (str == NULL) ? NULLS : str.trimLeft(chars);
        },

        /**
         * Trim right.
         * @param  {String}           str
         * @param  {String|undefined} chars @optional
         * @return {String}
         */
        trimRight: function(str, chars) {
            return (str == NULL) ? NULLS : str.trimRight(chars);
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
        typeOf: function(input) {
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
         * Value of.
         * @param  {Any} input
         * @return {Any}
         */
        valueOf: function(input) {
            return valueOf(input);
        },

        /**
         * Is set.
         * @param  {Any}    input
         * @param  {String} opt_key @optional
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
                || ($.isNumber(input.length) && !input.length)
                || ($.isObject(input) && !Object.keys(input).length);
        },

        /**
         * For each.
         * @param  {Array|Object} input
         * @param  {Function}     fn
         * @param  {Object}       opt__this @optional
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
         * @param  {Array}        opt_keysExclude @optional
         * @return {Array|Object}
         */
        copy: function(input, opt_keysExclude) {
            var ret = $.isArray(input) ? [] : {}, keys = opt_keysExclude || [];

            forEach(input, function(value, key) {
                if (keys.indexOf(key) < 0) {
                    ret[key] = value;
                }
            });

            return ret;
        },

        /**
         * Extend.
         * @param  {Any} target
         * @param  {Any} source
         * @usage  $.extend(target, source)
         * @usage  $.extend('@x', ...), $.extend('@', {x: ...}) @self
         * @return {Any}
         */
        extend: function(target, source) {
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

            // any extend
            return extend.apply(NULL, [target, source].concat(fn_slice.call(arguments, 2)));
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
         * List
         * @param  {Array|Object} data
         * @param  {Object}       options
         * @return {List}
         */
        list: function(data, options) {
            return new List(data, options);
        },

        /**
         * Alist.
         * @param  {Array}  data
         * @param  {Object} options
         * @return {ArrayList}
         */
        alist: function(data, options) {
            return new ArrayList(data, options);
        },

        /**
         * Olist.
         * @param  {Object} data
         * @param  {Object} options
         * @return {ObjectList}
         */
        olist: function(data, options) {
            return new ObjectList(data, options);
        },

        /**
         * Pick.
         * @param  {Array|Object} input
         * @param  {String}       key
         * @param  {Any}          opt_defaultValue
         * @return {Any|undefined}
         * @throws
         */
        pick: function(input, key, opt_defaultValue) {
            var value = opt_defaultValue;

            if (key in input) {
                value = input[key];
                delete input[key];

                if ($.isArray(input)) {
                    input.sort(); // fix keys
                }
            }

            return value;
        },

        toString: function(name, opt_object) {
            throw '@todo Remove method $.toString()!';
        },

        /**
         * Is constant.
         * @param  {String} name
         * @return {Boolean}
         */
        isConstant: function(name) {
            return (name in constants);
        },

        /**
         * Set constant.
         * @param  {String} name
         * @param  {Any}    value
         * @return {void}
         * @throws
         */
        setConstant: function(name, value) {
            if ($.isConstant(name)) {
                throw ('Constant "'+ name +'" already defined!');
            }
            constants[name] = value;
        },

        /**
         * Get constant.
         * @param  {String} name
         * @return {Any}
         */
        getConstant: function(name) {
            return constants[name];
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

    // list types
    var TYPE_ARRAY_LIST = 'ArrayList',
        TYPE_OBJECT_LIST = 'ObjectList';

    /**
     * List.
     * @param  {Array|Object|undefined} data
     * @param  {Object|undefined}       options @optional
     * @return {List}
     * @private
     */
    function List(data, options) {
        var _this = this;
        _this.options = extend({type: undefined, weak: TRUE /* @todo */}, options);

        if (data == NULL) {
            if (_this.options.type == TYPE_ARRAY_LIST) {
                data = [];
            } else if (_this.options.type == TYPE_OBJECT_LIST) {
                data = {};
            }
        }

        _this.setData(data);
    }

    extend(List[NAME_PROTOTYPE], {
        /**
         * Set data.
         * @param {Array|Object} data
         */
        setData: function(data) {
            var _this = this;

            if ($.isArray(data)) {
                _this.type = TYPE_ARRAY_LIST;
            } else if ($.isObject(data)) {
                _this.type = TYPE_OBJECT_LIST;
            } else {
                throw ('Only Array\'s or Object\'s accepted for List.');
            }

            _this.data = $.copy(data);
            _this.dataSize = 0;
            // update size
            forEach(data, function() { _this.dataSize++; });

            return _this;
        },

        /**
         * Get data.
         * @return {Array|Object}
         */
        getData: function() {
            return this.data;
        },

        /**
         * Size.
         * @return {Int}
         */
        size: function() {
            return this.dataSize;
        },

        /**
         * Set.
         * @param {Int|String} key
         * @param {Any} value
         */
        set: function(key, value) {
            var _this = this;

            _this.data[(key != NULL ? key : _this.dataSize++)] = value;

            return _this;
        },

        /**
         * Get.
         * @param  {Int|String} key
         * @param  {Any}        opt_defaultValue @optional
         * @return {Any}
         */
        get: function(key, opt_defaultValue) {
            var _this = this;

            return _this.hasKey(key) ? _this.data[key] : opt_defaultValue;
        },

        /**
         * Remove.
         * @param  {Int|String} key
         * @return {this}
         */
        remove: function(key) {
            var _this = this;

            $.pick(_this.data, key);

            return _this;
        },

        /**
         * Replace.
         * @param  {Any} searchValue
         * @param  {Any} replaceValue
         * @return {this}
         */
        replace: function(searchValue, replaceValue) {
            var _this = this;

            forEach(_this.data, function(value, key) {
                if (value === searchValue) {
                    _this.data[key] = replaceValue;
                }
            });

            return _this;
        },

        /**
         * Empty.
         * @return {this}
         */
        empty: function() {
            var _this = this;

            _this.data = _this.isArrayList() ? [] : {};
            _this.dataSize = 0;

            return _this;
        },

        /**
         * Keys.
         * @return {Array}
         */
        keys: function() {
            return this.reduce([], function(_, key, __, ret) {
                return ret.concat(key);
            });
        },

        /**
         * Values.
         * @return {Array}
         */
        values: function() {
            return this.reduce([], function(value, _, __, ret) {
                return ret.concat(value);
            });
        },

        /**
         * Has.
         * @param  {Any}      searchValue
         * @param  {Boolean}  strict @default=true
         * @return {Boolean}
         */
        has: function(searchValue, strict) {
            var ret = FALSE;

            forEach(this.data, function(value) {
                if (strict !== FALSE ? value === searchValue : value == searchValue) {
                    ret = TRUE; return 0; // break
                }
            });

            return ret;
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
         * Index.
         * @param  {Int|String} searchKey
         * @return {Int}
         */
        index: function(searchKey) {
            if (this.isArrayList()) {
                return searchKey;
            }

            var ret = -1;
            forEach(this.data, function(_, key, i) {
                if (key === searchKey) {
                    ret = i; return 0; // break
                }
            });

            return ret;
        },

        /**
         * Append.
         * @param  {Any}    value
         * @param  {String} opt_key @optional For objects.
         * @return {this}
         */
        append: function(value, opt_key) {
            return this.set(opt_key, value);
        },

        /**
         * Prepend.
         * @param  {Any}    value
         * @param  {String} opt_key @optional For objects.
         * @return {this}
         */
        prepend: function(value, opt_key) {
            return this.set(this.isArrayList() ? NULL : opt_key, value);
        },

        /**
         * Pop.
         * @return {Any}
         */
        pop: function() {
            var _this = this;

            return _this.isArrayList() ? _this.data.pop() : _this.pick(_this.keys().pop());
        },

        /**
         * Top.
         * @return {any}
         */
        top: function() {
            var _this = this;

            return _this.isArrayList() ? _this.data.shift() : _this.pick(_this.keys().shift());
        },

        /**
         * Find.
         * @param  {Any}     searchValue
         * @param  {Any}     opt_defaultValue
         * @param  {Boolean} opt_returnIndex
         * @return {Any}
         */
        find: function(searchValue, opt_defaultValue, opt_returnIndex) {
            var _this = this, test = searchValue, ret = opt_defaultValue;

            // make test function
            if (!$.isFunction(searchValue)) {
                test = function(value) { return value === searchValue; };
            }

            forEach(_this.data, function(value, _, i) {
                if (test(value)) {
                    ret = opt_returnIndex ? i : value; return 0; // break
                }
            });

            return ret;
        },

        /**
         * Find index.
         * @param  {Any} searchValue
         * @param  {Any} opt_defaultValue
         * @return {Any}
         */
        findIndex: function(searchValue, opt_defaultValue) {
            return this.find(searchValue, opt_defaultValue, TRUE)
        },

        /**
         * Pick.
         * @param  {Any} key
         * @param  {Any} opt_defaultValue
         * @return {this}
         */
        pick: function(key, opt_defaultValue) {
            return $.pick(_this.data, key, opt_defaultValue);
        },

        /**
         * Copy.
         * @return {List}
         */
        copy: function() {
            return new List(this.data);
        },

        /**
         * For.
         * @param  {Function} fn
         * @return {this}
         */
        for: function(fn) {
            return forEach(this.data, fn, this);
        },

        /**
         * For each.
         * @param  {Function} fn
         * @return {this}
         */
        forEach: function(fn) {
            var _this = this, i = 0, key;

            for (key in _this.data) {
                if (_this.data.hasOwnProperty(key)) {
                    if (fn.call(_this, key, _this.data[key], i++) === 0) {
                        break;
                    }
                }
            }

            return _this;
        },

        /**
         * Map.
         * @param  {Function} fn
         * @return {this}
         */
        map: function(fn) {
            var _this = this;

            return _this.for(function(value, key, i) {
                _this.data[key] = fn(value, key, i);
            });
        },

        /**
         * Reduce.
         * @param  {Any}      inValue
         * @param  {Function} fn
         * @return {Any}
         */
        reduce: function(inValue, fn) {
            this.for(function(value, key, i) {
                inValue = fn(value, key, i, inValue);
            });

            return inValue;
        },

        /**
         * Filter.
         * @param  {Function} fn
         * @return {this}
         */
        filter: function(fn) {
            var _this = this;

            // set default
            fn = fn || function(value) { return !!value; };

            _this.for(function(value, key, i) {
                if (!fn(value, key, i)) {
                    _this.remove(key);
                }
            });

            return _this;
        },

        /**
         * Uniq.
         * @return {this}
         */
        uniq: function() {
            var _this = this, list = new List();

            _this.for(function(value, key) {
                if (!list.has(value)) {
                    list.set(key, value);
                }
            });

            return _this.setData(list.data);
        },

        /**
         * Revers.
         * @return {this}
         */
        reverse: function() {
            var _this = this, data, keys;

            if (_this.isArrayList()) {
                data = _this.data.reverse();
            } else {
                data = {}, keys = _this.keys().reverse();
                forEach(keys, function(key) {
                    data[key] = _this.data[key];
                });
            }

            return _this.setData(data);
        },

        /**
         * First.
         * @param  {Any} opt_defaultValue @optional
         * @return {Any}
         */
        first: function(opt_defaultValue) {
            this.for(function(value) {
                opt_defaultValue = value; return 0; //break
            });

            return opt_defaultValue;
        },

        /**
         * Last.
         * @param  {Any} opt_defaultValue
         * @return {Any}
         */
        last: function(opt_defaultValue) {
            this.copy().reverse().for(function(value, key) {
                opt_defaultValue = value; return 0; //break
            });

            return opt_defaultValue;
        },

        /**
         * Is empty.
         * @return {Boolean}
         */
        isEmpty: function() { return !this.dataSize; },

        /**
         * Is list array.
         * @return {Boolean}
         */
        isArrayList: function() { return this.type == TYPE_ARRAY_LIST; },

        /**
         * Is list object.
         * @return {Boolean}
         */
        isObjectList: function() { return this.type == TYPE_OBJECT_LIST; },

        /**
         * To string
         * @return {String}
         */
        toString: function() { return JSON.stringify(this.data); }
    });

    /**
     * List Array.
     * @param {Array|Object|undefined} data
     * @param {Object|undefined}       options @optional
     * @throws
     * @private
     */
    function ArrayList(data, options) {
        data = data || [];

        if (!$.isArray(data)) {
            throw ('Only Array\'s accepted for ArrayList.');
        }

        this.super(data, options);
    }

    /**
     * List Object.
     * @param {Array|Object|undefined} data
     * @param {Object|undefined}       options @optional
     * @throws
     * @private
     */
    function ObjectList(data, options) {
        data = data || {};

        if (!$.isObject(data)) {
            throw ('Only Object\'s accepted for ObjectList.');
        }

        this.super(data, options);
    }

    // extend lists
    $.class(ArrayList).extends(List);
    $.class(ObjectList).extends(List);

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
     * @param  {Document|undefined} document @optional
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
