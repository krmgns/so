/**
 * @package so
 * @object  so.list
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function($) { 'use strict';

    var $for = $.for, $forEach = $.forEach, $bool = $.bool;
    var fn_slice = [].slice;
    var _break = 0;

    function copyArray(array) {
        return fn_slice.call(array);
    }

    // https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
    function shuffle(items) {
        var ret = copyArray(items), i = ret.len() - 1, ir, tmp;
        for (i; i > 0; i--) {
            ir = ~~(Math.random() * (i + 1));
            tmp = ret[i], ret[i] = ret[ir], ret[ir] = tmp;
        }
        return ret;
    }

    function flip(items) {
        var ret = {};
        $forEach(items, function(key, value) {
            ret[value] = key;
        });
        return ret;
    }

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

    List.prototype = {
        /**
         * Init.
         * @param  {Iterable} data
         * @param  {Object}   options
         * @return {List}
         */
        init: function(data, options) {
            if (!$.isIterable(data)) {
                throw ('No iterable object.');
            }

            var type = $.type(data);
            if (data instanceof List) {
                type = data.type;
                data = data.data;
            }

            options = $.options({type: type}, options);

            var _this = this; // just as minify candy
            _this.type = options.type;
            _this.data = {};
            _this._len = 0;

            $forEach(data, function(key, value) {
                _this.data[key] = value;
                _this._len++; // why naming as 'length' sucks?!
            });

            return _this;
        },

        /**
         * For.
         * @param  {Function} fn
         * @return {List}
         */
        for: function(fn) {
            return $for(this.data, fn, this);
        },

        /**
         * For each.
         * @param  {Function} fn
         * @return {List}
         */
        forEach: function(fn) {
            return $forEach(this.data, fn, this);
        },

        /**
         * Set.
         * @param  {Int|String} key?
         * @param  {Any}        value
         * @return {List}
         */
        set: function(key, value) {
            var _this = this, key = (key != null) ? key : _this._len;

            if (!(key in _this.data)) { // increase size
                _this._len++;
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
         * @return {List}
         */
        add: function(value) {
            return this.append(value);
        },

        /**
         * Remove.
         * @param  {Any} value
         * @return {List}
         */
        remove: function(value) {
            return this.pull(this.findIndex(value)), this;
        },

        /**
         * Remove at.
         * @param  {Int|String} key
         * @return {List}
         */
        removeAt: function(key) {
            return this.pull(key), this;
        },

        /**
         * Replace.
         * @param  {Any} searchValue
         * @param  {Any} replaceValue
         * @return {List}
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
         * @return {List}
         */
        replaceAt: function(key, replaceValue) {
            return (this.data[key] = replaceValue), this;
        },

        /**
         * Empty.
         * @return {List}
         */
        empty: function() {
            return (this.data = {}, this._len = 0), this;
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
         * @return {List}
         */
        append: function(value) {
            return this.set(null, value);
        },

        /**
         * Prepend.
         * @param  {Any} value
         * @return {List}
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

            this.forEach(function(key, value) {
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
            return this.find(searchValue, true);
        },

        /**
         * Push (alias of append()).
         * @param  {Any} value
         * @return {List}
         */
        push: function(value) {
            return this.append(value);
        },

        /**
         * Push all.
         * @param  {Any} ...arguments
         * @return {List}
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
                delete _this.data[key], _this._len--;

                // reset data with indexes
                if (_this.type != 'object') {
                    $for(_this.values(), function(value, i) {
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
                ret[i] = undefined;
                if (key in _this.data) {
                    ret[i] = _this.data[key];
                    // delete key and decrease size
                    delete _this.data[key], _this._len--, i++;
                }
            });

            // reset data with indexes
            if (_this.type != 'object' && !$.empty(ret)) {
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

            if (_this.type == 'object') {
                _this.keys().reverse().forEach(function(key) {
                    data[key] = _this.data[key];
                });
            } else {
                data = _this.values().reverse(); // keys also will be reversed
            }

            return (_this.data = data), _this
        },

        /**
         * Rand.
         * @param  {Int} size
         * @return {Any}
         */
        rand: function(size) {
            var _this = this, values = shuffle(this.values()), ret = [], i = size = size || 1;

            while (i--) {
                ret[i] = values[i];
            }

            return size == 1 ? ret[0] : ret;
        },

        /**
         * Shuffle.
         * @return {List}
         */
        shuffle: function() {
            var _this = this, data = {}, keys, shuffledKeys, i;

            if (_this.type == 'object') {
                keys = _this.keys(), shuffledKeys = shuffle(_this.keys()), i = keys.len();
                while (i--) {
                    data[shuffledKeys[i]] = _this.data[keys[i]];
                }
            } else {
                data = shuffle(_this.values());
            }

            return $.list(data, {type: _this.type});
        },

        /**
         * Sort.
         * @param  {Function} fn?
         * @return {List}
         */
        sort: function(fn) {
            var _this = this, data = {}, flippedData;

            if (_this.type == 'object') {
                flippedData = flip(_this.data);
                $forEach(_this.values().sort(fn), function(key, value) {
                    data[flippedData[value]] = value;
                });
            } else {
                $forEach(_this.values().sort(fn), function(key, value) {
                    data[key] = value;
                });
            }

            return (_this.data = data), _this;
        },

        /**
         * Test (alike Array.some()).
         * @param  {Function} fn
         * @return {Bool}
         */
        test: function(fn) {
            var ret = false;

            this.forEach(function(key, value, i) {
                if (fn(value, key, i)) {
                    return (ret = true), _break;
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
            var ret = true;

            this.forEach(function(key, value, i) {
                if (!fn(value, key, i)) {
                    return (ret = false), _break;
                }
            });

            return ret;
        },

        /**
         * First.
         * @return {Any|undefined}
         */
        first: function() {
            return this.nth(1);
        },

        /**
         * Last.
         * @return {Any|undefined}
         */
        last: function() {
            return this.nth(this._len);
        },

        /**
         * Nth.
         * @param  {Int} i
         * @return {Any|undefined}
         */
        nth: function(i) {
            return this.data[this.keys()[i - 1]];
        },

        /**
         * Len.
         * @return {Int}
         */
        len: function() {
            return this._len;
        },

        /**
         * Is empty.
         * @return {Bool}
         */
        isEmpty: function() {
            return !this._len;
        }
    };

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

})(window.so);
