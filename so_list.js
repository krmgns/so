/**
 * @package so
 * @object  so.list
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function($, NULL, TRUE, FALSE, UNDEFINED) { 'use strict';

    var $extend = $.extend, $for = $.for, $forEach = $.forEach, $bool = $.bool;
    var _break = 0;

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

    $extend(List.prototype, {
        /**
         * Init.
         * @param  {Iterable} data
         * @param  {Object}   options
         * @return {self}
         */
        init: function(data, options) {
            if (!$.isIterable(data)) {
                throw ('No iterable object given.');
            }

            var type = $.type(data);
            if (data instanceof List) {
                type = data.type;
                data = data.data;
            }

            options = $.options({type: type}, options);

            this.type = options.type;
            this.data = {};
            this.size = 0;

            $forEach(data, function(key, value) {
                this.data[key] = value;
                this.size++; // why naming as 'length' sucks?!
            }, this);

            return this;
        },

        /**
         * For.
         * @param  {Function} fn
         * @return {self}
         */
        for: function(fn) {
            return $for(this.data, fn, this);
        },

        /**
         * For each.
         * @param  {Function} fn
         * @return {self}
         */
        forEach: function(fn) {
            return $forEach(this.data, fn, this);
        },

        /**
         * Set.
         * @param  {Int|String} key?
         * @param  {Any}        value
         * @return {self}
         */
        set: function(key, value) {
            var _this = this, key = (key != NULL) ? key : _this.size;

            if (!(key in _this.data)) { // increase size
                _this.size++;
            }
            _this.data[key] = value;

            return _this;
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
         * @return {self}
         */
        add: function(value) {
            return this.append(value);
        },

        /**
         * Remove.
         * @param  {Any} value
         * @return {self}
         */
        remove: function(value) {
            return this.pull(this.findIndex(value)), this;
        },

        /**
         * Remove at.
         * @param  {Int|String} key
         * @return {self}
         */
        removeAt: function(key) {
            return this.pull(key), this;
        },

        /**
         * Replace.
         * @param  {Any} searchValue
         * @param  {Any} replaceValue
         * @return {self}
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
         * @return {self}
         */
        replaceAt: function(key, replaceValue) {
            return this.data[key] = replaceValue, this;
        },

        /**
         * Empty.
         * @return {self}
         */
        empty: function() {
            return this.data = {}, this.size = 0, this;
        },

        /**
         * Keys.
         * @return {Array}
         */
        keys: function() {
            return Object.keys(this.data);
        },

        /**
         * Values.
         * @return {Array}
         */
        values: function() {
            return Object.values(this.data);
        },

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
         * @return {self}
         */
        append: function(value) {
            return this.set(NULL, value);
        },

        /**
         * Prepend.
         * @param  {Any} value
         * @return {self}
         */
        prepend: function(value) {
            var data = {0: value};

            this.forEach(function(key, value) {
                if ($.isNumeric(key)) {
                    key++; // push key
                }
                data[key] = value;
            })

            return this.init(data, {type: this.type}); // reset data
        },

        /**
         * Top.
         * @return {Any}
         */
        top: function() {
            return this.pull(this.keys().shift());
        },

        /**
         * Pop.
         * @return {Any}
         */
        pop: function() {
            return this.pull(this.keys().pop());
        },

        /**
         * Find.
         * @param  {Any} searchValue
         * @param  {Int} opt_returnKey?
         * @return {Any|undefined}
         */
        find: function(searchValue, opt_returnKey) {
            var ret, fn = searchValue;

            // make test function
            if (!$.isFunction(fn)) {
                fn = function(key, value) { return value === searchValue; };
            }

            this.forEach(function(key, value, i) {
                if (fn(key, value)) {
                    ret = opt_returnKey ? key : value;
                    return _break;
                }
            });

            return ret;
        },

        /**
         * Find index (key).
         * @param  {Any} searchValue
         * @return {String|undefined}
         */
        findIndex: function(searchValue) {
            return this.find(searchValue, TRUE);
        },

        /**
         * Push (alias of append()).
         * @param  {Any} value
         * @return {self}
         */
        push: function(value) {
            return this.append(value);
        },

        /**
         * Push all.
         * @param  {Any} ...arguments
         * @return {self}
         */
        pushAll: function() {
            return $for(arguments, function(value) {
                this.append(value);
            }, this);
        },

        /**
         * Pull.
         * @param  {Any} key
         * @return {Any|undefined}
         */
        pull: function(key) {
            var _this = this, data = {}, ret;

            if (key in _this.data) {
                ret = _this.data[key];
                // delete key and decrease size
                delete _this.data[key], _this.size--;

                // reset data with indexes
                if (_this.type != 'object') {
                    $for(_this.data, function(value, i) {
                        data[i] = value;
                    });
                    _this.data = data;
                }
            }

            return ret;
        },

        /**
         * Pull all.
         * @param  {Object} ...arguments (keys)
         * @return {Object}
         */
        pullAll: function() {
            var _this = this, data = {}, ret = {}, i = 0;

            $for(arguments, function(key) {
                ret[i] = UNDEFINED;
                if (key in _this.data) {
                    ret[i] = _this.data[key];
                    // delete key and decrease size
                    delete _this.data[key], _this.size--, i++;
                }
            });

            // reset data with indexes
            if (_this.type != 'object' && !$.isEmpty(ret)) {
                $for(_this.values(), function(value, i) {
                    data[i] = value;
                });
                _this.data = data;
            }

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
         * @param  {Function} fn?
         * @return {List}
         */
        filter: function(fn) {
            var data = {};
            fn = fn || function(value) { return $bool(value); }; // set default tester

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
            return $.list(this.values().uniq(), {type: this.type});
        },

        /**
         * Ununiq.
         * @return {List}
         */
        ununiq: function() {
            return $.list(this.values().ununiq(), {type: this.type});
        },

        /**
         * Reverse.
         * @return {List}
         */
        reverse: function() {
            var _this = this, data = {};

            if (_this.type == 'array' || _this.type == 'string') {
                data = _this.values().reverse(); // keys also will be reversed
            } else {
                _this.keys().reverse().forEach(function(key) {
                    data[key] = _this.data[key];
                });
            }

            return (_this.data = data), _this
        },

        /**
         * Test (alike Array.some()).
         * @param  {Function} fn
         * @return {Bool}
         */
        test: function(fn) {
            var ret = FALSE;

            this.forEach(function(key, value, i) {
                if (fn(value, key, i)) {
                    return (ret = TRUE), _break;
                }
            });

            return ret;
        },

        /**
         * Test all (alike Array.every()).
         * @param  {Function} fn
         * @return {Bool}
         */
        testAll: function(fn) {
            var ret = TRUE;

            this.forEach(function(key, value, i) {
                if (!fn(value, key, i)) {
                    return (ret = FALSE), _break;
                }
            });

            return ret;
        },

        /**
         * Sort.
         * @param  {Function} fn?
         * @return {self}
         */
        sort: function(fn) {
            var data = {};

            $forEach(this.values().sort(fn), function(key, value) {
                data[key] = value;
            });

            return this.init(data, {type: this.type}); // reset data
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
        return $bool(input && input instanceof List);
    };

})(window.so, null, true, false);
