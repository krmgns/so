// deps: so, so.list, so.util
;(function(window, $, undefined) { 'use strict';

    var re_space = /\s+/g;
    var re_comma = /,\s*/;
    var re_trim = /^\s+|\s+$/g;
    var re_tag = /^<[a-z-][^>]*>/i;
    var fn_slice = [].slice;
    var trims = $.trimSpace;
    var isBool = $.isBool, isTrue = $.isTrue, isFalse = $.isFalse;
    var isVoid = $.isVoid, isNull = $.isNull, isNulls = $.isNulls, isUndefined = $.isUndefined;
    var isObject = $.isObject, isArray = $.isArray;
    var isNumber = $.isNumber, isNumeric = $.isNumeric, isString = $.isString;
    var isNode = $.isNode, isNodeElement = $.isNodeElement;
    var isWindow = $.isWindow, isDocument = $.isDocument;
    var getWindow = $.getWindow, getDocument = $.getDocument;
    var extend = $.extend, extendPrototype = $.extendPrototype;
    var toStyleName = $.util.toCamelCaseFromDashCase;
    var _break = 0; // break tick: for, forEach

    function split(s, re) { return trims(s).split(re); };
    function querySelector(root, selector) { return root.querySelector(selector); };
    function querySelectorAll(root, selector) { return root.querySelectorAll(selector); };

    function getTag(el) {return (el && el.nodeName) ? el.nodeName.toLowerCase() : isWindow(el) ? '#window' : null;}

    function isRoot(el, _var) {return _var = getTag(el), _var == '#window' || _var == '#document';}
    function isRootElement(el, _var) {return _var = getTag(el), _var == 'html' || _var == 'body';}
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
        if (selector == '') return;

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

        return $.array(ret, one ? querySelector(root, selector) // speed issues..
            : querySelectorAll(root, selector));
    }

    function Dom(selector, root, i, one) {
        var elements, size = 0;

        if (isNumber(root)) {
            i = root, root = undefined;
        }

        if (!isVoid(selector)) {
            if (isString(selector)) {
                selector = trims(selector);
                if (selector) { // prevent empty selector error
                    if (re_tag.test(selector)) {
                        elements = create(selector, root, root); // 'root' could be document or attribute(s)
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

    // dom: base
    extendPrototype(Dom, {
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

    function create(content, doc, attributes) {
        if (isDom(content)) {
            return content.toArray();
        }
        if (isNodeElement()) {
            return [content];
        }
        doc = doc && isDocument(doc) ? doc : document;
        var tmp = createElement(doc, 'so-tmp');
        var fragment = doc.createDocumentFragment();
        tmp.innerHTML = content;
        while (tmp.firstChild) {
            fragment.appendChild(tmp.firstChild);
        }
        if (attributes && isObject(attributes)) {
            $.for(fragment.childNodes, function(node) {
                if (isNodeElement(node)) {
                    $.forEach(attributes, function(name, value) {
                        node.setAttribute(name, value);
                    });
                }
            });
        }
        return $.array(fragment.childNodes);
    }
    function createElement(doc, tag, properties) {
        return doc.createElement(tag);
    }
    function cloneElement(el, deep) {
        var clone = el.cloneNode();
        clone.setAttribute && clone.setAttribute('so:id', $.sid('clone-'));
        // clone.cloneOf = el; // @debug
        if (!isFalse(deep)) {
            if (el.$data) clone.$data = el.$data;
            if (el.$events) {
                el.$events.forAll(function(event) {
                    event.copy().bindTo(clone);
                });
            }
            if (el.childNodes) {
                $.for(el.childNodes, function(child) {
                    clone.appendChild(cloneElement(child, deep));
                });
            }
        }
        return clone;
    }
    function cleanElement(el) {
        el.$data = el.$events = null;
        var child;
        while (child = el.firstChild) {
            if (isNodeElement(child)) {
                cleanElement(child);
            }
            el.removeChild(child);
        }
        return el;
    }
    function createFor(el, content, attributes) {
        return create(content, getDocument(el), attributes);
    }
    function cloneIf(cloning, node) {
        if (!isFalse(cloning)) { // inserts only once without `clone`
            node = cloneElement(node);
        }
        return node;
    }

    // dom: modifiers
    extendPrototype(Dom, {
        clone: function(deep) {
            var clones = []; return this.for(function(element, i) {
                clones[i] = cloneElement(element, deep);
            }), initDom(clones);
        },
        empty: function() {
            return this.for(function(element) {
                cleanElement(element);
            });
        },
        remove: function() {
            return this.for(function(element) {
                cleanElement(element);
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
        },
        removeFrom: function(selector) {
            return this.for(function(el) {
                $.dom(selector).find(el).remove();
            });
        },
        append: function(content, attributes, cloning) {
            return this.for(function(el) {
                createFor(el, content, attributes).forEach(function(node) {
                    el.appendChild(cloneIf(cloning, node));
                });
            });
        },
        appendTo: function(selector, cloning) {
            if (!isDom(selector)) selector = initDom(selector);
            return this.for(function(el) {
                selector.for(function(node) {
                    node.appendChild(cloneIf(cloning, el));
                });
            });
        },
        prepend: function(content, attributes, cloning) {
            return this.for(function(el) {
                createFor(el, content, attributes).forEach(function(node) {
                    el.insertBefore(cloneIf(cloning, node), el.firstChild);
                });
            });
        },
        prependTo: function(selector, cloning) {
            if (!isDom(selector)) selector = initDom(selector);
            return this.for(function(el) {
                selector.for(function(node) {
                    node.insertBefore(cloneIf(cloning, el), node.firstChild);
                });
            });
        },
        insert: function(content, attributes, cloning) {
            return this.append(content, attributes, cloning);
        },
        insertTo: function(selector, cloning) {
            return this.appendTo(selector, cloning);
        },
        insertBefore: function(selector, cloning) {
            if (!isDom(selector)) selector = initDom(selector);
            return this.for(function(el) {
                selector.for(function(node) {
                    node.parentNode.insertBefore(cloneIf(cloning, el), node);
                });
            });
        },
        insertAfter: function(selector, cloning) {
            if (!isDom(selector)) selector = initDom(selector);
            return this.for(function(el) {
                selector.for(function(node) {
                    node.parentNode.insertBefore(cloneIf(cloning, el), node.nextSibling)
                });
            });
        },
        replaceWith: function(selector, cloning) {
            if (!isDom(selector)) selector = initDom(selector);
            return this.for(function(el) {
                selector.for(function(node) {
                    el.parentNode.replaceChild(cloneIf(cloning, node), el);
                });
            });
        },
        wrap: function(content, attributes) {
            var me = this[0], parent = me && me.parentNode,
                wrapper, replace, clone, clones = [];
            if (parent) {
                wrapper = createFor(me, content, attributes)[0];
                replace = createFor(parent, '<so-tmp>', {style: 'display:none'})[0];
                parent.insertBefore(replace, me);
                this.for(function(el) {
                    clone = cloneElement(el);
                    clones.push(clone);
                    wrapper.appendChild(clone), parent.removeChild(cleanElement(el));
                });
                parent.replaceChild(wrapper, replace);
            }
            return initDom(clones);
        },
        unwrap: function(remove) {
            var me = this[0], parent = me && me.parentNode,
                parentParent = parent && parent.parentNode, clone, clones = [];
            if (parentParent) {
                this.for(function(el) {
                    clone = cloneElement(el);
                    clones.push(clone);
                    parentParent.insertBefore(clone, parent), parent.removeChild(cleanElement(el));
                });
                if (remove || !parentParent.hasChildNodes()) {
                    parentParent.removeChild(cleanElement(parent));
                }
            }
            return initDom(clones);
        }
    });

    function _(_this, i, name) {
        var ret = _this[i];
        if (name) {
            ret = ret && ret[name];
        }
        return ret;
    }
    function __(_this, name) {
        return _(_this, 0, name);
    }

    // dom: property
    extendPrototype(Dom, {
        property: function(name, value) {
            return isUndefined(value) ? this.getProperty(name) : this.setProperty(name, value);
        },
        setProperty: function(name, value) {
            var _this = this; return (_this[0] && (_this[0][name] = value), _this);
        },
        getProperty: function(name) {
            return __(this, name);
        }
    });

    // dom: contents
    extendPrototype(Dom, {
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
        setHtml: function(input) {
            return this.for(function(el) { el.innerHTML = (''+ input); });
        },
        getHtml: function() {
            return __(this, 'innerHTML');
        }
    });

    function intersect(a, b) {
        var tmp = (b.length > a.length) ? (tmp = b, b = a, a = tmp) : null; // loop over shorter
        return a.filter(function(e) {
            return b.indexOf(e) > -1;
        });
    }

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
    extendPrototype(Dom, {
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
                    if (node.nodeType === 8) {
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
                    rets = intersect(rets, this.parent().find(i).toArray());
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
                    rets = intersect(rets, this.parent().find(s).toArray());
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
                    rets = intersect(rets, this.parent().find(s).toArray());
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
    var re_unit = /(?:px|em|%)/i; // short & quick
    var re_unitOther = /(?:ex|in|[cm]m|p[tc]|v[hw]?min)/i;
    var re_noneUnitStyles = /((fill)?opacity|z(oom|index)|(fontw|lineh)eight|column(count|s))/i;
    var matchesSelector = document.documentElement.matches || function(selector) {
        var i = 0, all = querySelectorAll(this.ownerDocument, selector);
        while (i < all.length) {
            if (all[i++] == this) {
                return true;
            }
        }
        return false;
    };
    var defaultStyles = {};

    function getCssStyle(el) {
        var sheets = el.ownerDocument.styleSheets, rules, ret = [];
        $.for(sheets, function(sheet) {
            rules = sheet.rules || sheet.cssRules;
            $.for(rules, function(rule) {
                if (matchesSelector.call(el, rule.selectorText)) {
                    ret.push(rule.style); // loop over all until last
                }
            });
        });
        return ret[ret.length - 1] /* return last rule */ || {};
    }
    function getComputedStyle(el) {
        return getWindow(el).getComputedStyle(el);
    }
    function getDefaultStyle(tag, name) {
        if (!defaultStyles[tag]) {
            var doc = document, el = createElement(doc, tag);
            doc.body.appendChild(el);
            defaultStyles[tag] = getComputedStyle(el)[toStyleName(name)];
            doc.body.removeChild(el);
        }
        return defaultStyles[tag];
    }
    function getStyle(el, name, value) {
        var style = getComputedStyle(el);
        return name ? (name = toStyleName(name), style[name] || value || '') : style;
    }
    function setStyle(el, name, value) {
        name = toStyleName(name), value = trims(value);
        if (value && isNumeric(value) && !re_noneUnitStyles.test(name)) {
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
    function toStyleObject(style) {
        var name, ret = {};
        for (name in style) {
            if (!isNumeric(name) /* skip '"0": "width"' etc. */ &&
                 isString(style[name]) /* has own doesn't work (firefox/51) */) {
                ret[name] = style[name];
            }
        }
        return ret;
    }

    // dom: styles
    extendPrototype(Dom, {
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
            var el = this[0], value = '', convert;
            if (el) {
                convert = isVoid(valueDefault) || isTrue(valueDefault);
                valueDefault = !isBool(valueDefault) ? valueDefault : '';
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
        getCssStyle: function(name) { // original style
            var el = this[0], ret = {};
            if (el) {
                ret = toStyleObject(getCssStyle(el));
            }
            return name ? ret[name] || '' : ret;
        },
        getComputedStyle: function(name) { // rendered style
            var el = this[0], ret = {};
            if (el) {
                ret = toStyleObject(getComputedStyle(el));
            }
            return name ? ret[name] || '' : ret;
        },
        removeStyle: function(name) {
            return this.for(function(el) {
                if (name == '*') {
                    el.removeAttribute('style');
                } else {
                    name.split(re_comma).forEach(function(name) {
                        setStyle(el, name, '');
                    });
                }
            });
        }
    });

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
        var css = createElement(doc, 'style');
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
        var ret = extend(dim, {
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
    extendPrototype(Dom, {
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
    extendPrototype(Dom, {
        offset: function() {return getOffset(this[0]);},
        scroll: function() {return getScroll(this[0]);},
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
        return !!(el && el.hasAttribute(toAttributeName(name)));
    }
    function setAttribute(el, name, value) {
        if (isNodeElement(el)) {
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
    extendPrototype(Dom, {
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
    extendPrototype(Dom, {
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
    extendPrototype(Dom, {
        id: function(id) {
            return !isUndefined(id) ? this.setId(id) : this.getId();
        },
        setId: function(id) {
            return setAttribute(this[0], 'id', id);
        },
        getId: function() {
            return getAttribute(this[0], 'id');
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
    extendPrototype(Dom, {
        class: function(name, option) {
            if (!name) return this.getClass();

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
            return (name == '*') ? this.setClass('')
                : this.for(function(el) { removeClass(el, name); });
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
        },
        setClass: function(name) {
            return this.for(function(el) { el.className = name; });
        },
        getClass: function() {
            return getAttribute(this[0], 'class');
        }
    });

    function checkData(el) {
        el.$data = el.$data || $.list();
    }

    // dom: data
    extendPrototype(Dom, {
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
                    } else if (key == '*') {
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
                if (key == '*') {
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
    extendPrototype(Dom, {
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
    extendPrototype(Dom, {
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
    extendPrototype(Dom, {
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
        extendPrototype(Dom, {
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

    // dom: animations
    var animation = $.animation;
    if (animation) {
        extendPrototype(Dom, {
            animate: function(properties, speed, easing, callback) {
                if (properties == 'stop') { // stop previous animation
                    this.for(function(el) {
                        var animation = el.$animation;
                        if (animation && animation.running) {
                            animation.stop();
                        }
                    });
                } else {
                    this.for(function(el) {
                        animation.animate(el, properties, speed, easing, callback);
                    });
                }
                return this;
            },
            fade: function(to, speed, callback) {
                return this.animate({opacity: to}, speed, callback);
            },
            fadeIn: function(speed, callback) {
                return this.fade(1, speed, callback);
            },
            fadeOut: function(speed, callback) {
                // remove element after fading out
                if (isTrue(callback) || callback == 'remove') {
                    callback = function(el) { $.dom(el).remove(); };
                }
                return this.fade(0, speed, callback);
            },
            show: function(speed, easing, callback) {
                return this.for(function(el) {
                    if (isHidden(el)) {
                        el.style.display = getDefaultStyle(el.tagName, 'display'); // to default
                        animation.animate(el, {opacity: 1}, (speed || 0), easing, callback);
                    }
                });
            },
            hide: function(speed, easing, callback) {
                return this.for(function(el) {
                    if (!isHidden(el)) {
                        animation.animate(el, {opacity: 0}, (speed || 0), easing, function() {
                            el.style.display = 'none'; // to real display
                            callback && callback.call(this);
                        });
                    }
                });
            },
            toggle: function(speed, easing, callback) {
                speed = speed || 0;
                return this.for(function(el) {
                    if (isHidden(el)) {
                        el.style.display = getDefaultStyle(el.tagName, 'display'); // to default
                        animation.animate(el, {opacity: 1}, speed, easing, callback);
                    } else {
                        animation.animate(el, {opacity: 0}, speed, easing, function() {
                            el.style.display = 'none'; // to real display
                            callback && callback.call(this);
                        });
                    }
                });
            },
            blip: function(times, speed) {
                times = times || 10;
                speed = speed || 155;
                var count = times > 0 ? 1 : 0;
                return this.for(function(el) {
                    !function callback() {
                        if (count && count > times) {
                            return;
                        }
                        animation.animate(el, {opacity: 0}, speed, function() {
                            animation.animate(el, {opacity: 1}, speed, callback);
                            count++;
                        });
                    }();
                });
            },
            scrollTo: function(top, left, speed, easing, callback) {
                top = top || 0, left = left || 0;
                return this.for(function(el) {
                    animation.animate(el, {scrollTop: top, scrollLeft: left}, speed, easing, callback);
                });
            }
        });
    }

    function kerem() {} // @tmp go-to

    $.onReady(function() { var doc = document, dom, el, els, body = document.body
        // $.fire('3s', function() {
        //     // log(el)
        // })
    })

    // var DomPrototype = {}; extendPrototype lari azaltmak icin?

    $.dom = function(selector, root, i) {
        return initDom(selector, root, i);
    };
    // add static methods
    $.dom.extend({
        create: function(content, attributes) {
            return create(content, null, attributes);
        },
        isUnitStyle: function(value) {
            return !re_noneUnitStyles.test(value);
        }
    });

    // Dom.$ => find --> one=true
    // Dom.$$ => findAll --> one=false

    // HTMLDocument.prototype.$ = function (selector) { return this.querySelector(selector); };
    // HTMLDocument.prototype.$$ = function (selector) { return this.querySelectorAll(selector); };

})(window, so);
