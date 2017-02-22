/**
 * @package so
 * @object  so.util
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function($) { 'use strict';

    var re_rgb = /.*rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(.*))?\)/i;

    $.util = {
        /**
         * toCamelCaseFromDashCase.
         * @param  {String} input
         * @return {String}
         */
        toCamelCaseFromDashCase: function(input) {
            if (input.indexOf('-') > 0) {
                input = (''+ input).replace(/-([a-z])/gi, function(_, $1) {
                    return $1.toUpperCase();
                });
            }
            return input;
        },

        /**
         * toDashCaseFromUpperCase.
         * @param  {String} input
         * @return {String}
         */
        toDashCaseFromUpperCase: function(input) {
            return (''+ input).replace(/([A-Z])/g, function(_, $1) {
                return '-'+ $1.toLowerCase();
            });
        },

        /**
         * toHexFromRgb.
         * @param  {String} input
         * @return {String}
         */
        toHexFromRgb: function(input) {
            if (!(input = ''+ input) || input[0] == '#' || input.indexOf('rgb') < 0) {
                return input;
            }

            var rgb = $.util.parseRgb(input),
                r = rgb.r.toString(16), g = rgb.g.toString(16), b = rgb.b.toString(16);

            return '#'+ (
                (r.length == 1 ? '0'+ r : r) +
                (g.length == 1 ? '0'+ g : g) +
                (b.length == 1 ? '0'+ b : b)
            );
        },

        /**
         * parseRgb.
         * @param  {String} input
         * @return {Object}
         */
        parseRgb: function(input) {
            var re = re_rgb.exec(input),
                ret = {r: 0, g: 0, b: 0, opacity: 0.00};

            if (re) {
                ret.r = re[1].toInt(), ret.g = re[2].toInt(), ret.b = re[3].toInt();
                if (re[4]) {
                    ret.opacity = re[4].toFloat();
                }
            }

            return ret;
        },

        /**
         * Escape RegExp input.
         * @param  {String} input
         * @return {String}
         */
        escapeRegExpInput: function(input) {
            return input.replace(/[.*+?^$|{}()\[\]\\]/g, '\\$&');
        }
    };

})(so);
