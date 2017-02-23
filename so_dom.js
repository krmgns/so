// deps: so, so.list, so.util
;(function(window, $, undefined) { 'use strict';

    var NODE_TYPE_ELEMENT = 1,
        NODE_TYPE_TEXT = 3,
        NODE_TYPE_COMMENT = 8,
        NODE_TYPE_DOCUMENT = 9,
        NODE_TYPE_DOCUMENT_FRAGMENT = 11;

    var re_space = /\s+/g;
    var re_trim = /^\s+|\s+$/g;
    var re_commaSplit = /,\s*/;
    var re_htmlContent = /^<([a-z-]+).*\/?>(?:.*<\/\1>)?$/i;
    var ret_root = /^#(?:window|document)$/;
    var isNaN = window.isNaN;
    var trim = function(s) { return s == null ? '' : (''+ s).replace(re_trim, '') };
    var isBool = $.isBool, isTrue = $.isTrue, isFalse = $.isFalse;
    var isVoid = $.isVoid, isObject = $.isObject, isArray = $.isArray;
    var isNumber = $.isNumber, isNumeric = $.isNumeric, isString = $.isString;
    var isWindow = $.isWindow, isDocument = $.isDocument;
    var isNode = $.isNode, isNodeElement = $.isNodeElement;
    var toStyleName = $.util.toCamelCaseFromDashCase;
    var querySelector = function(root, selector) { return root.querySelector(selector); };
    var querySelectorAll = function(root, selector) { return root.querySelectorAll(selector); };
    var _break = 0 /* loop break tick */, _var /* no define one-var each time (@minify) */;

    function getTag(el) {return (el && el.nodeName) ? el.nodeName.toLowerCase() : isWindow(el) ? '#window' : null;}

    function isRoot(el) {return _var = getTag(el), !!(_var && _var.test(ret_root));}

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

        var re, ret = [], reRemove = [];
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

                reRemove.push($.util.escapeRegExpInput(re[0]));
            });

            // remove processed selectors
            selector = selector.replace('(%s),?\\s*'.format(reRemove.join('|')).toRegExp('gi'), '');
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
            } else if (isWindow(selector) || isDocument(selector)) {
                elements = [selector];
            } else if (isNode(selector)) {
                if (root && root != selector.parentNode) {
                    // pass (check root reliability)
                } else {
                    elements = [selector];
                }
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
        find: function(selector, i) {return this[0] ? initDom(selector, this[0], i) : this;},
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
                    if (i == getTag(_element)) {
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
        tag: function() {return getTag(this[0])},
        tags: function() {var ret = [];return this.for(function(element) {ret.push(getTag(element))}), ret;}
    });

    function cloneElement(element, deep) {
        var clone = element.cloneNode();
        // clone.cloneOf = function() { return element; }; // @wait
        clone.id += ':clone-'+ $.id();
        if (!isFalse(deep)) {
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
    function walk(root, property) {
        var node = root, nodes = [];
        while (node && (node = node[property])) {
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
        path: function(join) {
            var el = this[0], path, paths = [];
            if (el) {
                path = el.nodeName.toLowerCase();
                if (el.id) path += '#'+ el.id;
                if (el.className) path += '.'+ el.className.split(re_space).join('.');
                paths.push(path);
                return this.parents().for(function(node) {
                    path = node.nodeName.toLowerCase();
                    if (node.id) path += '#'+ node.id;
                    if (node.className) path += '.'+ node.className.split(re_space).join('.');
                    paths.push(path);
                }), paths = paths.reverse(), join ? paths.join(' > ') : paths;
            }
        },
        parent: function() { return initDom(__(this, 'parentNode')); },
        parents: function() { return initDom(walk(this[0], 'parentNode')); },
        comments: function() {
            var el = this[0], node, nodes = [], i = 0;
            if (el) {
                while (node = el.childNodes[i++]) {
                    if (node.nodeType === NODE_TYPE_COMMENT) {
                        nodes.push(node);
                    }
                }
            }
            return initDom(nodes);
        },
        siblings: function(i) {
            var el = __(this), elp = el && el.parentNode, rets;
            if (el && elp) {
                rets = walk(elp, 'children').filter(function(_el) {
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
        children: function() { return initDom(__(this, 'children')); },
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
                rets = walk(el, 'nextElementSibling');
                if (s && rets.length) {
                    rets = match(rets, this.parent().find(s).toArray());
                }
            }
            return initDom(rets);
        },
        contains: function(s) {var el = this[0]; return !!(el && initDom(s, el).size);},
        hasParent: function(s) {
            var el = this[0], ret;
            if (!s) {
                ret = el && el.parentNode;
            } else {
                s = initDom(s)[0];
                walk(el, 'parentNode').forEach(function(_s) {
                    if (s && s == _s) ret = true; return 0;
                });
            }
            return !!ret;
        },
        hasChild: function(s) { return !!this.children().size;},
        hasChildren: function(s) { return this.hasChild();}
    });

    var re_rgb = /rgb/i;
    var re_color = /color/i;
    var re_unit = /(?:p[xt]|em|%)/i; // short & quick
    var re_unitOther = /(?:ex|in|[cm]m|pc|v[hw]?min)/i;
    var nonUnitStyles = ['opacity', 'zoom', 'zIndex', 'columnCount', 'columns', 'fillOpacity', 'fontWeight', 'lineHeight'];

    function toKeyValue(key, value) {
        var ret = key;
        if (isString(ret)) {
            ret = {}, ret[key] = value;
        }
        return ret;
    }

    function getStyle(el, name, value) {
        return _var = $.getWindow(el).getComputedStyle(el),
            name ? (name = toStyleName(name), _var[name] || value || '') : _var;
    }
    function setStyle(el, name, value) {
        name = toStyleName(name), value = trim(value);
        if (value && isNumeric(value) && !nonUnitStyles.has(name)) {
            value += 'px';
        }
        el.style[name] = value;
    }
    function hasStyle(el, name) {return el && el.style.cssText.indexOf(name) > -1;}
    function parseStyleText(text) {
        var styles = {}, s;
        text = (''+ text).split($.re('\\s*;\\s*'));
        while (text.length) {
            // wtf! :)
            (s = text.shift().split($.re('\\s*:\\s*')))
                && (s[0] = $.trim(s[0]))
                    && (styles[s[0]] = s[1] || '');
        }
        return styles;
    }
    function sumStyleValue(el, style) {
        var i = 2, args = arguments, ret = 0, style = style || getStyle(el);
        while (i < args.length) {
            ret += style[args[i++]].toFloat();
        }
        return ret;
    }

    // dom: styles
    Dom.extendPrototype({
        setStyle: function(name, value) {
            var styles = name;
            if (isString(styles)) {
                styles = !isVoid(value) ? toKeyValue(name, value) : parseStyleText(name);
            }
            this.for(function(el) {
                $.forEach(styles, function(name, value) {
                    setStyle(el, name, value);
                });
            });
        },
        getStyle: function(name, valueDefault, raw) {
            var el = this[0], value,
                convert = isVoid(valueDefault) || isTrue(valueDefault),
                valueDefault = !isBool(valueDefault) ? valueDefault : '';
            if (el) {
                if (raw) return el.style[toStyleName(name)] || valueDefault;

                value = getStyle(el, name);
                if (value && convert) {
                    value = re_rgb.test(value) ? $.util.toHexFromRgb(value) // convert rgb to hex
                        : re_unit.test(value) || re_unitOther.test(value) // convert px etc. to float
                        ? value.toFloat() : value;
                } else if (!value) {
                    value = valueDefault;
                }
            }
            return value;
        },
        removeStyle: function(name) {
            return this.for(function(el) {
                if (name == '*') {
                    el.removeAttribute('style');
                } else {
                    name.split(re_commaSplit).forEach(function(name) {
                        setStyle(el, name, '');
                    });
                }
            });
        }
    });

    var matchesSelector = document.documentElement.matches || function(selector) {
        var all = querySelectorAll(this.ownerDocument, selector), i = 0;
        while (i < all.length) { if (all[i++] == this) return true; } return false;
    };

    function getCssStyle(el) {
        var sheets = el.ownerDocument.styleSheets, ret = [];
        $.for(sheets, function(sheet) {
            var rules = sheet.rules || sheet.cssRules;
            $.for(rules, function(rule) {
                if (matchesSelector.call(el, rule.selectorText)) {
                    ret.push(rule.style); // loop over all until last
                }
            });
        });
        return ret[ret.length - 1] /* return last rule */ || {};
    }
    function isHidden(el) {
        return el && (el.style.display == 'none' || !(el.offsetWidth || el.offsetHeight));
    }

    function getDimensions(el) {
        var width = 0, height = 0;
        if (el) {
            if (isRoot(el)) {
                var win = $.getWindow(el);
                width = win.innerWidth, height = win.innerHeight;
            } else {
                var style = getStyle(el), styleText;
                width = el.offsetWidth, height = el.offsetHeight;
                if (isHidden(el)) {
                    styleText = el.style.cssText;
                    var doc = $.getDocument(el);
                    var sid = $.sid(), className = ' '+ sid;
                    var display = style.display, visibility = style.visibility;
                    var parent = el.parentElement, parents = [], parentStyle;
                    // doesn't give if parents are hidden
                    while (parent) {
                        if (isHidden(parent)) {
                            parentStyle = getStyle(parent);
                            parents.push({el: parent, styleText: parent.style.cssText,
                                display: parentStyle.display, visibility: parentStyle.visibility});
                            parent.className += className;
                            parent.style.display = '', parent.style.visibility = ''; // for `!important` annots
                        }
                        parent = parent.parentElement;
                    }
                    if (parents.length) {
                        var styleEl = doc.createElement('style');
                        styleEl.id = sid;
                        styleEl.textContent = '.'+ sid +'{display:block!important;visibility:hidden!important}';
                        doc.body.appendChild(styleEl);

                        el.className += className;
                        el.style.display = '', el.style.visibility = ''; // for `!important` annots

                        // finally, grap it!
                        width = el.offsetWidth, height = el.offsetHeight;

                        // restore all
                        doc.body.removeChild(styleEl);
                        el.className = el.className.replace(className, '');
                        if (styleText) el.style.cssText = styleText;
                        while (parent = parents.shift()) {
                            parent.el.className = parent.el.className.replace(className, '');
                            if (parent.styleText) parent.el.style.cssText = parent.styleText;
                        }
                    }
                }
                width && (width -= sumStyleValue(null, style, 'borderLeftWidth', 'borderRightWidth'));
                height && (height -= sumStyleValue(null, style, 'borderTopWidth', 'borderBottomWidth'));
            }
        }
        return {width: width, height: height};
    }

    // dom: dimensions
    Dom.extendPrototype({
        dimensions: function() {return getDimensions(this[0]);},
        width: function() { return getDimensions(this[0]).width; },
        height: function() { return getDimensions(this[0]).height; }
    });

    $.dom = function(selector, root, i) { return initDom(selector, root, i) };

    $.onReady(function() { var doc = document, dom, el, els, body = document.body
        els = new Dom('body')
        // log(els)
        // els = els.find('input[so:v=1]')
        // els = els.find('input:not([checked])')
        // els = els.find('input:checked!)')
        // els = els.find('p:nth(1)')
        // els = els.find('input:first, input:last, p:nth(1), a, button')
        // els = els.find('#div-target')
        // log('els:',els)
        // log('---')

        log($.dom("#div").innerWidth())

        // log($.dom(body).width())
        // log($.dom(window).width())
        // log($.dom(document).width())

        $.fire(1, function() {
        });
    })

    // HTMLDocument.prototype.$ = function (selector) { return this.querySelector(selector); };
    // HTMLDocument.prototype.$$ = function (selector) { return this.querySelectorAll(selector); };

})(window, so);
