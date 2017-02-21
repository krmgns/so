// deps: so, so.util
;(function(window, $, undefined) { 'use strict';

    var re_space = /\s+/g,
        re_commaSplit = /,\s*/,
        re_htmlContent = /^<([a-z-]+).*\/?>(?:.*<\/\1>)?$/i,
        isNaN = window.isNaN,
        isVoid = $.isVoid, isObject = $.isObject, isArray = $.isArray,
        isNumber = $.isNumber, isNumeric = $.isNumeric, isString = $.isString,
        isWindow = $.isWindow, isDocument = $.isDocument,
        isNode = $.isNode, isNodeElement = $.isNodeElement,
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

    var re_attr = /\[.+\]/,
        re_attrFix = /\[(.+)=(.+)\]/g,
        re_attrEscape = /([.:])/g,
        re_attrQuotes = /(^['"]|['"]$)/g,
        re_attrStates = /(((check|select|disabl)ed|readonly)!?)/gi,
        re_fln = /(?:(\w+):((fir|la)st|nth\((\d+)\)))(?!-)/gi
    ;

    function select(selector, root) {
        if (selector == '') return '';

        if (!isNode(root)) {
            root = document;
        }

        selector = selector.replace(re_space, ' ');

        var re, ret = [], re_remove = [];
        if (re = selector.matchAll(re_fln)) {
            re.forEach(function(re) {
                var tag = re[1], dir = re[2], all;

                if (dir == 'first') { // p:first
                    all = querySelector(root, tag);
                } else if (dir == 'last') { // p:last
                    all = querySelectorAll(root, tag), all = all[all.length - 1];
                } else { // p:nth(..)
                    all = querySelectorAll(root, tag), all = all[re[4] - 1];
                }
                ret.push(all);

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

    function Dom(selector, root, i) {
        var elements, size = 0;

        if (isNumber(root)) {
            i = root, root = undefined;
        }

        if (!isVoid(selector)) {
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
            } else if (isNode(selector) || isWindow(selector)) {
                elements = [selector];
            } else {
                elements = selector;
            }

            $.for(elements, function(element) {
                if (element) this[size++] = element;
            }, this);
        }

        // define all read-only
        Object.defineProperties(this, {
                'size': {value: size},
            'selector': {value: selector},
                'root': {value: root}
        });
    }

    Dom.extendPrototype({
        // init: initDom,
        find: function(selector, i) { return this[0] ? initDom(selector, this[0], i) : this; },
        all: function() {return this.toArray()},
        copy: function() {return initDom(this.toArray())},
        toArray: function() {var ret = [], i = 0; while (i < this.size) {ret.push(this[i++]);} return ret;},
        toList: function() { return $.list(this.toArray()); },
        for: function(fn) { return $.for(this.toArray(), fn, this); },
        forEach: function(fn) { return $.forEach(this.toArray(), fn, this); },
        has: function(search, strict) {return this.toArray().has(search, strict);},
        isEmpty: function() {return !this.size;},
        map: function(fn) {return initDom(this.toArray().map(fn));},
        filter: function(fn) {return initDom(this.toArray().filter(fn));},
        reverse: function() {return initDom(this.toArray().reverse());},
        get: function(i, init) {
            var element;
            if (isVoid(i)) {
                element = this[0];
            } else if (isNumeric(i)) {
                element = this[i - 1];
            } else if (isString(i)) {
                this.for(function(_element) {
                    if (i == getNodeName(_element)) {
                        element = _element; return 0;
                    }
                });
            }
            return init ? initDom(element) : element;
        },
        getAll: function(is, init) {
            var elements = [], element;
            if (isVoid(is)) {
                elements = this.toArray();
            } else {
                var _this = this;
                is.split(re_commaSplit).forEach(function(i) {
                    element = _this.get(i);
                    if (element && !elements.has(element)) {
                        elements.push(element);
                    }
                });
            }
            return init ? initDom(elements) : elements;
        },
        item: function(i) {return initDom(this[i - 1])},
        first: function() {return this.item(1)},
        last: function() {return this.item(this.size)},
        nth: function(i) {return this.item(i)},
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
    function cleanElement(element) {
        element.$data = element.$events = null;
        var child;
        while (child = element.firstChild) {
            if (isNodeElement(child)) {
                cleanElement(child);
            }
            element.removeChild(child);
        }
    }
    // dom: modifiers
    Dom.extendPrototype({
        clone: function(deep) {
            var clones = []; return this.for(function(element, i) {
                clones[i] = cloneElement(element, deep);
            }), initDom(clones);
        },
        remove: function() {
            return this.for(function(element) {
                cleanElement(element);
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
        },
        empty: function() {
            return this.for(function(element) {
                cleanElement(element);
            });
        }
    });

    function _(_this, i, property) {
        var element = _this[i];
        if (property) {
            element = element && element[property];
        }
        return element;
    }
    function __(_this, property) {
        return _(_this, 0, property);
    }

    function match(a, b) { // intersect
        var tmp = (b.length > a.length) ? (tmp = b, b = a, a = tmp) : null; // loop over shorter
        return a.filter(function(e) {
            return b.indexOf(e) > -1;
        });
    }
    function unmatch(a, b) { // diff
        var tmp = (b.length > a.length) ? (tmp = b, b = a, a = tmp) : null; // loop over shorter
        return a.filter(function(e) {
            return b.indexOf(e) < 0;
        });
    }

    var fn_slice = [].slice;
    function walk(root, property, fn) {
            // if (property == 'up') property = 'previousElementSibling';
            // else if (property == 'down') property = 'nextElementSibling';
            var node = root, nodes = [];
            while (node && (node = node[property])) {
                if (fn && fn(node) === 0) {
                    break;
                }
                if (!isNode(node)) { // handle nodelist etc.
                    nodes = nodes.concat(fn_slice.call(node));
                } else {
                    nodes.push(node);
                }
            }
            return nodes;
        }

    // dom: walkers
    Dom.extendPrototype({
        parent: function() { return initDom(__(this, 'parentNode')); },
        sibling: function(i) {return this.siblings(i).first();},
        siblings: function(i) {
            var el = __(this), els, rets;
            if (el) {
                rets = this.parent().childs().filter(function(_el) {
                    return _el != el;
                });
                if (isNumber(i)) {
                    rets = rets.item(i);
                } else if (isString(i)) {
                    rets = match(rets, this.parent().find(i).toArray());
                }
            }
            return rets;
        },
        child: function(i) {
            var ret;
            if (isNumber(i)) {
                ret = this.childs().item(i);
            } else if (isString(i)) {
                ret = initDom(__(this)).find(i);
            }
            return initDom(ret);
        },
        childs: function() { return initDom(__(this, 'children')); },
        prev: function() { return initDom(__(this, 'previousElementSibling')); },
        prevAll: function(s) {
            var el = this[0], rets = [];
            if (el) {
                rets = walk(el, 'previousElementSibling').reverse();
                if (s && rets.length) {
                    rets = match(rets, this.parent().find(s).toArray());
                }
            }
            return initDom(rets);
        },
        next: function() { return initDom(__(this, 'nextElementSibling')); },
        nextAll: function(s) {
            var el = this[0], rets = [], found;
            if (el) {
                this.parent().childs().for(function(_el,i) {
                    if (!found && _el == el) {
                        found = true;
                    }
                    found && _el != el && rets.push(_el);
                });
                if (s && rets.length) {
                    rets = match(rets, this.parent().find(s).toArray());
                }
            }
            return initDom(rets);
        },
        hasParent: function(s) {
            var el = this[0], ret;
            if (!s) {
                ret = el && el.parentNode;
            } else {
                s = initDom(s).first().get();
                walk(el, 'parentNode', function(node) {
                    if (s == node) {
                        ret = true; return 0;
                    }
                });
            }
            return !!ret;
        },
        // hasChild:
    });

    $.onReady(function() { var dom, el, els
        dom = new Dom(document.body)
        // log(dom)
        // els = dom.find('input[so:v=1]')
        // els = dom.find('input:not([checked])')
        // els = dom.find('input:checked!)')
        // els = dom.find('p:nth(1)')
        // els = dom.find('input:first, input:last, p:nth(1), a, button')
        els = dom.find('#div > br')
        log('els:',els)
        log('---')

        log(els.nextAll())
        // log(els.nextAll('p[id],hr'))
    })

    // HTMLDocument.prototype.$ = function (selector) { return this.querySelector(selector); };
    // HTMLDocument.prototype.$$ = function (selector) { return this.querySelectorAll(selector); };

})(window, so);
