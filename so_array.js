;(function($) { 'use strict';

    /**
     * @package so
     * @object  so.array
     * @depends so
     * @author  Kerem Güneş <k-gun@mail.com>
     * @license The MIT License <https://opensource.org/licenses/MIT>
     */
    $.extend('@array', {
        /**
         * Has.
         * @param  {Array}   array
         * @param  {Any}     search
         * @param  {Boolean} strict
         * @return {Boolean}
         */
        has: function(array, search, strict) {
            for (var i = 0, len = array.length; i < len; i++) {
                if (!strict ? search == array[i] : search === array[i]) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Find.
         * @param  {Array}    array
         * @param  {Function} fn
         * @param  {Any}      opt_retDefault
         * @return {Any|undefined}
         */
        find: function(array, fn, opt_retDefault) {
            var ret = opt_retDefault;

            $.forEach(array, function(value) {
                if (fn(value)) {
                    ret = value;
                    return false; // break
                }
            });

            return ret;
        },

        /**
         * Find.
         * @param  {Array}    array
         * @param  {Function} fn
         * @param  {Any}      opt_retDefault
         * @return {Int|undefined}
         */
        findIndex: function(array, fn, opt_retDefault) {
            var ret = opt_retDefault;

            $.forEach(array, function(value, key) {
                if (fn(value)) {
                    ret = key;
                    return false; // break
                }
            });

            return ret;
        }
    });

})(so);
