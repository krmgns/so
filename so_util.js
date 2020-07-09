/**
 * @package so
 * @object  so.util
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function($, NULL) { 'use strict';

    var $win = $.win();

    // minify candies
    var Math = $win.Math, JSON = $win.JSON;
    // var MAX_INT = Number.MAX_SAFE_INTEGER || Math.pow(2, 53) - 1, MAX_FLOAT = Number.MAX_VALUE;

    var $int = $.int, $float = $.float, $trim = $.trim, $string = $.string;

    var re_rgb = /.*rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(.*))?\)/i;
    var re_url = /^((\w+):)?(\/\/(([\w-]+)?(:([^@]+))?@)?([^/?:]+)(:(\d+))?)?([/]?([^/?#][^?#]*)?)?(\?([^#]*))?(#(.*)$)?/;

    function now(base) {
        return Date.now().toString(base);
    }
    function rand(len, base) {
        return Math.random().toString(base || 16).slice(len ? -len : 2);
    }

    $.util = {
        /**
         * Uid.
         * @param  {Int} len?
         * @param  {Int} base?
         * @return {String}
         */
        uid: function(len, base) {
            len = len || 10, base = base || 36;

            var ret = now(base);

            while (ret.len() < len) {
                ret += rand(0, base);
            }

            return ret.slice(0, len);
        },

        /**
         * Uuid.
         * @param  {Bool} noDash?
         * @return {String}
         */
        uuid: function(noDash) {
            var ret = '%s-%s-%s-%s-%s'.format(
                rand(8), rand(4), rand(4), rand(4), rand(12)
            );

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
         * Rand int.
         * @param  {Int} min?
         * @param  {Int} max?
         * @return {Int}
         */
        randInt: function(min, max) {
            min = min || 0;
            max = max || Math.pow(2, 53) - 1; // safe max int

            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        /**
         * Rand float.
         * @param  {Float} min?
         * @param  {Float} max?
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
         * @param  {Bool}   opt_hex?
         * @return {Object|String|undefined}
         */
        parseRgb: function(input, opt_hex) {
            input = $trim(input);
            if (!input.has('rgb')) {
                return;
            }

            var re = re_rgb.exec(input), rgb = {r: 0, g: 0, b: 0, opacity: 0.00}, r, g, b;
            if (re) {
                rgb.r = $int(re[1]), rgb.g = $int(re[2]), rgb.b = $int(re[3]);
                if (re[4]) {
                    rgb.opacity = $float(re[4]);
                }
            }

            // no hex wanted
            if (!opt_hex) {
                return rgb;
            }

            r = rgb.r.toString(16), g = rgb.g.toString(16), b = rgb.b.toString(16);

            return '#'+ (
                (r.len() == 1 ? '0'+ r : r) +
                (g.len() == 1 ? '0'+ g : g) +
                (b.len() == 1 ? '0'+ b : b)
            );
        },

        /**
         * Url.
         * @param  {String} url
         * @return {Object}
         */
        url: function(url) {
            // url: "/path/to/file.ext?query=param#hash"
            // or full: "http://user:pass@domain.tld:8080/path/to/file.ext?query=param#hash"
            var re = $string(url).match(re_url) || [],
                ret = {
                    protocol: re[2], user: re[5], pass: re[7], host: re[8], port: $int(re[10]),
                    path: re[11], query: re[14], queryParams: NULL, hash: re[16],
                    dir: NULL, file: NULL, fileExt: NULL
                }, s, ss;

            ss = $string(ret.path).split('/'),
                ret.dir = ss.slice(0, -1).join('/'),
                ret.file = ss.pop();

            if (s = ret.file) {
                s = s.split('.');
                if (s.len() > 1) {
                    ret.fileExt = s.last();
                }
            }

            if (s = ret.query) {
                s = s.split('&'), ss = {};
                s.each(function(query, key, value) {
                    query = query.splits('=', 2), key = query[0], value = query[1];
                    if (key in ss) {
                        ss[key] = [ss[key]]; // make array with current value
                        ss[key].push(value);
                    } else {
                        ss[key] = value;
                    }
                });
                ret.queryParams = ss;
            }

            // return a filtered result
            return $.forEach(ret, function(name, value) {
                if (!value) ret[name] = NULL;
            })
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
            } catch (_) {}
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
            } catch (_) {}
        },

        /**
         * To style name.
         * @param  {String} name
         * @param  {Bool}   opt_uppers?
         * @return {String}
         */
        toStyleName: function(name, opt_uppers, _re /* @local */) {
            name = $trim(name);
            if (!opt_uppers) {
                return (_re = /- */), name.has(_re) ? name.toCamelCase(_re) : name;
            } else {
                return (_re = /[A-Z]/), name.has(_re) ? name.replaceAll(_re, function(char) {
                    return '-'+ char.lower()
                }) : name;
            }
        }
    };

})(window.so, null);
