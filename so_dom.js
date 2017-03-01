// deps: so, so.list, so.util
;(function(window, $, undefined) { 'use strict';

    var ALL = '*';

    var NODE_TYPE_ELEMENT = 1,
        NODE_TYPE_TEXT = 3,
        NODE_TYPE_COMMENT = 8,
        NODE_TYPE_DOCUMENT = 9,
        NODE_TYPE_DOCUMENT_FRAGMENT = 11;

    var re_space = /\s+/g;
    var re_comma = /,\s*/;
    var re_trim = /^\s+|\s+$/g;
    var re_htmlContent = /^<([a-z-]+).*\/?>(?:.*<\/\1>)?$/i;
    var isNaN = window.isNaN;
    var trim = $.trim, trims = $.trimSpace;
    var split = function split(s, re) {return trims(s).split(re);};
    var isBool = $.isBool, isTrue = $.isTrue, isFalse = $.isFalse;
    var isVoid = $.isVoid, isNull = $.isNull, isNulls = $.isNulls, isUndefined = $.isUndefined;
    var isObject = $.isObject, isArray = $.isArray;
    var isNumber = $.isNumber, isNumeric = $.isNumeric, isString = $.isString;
    var isWindow = $.isWindow, isDocument = $.isDocument;
    var isNode = $.isNode, isNodeElement = $.isNodeElement;
    var getWindow = $.getWindow, getDocument = $.getDocument;
    var toStyleName = $.util.toCamelCaseFromDashCase;
    var querySelector = function(root, selector) { return root.querySelector(selector); };
    var querySelectorAll = function(root, selector) { return root.querySelectorAll(selector); };
    var _break = 0 /* loop break tick */, _var /* no define one-var each time (@minify) */;

    function getTag(el) {return (el && el.nodeName) ? el.nodeName.toLowerCase() : isWindow(el) ? '#window' : null;}

    function isRoot(el) {return _var = getTag(el), _var == '#window' || _var == '#document';}
    function isRootElement(el) { return _var = getTag(el), _var == 'html' || _var == 'body';}
    function isDom(input) {return (input instanceof Dom);}

    function toKeyValueObject(key, value) {
        var ret = key || {};
        if (isString(ret)) {
            ret = {}, ret[key] = value;
        }
        return ret;
    }

    function initDom(selector, root, i, one) {
        if (isDom(selector)) {
            return selector;
        }
        return new Dom(selector, root, i, one);
    }

    var re_attr = /\[.+\]/;
    var re_attrFix = /\[(.+)=(.+)\]/g;
    var re_attrEscape = /([.:])/g;
    var re_attrQuotes = /(^['"]|['"]$)/g;
    var re_attrState = /(((check|select|disabl)ed|readonly)!?)/gi;
    var re_fln = /(?:(\w+):((fir|la)st|nth\((\d+)\)))(?!-)/gi;

    function select(selector, root, one) {
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
            selector = selector.replace('('+ reRemove.join('|') +'),?\\s*'.toRegExp('gi'), '');
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
        if (re = selector.match(re_attrState)) {
            search = $.re(re[0], 'g'), replace = re[0].replace(not, '');
            if (re[0].has(not)) {
                selector = selector.replace(search, 'not([%s])'.format(replace));
            } else {
                selector = selector.replace(search, replace);
            }
        }

        return $.array(ret, one ? querySelector(root, selector) : querySelectorAll(root, selector));
    }

    function Dom(selector, root, i, one) {
        var elements, size = 0;

        if (isNumber(root)) {
            i = root, root = undefined;
        }

        if (!isVoid(selector)) {
            if (isString(selector)) {
                selector = trims(selector);
                if (selector) {
                    if (re_htmlContent.test(selector)) {
                        elements = createElement(selector);
                        if (isObject(root)) {
                            $.forEach(elements, function(name, value){
                                elements.setAttribute(name, value);
                            });
                        }
                    } else {
                        elements = select(selector, root, one);
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
                'root': {value: root},
                  'me': {get: function() { return this[0]; }}
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
                        element = _element; return _break;
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
                is.split(re_comma).forEach(function(i) {
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

    // dom: contents
    Dom.extendPrototype({
        text: function(input) {
            return isVoid(input) ? this.getText() : this.setText(input);
        },
        setText: function(input) {
            return this.for(function(el) { el.textContent = (''+ input); });
        },
        getText: function() {
            return __(this, 'textContent');
        },
        html: function(input) {
            return isVoid(input) ? this.getHtml() : this.setHtml(input);
        },
        getHtml: function(input) {
            return this.for(function(el) { el.innerHTML = (''+ input); });
        },
        getHtml: function() {
            return __(this, 'innerHTML');
        }
    });

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
                ret = !!(el && el.parentNode);
            } else {
                s = initDom(s)[0];
                this.parents().forEach(function(_s) {
                    if (s && s == _s) ret = true; return _break;
                });
            }
            return !!ret;
        },
        hasChild: function(s) { return !!this.children().size;},
        hasChildren: function(s) { return this.hasChild();},
        window: function(content) {
            var el = this[0], ret;
            if (el) {
                ret = !content ? getWindow(el) : el.contentWindow;
            }
            return initDom(ret);
        },
        document: function(content) {
            var el = this[0], ret;
            if (el) {
                ret = !content ? getDocument(el) : el.contentDocument;
            }
            return initDom(ret);
        }
    });

    var re_rgb = /rgb/i;
    var re_color = /color/i;
    var re_unit = /(?:p[xt]|em|%)/i; // short & quick
    var re_unitOther = /(?:ex|in|[cm]m|pc|v[hw]?min)/i;
    var nonUnitStyles = ['opacity', 'zoom', 'zIndex', 'columnCount', 'columns', 'fillOpacity', 'fontWeight', 'lineHeight'];

    function getStyle(el, name, value) {
        var style = getWindow(el).getComputedStyle(el);
        return name ? (name = toStyleName(name), style[name] || value || '') : style;
    }
    function setStyle(el, name, value) {
        name = toStyleName(name), value = trims(value);
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
                && (s[0] = trims(s[0]))
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
        style: function(name, value, valueDefault, raw) {
            return !isVoid(value) ? this.setStyle(name, value)
                : this.getStyle(name, value, valueDefault, raw);
        },
        setStyle: function(name, value) {
            var styles = name;
            if (isString(styles)) {
                styles = !isVoid(value) ? toKeyValueObject(name, value) : parseStyleText(name);
            }
            this.for(function(el) {
                $.forEach(styles, function(name, value) {
                    setStyle(el, name, value);
                });
            });
        },
        getStyle: function(name, valueDefault, raw) {
            var el = this[0];
            var convert = isVoid(valueDefault) || isTrue(valueDefault);
            var value, valueDefault = !isBool(valueDefault) ? valueDefault : '';
            if (el) {
                if (raw) {
                    return el.style[toStyleName(name)] || valueDefault;
                }
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
        getComputedStyle: function() {
            var el = this[0], ret = {};
            if (el) {
                $.forEach(getStyle(el), function(name, value) {
                    if (!isNumeric(name)) {
                        ret[name] = value;
                    }
                }, null, false);
            }
            return ret;
        },
        removeStyle: function(name) {
            return this.for(function(el) {
                if (name == ALL) {
                    el.removeAttribute('style');
                } else {
                    name.split(re_comma).forEach(function(name) {
                        setStyle(el, name, '');
                    });
                }
            });
        }
    });

    var matchesSelector = document.documentElement.matches || function(selector) {
        var i = 0, all = querySelectorAll(this.ownerDocument, selector);
        while (i < all.length) {
            if (all[i++] == this) {
                return true;
            }
        }
        return false;
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
        return el && !(el.offsetWidth || el.offsetHeight);
    }
    function isHiddenParent(el) {
        var parent = el && el.parentElement;
        while (parent) {
            if (isHidden(parent)) {
                return true;
            }
            parent = parent.parentElement;
        }
        return false;
    }
    function getHiddenElementProperties(el, properties) {
        var ret = [];
        var sid = $.sid(), className = ' '+ sid;
        var styleText = el.style.cssText;
        var parent = el.parentElement, parents = [], parentStyle;

        while (parent) { // doesn't give if parents are hidden
            if (isHidden(parent)) {
                parentStyle = getStyle(parent);
                parents.push({el: parent, styleText: parent.style.cssText});
                parent.className += className;
                parent.style.display = '', parent.style.visibility = ''; // for `!important` annots
            }
            parent = parent.parentElement;
        }

        var doc = getDocument(el);
        var css = doc.createElement('style');
        css.textContent = '.'+ sid +'{display:block!important;visibility:hidden!important}';
        doc.body.appendChild(css);

        el.className += className;
        el.style.display = '', el.style.visibility = ''; // for `!important` annots

        // finally, grap it!
        properties.forEach(function(name) {
            var value = el[name];
            if (value.call) { // el.getBoundingClientRect() etc.
                value = value.call(el);
            }
            ret.push(value);
        });

        // restore all
        doc.body.removeChild(css);
        el.className = el.className.replace(className, '');
        if (styleText) el.style.cssText = styleText;
        while (parent = parents.shift()) {
            parent.el.className = parent.el.className.replace(className, '');
            if (parent.styleText) parent.el.style.cssText = parent.styleText;
        }

        return ret;
    }

    // @note: offset(width|height) = (width|height) + padding + border
    function getDimensions(el) {
        var ret = {width: 0, height: 0};
        if (isNodeElement(el)) {
            if (isHidden(el) || isHiddenParent(el)) {
                var properties = getHiddenElementProperties(el, ['offsetWidth', 'offsetHeight']);
                ret.width = properties[0], ret.height = properties[1];
            } else {
                ret.width = el.offsetWidth, ret.height = el.offsetHeight;
            }
        } else if (isRoot(el)) {
            var win = getWindow(el);
            width = win.innerWidth, height = win.innerHeight;
        }
        return ret;
    }
    function getDimensionsBy(el, by, options) {
        options = options || {};
        var dim = getDimensions(el);
        var ret = $.extend(dim, {
            innerWidth: dim.width, outerWidth: dim.width,
            innerHeight: dim.height, outerHeight: dim.height
        }), style;
        if (isNodeElement(el)) {
            style = getStyle(el);
            if ((!by || by == 'width') && dim.width) {
                ret.width -= sumStyleValue(null, style, 'paddingLeft', 'paddingRight')
                           + sumStyleValue(null, style, 'borderLeftWidth', 'borderRightWidth');
                if (by) return ret.width;
            }
            if ((!by || by == 'innerWidth') && dim.width) {
                ret.innerWidth -= sumStyleValue(null, style, 'borderLeftWidth', 'borderRightWidth');;
                if (by) return ret.innerWidth;
            }
            if ((!by || by == 'outerWidth') && dim.width) {
                if (options.margined) {
                    ret.outerWidth += sumStyleValue(null, style, 'marginLeft', 'marginRight');
                }
                if (by) return ret.outerWidth;
            }
            if ((!by || by == 'height') && dim.height) {
                ret.height -= sumStyleValue(null, style, 'paddingTop', 'paddingBottom')
                            + sumStyleValue(null, style, 'borderTopWidth', 'borderBottomWidth');
                if (by) return ret.height;
            }
            if ((!by || by == 'innerHeight') && dim.height) {
                ret.innerHeight -= sumStyleValue(null, style, 'borderTopWidth', 'borderBottomWidth');
                if (by) return ret.innerHeight;
            }
            if ((!by || by == 'outerHeight') && dim.height) {
                if (options.margined) {
                    ret.outerHeight += sumStyleValue(dim.el, style, 'marginTop', 'marginBottom');
                }
                if (by) return ret.outerHeight;
            }
        }
        return ret; // all
    }

    // dom: dimensions
    Dom.extendPrototype({
        dimensions: function() {
            return getDimensions(this[0]);
        },
        width: function() {
            return getDimensionsBy(this[0], 'width');
        },
        innerWidth: function() {
            return getDimensionsBy(this[0], 'innerWidth');
        },
        outerWidth: function(margined) {
            return getDimensionsBy(this[0], 'outerWidth', {margined: margined});
        },
        height: function() {
            return getDimensionsBy(this[0], 'height');
        },
        innerHeight: function() {
            return getDimensionsBy(this[0], 'innerHeight');
        },
        outerHeight: function(margined) {
            return getDimensionsBy(this[0], 'outerHeight', {margined: margined});
        }
    });

    function getOffset(el, relative) {
        var ret = {top: 0, left: 0};
        if (isNodeElement(el)) {
            var body = getDocument(el).body;
            if (isHidden(el) || isHiddenParent(el)) {
                var properties = getHiddenElementProperties(el, ['offsetTop', 'offsetLeft']);
                ret.top = properties[0], ret.left = properties[1];
            } else {
                ret.top = el.offsetTop, ret.left = el.offsetLeft;
            }
            ret.top += body.scrollTop, ret.left += body.scrollLeft;
            if (relative) {
                var parentOffset = getOffset(el.parentElement, relative);
                ret.top += parentOffset.top, ret.left += parentOffset.left;
            }
        }
        return ret;
    }
    function getScroll(el) {
        var ret = {top: 0, left: 0};
        if (isNodeElement(el)) {
            ret.top = el.scrollTop, ret.left = el.scrollLeft;
        } else if (isRoot(el) || isRootElement(el)) {
            var win = $.win(el);
            ret.top = win.pageYOffset, ret.left = win.pageXOffset;
        }
        return ret;
    }

    // dom: offset, scroll, scrollTo, box
    Dom.extendPrototype({
        offset: function() {return getOffset(this[0]);},
        scroll: function() {return getScroll(this[0]);},
        scrollTo: function(top, left, anim, animDuration, animOnEnd) {
            var el = this[0];
            if (el) {
                top = top || 0, left = left || 0;
                if (!anim) {
                    el.scrollTop = top, el.scrollLeft = left;
                } else {
                    // @todo
                }
            }
            return initDom(el);
        },
        box: function() {
            var el = this[0], ret = {};
            if (el) {
                var style = getStyle(el);
                var borderXSize = sumStyleValue(null, style, 'borderLeftWidth', 'borderRightWidth');
                var borderYSize = sumStyleValue(null, style, 'borderTopWidth', 'borderBottomWidth');
                var marginXSize = sumStyleValue(null, style, 'marginLeft', 'marginRight');
                var marginYSize = sumStyleValue(null, style, 'marginTop', 'marginBottom');
                var dim = getDimensionsBy(el), parentDim = getDimensions(el.parentElement);
                var offset = getOffset(el), scroll = getScroll(el);
                ret = dim;
                ret.outerWidthMargined = dim.width + marginXSize;
                ret.outerHeightMargined = dim.height + marginYSize;
                ret.offset = offset;
                ret.offset.right = ret.offset.x = parentDim.width - borderXSize - (offset.left + dim.outerWidth);
                ret.offset.bottom = ret.offset.y = parentDim.height - borderYSize - (offset.top + dim.outerHeight);
                ret.scroll = scroll;
                ret.scroll.x = scroll.left;
                ret.scroll.y = scroll.top;
            }
            return ret;
        }
    });

    var re_attrStateName = /^(?:(?:check|select|disabl)ed|readonly)$/i;
    var re_attrNameRemove = /[^\w:.-]/g;

    function toAttributeName(name) {  //return name
        return name = name.startsWith('@') ? 'data-'+ name.slice(1) /* @foo => data-foo */ : name,
            name.replace(re_attrNameRemove, '-').trimSpace();
    }
    function hasAttribute(el, name) {
        return el && el.hasAttribute(toAttributeName(name));
    }
    function setAttribute(el, name, value) {
        if (el) {
            name = toAttributeName(name);
            if (isNull(value)) {
                el.removeAttribute(name);
            } else if (re_attrStateName.test(name)) {
                isUndefined(value) || value ? el.setAttribute(name, name) : el.removeAttribute(name);
            } else {
                el.setAttribute(name, value);
            }
        }
    }
    function getAttribute(el, name, valueDefault) {
        return name = toAttributeName(name), hasAttribute(el, name) ? el.getAttribute(name) : valueDefault;
    }

    // dom: attributes
    Dom.extendPrototype({
        attribute: function(name, value) {
            var ret;
            if (isNull(value)) {
                ret = this.removeAttribute(name);
            } else if (isUndefined(value)) {
                ret = this.getAttribute(name);
            } else {
                ret = this.setAttribute(name, value);
            }
            return ret;
        },
        attributes: function() {
            var el = this[0], ret = {};
            if (el) {
                $.for(el.attributes, function(attribute) {
                    ret[attribute.name] = re_attrStateName.test(attribute.name)
                        ? attribute.name :  attribute.value;
                });
            }
            return ret;
        },
        hasAttribute: function(name) {
            return hasAttribute(this[0], name);
        },
        setAttribute: function(name, value) {
            return this.for(function(el) {
                setAttribute(el, name, value);
            });
        },
        getAttribute: function(name, valueDefault) {
            return getAttribute(this[0], name, valueDefault);
        },
        removeAttribute: function(name) {
            return this.for(function(el) {
                var names = [];
                if (name == ALL) {
                    $.for(el.attributes, function(attribute) {
                        names.push(attribute.name);
                    });
                } else {
                    names = name.split(re_comma);
                }

                while (name = names.shift()) {
                    el.removeAttribute(toAttributeName(name));
                }
            });
        }
    });

    // dom: values
    Dom.extendPrototype({
        value: function(value) {
            var ret;
            if (isNull(value)) {
                ret = this.setValue('');
            } else if (isUndefined(value)) {
                ret = this.getValue();
            } else {
                ret = this.setValue(value);
            }
            return ret;
        },
        setValue: function(value) {
            value += ''; // @important
            return this.for(function(el) {
                if (el.options) { // <select>
                    $.for(el.options, function(option) {
                        if (option.value === value) {
                            option.selected = true;
                        }
                    });
                } else {
                    el.value = value;
                }
            });
        },
        getValue: function(valueDefault) {
            var el = this[0], ret = valueDefault, option;
            if (el) {
                if (el.options && !isVoid(option = el.options[el.selectedIndex])) {
                    ret = hasAttribute(option, 'value')
                        ? (option.disabled || option.parentElement.disabled ? '' : option.value) : '';
                } else {
                    ret = el.value;
                }
            }
            return ret;
        }
    });

    // dom: id
    Dom.extendPrototype({
        id: function(id) {
            return (id || isNull(id)) ? this.setId(id) : this.getId();
        },
        sid: function() {
            var el = this[0], ret;
            if (hasAttribute(el, 'sid')) {
                ret = getAttribute(el, 'sid');
            } else {
                ret = $.sid(), setAttribute(el, 'sid', ret);
            }
            return ret;
        },
        setId: function(id) {
            return this.setAttribute('id', id);
        },
        getId: function() {
            return this.getAttribute('id');
        }
    });

    function toClassRegExp(name) {
        return $.re('(^| )'+ name +'( |$)', null, '1m');
    }
    function hasClass(el, name) {
        return el && el.className && toClassRegExp(name).test(el.className);
    }
    function addClass(el, name) {
        split(name, re_space).forEach(function(name) {
            if (!hasClass(el, name)) {
                el.className += ' '+ name;
            }
        });
    }
    function removeClass(el, name) {
        split(name, re_space).forEach(function(name) {
            el.className = el.className.replace(toClassRegExp(name), '');
        });
    }

    // dom: class
    Dom.extendPrototype({
        class: function(name, option) {
            if (isUndefined(option)) { // add: ('foo')
                this.addClass(name);
            } else if (isNull(option) || isNulls(option)) { // remove: ('foo', '' | null)
                this.removeClass(name);
            } else if (isTrue(option)) { // set: ('foo', true)
                this.setClass(name);
            } else { // replace: ('foo', 'bar')
                this.replaceClass(name, (''+ option));
            }
            return this
        },
        hasClass: function(name) {
            return !!hasClass(this[0], name);
        },
        addClass: function(name) {
            return this.for(function(el) { addClass(el, name); });
        },
        removeClass: function(name) {
            return (name == ALL) ? this.setClass('')
                : this.for(function(el) { removeClass(el, name); });
        },
        setClass: function(name) {
            return this.for(function(el) { el.className = name; });
        },
        replaceClass: function(oldName, newName) {
            return this.for(function(el) {
                el.className = el.className.replace(toClassRegExp(oldName), ' '+ newName +' ');
            });
        },
        toggleClass: function(name) {
            return this.for(function(el) {
                hasClass(el, name) ? removeClass(el, name) : addClass(el, name);
            });
        }
    });

    function checkData(el) {
        el.$data = el.$data || $.list();
    }

    // dom: data
    Dom.extendPrototype({
        data: function(key, value) {
            key = trims(key);

            // data-*
            if (key.startsWith('@')) {
                return this.attribute(key, value);
            }

            // get, get all
            if (isUndefined(value)) {
                var el = this[0], ret;
                if (el) {
                    checkData(el);
                    if (!key) {
                        ret = el.$data;
                    } else if (key == ALL) {
                        ret = el.$data.data;
                    } else {
                        ret = el.$data.get(key);
                    }
                }
                return ret;
            }
            // set
            var data = toKeyValueObject(key, value);
            return this.for(function(el) {
                checkData(el);
                for (key in data) {
                    el.$data.set(key, data[key]);
                }
            });
        },
        removeData: function(key) {
            key = trims(key);

            // data-*
            if (key.startsWith('@')) {
                return this.attribute(key, null);
            }

            return this.for(function(el) {
                checkData(el);
                if (key == ALL) {
                    el.$data.empty();
                } else {
                    split(key, re_comma).forEach(function(key) {
                        el.$data.removeAt(key);
                    });
                }
            });
        }
    });

    var re_plus = /%20/g
    var re_data = /^data:(?:.+)(?:;base64)?,/;
    var encode = encodeURIComponent, decode = decodeURIComponent;

    function toBase64(input) {
        return $.util.base64Encode(decode(input));
    }

    var fileContents, fileContentsStack = [];
    function readFile(file, callback, multiple) {
        var reader = new FileReader();
        reader.onload = function(e) {
            fileContents = trims(e.target.result);
            // opera doesn't give base64 for 'html' files or maybe other more..
            var encoded = fileContents.indexOf(';base64') > -1;
            fileContents = fileContents.replace(re_data, '');
            if (!encoded) {
                fileContents = toBase64(fileContents);
            }
            fileContentsStack.push(fileContents);
            callback(multiple ? fileContentsStack : fileContents);
        };
        reader.readAsDataURL(file);
    }
    function readFiles(file, callback) {
        if (file.files) {
            var multiple = file.files.length > 1;
            $.for(file.files, function(file) {
                readFile(file, callback, multiple);
            });
            fileContentsStack = []; // reset
        } else { // ie >> https://msdn.microsoft.com/en-us/library/314cz14s(v=vs.85).aspx
            var fso, file, fileName = file.value, fileContents = '';
            fso = new ActiveXObject('Scripting.FileSystemObject');
            if (fileName && fso.fileExists(fileName)) {
                file = fso.openTextFile(fileName, 1);
                fileContents = toBase64(file.readAll());
                file.close();
            }
            callback(fileContents);
        }
    }

    // dom: form
    Dom.extendPrototype({
        serialize: function(callback, opt_plus) {
            var el = this[0], ret = '';
            if (getTag(el) == 'form') {
                var data = [];
                var done = true;
                $.for(el, function(el) {
                    if (!el.name || el.disabled) {
                        return;
                    }
                    var type = el.options ? 'select' : el.type ? el.type : getTag(el);
                    var name = encode(el.name).replace(/%5([BD])/g, function($0, $1) {
                        return ($1 == 'B') ? '[' : ']';
                    }), value;

                    switch (type) {
                        case 'select':
                            $.for(el.options, function(option, i) {
                                if (option.selected && option.hasAttribute('value')) {
                                    value = option.value; return _break;
                                }
                            });
                            break;
                        case 'radio':
                        case 'checkbox':
                            value = el.checked ? el.value != 'on' ? el.value : 'on' : undefined;
                            break;
                        case 'submit':
                            value = el.value != '' ? el.value : type;
                            break;
                        case 'file':
                            if (callback) {
                                done = !(el.files && el.files.length);
                                readFiles(el, function(value) {
                                    if (!isArray(value)) { // single, one read
                                        done = true;
                                        data.push(name +'='+ encode(value));
                                    } else {
                                        done = (value.length == el.files.length);
                                        if (done) { // multiple, wait for all read
                                            $.for(value, function(value, i) {
                                                data.push(name +'['+ i +']='+ encode(value));
                                            });
                                        }
                                    }
                                });
                            }
                            break;
                        default:
                            value = el.value;
                    }

                    if (!isVoid(value)) {
                        data.push(name +'='+ encode(value));
                    }
                });

                var _ret = function() {
                    ret = data.join('&');
                    if (!isFalse(opt_plus)) {
                        ret = ret.replace(re_plus, '+');
                    }
                    return ret;
                };

                if (!callback) return _ret();

                ;(function run() {
                    if (done) {
                        return callback(_ret());
                    }
                    $.fire(1, run);
                })();
            }

            return ret;
        },
        serializeArray: function(callback) {
            var _ret = function(data, ret) {
                return ret = [], data.split('&').forEach(function(item) {
                    item = item.split('='), ret.push({name: decode(item[0]), value: decode(item[1])});
                }), ret;
            };
            if (!callback) {
                return _ret(this.serialize(null, false));
            }
            this.serialize(function(data) {
                callback(_ret(data));
            }, false);
        },
        serializeJson: function(callback) {
            var _ret = function(data, ret) {
                return ret = {}, data.forEach(function(item) {
                    ret[item.name] = item.value;
                }), $.json(ret, true);
            };
            if (!callback) {
                return _ret(this.serializeArray(null, false));
            }
            this.serializeArray(function(data) {
                callback(_ret(data));
            }, false);
        }
    });

    // dom: form element states
    Dom.extendPrototype({
        checked: function(option) {
            var _this = this; return isVoid(option) ?
                _this[0].checked : (setAttribute(_this[0], 'checked', option), _this);
        },
        selected: function(option) {
            var _this = this; return isVoid(option) ?
                _this[0].selected : (setAttribute(_this[0], 'selected', option), _this);
        },
        disabled: function(option) {
            var _this = this; return isVoid(option) ?
                _this[0].disabled : (setAttribute(_this[0], 'disabled', option), _this);
        },
        readonly: function(option) {
            var _this = this; return isVoid(option) ?
                _this[0].readOnly : (setAttribute(_this[0], 'readOnly', option), _this);
        }
    });

    // dom: checkers
    Dom.extendPrototype({
        isWindow: function() {
            return isWindow(this[0]);
        },
        isDocument: function() {
            return isDocument(this[0]);
        },
        isNode: function() {
            return isNode(this[0]);
        },
        isNodeElement: function() {
            return isNodeElement(this[0]);
        },
        isRoot: function() {
            return isRoot(this[0]);
        },
        isRootElement: function() {
            return isRootElement(this[0]);
        }
    });

    // dom: events
    var event = $.event;
    if (event) {
        Dom.extendPrototype({
            on: function(type, fn, options) {
                return this.for(function(el) { event.on(el, type, fn, options); });
            },
            once: function(type, fn, options) {
                return this.for(function(el) { event.once(el, type, fn, options); });
            },
            off: function(type, fn, options) {
                return this.for(function(el) { event.off(el, type, fn, options); });
            },
            fire: function(type, fn, options) {
                return this.for(function(el) { event.fire(el, type, fn, options); });
            }
        });
    }

    $.onReady(function() { var doc = document, dom, el, els, body = document.body
        // els = new Dom('body')
        // log(els)
        // log('---')

        el = $.dom("#iframe")
        // el.on("click", log)

        function fn(e) {
            $.dom(this.body).class("*")
            log(e, e.target, this, this.body)
        }

        // window.on("click", function() {
        //     log(this.body.textContent)
        // })

        $.fire("3s", function() {
            // log(el.window().on('click', fn))
            // log(el.document().on('click', fn))
            // log(el.window(true).on('click', fn))
            log(el.document(true).on('click', fn))
        });

        // window.on("click")

        // $.fire("3s", function() {
        //     log(el.window().me.document.body)
        //     log(el.document().me.body)
        //     log(el.window(true).me.document.body)
        //     log(el.document(true).me.body)
        // });

        // $.fire('2s', function() {
        //     log(el.checked(true))
        //     log(el.checked())
        //     $.fire('1s', function() {
        //         log(el.checked(false))
        //         log(el.checked())
        //         $.fire('1s', function() {
        //             log(el.checked(true))
        //             log(el.checked())
        //         })
        //     })
        // })

        // el = $.dom("#form")
        // log(el.serialize())
        // log(el.serializeArray())
        // log(el.serializeJson())
        // el[0].on("submit", function(e) {
        //     e.stopDefault()
        //     // log(el.serialize())
        //     // el.serialize(function(data) {
        //     //     $.http.post('/.dev/so/test/ajax.php', {data:data});
        //     // })
        //     // log(el.serializeArray())
        //     // el.serializeArray(function(data) {
        //     //     log(data)
        //     // })
        //     log(el.serializeJson())
        //     el.serializeJson(function(data) {
        //         log(data)
        //     })
        // })

        // $.fire(2, function() {
        //     el.data(' @foo ', null)
        // });

        // els = els.find('input[so:v=1]')
        // els = els.find('input:not([checked])')
        // els = els.find('input:checked!)')
        // els = els.find('p:nth(1)')
        // els = els.find('input:first, input:last, p:nth(1), a, button')
        // els = els.find('#div-target')
    })

    $.dom = function(selector, root, i) {
        return initDom(selector, root, i);
    };

    // Dom.$ => find --> one=true
    // Dom.$$ => findAll --> one=false

    // HTMLDocument.prototype.$ = function (selector) { return this.querySelector(selector); };
    // HTMLDocument.prototype.$$ = function (selector) { return this.querySelectorAll(selector); };

})(window, so);
