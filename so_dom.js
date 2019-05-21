/**
 * @object  so.dom
 * @depends so, so.list, so.util
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $, NULL, TRUE, FALSE, UNDEFINED) { 'use strict';

    // minify candies
    var NAME_NODE_NAME = 'nodeName', NAME_NODE_TYPE = 'nodeType';
    var NAME_PARENT_NODE = 'parentNode', NAME_PARENT_ELEMENT = 'parentElement';
    var NAME_CHILDREN = 'children', NAME_CHILD_NODES = 'childNodes', NAME_FIRST_CHILD = 'firstChild';
    var NAME_NEXT_ELEMENT_SIBLING = 'nextElementSibling', NAME_PREVIOUS_ELEMENT_SIBLING = 'previousElementSibling';
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
    var NAME_NAME = 'name', NAME_VALUE = 'value', NAME_TYPE = 'type', NAME_OPTIONS = 'options', NAME_TEXT = 'text', NAME_SELECTED_INDEX = 'selectedIndex';
    var NAME_STYLE = 'style', NAME_CLASS_NAME = 'className', NAME_TAG_NAME = 'tagName';
    var NAME_CHECKED = 'checked', NAME_SELECTED = 'selected', NAME_DISABLED = 'disabled', NAME_READONLY = 'readOnly';
    var NAME_DISPLAY = 'display', NAME_VISIBILITY = 'visibility', NAME_NONE = 'none', NAME_CSS_TEXT = 'cssText';
    var NAME_OWNER_DOCUMENT = 'ownerDocument', NAME_DOCUMENT_ELEMENT = 'documentElement', NAME_SCROLLING_ELEMENT = 'scrollingElement';
    var NAME_PROTOTYPE = 'prototype';
    var TAG_WINDOW = '#window', TAG_DOCUMENT = '#document', TAG_HTML = 'html', TAG_HEAD = 'head', TAG_BODY = 'body';

    var re_space = /\s+/g;
    var re_comma = /\s*,\s*/;
    var re_tag = /^<([\w-]+)[^>]*>/i;
    var $document = $.document;
    var $toStyleName = $.util.toStyleName, $jsonEncode = $.util.jsonEncode;
    var $re = $.re, $rid = $.rid, $array = $.array, $each = $.each, $for = $.for, $forEach = $.forEach;
    var $trim = $.trim, $extend = $.extend, $int = $.int, $float = $.float, $string = $.string, $bool = $.bool,
        $isVoid = $.isVoid, $isNull = $.isNull, $isNulls = $.isNulls, $isDefined = $.isDefined,
        $isUndefined = $.isUndefined, $isString = $.isString, $isNumeric = $.isNumeric,
        $isNumber = $.isNumber, $isArray = $.isArray, $isObject = $.isObject, $isFunction = $.isFunction,
        $isTrue = $.isTrue, $isFalse = $.isFalse, $isWindow = $.isWindow, $isDocument = $.isDocument,
        $getWindow = $.getWindow, $getDocument = $.getDocument;
    var _id = 0;

    // general helpers
    function split(s, re) {
        return $trim(s).split(re);
    }
    function querySelector(root, selector) {
        return root.querySelector(selector);
    }
    function querySelectorAll(root, selector) {
        return root.querySelectorAll(selector);
    }

    function getTag(el) {
        return (el && el[NAME_NODE_NAME]) ? el[NAME_NODE_NAME].lower()
            : $isWindow(el) ? TAG_WINDOW : NULL;
    }

    function isRoot(el, _tag) {
        return (_tag = getTag(el)), _tag == TAG_WINDOW || _tag == TAG_DOCUMENT;
    }
    function isRootElement(el, _tag) {
        return (_tag = getTag(el)), _tag == TAG_HTML || _tag == TAG_BODY;
    }
    function isNode(el) {
        return $bool(el && (el[NAME_NODE_TYPE] === 1 || el[NAME_NODE_TYPE] === 9 || el[NAME_NODE_TYPE] === 11));
    }
    function isENode(el) {
        return $bool(el && (el[NAME_NODE_TYPE] === 1));
    }

    function isDom(input) {
        return (input instanceof Dom);
    }
    function toDom(selector, root, one) {
        return isDom(selector) ? selector : new Dom(selector, root, one);
    }
    function toDomPrototype(Dom, prototype) {
        $extend(Dom[NAME_PROTOTYPE], prototype);
    }

    function toKeyValue(key, value) {
        var ret = key || {};
        if ($isString(ret)) {
            ret = {}, ret[key] = value;
        }
        return ret;
    }

    var soPrefix = 'so:';
    var re_child = /(?:first|last|nth)(?!-)/;
    var re_childFix = /([\w-]+|):(first|last|nth([^-].+))/g;
    var re_attr = /\[.+\]/;
    var re_attrFix = /([.:])/g;
    var re_attrMatch = /(\[[^=\]]+)[.:]/g;
    var re_idOrClass = /^(?:(?:#([^ ]+))|(?:\.([\w-]+)))$/;

    /**
     * Select.
     * @param  {String|Object} selector
     * @param  {Object|String} root?
     * @param  {Bool}          one?
     * @return {Array}
     */
    function select(selector, root, one) {
        if (!selector) return;

        // selector given as root
        if ($isString(root)) {
            root = querySelector($document, root);
        }

        if (!isNode(root)) {
            root = $document;
        }

        selector = selector.replace(re_space, ' ');

        // eg: p:first => p:first-child
        if (re_child.test(selector)) {
            selector = selector.replace(re_childFix, function(_, _1, _2, _3) {
                return _1 +':'+ (_3 ? 'nth-child'+ _3 : _2 +'-child');
            });
        }

        // grammar: https://www.w3.org/TR/css3-selectors/#grammar
        if (re_attr.test(selector)) {
            (selector.matchAll(re_attrMatch) || []).each(function(match) {
                selector = selector.replace(match[0], match[0].replace(re_attrFix, '\\$1'));
            });
        }

        return $array(
            one ? querySelector(root, selector) // speed issue
                : querySelectorAll(root, selector)
        );
    }

    /**
     * Dom.
     * @param {String|Object} selector
     * @param {Object}        root?
     * @param {Bool}          one?
     */
    function Dom(selector, root, one) {
        var _this = this, els, len = 0, re, idn, idv;

        if (selector) {
            if ($isString(selector)) {
                selector = $trim(selector);
                if (selector) {
                    // id & class check (speed issue)
                    if (re = selector.match(re_idOrClass)) {
                        els = ((root = $document) && re[1])
                            ? [root.getElementById(re[1])] : root.getElementsByClassName(re[2]);
                    } else if (re = selector.match(re_tag)) {
                        // root could be document or attributes
                        els = create(selector, root, root, re[1]);
                    } else if (selector[0] == '>') {
                        root = isENode(root) ? root : $document[NAME_DOCUMENT_ELEMENT];
                        // buggy :scope selector
                        idv = getAttr(root, (idn = soPrefix +'buggy-scope-selector')) || $rid();
                        setAttr(root, idn, idv, FALSE);
                        // fix '>' only selector
                        if (selector.len() == 1) {
                            selector = '> *';
                        }
                        selector = '[%s="%s"] %s'.format(idn, idv, selector);
                        els = select(selector, NULL, one);
                    } else {
                        els = select(selector, root, one);
                    }
                }
            } else if ($isWindow(selector) || $isDocument(selector)) {
                els = [selector];
            } else if (isNode(selector)) {
                if (root && root != selector[NAME_PARENT_NODE]) {
                    // pass (check root reliability)
                } else {
                    els = [selector];
                }
            } else if ($isArray(selector)) {
                els = [], selector.each(function(el) {
                    isDom(el) ? els = els.concat(el.all()) : els.push(el);
                });
            } else {
                els = selector;
            }

            $for(els, function(el) {
                if (el) _this[len++] = el;
            });
        }

        // define all read-only, but selector
        Object.defineProperties(_this, {
                 '_len': {value: len},
                '_root': {value: root},
            '_selector': {value: selector, writable: TRUE}
        });
    }

    // dom: base
    toDomPrototype(Dom, {
        /**
         * Len.
         * @return {Int}
         */
        len: function() {
            return this._len;
        },

        /**
         * Find.
         * @param  {String|Object} selector
         * @return {self}
         */
        find: function(selector) {
            return this[0] ? toDom(selector, this[0], TRUE) : this;
        },

        /**
         * Find all.
         * @param  {String|Object} selector
         * @return {self}
         */
        findAll: function(selector) {
            return this[0] ? toDom(selector, this[0]) : this;
        },

        /**
         * To array.
         * @return {Array}
         */
        toArray: function() {
            for (var i = 0, ret = [], el; el = this[i]; i++) {
                ret[i] = el;
            }
            return ret;
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
        toHtml: function(opt_outer) {
            return this.getHtml(opt_outer);
        },

        /**
         * To text (alias of getText()).
         */
        toText: function() {
            return this.getText();
        },

        /**
         * Each.
         * @param  {Function} fn
         * @param  {Bool}     init
         * @return {self}
         */
        each: function(fn, init) {
            var all = this.all();

            if (init) {
                // shortcut for: ...each(function(el) { $el = $.dom(el) ...
                all = all.map(function(el) {
                    return toDom(el, NULL, TRUE);
                });
            }

            return $each(all, fn, this);
        },

        /**
         * For.
         * @param  {Function} fn
         * @return {self}
         */
        for: function(fn) {
            return $for(this.all(), fn, this);
        },

        /**
         * For each.
         * @param  {Function} fn
         * @return {self}
         */
        forEach: function(fn) {
            return $forEach(this.all(), fn, this);
        },

        /**
         * Copy.
         * @return {self}
         */
        copy: function() {
            return toDom(this.all());
        },

        /**
         * Map.
         * @param  {Function} fn
         * @return {self}
         */
        map: function(fn) {
            return toDom(this.all().map(fn));
        },

        /**
         * Filter.
         * @param  {Function|String} fn
         * @return {self}
         */
        filter: function(fn) {
            var all = this.all(), alls;

            if ($isFunction(fn)) {
                return toDom(all.filter(fn));
            }

            alls = toDom(fn); // selector given
            return toDom(all.filter(function(el) {
                return alls.has(el);
            }));
        },

        /**
         * Reverse.
         * @return {self}
         */
        reverse: function() {
            return toDom(this.all().reverse());
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
            var el, els = [], _this = this, args = $array(arguments);

            if (!args.len()) {
                els = _this.all();
            } else {
                $for(args, function(i) {
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
         * @return {self}
         */
        item: function(i) {
            return toDom(this[i - 1]);
        },

        /**
         * Items.
         * @return {self}
         */
        items: function() {
            return toDom(this.getAll.apply(this, arguments));
        },

        /**
         * First.
         * @return {self}
         */
        first: function() {
            return this.item(1);
        },

        /**
         * Last.
         * @return {self}
         */
        last: function() {
            return this.item(this._len);
        },

        /**
         * Nth.
         * @param  {Int|String} i
         * @return {self}
         */
        nth: function(i) {
            if ($isNumber(i)) {
                return this.item(i);
            }

            i = $int(i);
            return toDom(this.filter(function(node, _i) {
                return !((_i + 1) % i) && i;
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
            var ret = [];

            this.for(function(el) {
                ret.push(getTag(el))
            })

            return ret;
        },

        /**
         * All (alias of toArray()).
         */
        all: function() {
            return this.toArray();
        }
    });

    // modify helpers
    function appendChild(node, childNode) {
        node.appendChild(childNode);
    }
    function removeChild(node, childNode) {
        node.removeChild(childNode);
    }
    function replaceChild(node, childNode, childNodeReplace) {
        node.replaceChild(childNode, childNodeReplace);
    }
    function insertBefore(node, childNode, childNodeBefore) {
        node.insertBefore(childNode, childNodeBefore);
    }

    function create(content, doc, attributes, tag) {
        if (isDom(content)) return content.all();
        if (isNode(content)) return [content];
        if ($isArray(content)) return content;

        var fragment, tmp, tmpTag = 'so-tmp';

        // fix table stuff
        tag = tag || ((content && content.match(re_tag)) || [,])[1];
        if (tag) {
            switch (tag.lower()) {
                case 'tr': tmpTag = 'tbody'; break;
                case 'th': case 'td': tmpTag = 'tr'; break;
                case 'thead': case 'tbody': case 'tfoot': tmpTag = 'table'; break;
            }
        }

        doc = doc && $isDocument(doc) ? doc : $document;
        tmp = createElement(doc, tmpTag, {innerHTML: content});
        fragment = doc.createDocumentFragment();
        while (tmp[NAME_FIRST_CHILD]) {
            appendChild(fragment, tmp[NAME_FIRST_CHILD]);
        }

        if (attributes && $isObject(attributes)) {
            $for(fragment[NAME_CHILD_NODES], function(node) {
                if (isENode(node)) {
                    $forEach(attributes, function(name, value) {
                        setAttr(node, name, value);
                    });
                }
            });
        }

        return $array(fragment[NAME_CHILD_NODES]);
    }

    function createElement(doc, tag, properties) {
        var el = (doc || $document).createElement(tag);

        if (properties) {
            $forEach(properties, function(name, value) {
                el[name] = value;
            });
        }

        return el;
    }

    function cloneElement(el, opt_deep) {
        var clone = el.cloneNode();

        // clone.cloneOf = el; // @debug
        setAttr(clone, soPrefix +'clone', ++_id, FALSE);
        if (!$isFalse(opt_deep)) {
            if (el.$data) {
                clone.$data = el.$data;
            }

            if (el.$events) {
                $for(el.$events, function(events) {
                    $for(events, function(event) {
                        event.bindTo(clone);
                    });
                });
            }

            if (el[NAME_CHILD_NODES]) {
                $for(el[NAME_CHILD_NODES], function(child) {
                    appendChild(clone, cloneElement(child, opt_deep));
                });
            }
        }

        return clone;
    }

    function cleanElement(el, self) {
        if (!$isFalse(self)) {
            el.$data = el.$events = el.$animation = NULL;
        }

        var child;
        while (child = el[NAME_FIRST_CHILD]) {
            if (isENode(child)) {
                cleanElement(child);
            }
            removeChild(el, child);
        }

        return el;
    }

    function createFor(el, content, attributes) {
        return create(content, $getDocument(el), attributes);
    }

    function cloneIf(opt_cloning, node) { // inserts only once without 'clone'
        if ($isFalse(opt_cloning)) {
            // pass
        } else if ($isTrue(opt_cloning) && !hasAttr(node, soPrefix +'clone')) {
            node = cloneElement(node);
        }
        return node;
    }

    // dom: modifiers
    toDomPrototype(Dom, {
        /**
         * Colne.
         * @param  {Bool} opt_deep?
         * @return {self}
         */
        clone: function(opt_deep) {
            var clones = [];

            this.for(function(el, i) {
                clones[i] = cloneElement(el, opt_deep);
            });

            return toDom(clones);
        },

        /**
         * clean.
         * @return {self}
         */
        clean: function() {
            return this.for(function(el) {
                cleanElement(el);
            });
        },

        /**
         * Empty.
         * @return {self}
         */
        empty: function() {
            return this.for(function(el) {
                cleanElement(el, FALSE);
            });
        },

        /**
         * Remove.
         * @return {self}
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
         * @return {self}
         */
        removeAll: function(selector) {
            var parent = this[0], _parent;

            if (parent) {
                this.findAll(selector).for(function(el) {
                    _parent = el[NAME_PARENT_NODE];
                    if (_parent && _parent == parent) {
                        removeChild(parent, cleanElement(el));
                    }
                });
            }

            return this;
        },

        /**
         * Append.
         * @param  {String|Object|Dom} content
         * @param  {Bool}              opt_cloning?
         * @param  {Object}            attributes?
         * @return {self}
         */
        append: function(content, opt_cloning, attributes) {
            return this.for(function(el) {
                createFor(el, content, attributes).each(function(_el) {
                    appendChild(el, cloneIf(opt_cloning, _el));
                });
            });
        },

        /**
         * Append to.
         * @param  {String} selector
         * @param  {Bool}   opt_cloning?
         * @return {self}
         */
        appendTo: function(selector, opt_cloning) {
            if (!isDom(selector)) {
                selector = toDom(selector);
            }

            return this.for(function(el) {
                selector.for(function(_el) {
                    appendChild(_el, cloneIf(opt_cloning, el));
                });
            });
        },

        /**
         * Prepend.
         * @param  {String|Object|Dom} content
         * @param  {Bool}              opt_cloning?
         * @param  {Object}            attributes?
         * @return {self}
         */
        prepend: function(content, opt_cloning, attributes) {
            return this.for(function(el) {
                createFor(el, content, attributes).each(function(_el) {
                    insertBefore(el, cloneIf(opt_cloning, _el), el[NAME_FIRST_CHILD]);
                });
            });
        },

        /**
         * Prepend to.
         * @param  {String} selector
         * @param  {Bool}   opt_cloning?
         * @return {self}
         */
        prependTo: function(selector, opt_cloning) {
            if (!isDom(selector)) {
                selector = toDom(selector);
            }

            return this.for(function(el) {
                selector.for(function(_el) {
                    insertBefore(_el, cloneIf(opt_cloning, el), _el[NAME_FIRST_CHILD]);
                });
            });
        },

        /**
         * Insert (alias of append()).
         */
        insert: function(content, opt_cloning, attributes) {
            return this.append(content, opt_cloning, attributes);
        },

        /**
         * Insert to (alias of appendTo()).
         */
        insertTo: function(selector, opt_cloning) {
            return this.appendTo(selector, opt_cloning);
        },

        /**
         * Insert before.
         * @param  {String} selector
         * @param  {Bool}   opt_cloning?
         * @return {self}
         */
        insertBefore: function(selector, opt_cloning) {
            if (!isDom(selector)) {
                selector = toDom(selector);
            }

            return this.for(function(el) {
                selector.for(function(_el) {
                    insertBefore(_el[NAME_PARENT_NODE], cloneIf(opt_cloning, el), _el);
                });
            });
        },

        /**
         * Insert before.
         * @param  {String} selector
         * @param  {Bool}   opt_cloning?
         * @return {self}
         */
        insertAfter: function(selector, opt_cloning) {
            if (!isDom(selector)) {
                selector = toDom(selector);
            }

            return this.for(function(el) {
                selector.for(function(_el) {
                    insertBefore(_el[NAME_PARENT_NODE], cloneIf(opt_cloning, el), _el.nextSibling)
                });
            });
        },

        /**
         * Replace with.
         * @param  {String} selector
         * @param  {Bool}   opt_cloning?
         * @return {self}
         */
        replaceWith: function(selector, opt_cloning) {
            if (!isDom(selector)) {
                selector = toDom(selector);
            }

            return this.for(function(el) {
                selector.for(function(_el) {
                    replaceChild(el[NAME_PARENT_NODE], cloneIf(opt_cloning, _el), el);
                });
            });
        },

        /**
         * Wrap.
         * @param  {String|Object|Dom} content
         * @param  {Object}            attributes?
         * @return {self}
         */
        wrap: function(content, attributes) {
            var el = this[0], elParent = el && el[NAME_PARENT_NODE];
            var clone, clones = [];
            var wrapper, replace;

            if (elParent) {
                wrapper = createFor(el, content, attributes)[0];
                replace = createFor(elParent, '<so-tmp>', {style: 'display:none'})[0];
                insertBefore(elParent, replace, el);
                this.for(function(el) {
                    clone = cloneElement(el);
                    clones.push(clone);
                    appendChild(wrapper, clone);
                    removeChild(elParent, cleanElement(el));
                });
                replaceChild(elParent, wrapper, replace);
            }

            return toDom(clones);
        },

        /**
         * Unwrap
         * @param  {Bool} opt_remove?
         * @return {self}
         */
        unwrap: function(opt_remove) {
            var el = this[0], elParent = el && el[NAME_PARENT_NODE],
                elParentParent = elParent && elParent[NAME_PARENT_NODE];
            var clone, clones = [];

            if (elParentParent) {
                this.for(function(el) {
                    clone = cloneElement(el);
                    clones.push(clone);
                    insertBefore(elParentParent, clone, elParent);
                    removeChild(elParent, cleanElement(el));
                });

                // remove if opt_remove=true or no child anymore
                if (opt_remove || !elParentParent.hasChildNodes()) {
                    removeChild(elParentParent, cleanElement(elParent));
                }
            }

            return toDom(clones);
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
    toDomPrototype(Dom, {
        /**
         * Property.
         * @param  {String} name
         * @param  {Any}    value?
         * @return {Any|self}
         */
        property: function(name, value) {
            return $isDefined(value) ? this.setProperty(name, value) : this.getProperty(name);
        },

        /**
         * Has property.
         * @param  {String} name
         * @return {Bool}
         */
        hasProperty: function(name) {
            return $bool(this[0] && name in this[0]);
        },

        /**
         * Set property.
         * @param  {String} name
         * @param  {Any}    value
         * @return {self}
         */
        setProperty: function(name, value) {
            var properties = toKeyValue(name, value);

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
    toDomPrototype(Dom, {
        /**
         * Text.
         * @param  {String} input?
         * @return {String|self}
         */
        text: function(input) {
            return $isDefined(input) ? this.setText(input) : this.getText();
        },

        /**
         * Set text.
         * @param  {String} input
         * @return {self}
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
            return $isUndefined(input) || $isTrue(input) ? this.getHtml(input) : this.setHtml(input);
        },

        /**
         * Set html
         * @param  {String} input
         * @return {self}
         */
        setHtml: function(input) {
            return this.for(function(el) {
                el[NAME_INNER_HTML] = input;
            });
        },

        /**
         * Get html.
         * @param  {Bool} opt_outer?
         * @return {String}
         */
        getHtml: function(opt_outer) {
            return opt_outer ? __(this, 'outerHTML') : __(this, NAME_INNER_HTML);
        },

        /**
         * Is empty.
         * @param  {Bool} opt_trim?
         * @return {Bool}
         */
        isEmpty: function(opt_trim) {
            var content;

            switch (this.tag()) {
                case 'input':
                case 'select':
                case 'textarea':
                    content = this.value();
                    break;
                case TAG_WINDOW:
                case TAG_DOCUMENT:
                    content = 1; // ok
                    break;
                default:
                    content = this.html();
            }

            return !$isNulls(opt_trim ? $trim(content) : content);
        },
    });

    // array intersect helpers
    function intersect(a, b, opt_found) {
        var tmp, i;
        tmp = (b.len() > a.len()) ? (tmp = b, b = a, a = tmp) : NULL; // loop over shortest

        return a.filter(function(search) {
            return (i = b.indexOf(search)), opt_found ? i > -1 : i < 0;
        });
    }
    function noIntersect(el, els) {
        return els.filter(function(_el) { return _el != el; });
    }

    // walker helper
    function walk(root, property) {
        var node = root, nodes = [];

        while (node && (node = node[property])) {
            if (!isNode(node)) { // handle nodelist etc.
                nodes = nodes.concat($array(node));
            } else {
                nodes.push(node);
            }
        }

        return nodes;
    }

    function toAllSelector(selector) {
        return ((selector = $trim(selector)) && selector[0] != '>') ? '>'+ selector : selector;
    }

    // dom: walkers
    toDomPrototype(Dom, {
        /**
         * Not.
         * @param  {String|HTMLElement|Int ...arguments} selector
         * @param  {Bool} opt_useParent?
         * @return {self}
         */
        not: function(selector, opt_useParent) {
            var _this = this, ret = [], args;

            if ($isString(selector)) {
                // eg: $.dom("p").not(".red")
                ret = intersect(_this.all(),
                    $isFalse(opt_useParent) ? toDom(selector).all()
                        : _this.parent().findAll(toAllSelector(selector)).all()
                );
            } else if (isDom(selector)) {
                // $.dom("p").not($element)
                ret = intersect(_this.all(), selector.all());
            } else if (isENode(selector)) {
                // $.dom("p").not(element)
                ret = noIntersect(selector, _this);
            } else {
                // eg: $.dom("p").not(1) or $.dom("p").not(1,2,3)
                args = $array(arguments), ret = _this.filter(function(el, i) {
                    if (!args.has(i + 1)) {
                        return el;
                    }
                });
            }

            return toDom(ret);
        },

        /**
         * Odd.
         * @return {self}
         */
        odd: function() {
            return toDom(this.filter(function(el, i) {
                return (i & 1);
            }));
        },

        /**
         * Even.
         * @return {self}
         */
        even: function() {
            return toDom(this.filter(function(el, i) {
                return !(i & 1);
            }));
        },

        /**
         * Parent.
         * @return {self}
         */
        parent: function() {
            return toDom(__(this, NAME_PARENT_NODE));
        },

        /**
         * Parents.
         * @return {self}
         */
        parents: function() {
            return toDom(walk(this[0], NAME_PARENT_NODE));
        },

        /**
         * Siblings.
         * @param  {Int|String} selector?
         * @return {self}
         */
        siblings: function(selector) {
            var el = this[0], ret;

            if (el) {
                ret = noIntersect(el, walk(el[NAME_PARENT_NODE], NAME_CHILDREN));
                if (ret.len() && (selector = toAllSelector(selector))) {
                    ret = intersect(ret, noIntersect(el, toDom(el[NAME_PARENT_NODE]).findAll(selector).all()), TRUE);
                }
            }

            return toDom(ret);
        },

        /**
         * Children.
         * @return {self}
         */
        children: function() {
            return toDom($array(__(this, NAME_CHILDREN)));
        },

        /**
         * First child.
         * @return {self}
         */
        firstChild: function() {
            return this.find('> :first');
        },

        /**
         * Last child.
         * @return {self}
         */
        lastChild: function() {
            return this.find('> :last');
        },

        /**
         * Nth child.
         * @param  {Int} i
         * @return {self}
         */
        nthChild: function(i) {
            return this.find('> :nth('+ i +')');
        },

        /**
         * Comments.
         * @return {self}
         */
        comments: function() {
            var el = this[0], node, nodes = [], i = 0;
            if (el) {
                while (node = el[NAME_CHILD_NODES][i++]) {
                    if (node[NAME_NODE_TYPE] === 8) {
                        nodes.push(node);
                    }
                }
            }
            return toDom(nodes);
        },

        /**
         * Prev.
         * @return {self}
         */
        prev: function() {
            return toDom(__(this, NAME_PREVIOUS_ELEMENT_SIBLING));
        },

        /**
         * Prev all.
         * @param  {String} selector?
         * @return {self}
         */
        prevAll: function(selector) {
            var el = this[0], ret = [];

            if (el) {
                ret = walk(el, NAME_PREVIOUS_ELEMENT_SIBLING).reverse();
                if (ret.len() && (selector = toAllSelector(selector))) {
                    ret = intersect(ret, toDom(el[NAME_PARENT_NODE]).findAll(selector).all(), TRUE);
                }
            }

            return toDom(ret);
        },

        /**
         * Next.
         * @return {self}
         */
        next: function() {
            return toDom(__(this, NAME_NEXT_ELEMENT_SIBLING));
        },

        /**
         * Next all.
         * @param  {String} selector?
         * @return {self}
         */
        nextAll: function(selector) {
            var el = this[0], ret = [];

            if (el) {
                ret = walk(el, NAME_NEXT_ELEMENT_SIBLING);
                if (ret.len() && (selector = toAllSelector(selector))) {
                    ret = intersect(ret, toDom(el[NAME_PARENT_NODE]).findAll(selector).all(), TRUE);
                }
            }

            return toDom(ret);
        },

        /**
         * Matches.
         * @param  {String|Node} selector
         * @return {Bool}
         */
        matches: function(selector) {
            return $bool(this[0] && toDom(selector).has(this[0]));
        },

        /**
         * Contains.
         * @param  {String|Node} selector
         * @return {Bool}
         */
        contains: function(selector) {
            return $bool(this[0] && toDom(selector, this[0]).len());
        },

        /**
         * Has.
         * @param  {String|Node} selector
         * @return {Bool}
         */
        has: function(selector) {
            if ($isString(selector)) {
                selector = toDom(selector)[0];
            }

            return $bool(selector && this.all().has(selector));
        },

        /**
         * Has parent.
         * @return {Bool}
         */
        hasParent: function() {
            return this.parent().len() > 0;
        },

        /**
         * Has parents.
         * @return {Bool}
         */
        hasParents: function() {
            return this.parent().parent().len() > 1;
        },

        /**
         * Has child.
         * @return {Bool}
         */
        hasChild: function() {
            return this.children().len() > 0;
        },

        /**
         * Has children.
         * @return {Bool}
         */
        hasChildren: function() {
            return this.children().len() > 1;
        },

        /**
         * Has content.
         * @return {Bool}
         */
        hasContent: function() {
            return !this.isEmpty(true);
        }
    });

    // dom: window,document
    toDomPrototype(Dom, {
        /**
         * Get window.
         * @param  {Bool} opt_content?
         * @return {self}
         */
        getWindow: function(opt_content) {
            var el = this[0];

            return toDom(el && (opt_content ? el.contentWindow : $getWindow(el)));
        },

        /**
         * Get document.
         * @param  {Bool} opt_content?
         * @return {self}
         */
        getDocument: function(opt_content) {
            var el = this[0];

            return toDom(el && (opt_content ? el.contentDocument : $getDocument(el)));
        }
    });

    // path helpers
    function getPath(el) {
        var s = getTag(el), path = [];
        if (el.id) {
            s += '#'+ el.id; // id is enough
        } else if (el[NAME_CLASS_NAME]) {
            s += '.'+ el[NAME_CLASS_NAME].split(re_space).join('.');
        }
        path.push(s);

        if (el[NAME_PARENT_NODE]) {
            path = path.concat(getPath(el[NAME_PARENT_NODE]));
        }

        return path;
    }

    function getXPath(el) {
        var tag = getTag(el);

        if (tag == TAG_HTML) return [TAG_HTML];
        if (tag == TAG_BODY) return [TAG_HTML, TAG_BODY];

        var i = 0, ii = 0, node, nodes = el[NAME_PARENT_NODE][NAME_CHILDREN], path = [];

        while (node = nodes[i++]) {
            if (node == el) {
                return path.concat(getXPath(el[NAME_PARENT_NODE]), tag +'['+ (ii + 1) +']');
            }
            if (node[NAME_TAG_NAME] == el[NAME_TAG_NAME]) {
                ii++;
            }
        }

        return path;
    }

    // dom: paths
    toDomPrototype(Dom, {
        /**
         * Path.
         * @param  {Bool} opt_string?
         * @return {Array|String|undefined}
         */
        path: function(opt_string) {
            var el = this[0], ret = [];

            if (isENode(el)) {
                return (ret = getPath(el).reverse()),
                    opt_string ? ret.slice(1).join(' > ') : ret;
            }
        },

        /**
         * Xpath.
         * @param  {Bool} opt_string?
         * @return {Array|String|undefined}
         */
        xpath: function(opt_string) {
            var el = this[0], ret = [];

            if (isENode(el)) {
                return (ret = getXPath(el)),
                    opt_string ? '/'+ ret.join('/') : ret;
            }
        }
    });

    var re_rgb = /rgb/i;
    var re_color = /color/i;
    var re_unit = /(?:px|em|%)/i; // short & quick
    var re_unitOther = /(?:ex|in|[cm]m|p[tc]|v[hw]?min)/i;
    var re_nonUnitStyles = /(?:(?:fill-?)?opacity|z(?:oom|index)|(?:font-?w|line-?h)eight|column(?:-?count|s))/i;
    var re_colon = /\s*:\s*/;
    var re_scolon = /\s*;\s*/;
    var matchesSelector = $document[NAME_DOCUMENT_ELEMENT].matches || function(selector) {
        var i = 0, all = $array(querySelectorAll(this[NAME_OWNER_DOCUMENT], selector));
        while (i < all.len()) {
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

        $for(sheets, function(sheet) {
            rules = sheet.rules || sheet.cssRules;
            $for(rules, function(rule) {
                if (matchesSelector.call(el, rule.selectorText)) {
                    ret.push(rule[NAME_STYLE]); // loop over all until last
                }
            });
        });

        return ret[ret.len() - 1] /* return last rule */ || {};
    }

    function getComputedStyle(el) {
        return $getWindow(el).getComputedStyle(el);
    }

    function getDefaultStyle(el, name) {
        var doc = $getDocument(el), body = doc[TAG_BODY], tag = el[NAME_TAG_NAME];

        if (!_defaultStylesCache[tag]) {
            el = createElement(doc, tag);
            appendChild(body, el);
            _defaultStylesCache[tag] = getComputedStyle(el)[$toStyleName(name)]; // grab
            removeChild(body, el);
        }

        return _defaultStylesCache[tag];
    }

    function setStyle(el, name, value) {
        name = $toStyleName(name), value = $string(value);

        var valueLen = value.len();
        if (valueLen) {
            if (valueLen < 9 && value[0] != '#' && re_color.test(name)) { // fix hexes
                value = '#'+ value;
            } else if ($isNumeric(value) && !re_nonUnitStyles.test(name)) { // fix pixsels
                value += 'px';
            }
        }

        el[NAME_STYLE][name] = value;
    }

    function getStyle(el, name) {
        return name ? getComputedStyle(el)[$toStyleName(name)] || '' : getComputedStyle(el);
    }

    function parseStyleText(text) {
        var styles = {}, s;

        text = $string(text).split(re_scolon);
        while (text.len()) {
            // wtf! :)
            (s = text.shift().split(re_colon))
                && (s[0] = $trim(s[0]))
                    && (styles[s[0]] = s[1] || '');
        }

        return styles;
    }

    function sumStyleValue(el, style) {
        var i = 2, args = arguments, ret = 0, style = style || getStyle(el), name;

        while (name = args[i++]) {
            ret += $float(style[name]);
        }

        return ret;
    }

    function toStyleObject(style) {
        var name, ret = {};

        for (name in style) {
            if (!$isNumeric(name) // skip '"0": "width"' etc.
                && $isString(style[name]) // has own doesn't work (firefox/51)
            ) {
                ret[name] = style[name];
            }
        }

        return ret;
    }

    // dom: styles
    toDomPrototype(Dom, {
        /**
         * Style.
         * @param  {String}      name
         * @param  {String|Bool} value? (or opt_convert)
         * @param  {Bool}        opt_raw?
         * @return {String}
         */
        style: function(name, value, opt_raw) {
            return $isNull(value) || $isNulls(value) ? this.removeStyle(name)
                : $isObject(name) || $isString(value) || (name && name.has(':')) ? this.setStyle(name, value)
                : this.getStyle(name, value /* opt_convert */, opt_raw);
        },

        /**
         * Has style.
         * @param  {String} name
         * @return {Bool}
         */
        hasStyle: function(name) {
            var el = this[0];

            return $bool(el && el[NAME_STYLE] && el[NAME_STYLE][NAME_CSS_TEXT].has(name));
        },

        /**
         * Set style.
         * @param  {String|Object} name
         * @param  {String}        value?
         * @return {self}
         */
        setStyle: function(name, value) {
            var styles = name;

            if ($isString(styles)) {
                styles = $isVoid(value) ? parseStyleText(name) : toKeyValue(name, value);
            }

            return this.for(function(el) {
                $forEach(styles, function(name, value) {
                    setStyle(el, name, value);
                });
            });
        },

        /**
         * Get style.
         * @param  {String} name
         * @param  {Bool}   opt_convert? @default=true
         * @param  {Bool}   opt_raw?     @default=false
         * @return {String|null|undefined}
         */
        getStyle: function(name, opt_convert, opt_raw) {
            var el = this[0], value, opt_convert;

            if (el) {
                if (opt_raw) {
                    return el[NAME_STYLE][$toStyleName(name)] || value;
                }

                value = getStyle(el, name);
                if ($isNulls(value)) {
                    value = NULL;
                } else {
                    value = $isFalse(opt_convert) ? value : (
                        re_rgb.test(value) ? $.util.parseRgbAsHex(value) // make rgb - hex
                            : re_unit.test(value) || re_unitOther.test(value) // make px etc. - float
                                // || re_nonUnitStyles.test(name) // make opacity etc. - float
                            ? $float(value) : value
                    );
                }
            }

            return value;
        },

        /**
         * Get styles.
         * @param  {String} name
         * @param  {Bool}  opt_convert? @default=true
         * @param  {Bool}  opt_raw?     @default=false
         * @return {Object|undefined}
         */
        getStyles: function(names, opt_convert, opt_raw) {
            var el = this[0], styles = {};
            if (el) {
                if (names) {
                    el = toDom(el);
                    split(names, re_comma).each(function(name) {
                        styles[name] = el.getStyle(name, opt_convert, opt_raw);
                    });
                } else {
                    styles = toStyleObject(getStyle(el));
                }

                return styles;
            }
        },

        /**
         * Get css (original) style.
         * @param  {String} name?
         * @return {String|Object|undefined}
         */
        getCssStyle: function(name) {
            var el = this[0], ret = {};
            if (el) {
                ret = toStyleObject(getCssStyle(el));
                return name ? ret[name] || '' : ret;
            }
        },

        /**
         * Get computed (rendered) style.
         * @param  {String} name?
         * @return {String|Object|undefined}
         */
        getComputedStyle: function(name) {
            var el = this[0], ret = {};
            if (el) {
                ret = toStyleObject(getComputedStyle(el));
                return name ? ret[name] || '' : ret;
            }
        },

        /**
         * Remove style.
         * @param  {String} name
         * @return {self}
         */
        removeStyle: function(name) {
            return (name == '*') ? this.attr('style', '') :
                   (name = split(name, re_comma)), this.for(function(el) {
                       name.each(function(name) { setStyle(el, name, ''); });
                   });
        }
    });

    // dimension, offset, scroll etc. helpers
    function isVisible(el) {
        return $bool(el && (el[NAME_OFFSET_WIDTH] || el[NAME_OFFSET_HEIGHT]));
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
        var doc = $getDocument(el), body = doc[TAG_BODY];
        var rid = $rid(), ridClass = (' '+ rid);
        var style, styleText = el[NAME_STYLE][NAME_CSS_TEXT];
        var parent = el[NAME_PARENT_ELEMENT], parents = [], parentStyle;

        while (parent) { // doesn't give the properties if parents are invisible
            if (!isVisible(parent)) {
                parentStyle = getStyle(parent);
                parents.push({el: parent, styleText: parent[NAME_STYLE][NAME_CSS_TEXT]});
                parent[NAME_CLASS_NAME] += ridClass;
                parent[NAME_STYLE][NAME_DISPLAY] = '';
                parent[NAME_STYLE][NAME_VISIBILITY] = ''; // for !important annots
            }
            parent = parent[NAME_PARENT_ELEMENT];
        }

        // tmp style element
        style = createElement(doc, 'style', {
            textContent: '.'+ rid +'{display:block!important;visibility:hidden!important}'
        });
        appendChild(body, style);

        el[NAME_CLASS_NAME] += ridClass;
        el[NAME_STYLE][NAME_DISPLAY] = '';
        el[NAME_STYLE][NAME_VISIBILITY] = ''; // for !important annots

        // finally, grap it!
        properties.each(function(name) {
            var value = el[name];
            if (value.call) { // getBoundingClientRect() etc.
                value = value.call(el);
            }
            ret.push(value);
        });

        // restore all
        removeChild(body, style);
        el[NAME_CLASS_NAME] = el[NAME_CLASS_NAME].remove(ridClass);
        if (styleText) {
            el[NAME_STYLE][NAME_CSS_TEXT] = styleText;
        }

        while (parent = parents.shift()) {
            parent.el[NAME_CLASS_NAME] = parent.el[NAME_CLASS_NAME].remove(ridClass);
            if (parent.styleText) {
                parent.el[NAME_STYLE][NAME_CSS_TEXT] = parent.styleText;
            }
        }

        return ret;
    }

    function getDimensions(el) {
        // @note: offset(width|height) = (width|height) + padding + border
        var ret = {width: 0, height: 0};
        var properties, win;

        if (isENode(el)) {
            if (!isVisible(el) || !isVisibleParent(el)) {
                properties = getInvisibleElementProperties(el, [NAME_OFFSET_WIDTH, NAME_OFFSET_HEIGHT]);
                ret.width = properties[0], ret.height = properties[1];
            } else {
                ret.width = el[NAME_OFFSET_WIDTH], ret.height = el[NAME_OFFSET_HEIGHT];
            }
        } else if (isRoot(el)) {
            win = $getWindow(el);
            width = win[NAME_INNER_WIDTH], height = win[NAME_INNER_HEIGHT];
        }

        return ret;
    }

    function getDimensionsBy(el, by, margins) {
        var dim = getDimensions(el);
        var ret = $extend(dim, {
            innerWidth: dim.width, outerWidth: dim.width,
            innerHeight: dim.height, outerHeight: dim.height
        });
        var style;

        if (isENode(el)) {
            style = getStyle(el);
            if ((!by || by == NAME_WIDTH) && dim.width) {
                ret.width -= sumStyleValue(NULL, style, NAME_PADDING_LEFT, NAME_PADDING_RIGHT)
                           + sumStyleValue(NULL, style, NAME_BORDER_LEFT_WIDTH, NAME_BORDER_RIGHT_WIDTH);
                if (by) return ret.width;
            }
            if ((!by || by == NAME_INNER_WIDTH) && dim.width) {
                ret.innerWidth -= sumStyleValue(NULL, style, NAME_BORDER_LEFT_WIDTH, NAME_BORDER_RIGHT_WIDTH);
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

    function getOffset(el, opt_relative) {
        var ret = {top: 0, left: 0};
        var properties, body, parentOffset;

        if (isENode(el)) {
            if (!isVisible(el) || !isVisibleParent(el)) {
                properties = getInvisibleElementProperties(el, [NAME_OFFSET_TOP, NAME_OFFSET_LEFT]);
                ret.top = properties[0], ret.left = properties[1];
            } else {
                ret.top = el[NAME_OFFSET_TOP], ret.left = el[NAME_OFFSET_LEFT];
            }

            body = $getDocument(el)[TAG_BODY];
            ret.top += body[NAME_SCROLL_TOP], ret.left += body[NAME_SCROLL_LEFT];
            if (opt_relative) {
                parentOffset = getOffset(el[NAME_PARENT_ELEMENT], opt_relative);
                ret.top += parentOffset.top, ret.left += parentOffset.left;
            }
        }

        return ret;
    }

    function getScroll(el) {
        var ret = {top: 0, left: 0};
        var win;

        if (isENode(el)) {
            ret.top = el[NAME_SCROLL_TOP], ret.left = el[NAME_SCROLL_LEFT];
        } else if (isRoot(el) || isRootElement(el)) {
            win = $getWindow(el);
            ret.top = win.pageYOffset, ret.left = win.pageXOffset;
        }

        return ret;
    }

    // dom: dimensions
    toDomPrototype(Dom, {
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
         * @param  {Bool} opt_margins?
         * @return {Int}
         */
        outerWidth: function(opt_margins) {
            return getDimensionsBy(this[0], NAME_OUTER_WIDTH, opt_margins);
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
         * @param  {Bool} opt_margins?
         * @return {Int}
         */
        outerHeight: function(opt_margins) {
            return getDimensionsBy(this[0], NAME_OUTER_HEIGHT, opt_margins);
        }
    });

    // dom: offset, scroll, box, isVisible
    toDomPrototype(Dom, {
        /**
         * Offset.
         * @param  {Bool} opt_relative?
         * @return {Object}
         */
        offset: function(opt_relative) {
            return getOffset(this[0], opt_relative);
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

    var fn_hasAttr = 'hasAttribute', fn_setAttr = 'setAttribute';
    var re_attrState = /^(?:(?:check|select|disabl)ed|readonly)$/i;

    // attr helpers
    function hasAttr(el, name) {
        return $bool(el && el[fn_hasAttr] && el[fn_hasAttr](name));
    }
    function setAttr(el, name, value, opt_state /* @internal */) {
        if (isENode(el)) {
            if ($isNull(value)) {
                removeAttr(el, name);
            } else if (name == NAME_VALUE) {
                el[NAME_VALUE] = value;
            } else if (name == NAME_TEXT && getTag(el) == 'option') {
                el[NAME_TEXT] = value;
            } else if (!$isFalse(opt_state) /* speed */ && (opt_state || re_attrState.test(name))) {
                (value || $isUndefined(value)) ? (el[fn_setAttr](name, ''), el[name] = !!value)
                    : (removeAttr(el, name), el[name] = FALSE);
            } else {
                el[fn_setAttr](name, value);
            }
        }
    }
    function getAttr(el, name) {
        return hasAttr(el, name) ? el.getAttribute(name) : UNDEFINED;
    }
    function getAttrs(el, opt_namesOnly) {
        var ret = $array(el && el.attributes);
        if (opt_namesOnly) {
            ret = ret.map(function(attr) { return attr[NAME_NAME] });
        }
        return ret;
    }
    function removeAttr(el, name) {
        if (isENode(el)) el.removeAttribute(name);
    }

    function toDataAttrName(name) {
        return 'data-'+ $trim(name);
    }

    // input helpers
    function isCheckInput(el) {
        return $bool(el && (el[NAME_TYPE] == 'radio' || el[NAME_TYPE] == 'checkbox'));
    }
    function isSelectInput(el) {
        return $bool(el && el[NAME_OPTIONS]);
    }

    // dom: attributes
    toDomPrototype(Dom, {
        /**
         * Attr.
         * @param  {String|Object} name
         * @param  {Any}           value?
         * @return {Any}
         */
        attr: function(name, value) {
            return $isNull(value) ? this.removeAttr(name)
                 : $isObject(name) || $isDefined(value) ? this.setAttr(name, value)
                 : this.getAttr(name);
        },

        /**
         * Attrs.
         * @return {Object}
         */
        attrs: function() {
            var el = this[0], ret = {};

            if (el) {
                getAttrs(el).each(function(attr) {
                    ret[attr[NAME_NAME]] = re_attrState.test(attr[NAME_NAME])
                        ? attr[NAME_NAME] : attr[NAME_VALUE];
                });
            }

            return ret;
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
         * @return {self}
         */
        setAttr: function(name, value) {
            var attributes = toKeyValue(name, value);

            return this.for(function(el) {
                for (name in attributes) {
                    setAttr(el, name, attributes[name]);
                }
            });
        },

        /**
         * Get attr.
         * @param  {String} name
         * @return {String|undefined}
         */
        getAttr: function(name) {
            return getAttr(this[0], name);
        },

        /**
         * Remve attr.
         * @param  {String} name
         * @return {self}
         */
        removeAttr: function(name) {
            name = split(name, re_comma);

            return this.for(function(el) {
                $each(name[0] != '*' ? name : getAttrs(el, TRUE), function(name) {
                    removeAttr(el, name);
                });
            });
        },

        /**
         * Toggle attr.
         * @param  {String} name
         * @param  {String} value?
         * @return {self}
         */
        toggleAttr: function(name, value) {
            name = split(name, re_comma);

            return this.for(function(el) {
                hasAttr(el, name) ? removeAttr(el, name) : setAttr(el, name, !$isVoid(value) ? value : '');
            });
        },

        /**
         * Data attr (alias of attr() for "data-" attributes).
         */
        dataAttr: function(name, value) {
            if ($isString(name)) {
                name = toDataAttrName(name);
            } else if ($isObject(name)) {
                var names = {};
                $forEach(name, function(key, value) {
                    names[toDataAttrName(key)] = value;
                });
                name = names;
            }

            return this.attr(name, value);
        },

        /**
         * Remove data attr.
         * @param  {String} name
         * @return {self}
         */
        removeDataAttr: function(name) {
            name = split(name, re_comma);

            return this.for(function(el) {
                if (name[0] == '*') { // all
                    name = getAttrs(el, TRUE).filter(function(name) {
                        return name.startsWith('data-');
                    });
                } else {
                    name = name.map(function(name) {
                        return toDataAttrName(name);
                    });
                }
                name.each(function(name) { removeAttr(el, name); });
            });
        },

        /**
         * So attr (so:* attributes).
         * @param  {String} name
         * @param  {String} value?
         * @return {String?|self}
         */
        soAttr: function(name, value) {
            return (name = soPrefix + name),
                $isDefined(value) || $isNull($value)
                    ? this.attr(name, value) /* set or remove (if null) */ : this.attr(name); /* get */
        }
    });

    // dom: values, options
    toDomPrototype(Dom, {
        /**
         * Value.
         * @param  {String} value?
         * @return {String|self|undefined}
         */
        value: function(value) {
            return $isDefined(value) ? this.setValue(value) : this.getValue();
        },

        /**
         * Set value.
         * @param  {String} value?
         * @return {self}
         */
        setValue: function(value) {
            value = $isNull(value) ? '' : (''+ value); // @important

            return this.for(function(el) {
                if (isSelectInput(el)) {
                    $for(el[NAME_OPTIONS], function(option) {
                        if (option[NAME_VALUE] === value) {
                            option[NAME_SELECTED] = TRUE;
                        }
                    });
                } else if (isCheckInput(el)) {
                    setAttr(el, NAME_CHECKED, (el[NAME_VALUE] === value), TRUE);
                } else {
                    setAttr(el, NAME_VALUE, (el[NAME_VALUE] = value), FALSE);
                }
            });
        },

        /**
         * Get value.
         * @return {String|undefined}
         */
        getValue: function() {
            var el = this[0], value, option;

            if (el) {
                if (isSelectInput(el)) {
                    option = el[NAME_OPTIONS][el[NAME_SELECTED_INDEX]];
                    // prevent no value'd options
                    value = option && hasAttr(option, NAME_VALUE) ? option[NAME_VALUE] : UNDEFINED;
                } else if (isCheckInput(el)) {
                    value = el[NAME_CHECKED] ? el[NAME_VALUE] || 'on' : UNDEFINED;
                } else {
                    value = el[NAME_VALUE];
                }
            }

            return value;
        }

        // /**
        //  * Option.
        //  * @return {HTMLOptionElement|undefined}
        //  */
        // option: function() {
        //    var el = this[0];
        //
        //    if (isSelectInput(el)) {
        //        return el[NAME_OPTIONS][el[NAME_SELECTED_INDEX]];
        //    }
        // },

        // /**
        //  * Options.
        //  * @param  {Bool} opt_toArray?
        //  * @return {HTMLOptionsCollection|Array|undefined}
        //  */
        // options: function(opt_toArray) {
        //    var el = this[0];
        //
        //    if (isSelectInput(el)) {
        //        return !opt_toArray ? el[NAME_OPTIONS] : $array(el[NAME_OPTIONS]);
        //    }
        // }
    });

    // dom: id
    toDomPrototype(Dom, {
        /**
         * Id.
         * @param  {String} id?
         * @return {String|self}
         */
        id: function(id) {
            return $isDefined(id) ? this.setId(id) : this.getId();
        },

        /**
         * Set id.
         * @param  {String} id
         * @return {self}
         */
        setId: function(id) {
            return setAttr(this[0], 'id', id, FALSE), this;
        },

        /**
         * Get id.
         * @return {String|undefined}
         */
        getId: function() {
            return getAttr(this[0], 'id');
        }
    });

    // class helpers
    function toClassRegExp(name) {
        return $re('(^|\\s+)'+ name +'(\\s+|$)', NULL, '1m');
    }

    function hasClass(el, name) {
        return $bool(el && el[NAME_CLASS_NAME] && toClassRegExp(name).test(el[NAME_CLASS_NAME]));
    }

    function addClass(el, name) {
        split(name, re_space).each(function(name) {
            if (!hasClass(el, name)) {
                el[NAME_CLASS_NAME] = $trim(el[NAME_CLASS_NAME] +' '+ name);
            }
        });
    }

    function removeClass(el, name) {
        split(name, re_space).each(function(name) {
            el[NAME_CLASS_NAME] = $trim(el[NAME_CLASS_NAME].replace(toClassRegExp(name), ' '));
        });
    }

    // dom: class
    toDomPrototype(Dom, {
        /**
         * Class.
         * @param  {String}      name?
         * @param  {String|Bool} option?
         * @return {Bool|self}
         */
        class: function(name, option) {
            return $isUndefined(option) ? this.addClass(name)
                : $isNull(option) || $isNulls(option) ? this.removeClass(name)
                    : $isTrue(option) ? this.setClass(name) : this.replaceClass(name, option);
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
         * @return {self}
         */
        addClass: function(name) {
            return this.for(function(el) { addClass(el, name); });
        },

        /**
         * Remove class.
         * @param  {String} name
         * @return {self}
         */
        removeClass: function(name) {
            return (name == '*') ? this.attr('class', '')
                : this.for(function(el) { removeClass(el, name); });
        },

        /**
         * Replace class.
         * @param  {String} oldName
         * @param  {String} newName
         * @return {self}
         */
        replaceClass: function(oldName, newName) {
            return this.for(function(el) {
                el[NAME_CLASS_NAME] = $trim(el[NAME_CLASS_NAME].replace(toClassRegExp(oldName),
                    ' '+ $trim(newName) +' '));
            });
        },

        /**
         * Toggle.
         * @param  {String} name
         * @return {self}
         */
        toggleClass: function(name) {
            return this.for(function(el) {
                hasClass(el, name) ? removeClass(el, name) : addClass(el, name);
            });
        },

        /**
         * Set class.
         * @param  {String} name
         * @return {self}
         */
        setClass: function(name) {
            return this.for(function(el) { el[NAME_CLASS_NAME] = name; });
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

            if ($isString(key)) {
                key = $trim(key);
                el.$data.set(key, value);
            } else {
                var data = toKeyValue(key, value);
                for (key in data) {
                    el.$data.set(key, data[key]);
                }
            }
        }
    }

    function getData(el, key) {
        if (el) {
            checkData(el);

            if ($isString(key)) {
                key = $trim(key);
                return (key == '*') ? el.$data.data : el.$data.get(key);
            }

            if ($isTrue(key)) {
                return el.$data; // get list object
            }
        }
    }

    // dom: data
    toDomPrototype(Dom, {
        /**
         * Data.
         * @param  {String|Object} key
         * @param  {Any}           value
         * @return {Any}
         */
        data: function(key, value) {
            return $isObject(key) ? this.setData(key) :
                $isDefined(value) ? this.setData(key, value) : this.getData(key);
        },

        /**
         * Has data.
         * @param  {?String} key
         * @return {Bool}
         */
        hasData: function(key) {
            var el = this[0];

            return (el && $isDefined(key ? getData(el, key) : getData(el, '*')));
        },

        /**
         * Set data.
         * @param  {String|Object} key
         * @param  {Any}           value
         * @return {self}
         */
        setData: function(key, value) {
            return this.for(function(el) { setData(el, key, value); });
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
         * @return {self}
         */
        removeData: function(key) {
            key = split(key, re_comma);

            return this.for(function(el) {
                checkData(el);
                if (key[0] == '*') {
                    el.$data.empty();
                } else {
                    key.each(function(key) {
                        el.$data.removeAt(key);
                    });
                }
            });
        }
    });

    var re_plus = /%20/g;
    var encode = $.util.urlEncode, decode = $.util.urlDecode;

    // dom: form
    toDomPrototype(Dom, {
        /**
         * Serialize.
         * @param  {Bool} opt_plus?
         * @return {String|undefined}
         */
        serialize: function(opt_plus) {
            var el = this[0];
            var name, value;
            var ret, data = [];

            if (getTag(el) == 'form') { // forms only
                $for(el, function(el) {
                    name = $trim(el && el[NAME_NAME]);
                    if (!name || el[NAME_DISABLED]) {
                        return;
                    }

                    value = toDom(el).getValue();
                    if (value != NULL) {
                        data.push(encode(name) +'='+ encode(value));
                    }
                });

                ret = data.join('&');
                if (!$isFalse(opt_plus)) {
                    ret = ret.replace(re_plus, '+');
                }
            }

            return ret;
        },

        /**
         * Serialize array.
         * @return {Array|undefined}
         */
        serializeArray: function() {
            var _ret = function(data, ret) {
                return ret = [], data.split('&').each(function(item) {
                    item = item.splits('=', 2), ret.push({
                        key: decode(item[0]), value: decode(item[1])
                    });
                }), ret;
            };

            return _ret(this.serialize(FALSE));
        },

        /**
         * Serialize object.
         * @return {Object|undefined}
         */
        serializeObject: function() {
            var _ret = function(data, ret) {
                return ret = {}, $for(data, function(item) {
                    if (item.key) ret[item.key] = item.value;
                }), ret;
            };

            return _ret(this.serializeArray());
        },

        /**
         * Serialize json.
         * @return {String|undefined}
         */
        serializeJson: function() {
            var _ret = function(data, ret) {
                return ret = {}, $for(data, function(item) {
                    if (item.key) ret[item.key] = item.value;
                }), $jsonEncode(ret);
            };

            return _ret(this.serializeArray());
        }
    });

    // state helpers
    function setState(el, name, value) {
        setAttr(el, name, value, TRUE);
    }
    function getState(el, name) {
        return $bool(el && el[name]);
    }

    // dom: form elements states
    toDomPrototype(Dom, {
        /**
         * Checked.
         * @param  {Bool} option?
         * @return {Bool|self}
         */
        checked: function(option) {
            return $isVoid(option) ? getState(this[0], NAME_CHECKED) : this.for(function(el) {
                setState(el, NAME_CHECKED, option);
            });
        },

        /**
         * Selected.
         * @param  {Bool} option?
         * @return {Bool|self}
         */
        selected: function(option) {
            return $isVoid(option) ? getState(this[0], NAME_SELECTED) : this.for(function(el) {
                setState(el, NAME_SELECTED, option);
            });
        },

        /**
         * Disabled.
         * @param  {Bool} option?
         * @return {Bool|self}
         */
        disabled: function(option) {
            return $isVoid(option) ? getState(this[0], NAME_DISABLED) : this.for(function(el) {
                setState(el, NAME_DISABLED, option);
            });
        },

        /**
         * Readonly.
         * @param  {Bool} option?
         * @return {Bool|self}
         */
        readonly: function(option) {
            return $isVoid(option) ? getState(this[0], NAME_READONLY) : this.for(function(el) {
                setState(el, NAME_READONLY, option);
            });
        }
    });

    // dom: checkers
    toDomPrototype(Dom, {
        /**
         * Is window.
         * @return {Bool}
         */
        isWindow: function() {
            return $isWindow(this[0]);
        },

        /**
         * Is document.
         * @return {Bool}
         */
        isDocument: function() {
            return $isDocument(this[0]);
        },

        /**
         * Is node.
         * @return {Bool}
         */
        isNode: function() {
            return isNode(this[0]);
        },

        /**
         * Is e(lement) node.
         * @return {Bool}
         */
        isENode: function() {
            return isENode(this[0]);
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
        toDomPrototype(Dom, {
            /**
             * On.
             * @param  {String}   type
             * @param  {Function} fn
             * @param  {Object}   options?
             * @return {self}
             */
            on: function(type, fn, options) {
                return this.for(function(el) { event.on(el, type, fn, options); });
            },

            /**
             * One.
             * @param  {String}   type
             * @param  {Function} fn
             * @param  {Object}   options?
             * @return {self}
             */
            one: function(type, fn, options) {
                return this.for(function(el) { event.one(el, type, fn, options); });
            },

            /**
             * Off.
             * @param  {String}   type
             * @param  {Function} fn
             * @param  {Object}   options?
             * @return {self}
             */
            off: function(type, fn, options) {
                return this.for(function(el) { event.off(el, type, fn, options); });
            },

            /**
             * Fire.
             * @param  {String}   type
             * @param  {Function} fn
             * @param  {Object}   options?
             * @return {self}
             */
            fire: function(type, fn, options) {
                return this.for(function(el) { event.fire(el, type, fn, options); });
            },

            /**
             * Event (alias of on()).
             */
            event: function(type, fn, options) {
                return this.on(type, fn, options);
            },

            /**
             * Has event.
             * @param  {String}   type
             * @param  {Function} fn
             * @param  {Bool}     opt_typeOnly?
             * @return {Bool}
             */
            hasEvent: function(type, fn, opt_typeOnly) {
                return event.has(this[0], type, fn, opt_typeOnly);
            }
        });
    }

    // dom: animations
    var animate = $.animation && $.animation.animate;
    if (animate) {
        toDomPrototype(Dom, {
            /**
             * Animate.
             * @param  {Object|String} properties
             * @param  {Int|String}    speed?
             * @param  {String}        easing?
             * @param  {Function}      callback?
             * @return {self}
             */
            animate: function(properties, speed, easing, callback) {
                return (properties === 'stop') // stop previous animation
                    ? this.for(function(el, animation) {
                        animation = el.$animation;
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
             * @return {self}
             */
            fade: function(to, speed, callback) {
                return this.animate({opacity: to}, speed, callback);
            },

            /**
             * Fade in.
             * @param  {Int|String} speed?
             * @param  {Function}   callback?
             * @return {self}
             */
            fadeIn: function(speed, callback) {
                return this.fade(1, speed, callback);
            },

            /**
             * Fade out.
             * @param  {Int|String}    speed?
             * @param  {Function|Bool} callback?
             * @return {self}
             */
            fadeOut: function(speed, callback) {
                if ($isTrue(callback)) { // remove element after fading out
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
             * @return {self}
             */
            show: function(speed, easing, callback) {
                return this.for(function(el) {
                    el[NAME_STYLE][NAME_DISPLAY] = getDefaultStyle(el, NAME_DISPLAY);
                    animate(el, {opacity: 1}, speed || 0, easing, callback);
                });
            },

            /**
             * Hide.
             * @param  {Int|String}      speed?
             * @param  {String|Function} easing?
             * @param  {Function}        callback?
             * @return {self}
             */
            hide: function(speed, easing, callback) {
                if ($isFunction(easing)) {
                    callback = easing, easing = NULL;
                }

                return this.for(function(el) {
                    animate(el, {opacity: 0}, speed || 0, easing, function() {
                        el[NAME_STYLE][NAME_DISPLAY] = NAME_NONE, (callback && callback(this));
                    });
                });
            },

            /**
             * Toggle.
             * @param  {Int|String}      speed?
             * @param  {String|Function} easing?
             * @param  {Function}        callback?
             * @return {self}
             */
            toggle: function(speed, easing, callback) {
                if ($isFunction(easing)) {
                    callback = easing, easing = NULL;
                }

                return this.for(function(el) {
                    if (!isVisible(el)) {
                        el[NAME_STYLE][NAME_DISPLAY] = getDefaultStyle(el, NAME_DISPLAY);
                        animate(el, {opacity: 1}, speed || 0, easing, callback);
                    } else {
                        animate(el, {opacity: 0}, speed || 0, easing, function() {
                            el[NAME_STYLE][NAME_DISPLAY] = NAME_NONE, (callback && callback(this));
                        });
                    }
                });
            },

            /**
             * Toggle by.
             * @param  {Bool}            option
             * @param  {Int|String}      speed?
             * @param  {String|Function} easing?
             * @param  {Function}        callback?
             * @return {self}
             */
            toggleBy: function(option, speed, easing, callback) {
                return option ? this.show(speed, easing, callback) : this.hide(speed, easing, callback);
            },

            /**
             * Blip.
             * @param  {Int}        times?
             * @param  {Int|String} speed?
             * @return {self}
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
             * @param  {Int}        top
             * @param  {Int}        left
             * @param  {Int|String} speed?
             * @param  {String}     easing?
             * @param  {Function}   callback?
             * @return {self}
             */
            scrollTo: function(top, left, speed, easing, callback) {
                return this.for(function(el) {
                    // 'cos window, document or (even body, for chrome & its gangs) won't be animated so..
                    if (isRoot(el) || isRootElement(el)) {
                        el = $getDocument(el)[NAME_SCROLLING_ELEMENT] || $getDocument(el)[NAME_DOCUMENT_ELEMENT];
                    }

                    var properties = {};
                    properties[NAME_SCROLL_TOP] = top || el[NAME_SCROLL_TOP];
                    properties[NAME_SCROLL_LEFT] = left || el[NAME_SCROLL_LEFT];

                    animate(el, properties, speed, easing, callback);
                });
            }
        });
    }

    // xpath helper
    function toXDom(selector, root, one) {
        var doc = root || $document;
        var docEl = doc && doc[NAME_DOCUMENT_ELEMENT];
        var nodes = [], node, iter, ret;
        if (!docEl) {
            throw ('XPath is not supported by root object!');
        }

        if (doc.evaluate) {
            iter = doc.evaluate(selector, docEl, NULL, XPathResult.ANY_TYPE, NULL);
            while (node = iter.iterateNext()) {
                nodes.push(node);
                if (one) {
                    break;
                }
            }
        } else if (docEl.selectNodes) { // ie (still..)
            nodes = docEl.selectNodes(selector);
            if (one) {
                nodes = nodes[0];
            }
        }

        ret = toDom(nodes);
        ret._selector = selector;

        return ret;
    }

    /**
     * Dom.
     * @param  {String|Object} selector
     * @param  {Object}        root?
     * @return {self}
     */
    var $dom = function(selector, root) {
        return toDom(selector, root);
    };

    // add static methods to dom
    $extend($dom, {
        // find by selector
        find: function(selector, root) {
            return toDom(selector, root, TRUE);
        },
        findAll: function(selector, root) {
            return toDom(selector, root);
        },
        // find by xpath
        xfind: function(selector, root) {
            return toXDom(selector, root, TRUE);
        },
        xfindAll: function(selector, root) {
            return toXDom(selector, root);
        },
        // (name, value) or ({name: value})
        define: function(name, value) {
            var names = Object.keys(Dom[NAME_PROTOTYPE]);
            $forEach(toKeyValue(name, value), function(name, value) {
                if (names.has(name)) {
                    throw ('Cannot overwrite on Dom.'+ name +'!');
                }
                Dom[NAME_PROTOTYPE][name] = value;
            });
        },
        create: function(content, attributes, doc) {
            return create(content, doc, attributes);
        },
        loadStyle: function(src, root, onload, attributes) {
            var el = createElement(NULL, 'link');
            el.href = src, el.onload = onload, el.rel = 'stylesheet';

            if (attributes) $forEach(attributes, function(name, value) {
                setAttr(el, name, value);
            });

            appendChild(toDom(root || $document[TAG_HEAD])[0], el);
        },
        loadScript: function(src, root, onload, attributes) {
            var el = createElement(NULL, 'script');
            el.src = src, el.onload = onload;

            if (attributes) $forEach(attributes, function(name, value) {
                setAttr(el, name, value);
            });

            appendChild(toDom(root || $document[TAG_HEAD])[0], el);
        },
        isNode: function(el) {
            return isNode(el);
        },
        isENode: function(el) {
            return isENode(el);
        }
    });

    // export dom
    $.dom = $dom;

})(window, window.so, null, true, false);
