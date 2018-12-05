/**
 * @package so
 * @object  so.list
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function($, UNDEFINED) { 'use strict';

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

    $.extendPrototype(List, {
        /**
         * Init.
         * @param  {Iterable} data
         * @param  {Object}   options
         * @return {this}
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
         * Set.
         * @param  {Int|String|null} key
         * @param  {Any} value
         * @return {this}
         */
        set: function(key, value) {
            key = key != null ? key : this.size;

            if (!(key in this.data)) { // increase size
                this.size++;
            }
            this.data[key] = value;

            return this;
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

            this.forEach(function(key, value) {
                if ($.isNumeric(key)) {
                    key++; // push key
                }
                data[key] = value;
            })

            return this.init(data); // reset data
        },

        /**
         * Pop.
         * @return {Any}
         */
        pop: function() { return this.pick(this.keys().pop()); },

        /**
         * Top.
         * @return {Any}
         */
        top: function() { return this.pick(this.keys().shift()); },

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
                    ret = opt_return == null ? value : opt_return == 1 ? key : i;
                    return 0; // break
                }
            });

            return ret;
        },

        /**
         * Find key (by).
         * @param  {Any} searchValue
         * @return {String?}
         */
        findKey: function(searchValue) {
            return this.find(searchValue, UNDEFINED, 1);
        },

        /**
         * Find index (by).
         * @param  {Any} searchValue
         * @return {Int?}
         */
        findIndex: function(searchValue) {
            return this.find(searchValue, UNDEFINED, 2);
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
                ret = this.data[key];
                delete this.data[key], this.size--; // delete and increase size
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
                    ret[key] = this.data[key];
                    delete this.data[key], this.size--; // delete and increase size
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
            return $.list(this, options);
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
         * @return {List}
         */
        map: function(fn) {
            var data = {};

            this.forEach(function(key, value, i) {
                data[key] = fn(value, key, i);
            });

            return $.list(data, {type: this.type});
        },

        /**
         * Reduce.
         * @param  {Any}      initialValue
         * @param  {Function} fn
         * @return {Any}
         */
        reduce: function(initialValue, fn) {
            this.forEach(function(key, value, i) {
                initialValue = fn(value, key, i, initialValue);
            });

            return initialValue;
        },

        /**
         * Filter.
         * @param  {Function?} fn
         * @return {List}
         */
        filter: function(fn) {
            var data = {};
            fn = fn || function(value) { return !!value; }; // set default tester

            this.forEach(function(key, value, i) {
                if (fn(value, key, i)) {
                    data[key] = value;
                }
            });

            return $.list(data, {type: this.type});
        },

        /**
         * Uniq.
         * @return {List}
         */
        uniq: function() {
            var data = {}, values = [];

            this.forEach(function(key, value) {
                if (!~values.indexOf(value)) {
                    data[key] = value, values.push(value);
                }
            });

            return $.list(data, {type: this.type});
        },

        /**
         * Reverse.
         * @return {List}
         */
        reverse: function() {
            var data = {};

            if (this.type == 'array' || this.type == 'string') {
                data = this.values().reverse(); // keys also will be reversed..
            } else {
                var _this = this;
                this.keys().reverse().forEach(function(key) {
                    data[key] = _this.data[key];
                });
            }

            return $.list(data, {type: this.type});
        },

        /**
         * First.
         * @return {Any}
         */
        first: function() {
            return this.data[this.keys()[0]];
        },

        /**
         * Last.
         * @return {Any}
         */
        last: function() {
            return this.data[this.keys()[this.size - 1]];
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
        return !!(input && input instanceof List);
    };

})(window.so);
