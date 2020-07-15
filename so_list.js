/**
 * @package so
 * @object  so.list
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function($, NULL, TRUE, FALSE, UNDEFINED) { 'use strict';

    var $win = $.win();

    // minify candies
    var OBJECT = 'object', Object = $win.Object;

    var $for = $.for, $forEach = $.forEach;
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
         * @return {this}
         */
        init: function(data, options) {
            if (!$.isIterable(data)) {
                throw ('Non-iterable object!');
            }

            var type = $.type(data);
            if ($.isList(data)) {
                type = data._type;
                data = data._data;
            }

            options = $.extend({type: type}, options);

            var _this = this, _data = {}, _type = options.type, len = 0;

            $forEach(data, function(key, value) {
                _data[key] = value, len++; // dunno, why naming as 'length' sucks?!
            });

            Object.defineProperties(_this, { // writables for internal modifications
                 '_len': {value: len, writable: TRUE},
                '_data': {value: _data, writable: TRUE},
                '_type': {value: _type},
            });

            return _this;
        },

        /**
         * For.
         * @param  {Function} fn
         * @return {this}
         */
        for: function(fn) {
            return $for(this._data, fn, this);
        },

        /**
         * For each.
         * @param  {Function} fn
         * @return {this}
         */
        forEach: function(fn) {
            return $forEach(this._data, fn, this);
        },

        /**
         * Set.
         * @param  {Int|String} key?
         * @param  {Any}        value
         * @return {this}
         */
        set: function(key, value) {
            var _this = this, key = (key != NULL) ? key : _this._len;

            if (!(key in _this._data)) { // increase size
                _this._len++;
            }
            _this._data[key] = value;

            return _this;
        },

        /**
         * Get.
         * @param  {Int|String} key
         * @param  {Any}        valueDefault
         * @return {Any}
         */
        get: function(key, valueDefault) {
            return this.hasKey(key) ? this._data[key] : valueDefault;
        },

        /**
         * Add (alias of append()).
         */
        add: function(value) {
            return this.append(value);
        },

        /**
         * Add by (alias of set()).
         */
        addBy: function(key, value) {
            return this.set(key, value);
        },

        /**
         * Remove.
         * @param  {Any} value
         * @return {this}
         */
        remove: function(value) {
            return this.pull(this.findKey(value)), this;
        },

        /**
         * Remove by.
         * @param  {Int|String} key
         * @return {this}
         */
        removeBy: function(key) {
            return this.pull(key), this;
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
                    this._data[key] = replaceValue;
                }
            });
        },

        /**
         * Replace by.
         * @param  {Int|String} key
         * @param  {Any}        replaceValue
         * @return {this}
         */
        replaceBy: function(key, replaceValue) {
            return (this._data[key] = replaceValue), this;
        },

        /**
         * Empty.
         * @return {this}
         */
        empty: function() {
            return (this._data = {}, this._len = 0), this;
        },

        /**
         * Is empty.
         * @return {Bool}
         */
        isEmpty: function() { return !this._len; },

        /**
         * Keys.
         * @return {Array}
         */
        keys: function() {
            return Object.keys(this._data);
        },

        /**
         * Values.
         * @return {Array}
         */
        values: function() {
            return Object.values(this._data);
        },

        /**
         * Entries.
         * @return {Array}
         */
        entries: function() {
            return Object.entries(this._data);
        },

        /**
         * Has.
         * @param  {Any}  search
         * @return {Bool}
         */
        has: function(search) {
            return $.has(search, this._data);
        },

        /**
         * Has key.
         * @param  {Int|String} key
         * @return {Bool}
         */
        hasKey: function(key) {
            return (key in this._data);
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
            var _this = this, data = {0: value};

            _this.forEach(function(key, value) {
                if ($.isNumeric(key)) {
                    key++; // push key
                }
                data[key] = value;
            })

            return (_this._data = data), _this;
        },

        /**
         * Top (like Array.shift()).
         * @return {Any}
         */
        top: function() {
            return this.pull(this.keys().shift());
        },

        /**
         * Pop (like Array.pop()).
         * @return {Any}
         */
        pop: function() {
            return this.pull(this.keys().pop());
        },

        /**
         * Find.
         * @param  {Any}  searchValue
         * @param  {Bool} opt_returnKey?
         * @return {Any|undefined}
         */
        find: function(searchValue, opt_returnKey) {
            var ret, fn = searchValue;

            // make test function
            if (!$.isFunction(fn)) {
                fn = function(value) { return (value === searchValue) };
            }

            this.forEach(function(key, value) {
                if (fn(value, key)) {
                    ret = !opt_returnKey ? value : key;
                    return _break;
                }
            });

            return ret;
        },

        /**
         * Find key .
         * @param  {Any} searchValue
         * @return {String|undefined}
         */
        findKey: function(searchValue) {
            return this.find(searchValue, TRUE);
        },

        /**
         * Push (alias of append()).
         */
        push: function(value) {
            return this.append(value);
        },

        /**
         * Push all.
         * @param  {Any} ...arguments
         * @return {this}
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
            var _this = this, data = {}, value;

            if (key in _this._data) {
                value = _this._data[key];
                // delete key and decrease size
                delete _this._data[key], _this._len--;

                // reset data with indexes
                if (_this._type != OBJECT) {
                    $for(_this.values(), function(value, i) {
                        data[i] = value;
                    });
                    _this._data = data;
                }
            }

            return value;
        },

        /**
         * Pull all.
         * @param  {Object} ...arguments (keys)
         * @return {Object}
         */
        pullAll: function() {
            var _this = this, data = {}, values = {}, i = 0;

            $for(arguments, function(key) {
                values[i] = UNDEFINED;
                if (key in _this._data) {
                    values[i] = _this._data[key];
                    // delete key and decrease size
                    delete _this._data[key], _this._len--, i++;
                }
            });

            // reset data with indexes
            if (_this._type != OBJECT && !$.empty(values)) {
                $for(_this.values(), function(value, i) {
                    data[i] = value;
                });
                _this._data = data;
            }

            return values;
        },

        /**
         * Copy.
         * @return {List}
         */
        copy: function() {
            return initList(this, this.options);
        },

        /**
         * Copy to.
         * @param  {List}   list
         * @param  {Object} options?
         * @return {List}
         */
        copyTo: function(list, options) {
            return list.init(this._data, options || this.options);
        },

        /**
         * Map.
         * @param  {Function} fn
         * @return {List}
         */
        map: function(fn) {
            var _this = this, data = {};

            _this.forEach(function(key, value, i) {
                data[key] = fn(value, key, i, _this._data);
            });

            return initList(data, {type: _this._type});
        },

        /**
         * Filter.
         * @param  {Function} fn?
         * @return {List}
         */
        filter: function(fn) {
            fn = fn || function(value) { return $.trim(value); }; // set default tester

            var _this = this, data = {};

            _this.forEach(function(key, value, i) {
                if (fn(value, key, i, _this._data)) {
                    data[key] = value;
                }
            });

            return initList(data, {type: _this._type});
        },

        /**
         * Reduce.
         * @param  {Any}      initialValue
         * @param  {Function} fn
         * @return {Any}
         */
        reduce: function(initialValue, fn) {
            return this.forEach(function(key, value, i) {
                initialValue = fn(initialValue, value, key, i, this._data);
            }), initialValue;
        },

        /**
         * Uniq.
         * @return {List}
         */
        uniq: function() {
            return initList(this.values().uniq(), {type: this._type});
        },

        /**
         * Ununiq.
         * @return {List}
         */
        ununiq: function() {
            return initList(this.values().ununiq(), {type: this._type});
        },

        /**
         * Reverse.
         * @return {this}
         */
        reverse: function() {
            var _this = this, data = {};

            if (_this._type == OBJECT) {
                $for(_this.keys().reverse(), function(key) {
                    data[key] = _this._data[key];
                });
            } else {
                $for(_this.values().reverse(), function(value, i) {
                    data[i] = value;
                });
            }

            return (_this._data = data), _this
        },

        /**
         * Rand.
         * @param  {Int} size
         * @return {Any}
         */
        rand: function(size) {
            var values = shuffle(this.values()), ret = [], i = size = size || 1;

            while (i--) {
                ret[i] = values[i];
            }

            return (size == 1) ? ret[0] : ret;
        },

        /**
         * Shuffle.
         * @return {this}
         */
        shuffle: function() {
            var _this = this, data = {}, keys, shuffledKeys, i;

            if (_this._type == OBJECT) {
                $for(shuffle(_this.keys()), function(key) {
                    data[key] = _this._data[key];
                });
            } else {
                $for(shuffle(_this.values()), function(value, i) {
                    data[value] = value;
                });
            }

            return (_this._data = data), _this;
        },

        /**
         * Sort.
         * @param  {Function} fn?
         * @return {this}
         */
        sort: function(fn) {
            var _this = this, data = {}, sortedValues = _this.values().sort(fn);

            $forEach(_this._data, function(key, _, i) {
                data[key] = sortedValues[i];
            });

            return (_this._data = data), _this;
        },

        /**
         * Sort key.
         * @param  {Function} fn?
         * @return {this}
         */
        sortKey: function(fn) {
            var _this = this, data = {}, sortedKeys = _this.keys().sort(fn);

            $for(sortedKeys, function(key) {
                data[key] = _this._data[key];
            });

            return (_this._data = data), _this;
        },

        /**
         * Flip.
         * @return {this}
         */
        flip: function() {
            var _this = this, data = {};

            $forEach(_this._data, function(key, value) {
                data[value] = key;
            });

            return (_this._data = data), _this;
        },

        /**
         * Test (like Array.some()).
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
         * Test all (like Array.every()).
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
            return this._data[this.keys()[i - 1]];
        },

        /**
         * Len.
         * @return {Int}
         */
        len: function() {
            return this._len;
        },

        /**
         * Data.
         * @return {Object}
         */
        data: function() {
            return this._data;
        },

        /**
         * Type.
         * @return {String}
         */
        type: function() {
            return this._type;
        }
    };

    // helper (minify candy)
    function initList(data, options) {
        return new List(data, options);
    }

    /**
     * List.
     * @param  {Iterable} data
     * @param  {Object}   options
     * @return {List}
     */
    $.list = function(data, options) {
        return initList(data, options);
    };

    /**
     * Is list.
     * @param  {Any} input
     * @return {Bool}
     */
    $.isList = function(input) {
        return (input instanceof List);
    };

})(window.so, null, true, false);
