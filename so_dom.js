// deps: so, so.util
;(function(window, $, undefined) { 'use strict';

    var re_space = /\s+/g,
        re_htmlContent = /^<([a-z-]+).*\/?>(?:.*<\/\1>)?$/i,
        fn_isNaN = isNaN,
        querySelector = function(root, selector) { return root.querySelector(selector); },
        querySelectorAll = function(root, selector) { return root.querySelectorAll(selector); }
    ;

    function getNodeName(node) {
        return node && (node.nodeName && node.nodeName.toLowerCase() || $.isWindow(node) && "#window");
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
                    elements = select(selector, root);
                    if (!fn_isNaN(i)) {
                        elements = [elements[i]];
                    }
                }
            }
        } else if ($.isNode(selector) || $.isWindow(selector) || $.isDocument(selector)) {
            elements = [selector];
        } else {
            elements = selector;
        }

        this.size = 0;
        $.for(elements, function(element) {
            if (element) this[this.size++] = element;
        }, this);
    }

    function select(selector, root) {
        if (selector == '') {
            return '';
        }

        if (!$.isNode(root)) {
            root = document;
        }

        var re_attr = /\[.+\]/;
        var re_attrFix = /\[(.+)=(.+)\]/g;
        var re_attrExcape = /([.:])/g;
        var re_attrQuotes = /(^['"]|['"]$)/g;
        var re_attrStates = /(((check|select|disabl)ed|readonly)!?)/gi;
        var re_fln = /(?:(\w+):((fir|la)st|nth\((\d+)\)))(?!-)/gi;
        var re, ret = [];

        selector = selector.replace(re_space, ' ');
        if (re = selector.matchAll(re_fln)) {
            var re_remove = [];
            re.forEach(function(re) {
                var tag = re[1], dir = re[2], all;
                if (dir == 'first') { // p:first
                    ret.push(querySelector(root, tag));
                } else if (dir == 'last') { // p:last
                    all = querySelectorAll(root, tag);
                    ret.push(all[all.length - 1]);
                } else { // p:nth(..)
                    all = querySelectorAll(root, tag);
                    ret.push(all[re[4] - 1]);
                }
                re_remove.push($.util.escapeRegExp(re[0]));
            });

            // remove processed selectors
            selector = selector.replace('(%s),?\\s*'.format(re_remove.join('|')).toRegExp('gi'), '');
        }

        // could be empty after processe above
        if (selector == '') {
            return ret;
        }

        // grammar: https://www.w3.org/TR/css3-selectors/#grammar
        if (selector.has(re_attr)) {
            // prevent DOMException 'input[foo=1]' is not a valid selector.
            selector = selector.replace(re_attrFix, function(_, $1, $2) {
                $1 = $1.replace(re_attrExcape, '\\$1');
                $2 = $2.replace(re_attrQuotes, '');
                return '[%s="%s"]'.format($1, $2);
            });
        }

        var search, replace, not = '!';
        // shortcut for input:not([checked]) as input:checked!
        if (re = selector.match(re_attrStates)) {
            search = $.re(re[0], 'g'), replace = re[0].replace(not, '');
            if (re[0].has(not)) {
                selector = selector.replace(search, 'not([%s])'.format(replace));
            } else {
                selector = selector.replace(search, replace);
            }
        }

        return $.array(ret, querySelectorAll(root, selector));
    }

    Dom.extendPrototype({
        constructor: Dom,
        // init: initDom,
        find: function(selector, i) { return this[0] ? initDom(selector, this[0], i) : this; },
        toArray: function() {var ret = [], i = 0, il = this.size; while (i < il) {ret.push(this[i++]);} return ret;},
        toList: function() { return $.list(this.toArray()); },
        for: function(fn) { return $.for(this.toArray(), fn, this); },
        forEach: function(fn) { return $.forEach(this.toArray(), fn, this); },
        map: function(fn) {return initDom(this.toArray().map(fn));},
        filter: function(fn) {return initDom(this.toArray().filter(fn));},
        get: function(i) {
            var element;
            if ($.isVoid(i)) {
                element = this[0];
            } else if ($.isString(i)) {
                this.for(function(_element) {
                    if (i == getNodeName(_element)) {
                        element = _element; return 0;
                    }
                });
            } else if (!fn_isNaN(i)) {
                element = this[i];
            }
            return element;
        },
        getAll: function(ii) {
            var elements = [];
            if ($.isVoid(ii)) {
                elements = this.toArray();
            } else {
                var _this = this;
                ii.forEach(function(i) {
                    elements.push(_this.get(i));
                });
            }
            return elements;
        }
    });

    $.onReady(function() { var dom, doc = document, els
        dom = new Dom(doc)
        // log(dom)
        // els = dom.find('input[so:v=1]')
        // els = dom.find('input:not([checked])')
        // els = dom.find('input:checked!)')
        // els = dom.find('p:nth(1)')
        // els = dom.find('input:first, input:last, p:nth(1), a, button')
        els = dom.find('body > *')
        log(els)
        // log(els)
    })

    // HTMLDocument.prototype.$ = function (selector) { return this.querySelector(selector); };
    // HTMLDocument.prototype.$$ = function (selector) { return this.querySelectorAll(selector); };

})(window, so);
