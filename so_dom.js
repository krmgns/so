// deps: so, so.util
;(function(window, $, undefined) { 'use strict';

    var re_space = /\s+/g,
        re_commaSplit = /,\s*/,
        re_htmlContent = /^<([a-z-]+).*\/?>(?:.*<\/\1>)?$/i,
        isNaN = window.isNaN,
        isVoid = $.isVoid, isObject = $.isObject,
        isNode = $.isNode, isWindow = $.isWindow, isDocument = $.isDocument,
        isNumber = $.isNumber, isNumeric = $.isNumeric, isString = $.isString,
        querySelector = function(root, selector) { return root.querySelector(selector); },
        querySelectorAll = function(root, selector) { return root.querySelectorAll(selector); }
    ;

    function getNodeName(input, undefined) {
        return (input && input.nodeName) ? input.nodeName.toLowerCase() : isWindow(input) ? '#window' : null;
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
        if (isNumber(root)) {
            i = root, root = null;
        }
        var elements;
        if (isString(selector)) {
            selector = $.trim(selector);
            if (selector) {
                if (re_htmlContent.test(selector)) {
                    elements = createElement(selector);
                    if (isObject(root)) {
                        $.forEach(elements, function(name, value){
                            elements.setAttribute(name, value);
                        });
                    }
                } else {
                    elements = select(selector, root);
                    if (!isNaN(i)) {
                        elements = [elements[i]];
                    }
                }
            }
        } else if (isNode(selector) || isWindow(selector) || isDocument(selector)) {
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
        if (selector == '') return '';

        if (!isNode(root)) {
            root = document;
        }

        var re_attr = /\[.+\]/,
            re_attrFix = /\[(.+)=(.+)\]/g,
            re_attrEscape = /([.:])/g,
            re_attrQuotes = /(^['"]|['"]$)/g,
            re_attrStates = /(((check|select|disabl)ed|readonly)!?)/gi,
            re_fln = /(?:(\w+):((fir|la)st|nth\((\d+)\)))(?!-)/gi,
            re, ret = [], re_remove = []
        ;

        selector = selector.replace(re_space, ' ');
        if (re = selector.matchAll(re_fln)) {
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
                $1 = $1.replace(re_attrEscape, '\\$&');
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
        isEmpty: function() {return !this.size;},
        map: function(fn) {return initDom(this.toArray().map(fn));},
        filter: function(fn) {return initDom(this.toArray().filter(fn));},
        reverse: function() {return initDom(this.toArray().reverse());},
        item: function(i) {
            var element;
            if (isVoid(i)) {
                element = this[0];
            } else if (isNumeric(i)) {
                element = this[i];
            } else if (isString(i)) {
                this.for(function(_element) {
                    if (i == getNodeName(_element)) {
                        element = _element; return 0;
                    }
                });
            }
            return element;
        },
        itemAll: function(is) {
            var elements = [], element;
            if (isVoid(is)) {
                elements = this.toArray();
            } else {
                var _this = this;
                is.split(re_commaSplit).forEach(function(i) {
                    element = _this.item(i);
                    if (element && !elements.has(element)) {
                        elements.push(element);
                    }
                });
            }
            return elements;
        },
        get: function(i) {return initDom(this.item(i))},
        getAll: function(is) {return initDom(this.itemAll(is))},
        tag: function() {return getNodeName(this[0])},
        tags: function() {var ret = [];return this.for(function(element) {ret.push(getNodeName(element))}), ret;}
    });

    function cloneElement(element, deep) {
        var clone = element.cloneNode(false);
        // clone.cloneOf = function() { return element; }; // @wait
        if (clone.id) {
            clone.id += ':clone-'+ $.uuid();
        }
        deep = (deep !== false);
        if (deep) {
            $.for(element.childNodes, function(child) {
                clone.appendChild(cloneElement(child, deep));
            });
            if (element.$events) {
                element.$events.forAll(function(event) {
                    event.copy().bindTo(clone);
                });
            }
        }
        return clone;
    }

    Dom.extendPrototype({
        clone: function(deep) {
            var clones = []; return this.for(function(element, i) {
                clones[i] = cloneElement(element, deep);
            }), initDom(clones);
        }
    });

    $.onReady(function() { var dom, doc = document, el, els
        dom = new Dom(doc)
        // log(dom)
        // els = dom.find('input[so:v=1]')
        // els = dom.find('input:not([checked])')
        // els = dom.find('input:checked!)')
        // els = dom.find('p:nth(1)')
        // els = dom.find('input:first, input:last, p:nth(1), a, button')
        els = dom.find('a:last')
        log('els:',els)

        els[0].on('mouseup', function(e) {log(this)})
        // els[0].on('mouseup,mousedown', )

        el = els.clone().item(0)
        doc.body.appendChild(el)

        $.fire(1, function() {
            log(dom.find('[id="a2:clone-1"]'))
        })
    })

    // HTMLDocument.prototype.$ = function (selector) { return this.querySelector(selector); };
    // HTMLDocument.prototype.$$ = function (selector) { return this.querySelectorAll(selector); };

})(window, so);
