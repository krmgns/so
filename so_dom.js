;(function(window, $, undefined) { 'use strict';

    var //re_attr = /\[.+\]/,
        //re_attrFix = /\[(.+)=(?!['"])(.*)\]/g,
        re_htmlContent = /^<([a-z-]+).*\/?>(?:.*<\/\1>)?$/i
    ;

    function prepareSelector(selector) {
        if (selector == '') return '';

        var re_space = /\s+/g;
        var re_attr = /\[.+\]/;
        var re_attrFix = /\[(.+)=(.+)\]/g;
        var re_attrExcape = /([.:])/g;
        var re_attrQuotes = /(^['"]|['"]$)/g;
        var re_attrStates = /(((check|select|disabl)ed|readonly)!?)/gi;

        selector = selector.replace(re_space, ' ');

        // grammar: https://www.w3.org/TR/css3-selectors/#grammar
        if (selector.index(re_attr)) {
            // prevent DOMException 'input[foo=1]' is not a valid selector.
            selector = selector.replace(re_attrFix, function(_, $1, $2) {
                $1 = $1.replace(re_attrExcape, '\\$1');
                $2 = $2.replace(re_attrQuotes, '');
                return '[%s="%s"]'.format($1, $2);
            });
        }

        var re, search, replace, not = '!';
        // shortcut for input:not([checked]) as input:checked!
        if (re = selector.match(re_attrStates)) {
            search = $.re(re[0], 'g'), replace = re[0].replace(not, '');
            if (re[0].index(not)) {
                selector = selector.replace(search, 'not([%s])'.format(replace));
            } else {
                selector = selector.replace(search, replace);
            }
        }

        return selector;
    }

    function isDom(input) {
        return (input instanceof Dom);
    }

    function initDom(selector, root, i) {
        if (isDom(selector)) {
            return selector;
        }
        return new Dom(selector, root, i);
    }

    function Dom(selector, root, i) {
        if ($.isNumber(root)) {
            i = root, root = null;
        }
        var elements;
        if ($.isString(selector)) {
            selector = $.trim(selector);
            if (selector) {
                if (re_htmlContent.test(selector)) {
                    elements = createElement(selector);
                    if ($.isObject(root)) {
                        $.forEach(elements, function(name, value){
                            elements.setAttribute(name, value);
                        });
                    }
                } else {
                    if (!$.isNode(root)) root = document;
                    elements = root.querySelectorAll(prepareSelector(selector), root);
                    if (!isNaN(i)) {
                        elements = [elements[i]];
                    }
                }
            }
        } else if ($.isNode(selector) || $.isWindow(selector) || $.isDocument(selector)) {
            elements = [selector];
        }
        this.size = 0;
        $.for(elements, function(element) {
            if (element) this[this.size++] = element;
        }, this);
    }

    Dom.extendPrototype({
        constructor: Dom,
        // init: initDom,
        find: function(selector, i) { return this[0] ? initDom(selector, this[0], i) : this; },
        toArray: function() {var ret = [], i = 0, il = this.size; while (i < il) {ret.push(this[i++]);} return ret;},
        toList: function() { return $.list(this.toArray()); },
        for: function(fn) { return $.for(this.toArray(), fn, this); },
        forEach: function(fn) { return $.forEach(this.toArray(), fn, this); },
    });

    $.onReady(function() { var dom, doc = document, els
        dom = new Dom(doc)
        log(dom)
        // els = dom.find('input[so:v=1]')
        // els = dom.find('input:not([checked])')
        els = dom.find('input:checked!')
        log(els)
        // log(els.for(function(el,i){ log(el) }))
    })

    // HTMLDocument.prototype.$ = function (selector) { return this.querySelector(selector); };
    // HTMLDocument.prototype.$$ = function (selector) { return this.querySelectorAll(selector); };

})(window, so);
