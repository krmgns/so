/**
 * @object  so.dom
 * @depends so, so.list, so.util
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $, undefined) { 'use strict';

    // minify candies
    var NODE_TYPE = 'nodeType';
    var PARENT_NODE  = 'parentNode';
    var PARENT_ELEMENT = 'parentElement';
    var FIRST_CHILD = 'firstChild';
    var CHILDREN = 'children', CHILD_NODES = 'childNodes';
    var NEXT_ELEMENT_SIBLING = 'nextElementSibling';
    var PREVIOUS_ELEMENT_SIBLING = 'previousElementSibling';
    var PADDING_TOP = 'paddingTop', PADDING_BOTTOM = 'paddingBottom';
    var PADDING_LEFT = 'paddingLeft', PADDING_RIGHT = 'paddingRight';
    var MARGIN_TOP = 'marginTop', MARGIN_BOTTOM = 'marginBottom';
    var MARGIN_LEFT = 'marginLeft', MARGIN_RIGHT = 'marginRight';
    var BORDER_TOP_WIDTH = 'borderTopWidth', BORDER_BOTTOM_WIDTH = 'borderBottomWidth';
    var BORDER_LEFT_WIDTH = 'borderLeftWidth', BORDER_RIGHT_WIDTH = 'borderRightWidth';
    var WIDTH = 'width', INNER_WIDTH = 'innerWidth', OUTER_WIDTH = 'outerWidth';
    var HEIGHT = 'height', INNER_HEIGHT = 'innerHeight', OUTER_HEIGHT = 'outerHeight';
    var INNER_HTML = 'innerHTML', TEXT_CONTENT = 'textContent';

    var re_space = /\s+/g;
    var re_comma = /,\s*/;
    var re_trim = /^\s+|\s+$/g;
    var re_tag = /^<[a-z-][^>]*>/i;
    var trims = $.trimSpace;
    var isBool = $.isBool, isTrue = $.isTrue, isFalse = $.isFalse;
    var isVoid = $.isVoid, isNull = $.isNull, isNulls = $.isNulls, isUndefined = $.isUndefined;
    var isObject = $.isObject, isArray = $.isArray;
    var isNumber = $.isNumber, isNumeric = $.isNumeric, isString = $.isString;
    var isWindow = $.isWindow, isDocument = $.isDocument;
    var getWindow = $.getWindow, getDocument = $.getDocument;
    var extend = $.extend, extendPrototype = $.extendPrototype;
    var toStyleName = $.util.toCamelCaseFromDashCase;
    var _re = $.re, _array = $.array, _for = $.for, _forEach = $.forEach;
    var _break = 0; // break tick: for, forEach

    // shortcut helpers
    function split(s, re) {
        return trims(s).split(re);
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
        return !!(el && (el[NODE_TYPE] === 1 || el[NODE_TYPE] === 9 || el[NODE_TYPE] === 11));
    }
    function isNodeElement(el) {
        return !!(el && el[NODE_TYPE] === 1);
    }
    function toKeyValueObject(key, value) {
        var ret = key || {}; if (isString(ret)) ret = {}, ret[key] = value; return ret;
    }
    function initDom(selector, root, i, one) {
        return isDom(selector) ? selector : new Dom(selector, root, i, one);
    }

    var re_attr = /\[.+\]/;
    var re_attrFix = /\[(.+)=(.+)\]/g;
    var re_attrEscape = /([.:])/g;
    var re_attrQuotes = /(^['"]|['"]$)/g;
    var re_attrState = /(((check|select|disabl)ed|readonly)!?)/gi;
    var re_firstLast = /^((?:fir|la)st)$/;
    var re_select = /([.#>\s\w-]*)?@([\w-]+)(?:\(?:?((?:fir|la)st|odd|even|\d+n?)\)?)?(?:,\s*)?/gi;

    /**
     * Select.
     * @param  {String|Object} selector
     * @param  {Object}        ?root
     * @param  {Boolean}       ?one
     * @return {Array}
     */
    function select(selector, root, one) {
        if (!selector) return;

        if (!isNode(root)) {
            root = document;
        }

        selector = selector.replace(re_space, ' ');

        var re, ret = [];
        // check so directives
        if (re = selector.matchAll(re_select)) {
            var rem = [];
            re.forEach(function(re) {
                var all, sel = re[1], tag = re[2],
                    dir = re[3] ? re[3].replace(':', '') : dir = tag; // @first etc..

                if (tag.test(re_firstLast)) {
                    dir = tag, tag = '*';
                }
                all = _array(querySelectorAll(root, sel +' '+ tag));

                if (dir == 'first') all = all[0];
                else if (dir == 'last')  all = all[all.length - 1];
                else if (isNumeric(dir)) all = all[dir - 1];
                else if (dir == 'odd' || dir == 'even') {
                    // odd / even
                    var odd = [], even = [];
                    all.forEach(function(node, i) {
                        (i & 1) ? odd.push(node) : even.push(node);
                    });
                    (dir == 'odd') ? (all = odd) : (all = even);
                } else if (dir = dir.toInt()) {
                    // @div(3n) etc..
                    all = all.filter(function(node, i) {
                        return !((i + 1) % +dir);
                    });
                }

                ret = ret.concat(all), rem.push(re[0]);
            });

            // for find()'s
            if (one) ret = [ret[0]];

            // remove processed selectors
            if (rem.length) {
                rem.forEach(function(re) { selector = selector.replace(re, ''); });
            }
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
            search = _re(re[0], 'g'), replace = re[0].replace(not, '');
            if (re[0].has(not)) {
                selector = selector.replace(search, 'not([%s])'.format(replace));
            } else {
                selector = selector.replace(search, replace);
            }
        }

        return _array(ret, one ? querySelector(root, selector) // speed issues..
            : querySelectorAll(root, selector));
    }

    /**
     * Dom.
     * @param {String|Object} selector
     * @param {Object}        ?root
     * @param {Int}           ?i
     * @param {Boolean}       ?one
     */
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
                        if (isNumber(i)) {
                            elements = [elements[i]];
                        }
                    }
                }
            } else if (isWindow(selector) || isDocument(selector)) {
                elements = [selector];
            } else if (isNode(selector)) {
                if (root && root != selector[PARENT_NODE]) {
                    // pass (check root reliability)
                } else {
                    elements = [selector];
                }
            } else {
                elements = selector;
            }

            _for(elements, function(element) {
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
        /**
         * Find.
         * @param  {String|Object} selector
         * @param  {Int)           ?i
         * @return {Dom}
         */
        find: function(selector, i) {
            return this[0] ? initDom(selector, this[0], i, true) : this;
        },

        /**
         * Find all.
         * @param  {String|Object} selector
         * @param  {Int)           ?i
         * @return {Dom}
         */
        findAll: function(selector, i) {
            return this[0] ? initDom(selector, this[0], i) : this;
        },

        /**
         * All.
         * @return {Array}
         */
        all: function() {
            return this.toArray();
        },

        /**
         * Copy.
         * @return {Dom}
         */
        copy: function() {
            return initDom(this.toArray());
        },

        /**
         * To array.
         * @return {Array}
         */
        toArray: function() {
            var ret = [], i = 0;
            while (i < this.size) {
                ret.push(this[i++]);
            } return ret;
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
         * @param  {Object} search
         * @return {Boolean}
         */
        has: function(search) {
            var ret; return this.for(function(el) {
                if (search == el) ret = true; return _break;
            }), !!ret;
        },

        /**
         * Is empty.
         * @return {Boolean}
         */
        isEmpty: function() {
            return !this.size;
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
         * @param  {Function} fn
         * @return {Dom}
         */
        filter: function(fn) {
            return initDom(this.toArray().filter(fn));
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
         * @param  {Int}     ?i
         * @param  {Boolean} ?init
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
         * @param  {Int|Array} ?i
         * @param  {Boolean}   ?init
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
         * @param  {Int) i
         * @return {Dom}
         */
        item: function(i) { return initDom(this[i - 1]); },

        /**
         * First.
         * @return {Dom}
         */
        first: function() { return this.item(1); },

        /**
         * Last.
         * @return {Dom}
         */
        last: function() { return this.item(this.size); },

        /**
         * Nth.
         * @return {Dom}
         */
        nth: function(i) { return this.item(i); },

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
        }
    });

    // create helpers
    function create(content, doc, attributes) {
        if (isDom(content)) {
            return content.toArray();
        }
        if (isNodeElement()) {
            return [content];
        }

        doc = doc && isDocument(doc) ? doc : document;
        var tmp = createElement(doc, 'so-tmp', {innerHTML: content});
        var fragment = doc.createDocumentFragment();
        while (tmp[FIRST_CHILD]) {
            fragment.appendChild(tmp[FIRST_CHILD]);
        }

        if (attributes && isObject(attributes)) {
            _for(fragment[CHILD_NODES], function(node) {
                if (isNodeElement(node)) {
                    _forEach(attributes, function(name, value) {
                        node.setAttribute(name, value);
                    });
                }
            });
        }

        return _array(fragment[CHILD_NODES]);
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
        clone.setAttribute && clone.setAttribute('so:id', $.sid('clone-'));
        // clone.cloneOf = el; // @debug
        if (!isFalse(deep)) {
            if (el.$data) clone.$data = el.$data;

            if (el.$events) {
                el.$events.forAll(function(event) {
                    event.copy().bindTo(clone);
                });
            }

            if (el[CHILD_NODES]) {
                _for(el[CHILD_NODES], function(child) {
                    clone.appendChild(cloneElement(child, deep));
                });
            }
        }

        return clone;
    }

    function cleanElement(el) {
        el.$data = el.$events = null;
        var child;
        while (child = el[FIRST_CHILD]) {
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
         * @param  {Boolean} ?deep
         * @return {Dom}
         */
        clone: function(deep) {
            var clones = []; return this.for(function(element, i) {
                clones[i] = cloneElement(element, deep);
            }), initDom(clones);
        },

        /**
         * Empty.
         * @return {this}
         */
        empty: function() {
            return this.for(function(element) {
                cleanElement(element);
            });
        },

        /**
         * Remove
         * @return {this}
         */
        remove: function() {
            return this.for(function(element) {
                cleanElement(element);
                if (element[PARENT_NODE]) {
                    element[PARENT_NODE].removeChild(element);
                }
            });
        },

        /**
         * Remove from.
         * @param  {String} selector
         * @return {this}
         */
        removeFrom: function(selector) {
            return this.for(function(el) {
                initDom(selector).find(el).remove();
            });
        },

        /**
         * Append.
         * @param  {String|Object|Dom}  content
         * @param  {Object}            ?attributes
         * @param  {Boolean}           ?cloning
         * @return {this}
         */
        append: function(content, attributes, cloning) {
            return this.for(function(el) {
                createFor(el, content, attributes).forEach(function(node) {
                    el.appendChild(cloneIf(cloning, node));
                });
            });
        },

        /**
         * Append to.
         * @param  {String}   selector
         * @param  {Boolean} ?cloning
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
         * @param  {String|Object|Dom}  content
         * @param  {Object}            ?attributes
         * @param  {Boolean}           ?cloning
         * @return {this}
         */
        prepend: function(content, attributes, cloning) {
            return this.for(function(el) {
                createFor(el, content, attributes).forEach(function(node) {
                    el.insertBefore(cloneIf(cloning, node), el[FIRST_CHILD]);
                });
            });
        },

        /**
         * Prepend to.
         * @param  {String}   selector
         * @param  {Boolean} ?cloning
         * @return {this}
         */
        prependTo: function(selector, cloning) {
            if (!isDom(selector)) {
                selector = initDom(selector);
            }

            return this.for(function(el) {
                selector.for(function(node) {
                    node.insertBefore(cloneIf(cloning, el), node[FIRST_CHILD]);
                });
            });
        },

        /**
         * Insert. Alias of append().
         * @inheritDoc
         */
        insert: function(content, attributes, cloning) {
            return this.append(content, attributes, cloning);
        },

        /**
         * Insert to. Alias of appendTo().
         * @inheritDoc
         */
        insertTo: function(selector, cloning) {
            return this.appendTo(selector, cloning);
        },

        /**
         * Insert before.
         * @param  {String}   selector
         * @param  {Boolean} ?cloning
         * @return {this}
         */
        insertBefore: function(selector, cloning) {
            if (!isDom(selector)) {
                selector = initDom(selector);
            }

            return this.for(function(el) {
                selector.for(function(node) {
                    node[PARENT_NODE].insertBefore(cloneIf(cloning, el), node);
                });
            });
        },

        /**
         * Insert before.
         * @param  {String}   selector
         * @param  {Boolean} ?cloning
         * @return {this}
         */
        insertAfter: function(selector, cloning) {
            if (!isDom(selector)) {
                selector = initDom(selector);
            }

            return this.for(function(el) {
                selector.for(function(node) {
                    node[PARENT_NODE].insertBefore(cloneIf(cloning, el), node.nextSibling)
                });
            });
        },

        /**
         * Replace with.
         * @param  {String}   selector
         * @param  {Boolean} ?cloning
         * @return {this}
         */
        replaceWith: function(selector, cloning) {
            if (!isDom(selector)) {
                selector = initDom(selector);
            }

            return this.for(function(el) {
                selector.for(function(node) {
                    el[PARENT_NODE].replaceChild(cloneIf(cloning, node), el);
                });
            });
        },

        /**
         * Wrap.
         * @param  {String|Object|Dom}  content
         * @param  {Object}            ?attributes
         * @return {Dom}
         */
        wrap: function(content, attributes) {
            var me = this[0], parent = me && me[PARENT_NODE],
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
         * @param  {Boolean} ?remove
         * @return {Dom}
         */
        unwrap: function(remove) {
            var me = this[0], parent = me && me[PARENT_NODE],
                parentParent = parent && parent[PARENT_NODE], clone, clones = [];

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
         * @param  {String}  name
         * @param  {Any}    ?value
         * @return {Any|this}
         */
        property: function(name, value) {
            return isUndefined(value) ? this.getProperty(name) : this.setProperty(name, value);
        },

        /**
         * Has property
         * @param  {String} name
         * @return {Boolean}
         */
        hasProperty: function(name) {
            return (this[0] && name in this[0]);
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
         * @param  {String} ?input
         * @return {String|this}
         */
        text: function(input) {
            return isVoid(input) ? this.getText() : this.setText(input);
        },

        /**
         * Set text.
         * @param {String} input
         */
        setText: function(input) {
            return this.for(function(el) { el[TEXT_CONTENT] = input; });
        },

        /**
         * Get text.
         * @return {String}
         */
        getText: function() {
            return __(this, TEXT_CONTENT);
        },

        /**
         * Html.
         * @param  {String} ?input
         * @return {String|Any}
         */
        html: function(input) {
            return isVoid(input) ? this.getHtml() : this.setHtml(input);
        },

        /**
         * Set html
         * @param {String} input
         */
        setHtml: function(input) {
            return this.for(function(el) { el[INNER_HTML] = input; });
        },

        /**
         * Get html.
         * @return {String}
         */
        getHtml: function() {
            return __(this, INNER_HTML);
        }
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
         * Path.
         * @param  {Boolean} ?join
         * @return {Array|String}
         */
        path: function(join) {
            var el = this[0], path, paths = [];
            if (el) {
                path = el.nodeName.toLowerCase();
                if (el.id) path += '#'+ el.id;
                if (el.className) path += '.'+ el.className.split(re_space).join('.');
                paths.push(path);

                this.parents().for(function(node) {
                    path = node.nodeName.toLowerCase();
                    if (node.id) path += '#'+ node.id;
                    if (node.className) path += '.'+ node.className.split(re_space).join('.');
                    paths.push(path);
                })

                return paths = paths.reverse(), join ? paths.join(' > ') : paths;
            }
        },

        /**
         * Parent.
         * @return {Dom}
         */
        parent: function() {
            return initDom(__(this, PARENT_NODE));
        },

        /**
         * Parents.
         * @return {Dom}
         */
        parents: function() {
            return initDom(walk(this[0], PARENT_NODE));
        },

        /**
         * Comments.
         * @return {Dom}
         */
        comments: function() {
            var el = this[0], node, nodes = [], i = 0;
            if (el) {
                while (node = el[CHILD_NODES][i++]) {
                    if (node.nodeType === 8) {
                        nodes.push(node);
                    }
                }
            }
            return initDom(nodes);
        },

        /**
         * Siblings.
         * @param  {Int|String} ?selector
         * @return {Dom}
         */
        siblings: function(selector) {
            var el = __(this), ret;
            if (el) {
                ret = walk(el[PARENT_NODE], CHILDREN).filter(function(_el) {
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
            return initDom(__(this, CHILDREN));
        },

        /**
         * Prev.
         * @return {Dom}
         */
        prev: function() {
            return initDom(__(this, PREVIOUS_ELEMENT_SIBLING));
        },

        /**
         * Prev all.
         * @param  {String} ?selector
         * @return {Dom}
         */
        prevAll: function(selector) {
            var el = this[0], ret = [];
            if (el) {
                ret = walk(el, PREVIOUS_ELEMENT_SIBLING).reverse();
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
            return initDom(__(this, NEXT_ELEMENT_SIBLING));
        },

        /**
         * Next all.
         * @param  {String} selector
         * @return {Dom}
         */
        nextAll: function(selector) {
            var el = this[0], ret = [], found;
            if (el) {
                ret = walk(el, NEXT_ELEMENT_SIBLING);
                if (selector && ret.length) {
                    ret = intersect(ret, this.parent().find(selector).toArray());
                }
            }
            return initDom(ret);
        },

        /**
         * Contains.
         * @param  {String} selector
         * @return {Boolean}
         */
        contains: function(selector) {
            return !!(this[0] && initDom(selector, this[0]).size);
        },

        /**
         * Has parent.
         * @param  {String} ?selector
         * @return {Boolean}
         */
        hasParent: function(selector) {
            var el = this[0], ret;

            if (!selector) {
                ret = el && el[PARENT_NODE];
            } else {
                selector = initDom(selector)[0];
                this.parents().forEach(function(_el) {
                    if (el && el == _el) ret = true; return _break;
                });
            }

            return !!ret;
        },

        /**
         * Has child.
         * @return {Boolean}
         */
        hasChild: function() {
            return this.children().size > 0;
        },

        /**
         * Has children. Alias of hasChild().
         * @inheritDoc
         */
        hasChildren: function() {
            return this.hasChild();
        },

        /**
         * Window.
         * @param  {Boolean} ?content
         * @return {Dom}
         */
        window: function(content) {
            return initDom(this[0] && (content ? this[0].contentWindow : getWindow(this[0])));
        },

        /**
         * document.
         * @param  {Boolean} ?content
         * @return {Dom}
         */
        document: function(content) {
            return initDom(this[0] && (content ? this[0].contentDocument : getDocument(this[0])));
        }
    });

    var re_rgb = /rgb/i;
    var re_color = /color/i;
    var re_unit = /(?:px|em|%)/i; // short & quick
    var re_unitOther = /(?:ex|in|[cm]m|p[tc]|v[hw]?min)/i;
    var re_noneUnitStyles = /((fill)?opacity|z(oom|index)|(fontw|lineh)eight|column(count|s))/i;
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
            var doc = document, el = createElement(doc, tag);
            doc.body.appendChild(el);
            defaultStyles[tag] = getComputedStyle(el)[toStyleName(name)];
            doc.body.removeChild(el);
        }
        return defaultStyles[tag];
    }

    function setStyle(el, name, value) {
        name = toStyleName(name), value = trims(value);
        if (value && isNumeric(value) && !re_noneUnitStyles.test(name)) {
            value += 'px';
        }
        el.style[name] = value;
    }

    function getStyle(el, name, value) {
        var style = getComputedStyle(el);
        return name ? (name = toStyleName(name), style[name] || value || '') : style;
    }

    function parseStyleText(text) {
        var styles = {}, s;
        text = (''+ text).split(_re('\\s*;\\s*'));
        while (text.length) {
            // wtf! :)
            (s = text.shift().split(_re('\\s*:\\s*')))
                && (s[0] = trims(s[0]))
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
         * @param  {String}  ?value
         * @param  {String}  ?valueDefault
         * @param  {Boolean} raw
         * @return {String}
         */
        style: function(name, value, valueDefault, raw) {
            return !isVoid(value) ? this.setStyle(name, value)
                : this.getStyle(name, value, valueDefault, raw);
        },

        /**
         * Has style.
         * @param  {String} name
         * @return {Boolean}
         */
        hasStyle: function(name) {
            var el = this[0];
            return !!(el && el.style && el.style.cssText.indexOf(name) > -1);
        },

        /**
         * Set style.
         * @param  {String|Object} name
         * @param  {String}        ?value
         * @return {this}
         */
        setStyle: function(name, value) {
            var styles = name;
            if (isString(styles)) {
                styles = !isVoid(value)
                    ? toKeyValueObject(name, value) : parseStyleText(name);
            }

            return this.for(function(el) {
                _forEach(styles, function(name, value) {
                    setStyle(el, name, value);
                });
            });
        },

        /**
         * Get style.
         * @param  {String}          name
         * @param  {String|Boolean} ?valueDefault
         * @param  {Boolean}         raw
         * @return {String}
         */
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

        /**
         * Get css (original) style.
         * @param  {String} ?name
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
         * @param  {String} ?name
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
        var parent = el && el[PARENT_ELEMENT];
        while (parent) {
            if (isHidden(parent)) {
                return true;
            }
            parent = parent[PARENT_ELEMENT];
        }
        return false;
    }

    function getHiddenElementProperties(el, properties) {
        var ret = [];
        var sid = $.sid(), className = ' '+ sid;
        var styleText = el.style.cssText;
        var parent = el[PARENT_ELEMENT], parents = [], parentStyle;

        while (parent) { // doesn't give if parents are hidden
            if (isHidden(parent)) {
                parentStyle = getStyle(parent);
                parents.push({el: parent, styleText: parent.style.cssText});
                parent.className += className;
                parent.style.display = '', parent.style.visibility = ''; // for `!important` annots
            }
            parent = parent[PARENT_ELEMENT];
        }

        var doc = getDocument(el);
        var css = createElement(doc, 'style', {
            textContent: '.'+ sid +'{display:block!important;visibility:hidden!important}'
        });
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

    function getDimensionsBy(el, by, margined) {
        var dim = getDimensions(el);
        var ret = extend(dim, {
            innerWidth: dim.width, outerWidth: dim.width,
            innerHeight: dim.height, outerHeight: dim.height
        }), style;

        if (isNodeElement(el)) {
            style = getStyle(el);
            if ((!by || by == WIDTH) && dim.width) {
                ret.width -= sumStyleValue(null, style, PADDING_LEFT, PADDING_RIGHT)
                           + sumStyleValue(null, style, BORDER_LEFT_WIDTH, BORDER_RIGHT_WIDTH);
                if (by) return ret.width;
            }
            if ((!by || by == INNER_WIDTH) && dim.width) {
                ret.innerWidth -= sumStyleValue(null, style, BORDER_LEFT_WIDTH, BORDER_RIGHT_WIDTH);;
                if (by) return ret.innerWidth;
            }
            if ((!by || by == OUTER_WIDTH) && dim.width) {
                if (margined) {
                    ret.outerWidth += sumStyleValue(null, style, MARGIN_LEFT, MARGIN_RIGHT);
                }
                if (by) return ret.outerWidth;
            }
            if ((!by || by == HEIGHT) && dim.height) {
                ret.height -= sumStyleValue(null, style, PADDING_TOP, PADDING_BOTTOM)
                            + sumStyleValue(null, style, BORDER_TOP_WIDTH, BORDER_BOTTOM_WIDTH);
                if (by) return ret.height;
            }
            if ((!by || by == INNER_HEIGHT) && dim.height) {
                ret.innerHeight -= sumStyleValue(null, style, BORDER_TOP_WIDTH, BORDER_BOTTOM_WIDTH);
                if (by) return ret.innerHeight;
            }
            if ((!by || by == OUTER_HEIGHT) && dim.height) {
                if (margined) {
                    ret.outerHeight += sumStyleValue(null, style, MARGIN_TOP, MARGIN_BOTTOM);
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
                var parentOffset = getOffset(el[PARENT_ELEMENT], relative);
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
            return getDimensionsBy(this[0], WIDTH);
        },

        /**
         * Inner width.
         * @return {Int}
         */
        innerWidth: function() {
            return getDimensionsBy(this[0], INNER_WIDTH);
        },

        /**
         * Outer width.
         * @param  {Boolean} margined
         * @return {Int}
         */
        outerWidth: function(margined) {
            return getDimensionsBy(this[0], OUTER_WIDTH, margined);
        },

        /**
         * Height.
         * @return {Int}
         */
        height: function() {
            return getDimensionsBy(this[0], HEIGHT);
        },

        /**
         * Outer height.
         * @return {Int}
         */
        innerHeight: function() {
            return getDimensionsBy(this[0], INNER_HEIGHT);
        },

        /**
         * Outer height.
         * @param  {Boolean} margined
         * @return {Int}
         */
        outerHeight: function(margined) {
            return getDimensionsBy(this[0], OUTER_HEIGHT, margined);
        }
    });

    // dom: offset, scroll, box
    extendPrototype(Dom, {
        /**
         * Offset.
         * @param  {Boolean} ?relative
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
                var borderXSize = sumStyleValue(null, style, BORDER_LEFT_WIDTH, BORDER_RIGHT_WIDTH);
                var borderYSize = sumStyleValue(null, style, BORDER_TOP_WIDTH, BORDER_BOTTOM_WIDTH);
                var marginXSize = sumStyleValue(null, style, MARGIN_LEFT, MARGIN_RIGHT);
                var marginYSize = sumStyleValue(null, style, MARGIN_TOP, MARGIN_BOTTOM);
                var dim = getDimensionsBy(el), parentDim = getDimensions(el[PARENT_ELEMENT]);
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

    var re_attrStateName = /^(?:(?:check|select|disabl)ed|readonly)$/i;
    var re_attrNameRemove = /[^\w:.-]/g;

    // attribute helpers
    function toAttributeName(name) {
        return name = name.startsWith('@')
            ? 'data-'+ name.slice(1) /* @foo => data-foo */ : name,
                trims(name.replace(re_attrNameRemove, '-'));
    }

    function hasAttribute(el, name) {
        return !!(el && el.hasAttribute && el.hasAttribute(toAttributeName(name)));
    }

    function setAttribute(el, name, value) {
        if (isNodeElement(el)) {
            name = toAttributeName(name);
            if (isNull(value)) {
                el.removeAttribute(name);
            } else if (re_attrStateName.test(name)) {
                isUndefined(value) || value ?
                    el.setAttribute(name, name) : el.removeAttribute(name);
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
         * @param  {String} ?value
         * @return {Any}
         */
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

        /**
         * Attributes.
         * @return {Object}
         */
        attributes: function() {
            var el = this[0], ret = {};
            if (el) {
                _for(el.attributes, function(attribute) {
                    ret[attribute.name] = re_attrStateName.test(attribute.name)
                        ? attribute.name :  attribute.value;
                });
            }
            return ret;
        },

        /**
         * Has attribute.
         * @param  {String} name
         * @return {Boolean}
         */
        hasAttribute: function(name) {
            return hasAttribute(this[0], name);
        },

        /**
         * Set attribute.
         * @param  {String} name
         * @param  {String} ?value
         * @return {this}
         */
        setAttribute: function(name, value) {
            return this.for(function(el) {
                setAttribute(el, name, value);
            });
        },

        /**
         * Get attribute.
         * @param  {String} name
         * @param  {String} valueDefault
         * @return {String|undefined}
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
        }
    });

    // dom: values
    extendPrototype(Dom, {
        /**
         * Value.
         * @param  {String} value
         * @return {Any}
         */
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

        /**
         * Set value.
         * @param {String} ?value
         */
        setValue: function(value) {
            value += ''; // @important
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
         * @param  {String} ?valueDefault
         * @return {String|undefined}
         */
        getValue: function(valueDefault) {
            var el = this[0], ret = valueDefault, option;
            if (el) {
                if (el.options && !isVoid(option = el.options[el.selectedIndex])) {
                    ret = hasAttribute(option, 'value')
                        ? (option.disabled || option[PARENT_ELEMENT].disabled ? '' : option.value) : '';
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
         * @param  {String} ?id
         * @return {this|String}
         */
        id: function(id) {
            return !isUndefined(id) ? this.setId(id) : this.getId();
        },

        /**
         * Set id.
         * @param {String} id
         */
        setId: function(id) {
            return setAttribute(this[0], 'id', id);
        },

        /**
         * Get id.
         * @return {String|undefined}
         */
        getId: function() {
            return getAttribute(this[0], 'id');
        }
    });

    // class helpers
    function toClassRegExp(name) {
        return _re('(^| )'+ name +'( |$)', null, '1m');
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
        /**
         * Class.
         * @param  {String}      ?name
         * @param  {String|null} ?option
         * @return {Boolean|this}
         */
        class: function(name, option) {
            if (!name) {
                return this.hasClass();
            }

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

        /**
         * Has class.
         * @param  {String} name
         * @return {Boolean}
         */
        hasClass: function(name) {
            return !!hasClass(this[0], name);
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
                el.className = el.className.replace(toClassRegExp(oldName), ' '+ newName +' ');
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
            return this.for(function(el) { el.className = name; });
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
                key = trims(key);
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
                key = trims(key);
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
         * @param  {String|Object}  key
         * @param  {Any}           ?value
         * @return {Any}
         */
        data: function(key, value) {
            return isObject(key) ? this.setData(key) :
                isUndefined(value) ? this.getData(key) : this.setData(key, value);
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
         * @param  {Any}    valueDefault
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
            key = trims(key);

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

    function toBase64(input) {
        return $.util.base64Encode(decode(input));
    }

    function readFile(file, callback, multiple) {
        var reader = new FileReader();
        reader.onload = function(e) {
            fileContent = trims(e.target.result);
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
        serialize: function(callback, opt_plus) {
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
                return this.for(function(el) {
                    event.on(el, type, fn, options);
                });
            },
            once: function(type, fn, options) {
                return this.for(function(el) {
                    event.once(el, type, fn, options);
                });
            },
            off: function(type, fn, options) {
                return this.for(function(el) {
                    event.off(el, type, fn, options);
                });
            },
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

    $.dom = function(selector, root, i) {
        return initDom(selector, root, i);
    };

    // static methods
    $.dom.extend({
        create: function(content, attributes) {
            return create(content, null, attributes);
        },
        isNode: function(el) {
            return isNode(el);
        },
        isNodeElement: function(el) {
            return isNodeElement(el);
        },
        isUnitStyle: function(value) {
            return !re_noneUnitStyles.test(value);
        }
    });

    $.$ = function(selector, root, i) { // one
        return initDom(selector, root, i, true);
    };
    $.$$ = function(selector, root, i) { // all
        return initDom(selector, root, i, false);
    };

    extendPrototype(Node, {
        find: function(selector) {
            return $.$(selector, this).get();
        },
        findAll: function(selector, init) {
            return $.$$(selector, this).getAll();
        }
    });

})(window, so);
