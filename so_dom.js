/**
 * @object  so.dom
 * @depends so, so.list, so.util
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $, NULL, TRUE, FALSE, UNDEFINED) { 'use strict';

    // minify candies
    var NAME_NODE_TYPE = 'nodeType';
    var NAME_PARENT_NODE  = 'parentNode';
    var NAME_PARENT_ELEMENT = 'parentElement';
    var NAME_FIRST_CHILD = 'firstChild';
    var NAME_CHILDREN = 'children', NAME_CHILD_NODES = 'childNodes';
    var NAME_NEXT_ELEMENT_SIBLING = 'nextElementSibling';
    var NAME_PREVIOUS_ELEMENT_SIBLING = 'previousElementSibling';
    var NAME_PADDING_TOP = 'paddingTop', NAME_PADDING_BOTTOM = 'paddingBottom';
    var NAME_PADDING_LEFT = 'paddingLeft', NAME_PADDING_RIGHT = 'paddingRight';
    var NAME_MARGIN_TOP = 'marginTop', NAME_MARGIN_BOTTOM = 'marginBottom';
    var NAME_MARGIN_LEFT = 'marginLeft', NAME_MARGIN_RIGHT = 'marginRight';
    var NAME_BORDER_TOP_WIDTH = 'borderTopWidth', NAME_BORDER_BOTTOM_WIDTH = 'borderBottomWidth';
    var NAME_BORDER_LEFT_WIDTH = 'borderLeftWidth', NAME_BORDER_RIGHT_WIDTH = 'borderRightWidth';
    var NAME_WIDTH = 'width', NAME_INNER_WIDTH = 'innerWidth', NAME_OUTER_WIDTH = 'outerWidth';
    var NAME_HEIGHT = 'height', NAME_INNER_HEIGHT = 'innerHeight', NAME_OUTER_HEIGHT = 'outerHeight';
    var NAME_OFFSET_WIDTH = 'offsetWidth', NAME_OFFSET_HEIGHT = 'offsetHeight';
    var NAME_OFFSET_TOP = 'offsetTop', NAME_OFFSET_LEFT = 'offsetLeft';
    var NAME_SCROLL_TOP = 'scrollTop', NAME_SCROLL_LEFT = 'scrollLeft';
    var NAME_INNER_HTML = 'innerHTML', NAME_TEXT_CONTENT = 'textContent';
    var NAME_STYLE = 'style', NAME_CLASS_NAME = 'className', NAME_TAG_NAME = 'tagName';
    var NAME_DISPLAY = 'display', NAME_VISIBILITY = 'visibility', NAME_CSS_TEXT = 'cssText';
    var NAME_OWNER_DOCUMENT = 'ownerDocument', NAME_DOCUMENT_ELEMENT = 'documentElement';

    var document = $.document;
    var re_space = /\s+/g;
    var re_comma = /\s*,\s*/;
    var re_tag = /^<([\w-]+)[^>]*>/i;
    var toStyleName = $.util.toCamelCaseFromDashCase;
    var _re = $.re, _array = $.array, _for = $.for, _forEach = $.forEach;
    var _break = 0; // break tick: for, forEach
    var trim = $.trim, extend = $.extend, extendPrototype = $.extendPrototype;
    var getWindow = $.getWindow, getDocument = $.getDocument;
    var isVoid = $.isVoid, isNull = $.isNull, isNulls = $.isNulls, isDefined = $.isDefined,
        isUndefined = $.isUndefined, isString = $.isString, isNumeric = $.isNumeric,
        isNumber = $.isNumber, isArray = $.isArray, isObject = $.isObject, isFunction = $.isFunction,
        isBool = $.isBool, isTrue = $.isTrue, isFalse = $.isFalse, isWindow = $.isWindow, isDocument = $.isDocument;

    // general helpers
    function split(s, re) {
        return trim(s).split(re);
    }
    function querySelector(root, selector) {
        return root.querySelector(selector);
    }
    function querySelectorAll(root, selector) {
        return root.querySelectorAll(selector);
    }
    function getTag(el) {
        return (el && el.nodeName) ? el.nodeName.toLowerCase() : isWindow(el) ? '#window' : NULL;
    }
    function isDom(input) {
        return (input instanceof Dom);
    }
    function isRoot(el, _var) {
        return _var = getTag(el), _var == '#window' || _var == '#document';
    }
    function isRootElement(el, _var) {
        return _var = getTag(el), _var == 'html' || _var == 'body';
    }
    function isNode(el) {
        return !!(el && (el[NAME_NODE_TYPE] === 1 || el[NAME_NODE_TYPE] === 9 || el[NAME_NODE_TYPE] === 11));
    }
    function isNodeElement(el) {
        return !!(el && el[NAME_NODE_TYPE] === 1);
    }
    function toKeyValueObject(key, value) {
        var ret = key || {}; if (isString(ret)) ret = {}, ret[key] = value; return ret;
    }
    function initDom(selector, root, one) {
        return isDom(selector) ? selector : new Dom(selector, root, one);
    }

    var soPrefix = 'so:';
    var re_id = /^#([^ ]+)$/;
    var re_child = /(?:first|last|nth)(?!-)/;
    var re_childFix = /([\w-]+|):(first|last|nth([^-].+))/g;
    var re_attr = /\[.+\]/;
    var re_attrFix = /\[(.+)\]/g;
    var re_attrFixEsc = /([.:])/g;
    var re_attrFixQuote = /(^['"]|['"]$)/g;
    var re_attrSoFix = /so:([^, ]+)/g;

    /**
     * Select.
     * @param  {String|Object} selector
     * @param  {Object}        root?
     * @param  {Bool}          one?
     * @return {Array}
     */
    function select(selector, root, one) {
        if (!selector) return;

        if (!isNode(root)) {
            root = document;
        }

        selector = selector.replace(re_space, ' ');

        if (~selector.search(soPrefix)) {
            selector = selector.replace(re_attrSoFix, function(_, $1) {
                return '[' + soPrefix + $1 + ']';
            });
        }

        if (re_child.test(selector)) {
            selector = selector.replace(re_childFix, function(_, $1, $2, $3) {
                return $1 + ':' + ($3 ? 'nth-child' + $3 : $2 + '-child');
            });
        }

        // grammar: https://www.w3.org/TR/css3-selectors/#grammar
        if (re_attr.test(selector)) {
            // prevent DOMException [foo=1] is not a valid selector.
            selector = selector.replace(re_attrFix, function(_, $1) {
                var s = '=', name, value;
                $1 = $1.trim('[]').split(s);
                name = $1[0].replace(re_attrFixEsc, '\\$1');
                if ($1.length > 1) {
                    value = $1.slice(1).join(s).replace(re_attrFixQuote, '');
                    return '[' + name + '="' + value + '"]';
                }
                return '[' + name + ']';
            });
        }

        return _array(one ? querySelector(root, selector) // speed issues..
            : querySelectorAll(root, selector));
    }

    /**
     * Dom.
     * @param {String|Object} selector
     * @param {Object}        root?
     * @param {Bool}          one?
     */
    function Dom(selector, root, one) {
        var els, size = 0, re, id, soid;

        if (selector) {
            if (isString(selector)) {
                selector = trim(selector);
                // prevent empty selector error
                if (selector) {
                    // id check (speed)
                    if (re = selector.match(re_id)) {
                        els = [(root = document).getElementById(re[1])];
                    } else if (re = selector.match(re_tag)) {
                        // root could be document or attributes
                        els = create(selector, root, root, re[1]);
                    } else if (selector[0] == '>' && isNodeElement(root)) {
                        // buggy :scope selector
                        id = getAttr(root, (soid = soPrefix + 'id')) || $.rid('');
                        setAttr(root, soid, id, FALSE);
                        // fix '>' only selector
                        if (selector.length == 1) {
                            selector = '> *';
                        }
                        els = select((selector = '[%s="%s"] %s'.format(soid, id, selector)), NULL, one);
                    } else {
                        els = select(selector, root, one);
                    }
                }
            } else if (isWindow(selector) || isDocument(selector)) {
                els = [selector];
            } else if (isNode(selector)) {
                if (root && root != selector[NAME_PARENT_NODE]) {
                    // pass (check root reliability)
                } else {
                    els = [selector];
                }
            } else if (isArray(selector)) {
                els = [], selector.forEach(function(el) {
                    isDom(el) ? els = els.concat(el.all()) : els.push(el);
                });
            } else {
                els = selector;
            }

            _for(els, function(el) {
                if (el) this[size++] = el;
            }, this);
        }

        // define all read-only
        Object.defineProperties(this, {
                '_size': {value: size},
                '_root': {value: root},
            '_selector': {value: selector, writable: TRUE}
        });
    }

    // dom: base
    extendPrototype(Dom, {
        /**
         * Size.
         * @return {Int}
         */
        size : function() {
            return this._size;
        },

        /**
         * Find.
         * @param  {String|Object} selector
         * @return {Dom}
         */
        find: function(selector) {
            return this[0] ? initDom(selector, this[0], TRUE) : this;
        },

        /**
         * Find all.
         * @param  {String|Object} selector
         * @return {Dom}
         */
        findAll: function(selector) {
            return this[0] ? initDom(selector, this[0]) : this;
        },

        /**
         * To array.
         * @return {Array}
         */
        toArray: function() {
            for (var i = 0, array = [], el; el = this[i]; i++) {
                array[i] = el;
            }
            return array;
        },

        /**
         * To list.
         * @return {List}
         */
        toList: function() {
            return $.list(this.all());
        },

        /**
         * To html (alias of getHtml()).
         */
        toHtml: function(outer) {
            return this.getHtml(outer);
        },

        /**
         * To text (alias of getText()).
         */
        toText: function() {
            return this.getText();
        },

        /**
         * For.
         * @param  {Function} fn
         * @return {Dom}
         */
        for: function(fn) {
            return _for(this.all(), fn, this);
        },

        /**
         * For each.
         * @param  {Function} fn
         * @return {Dom}
         */
        forEach: function(fn) {
            return _forEach(this.all(), fn, this);
        },

        /**
         * Has.
         * @param  {Element} el
         * @return {Bool}
         */
        has: function(el) {
            for (var i = 0, _el; _el = this[i]; i++) {
                if (_el == el) return TRUE;
            }
            return FALSE;
        },

        /**
         * Has size.
         * @return {Bool}
         */
        hasSize: function() {
            return this._size > 0;
        },

        /**
         * Copy.
         * @return {Dom}
         */
        copy: function() {
            return initDom(this.all());
        },

        /**
         * Map.
         * @param  {Function} fn
         * @return {Dom}
         */
        map: function(fn) {
            return initDom(this.all().map(fn));
        },

        /**
         * Filter.
         * @param  {Function|String} fn
         * @return {Dom}
         */
        filter: function(fn) {
            var all = this.all(), alls;
            if (isFunction(fn)) {
                return initDom(all.filter(fn));
            } else if (isString(fn)) {
                alls = initDom(fn);
                return initDom(all.filter(function(el) {
                    return alls.has(el);
                }));
            }
        },

        /**
         * Reverse.
         * @return {Dom}
         */
        reverse: function() {
            return initDom(this.all().reverse());
        },

        /**
         * Get.
         * @param  {Int} i?
         * @return {Object}
         */
        get: function(i) {
            return this[(i || 1) - 1]; // 1 = first, not 0
        },

        /**
         * Get all.
         * @param  {Int} ...arguments
         * @return {Array}
         */
        getAll: function() {
            var el, els = [], _this = this, args = arguments;

            if (!args.length) {
                els = _this.all();
            } else {
                _for(args, function(i) {
                    el = _this.get(i);
                    if (el && !els.has(el)) {
                        els.push(el);
                    }
                });
            }

            return els;
        },

        /**
         * Item.
         * @param  {Int} i
         * @return {Dom}
         */
        item: function(i) {
            return initDom(this[i - 1]);
        },

        /**
         * Items.
         * @return {Dom}
         */
        items: function() {
            return initDom(this.getAll.apply(this, arguments));
        },

        /**
         * First.
         * @return {Dom}
         */
        first: function() {
            return this.item(1);
        },

        /**
         * Last.
         * @return {Dom}
         */
        last: function() {
            return this.item(this._size);
        },

        /**
         * Nth.
         * @param  {Int|String} i
         * @return {Dom}
         */
        nth: function(i) {
            if (isNumber(i)) {
                return this.item(i);
            }

            i = i.toInt();
            return initDom(this.filter(function(node, _i) {
                return !((_i + 1) % i);
            }));
        },

        /**
         * Tag.
         * @return {String}
         */
        tag: function() {
            return getTag(this[0])
        },

        /**
         * Tags.
         * @return {Array}
         */
        tags: function() {
            var ret = []; return this.for(function(el) {
                ret.push(getTag(el))
            }), ret;
        },

        /**
         * All (alias of toArray()).
         */
        all: function() {
            return this.toArray();
        }
    });

    // create helpers
    function create(content, doc, attrs, tag) {
        if (isDom(content)) return content.all();
        if (isNode(content)) return [content];

        var tmp, tmpTag, frg;
        tmpTag = 'so-tmp';

        // fix table stuff
        tag = tag || (content.match(re_tag) || [,])[1];
        if (tag) {
            switch (tag.toLowerCase()) {
                case 'tr': tmpTag = 'tbody'; break;
                case 'th': case 'td': tmpTag = 'tr'; break;
                case 'thead': case 'tbody': case 'tfoot': tmpTag = 'table'; break;
            }
        }

        doc = isDocument(doc) ? doc : document;
        tmp = createElement(doc, tmpTag, {innerHTML: content});
        frg = doc.createDocumentFragment();
        while (tmp[NAME_FIRST_CHILD]) {
            frg.appendChild(tmp[NAME_FIRST_CHILD]);
        }

        if (attrs && isObject(attrs)) {
            _for(frg[NAME_CHILD_NODES], function(node) {
                if (isNodeElement(node)) {
                    _forEach(attrs, function(name, value) {
                        setAttr(node, name, value);
                    });
                }
            });
        }

        return _array(frg[NAME_CHILD_NODES]);
    }

    function createElement(doc, tag, properties) {
        var el = doc.createElement(tag);
        if (properties) {
            _forEach(properties, function(name, value) {
                el[name] = value;
            });
        }
        return el;
    }

    function cloneElement(el, deep) {
        var clone = el.cloneNode();
        // clone.cloneOf = el; // @debug
        setAttr(clone, soPrefix + 'clone', $.id(), FALSE);
        if (!isFalse(deep)) {
            if (el.$data) clone.$data = el.$data;

            if (el.$events) {
                _for(el.$events, function(events) {
                    _for(events, function(event) {
                        event.bindTo(clone);
                    });
                });
            }

            if (el[NAME_CHILD_NODES]) {
                _for(el[NAME_CHILD_NODES], function(child) {
                    clone.appendChild(cloneElement(child, deep));
                });
            }
        }

        return clone;
    }

    function cleanElement(el) {
        el.$data = el.$events = NULL;
        var child;
        while (child = el[NAME_FIRST_CHILD]) {
            if (isNodeElement(child)) {
                cleanElement(child);
            }
            el.removeChild(child);
        }
        return el;
    }

    function createFor(el, content, attrs) {
        return create(content, getDocument(el), attrs);
    }

    function cloneIf(cloning, node) { // inserts only once without `clone`
        if (cloning === FALSE) {
            // pass
        } else if (cloning === TRUE || !hasAttr(node, soPrefix + 'clone')) {
            node = cloneElement(node);
        }
        return node;
    }

    // dom: modifiers
    extendPrototype(Dom, {
        /**
         * Colne.
         * @param  {Bool} deep?
         * @return {Dom}
         */
        clone: function(deep) {
            var clones = []; return this.for(function(el, i) {
                clones[i] = cloneElement(el, deep);
            }), initDom(clones);
        },

        /**
         * Empty.
         * @return {Dom}
         */
        empty: function() {
            return this.for(function(el) {
                cleanElement(el);
            });
        },

        /**
         * Remove
         * @return {Dom}
         */
        remove: function() {
            return this.for(function(el) {
                cleanElement(el);
                if (el[NAME_PARENT_NODE]) {
                    el[NAME_PARENT_NODE].removeChild(el);
                }
            });
        },

        /**
         * Remove all.
         * @param  {String} selector
         * @return {Dom}
         */
        removeAll: function(selector) {
            var parent = this[0], _parent;
            if (parent) {
                this.findAll(selector).for(function(el) {
                    _parent = el[NAME_PARENT_NODE];
                    if (_parent && _parent == parent) {
                        parent.removeChild(cleanElement(el));
                    }
                });
            }
            return this;
        },

        /**
         * Append.
         * @param  {String|Object|Dom} content
         * @param  {Bool}              cloning?
         * @param  {Object}            attrs?
         * @return {Dom}
         */
        append: function(content, cloning, attrs) {
            return this.for(function(el) {
                createFor(el, content, attrs).forEach(function(node) {
                    el.appendChild(cloneIf(cloning, node));
                });
            });
        },

        /**
         * Append to.
         * @param  {String}  selector
         * @param  {Bool}    cloning?
         * @return {Dom}
         */
        appendTo: function(selector, cloning) {
            if (!isDom(selector)) {
                selector = initDom(selector);
            }

            return this.for(function(el) {
                selector.for(function(node) {
                    node.appendChild(cloneIf(cloning, el));
                });
            });
        },

        /**
         * Prepend.
         * @param  {String|Object|Dom} content
         * @param  {Bool}              cloning?
         * @param  {Object}            attrs?
         * @return {Dom}
         */
        prepend: function(content, cloning, attrs) {
            return this.for(function(el) {
                createFor(el, content, attrs).forEach(function(node) {
                    el.insertBefore(cloneIf(cloning, node), el[NAME_FIRST_CHILD]);
                });
            });
        },

        /**
         * Prepend to.
         * @param  {String}  selector
         * @param  {Bool}    cloning?
         * @return {Dom}
         */
        prependTo: function(selector, cloning) {
            if (!isDom(selector)) {
                selector = initDom(selector);
            }

            return this.for(function(el) {
                selector.for(function(node) {
                    node.insertBefore(cloneIf(cloning, el), node[NAME_FIRST_CHILD]);
                });
            });
        },

        /**
         * Insert (alias of append()).
         */
        insert: function(content, cloning, attrs) {
            return this.append(content, cloning, attrs);
        },

        /**
         * Insert to (alias of appendTo()).
         */
        insertTo: function(selector, cloning) {
            return this.appendTo(selector, cloning);
        },

        /**
         * Insert before.
         * @param  {String}  selector
         * @param  {Bool}    cloning?
         * @return {Dom}
         */
        insertBefore: function(selector, cloning) {
            if (!isDom(selector)) {
                selector = initDom(selector);
            }

            return this.for(function(el) {
                selector.for(function(node) {
                    node[NAME_PARENT_NODE].insertBefore(cloneIf(cloning, el), node);
                });
            });
        },

        /**
         * Insert before.
         * @param  {String}  selector
         * @param  {Bool}    cloning?
         * @return {Dom}
         */
        insertAfter: function(selector, cloning) {
            if (!isDom(selector)) {
                selector = initDom(selector);
            }

            return this.for(function(el) {
                selector.for(function(node) {
                    node[NAME_PARENT_NODE].insertBefore(cloneIf(cloning, el), node.nextSibling)
                });
            });
        },

        /**
         * Replace with.
         * @param  {String}  selector
         * @param  {Bool}    cloning?
         * @return {Dom}
         */
        replaceWith: function(selector, cloning) {
            if (!isDom(selector)) {
                selector = initDom(selector);
            }

            return this.for(function(el) {
                selector.for(function(node) {
                    el[NAME_PARENT_NODE].replaceChild(cloneIf(cloning, node), el);
                });
            });
        },

        /**
         * Wrap.
         * @param  {String|Object|Dom} content
         * @param  {Object}            attrs?
         * @return {Dom}
         */
        wrap: function(content, attrs) {
            var me = this[0], parent = me && me[NAME_PARENT_NODE],
                wrapper, replace, clone, clones = [];

            if (parent) {
                wrapper = createFor(me, content, attrs)[0];
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

        /**
         * Unwrap
         * @param  {Bool} remove?
         * @return {Dom}
         */
        unwrap: function(remove) {
            var me = this[0], parent = me && me[NAME_PARENT_NODE],
                parentParent = parent && parent[NAME_PARENT_NODE], clone, clones = [];

            if (parentParent) {
                this.for(function(el) {
                    clone = cloneElement(el);
                    clones.push(clone);
                    parentParent.insertBefore(clone, parent), parent.removeChild(cleanElement(el));
                });
                // removes if remove=true or no child anymore
                if (remove || !parentParent.hasChildNodes()) {
                    parentParent.removeChild(cleanElement(parent));
                }
            }

            return initDom(clones);
        }
    });

    // shortcut getter helpers
    function _(dom, i, name) {
        return name ? dom[i] && dom[i][name] : dom[i];
    }
    function __(dom, name) {
        return _(dom, 0, name);
    }

    // dom: property
    extendPrototype(Dom, {
        /**
         * Property.
         * @param  {String} name
         * @param  {Any}    value?
         * @return {Any|Dom}
         */
        property: function(name, value) {
            return isDefined(value) ? this.setProperty(name, value) : this.getProperty(name);
        },

        /**
         * Has property.
         * @param  {String} name
         * @return {Bool}
         */
        hasProperty: function(name) {
            return !!(this[0] && (name in this[0]));
        },

        /**
         * Set property.
         * @param  {String} name
         * @param  {Any}    value
         * @return {Dom}
         */
        setProperty: function(name, value) {
            var properties = toKeyValueObject(name, value);
            return this.for(function(el) {
                for (name in properties) {
                    el[name] = properties[name];
                }
            });
        },

        /**
         * Get property.
         * @param  {String} name
         * @return {Any}
         */
        getProperty: function(name) {
            return __(this, name);
        }
    });

    // dom: contents
    extendPrototype(Dom, {
        /**
         * Text.
         * @param  {String} input?
         * @return {String|Dom}
         */
        text: function(input) {
            return isDefined(input) ? this.setText(input) : this.getText();
        },

        /**
         * Set text.
         * @param  {String} input
         * @return {Dom}
         */
        setText: function(input) {
            return this.for(function(el) {
                el[NAME_TEXT_CONTENT] = input;
            });
        },

        /**
         * Get text.
         * @return {String}
         */
        getText: function() {
            return __(this, NAME_TEXT_CONTENT);
        },

        /**
         * Html.
         * @param  {String|Bool} input?
         * @return {String|Any}
         */
        html: function(input) {
            return isUndefined(input) || isTrue(input) ? this.getHtml(input) : this.setHtml(input);
        },

        /**
         * Set html
         * @param  {String} input
         * @return {Dom}
         */
        setHtml: function(input) {
            return this.for(function(el) {
                el[NAME_INNER_HTML] = input;
            });
        },

        /**
         * Get html.
         * @param  {Bool} outer
         * @return {String}
         */
        getHtml: function(outer) {
            return outer ? __(this, 'outerHTML') : __(this, NAME_INNER_HTML);
        },

        /**
         * Is empty.
         * @param  {Bool} trimContent?
         * @return {Bool}
         */
        isEmpty: function(trimContent) {
            var content;
            switch (this.tag()) {
                case 'input':
                case 'select':
                case 'textarea':
                    content = this.value();
                    break;
                case '#window':
                case '#document':
                    content = '1';
                    break;
                default:
                    content = this.html();
            }
            return !(trimContent ? trim(content) : content);
        },
    });

    // array intersect helper
    function intersect(a, b, match) {
        var tmp = (b.length > a.length)
            ? (tmp = b, b = a, a = tmp) : NULL; // loop over shorter

        return a.filter(function(search) {
            return !match ? b.indexOf(search) < 0 : b.indexOf(search) > -1;
        });
    }

    // walker helper
    function walk(root, property) {
        var node = root, nodes = [];
        while (node && (node = node[property])) {
            if (!isNode(node)) { // handle nodelist etc.
                nodes = nodes.concat(_array(node));
            } else {
                nodes.push(node);
            }
        }
        return nodes;
    }

    // dom: walkers
    extendPrototype(Dom, {
        /**
         * Not.
         * @param  {Int|Array|String|Object} selector
         * @return {Dom}
         */
        not: function(selector) {
            var ret = [], els;

            // eg: $.dom("p").not(0) or $.dom("p").not([0,1])
            if (isNumber(selector) || isArray(selector)) {
                ret = this.filter(function(_, i) {
                    return (selector != i + 1);
                });
            }
            // eg: $.dom("p").not(".red") or $.dom("p").not(this)
            else {
                els = this.parent().findAll(selector);
                ret = this.filter(function(el) {
                    return !els.has(el);
                });
            }

            return initDom(ret);
        },

        /**
         * Odd.
         * @return {Dom}
         */
        odd: function() {
            return initDom(this.filter(function(el, i) {
                return (i & 1);
            }));
        },

        /**
         * Even.
         * @return {Dom}
         */
        even: function() {
            return initDom(this.filter(function(el, i) {
                return !(i & 1);
            }));
        },

        /**
         * Parent.
         * @return {Dom}
         */
        parent: function() {
            return initDom(__(this, NAME_PARENT_NODE));
        },

        /**
         * Parents.
         * @return {Dom}
         */
        parents: function() {
            return initDom(walk(this[0], NAME_PARENT_NODE));
        },

        /**
         * Comments.
         * @return {Dom}
         */
        comments: function() {
            var el = this[0], node, nodes = [], i = 0;
            if (el) {
                while (node = el[NAME_CHILD_NODES][i++]) {
                    if (node.nodeType === 8) {
                        nodes.push(node);
                    }
                }
            }
            return initDom(nodes);
        },

        /**
         * Siblings.
         * @param  {Int|String} selector?
         * @return {Dom}
         */
        siblings: function(selector) {
            var el = __(this), ret;
            if (el) {
                ret = walk(el[NAME_PARENT_NODE], NAME_CHILDREN).filter(function(_el) {
                    return _el != el;
                });
                if (selector && ret.length) {
                    ret = intersect(ret, this.parent().findAll(selector).all());
                }
            }
            return initDom(ret);
        },

        /**
         * Children.
         * @return {Dom}
         */
        children: function() {
            return initDom(__(this, NAME_CHILDREN));
        },

        /**
         * Prev.
         * @return {Dom}
         */
        prev: function() {
            return initDom(__(this, NAME_PREVIOUS_ELEMENT_SIBLING));
        },

        /**
         * Prev all.
         * @param  {String} selector?
         * @return {Dom}
         */
        prevAll: function(selector) {
            var el = this[0], ret = [];

            if (el) {
                ret = walk(el, NAME_PREVIOUS_ELEMENT_SIBLING).reverse();
                if (selector && ret.length) {
                    ret = intersect(ret, this.parent().findAll(selector).all());
                }
            }

            return initDom(ret);
        },

        /**
         * Next.
         * @return {Dom}
         */
        next: function() {
            return initDom(__(this, NAME_NEXT_ELEMENT_SIBLING));
        },

        /**
         * Next all.
         * @param  {String} selector?
         * @return {Dom}
         */
        nextAll: function(selector) {
            var el = this[0], ret = [], found;

            if (el) {
                ret = walk(el, NAME_NEXT_ELEMENT_SIBLING);
                if (selector && ret.length) {
                    ret = intersect(ret, this.parent().findAll(selector).all());
                }
            }

            return initDom(ret);
        },

        /**
         * Matches.
         * @param  {String|Element|Any} selector
         * @return {Bool}
         */
        matches: function(selector) {
            return !!(this[0] && initDom(selector).has(this[0]));
        },

        /**
         * Contains.
         * @param  {String|Element} selector
         * @return {Bool}
         */
        contains: function(selector) {
            return !!(this[0] && initDom(selector, this[0])._size);
        },

        /**
         * Has parent.
         * @return {Bool}
         */
        hasParent: function() {
            return !!this.parent()._size;
        },

        /**
         * Has parents.
         * @return {Bool}
         */
        hasParents: function() {
            return !!this.parent().parent()._size;
        },

        /**
         * Has child.
         * @return {Bool}
         */
        hasChild: function() {
            return this.children()._size > 0;
        },

        /**
         * Has children.
         * @return {Bool}
         */
        hasChildren: function() {
            return this.children()._size > 1;
        },

        /**
         * Has content (alias of isEmpty()).
         */
        hasContent: function(trimContent) {
            return this.isEmpty(trimContent);
        },

        /**
         * Window.
         * @param  {Bool} content?
         * @return {Dom}
         */
        window: function(content) {
            var el = this[0];
            return initDom(el && (content ? el.contentWindow : getWindow(el)));
        },

        /**
         * Document.
         * @param  {Bool} content?
         * @return {Dom}
         */
        document: function(content) {
            var el = this[0];
            return initDom(el && (content ? el.contentDocument : getDocument(el)));
        }
    });

    // path helpers
    function getPath(el) {
        var s = getTag(el), path = [];
        if (el.id) {
            s += '#' + el.id; // id is enough
        } else if (el[NAME_CLASS_NAME]) {
            s += '.' + el[NAME_CLASS_NAME].split(re_space).join('.');
        }
        path.push(s);

        if (el[NAME_PARENT_NODE]) {
            path = path.concat(getPath(el[NAME_PARENT_NODE]));
        }

        return path;
    }

    function getXPath(el) {
        var tag = getTag(el);
        if (tag == 'html') {
            return ['html'];
        }
        if (tag == 'body') {
            return ['html', 'body'];
        }

        var i = 0, ii = 0, node, nodes = el[NAME_PARENT_NODE][NAME_CHILDREN], path = [];
        while (node = nodes[i++]) {
            if (node == el) {
                return path.concat(getXPath(el[NAME_PARENT_NODE]), tag + '[' + (ii + 1) + ']');
            }
            if (node[NAME_TAG_NAME] == el[NAME_TAG_NAME]) {
                ii++;
            }
        }

        return path;
    }

    // dom: paths
    extendPrototype(Dom, {
        /**
         * Path.
         * @param  {Bool} string?
         * @return {Array|String}
         */
        path: function(string) {
            var el = this[0], ret = [];
            if (!isNodeElement(el)) {
                return NULL;
            }

            return ret = getPath(el).reverse(), string ? ret.slice(1).join(' > ') : ret;
        },

        /**
         * Xpath.
         * @param  {Bool} string?
         * @return {Array|String}
         */
        xpath: function(string) {
            var el = this[0], ret = [];
            if (!isNodeElement(el)) {
                return NULL;
            }

            return ret = getXPath(el), string ? '/'+ ret.join('/') : ret;
        }
    });

    var re_rgb = /rgb/i;
    var re_color = /color/i;
    var re_unit = /(?:px|em|%)/i; // short & quick
    var re_unitOther = /(?:ex|in|[cm]m|p[tc]|v[hw]?min)/i;
    var re_noneUnitStyles = /(?:(?:fill-?)?opacity|z(?:oom|index)|(?:font-?w|line-?h)eight|column(?:-?count|s))/i;
    var matchesSelector = document[NAME_DOCUMENT_ELEMENT].matches || function(selector) {
        var i = 0, all = querySelectorAll(this[NAME_OWNER_DOCUMENT], selector);
        while (i < all.length) {
            if (all[i++] == this) {
                return TRUE;
            }
        }
        return FALSE;
    };
    var _defaultStylesCache = {};

    // style helpers
    function getCssStyle(el) {
        var sheets = el[NAME_OWNER_DOCUMENT].styleSheets, rules, ret = [];
        _for(sheets, function(sheet) {
            rules = sheet.rules || sheet.cssRules;
            _for(rules, function(rule) {
                if (matchesSelector.call(el, rule.selectorText)) {
                    ret.push(rule[NAME_STYLE]); // loop over all until last
                }
            });
        });
        return ret[ret.length - 1] /* return last rule */ || {};
    }

    function getComputedStyle(el) {
        return getWindow(el).getComputedStyle(el);
    }

    function getDefaultStyle(el, name) {
        var doc = getDocument(el), body = doc.body, tag = el[NAME_TAG_NAME];
        if (!_defaultStylesCache[tag]) {
            el = createElement(doc, tag);
            body.appendChild(el);
            _defaultStylesCache[tag] = getComputedStyle(el)[toStyleName(name)];
            body.removeChild(el);
        }
        return _defaultStylesCache[tag];
    }

    function setStyle(el, name, value) {
        name = toStyleName(name), value = (''+ value);
        if (value && isNumeric(value) && !re_noneUnitStyles.test(name)) {
            value += 'px';
        }
        el[NAME_STYLE][name] = value;
    }

    function getStyle(el, name) {
        var styles = getComputedStyle(el);
        return name ? (styles[toStyleName(name)] || '') : styles;
    }

    function parseStyleText(text) {
        var styles = {}, s;
        text = (''+ text).split(_re('\\s*;\\s*'));
        while (text.length) {
            // wtf! :)
            (s = text.shift().split(_re('\\s*:\\s*')))
                && (s[0] = trim(s[0]))
                    && (styles[s[0]] = s[1] || '');
        }
        return styles;
    }

    function sumStyleValue(el, style) {
        var i = 2, args = arguments, ret = 0, style = style || getStyle(el), name;
        while (name = args[i++]) {
            ret += style[name].toFloat();
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
        /**
         * Style.
         * @param  {String}  name
         * @param  {String}  value?
         * @param  {Bool}    raw?
         * @return {String}
         */
        style: function(name, value, raw) {
            return isNull(value) || isNulls(value) ? this.removeStyle(name)
                : isObject(name) || isString(value) || (name && name.has(':')) ? this.setStyle(name, value)
                : this.getStyle(name, value, raw);
        },

        /**
         * Has style.
         * @param  {String} name
         * @return {Bool}
         */
        hasStyle: function(name) {
            var el = this[0];
            return !!(el && el[NAME_STYLE] && el[NAME_STYLE][NAME_CSS_TEXT].indexOf(name) > -1);
        },

        /**
         * Set style.
         * @param  {String|Object} name
         * @param  {String}        value?
         * @return {Dom}
         */
        setStyle: function(name, value) {
            var styles = name;
            if (isString(styles)) {
                styles = isVoid(value) ? parseStyleText(name) : toKeyValueObject(name, value);
            }

            return this.for(function(el) {
                _forEach(styles, function(name, value) {
                    setStyle(el, name, value);
                });
            });
        },

        /**
         * Get style.
         * @param  {String}  name
         * @param  {Bool}    convert? @default=true
         * @param  {Bool}    raw?     @default=false
         * @return {String?}
         */
        getStyle: function(name, convert, raw) {
            var el = this[0], value = NULL, convert;
            if (el) {
                if (raw) {
                    return el[NAME_STYLE][toStyleName(name)] || value;
                }
                value = getStyle(el, name);
                if (value !== '') {
                    value = isFalse(convert) ? value : (
                        re_rgb.test(value) ? $.util.parseRgbColorToHex(value) // make rgb - hex
                            : re_unit.test(value) || re_unitOther.test(value) // make px etc. - float
                                // || re_noneUnitStyles.test(name) // make opacity etc. - float @cancel use String.toFloat()
                            ? value.toFloat() : value
                    );
                } else {
                    value = NULL;
                }
            }
            return value;
        },

        /**
         * Get styles.
         * @param  {String}  name
         * @param  {Bool}    convert? @default=true
         * @param  {Bool}    raw?     @default=false
         * @return {Object}
         */
        getStyles: function(names, convert, raw) {
            var el = this[0], styles = {};
            if (!names) {
                styles = toStyleObject(getStyle(el));
            } else {
                el = initDom(el);
                split(names, re_comma).forEach(function(name) {
                    styles[name] = el.getStyle(name, convert, raw);
                });
            }
            return styles;
        },

        /**
         * Get css (original) style.
         * @param  {String} name?
         * @return {String}
         */
        getCssStyle: function(name) {
            var el = this[0], ret = {};
            if (el) {
                ret = toStyleObject(getCssStyle(el));
            }
            return name ? ret[name] || '' : ret;
        },

        /**
         * Get computed (rendered) style.
         * @param  {String} name?
         * @return {String}
         */
        getComputedStyle: function(name) {
            var el = this[0], ret = {};
            if (el) {
                ret = toStyleObject(getComputedStyle(el));
            }
            return name ? ret[name] || '' : ret;
        },

        /**
         * Remove style.
         * @param  {String} name
         * @return {Dom}
         */
        removeStyle: function(name) {
            return (name == '*') ? this.attr('style', '') : (name = split(name, re_comma)),
                this.for(function(el) {
                    name.forEach(function(name) {
                        setStyle(el, name, '');
                    });
                });
        }
    });

    // dimension, offset, scroll etc. helpers
    function isVisible(el) {
        return !!(el && (el[NAME_OFFSET_WIDTH] || el[NAME_OFFSET_HEIGHT]));
    }

    function isVisibleParent(el) {
        var parent = el && el[NAME_PARENT_ELEMENT];
        while (parent) {
            if (isVisible(parent)) {
                return TRUE;
            }
            parent = parent[NAME_PARENT_ELEMENT];
        }
        return FALSE;
    }

    function getInvisibleElementProperties(el, properties) {
        var ret = [];
        var doc, css;
        var sid = $.sid(), className = ' '+ sid;
        var styleText = el[NAME_STYLE][NAME_CSS_TEXT];
        var parent = el[NAME_PARENT_ELEMENT], parents = [], parentStyle;

        while (parent) { // doesn't give if parents are invisible
            if (!isVisible(parent)) {
                parentStyle = getStyle(parent);
                parents.push({el: parent, styleText: parent[NAME_STYLE][NAME_CSS_TEXT]});
                parent[NAME_CLASS_NAME] += className;
                parent[NAME_STYLE][NAME_DISPLAY] = '';
                parent[NAME_STYLE][NAME_VISIBILITY] = ''; // for !important annots
            }
            parent = parent[NAME_PARENT_ELEMENT];
        }

        doc = getDocument(el);
        css = createElement(doc, 'style', {
            textContent: '.'+ sid +'{display:block!important;visibility:hidden!important}'
        });
        doc.body.appendChild(css);

        el[NAME_CLASS_NAME] += className;
        el[NAME_STYLE][NAME_DISPLAY] = '';
        el[NAME_STYLE][NAME_VISIBILITY] = ''; // for !important annots

        // finally, grap it!
        properties.forEach(function(name) {
            var value = el[name];
            if (value.call) { // getBoundingClientRect() etc.
                value = value.call(el);
            }
            ret.push(value);
        });

        // restore all
        doc.body.removeChild(css);
        el[NAME_CLASS_NAME] = el[NAME_CLASS_NAME].replace(className, '');
        if (styleText) {
            el[NAME_STYLE][NAME_CSS_TEXT] = styleText;
        }

        while (parent = parents.shift()) {
            parent.el[NAME_CLASS_NAME] = parent.el[NAME_CLASS_NAME].replace(className, '');
            if (parent.styleText) {
                parent.el[NAME_STYLE][NAME_CSS_TEXT] = parent.styleText;
            }
        }

        return ret;
    }

    function getDimensions(el) {
        // @note: offset(width|height) = (width|height) + padding + border
        var ret = {width: 0, height: 0};

        if (isNodeElement(el)) {
            if (!isVisible(el) || !isVisibleParent(el)) {
                var properties = getInvisibleElementProperties(el, [NAME_OFFSET_WIDTH, NAME_OFFSET_HEIGHT]);
                ret.width = properties[0], ret.height = properties[1];
            } else {
                ret.width = el[NAME_OFFSET_WIDTH], ret.height = el[NAME_OFFSET_HEIGHT];
            }
        } else if (isRoot(el)) {
            var win = getWindow(el);
            width = win[NAME_INNER_WIDTH], height = win[NAME_INNER_HEIGHT];
        }

        return ret;
    }

    function getDimensionsBy(el, by, margins) {
        var dim = getDimensions(el);
        var ret = extend(dim, {
            innerWidth: dim.width, outerWidth: dim.width,
            innerHeight: dim.height, outerHeight: dim.height
        }), style;

        if (isNodeElement(el)) {
            style = getStyle(el);
            if ((!by || by == NAME_WIDTH) && dim.width) {
                ret.width -= sumStyleValue(NULL, style, NAME_PADDING_LEFT, NAME_PADDING_RIGHT)
                           + sumStyleValue(NULL, style, NAME_BORDER_LEFT_WIDTH, NAME_BORDER_RIGHT_WIDTH);
                if (by) return ret.width;
            }
            if ((!by || by == NAME_INNER_WIDTH) && dim.width) {
                ret.innerWidth -= sumStyleValue(NULL, style, NAME_BORDER_LEFT_WIDTH, NAME_BORDER_RIGHT_WIDTH);;
                if (by) return ret.innerWidth;
            }
            if ((!by || by == NAME_OUTER_WIDTH) && dim.width) {
                if (margins) {
                    ret.outerWidth += sumStyleValue(NULL, style, NAME_MARGIN_LEFT, NAME_MARGIN_RIGHT);
                }
                if (by) return ret.outerWidth;
            }
            if ((!by || by == NAME_HEIGHT) && dim.height) {
                ret.height -= sumStyleValue(NULL, style, NAME_PADDING_TOP, NAME_PADDING_BOTTOM)
                            + sumStyleValue(NULL, style, NAME_BORDER_TOP_WIDTH, NAME_BORDER_BOTTOM_WIDTH);
                if (by) return ret.height;
            }
            if ((!by || by == NAME_INNER_HEIGHT) && dim.height) {
                ret.innerHeight -= sumStyleValue(NULL, style, NAME_BORDER_TOP_WIDTH, NAME_BORDER_BOTTOM_WIDTH);
                if (by) return ret.innerHeight;
            }
            if ((!by || by == NAME_OUTER_HEIGHT) && dim.height) {
                if (margins) {
                    ret.outerHeight += sumStyleValue(NULL, style, NAME_MARGIN_TOP, NAME_MARGIN_BOTTOM);
                }
                if (by) return ret.outerHeight;
            }
        }

        return ret; // all
    }

    function getOffset(el, relative) {
        var ret = {top: 0, left: 0};

        if (isNodeElement(el)) {
            var body = getDocument(el).body;
            if (!isVisible(el) || !isVisibleParent(el)) {
                var properties = getInvisibleElementProperties(el, [NAME_OFFSET_TOP, NAME_OFFSET_LEFT]);
                ret.top = properties[0], ret.left = properties[1];
            } else {
                ret.top = el[NAME_OFFSET_TOP], ret.left = el[NAME_OFFSET_LEFT];
            }

            ret.top += body[NAME_SCROLL_TOP], ret.left += body[NAME_SCROLL_LEFT];
            if (relative) {
                var parentOffset = getOffset(el[NAME_PARENT_ELEMENT], relative);
                ret.top += parentOffset.top, ret.left += parentOffset.left;
            }
        }

        return ret;
    }

    function getScroll(el) {
        var ret = {top: 0, left: 0};

        if (isNodeElement(el)) {
            ret.top = el[NAME_SCROLL_TOP], ret.left = el[NAME_SCROLL_LEFT];
        } else if (isRoot(el) || isRootElement(el)) {
            var win = getWindow(el);
            ret.top = win.pageYOffset, ret.left = win.pageXOffset;
        }

        return ret;
    }

    // dom: dimensions
    extendPrototype(Dom, {
        /**
         * Dimensions.
         * @return {Object}
         */
        dimensions: function() {
            return getDimensions(this[0]);
        },

        /**
         * Width.
         * @return {Int}
         */
        width: function() {
            return getDimensionsBy(this[0], NAME_WIDTH);
        },

        /**
         * Inner width.
         * @return {Int}
         */
        innerWidth: function() {
            return getDimensionsBy(this[0], NAME_INNER_WIDTH);
        },

        /**
         * Outer width.
         * @param  {Bool} margins
         * @return {Int}
         */
        outerWidth: function(margins) {
            return getDimensionsBy(this[0], NAME_OUTER_WIDTH, margins);
        },

        /**
         * Height.
         * @return {Int}
         */
        height: function() {
            return getDimensionsBy(this[0], NAME_HEIGHT);
        },

        /**
         * Outer height.
         * @return {Int}
         */
        innerHeight: function() {
            return getDimensionsBy(this[0], NAME_INNER_HEIGHT);
        },

        /**
         * Outer height.
         * @param  {Bool} margins
         * @return {Int}
         */
        outerHeight: function(margins) {
            return getDimensionsBy(this[0], NAME_OUTER_HEIGHT, margins);
        }
    });

    // dom: offset, scroll, box, isVisible
    extendPrototype(Dom, {
        /**
         * Offset.
         * @param  {Bool} relative?
         * @return {Object}
         */
        offset: function(relative) {
            return getOffset(this[0], relative);
        },

        /**
         * Scroll.
         * @return {Object}
         */
        scroll: function() {
            return getScroll(this[0]);
        },

        /**
         * Box.
         * @return {Object}
         */
        box: function() {
            var el = this[0], ret = {};

            if (el) {
                var style = getStyle(el);
                var borderXSize = sumStyleValue(NULL, style, NAME_BORDER_LEFT_WIDTH, NAME_BORDER_RIGHT_WIDTH);
                var borderYSize = sumStyleValue(NULL, style, NAME_BORDER_TOP_WIDTH, NAME_BORDER_BOTTOM_WIDTH);
                var marginXSize = sumStyleValue(NULL, style, NAME_MARGIN_LEFT, NAME_MARGIN_RIGHT);
                var marginYSize = sumStyleValue(NULL, style, NAME_MARGIN_TOP, NAME_MARGIN_BOTTOM);
                var dim = getDimensionsBy(el), parentDim = getDimensions(el[NAME_PARENT_ELEMENT]);
                var offset = getOffset(el), scroll = getScroll(el);

                ret = dim;
                // add width, height
                ret.outerWidthMargined = dim.width + marginXSize;
                ret.outerHeightMargined = dim.height + marginYSize;
                // add offset
                ret.offset = offset;
                ret.offset.right = ret.offset.x = parentDim.width - borderXSize - (offset.left + dim.outerWidth);
                ret.offset.bottom = ret.offset.y = parentDim.height - borderYSize - (offset.top + dim.outerHeight);
                // add scroll
                ret.scroll = scroll;
                ret.scroll.x = scroll.left;
                ret.scroll.y = scroll.top;
            }

            return ret;
        },

        /**
         * Is visible.
         * @return {Bool}
         */
        isVisible: function() {
            return isVisible(this[0]);
        }
    });

    var re_attrState = /^(?:(?:check|select|disabl)ed|readonly)$/i;
    var re_attrNameFix = /[^\w:.-]+/g;

    // attr helpers
    function hasAttr(el, name) {
        return !!(el && el.hasAttribute && el.hasAttribute(name));
    }

    function setAttr(el, name, value, state /* @internal */) {
        if (isNodeElement(el)) {
            if (isNull(value)) {
                removeAttr(el, name);
            } else if (state !== FALSE /* speed */ && (state || re_attrState.test(name))) {
                (value || isUndefined(value)) ? (el.setAttribute(name, ''), el[name] = !!value)
                    : (removeAttr(el, name), el[name] = FALSE);
            } else {
                el.setAttribute(name, value);
            }
        }
    }

    function getAttr(el, name) {
        return hasAttr(el, name) ? el.getAttribute(name) : UNDEFINED;
    }

    function getAttrs(el, namesOnly) {
        var ret = _array(el.attributes);
        if (namesOnly) {
            ret = ret.map(function(attr) {
                return attr.name;
            });
        }
        return ret;
    }

    function removeAttr(el, name) {
        if (isNodeElement(el)) el.removeAttribute(name);
    }

    function toDataAttrName(name) {
        return 'data-' + trim(name);
    }

    // dom: attributes
    extendPrototype(Dom, {
        /**
         * Attr.
         * @param  {String} name
         * @param  {Any}    value?
         * @return {Any}
         */
        attr: function(name, value) {
            return isNull(value) ? this.removeAttr(name)
                : isObject(name) || isDefined(value) ? this.setAttr(name, value)
                    : this.getAttr(name);
        },

        /**
         * Attrs.
         * @return {Object}
         */
        attrs: function() {
            var el = this[0], ret = {};
            if (el) {
                getAttrs(el).forEach(function(attr) {
                    ret[attr.name] = re_attrState.test(attr.name) ? attr.name : attr.value;
                });
            }
            return ret;
        },

        /**
         * Has attr.
         * @param  {String} name
         * @return {Bool}
         */
        hasAttr: function(name) {
            return hasAttr(this[0], name);
        },

        /**
         * Set attr.
         * @param  {String} name
         * @param  {String} value?
         * @return {Dom}
         */
        setAttr: function(name, value) {
            var attrs = toKeyValueObject(name, value);
            return this.for(function(el) {
                for (name in attrs) {
                    setAttr(el, name, attrs[name]);
                }
            });
        },

        /**
         * Get attr.
         * @param  {String} name
         * @return {String?}
         */
        getAttr: function(name) {
            return getAttr(this[0], name);
        },

        /**
         * Remve attr.
         * @param  {String} name
         * @return {Dom}
         */
        removeAttr: function(name) {
            name = split(name, re_comma);
            return this.for(function(el) {
                ((name != '*') ? name : getAttrs(el, TRUE)).forEach(function(name) {
                    removeAttr(el, name)
                });
            });
        },

        /**
         * Attribute (alias of attr()).
         */
        attribute: function(name, value) {
            return this.attr(name, value);
        },

        /**
         * Attributes (alias of attrs()).
         */
        attributes: function() {
            return this.attrs();
        },

        /**
         * Data attr (alias of attr()).
         */
        dataAttr: function(name, value) {
            if (isString(name)) {
                name = toDataAttrName(name);
            } else if (isObject(name)) {
                var name_ = {};
                _forEach(name, function(key, value) {
                    name_[toDataAttrName(key)] = value;
                });
                name = name_;
            }
            return this.attr(name, value);
        },

        /**
         * Remove data attr.
         * @param  {String} name
         * @return {Dom}
         */
        removeDataAttr: function(name) {
            name = split(name, re_comma);
            return this.for(function(el) {
                if (name == '*') {
                    name = getAttrs(el, TRUE).filter(function(name) {
                        return name.startsWith('data-');
                    });
                } else {
                    name = name.map(function(name) {
                        return toDataAttrName(name);
                    });
                }
                name.forEach(function(name) { removeAttr(el, name); });
            });
        },

        /**
         * So attr (so:* attributes).
         * @param  {String} value
         * @return {String?|Dom}
         */
        soAttr: function(name, value) {
            return (name = soPrefix + name),
                isDefined(value) ? this.attr(name, value) : this.attr(name);
        },

        /**
         * So attr remove.
         * @param  {String} name
         * @return {Dom}
         */
        soAttrRemove: function(name) {
            return this.attr(soPrefix + name, null);
        }
    });

    // dom: values
    extendPrototype(Dom, {
        /**
         * Value.
         * @param  {String} value?
         * @return {String|Dom}
         */
        value: function(value) {
            return isDefined(value) ? this.setValue(value) : this.getValue();
        },

        /**
         * Set value.
         * @param  {String} value?
         * @return {Dom}
         */
        setValue: function(value) {
            value = isNull(value) ? '' : (value += ''); // @important

            return this.for(function(el) {
                if (el.options) { // <select>
                    _for(el.options, function(option) {
                        if (option.value === value) {
                            option.selected = TRUE;
                        }
                    });
                } else {
                    setAttr(el, 'value', (el.value = value), FALSE);
                }
            });
        },

        /**
         * Get value.
         * @return {String?}
         */
        getValue: function() {
            var el = this[0];
            if (el) {
                return el.options ? getAttr(el.options[el.selectedIndex], 'value') // <select>
                    : el.value;
            }
        }
    });

    // dom: id
    extendPrototype(Dom, {
        /**
         * Id.
         * @param  {String} id?
         * @return {String|Dom}
         */
        id: function(id) {
            return isDefined(id) ? this.setId(id) : this.getId();
        },

        /**
         * Set id.
         * @param  {String} id
         * @return {Dom}
         */
        setId: function(id) {
            return setAttr(this[0], 'id', id, FALSE), this;
        },

        /**
         * Get id.
         * @return {String}
         */
        getId: function() {
            return getAttr(this[0], 'id');
        }
    });

    // class helpers
    function toClassRegExp(name) {
        return _re('(^|\\s+)'+ name +'(\\s+|$)', NULL, '1m');
    }

    function hasClass(el, name) {
        return !!(el && el[NAME_CLASS_NAME] && toClassRegExp(name).test(el[NAME_CLASS_NAME]));
    }

    function addClass(el, name) {
        split(name, re_space).forEach(function(name) {
            if (!hasClass(el, name)) {
                el[NAME_CLASS_NAME] = trim(el[NAME_CLASS_NAME] +' '+ name);
            }
        });
    }

    function removeClass(el, name) {
        split(name, re_space).forEach(function(name) {
            el[NAME_CLASS_NAME] = trim(el[NAME_CLASS_NAME].replace(toClassRegExp(name), ' '));
        });
    }

    // dom: class
    extendPrototype(Dom, {
        /**
         * Class.
         * @param  {String}      name?
         * @param  {String|Bool} option?
         * @return {Bool|Dom}
         */
        class: function(name, option) {
            return isUndefined(option) ? this.addClass(name)
                : isNull(option) || isNulls(option) ? this.removeClass(name)
                : isTrue(option) ? this.setClass(name) : this.replaceClass(name, option);
        },

        /**
         * Has class.
         * @param  {String} name
         * @return {Bool}
         */
        hasClass: function(name) {
            return hasClass(this[0], name);
        },

        /**
         * Add class.
         * @param  {String} name
         * @return {Dom}
         */
        addClass: function(name) {
            return this.for(function(el) {
                addClass(el, name);
            });
        },

        /**
         * Remove class.
         * @param  {String} name
         * @return {Dom}
         */
        removeClass: function(name) {
            return (name == '*') ? this.attr('class', '') : this.for(function(el) {
                removeClass(el, name);
            });
        },

        /**
         * Replace class.
         * @param  {String} oldName
         * @param  {String} newName
         * @return {Dom}
         */
        replaceClass: function(oldName, newName) {
            return this.for(function(el) {
                el[NAME_CLASS_NAME] = trim(el[NAME_CLASS_NAME].replace(toClassRegExp(oldName), ' '+ newName +' '));
            });
        },

        /**
         * Toggle.
         * @param  {String} name
         * @return {Dom}
         */
        toggleClass: function(name) {
            return this.for(function(el) {
                hasClass(el, name) ? removeClass(el, name) : addClass(el, name);
            });
        },

        /**
         * Set class.
         * @param  {String} name
         * @return {Dom}
         */
        setClass: function(name) {
            return this.for(function(el) {
                el[NAME_CLASS_NAME] = name;
            });
        },

        /**
         * Get class.
         * @return {String}
         */
        getClass: function() {
            return getAttr(this[0], 'class');
        }
    });

    // data helpers
    function checkData(el) {
        el.$data = el.$data || $.list();
    }

    function setData(el, key, value) {
        if (el) {
            checkData(el);
            if (isString(key)) {
                key = trim(key);
                el.$data.set(key, value);
            } else {
                var data = toKeyValueObject(key, value);
                for (key in data) {
                    el.$data.set(key, data[key]);
                }
            }
        }
    }

    function getData(el, key) {
        if (el) {
            checkData(el);
            if (isString(key)) {
                key = trim(key);
                return (key == '*') ? el.$data.data : el.$data.get(key);
            }
            if (isTrue(key)) {
                return el.$data; // get list object
            }
        }
    }

    // dom: data
    extendPrototype(Dom, {
        /**
         * Data.
         * @param  {String|Object} key
         * @param  {Any}           value?
         * @return {Any}
         */
        data: function(key, value) {
            return isObject(key) ? this.setData(key) :
                isDefined(value) ? this.setData(key, value) : this.getData(key);
        },

        /**
         * Has data.
         * @param  {String} key?
         * @return {Bool}
         */
        hasData: function(key) {
            var el = this[0];
            return (el && isDefined(key ? getData(el, key) : getData(el, '*')));
        },

        /**
         * Set data.
         * @param  {String|Object} key
         * @param  {Any}           value
         * @return {Dom}
         */
        setData: function(key, value) {
            return this.for(function(el) {
                setData(el, key, value);
            });
        },

        /**
         * Get data.
         * @param  {String} key
         * @return {Any}
         */
        getData: function(key) {
            return (this[0] && getData(this[0], key));
        },

        /**
         * Remove data.
         * @param  {String} key
         * @return {Dom}
         */
        removeData: function(key) {
            key = split(key, re_comma);
            return this.for(function(el) {
                checkData(el);
                if (key == '*') {
                    el.$data.empty();
                } else {
                    key.forEach(function(key) {
                        el.$data.removeAt(key);
                    });
                }
            });
        }
    });

    var re_plus = /%20/g
    var re_data = /^data:(?:.+)(?:;base64)?,/;
    var encode = encodeURIComponent, decode = decodeURIComponent;
    var fileContent, fileContentStack = [];

    // file reader helpers
    function toBase64(input) {
        return $.util.base64Encode(decode(input));
    }

    function readFile(file, callback, multiple) {
        var reader = new FileReader();
        reader.onload = function(e) {
            fileContent = trim(e.target.result);
            // opera doesn't give base64 for 'html' files or maybe other more..
            var encoded = fileContent.indexOf(';base64') > -1;
            fileContent = fileContent.replace(re_data, '');
            if (!encoded) {
                fileContent = toBase64(fileContent);
            }
            fileContentStack.push(fileContent);
            callback(multiple ? fileContentStack : fileContent);
        };
        reader.readAsDataURL(file);
    }

    function readFiles(file, callback) {
        if (file.files) {
            var multiple = file.files.length > 1;
            _for(file.files, function(file) {
                readFile(file, callback, multiple);
            });
            fileContentStack = []; // reset
        } else { // ie >> https://msdn.microsoft.com/en-us/library/314cz14s(v=vs.85).aspx
            var fso, file, fileName = file.value, fileContent = '';
            fso = new ActiveXObject('Scripting.FileSystemObject');
            if (fileName && fso.fileExists(fileName)) {
                file = fso.openTextFile(fileName, 1);
                fileContent = toBase64(file.readAll());
                file.close();
            }
            callback(fileContent);
        }
    }

    // dom: form
    extendPrototype(Dom, {
        /**
         * Serialize.
         * @param  {Function} callback?
         * @param  {Bool}     plus?
         * @return {String}
         */
        serialize: function(callback, plus) {
            var el = this[0], ret = '';
            if (getTag(el) == 'form') {
                var data = [];
                var done = TRUE;
                _for(el, function(el) {
                    if (!el.name || el.disabled) {
                        return;
                    }

                    var type = el.options ? 'select' : el.type ? el.type : getTag(el);
                    var name = encode(el.name).replace(/%5([BD])/g, function($0, $1) {
                        return ($1 == 'B') ? '[' : ']';
                    }), value;

                    switch (type) {
                        case 'select':
                            value = getAttr(el.options[el.selectedIndex], 'value');
                            break;
                        case 'radio':
                        case 'checkbox':
                            value = el.checked ? (el.value != 'on') ? el.value : 'on' : UNDEFINED;
                            break;
                        case 'submit':
                            value = (el.value != '') ? el.value : type;
                            break;
                        case 'file':
                            if (callback) {
                                done = !(el.files && el.files.length);
                                readFiles(el, function(value) {
                                    if (!isArray(value)) { // single, one read
                                        done = TRUE;
                                        data.push(name +'='+ encode(value));
                                    } else {
                                        done = (value.length == el.files.length);
                                        if (done) { // multiple, wait for all read
                                            _for(value, function(value, i) {
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
                    if (!isFalse(plus)) {
                        ret = ret.replace(re_plus, '+');
                    }
                    return ret;
                };

                if (!callback) return _ret();

                // callback waiter
                ;(function wait() {
                    if (done) {
                        return callback(_ret());
                    }
                    $.fire(1, wait);
                })();
            }

            return ret;
        },

        /**
         * Serialize array.
         * @param  {Function} callback?
         * @return {Array}
         */
        serializeArray: function(callback) {
            var _ret = function(data, ret) {
                return ret = [], data.split('&').forEach(function(item) {
                    item = item.split('='), ret.push({
                        name: decode(item[0]), value: decode(item[1])
                    });
                }), ret;
            };

            if (!callback) {
                return _ret(this.serialize(NULL, FALSE));
            }

            this.serialize(function(data) {
                callback(_ret(data));
            }, FALSE);
        },

        /**
         * Serialize json.
         * @param  {Function} callback?
         * @return {String}
         */
        serializeJson: function(callback) {
            var _ret = function(data, ret) {
                return ret = {}, data.forEach(function(item) {
                    ret[item.name] = item.value;
                }), $.json(ret, TRUE);
            };

            if (!callback) {
                return _ret(this.serializeArray());
            }

            this.serializeArray(function(data) {
                callback(_ret(data));
            });
        }
    });

    // state helpers
    function setState(el, name, value) {
        setAttr(el, name, value, TRUE);
    }
    function getState(el, name) {
        return !!(el && el[name]);
    }

    // dom: form elements states
    extendPrototype(Dom, {
        /**
         * Checked.
         * @param  {Bool} option?
         * @return {Bool|Dom}
         */
        checked: function(option) {
            return isVoid(option) ? getState(this[0], 'checked') : this.for(function(el) {
                setState(el, 'checked', option);
            });
        },

        /**
         * Selected.
         * @param  {Bool} option?
         * @return {Bool|Dom}
         */
        selected: function(option) {
            return isVoid(option) ? getState(this[0], 'selected') : this.for(function(el) {
                setState(el, 'selected', option);
            });
        },

        /**
         * Disabled.
         * @param  {Bool} option?
         * @return {Bool|Dom}
         */
        disabled: function(option) {
            return isVoid(option) ? getState(this[0], 'disabled') : this.for(function(el) {
                setState(el, 'disabled', option);
            });
        },

        /**
         * Readonly.
         * @param  {Bool} option?
         * @return {Bool|Dom}
         */
        readonly: function(option) {
            return isVoid(option) ? getState(this[0], 'readOnly') : this.for(function(el) {
                setState(el, 'readOnly', option);
            });
        }
    });

    // dom: checkers
    extendPrototype(Dom, {
        /**
         * Is window.
         * @return {Bool}
         */
        isWindow: function() {
            return isWindow(this[0]);
        },

        /**
         * Is document.
         * @return {Bool}
         */
        isDocument: function() {
            return isDocument(this[0]);
        },

        /**
         * Is node.
         * @return {Bool}
         */
        isNode: function() {
            return isNode(this[0]);
        },

        /**
         * Is node element.
         * @return {Bool}
         */
        isNodeElement: function() {
            return isNodeElement(this[0]);
        },

        /**
         * Is root.
         * @return {Bool}
         */
        isRoot: function() {
            return isRoot(this[0]);
        },

        /**
         * Is root element.
         * @return {Bool}
         */
        isRootElement: function() {
            return isRootElement(this[0]);
        }
    });

    // dom: events
    var event = $.event;
    if (event) {
        extendPrototype(Dom, {
            /**
             * On.
             * @param  {String}   type
             * @param  {Function} fn
             * @param  {Object}   options?
             * @return {Dom}
             */
            on: function(type, fn, options) {
                return this.for(function(el) {
                    event.on(el, type, fn, options);
                });
            },

            /**
             * One.
             * @param  {String}   type
             * @param  {Function} fn
             * @param  {Object}   options?
             * @return {Dom}
             */
            one: function(type, fn, options) {
                return this.for(function(el) {
                    event.one(el, type, fn, options);
                });
            },

            /**
             * Off.
             * @param  {String}   type
             * @param  {Function} fn
             * @param  {Object}   options?
             * @return {Dom}
             */
            off: function(type, fn, options) {
                return this.for(function(el) {
                    event.off(el, type, fn, options);
                });
            },

            /**
             * Fire.
             * @param  {String}   type
             * @param  {Function} fn
             * @param  {Object}   options?
             * @return {Dom}
             */
            fire: function(type, fn, options) {
                return this.for(function(el) {
                    event.fire(el, type, fn, options);
                });
            }
        });
    }

    // dom: animations
    var animate = $.animation && $.animation.animate;
    if (animate) {
        extendPrototype(Dom, {
            /**
             * Animate.
             * @param  {Object|String} properties
             * @param  {Int|String}    speed?
             * @param  {String}        easing?
             * @param  {Function}      callback?
             * @return {Dom}
             */
            animate: function(properties, speed, easing, callback) {
                return (properties == 'stop') // stop previous animation
                    ? this.for(function(el) {
                        var animation = el.$animation;
                        if (animation && animation.running) {
                            animation.stop();
                        }
                    })
                    : this.for(function(el) {
                        animate(el, properties, speed, easing, callback);
                    });
            },

            /**
             * Fade.
             * @param  {Float}      to
             * @param  {Int|String} speed?
             * @param  {Function}   callback?
             * @return {Dom}
             */
            fade: function(to, speed, callback) {
                return this.animate({opacity: to}, speed, callback);
            },

            /**
             * Fade in.
             * @param  {Int|String} speed?
             * @param  {Function}   callback?
             * @return {Dom}
             */
            fadeIn: function(speed, callback) {
                return this.fade(1, speed, callback);
            },

            /**
             * Fade out.
             * @param  {Int|String} speed?
             * @param  {Function}   callback?
             * @return {Dom}
             */
            fadeOut: function(speed, callback) {
                if (isTrue(callback)) { // remove element after fading out?
                    callback = function(animation) {
                        animation.$target.remove();
                    };
                }
                return this.fade(0, speed, callback);
            },

            /**
             * Show.
             * @param  {Int|String} speed?
             * @param  {String}     easing?
             * @param  {Function}   callback?
             * @return {Dom}
             */
            show: function(speed, easing, callback) {
                speed = speed || 0;
                return this.for(function(el) {
                    if (!isVisible(el)) {
                        el[NAME_STYLE][NAME_DISPLAY] = getDefaultStyle(el, 'display');
                        animate(el, {opacity: 1}, speed, easing, callback);
                    }
                });
            },

            /**
             * Hide.
             * @param  {Int|String} speed?
             * @param  {String}     easing?
             * @param  {Function}   callback?
             * @return {Dom}
             */
            hide: function(speed, easing, callback) {
                speed = speed || 0;
                if (isFunction(easing)) {
                    callback = easing, easing = NULL;
                }
                return this.for(function(el) {
                    if (isVisible(el)) {
                        animate(el, {opacity: 0}, speed, easing, function() {
                            el[NAME_STYLE][NAME_DISPLAY] = 'none';
                            callback && callback(this);
                        });
                    }
                });
            },

            /**
             * Toggle.
             * @param  {Int|String} speed?
             * @param  {String}     easing?
             * @param  {Function}   callback?
             * @return {Dom}
             */
            toggle: function(speed, easing, callback) {
                if (isFunction(easing)) {
                    callback = easing, easing = NULL;
                }
                speed = speed || 0;
                return this.for(function(el) {
                    if (!isVisible(el)) {
                        el[NAME_STYLE][NAME_DISPLAY] = getDefaultStyle(el, 'display');
                        animate(el, {opacity: 1}, speed, easing, callback);
                    } else {
                        animate(el, {opacity: 0}, speed, easing, function() {
                            el[NAME_STYLE][NAME_DISPLAY] = 'none';
                            callback && callback(this);
                        });
                    }
                });
            },

            /**
             * Display.
             * @return {Dom}
             */
            display: function(option) {
                return this.for(function(el) {
                    el[NAME_STYLE][NAME_DISPLAY] = option ? getDefaultStyle(el, 'display') : 'none';
                });
            },

            /**
             * Blip.
             * @param  {Int}        times?
             * @param  {Int|String} speed?
             * @return {Dom}
             */
            blip: function(times, speed) {
                times = times || Infinity;
                speed = speed || 255;
                return this.for(function(el) {
                    var count = times > 0 ? 1 : 0;
                    !function callback() {
                        if (count && count > times) {
                            return;
                        }
                        animate(el, {opacity: 0}, speed, function() {
                            animate(el, {opacity: 1}, speed, callback);
                            count++;
                        });
                    }();
                });
            },

            /**
             * Scroll to.
             * @param  {Int}         top
             * @param  {Int}         left
             * @param  {Int|String}  speed?
             * @param  {String}      easing?
             * @param  {Function}    callback?
             * @return {Dom}
             */
            scrollTo: function(top, left, speed, easing, callback) {
                return this.for(function(el) {
                    animate(el, {scrollTop: top || el[NAME_SCROLL_TOP], scrollLeft: left || el[NAME_SCROLL_LEFT]},
                        speed, easing, callback);
                });
            }
        });
    }

    /**
     * So Dom.
     * @param  {String} selector
     * @param  {Object} root?
     * @return {Dom}
     */
    $.dom = function(selector, root) {
        return initDom(selector, root);
    };

    // xpath helper
    function initXDom(selector, root, one) {
        var doc = root || document;
        var docEl = doc && doc[NAME_DOCUMENT_ELEMENT];
        var nodes = [], node, iter, ret;
        if (!docEl) {
            throw ('XPath is not supported by root object!');
        }

        if (doc.evaluate) {
            iter = doc.evaluate(selector, docEl, NULL, XPathResult.ANY_TYPE, NULL);
            if (one) {
                nodes = iter.iterateNext();
            } else {
                while (node = iter.iterateNext()) {
                    nodes.push(node);
                }
            }
        } else if (docEl.selectNodes) { // ie (still..)
            nodes = docEl.selectNodes(selector);
            if (one) {
                nodes = nodes[0];
            }
        }

        ret = initDom(nodes);
        ret._selector = selector;
        return ret;
    }

    // add static methods to dom
    $.dom.extend({
        // find by selector
        find: function(selector, root) {
            return initDom(selector, root, TRUE);
        },
        findAll: function(selector, root) {
            return initDom(selector, root);
        },
        // find by xpath
        xfind: function(selector, root) {
            return initXDom(selector, root, TRUE);
        },
        xfindAll: function(selector, root) {
            return initXDom(selector, root);
        },
        // find by so:* attributes
        soAttrFind: function(name, value) {
            return initDom('[%s%s="%s"]'.format(soPrefix, name, value));
        },
        // (name, value) or ({name: value})
        define: function(name, value) {
            var prototype = 'prototype', names = Object.keys(Dom[prototype]);
            _forEach(toKeyValueObject(name, value), function(name, value) {
                if (names.has(name)) {
                    throw ('Cannot overwrite on Dom.'+ name +'!');
                }
                Dom[prototype][name] = value;
            });
        },
        create: function(content, doc, attrs) {
            return create(content, doc, attrs);
        },
        loadStyle: function(src, onload, attrs) {
            var s = document.createElement('link');
            s.href = src, s.onload = onload, s.rel = 'stylesheet';
            document.head.appendChild(s);
        },
        loadScript: function(src, onload, attrs) {
            var s = document.createElement('script');
            s.src = src, s.onload = onload;
            document.head.appendChild(s);
        },
        isNode: function(el) {
            return isNode(el);
        },
        isNodeElement: function(el) {
            return isNodeElement(el);
        }
    });

    // add find, findAll to Node
    extendPrototype(Node, {
        find: function(selector) {
            return initDom(selector, this, TRUE).get();
        },
        findAll: function(selector, init) {
            return initDom(selector, this).getAll();
        }
    });

})(window, window.so, null, true, false);
