;(function($) { 'use strict';

    /**
     * @package so
     * @object  so.browser
     * @depends so
     * @author  Kerem Güneş <k-gun@mail.com>
     * @license The MIT License <https://opensource.org/licenses/MIT>
     */
    $.extend('@array', {
        /**
         * Has.
         * @param  {Array}   input
         * @param  {Any}     search
         * @param  {Boolean} strict
         * @return {Boolean}
         */
        has: function(input, search, strict) {
            for (var i = 0, len = input.length; i < len; i++) {
                if (!strict ? search == input[i] : search === input[i]) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Find.
         * @param  {Array} input
         * @param  {Any}   search
         * @param  {Any}   opt_retDefault
         * @return {Any|undefined}
         */
        find: function(input, search, opt_retDefault) {
            var ret = opt_retDefault;

            $.forEach(input, function(value) {
                if (search(value)) {
                    ret = value;
                    return false; // break
                }
            });

            return ret;
        },

        /**
         * Find.
         * @param  {Array} input
         * @param  {Any}   search
         * @param  {Any}   opt_retDefault
         * @return {Int|undefined}
         */
        findIndex: function(input, search, opt_retDefault) {
            var ret = opt_retDefault;

            $.forEach(input, function(value, key) {
                if (search(value)) {
                    ret = key;
                    return false; // break
                }
            });

            return ret;
        }
    });

})(so);
