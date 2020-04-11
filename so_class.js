/**
 * @package so
 * @object  so.class
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function($) { 'use strict';

    var PROTOTYPE = 'prototype';
    var $extend = $.extend;

    /**
     * Class.
     * @param  {Function} subClass
     * @return {Object}
     */
    var $class = function(subClass) { return {
        /**
         * Extends.
         * @param  {Function} supClass
         * @return {Function}
         */
        extends: function(supClass) {
            // @note: super() always must be called in subClass constructor
            var prototype = $extend(
                {}, supClass[PROTOTYPE], subClass[PROTOTYPE],
                {constructor: subClass, super: supClass}
            );

            subClass[PROTOTYPE] = Object.create(prototype);

            return subClass;
        }
    }};

    /**
     * Extend.
     * @param  {Function} target
     * @param  {Object}   prototype
     * @return {Function}
     */
    $class.extend = function(target, prototype) {
        return $extend(target[PROTOTYPE], prototype);
    },

    // export
    $.class = $class;

})(window.so);
