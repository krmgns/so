;(function($) { 'use strict';

    /**
     * @package so
     * @object  so.util
     * @depends so
     * @author  Kerem Güneş <k-gun@mail.com>
     * @license The MIT License <https://opensource.org/licenses/MIT>
     */
    $.extend('@util', {
        /**
         * toCamelCaseFromDashCase.
         * @param  {String} input
         * @return {String}
         */
        toCamelCaseFromDashCase: function(input) {
            return (''+ input).replace(/-([a-z])/gi, function($0, $1) {
                return $1.toUpperCase();
            });
        },

        /**
         * toDashCaseFromUpperCase.
         * @param  {String} input
         * @return {String}
         */
        toDashCaseFromUpperCase: function(input) {
            return (''+ input).replace(/([A-Z])/g, function($0, $1) {
                return '-'+ $1.toLowerCase();
            });
        }
    });

})(so);
