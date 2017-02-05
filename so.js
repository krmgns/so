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

    // for minify advantage
    var NULL = null, NULLS = '',
        TRUE = true, FALSE = false,

        NAME_WINDOW = 'window',
        NAME_DOCUMENT = 'document',
        NAME_OWNER_DOCUMENT = 'ownerDocument',
        NAME_DEFAULT_VIEW = 'defaultView',
        NAME_PROTOTYPE = 'prototype',
        NODE_TYPE = 'nodeType',

        NODE_TYPE_ELEMENT = 1,
        NODE_TYPE_DOCUMENT = 9,
        NODE_TYPE_DOCUMENT_FRAGMENT = 11
    ;

    /**
     * Shortcut for 'so'.
     * @type {Object}
     */
    var $ = {};

    // globals
    // $.window = window;
    window.so = $;
    window.so.VERSION = '5.0.0';
    window[NAME_DOCUMENT][NAME_WINDOW] = window;

    /**
     * Value of.
     * @param  {Any} input
     * @return {Any}
     * @private
     */
    function valueOf(input) {
        return (input && input.valueOf) ? input.valueOf() : input;
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
        return valueOf(input).toString();
    }

    /**
     * Extend.
     * @param  {Object} ...arguments
     * @return {Object}
     * @private
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
     * @private
     */
    function forEach(input, fn, opt_scope) {
        var len = input && input.length, i;

        if (len != NULL) { // array: value => i
            for (i = 0; i < len; i++) {
                if (FALSE === fn.call(opt_scope || input[i], input[i], i, input)) {
                    break;
                }
            }
        } else { // object: key => value
            for (i in input) {
                if (input.hasOwnProperty(i)) {
                    if (FALSE === fn.call(opt_scope || input[i], i, input[i], input)) {
                        break;
                    }
                }
            }
        }

        return opt_scope || input;
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
            Constructor[NAME_PROTOTYPE] = Object.create(prototype, {
                constructor: {value: createConstructor(
                    'var Constructor = function '+ name +'(){}; ' +
                    'Constructor[NAME_PROTOTYPE] = prototype;' +
                    'Constructor[NAME_PROTOTYPE].constructor = Constructor;' +
                    'return Constructor;'
                )}
            });

            return Constructor;
        },

        /**
         * Extends.
         * @param  {Function} supClass
         * @param  {Object}   prototype
         * @usage  $.class(Foo).extends(FooBase)
         * @usage  $.class(Foo).extends(FooBase, {...})
         * @return {Function}
         */
        extends: function(supClass, prototype) {
            if (supClass) {
                subClass[NAME_PROTOTYPE] = Object.create(supClass[NAME_PROTOTYPE], {
                    constructor: {value: subClass},
                          super: {value: supClass}
                });
            }

            // add subClass prototype if provided
            prototype && forEach(prototype, function(name, value) {
                subClass[NAME_PROTOTYPE][name] = value;
            });

            return subClass;
        }
    }};

    // add shortcut for create without ()'s.
    $.class.create = $.class().create;

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
            return !$.isVoid(input) && !$.isNulls(input)
                && isFinite(input) && !isNaN(parseFloat(input));
        },

        /** Is function.     @param {Any} input @return {Bool} */
        isFunction: function(input) {
            return (typeof input == 'function');
        },

        /** Is array.        @param {Any} input @return {Bool} */
        isArray: function(input) {
            return input && (input.constructor == Array);
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
            return $.isArray(input) || $.isObject(input)
                || (input && input.length && !input[NODE_TYPE]); // dom, nodelist, string etc.
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
            return toBool(input && input[NODE_TYPE] === NODE_TYPE_DOCUMENT);
        },

        /** Is node.         @param {Any} input @return {Bool} */
        isNode: function(input) {
            return toBool(input && (input[NODE_TYPE] === NODE_TYPE_ELEMENT
                                 || input[NODE_TYPE] === NODE_TYPE_DOCUMENT_FRAGMENT));
        },

        /** Is node element. @param {Any} input @return {Bool} */
        isNodeElement: function(input) {
            return toBool(input && input[NODE_TYPE] === NODE_TYPE_ELEMENT);
        }
    });

    /**
     * Array extends.
     */
    extend(Array[NAME_PROTOTYPE], {
        /**
         * Select.
         * @param  {Function} fn
         * @return {Array}
         */
        select: function(fn) {
            var ret = [];
            return this.reduce(function(ret, value) {
                if (fn(value)) {
                    return ret.concat([value]);
                } else {
                    return ret;
                }
            }, ret);
        },

        /**
         * Uniq.
         * @return {Array}
         */
        uniq: function() {
            var ret = [];
            return this.reduce(function(ret, value) {
                if (ret.indexOf(value) < 0) {
                    return ret.concat([value]);
                } else {
                    return ret;
                }
            }, ret);
        }
    });

    /**
     * Object extends.
     */
    extend(Object[NAME_PROTOTYPE], {
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
     * To trim chars.
     * @param  {String|void} chars
     * @param  {Boolean}     opt_isLeft
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
         * @return {Int|void}
         */
        toInt: function(base, str) {
            return $.isNumeric(str = toString(this))
                ? parseInt(str.replace(/^-?\./, '0.'), base || 10) : NULL;
        },

        /**
         * To float.
         * @param  {String} str @internal
         * @return {Float|void}
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
         * @param  {String|void} chars @optional
         * @return {String}
         * @override
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
         * @param  {String|void} chars @optional
         * @return {String}
         * @override
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
         * @param  {String|void} chars @optional
         * @return {String}
         * @override
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
         * @override
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
         * @override
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
         * Get window.
         * @param  {Any} node
         * @return {Window|undefined}
         */
        getWindow: function(node) {
            var ret;

            if (node) {
                if ($.isNode(node)) {
                    ret = node[NAME_OWNER_DOCUMENT][NAME_DEFAULT_VIEW]; // node document window
                } else if ($.isDocument(node)) {
                    ret = node[NAME_DEFAULT_VIEW]; // document window
                } else if ($.isWindow(node)) {
                    ret = node;
                }
            } else {
                ret = window;
            }

            return ret;
        },

        /**
         * Get document.
         * @param  {Any} node
         * @return {Document|undefined}
         */
        getDocument: function(node) {
            var ret;

            if (node) {
                if (node[NAME_OWNER_DOCUMENT]) { // document or node
                    ret = node[NAME_OWNER_DOCUMENT];
                } else if (node[NAME_DOCUMENT]) {
                    ret = node[NAME_DOCUMENT]; // window
                } else if ($.isDocument(node)) {
                    ret = node;
                }
            } else {
                ret = window[NAME_DOCUMENT];
            }

            return ret;
        },

        /**
         * Trim.
         * @param  {String}      str
         * @param  {String|void} chars @optional
         * @return {String}
         */
        trim: function(str, chars) {
            return (str == NULL) ? NULLS : str.trim(chars);
        },

        /**
         * Trim left.
         * @param  {String}      str
         * @param  {String|void} chars @optional
         * @return {String}
         */
        trimLeft: function(str, chars) {
            return (str == NULL) ? NULLS : str.trimLeft(chars);
        },

        /**
         * Trim right.
         * @param  {String}      str
         * @param  {String|void} chars @optional
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
            if ($.isObject(input)) {
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
         * @param  {Object}       opt_scope @optional
         * @return {Array|Object}
         * @private
         */
        forEach: function(input, fn, opt_scope) {
            return forEach(input, fn, opt_scope);
        },

        mix: function() {
            throw '@todo Remove method $.mix()!';
        },

        /**
         * Extend.
         * @param  {Any} target
         * @param  {Any} source
         * @usage  $.extend('foo', ...)
         * @usage  $.extend('foo.bar', ...)
         * @return {Any}
         */
        extend: function(target, source) {
            // self extend
            if ($.isObject(target) && $.isUndefined(source)) {
                return extend($, target);
            }

            // self extend
            if ($.isString(target)) {
                var tmp = target.split('.'), property = tmp[0], propertyProperty = tmp[1],
                    target = $[property] || {};

                if (!propertyProperty) {
                    target[property] = source;
                } else {
                    (target[NAME_PROTOTYPE] || target)[propertyProperty] = source;
                }

                return extend($, target);
            }

            // any extend
            return extend.apply(NULL, [target, source].concat(fn_slice.call(arguments, 2)));
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
     * @param  {Function}      callback
     * @param  {Document|void} document @optional
     * @return {void}
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
