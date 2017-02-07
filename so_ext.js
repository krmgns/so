;(function($) { 'use strict';

    /**
     * @package so
     * @object  so.ext
     * @depends so
     * @author  Kerem Güneş <k-gun@mail.com>
     */
    $.extend('@ext', {
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
