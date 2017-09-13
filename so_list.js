/**
 * @package so
 * @object  so.list
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function($, undefined) { 'use strict';

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

    List.extendPrototype({
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
            return key = (key != null ? key : this.size), !(key in this.data) && this.size++,
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
         * Append (alias of append()).
         * @param  {Any} value
         * @return {this}
         */
        add: function(value) {
            return this.append(value);
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
         * @param  {Any}  search
         * @param  {Bool} strict
         * @return {Bool}
         */
        has: function(search, strict) {
            return $.has(this.data, search, strict);
        },

        /**
         * Has key.
         * @param  {Int|String} key
         * @return {Bool}
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
            return this.set(null, value);
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
                    ret = opt_return == null ? value : opt_return == 0 ? key : i;
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

            $.forEach($.array(arguments), function(key) {
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
         * @param  {List}   list
         * @param  {Object} options
         * @return {List}
         */
        copyTo: function(list, options) {
            return list.init(this.data, options);
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
            fn = fn || function() { return true; }; // set default tester

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
         * @return {Bool}
         */
        isEmpty: function() {
            return !this.size;
        }
    });

    /**
     * List.
     * @param  {Iterable} data
     * @param  {Object}   options
     * @return {List}
     */
    $.list = function(data, options) {
        return new List(data, options);
    };

    /**
     * Is list.
     * @param  {Any} input
     * @return {Bool}
     */
    $.isList = function(input) {
        return input && (input instanceof List);
    };

})(so);
