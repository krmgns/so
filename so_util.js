/**
 * @package so
 * @object  so.util
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function($) { 'use strict';

    $.extend('@util', {
        /**
         * toCamelCaseFromDashCase.
         * @param  {String} input
         * @return {String}
         */
        toCamelCaseFromDashCase: function(input) {
            return (''+ input).replace(/-([a-z])/gi, function(_, $1) {
                return $1.toUpperCase();
            });
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
         * Escape RegExp.
         * @param  {String} input
         * @return {String}
         */
        escapeRegExp: function(input) {
            return input.replace(/[.*+?^$|{}()\[\]\\]/g, '\\$&');
        }
    });

})(so);
