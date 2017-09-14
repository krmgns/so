/**
 * @object  so.dom
 * @depends so, so.list, so.util
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, document, $, undefined) { 'use strict';

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
    var NAME_INNER_HTML = 'innerHTML', NAME_TEXT_CONTENT = 'textContent';
    var NAME_CLASS = 'className', NAME_STYLE = 'style';

    var re_space = /\s+/g;
    var re_comma = /,\s*/;
    var re_trim = /^\s+|\s+$/g;
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
        return (el && el.nodeName) ? el.nodeName.toLowerCase() : isWindow(el) ? '#window' : null;
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

    var re_id = /^#([^ ]+)$/;
    var re_child = /(?:first|last|nth)(?!-)/;
    var re_childFix = /([\w-]+|):(first|last|nth([^-].+))/g;
    var re_attr = /\[.+\]/;
    var re_attrFix = /\[(.+)\]/g;
    var re_attrFixEsc = /([.:])/g;
    var re_attrFixQuote = /(^['"]|['"]$)/g;

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

        if (selector.has(re_child)) {
            selector = selector.replace(re_childFix, function(_, $1, $2, $3) {
                return $1 +':'+ ($3 ? 'nth-child'+ $3 : $2 +'-child');
            });
        }

        // grammar: https://www.w3.org/TR/css3-selectors/#grammar
        if (selector.has(re_attr)) {
            // prevent DOMException [foo=1] is not a valid selector.
            selector = selector.replace(re_attrFix, function(_, $1) {
                var s = '=', name, value;
                $1 = $1.split(s);
                name = $1[0].replace(re_attrFixEsc, '\\$1');
                if ($1.length > 1) {
                    value = $1.slice(1).join(s).replace(re_attrFixQuote, '');
                    return '['+ name +'="'+ value +'"]';
                }
                return '['+ name +']';
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

        if (selector != null) {
            if (isString(selector)) {
                selector = trim(selector);
                // prevent empty selector error
                if (selector) {
                    // id check (speed)
                    if (re = selector.match(re_id)) {
                        els = [(root = document).getElementById(re[1])];
                    } else if (re = selector.match(re_tag)) {
                        // root could be document or attribute(s)
                        els = create(selector, root, root, re[1]);
                    } else if (selector[0] == '>' && isNodeElement(root)) {
                        // buggy :scope selector
                        id = getAttribute(root, (soid = 'so:id')) || $.rid('');
                        setAttribute(root, soid, id);
                        // fix '>' only selector
                        if (selector.length == 1) {
                            selector += ' *';
                        }
                        els = select((selector = '[%s="%s"] %s'.format(soid, id, selector)), null, one);
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
            '_selector': {value: selector, writable: true}
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
            return this[0] ? initDom(selector, this[0], true) : this;
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
            var i = 0, array = [];

            while (i < this._size) {
                array.push(this[i++]);
            }

            return array;
        },

        /**
         * To list.
         * @return {List}
         */
        toList: function() {
            return $.list(this.toArray());
        },

        /**
         * For.
         * @param  {Function} fn
         * @return {this}
         */
        for: function(fn) {
            return _for(this.toArray(), fn, this);
        },

        /**
         * For each.
         * @param  {Function} fn
         * @return {this}
         */
        forEach: function(fn) {
            return _forEach(this.toArray(), fn, this);
        },

        /**
         * Has.
         * @param  {Object} searchEl
         * @return {Bool}
         */
        has: function(searchEl) {
            var ret; return this.for(function(el) {
                if (el == searchEl) ret = true; return _break;
            }), !!ret;
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
            return initDom(this.toArray());
        },

        /**
         * Map.
         * @param  {Function} fn
         * @return {Dom}
         */
        map: function(fn) {
            return initDom(this.toArray().map(fn));
        },

        /**
         * Filter.
         * @param  {Function|String} fn (test function or selector string)
         * @return {Dom}
         */
        filter: function(fn) {
            if (isFunction(fn)) {
                return initDom(this.toArray().filter(fn));
            } else if (isString(fn)) {
                return initDom(this.toArray().filter(function(el) {
                    return matchesSelector.call(el, fn);
                }));
            }
        },

        /**
         * Reverse.
         * @return {Dom}
         */
        reverse: function() {
            return initDom(this.toArray().reverse());
        },

        /**
         * Get.
         * @param  {Int}     i?
         * @param  {Bool}    init?
         * @return {Object|Dom}
         */
        get: function(i, init) {
            var el;

            if (isVoid(i)) {
                el = this[0];
            } else if (isNumber(i)) {
                el = this[i - 1];
            }

            return init ? initDom(el) : el;
        },

        /**
         * Get all.
         * @param  {Int|Array} i?
         * @param  {Bool}      init?
         * @return {Array|Dom}
         */
        getAll: function(i, init) {
            var el, els = [];

            if (isVoid(i)) {
                els = this.toArray();
            } else {
                var _this = this;
                (isNumber(i) ? [i] : i).forEach(function(i) {
                    el = _this.get(i);
                    if (el && !els.has(el)) {
                        els.push(el);
                    }
                });
            }

            return init ? initDom(els) : els;
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
         * @return {Array}
         */
        all: function() {
            return this.toArray();
        }
    });

    // create helpers
    function create(content, doc, attributes, tag) {
        if (isDom(content)) {
            return content.toArray();
        }
        if (isNode(content)) {
            return [content];
        }

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

        if (attributes && isObject(attributes)) {
            _for(frg[NAME_CHILD_NODES], function(node) {
                if (isNodeElement(node)) {
                    _forEach(attributes, function(name, value) {
                        node.setAttribute(name, value);
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
        clone.setAttribute && clone.setAttribute('so:clone', $.id());
        // clone.cloneOf = el; // @debug
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
        el.$data = el.$events = null;
        var child;
        while (child = el[NAME_FIRST_CHILD]) {
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
         * @return {this}
         */
        empty: function() {
            return this.for(function(el) {
                cleanElement(el);
            });
        },

        /**
         * Remove
         * @return {this}
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
         * @return {this}
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
         * @param  {Object}            attributes?
         * @return {this}
         */
        append: function(content, cloning, attributes) {
            return this.for(function(el) {
                createFor(el, content, attributes).forEach(function(node) {
                    el.appendChild(cloneIf(cloning, node));
                });
            });
        },

        /**
         * Append to.
         * @param  {String}  selector
         * @param  {Bool}    cloning?
         * @return {this}
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
         * @param  {Object}            attributes?
         * @return {this}
         */
        prepend: function(content, cloning, attributes) {
            return this.for(function(el) {
                createFor(el, content, attributes).forEach(function(node) {
                    el.insertBefore(cloneIf(cloning, node), el[NAME_FIRST_CHILD]);
                });
            });
        },

        /**
         * Prepend to.
         * @param  {String}  selector
         * @param  {Bool}    cloning?
         * @return {this}
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
         * @inheritDoc
         */
        insert: function(content, cloning, attributes) {
            return this.append(content, cloning, attributes);
        },

        /**
         * Insert to (alias of appendTo()).
         * @inheritDoc
         */
        insertTo: function(selector, cloning) {
            return this.appendTo(selector, cloning);
        },

        /**
         * Insert before.
         * @param  {String}  selector
         * @param  {Bool}    cloning?
         * @return {this}
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
         * @return {this}
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
         * @return {this}
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
         * @param  {Object}            attributes?
         * @return {Dom}
         */
        wrap: function(content, attributes) {
            var me = this[0], parent = me && me[NAME_PARENT_NODE],
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
         * @return {Any|this}
         */
        property: function(name, value) {
            return isUndefined(value) ? this.getProperty(name) : this.setProperty(name, value);
        },

        /**
         * Has property
         * @param  {String} name
         * @return {Bool|null}
         */
        hasProperty: function(name) {
            return this[0] ? (name in this[0]) : null;
        },

        /**
         * Set property.
         * @param {String} name
         * @param {Any}    value
         */
        setProperty: function(name, value) {
            return (this[0] && (this[0][name] = value), this);
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
         * @return {String|this}
         */
        text: function(input) {
            return isDefined(input) ? this.setText(input) : this.getText();
        },

        /**
         * Set text.
         * @param {String} input
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
         * @param {String} input
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
            ? (tmp = b, b = a, a = tmp) : null; // loop over shorter

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
                    ret = intersect(ret, this.parent().find(selector).toArray());
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
                    ret = intersect(ret, this.parent().find(selector).toArray());
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
                    ret = intersect(ret, this.parent().find(selector).toArray());
                }
            }

            return initDom(ret);
        },

        /**
         * Contains.
         * @param  {String} selector
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
         * Has children (alias of hasChild()).
         * @inheritDoc
         */
        hasChildren: function() {
            return this.hasChild();
        },

        /**
         * Has content (alias of isEmpty()).
         * @inheritDoc
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
            s += '#'+ el.id; // id is enough
        } else if (el[NAME_CLASS]) {
            s += '.'+ el[NAME_CLASS].split(re_space).join('.');
        }
        path.push(s);

        if (el[NAME_PARENT_NODE]) {
            return path.concat(getPath(el[NAME_PARENT_NODE]));
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
                return path.concat(getXPath(el[NAME_PARENT_NODE]), tag +'['+ (ii + 1) +']');
            }
            if (node.tagName == el.tagName) {
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
                return null;
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
                return null;
            }

            return ret = getXPath(el), string ? '/'+ ret.join('/') : ret;
        }
    });

    var re_rgb = /rgb/i;
    var re_color = /color/i;
    var re_unit = /(?:px|em|%)/i; // short & quick
    var re_unitOther = /(?:ex|in|[cm]m|p[tc]|v[hw]?min)/i;
    var re_noneUnitStyles = /(?:(?:fill-?)?opacity|z(?:oom|index)|(?:font-?w|line-?h)eight|column(?:-?count|s))/i;
    var defaultStyles = {};
    var matchesSelector = document.documentElement.matches || function(selector) {
        var i = 0, all = querySelectorAll(this.ownerDocument, selector);
        while (i < all.length) {
            if (all[i++] == this) {
                return true;
            }
        }
        return false;
    };

    // style helpers
    function getCssStyle(el) {
        var sheets = el.ownerDocument.styleSheets, rules, ret = [];
        _for(sheets, function(sheet) {
            rules = sheet.rules || sheet.cssRules;
            _for(rules, function(rule) {
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
            var el = createElement(document, tag);
            document.body.appendChild(el);
            defaultStyles[tag] = getComputedStyle(el)[toStyleName(name)];
            document.body.removeChild(el);
        }
        return defaultStyles[tag];
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
        return name ? styles[toStyleName(name)] || '' : styles;
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
            return isObject(name) || (isString(name) && (!isNulls(value) || name.has(':'))) ? this.setStyle(name)
                : isNull(value) || isNulls(value) ? this.removeStyle(name)
                : this.getStyle(name, value, raw);
        },

        /**
         * Has style.
         * @param  {String} name
         * @return {Bool}
         */
        hasStyle: function(name) {
            var el = this[0];
            return !!(el && el[NAME_STYLE] && el[NAME_STYLE].cssText.indexOf(name) > -1);
        },

        /**
         * Set style.
         * @param  {String|Object} name
         * @param  {String}        value?
         * @return {this}
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
            var el = this[0], value = null, convert;
            if (el) {
                if (raw) {
                    return el[NAME_STYLE][toStyleName(name)] || value;
                }
                value = getStyle(el, name);
                if (value !== '') {
                    value = isFalse(convert)  ? value : (
                        re_rgb.test(value) ? $.util.parseRgbColorToHex(value) // make rgb - hex
                            : re_unit.test(value) || re_unitOther.test(value) // make px etc. - float
                                // || re_noneUnitStyles.test(name) // make opacity etc. - float @cancel use String.toFloat()
                            ? value.toFloat() : value
                    );
                } else {
                    value = null;
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
         * @return {this}
         */
        removeStyle: function(name) {
            return this.for(function(el) {
                if (name == '*') {
                    el.removeAttribute('style');
                } else {
                    split(name, re_comma).forEach(function(name) {
                        setStyle(el, name, '');
                    });
                }
            });
        }
    });

    // hidden, dimension, offset, scroll helpers
    function isHidden(el) {
        return el && !(el.offsetWidth || el.offsetHeight);
    }

    function isHiddenParent(el) {
        var parent = el && el[NAME_PARENT_ELEMENT];
        while (parent) {
            if (isHidden(parent)) {
                return true;
            }
            parent = parent[NAME_PARENT_ELEMENT];
        }
        return false;
    }

    function getHiddenElementProperties(el, properties) {
        var ret = [];
        var sid = $.sid(), className = ' '+ sid;
        var styleText = el[NAME_STYLE].cssText;
        var parent = el[NAME_PARENT_ELEMENT], parents = [], parentStyle;

        while (parent) { // doesn't give if parents are hidden
            if (isHidden(parent)) {
                parentStyle = getStyle(parent);
                parents.push({el: parent, styleText: parent[NAME_STYLE].cssText});
                parent[NAME_CLASS] += className;
                parent[NAME_STYLE].display = '';
                parent[NAME_STYLE].visibility = ''; // for `!important` annots
            }
            parent = parent[NAME_PARENT_ELEMENT];
        }

        var doc = getDocument(el);
        var css = createElement(doc, 'style', {
            textContent: '.'+ sid +'{display:block!important;visibility:hidden!important}'
        });
        doc.body.appendChild(css);

        el[NAME_CLASS] += className;
        el[NAME_STYLE].display = '';
        el[NAME_STYLE].visibility = ''; // for `!important` annots

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
        el[NAME_CLASS] = el[NAME_CLASS].replace(className, '');
        if (styleText) {
            el[NAME_STYLE].cssText = styleText;
        }

        while (parent = parents.shift()) {
            parent.el[NAME_CLASS] = parent.el[NAME_CLASS].replace(className, '');
            if (parent.styleText) {
                parent.el[NAME_STYLE].cssText = parent.styleText;
            }
        }

        return ret;
    }

    function getDimensions(el) {
        // @note: offset(width|height) = (width|height) + padding + border
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

    function getDimensionsBy(el, by, margins) {
        var dim = getDimensions(el);
        var ret = extend(dim, {
            innerWidth: dim.width, outerWidth: dim.width,
            innerHeight: dim.height, outerHeight: dim.height
        }), style;

        if (isNodeElement(el)) {
            style = getStyle(el);
            if ((!by || by == NAME_WIDTH) && dim.width) {
                ret.width -= sumStyleValue(null, style, NAME_PADDING_LEFT, NAME_PADDING_RIGHT)
                           + sumStyleValue(null, style, NAME_BORDER_LEFT_WIDTH, NAME_BORDER_RIGHT_WIDTH);
                if (by) return ret.width;
            }
            if ((!by || by == NAME_INNER_WIDTH) && dim.width) {
                ret.innerWidth -= sumStyleValue(null, style, NAME_BORDER_LEFT_WIDTH, NAME_BORDER_RIGHT_WIDTH);;
                if (by) return ret.innerWidth;
            }
            if ((!by || by == NAME_OUTER_WIDTH) && dim.width) {
                if (margins) {
                    ret.outerWidth += sumStyleValue(null, style, NAME_MARGIN_LEFT, NAME_MARGIN_RIGHT);
                }
                if (by) return ret.outerWidth;
            }
            if ((!by || by == NAME_HEIGHT) && dim.height) {
                ret.height -= sumStyleValue(null, style, NAME_PADDING_TOP, NAME_PADDING_BOTTOM)
                            + sumStyleValue(null, style, NAME_BORDER_TOP_WIDTH, NAME_BORDER_BOTTOM_WIDTH);
                if (by) return ret.height;
            }
            if ((!by || by == NAME_INNER_HEIGHT) && dim.height) {
                ret.innerHeight -= sumStyleValue(null, style, NAME_BORDER_TOP_WIDTH, NAME_BORDER_BOTTOM_WIDTH);
                if (by) return ret.innerHeight;
            }
            if ((!by || by == NAME_OUTER_HEIGHT) && dim.height) {
                if (margins) {
                    ret.outerHeight += sumStyleValue(null, style, NAME_MARGIN_TOP, NAME_MARGIN_BOTTOM);
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
            if (isHidden(el) || isHiddenParent(el)) {
                var properties = getHiddenElementProperties(el, ['offsetTop', 'offsetLeft']);
                ret.top = properties[0], ret.left = properties[1];
            } else {
                ret.top = el.offsetTop, ret.left = el.offsetLeft;
            }

            ret.top += body.scrollTop, ret.left += body.scrollLeft;
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
            ret.top = el.scrollTop, ret.left = el.scrollLeft;
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

    // dom: offset, scroll, box
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
                var borderXSize = sumStyleValue(null, style, NAME_BORDER_LEFT_WIDTH, NAME_BORDER_RIGHT_WIDTH);
                var borderYSize = sumStyleValue(null, style, NAME_BORDER_TOP_WIDTH, NAME_BORDER_BOTTOM_WIDTH);
                var marginXSize = sumStyleValue(null, style, NAME_MARGIN_LEFT, NAME_MARGIN_RIGHT);
                var marginYSize = sumStyleValue(null, style, NAME_MARGIN_TOP, NAME_MARGIN_BOTTOM);
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
        }
    });

    var re_attrState = /^(?:(?:check|select|disabl)ed|readonly)$/;
    var re_attrNameFix = /[^\w:.-]+/g;

    // attribute helpers
    function fixAttributeName(name) {
        return trim(name).replace(re_attrNameFix, '-');
    }

    function toAttributeName(name) {
        return fixAttributeName(name[0] == '@'
            ? 'data-'+ name.slice(1) /* @foo => data-foo */ : name);
    }

    function hasAttribute(el, name) {
        return !!(el && el.hasAttribute && el.hasAttribute(toAttributeName(name)));
    }

    function setAttribute(el, name, value, state /* @internal */) {
        if (isNodeElement(el)) {
            name = toAttributeName(name);
            if (isNull(value)) {
                el.removeAttribute(name);
            } else if (state || re_attrState.test(name)) {
                (value || isUndefined(value)) ? (el.setAttribute(name, ''), el[name] = !!value)
                    : (el.removeAttribute(name), el[name] = false);
            } else {
                el.setAttribute(name, value);
            }
        }
    }

    function getAttribute(el, name, valueDefault) {
        if (isNodeElement(el)) {
            name = toAttributeName(name);
            return hasAttribute(el, name) ? el.getAttribute(name) : valueDefault;
        }
    }

    // dom: attributes
    extendPrototype(Dom, {
        /**
         * Attribute.
         * @param  {String} name
         * @param  {String} value?
         * @return {Any}
         */
        attribute: function(name, value) {
            return isNull(value) ? this.removeAttribute(name)
                : isObject(name) || isDefined(value) ? this.setAttribute(name, value)
                : this.getAttribute(name);
        },

        /**
         * Attributes.
         * @return {Object}
         */
        attributes: function() {
            var el = this[0], ret = {};
            if (el) {
                _for(el.attributes, function(attribute) {
                    ret[attribute.name] = re_attrState.test(attribute.name)
                        ? attribute.name :  attribute.value;
                });
            }
            return ret;
        },

        /**
         * Has attribute.
         * @param  {String} name
         * @return {Bool}
         */
        hasAttribute: function(name) {
            return hasAttribute(this[0], name);
        },

        /**
         * Set attribute.
         * @param  {String} name
         * @param  {String} value?
         * @return {this}
         */
        setAttribute: function(name, value) {
            var attributes = toKeyValueObject(name, value);
            return this.for(function(el) {
                for (name in attributes) {
                    setAttribute(el, name, attributes[name]);
                }
            });
        },

        /**
         * Get attribute.
         * @param  {String} name
         * @param  {String} valueDefault
         * @return {String?}
         */
        getAttribute: function(name, valueDefault) {
            return getAttribute(this[0], name, valueDefault);
        },

        /**
         * Remve attribute.
         * @param  {String} name
         * @return {this}
         */
        removeAttribute: function(name) {
            return this.for(function(el) {
                var names = [];
                if (name == '*') {
                    _for(el.attributes, function(attribute) {
                        names.push(attribute.name);
                    });
                } else {
                    names = split(name, re_comma);
                }

                while (name = names.shift()) {
                    el.removeAttribute(toAttributeName(name));
                }
            });
        },

        /**
         * So (so:attribute's).
         * @param  {String} value
         * @return {Any|this}
         */
        so: function(name, value) {
            name = 'so:'+ name;
            return isUndefined(value) ? this.attribute(name) : this.attribute(name, value);
        }
    });

    // dom: values
    extendPrototype(Dom, {
        /**
         * Value.
         * @param  {String} value?
         * @return {String|this}
         */
        value: function(value) {
            return isDefined(value) ? this.setValue(value) : this.getValue();
        },

        /**
         * Set value.
         * @param {String} value?
         */
        setValue: function(value) {
            value = isNull(value) ? '' : (value += ''); // @important

            return this.for(function(el) {
                if (el.options) { // <select>
                    _for(el.options, function(option) {
                        if (option.value === value) {
                            option.selected = true;
                        }
                    });
                } else {
                    el.value = value;
                }
            });
        },

        /**
         * Get value.
         * @param  {String} valueDefault?
         * @return {String?}
         */
        getValue: function(valueDefault) {
            var el = this[0], ret = valueDefault, option;

            if (el) {
                if (el.options && !isVoid(option = el.options[el.selectedIndex])) {
                    ret = hasAttribute(option, 'value')
                        ? (option.disabled || option[NAME_PARENT_ELEMENT].disabled ? '' : option.value) : '';
                } else {
                    ret = el.value;
                }
            }

            return ret;
        }
    });

    // dom: id
    extendPrototype(Dom, {
        /**
         * Id.
         * @param  {String} id?
         * @return {String|this}
         */
        id: function(id) {
            return isDefined(id) ? this.setId(id) : this.getId();
        },

        /**
         * Set id.
         * @param {String} id
         */
        setId: function(id) {
            return setAttribute(this[0], 'id', id), this;
        },

        /**
         * Get id.
         * @return {String}
         */
        getId: function() {
            return getAttribute(this[0], 'id');
        }
    });

    // class helpers
    function toClassRegExp(name) {
        return _re('(^|\\s+)'+ name +'(\\s+|$)', null, '1m');
    }

    function hasClass(el, name) {
        return !!(el && el[NAME_CLASS] && toClassRegExp(name).test(el[NAME_CLASS]));
    }

    function addClass(el, name) {
        split(name, re_space).forEach(function(name) {
            if (!hasClass(el, name)) {
                el[NAME_CLASS] = trim(el[NAME_CLASS] +' '+ name);
            }
        });
    }

    function removeClass(el, name) {
        split(name, re_space).forEach(function(name) {
            el[NAME_CLASS] = trim(el[NAME_CLASS].replace(toClassRegExp(name), ' '));
        });
    }

    // dom: class
    extendPrototype(Dom, {
        /**
         * Class.
         * @param  {String}      name?
         * @param  {String|null} option?
         * @return {Bool|this}
         */
        class: function(name, option) {
            return isUndefined(option) ? this.addClass(name)
                : isNull(option) || isNulls(option) ? this.removeClass(name)
                : isTrue(option) ? this.setClass(name) : this.replaceClass(name, (''+ option));
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
         * @return {this}
         */
        addClass: function(name) {
            return this.for(function(el) { addClass(el, name); });
        },

        /**
         * Remove class.
         * @param  {String} name
         * @return {this}
         */
        removeClass: function(name) {
            return (name == '*') ? this.setClass('')
                : this.for(function(el) { removeClass(el, name); });
        },

        /**
         * Replace class.
         * @param  {String} oldName
         * @param  {String} newName
         * @return {this}
         */
        replaceClass: function(oldName, newName) {
            return this.for(function(el) {
                el[NAME_CLASS] = trim(el[NAME_CLASS].replace(toClassRegExp(oldName), ' '+ newName +' '));
            });
        },

        /**
         * Toggle.
         * @param  {String} name
         * @return {this}
         */
        toggleClass: function(name) {
            return this.for(function(el) {
                hasClass(el, name) ? removeClass(el, name) : addClass(el, name);
            });
        },

        /**
         * Set class.
         * @param  {String} name
         * @return {this}
         */
        setClass: function(name) {
            return this.for(function(el) { el[NAME_CLASS] = name; });
        },

        /**
         * Get class.
         * @return {String}
         */
        getClass: function() {
            return getAttribute(this[0], 'class');
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
                if (key[0] == '@') {
                    setAttribute(el, key, value);
                } else {
                    el.$data.set(key, value);
                }
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
                // data-*
                if (key.startsWith('@')) {
                    return getAttribute(el, key);
                }
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
         * Set data.
         * @param {String|Object} key
         * @param {Any}           value
         */
        setData: function(key, value) {
            return this.for(function(el) { setData(el, key, value); });
        },

        /**
         * Get data.
         * @param  {String} key
         * @param  {Any}    valueDefault?
         * @return {Any}
         */
        getData: function(key, valueDefault) {
            return this[0] && getData(this[0], key, valueDefault);
        },

        /**
         * Remove data.
         * @param  {String} key
         * @return {this}
         */
        removeData: function(key) {
            key = trim(key);

            // data-*
            if (key.startsWith('@')) {
                return this.attribute(key, null);
            }

            return this.for(function(el) {
                checkData(el);
                (key == '*') ? el.$data.empty() :
                    split(key, re_comma).forEach(function(key) {
                        el.$data.removeAt(key);
                    });
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
                var done = true;
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
                            _for(el.options, function(option, i) {
                                // find selected option thas has 'value' attribute
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
                return _ret(this.serialize(null, false));
            }

            this.serialize(function(data) {
                callback(_ret(data));
            }, false);
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
                }), $.json(ret, true);
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
        setAttribute(el, name, value, true);
    }
    function getState(el, name) {
        return !!(el && el[name]);
    }

    // dom: form elements states
    extendPrototype(Dom, {
        /**
         * Checked.
         * @param  {Bool} option?
         * @return {Bool|this}
         */
        checked: function(option) {
            return isVoid(option) ? getState(this[0], 'checked') : this.for(function(el) {
                setState(el, 'checked', option);
            });
        },

        /**
         * Selected.
         * @param  {Bool} option?
         * @return {Bool|this}
         */
        selected: function(option) {
            return isVoid(option) ? getState(this[0], 'selected') : this.for(function(el) {
                setState(el, 'selected', option);
            });
        },

        /**
         * Disabled.
         * @param  {Bool} option?
         * @return {Bool|this}
         */
        disabled: function(option) {
            return isVoid(option) ? getState(this[0], 'disabled') : this.for(function(el) {
                setState(el, 'disabled', option);
            });
        },

        /**
         * Readonly.
         * @param  {Bool} option?
         * @return {Bool|this}
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
             * @return {this}
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
             * @return {this}
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
             * @return {this}
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
             * @return {this}
             */
            fire: function(type, fn, options) {
                return this.for(function(el) {
                    event.fire(el, type, fn, options);
                });
            }
        });
    }

    // dom: animations
    var animation = $.animation;
    if (animation) {
        extendPrototype(Dom, {
            /**
             * Animate.
             * @param  {Object}     properties
             * @param  {Int|String} speed?
             * @param  {String}     easing?
             * @param  {Function}   callback?
             * @return {this}
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
                        animation.animate(el, properties, speed, easing, callback);
                    });
            },

            /**
             * Fade.
             * @param  {Float}      to
             * @param  {Int|String} speed?
             * @param  {Function}   callback?
             * @return {this}
             */
            fade: function(to, speed, callback) {
                return this.animate({opacity: to}, speed, callback);
            },

            /**
             * Fade in.
             * @param  {Int|String} speed?
             * @param  {Function}   callback?
             * @return {this}
             */
            fadeIn: function(speed, callback) {
                return this.fade(1, speed, callback);
            },

            /**
             * Fade out.
             * @param  {Int|String} speed?
             * @param  {Function}   callback?
             * @return {this}
             */
            fadeOut: function(speed, callback) {
                // remove element after fading out
                if (isTrue(callback) || callback == 'remove') {
                    callback = function(animation) {
                        $.dom(animation.$target).remove();
                    };
                }
                return this.fade(0, speed, callback);
            },

            /**
             * Show.
             * @param  {Int|String} speed?
             * @param  {String}     easing?
             * @param  {Function}   callback?
             * @return {this}
             */
            show: function(speed, easing, callback) {
                return this.for(function(el) {
                    if (isHidden(el)) {
                        el[NAME_STYLE].display = getDefaultStyle(el.tagName, 'display'); // to default
                        animation.animate(el, {opacity: 1}, (speed || 0), easing, callback);
                    }
                });
            },

            /**
             * Hide.
             * @param  {Int|String} speed?
             * @param  {String}     easing?
             * @param  {Function}   callback?
             * @return {this}
             */
            hide: function(speed, easing, callback) {
                return this.for(function(el) {
                    if (!isHidden(el)) {
                        animation.animate(el, {opacity: 0}, (speed || 0), easing, function() {
                            el[NAME_STYLE].display = 'none'; // to real display
                            callback && callback.call(this);
                        });
                    }
                });
            },

            /**
             * Toggle.
             * @param  {Int|String} speed?
             * @param  {String}     easing?
             * @param  {Function}   callback?
             * @return {this}
             */
            toggle: function(speed, easing, callback) {
                speed = speed || 0;
                return this.for(function(el) {
                    if (isHidden(el)) {
                        el[NAME_STYLE].display = getDefaultStyle(el.tagName, 'display'); // to default
                        animation.animate(el, {opacity: 1}, speed, easing, callback);
                    } else {
                        animation.animate(el, {opacity: 0}, speed, easing, function() {
                            el[NAME_STYLE].display = 'none'; // to real display
                            callback && callback.call(this);
                        });
                    }
                });
            },

            /**
             * Blip.
             * @param  {Int}        times?
             * @param  {Int|String} speed?
             * @return {this}
             */
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

            /**
             * Scroll to.
             * @param  {Int}         top
             * @param  {Int}         left
             * @param  {Int|String}  speed?
             * @param  {String}      easing?
             * @param  {Function}    callback?
             * @return {this}
             */
            scrollTo: function(top, left, speed, easing, callback) {
                return this.for(function(el) {
                    animation.animate(el, {scrollTop: top || el.scrollTop, scrollLeft: left || el.scrollLeft},
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
        var docEl = doc && doc.documentElement;
        var nodes = [], node, iter, ret;
        if (!docEl) {
            throw ('XPath is not supported by root object!');
        }

        if (doc.evaluate) {
            iter = doc.evaluate(selector, docEl, null, XPathResult.ANY_TYPE, null);
            if (one) {
                nodes = iter.iterateNext();
            } else {
                while (node = iter.iterateNext()) {
                    nodes.push(node);
                }
            }
        } else if (docEl.selectNodes) { // ie
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
            return initDom(selector, root, true);
        },
        findAll: function(selector, root) {
            return initDom(selector, root);
        },
        // find by xpath
        xfind: function(selector, root) {
            return initXDom(selector, root, true);
        },
        xfindAll: function(selector, root) {
            return initXDom(selector, root);
        },
        // find by so:attribute(s)
        soFind: function(name, id) {
            return initDom('[so:%s="%s"]'.format(fixAttributeName(name), id));
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
        create: function(content, doc, attributes) {
            return create(content, doc, attributes);
        },
        loadStyle: function(src, onload, attributes) {
            var s = document.createElement('link');
            s.href = src, s.onload = onload, s.rel = 'stylesheet';
            document.head.appendChild(s);
        },
        loadScript: function(src, onload, attributes) {
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
            return initDom(selector, this, true).get();
        },
        findAll: function(selector, init) {
            return initDom(selector, this).getAll();
        }
    });

})(window, document, so);
