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
    var isNaN = window.isNaN;
    var trim = function(s) { return s == null ? '' : (''+ s).replace(re_trim, '') };
    var isBool = $.isBool, isTrue = $.isTrue, isFalse = $.isFalse;
    var isVoid = $.isVoid, isNull = $.isNull, isUndefined = $.isUndefined;
    var isObject = $.isObject, isArray = $.isArray;
    var isNumber = $.isNumber, isNumeric = $.isNumeric, isString = $.isString;
    var isWindow = $.isWindow, isDocument = $.isDocument;
    var isNode = $.isNode, isNodeElement = $.isNodeElement;
    var toStyleName = $.util.toCamelCaseFromDashCase;
    var querySelector = function(root, selector) { return root.querySelector(selector); };
    var querySelectorAll = function(root, selector) { return root.querySelectorAll(selector); };
    var _break = 0 /* loop break tick */, _var /* no define one-var each time (@minify) */;

    function getTag(el) {return (el && el.nodeName) ? el.nodeName.toLowerCase() : isWindow(el) ? '#window' : null;}

    function isRoot(el) {return _var = getTag(el), _var == '#window' || _var == '#document';}
    function isRootElement(el) { return _var = getTag(el), _var == 'html' || _var == 'body';}
    function isDom(input) {return (input instanceof Dom);}

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
        re_attrState = /(((check|select|disabl)ed|readonly)!?)/gi,
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
        if (re = selector.match(re_attrState)) {
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
                selector = trim(selector);
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
                this.parents().forEach(function(_s) {
                    if (s && s == _s) ret = true; return _break;
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
                && (s[0] = trim(s[0]))
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

        var doc = $.getDocument(el);
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
            var win = $.getWindow(el);
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
            var body = $.getDocument(el).body;
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

    function hasAttribute(el, name) {
        return el && el.hasAttribute(name);
    }
    function setAttribute(el, name, value) {
        if (el) {
            if (isNull(value)) {
                el.removeAttribute(name);
            } else if (re_attrStateName.test(name)) {
                isUndefined(value) || value ? el.setAttribute(name, name) : el.removeAttribute(name);
            } else {
                el.setAttribute(name, trim(value));
            }
        }
    }
    function getAttribute(el, name, valueDefault) {
        return hasAttribute(el, name) ? el.getAttribute(name) : valueDefault;
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
                if (name == '*') {
                    $.for(el.attributes, function(attribute) {
                        names.push(attribute.name);
                    });
                } else { names = name.split(re_commaSplit); }

                while (name = names.shift()) {
                    el.removeAttribute(name);
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
                    log(el.options[el.selectedIndex])
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
        setId: function(id) {
            return this.setAttribute('id', id);
        },
        getId: function() {
            return this.getAttribute('id');
        }
    });

    $.dom = function(selector, root, i) {
        return initDom(selector, root, i);
    };

    $.onReady(function() { var doc = document, dom, el, els, body = document.body
        els = new Dom('body')
        // log(els)
        // log('---')

        el = $.dom("#form_i")
        log(el.getValue())
        // el.removeAttribute("name,value")
        // log("attr:",el.getAttribute("id"))
        // log(el.getAttribute("ACCEPT_CHARSETs"))
        // log(el[0].getAttribute("ACCEPT_CHARSETs"))

        $.fire(2, function() {
            // log("attr:",el.attribute("id", "undefined"))
            // el.setAttribute("disabled", false)
        });

        // els = els.find('input[so:v=1]')
        // els = els.find('input:not([checked])')
        // els = els.find('input:checked!)')
        // els = els.find('p:nth(1)')
        // els = els.find('input:first, input:last, p:nth(1), a, button')
        // els = els.find('#div-target')
    })

    // HTMLDocument.prototype.$ = function (selector) { return this.querySelector(selector); };
    // HTMLDocument.prototype.$$ = function (selector) { return this.querySelectorAll(selector); };

})(window, so);
