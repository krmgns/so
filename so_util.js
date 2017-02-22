/**
 * @package so
 * @object  so.util
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function($) { 'use strict';

    var re_rgb = /.*rgba?\((\d+),\s*(\d+),\s*(\d+)(,.*)\)/i;

    $.extend('@util', {
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
            if (!input || input[0] == '#' || input.indexOf('rgb') < 0) {
                return input;
            }

            var nums = re_rgb.exec(input) || [, '0', '0', '0'],
                r = nums[1].toInt(16),
                g = nums[2].toInt(16),
                b = nums[3].toInt(16);

            return '#'+ (
                (r.length == 1 ? '0'+ r : r) +
                (g.length == 1 ? '0'+ g : g) +
                (b.length == 1 ? '0'+ b : b)
            );
        },

        /**
         * Escape RegExp.
         * @param  {String} input
         * @return {String}
         */
        escapeRegExp: function(input) {
            return input.replace(/[.*+?^$|{}()\[\]\\]/g, '\\$&');
        }
    });

})(so);
