/**
 * @package so
 * @object  so.util
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $) { 'use strict';

    var JSON = window.JSON, Math = window.Math;
    // var MAX_INT = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1, MAX_FLOAT = Number.MAX_VALUE;
    var re_rgb = /.*rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(.*))?\)/i;
    var $int = $.int, $float = $.float, $string = $.string;

    function rand(size, base) {
        return Math.random().toString(base || 16).slice(size ? -size : 2);
    }

    $.util = {
        /**
         * Uuid.
         * @param  {Bool} noDash?
         * @return {String}
         */
        uuid: function(noDash) {
            var ret = '%s-%s-%s-%s-%s'.format(rand(8), rand(4), rand(4), rand(4), rand(12));

            if (noDash) {
                ret = ret.removeAll('-');
            }

            return ret;
        },

        /**
         * Range.
         * @param  {Number} min
         * @param  {Number} max
         * @param  {Number} step?
         * @return {Array}
         * @source https://stackoverflow.com/a/15453499/362780
         */
        range: function(min, max, step) {
            var ret = [min];

            while (min < max) {
                ret.push(min += step || 1);
            }

            return ret;
        },

        /**
         * Rand.
         * @param  {Int} len?
         * @param  {Int} base?
         * @return {String}
         */
        rand: function(len, base) {
            var ret = rand(0, base), len = len || 16;

            while (ret.len() < len) {
                ret += rand(0, base);
            }

            return ret.sub(0, len);
        },

        /**
         * Rand int.
         * @param  {Int} min
         * @param  {Int} max
         * @return {Int}
         */
        randInt: function(min, max) {
            min = min || 0;
            max = max || Math.pow(2, 53) - 1; // max int

            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        /**
         * Rand float.
         * @param  {Float} min
         * @param  {Float} max
         * @return {Float}
         */
        randFloat: function(min, max) {
            min = min || 0;
            max = max || 1 + min;

            return Math.random() * (max - min) + min;
        },

        /**
         * Parse rgb.
         * @param  {String} input
         * @return {Object}
         */
        parseRgb: function(input) {
            input = $string(input);

            var re = re_rgb.exec(input),
                ret = {r: 0, g: 0, b: 0, opacity: 0.00};

            if (re) {
                ret.r = $int(re[1]), ret.g = $int(re[2]), ret.b = $int(re[3]);
                if (re[4]) {
                    ret.opacity = $float(re[4]);
                }
            }

            return ret;
        },

        /**
         * Parse rgb as hex.
         * @param  {String} input
         * @return {String}
         */
        parseRgbAsHex: function(input) {
            input = $string(input);

            if (!input.has('rgb')) {
                return '';
            }

            var rgb = this.parseRgb(input),
                r = rgb.r.toString(16), g = rgb.g.toString(16), b = rgb.b.toString(16);

            return '#'+ (
                (r.len() == 1 ? '0'+ r : r) +
                (g.len() == 1 ? '0'+ g : g) +
                (b.len() == 1 ? '0'+ b : b)
            );
        },

        /**
         * Url encode/decode.
         * @param  {String} input
         * @return {String}
         */
        urlEncode: function(input) { return encodeURIComponent(input); },
        urlDecode: function(input) { return decodeURIComponent(input); },

        /**
         * Json encode.
         * @param  {Any}            input
         * @param  {Function|Array} replacer?
         * @param  {Number|String}  space?
         * @return {String|undefined}
         */
        jsonEncode: function(input, replacer, space) {
            try {
                return JSON.stringify(input, replacer, space);
            } catch(e) {}
        },

        /**
         * Json decode.
         * @param  {String}   input
         * @param  {Function} reviver?
         * @return {Any|undefined}
         */
        jsonDecode: function(input, reviver) {
            try {
                return JSON.parse(input, reviver);
            } catch(e) {}
        },

        /**
         * To style name.
         * @param  {String} name
         * @return {String}
         */
        toStyleName: function(name) {
            name = $string(name);

            return name.has('-') ? name.toCamelCase('-') : name;
        }
    };

})(window, window.so);
