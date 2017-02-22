/**
 * @package so
 * @object  so.class
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function($) { 'use strict';

    // create constructor with original name (minify tools change the original name)
    function createConstructor(name, contents) {
        return new Function('return function '+ name +'(){'+ contents +'}')();
    }

    /**
     * So class.
     * @param  {Function} subClass For $.class.extends()
     * @return {Object}
     */
    $.class = function(subClass) { return {
        /**
         * Create.
         * @param  {String} name
         * @param  {Object} prototype
         * @usage  $.class.create('Foo', {...})
         * @usage  $.class.create('Foo', {init: function() {...}, ...})
         * @return {Function}
         */
        create: function(name, prototype) {
            var Class, Constructor;

            Class = createConstructor(name, 'if(this.init)this.init.apply(this,arguments)');
            if (prototype) {
                Class[NAME_PROTOTYPE] = Object.create(prototype, {
                    constructor: {value: (function() {
                        Constructor = createConstructor(name);
                        Constructor[NAME_PROTOTYPE] = prototype;
                        Constructor[NAME_PROTOTYPE].constructor = Constructor;
                        return Constructor;
                    })()}
                });
            }

            return Class;
        },

        /**
         * Extend.
         * @param  {Function} target
         * @param  {Object}   prototype
         * @return {Function}
         */
        extend: function(target, prototype) {
            return $.extend(target, NULL, prototype);
        },

        /**
         * Extends.
         * @param  {Function} supClass
         * @param  {Function} subClass  From $.class(subClass)
         * @usage  $.class(Foo).extends(FooBase)
         * @return {Function}
         */
        extends: function(supClass) {
            // subClass[NAME_PROTOTYPE] = Object.create(supClass[NAME_PROTOTYPE], {
            //     constructor: {value: subClass},
            //           super: {value: supClass}
            // });

            var prototype = extend({
                constructor: subClass,
                      super: supClass
            }, supClass[NAME_PROTOTYPE], subClass[NAME_PROTOTYPE]);

            $.forEach(prototype, function(name, value) {
                subClass[NAME_PROTOTYPE][name] = value;
            });

            return subClass;
        }
    }};

    // add shortcuts for without ()'s.
    $.class.create = $.class().create;
    $.class.extend = $.class().extend;
})(so);
