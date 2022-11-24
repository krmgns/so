/**
 * @package so
 * @object  so.dom
 * @depends so, so.event, so.animation, so.util
 * @author  Kerem Güneş
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function ($, NULL, TRUE, FALSE, UNDEFINED) { 'use strict';

    // minify candies
    var PROTOTYPE = 'prototype',
        DATA = '$data', ANIMATION = '$animation',
        OBSERVER = '$observer', EVENTS = '$events',
        NAME_NODE_NAME = 'nodeName', NAME_NODE_TYPE = 'nodeType',
        NAME_PARENT_NODE = 'parentNode', NAME_PARENT_ELEMENT = 'parentElement',
        NAME_CHILDREN = 'children', NAME_CHILD_NODES = 'childNodes', NAME_FIRST_CHILD = 'firstChild',
        NAME_NEXT_ELEMENT_SIBLING = 'nextElementSibling', NAME_PREVIOUS_ELEMENT_SIBLING = 'previousElementSibling',
        NAME_PADDING_TOP = 'paddingTop', NAME_PADDING_BOTTOM = 'paddingBottom',
        NAME_PADDING_LEFT = 'paddingLeft', NAME_PADDING_RIGHT = 'paddingRight',
        NAME_MARGIN_TOP = 'marginTop', NAME_MARGIN_BOTTOM = 'marginBottom',
        NAME_MARGIN_LEFT = 'marginLeft', NAME_MARGIN_RIGHT = 'marginRight',
        NAME_BORDER_TOP_WIDTH = 'borderTopWidth', NAME_BORDER_BOTTOM_WIDTH = 'borderBottomWidth',
        NAME_BORDER_LEFT_WIDTH = 'borderLeftWidth', NAME_BORDER_RIGHT_WIDTH = 'borderRightWidth',
        NAME_WIDTH = 'width', NAME_INNER_WIDTH = 'innerWidth', NAME_OUTER_WIDTH = 'outerWidth', NAME_OFFSET_WIDTH = 'offsetWidth',
        NAME_HEIGHT = 'height', NAME_INNER_HEIGHT = 'innerHeight', NAME_OUTER_HEIGHT = 'outerHeight', NAME_OFFSET_HEIGHT = 'offsetHeight',
        NAME_TOP = 'top', NAME_OFFSET_TOP = 'offsetTop', NAME_SCROLL_TOP = 'scrollTop',
        NAME_LEFT = 'left', NAME_OFFSET_LEFT = 'offsetLeft', NAME_SCROLL_LEFT = 'scrollLeft',
        NAME_INNER_HTML = 'innerHTML', NAME_OUTER_HTML = 'outerHTML', NAME_TEXT_CONTENT = 'textContent',
        NAME_ID = 'id', NAME_NAME = 'name', NAME_VALUE = 'value', NAME_TEXT = 'text',
        NAME_STYLE = 'style', NAME_CLASS = 'class', NAME_CLASS_NAME = 'className', NAME_TAG_NAME = 'tagName',
        NAME_TYPE = 'type', NAME_OPTIONS = 'options', NAME_SELECTED_INDEX = 'selectedIndex', NAME_HIDDEN = 'hidden',
        NAME_CHECKED = 'checked', NAME_SELECTED = 'selected', NAME_DISABLED = 'disabled', NAME_READONLY = 'readOnly',
        NAME_DISPLAY = 'display', NAME_VISIBILITY = 'visibility', NAME_NONE = 'none', NAME_CSS_TEXT = 'cssText',
        NAME_OWNER_DOCUMENT = 'ownerDocument', NAME_DOCUMENT_ELEMENT = 'documentElement', NAME_SCROLLING_ELEMENT = 'scrollingElement',
        TAG_WINDOW = '#window', TAG_DOCUMENT = '#document', TAG_HTML = 'html', TAG_HEAD = 'head', TAG_BODY = 'body';
    var $doc = $.doc();
    var $event = $.event, $util = $.util, $toStyleName = $util.toStyleName;
    var $re = $.re, $array = $.array, $uid = $util.uid,
        $each = $.each, $for = $.for, $forEach = $.forEach;
    var $len = $.len, $trim = $.trim, $extend = $.extend, $fire = $.fire,
        $int = $.int, $float = $.float, $string = $.string, $bool = $.bool,
        $isNull = $.isNull, $isNulls = $.isNulls, $isVoid = $.isVoid,
        $isDefined = $.isDefined, $isUndefined = $.isUndefined,
        $isString = $.isString, $isNumber = $.isNumber, $isNumeric = $.isNumeric,
        $isArray = $.isArray, $isObject = $.isObject, $isFunction = $.isFunction,
        $isTrue = $.isTrue, $isFalse = $.isFalse,
        $isWindow = $.isWindow, $isDocument = $.isDocument,
        $getWindow = $.win, $getDocument = $.doc;
    var warn = console.warn;

    var re_space = /\s+/g;
    var re_comma = /\s*,\s*/;
    var re_tag = /^<([\w-]+)[^>]*>/i;
    var re_tagVoid = /^area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr$/i;

    // general helpers
    function test(s, re) {
        return re.test(s);
    }
    function split(s, re) {
        return $trim(s).split(re).filter();
    }
    function pick(key, object, value) {
        if (key in object) {
            value = $string(object[key]);
            delete object[key];
        }
        return value;
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

    function isNode(x) {
        return $bool(x && (x[NAME_NODE_TYPE] === 1 || x[NAME_NODE_TYPE] === 9 || x[NAME_NODE_TYPE] === 11));
    }
    function isElementNode(x) {
        return $bool(x && (x[NAME_NODE_TYPE] === 1));
    }

    function isDom(x) {
        return (x instanceof Dom);
    }
    function toDom(selector, root, one) {
        return isDom(selector) ? selector : new Dom(selector, root, one);
    }
    function toDomArray(elements) {
        return elements.map(function (element) { return new Dom(element); });
    }
    function toDomPrototype(Dom, prototype) {
        $extend(Dom[PROTOTYPE], prototype);
    }

    function toKeyValue(key, value) {
        var ret = key || {};
        if ($isString(ret)) {
            ret = {}, ret[key] = value;
        }
        return ret;
    }
    function toTagContent(tag, content) {
        return {'$tag': tag, '$content': content};
    }

    var re_child = /(?::first|last|nth)(?!-)|(?:[\w-]+):(?:\d+)/;
    var re_childFix = /([\w-]+|):(first|last|nth([^-]+))|([\w-]+):(\d+)/g;
    var re_attr = /\[.+\]/;
    var re_attrFix = /([.:])/g;
    var re_attrFixMatch = /\[([\w.:]+)(=[^\]]+)?\]/g;
    var re_data = /([\w-]+)?\[(data-[\w-]+)\*/;
    var re_idOrClass = /^([#.])([\w-]+)$/;
    var _soAttrPrefix = 'so:', _soAttrId = 'so:id', _soTempTag = '<so-temp>';

    /**
     * Select.
     * @param  {String|Object} selector
     * @param  {String|Object} root?
     * @param  {Bool}          one?
     * @return {Array}
     */
    function select(selector, root, one) {
        if (!selector) return;

        if (root) {
            // both Dom & String accepted as "root"
            if (isDom(root)) {
                root = root[0];
            } else if ($isString(root)) {
                root = querySelector($doc, root);
            } // else any element
        } else {
            root = $doc;
        }

        var r, re, ret = [], isAttr, isParent, s, i, il;
        selector = selector.replace(re_space, ' ');

        // @note: seems, it isn't that kinda cheap.. (eg: "[data-*]" or "a[data-*]")
        isAttr = test(selector, re_attr);
        if (isAttr) {
            re = selector.matchAll(re_data);
            if (re) {
                i = 0, s = [];
                while (r = re[i++]) {
                    s.push(r[1] || ''); // collect tags
                }
                s = s.filter().len() ? s.join(',') : '*'; // query all selector

                $array(querySelectorAll(root, s)).each(function (el) {
                    i = 0;
                    while (r = re[i++]) {
                        getAttrs(el, TRUE).each(function (name) {
                            if (name.startsWith(r[2])) {
                                ret.push(el);
                            }
                        })
                    }
                });
                return ret;
            }
        }

        // @note: should not be mixed in a complex selector (eg: 'a.foo:first, body')
        if (test(selector, re_child)) {
            i = 0, il = $len(selector.matchAll(re_child));
            while ((i++) < il) {
                // eg: p:first => p:first-child or div:1 => div:nth-child(1)
                selector = selector.replace(re_childFix, function (args) {
                    return args = $array(arguments),
                        args[4] ? args[4] +':nth-child('+ args[5] +')' // eg: div:1 => div:nth-child(1)
                                : args[1] +':'+ (args[3] ? 'nth-child'+ args[3] : args[2] +'-child');
                });
            }
        }
        // @note: should not be mixed in a complex selector (eg: 'a.foo:parent, body')
        else if (selector.has(':parent')) {
            // eg: p:parent => p->parentNode
            selector = selector.removeAll(':parent'), isParent = TRUE;
        }

        // grammar: https://www.w3.org/TR/css3-selectors/#grammar
        if (isAttr) {
            // eg: 'a.b' => 'a\.b' or 'a.b="c"' => 'a\.b="c"'
            selector = selector.replace(re_attrFixMatch, function (_, _1, _2) {
                _1 = _1.replace(re_attrFix, '\\$1'); // name
                _2 = _2 ? _2.slice(1) : '';          // value
                return '['+ _1 + (_2 ? $isNumeric(_2) ? '="'+ _2 +'"' : '='+ _2 : '') +']';
            });
        }

        ret = $array(
            one ? querySelector(root, selector) // speed..
                : querySelectorAll(root, selector)
        );

        if (isParent) {
            ret = ret.each(function (el, i) {
                ret[i] = el[NAME_PARENT_NODE];
            })
        }

        return ret;
    }

    /**
     * Dom.
     * @param {String|Object} selector
     * @param {String|Object} root?
     * @param {Bool|Object}   one?
     */
    function Dom(selector, root, one) {
        var _this = this, els, len = 0, re, idn, idv;

        if (selector) {
            // select & create
            if ($isString(selector)) {
                selector = $trim(selector);
                if (selector) {
                    // eg: ("a", "Click!", ...attributes)
                    //     ("a", {$content:"Click!", ...attributes})
                    if (root && ($isObject(root) || $isObject(one))) {
                        els = create($isString(root) ? $extend(toTagContent(selector, root), one)
                                                     : $extend(toTagContent(selector), root));
                    } else {
                        // id & class check (some speed..)
                        if (re = selector.match(re_idOrClass)) {
                            els = (re[1] == '#') ? [(root = $doc).getElementById(re[2])]
                                                 : (root || $doc).getElementsByClassName(re[2]);
                        } else if (re = selector.match(re_tag)) {
                            // root may be document or attributes
                            els = create(selector, root, root, re[1]);
                            root = NULL;
                        } else if (selector[0] == '>') {
                            root = isElementNode(root) ? root : $doc[NAME_DOCUMENT_ELEMENT];
                            // buggy :scope selector
                            idv = getAttr(root, (idn = _soAttrId)) || $uid();
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
                }
            }
            // window & document
            else if (isRoot(selector)) {
                els = [selector];
            }
            // node
            else if (isNode(selector)) {
                if (root && root != selector[NAME_PARENT_NODE]) {
                    // pass (check root reliability)
                } else {
                    els = [selector];
                }
            }
            // array
            else if ($isArray(selector)) {
                els = [], selector.each(function (el) {
                    isDom(el) ? els = els.concat(el.all()) : els.push(el);
                });
            }
            // create
            else if ($isObject(selector)) {
                els = create(selector);
            }
            // node list & element list etc
            else {
                els = selector;
            }

            $for(els, function (el) {
                if (el) _this[len++] = el;
            });
        }

        // define all read-only, but selector
        Object.defineProperties(_this, {
                 '_len': {value: len},
                '_root': {value: root || $doc},
            '_selector': {value: selector, writable: TRUE}
        });
    }

    // dom: base
    toDomPrototype(Dom, {
        /**
         * Len.
         * @return {Int}
         */
        len: function () {
            return this._len;
        },

        /**
         * Root.
         * @return {Object}
         */
        root: function () {
            return this._root;
        },

        /**
         * Find.
         * @param  {String|Object} selector
         * @return {Dom|this}
         */
        find: function (selector, _this /* local */) {
            return (_this = this),
                    _this[0] ? toDom(selector, _this[0], TRUE)
                             : _this;
        },

        /**
         * Find all.
         * @param  {String|Object} selector
         * @return {Dom|this}
         */
        findAll: function (selector, _this /* local */) {
            return (_this = this),
                    _this[0] ? toDom(selector, _this[0])
                             : _this;
        },

        /**
         * Concat.
         * @return {Any} ...arguments
         * @return {Dom}
         */
        concat: function () {
            var els = $array(arguments).reduce(function (_els, selector) {
                return _els.append(toDom(selector));
            }, []);

            return toDom(this.all().concat(els).uniq());
        },

        /**
         * To array.
         * @return {Node[]}
         */
        toArray: function () {
            for (var i = 0, el, els = []; el = this[i]; i++) {
                els[i] = el;
            }

            return els;
        },

        /**
         * To dom array.
         * @return {Dom[]}
         */
        toDomArray: function () {
            return toDomArray(this.toArray());
        },

        /**
         * Each.
         * @param  {Function} fn
         * @param  {Bool}     init?
         * @return {this}
         */
        each: function (fn, init) {
            var all = this.all();

            if (init) {
                // shortcut for: ... each(function (el) { var $el = $(el) ...
                all = all.map(function (el) {
                    return toDom(el, NULL, TRUE);
                });
            }

            return $each(all, fn, this);
        },

        /**
         * For.
         * @param  {Function} fn
         * @return {this}
         */
        for: function (fn) {
            return $for(this.all(), fn, this);
        },

        /**
         * For each.
         * @param  {Function} fn
         * @return {this}
         */
        forEach: function (fn) {
            return $forEach(this.all(), fn, this);
        },

        /**
         * Copy.
         * @return {Dom}
         */
        copy: function () {
            return toDom(this.all());
        },

        /**
         * Map.
         * @param  {Function} fn
         * @return {Dom}
         */
        map: function (fn) {
            return toDom(this.all().map(fn));
        },

        /**
         * Filter.
         * @param  {Function|String} fn
         * @return {Dom}
         */
        filter: function (fn) {
            var all = this.all(), alls;

            if ($isFunction(fn)) {
                return toDom(all.filter(fn));
            }

            // selector given
            alls = toDom(fn);
            return toDom(all.filter(function (el) {
                return alls.has(el);
            }));
        },

        /**
         * Reverse.
         * @return {Dom}
         */
        reverse: function () {
            return toDom(this.all().reverse());
        },

        /**
         * El.
         * @param  {Int} i?
         * @return {Node}
         */
        el: function (i) {
            return this[(i || 1) - 1]; // 1 = first, not 0
        },

        /**
         * Els.
         * @param  {Int} ...arguments?
         * @return {Node[]}
         */
        els: function () {
            var el, els = [], _this = this, args = $array(arguments);

            if (!args.len()) {
                els = _this.all();
            } else {
                $for(args, function (i) {
                    el = _this.el(i);
                    el && els.push(el);
                });
            }

            return els;
        },

        /**
         * Item.
         * @param  {Int} i
         * @return {Dom}
         */
        item: function (i) {
            return toDom(this.el(i));
        },

        /**
         * Items.
         * @param  {Int} ...arguments?
         * @return {Dom[]}
         */
        items: function () {
            return toDomArray(this.els.apply(this, arguments));
        },

        /**
         * First.
         * @return {Dom}
         */
        first: function () {
            return this.item(1);
        },

        /**
         * Last.
         * @return {Dom}
         */
        last: function () {
            return this.item(this._len);
        },

        /**
         * Nth.
         * @param  {Int|String} i
         * @return {Dom}
         */
        nth: function (i) {
            if ($isNumber(i)) {
                return this.item(i);
            }

            i = $int(i);
            return toDom(this.filter(function (node, _i) {
                return !((_i + 1) % i) && i;
            }));
        },

        /**
         * Odd.
         * @return {Dom}
         */
        odd: function () {
            return toDom(this.filter(function (el, i) {
                return (i & 1);
            }));
        },

        /**
         * Even.
         * @return {Dom}
         */
        even: function () {
            return toDom(this.filter(function (el, i) {
                return !(i & 1);
            }));
        },

        /**
         * Tag.
         * @return {String|null}
         */
        tag: function () {
            return getTag(this[0])
        },

        /**
         * Tags.
         * @return {String[]}
         */
        tags: function () {
            var ret = [];

            this.for(function (el) {
                ret.push(getTag(el))
            })

            return ret;
        },

        /**
         * All (alias of toArray(), toDomArray()).
         */
        all: function (opt_dom) {
            return !opt_dom ? this.toArray() : this.toDomArray();
        },

        /**
         * $, $$ (shorthand of find(), findAll()).
         */
        $: function (selector) {
            return this.find(selector);
        },
        $$: function (selector) {
            return this.findAll(selector);
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
        // all possible, attributes can be mixed width content and event listeners
        // ("<a/>", ...attributes) or ("<a>Click!</a>", ...attributes)
        // ("a", "Click!", ...attributes) or ("<a>", "Click!", ...attributes)
        // ("<a id='x'>Click!</a>", ...attributes) or ("<a id='x'>", {$content: "Click!", ...attributes})
        // ("a", {$content: "Click!", ...attributes}) or ({$tag: "a", $content: "Click!", ...attributes})

        if (isDom(content))    return content.all();
        if (isNode(content))   return [content];
        if ($isArray(content)) return content;

        if ($isObject(content) || $isObject(doc)) {
            var mix = $extend({}, content, attributes);
            if ($isObject(doc)) {
                mix = $extend(mix, doc);
            }
            mix['$tag'] = mix['$tag'] || tag;

            var _tag = pick('$tag', mix, '').trim(),
                _content = pick('$content', mix, ''),
                s = '', ss, sse, grep = [];

            if (!_tag) {
                throw ('Empty $tag in content!');
            }

            if (_tag[0] == '<') {
                // grep: tag, attribute string, content string
                grep = _tag.grepAll(/^<([\w-]+)([^>]*)>(.*)/i, 0);
                _tag = grep[0];
            }

            ss = '<'+ _tag.trimLeft('<');
            if (grep[1] != '/') {
                ss += grep[1] || s;
            }

            ss += '>'+ (grep[2] || s) + _content;
            if (!test(_tag, re_tagVoid)) {
                sse = '</'+ _tag +'>';
                if (grep[1] == '/' || !(grep[2] || s).endsWith(sse)) {
                    ss += sse;
                }
            }
            _content = ss;

            tag = _tag, content = _content, attributes = mix, doc = NULL;
        }

        var fragment, temp, tempTag = _soTempTag.strip('<>'), i = 0, il;

        // fix table & body stuff
        tag = tag || (content && content.grep(re_tag));
        if (tag) {
            switch (tag = tag.lower()) {
                case 'tr': tempTag = 'tbody'; break;
                case 'th': case 'td': tempTag = 'tr'; break;
                case 'thead': case 'tbody': case 'tfoot': tempTag = 'table'; break;
                case 'body': tempTag = 'html'; break;
            }
        }

        doc = doc && $isDocument(doc) ? doc : $doc;
        temp = createElement(doc, tempTag, {innerHTML: content});
        fragment = doc.createDocumentFragment();

        il = $len(temp = $array(temp[NAME_CHILD_NODES]));
        while (i < il) {
            if (il == 2 && tag == 'body') {
                i++; // move next for body (see fix above)
            }
            appendChild(fragment, temp[i++]);
        }

        if (attributes && $isObject(attributes)) {
            $for(fragment[NAME_CHILD_NODES], function (node) {
                if (isElementNode(node)) {
                    $forEach(attributes, function (name, value) {
                        if ($isFunction(value)) { // events (eg: click or onclick)
                            if (name.startsWith('on')) {
                                name = name.slice(2);
                            }
                            $event && $event.on(node, name, value);
                        } else if (name == NAME_STYLE) {
                            $forEach(value, function (name, value) {
                                setStyle(node, name, value);
                            });
                        } else {
                            setAttr(node, name, value);
                        }
                    });
                }
            });
        }

        return $array(fragment[NAME_CHILD_NODES]);
    }

    function createFor(el, content, attributes) {
        return create(content, $getDocument(el), attributes);
    }

    function createElement(doc, tag, properties) {
        var el = (doc || $doc).createElement(tag);

        if (properties) {
            $forEach(properties, function (name, value) {
                el[name] = value;
            });
        }

        return el;
    }

    function cleanElement(el, opt_self, _child) {
        if (!$isFalse(opt_self)) {
            el[DATA] = el[ANIMATION] = el[OBSERVER] = el[EVENTS] = NULL;
        }

        while (_child = el[NAME_FIRST_CHILD]) {
            if (isElementNode(_child)) {
                cleanElement(_child);
            }
            removeChild(el, _child);
        }

        return el;
    }

    var cloneId = 0,
        cloneIdAttr = _soAttrPrefix +'clone-id';

    function cloneElement(el, opt_deep) {
        var clone = el.cloneNode();

        // clone.$cloneOf = el; // @debug
        if (isElementNode(el)) {
            setAttr(clone, cloneIdAttr, ++cloneId, FALSE);
        }

        if (!$isFalse(opt_deep)) {
            clone[DATA] = el[DATA] || {};
            clone[DATA][cloneIdAttr] = cloneId;

            cloneSpecials(el, clone);

            if (el[NAME_CHILD_NODES]) {
                $for(el[NAME_CHILD_NODES], function (child) {
                    appendChild(clone, cloneElement(child, opt_deep));
                });
            }
        }

        return clone;
    }

    function cloneSpecials(source, target, opt_data) {
        if (opt_data && source[DATA]) {
            delete source[DATA][cloneIdAttr]; // no longer valid
            target[DATA] = source[DATA]
        }

        if (source[OBSERVER]) {
            target[OBSERVER] = source[OBSERVER];
            target[OBSERVER].observe(target, source[OBSERVER].options);
        }

        if (source[EVENTS]) {
            $for(source[EVENTS], function (events) {
                $for(events, function (event) {
                    event.bindTo(target);
                });
            });
        }
    }

    function cloneIf(opt_clone, node) { // note: inserts only once without clone id
        if ($isFalse(opt_clone)) {
            // pass
        } else if ($isTrue(opt_clone) && !hasAttr(node, cloneIdAttr)
                                      && !hasData(node, cloneIdAttr)) {
            node = cloneElement(node);
        }
        return node;
    }

    // dom: modifiers
    toDomPrototype(Dom, {
        /**
         * Clone.
         * @param  {Bool} opt_deep?
         * @return {Dom}
         */
        clone: function (opt_deep) {
            var clones = [];

            this.for(function (el, i) {
                clones[i] = cloneElement(el, opt_deep);
            });

            return toDom(clones);
        },

        /**
         * Clean.
         * @param  {Bool} opt_self?
         * @return {this}
         */
        clean: function (opt_self) {
            return this.for(function (el) {
                cleanElement(el, opt_self);
            });
        },

        /**
         * Empty.
         * @return {this}
         */
        empty: function () {
            return this.clean(FALSE);
        },

        /**
         * Remove all.
         * @param  {String} selector?
         * @return {this}
         */
        remove: function (selector) {
            var _this = this;

            if (!selector) { // self remove
                return _this.for(function (el) {
                    cleanElement(el);
                    if (el[NAME_PARENT_NODE]) {
                        removeChild(el[NAME_PARENT_NODE], el);
                    }
                });
            }

            if (_this[0]) {
                _this.$$(selector).for(function (el, parent) {
                    parent = el[NAME_PARENT_NODE];
                    if (parent && parent == _this[0]) {
                        removeChild(_this[0], cleanElement(el));
                    }
                });
            }

            return _this;
        },

        /**
         * Append.
         * @param  {String|Object|this} content
         * @param  {String|Object}      opt_content?
         * @param  {Object}             opt_attributes?
         * @param  {Bool}               opt_clone?
         * @return {this}
         */
        append: function (content, opt_content, opt_attributes, opt_clone) {
            // eg: ("a", "Click!", {...attributes}) or ("<a>Click!</a>", {...attributes})
            if ($isString(opt_content) || $isObject(opt_content)) {
                content = $isString(opt_content)
                    ? $extend(toTagContent(content, opt_content), opt_attributes)
                    : $extend(toTagContent(content), opt_content)
            }

            return this.for(function (el) {
                createFor(el, content, opt_attributes).each(function (_el) {
                    appendChild(el, cloneIf(opt_clone, _el));
                });
            });
        },

        /**
         * Append to.
         * @param  {String} selector
         * @param  {Bool}   opt_clone?
         * @return {this}
         */
        appendTo: function (selector, opt_clone) {
            if (!isDom(selector)) {
                selector = toDom(selector);
            }

            return this.for(function (el) {
                selector.for(function (_el) {
                    appendChild(_el, cloneIf(opt_clone, el));
                });
            });
        },

        /**
         * Prepend.
         * @param  {String|Object|this} content
         * @param  {String|Object}      opt_content?
         * @param  {Object}             opt_attributes?
         * @param  {Bool}               opt_clone?
         * @return {this}
         */
        prepend: function (content, opt_content, opt_attributes, opt_clone) {
            if ($isString(opt_content) || $isObject(opt_content)) {
                content = $isString(opt_content)
                    ? $extend(toTagContent(content, opt_content), opt_attributes)
                    : $extend(toTagContent(content), opt_content)
            }

            return this.for(function (el) {
                createFor(el, content, opt_attributes).each(function (_el) {
                    insertBefore(el, cloneIf(opt_clone, _el), el[NAME_FIRST_CHILD]);
                });
            });
        },

        /**
         * Prepend to.
         * @param  {String} selector
         * @param  {Bool}   opt_clone?
         * @return {this}
         */
        prependTo: function (selector, opt_clone) {
            if (!isDom(selector)) {
                selector = toDom(selector);
            }

            return this.for(function (el) {
                selector.for(function (_el) {
                    insertBefore(_el, cloneIf(opt_clone, el), _el[NAME_FIRST_CHILD]);
                });
            });
        },

        /**
         * Insert (alias of append()).
         */
        insert: function () {
            return this.append.apply(this, arguments);
        },

        /**
         * Insert to (alias of appendTo()).
         */
        insertTo: function () {
            return this.appendTo.apply(this, arguments);
        },

        /**
         * Insert after.
         * @param  {String} selector
         * @param  {Bool}   opt_clone?
         * @return {this}
         */
        insertAfter: function (selector, opt_clone) {
            if (!isDom(selector)) {
                selector = toDom(selector);
            }

            return this.for(function (el) {
                selector.for(function (_el) {
                    insertBefore(_el[NAME_PARENT_NODE], cloneIf(opt_clone, el), _el.nextSibling)
                });
            });
        },

        /**
         * Insert before.
         * @param  {String} selector
         * @param  {Bool}   opt_clone?
         * @return {this}
         */
        insertBefore: function (selector, opt_clone) {
            if (!isDom(selector)) {
                selector = toDom(selector);
            }

            return this.for(function (el) {
                selector.for(function (_el) {
                    insertBefore(_el[NAME_PARENT_NODE], cloneIf(opt_clone, el), _el);
                });
            });
        },

        /**
         * Replace.
         * @param  {String|Object|this} content
         * @param  {String|Object}      opt_content?
         * @param  {Object}             opt_attributes?
         * @param  {Bool}               opt_clone?
         * @return {this}
         */
        replace: function (content, opt_content, opt_attributes, opt_clone) {
            return this.clean().replaceWith(
                $(_soTempTag).append(content, opt_content, opt_attributes, opt_clone).children()
            );
        },

        /**
         * Replace content.
         * @param  {String|Object|this} content
         * @param  {String|Object}      opt_content?
         * @param  {Object}             opt_attributes?
         * @param  {Bool}               opt_clone?
         * @return {this}
         */
        replaceContent: function (content, opt_content, opt_attributes, opt_clone) {
            return this.clean().append(content, opt_content, opt_attributes, opt_clone);
        },

        /**
         * Replace with.
         * @param  {String|Node} selector
         * @param  {Bool}        opt_clone?
         * @param  {Bool}        opt_cloneSpecials?
         * @return {this}
         */
        replaceWith: function (selector, opt_clone, opt_cloneSpecials) {
            if (!isDom(selector)) {
                selector = toDom(selector);
            }

            var _this = this; return _this.for(function (el, i) {
                selector.for(function (_el) {
                    _el = _this[i] = cloneIf(opt_clone, _el);
                    if (opt_cloneSpecials) { // clone special properties
                        cloneSpecials(el, _el, TRUE);
                    }
                    replaceChild(el[NAME_PARENT_NODE], _el, el);
                });
            });
        },

        /**
         * Replace with clone.
         * @return {this}
         */
        replaceWithClone: function () {
            // 'cos im sick and tired of trying to hide mobile tab focuses..
            var _this = this; return _this.for(function (el, i) {
                replaceChild(el[NAME_PARENT_NODE], _this[i] = cloneElement(el), el);
            });
        },

        /**
         * Wrap.
         * @param  {String|Object|this} content
         * @param  {Object}             opt_attributes?
         * @return {Dom}
         */
        wrap: function (content, opt_attributes) {
            var el = this[0], elParent = el && el[NAME_PARENT_NODE];
            var clone, clones = [];
            var wrapper, replace;

            if (elParent) {
                wrapper = createFor(el, content, opt_attributes)[0];
                replace = createFor(elParent, _soTempTag, {style: 'display:none'})[0];
                insertBefore(elParent, replace, el);
                this.for(function (el) {
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
         * @return {Dom}
         */
        unwrap: function (opt_remove) {
            var el = this[0], elParent = el && el[NAME_PARENT_NODE],
                elParentParent = elParent && elParent[NAME_PARENT_NODE];
            var clone, clones = [];

            if (elParentParent) {
                this.for(function (el) {
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
         * @return {Any|this}
         */
        property: function (name, value) {
            return $isDefined(value) ? this.setProperty(name, value)
                                     : this.getProperty(name);
        },

        /**
         * Properties (alias of getProperties()).
         */
        properties: function (names) {
            return this.getProperties(names);
        },

        /**
         * Has property.
         * @param  {String} name
         * @return {Bool}
         */
        hasProperty: function (name) {
            return $bool(this[0] && (name in this[0]));
        },

        /**
         * Set property.
         * @param  {String} name
         * @param  {Any}    value
         * @return {this}
         */
        setProperty: function (name, value) {
            var properties = toKeyValue(name, value);

            return this.for(function (el) {
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
        getProperty: function (name) {
            return __(this, name);
        },

        /**
         * Get property.
         * @param  {String} names?
         * @return {Object}
         */
        getProperties: function (names) {
            var el = this[0], ret = {}, name;

            if (el) {
                names = split(names, re_comma);
                if (!names.len()) {
                    for (name in el) {
                        names.push(name);
                    }
                }

                $each(names, function (name) {
                    ret[name] = el[name];
                });
            }

            return ret;
        },

        /**
         * Set (alias of setProperty()).
         */
        set: function (name, value) {
            return this.property(name, value);
        },

        /**
         * Get (alias of getProperty()).
         */
        get: function (name) {
            return this.property(name);
        }
    });

    // dom: contents
    toDomPrototype(Dom, {
        /**
         * Text.
         * @param  {String} input?
         * @return {String|this}
         */
        text: function (input) {
            return $isDefined(input) ? this.setText(input)
                                     : this.getText();
        },

        /**
         * Set text.
         * @param  {String} input
         * @return {this}
         */
        setText: function (input) {
            return this.for(function (el) {
                el[NAME_TEXT_CONTENT] = input;
            });
        },

        /**
         * Get text.
         * @return {String}
         */
        getText: function () {
            return __(this, NAME_TEXT_CONTENT);
        },

        /**
         * Html.
         * @param  {String|Bool} input?
         * @return {String|Any}
         */
        html: function (input) {
            return $isUndefined(input) || $isTrue(input)
                 ? this.getHtml(input) : this.setHtml(input);
        },

        /**
         * Set html
         * @param  {String} input
         * @return {this}
         */
        setHtml: function (input) {
            return this.for(function (el) {
                el[NAME_INNER_HTML] = input;
            });
        },

        /**
         * Get html.
         * @param  {Bool} opt_outer?
         * @return {String}
         */
        getHtml: function (opt_outer) {
            return opt_outer ? __(this, NAME_OUTER_HTML) : __(this, NAME_INNER_HTML);
        },

        /**
         * Is empty.
         * @param  {Bool} opt_trim?
         * @return {Bool}
         */
        isEmpty: function (opt_trim) {
            var _this = this, content;

            switch (_this.tag()) {
                case 'input':
                case 'select':
                case 'textarea':
                    content = _this.value();
                    break;
                case TAG_WINDOW:
                case TAG_DOCUMENT:
                    content = 1; // ok
                    break;
                default:
                    content = _this.html();
            }

            return $isNulls(opt_trim ? $trim(content) : content);
        },
    });

    // array intersect helpers
    function intersect(a, b, opt_found) {
        var tmp, i;
        tmp = (b.len() > a.len()) ? (tmp = b, b = a, a = tmp) : NULL; // loop over shortest

        return a.filter(function (search) {
            return (i = b.indexOf(search)), opt_found ? i > -1 : i < 0;
        });
    }
    function noIntersect(el, els) {
        return els.filter(function (_el) { return _el != el; });
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
        return ((selector = $trim(selector)) && (selector[0] != '>'))
             ? '>'+ selector : selector;
    }

    // dom: walkers
    toDomPrototype(Dom, {
        /**
         * Not.
         * @param  {String|Node|Int ...arguments} selector
         * @param  {Bool} opt_useParent?
         * @return {Dom}
         */
        not: function (selector, opt_useParent) {
            var _this = this, ret = [], args;

            if ($isString(selector)) {
                // eg: $.dom("p").not(".red")
                ret = intersect(_this.all(), $isFalse(opt_useParent) // @default=true
                    ? toDom(selector).all()
                    : _this.parent().$$(toAllSelector(selector)).all()
                );
            } else if (isDom(selector)) {
                // eg: $.dom("p").not($element)
                ret = intersect(_this.all(), selector.all());
            } else if (isElementNode(selector)) {
                // eg: $.dom("p").not(element)
                ret = noIntersect(selector, _this);
            } else {
                // eg: $.dom("p").not(1) or $.dom("p").not(1,2,3)
                args = $array(arguments), ret = _this.filter(function (el, i) {
                    if (!args.has(i + 1)) {
                        return el;
                    }
                });
            }

            return toDom(ret);
        },

        /**
         * Parent.
         * @return {Dom}
         */
        parent: function () {
            return toDom(__(this, NAME_PARENT_NODE));
        },

        /**
         * Parents.
         * @return {Dom}
         */
        parents: function () {
            return toDom(walk(this[0], NAME_PARENT_NODE));
        },

        /**
         * Siblings.
         * @param  {Int|String} selector?
         * @return {Dom}
         */
        siblings: function (selector) {
            var el = this[0], ret;

            if (el) {
                ret = noIntersect(el, walk(el[NAME_PARENT_NODE], NAME_CHILDREN));
                if (ret.len() && (selector = toAllSelector(selector))) {
                    ret = intersect(ret, noIntersect(
                        el, toDom(el[NAME_PARENT_NODE]).$$(selector).all()
                    ), TRUE);
                }
            }

            return toDom(ret);
        },

        /**
         * Children.
         * @return {Dom}
         */
        children: function () {
            return toDom($array(__(this, NAME_CHILDREN)));
        },

        /**
         * First child.
         * @return {Dom|this}
         */
        firstChild: function () {
            return this.$('> :first');
        },

        /**
         * Last child.
         * @return {Dom|this}
         */
        lastChild: function () {
            return this.$('> :last');
        },

        /**
         * Nth child.
         * @param  {Int} i
         * @return {Dom|this}
         */
        nthChild: function (i) {
            return this.$('> :nth('+ i +')');
        },

        /**
         * Comments.
         * @return {Dom}
         */
        comments: function () {
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
         * @return {Dom}
         */
        prev: function () {
            return toDom(__(this, NAME_PREVIOUS_ELEMENT_SIBLING));
        },

        /**
         * Prev all.
         * @param  {String} selector?
         * @return {Dom}
         */
        prevAll: function (selector) {
            var el = this[0], ret = [];

            if (el) {
                ret = walk(el, NAME_PREVIOUS_ELEMENT_SIBLING).reverse();
                if (ret.len() && (selector = toAllSelector(selector))) {
                    ret = intersect(
                        ret, toDom(el[NAME_PARENT_NODE]).$$(selector).all()
                    , TRUE);
                }
            }

            return toDom(ret);
        },

        /**
         * Next.
         * @return {Dom}
         */
        next: function () {
            return toDom(__(this, NAME_NEXT_ELEMENT_SIBLING));
        },

        /**
         * Next all.
         * @param  {String} selector?
         * @return {Dom}
         */
        nextAll: function (selector) {
            var el = this[0], ret = [];

            if (el) {
                ret = walk(el, NAME_NEXT_ELEMENT_SIBLING);
                if (ret.len() && (selector = toAllSelector(selector))) {
                    ret = intersect(
                        ret, toDom(el[NAME_PARENT_NODE]).$$(selector).all()
                    , TRUE);
                }
            }

            return toDom(ret);
        },

        /**
         * Equals.
         * @param  {String|Node} selector
         * @return {Bool}
         */
        equals: function (selector, el /* @internal */) {
            return $bool((el = this[0]) && (el == selector || el == toDom(selector)[0]));
        },

        /**
         * Matches.
         * @param  {String|Node} selector
         * @return {Bool}
         */
        matches: function (selector, el /* @internal */) {
            return $bool((el = this[0]) && toDom(selector).has(el));
        },

        /**
         * Contains.
         * @param  {String|Node} selector
         * @return {Bool}
         */
        contains: function (selector, el /* @internal */) {
            return $bool((el = this[0]) && toDom(selector, el).len());
        },

        /**
         * Has.
         * @param  {String|Node} selector
         * @return {Bool}
         */
        has: function (selector) {
            if ($isString(selector)) {
                selector = toDom(selector)[0];
            }

            return $bool(selector && this.all().has(selector));
        },

        /**
         * Has parent.
         * @return {Bool}
         */
        hasParent: function () {
            return this.parent().len() > 0;
        },

        /**
         * Has parents.
         * @return {Bool}
         */
        hasParents: function () {
            return this.parent().parent().len() > 1;
        },

        /**
         * Has child.
         * @return {Bool}
         */
        hasChild: function () {
            return this.children().len() > 0;
        },

        /**
         * Has children.
         * @return {Bool}
         */
        hasChildren: function () {
            return this.children().len() > 1;
        },

        /**
         * Has content.
         * @return {Bool}
         */
        hasContent: function () {
            return !this.isEmpty(TRUE);
        }
    });

    // dom: window & document
    toDomPrototype(Dom, {
        /**
         * Get window.
         * @param  {Bool} opt_contentOf?
         * @return {Dom}
         */
        getWindow: function (opt_contentOf, el /* @internal */) {
            return toDom((el = this[0]) && (opt_contentOf ? el.contentWindow : $getWindow(el)));
        },

        /**
         * Get document.
         * @param  {Bool} opt_contentOf?
         * @return {Dom}
         */
        getDocument: function (opt_contentOf, el /* @internal */) {
            return toDom((el = this[0]) && (opt_contentOf ? el.contentDocument : $getDocument(el)));
        },

        /**
         * Is window.
         * @return {Bool}
         */
        isWindow: function () {
            return $isWindow(this[0]);
        },

        /**
         * Is document.
         * @return {Bool}
         */
        isDocument: function () {
            return $isDocument(this[0]);
        }
    });

    function getSimilarElements(el, tag) {
        return walk(el[NAME_PARENT_ELEMENT], NAME_CHILDREN)
                .filter(function (el) { return tag == getTag(el); });
    }

    // dom: paths
    toDomPrototype(Dom, {
        /**
         * Path.
         * @param  {Bool} opt_join?
         * @return {Array|String|undefined}
         */
        path: function (opt_join) {
            var el = this[0], tag, sims, ret = [], s;

            if (isElementNode(el)) {
                while (el) {
                    s = tag = getTag(el), sims = getSimilarElements(el, tag);

                    if (el[NAME_ID])         s += '#'+ el[NAME_ID];
                    if (el[NAME_CLASS_NAME]) s += '.'+ el[NAME_CLASS_NAME].replace(re_space, '.');

                    ret.push(
                        (sims.len() > 1 && !test(s, /[#.]/)) // if no id or class
                            ? s +':nth-child('+ (sims.index(el) + 1) +')' : s
                    );

                    el = el[NAME_PARENT_ELEMENT]; // next up.
                }

                return (ret = ret.reverse()),
                    !opt_join ? ret : ret.join(' > ');
            }
        },

        /**
         * Xpath.
         * @param  {Bool} opt_join?
         * @return {Array|String|undefined}
         */
        xpath: function (opt_join) {
            var el = this[0], tag, sims, ret = [];

            if (isElementNode(el)) {
                while (el) {
                    tag = getTag(el), sims = getSimilarElements(el, tag);

                    ret.push(
                        (sims.len() > 1)
                            ? tag +'['+ (sims.index(el) + 1) +']' : tag
                    );

                    el = el[NAME_PARENT_ELEMENT]; // next up.
                }

                return (ret = ret.reverse()),
                    !opt_join ? ret : '/'+ ret.join('/');
            }
        }
    });

    var re_rgb = /rgb/i;
    var re_unit = /(?:px|em|%)/i; // short & quick
    var re_unitMore = /(?:ex|in|[cm]m|p[tc]|v[hw]?min)/i;
    var re_unitClean = /(-?\d*\.?\d+).*/g
    var re_nonUnitStyles = /(?:(?:fill-?)?opacity|z(?:oom|index)|(?:font-?w|line-?h)eight|column(?:-?count|s))/i;
    var re_colon = /\s*:\s*/;
    var re_scolon = /\s*;\s*/;
    var matchesSelector = $doc[NAME_DOCUMENT_ELEMENT].matches || function (selector) {
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

        $for(sheets, function (sheet) {
            rules = sheet.rules || sheet.cssRules;
            $for(rules, function (rule) {
                if (matchesSelector.call(el, rule.selectorText)) {
                    ret.push(rule[NAME_STYLE]); // loop over all until last
                }
            });
        });

        return $.filter(ret[ret.len() - 1] || {}); // last rule or an empty map
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

        if (value && $isNumeric(value) && !test(name, re_nonUnitStyles)) { // fix pixels
            value += 'px';
        }

        el[NAME_STYLE][name] = value;
    }

    function getStyle(el, name) {
        return !name ? getComputedStyle(el)
                     : getComputedStyle(el)[$toStyleName(name)] || '';
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

    function cleanStyleValue(value) {
        return $string(value).replace(re_unitClean, '$1');
    }

    function sumStyleValues(el, style) {
        var i = 2, args = arguments, ret = 0, style = style || getStyle(el), name;

        while (name = args[i++]) {
            ret += $float(cleanStyleValue(style[name]));
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
         * @param  {String}                    name
         * @param  {String|Number|Object|Bool} value? (true=opt_convert?)
         * @return {String}
         */
        style: function (name, value) {
            return $isNull(name) || $isNulls(name)
                 ? this.removeAttr(NAME_STYLE) : $isNull(value) || $isNulls(value)
                 ? this.removeStyle(name) : $isString(value) || $isNumber(value) || $isObject(name)
                     || (name && name.has(':')) /* eg: 'color:red' */
                 ? this.setStyle(name, value) : this.getStyle(name, value /* or opt_convert */);
        },

        /**
         * Has style.
         * @param  {String} name
         * @return {Bool}
         */
        hasStyle: function (name, el /* @internal */) {
            return $bool((el = this[0]) && (
                el[NAME_STYLE] && el[NAME_STYLE][NAME_CSS_TEXT].has(
                    $re('[^-]'+ name + ':') /* eg: 'color:red', not 'border-color:red' */
                )
            ));
        },

        /**
         * Set style.
         * @param  {String|Object} name
         * @param  {String}        value?
         * @return {this}
         */
        setStyle: function (name, value) {
            var styles = name;

            if ($isString(styles)) {
                styles = !$isVoid(value) ? toKeyValue(name, value)
                                         : parseStyleText(name);
            }

            return this.for(function (el) {
                $forEach(styles, function (name, value) {
                    setStyle(el, name, value);
                });
            });
        },

        /**
         * Get style.
         * @param  {String} name
         * @param  {Bool}   opt_convert? @default=true
         * @return {String|null|undefined}
         */
        getStyle: function (name, opt_convert) {
            var el = this[0], value, opt_convert;

            if (el) {
                value = getStyle(el, name);
                if ($isNulls(value)) {
                    value = NULL;
                } else {
                    value = $isFalse(opt_convert) ? value : (
                        test(value, re_rgb) ? $util.parseRgb(value, TRUE) // make rgb - hex
                            : test(value, re_unit) || test(value, re_unitMore) // make px etc. - float
                                // || test(name, re_nonUnitStyles) // make opacity etc. - float
                            ? $float(cleanStyleValue(value)) : value
                    );
                }
            }

            return value;
        },

        /**
         * Remove style.
         * @param  {String} name
         * @return {this}
         */
        removeStyle: function (name) {
            var _this = this;

            if (name == '*') { // all
                _this.attr(NAME_STYLE, '');
            } else {
                name = split(name, re_comma);
                _this.for(function (el) {
                    $each(name, function (name) {
                        setStyle(el, name, '');
                    });
                });
            }

            return _this;
        },

        /**
         * Get styles.
         * @param  {String} name
         * @param  {Bool}  opt_convert? @default=true
         * @return {Object}
         */
        getStyles: function (names, opt_convert) {
            var el = this[0], ret = {};

            if (el) {
                if (names) {
                    el = toDom(el);
                    split(names, re_comma).each(function (name) {
                        ret[name] = el.getStyle(name, opt_convert);
                    });
                } else {
                    ret = toStyleObject(getStyle(el));
                }
            }

            return ret;
        },

        /**
         * Get css (original) styles.
         * @param  {String} names?
         * @return {Object}
         */
        getCssStyles: function (names) {
            var el = this[0], ret = {};

            if (el) {
                ret = toStyleObject(getCssStyle(el));
                if (names) {
                    ret = split(names, re_comma).reduce(function (_ret, name) {
                        return _ret[name] = ret[name], _ret;
                    }, {});
                }
            }

            return ret;
        },

        /**
         * Get inlined (attributed) styles.
         * @param  {String} names?
         * @return {Object}
         */
        getInlinedStyles: function (names) {
            var el = this[0], ret = {};

            if (el) {
                ret = parseStyleText(el[NAME_STYLE][NAME_CSS_TEXT]);
                if (names) {
                    ret = split(names, re_comma).reduce(function (_ret, name) {
                        return _ret[name] = ret[name], _ret;
                    }, {});
                }
            }

            return ret;
        },

        /**
         * Get computed (rendered) styles.
         * @param  {String} names?
         * @return {Object}
         */
        getComputedStyles: function (names) {
            var el = this[0], ret = {};

            if (el) {
                ret = toStyleObject(getComputedStyle(el));
                if (names) {
                    ret = split(names, re_comma).reduce(function (_ret, name, value) {
                        value = ret[name];
                        if ($isUndefined(value)) { // camel-cased name (eg: 'font-size')
                            value = ret[$toStyleName(name)];
                            if ($isUndefined(value)) { // try css text (eg: '-webkit-box-flex')
                                value = ret.cssText.grep($re(name +'\\s*([^;]+)'));
                            }
                        }
                        return _ret[name] = (value == UNDEFINED) ? UNDEFINED : value // normalize
                             , _ret;
                    }, {});
                }
            }

            return ret;
        }
    });

    // dimension, offset, scroll etc. helpers
    function isVisible(el) {
        return $bool(el && (el[NAME_OFFSET_WIDTH] || el[NAME_OFFSET_HEIGHT]));
    }

    function isVisibleParent(el) {
        var parent = el && el[NAME_PARENT_ELEMENT];
        while (parent) {
            if (isVisible(parent)) return TRUE;
            parent = parent[NAME_PARENT_ELEMENT];
        }
        return FALSE;
    }

    function getInvisibleElementProperties(el, properties) {
        var ret = [];
        var doc = $getDocument(el), body = doc[TAG_BODY];
        var uid = $uid(), uidClass = (' '+ uid);
        var style, styleText = el[NAME_STYLE][NAME_CSS_TEXT];
        var parent = el[NAME_PARENT_ELEMENT], parents = [];

        while (parent) { // doesn't give the properties if parents are invisible
            if (!isVisible(parent)) {
                parents.push({el: parent, styleText: parent[NAME_STYLE][NAME_CSS_TEXT]});

                parent[NAME_CLASS_NAME] += uidClass;
                parent[NAME_STYLE][NAME_DISPLAY] = '';
                parent[NAME_STYLE][NAME_VISIBILITY] = ''; // for !important annots
            }
            parent = parent[NAME_PARENT_ELEMENT];
        }

        // temporary style element
        style = createElement(doc, NAME_STYLE, {
            textContent: '.'+ uid +'{display:block!important;visibility:hidden!important}'
        });
        appendChild(body, style);

        el[NAME_CLASS_NAME] += uidClass;
        el[NAME_STYLE][NAME_DISPLAY] = '';
        el[NAME_STYLE][NAME_VISIBILITY] = ''; // for !important annots

        // finally, grap it!
        $each(properties, function (name) {
            var value = el[name];
            if (value.call) { // getBoundingClientRect() etc.
                value = value.call(el);
            }
            ret.push(value);
        });

        // restore all
        removeChild(body, style);
        el[NAME_CLASS_NAME] = el[NAME_CLASS_NAME].remove(uidClass);
        if (styleText) {
            el[NAME_STYLE][NAME_CSS_TEXT] = styleText;
        }

        while (parent = parents.shift()) {
            parent.el[NAME_CLASS_NAME] = parent.el[NAME_CLASS_NAME].remove(uidClass);
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

        if (isElementNode(el)) {
            if (!isVisible(el) || !isVisibleParent(el)) {
                properties = getInvisibleElementProperties(el, [NAME_OFFSET_WIDTH, NAME_OFFSET_HEIGHT]);
                ret[NAME_WIDTH] = properties[0];
                ret[NAME_HEIGHT] = properties[1];
            } else {
                ret[NAME_WIDTH] = el[NAME_OFFSET_WIDTH];
                ret[NAME_HEIGHT] = el[NAME_OFFSET_HEIGHT];
            }
        } else if (isRoot(el)) {
            win = $getWindow(el);
            ret[NAME_WIDTH] = win[NAME_INNER_WIDTH];
            ret[NAME_HEIGHT] = win[NAME_INNER_HEIGHT];
        }

        return ret;
    }

    function getDimensionsBy(el, by, margins) {
        var dim = getDimensions(el);
        var ret = $extend(dim, {
            innerWidth: dim[NAME_WIDTH], outerWidth: dim[NAME_WIDTH],
            innerHeight: dim[NAME_HEIGHT], outerHeight: dim[NAME_HEIGHT]
        });
        var style;

        // performance issue: all "if (by) return .." below mean no more calculation needed.
        if (isElementNode(el)) {
            style = getStyle(el);

            if (!by || by == NAME_WIDTH) {
                if (dim[NAME_WIDTH]) {
                    ret[NAME_WIDTH] -= sumStyleValues(NULL, style, NAME_PADDING_LEFT, NAME_PADDING_RIGHT)
                                     + sumStyleValues(NULL, style, NAME_BORDER_LEFT_WIDTH, NAME_BORDER_RIGHT_WIDTH);
                }
                if (by) return ret[by];
            }
            if (!by || by == NAME_INNER_WIDTH) {
                if (dim[NAME_WIDTH]) {
                    ret[NAME_INNER_WIDTH] -= sumStyleValues(NULL, style, NAME_BORDER_LEFT_WIDTH, NAME_BORDER_RIGHT_WIDTH);
                }
                if (by) return ret[by];
            }
            if (!by || by == NAME_OUTER_WIDTH) {
                if (dim[NAME_WIDTH] && margins) {
                    ret[NAME_OUTER_WIDTH] += sumStyleValues(NULL, style, NAME_MARGIN_LEFT, NAME_MARGIN_RIGHT);
                }
                if (by) return ret[by];
            }

            if (!by || by == NAME_HEIGHT) {
                if (dim[NAME_HEIGHT]) {
                    ret[NAME_HEIGHT] -= sumStyleValues(NULL, style, NAME_PADDING_TOP, NAME_PADDING_BOTTOM)
                                      + sumStyleValues(NULL, style, NAME_BORDER_TOP_WIDTH, NAME_BORDER_BOTTOM_WIDTH);
                }
                if (by) return ret[by];
            }
            if (!by || by == NAME_INNER_HEIGHT) {
                if (dim[NAME_HEIGHT]) {
                    ret[NAME_INNER_HEIGHT] -= sumStyleValues(NULL, style, NAME_BORDER_TOP_WIDTH, NAME_BORDER_BOTTOM_WIDTH);
                }
                if (by) return ret[by];
            }
            if (!by || by == NAME_OUTER_HEIGHT) {
                if (dim[NAME_HEIGHT] && margins) {
                    ret[NAME_OUTER_HEIGHT] += sumStyleValues(NULL, style, NAME_MARGIN_TOP, NAME_MARGIN_BOTTOM);
                }
                if (by) return ret[by];
            }
        }

        return by ? ret[by] : ret; // all
    }

    function getOffset(el, opt_relative) {
        var ret = {top: 0, left: 0};
        var properties, body, parentOffset;

        if (isElementNode(el)) {
            if (!isVisible(el) || !isVisibleParent(el)) {
                properties = getInvisibleElementProperties(el, [NAME_OFFSET_TOP, NAME_OFFSET_LEFT]);
                ret[NAME_TOP] = properties[0];
                ret[NAME_LEFT] = properties[1];
            } else {
                ret[NAME_TOP] = el[NAME_OFFSET_TOP];
                ret[NAME_LEFT] = el[NAME_OFFSET_LEFT];
            }

            body = $getDocument(el)[TAG_BODY];
            ret[NAME_TOP] += body[NAME_SCROLL_TOP];
            ret[NAME_LEFT] += body[NAME_SCROLL_LEFT];
            if (opt_relative) {
                parentOffset = getOffset(el[NAME_PARENT_ELEMENT], opt_relative);
                ret[NAME_TOP] += parentOffset[NAME_TOP], ret[NAME_LEFT] += parentOffset[NAME_LEFT];
            }
        }

        return ret;
    }

    function getScroll(el) {
        var ret = {top: 0, left: 0};
        var win;

        if (isElementNode(el)) {
            ret[NAME_TOP] = el[NAME_SCROLL_TOP];
            ret[NAME_LEFT] = el[NAME_SCROLL_LEFT];
        } else if (isRoot(el) || isRootElement(el)) {
            win = $getWindow(el);
            ret[NAME_TOP] = win.pageYOffset;
            ret[NAME_LEFT] = win.pageXOffset;
        }

        return ret;
    }

    // dom: dimensions & width & height
    toDomPrototype(Dom, {
        /**
         * Dims.
         * @return {Object}
         */
        dims: function () {
            return getDimensions(this[0]);
        },

        /**
         * Width.
         * @return {Int}
         */
        width: function () {
            return getDimensionsBy(this[0], NAME_WIDTH);
        },

        /**
         * Inner width.
         * @return {Int}
         */
        innerWidth: function () {
            return getDimensionsBy(this[0], NAME_INNER_WIDTH);
        },

        /**
         * Outer width.
         * @param  {Bool} opt_margins?
         * @return {Int}
         */
        outerWidth: function (opt_margins) {
            return getDimensionsBy(this[0], NAME_OUTER_WIDTH, opt_margins);
        },

        /**
         * Height.
         * @return {Int}
         */
        height: function () {
            return getDimensionsBy(this[0], NAME_HEIGHT);
        },

        /**
         * Outer height.
         * @return {Int}
         */
        innerHeight: function () {
            return getDimensionsBy(this[0], NAME_INNER_HEIGHT);
        },

        /**
         * Outer height.
         * @param  {Bool} opt_margins?
         * @return {Int}
         */
        outerHeight: function (opt_margins) {
            return getDimensionsBy(this[0], NAME_OUTER_HEIGHT, opt_margins);
        }
    });

    // dom: offset & scroll & box & visibility
    toDomPrototype(Dom, {
        /**
         * Offset.
         * @param  {Bool} opt_relative?
         * @return {Object}
         */
        offset: function (opt_relative) {
            return getOffset(this[0], opt_relative);
        },

        /**
         * Scroll.
         * @return {Object}
         */
        scroll: function () {
            return getScroll(this[0]);
        },

        /**
         * Box.
         * @return {Object}
         */
        box: function () {
            var el = this[0], ret = {};

            if (el) {
                var style = getStyle(el);
                var borderXSize = sumStyleValues(NULL, style, NAME_BORDER_LEFT_WIDTH, NAME_BORDER_RIGHT_WIDTH);
                var borderYSize = sumStyleValues(NULL, style, NAME_BORDER_TOP_WIDTH, NAME_BORDER_BOTTOM_WIDTH);
                var marginXSize = sumStyleValues(NULL, style, NAME_MARGIN_LEFT, NAME_MARGIN_RIGHT);
                var marginYSize = sumStyleValues(NULL, style, NAME_MARGIN_TOP, NAME_MARGIN_BOTTOM);
                var dim = getDimensionsBy(el), dimParent = getDimensions(el[NAME_PARENT_ELEMENT]);
                var offset = getOffset(el), scroll = getScroll(el);

                ret = dim;
                // add width, height
                ret.outerWidthMargined = dim[NAME_WIDTH] + marginXSize;
                ret.outerHeightMargined = dim[NAME_HEIGHT] + marginYSize;
                // add offset
                ret.offset = offset;
                ret.offset.right = ret.offset.x = (
                    dimParent[NAME_WIDTH] - borderXSize - (offset[NAME_LEFT] + dim[NAME_OUTER_WIDTH])
                );
                ret.offset.bottom = ret.offset.y = (
                    dimParent[NAME_HEIGHT] - borderYSize - (offset[NAME_TOP] + dim[NAME_OUTER_HEIGHT])
                );
                // add scroll
                ret.scroll = scroll;
                ret.scroll.x = scroll[NAME_LEFT];
                ret.scroll.y = scroll[NAME_TOP];
            }

            return ret;
        },

        /**
         * Visible.
         * @return {Bool}
         */
        visible: function () {
            return isVisible(this[0]);
        }
    });

    var re_attrState = /^(?:(?:check|select|disabl)ed|readonly|hidden)$/i;

    // attr helpers
    function hasAttr(el, name) {
        return $bool(el && el.hasAttribute && el.hasAttribute(name));
    }
    function setAttr(el, name, value, opt_state /* @internal */) {
        if (isElementNode(el)) {
            if (name == NAME_VALUE) {
                el[NAME_VALUE] = value;
            } else if (name == NAME_TEXT && getTag(el) == 'option') {
                el[NAME_TEXT] = value;
            } else {
                opt_state = (opt_state !== FALSE) // some speed..
                    && (opt_state || test(name, re_attrState));

                if (opt_state) { // set an empty attribute for states
                    value = value ? '' : NULL;
                }

                $isNull(value) ? removeAttr(el, name)
                               : el.setAttribute(name, value);

                if (opt_state) { // set element property state
                    el[name] = hasAttr(el, name);
                }
            }
        }
    }
    function getAttr(el, name) {
        return hasAttr(el, name) ? el.getAttribute(name) : UNDEFINED;
    }
    function getAttrs(el, opt_namesOnly, _ret) {
        if (isElementNode(el)) {
            _ret = $array(el.attributes);
            if (opt_namesOnly) {
                _ret = _ret.map(function (attr) { return attr[NAME_NAME] });
            }
            return _ret;
        }
    }
    function removeAttr(el, name) {
        if (isElementNode(el)) {
            el.removeAttribute(name);
        }
    }

    function toDataAttrName(name) {
        return 'data-'+ $toStyleName(name, TRUE);
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
        attr: function (name, value) {
            return $isObject(name) || $isDefined(value) || $isNull(value)
                 ? this.setAttr(name, value) : this.getAttr(name);
        },

        /**
         * Attrs (set/get all).
         * @param  {String} names?
         * @param  {Null}   opt_remove?
         * @return {Object}
         */
        attrs: function (names, opt_remove) {
            var _this = this, ret = {};

            getAttrs(_this[0]).each(function (attr) {
                ret[attr[NAME_NAME]] = test(attr[NAME_NAME], re_attrState)
                    ? attr[NAME_NAME] : attr[NAME_VALUE];
            });

            if (names) {
                if ($isString(names) && $isNull(opt_remove)) { // null=remove
                    names = (names == '*') ? $.keys(ret) // all
                          : split(names, re_comma);

                    $for(_this, function (el) {
                        $for(names, function (name) {
                            removeAttr(el, name)
                        });
                    });

                    return _this;
                } else if ($isObject(names)) { // object=set
                    $forEach(names, function (name, value) {
                        $for(_this, function (el) {
                            setAttr(el, name, value);
                        });
                    });

                    return _this;
                }

                // select names only
                ret = split(names, re_comma).reduce(function (_ret, name) {
                    return _ret[name] = ret[name], _ret;
                }, {});
            }

            return ret;
        },

        /**
         * Attribute (alias of attr()).
         */
        attribute: function (name, value) {
            return this.attr(name, value);
        },

        /**
         * Attributes (alias of attrs()).
         */
        attributes: function () {
            return this.attrs();
        },

        /**
         * Has attr.
         * @param  {String} name
         * @return {Bool}
         */
        hasAttr: function (name) {
            return hasAttr(this[0], name);
        },

        /**
         * Set attr.
         * @param  {String} name
         * @param  {String} value?
         * @return {this}
         */
        setAttr: function (name, value) {
            var attributes = toKeyValue(name, value);

            return this.for(function (el) {
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
        getAttr: function (name) {
            return getAttr(this[0], name);
        },

        /**
         * Remve attr.
         * @param  {String} name
         * @return {this}
         */
        removeAttr: function (name) {
            name = split(name, re_comma);

            return this.for(function (el) {
                $each((name[0] == '*' ? getAttrs(el, TRUE) : name), function (name) {
                    removeAttr(el, name);
                });
            });
        },

        /**
         * Toggle attr.
         * @param  {String} name
         * @param  {String} value?
         * @return {this}
         */
        toggleAttr: function (name, value) {
            name = split(name, re_comma);

            return this.for(function (el) {
                $each(name, function (name) {
                    !hasAttr(el, name) ? setAttr(el, name, $isDefined(value) ? value : name)
                                       : removeAttr(el, name);
                });
            });
        },

        /**
         * Data attr (alias of attr() for "data-" attributes).
         */
        dataAttr: function (name, value) {
            if ($isString(name)) {
                name = toDataAttrName(name);
            } else if ($isObject(name)) {
                var tmp = {};
                $forEach(name, function (key, value) {
                    tmp[toDataAttrName(key)] = value;
                });
                name = tmp;
            }

            return this.attr(name, value);
        },

        /**
         * Set data attr.
         * @param {String|Object} name
         * @param {Any}           value
         */
        setDataAttr: function (name, value) {
            return this.dataAttr(name, value);
        },

        /**
         * Get data attr.
         * @param {String|Object} name
         */
        getDataAttr: function (name) {
            return this.dataAttr(name);
        },

        /**
         * Remove data attr.
         * @param  {String} name
         * @return {this}
         */
        removeDataAttr: function (name) {
            name = split(name, re_comma);

            return this.for(function (el) {
                if (name[0] == '*') { // all
                    name = getAttrs(el, TRUE).filter(function (name) {
                        return name.startsWith('data-');
                    });
                } else {
                    name = name.map(toDataAttrName);
                }

                $each(name, function (name) {
                    removeAttr(el, name);
                });
            });
        },

        /**
         * So id.
         * @param  {Bool|Int} opt_set?
         * @return {String|undefined|this}
         */
        soId: function (opt_set) {
            return !opt_set ? getAttr(this[0], _soAttrId) : this.for(function (el) {
                if (!getAttr(el, _soAttrId)) { // if not already set
                     setAttr(el, _soAttrId, $uid());
                }
            });
        },

        /**
         * So attr (so:* attributes).
         * @param  {String} name
         * @param  {String} value?
         * @return {String|this|undefined}
         */
        soAttr: function (name, value) {
            if (!$isObject(name) && !$isDefined(value)) {
                return this.attr(_soAttrPrefix + name); // get
            }

            var attrs = toKeyValue(name, value);
            $forEach(attrs, function (name, value) {
                attrs[_soAttrPrefix + name] = value;
                delete attrs[name];
            });

            return this.attr(attrs); // set
        }
    });

    // dom: values & options
    toDomPrototype(Dom, {
        /**
         * Value.
         * @param  {String} value?
         * @return {String|this|undefined}
         */
        value: function (value) {
            return $isDefined(value) ? this.setValue(value)
                                     : this.getValue();
        },

        /**
         * Set value.
         * @param  {String} value?
         * @return {this}
         */
        setValue: function (value) {
            value = $isNull(value) ? '' : (''+ value); // @important

            return this.for(function (el) {
                if (isSelectInput(el)) {
                    $for(el[NAME_OPTIONS], function (option) {
                        if (option[NAME_VALUE] === value) {
                            option[NAME_SELECTED] = TRUE;
                            setAttr(option, NAME_SELECTED, TRUE, TRUE);
                        }
                    });
                } else if (getTag(el) == 'textarea') {
                    el[NAME_VALUE] = el[NAME_TEXT_CONTENT] = value;
                } else {
                    setAttr(el, NAME_VALUE, value, FALSE);
                }
            });
        },

        /**
         * Get value.
         * @return {String|undefined}
         */
        getValue: function () {
            var el = this[0], value, option;

            if (el) {
                if (isSelectInput(el)) {
                    option = el[NAME_OPTIONS][el[NAME_SELECTED_INDEX]];
                    // prevent no value'd options
                    value = option && hasAttr(option, NAME_VALUE) ? option[NAME_VALUE] : '';
                } else if (isCheckInput(el)) {
                    value = el[NAME_CHECKED] ? (el[NAME_VALUE] || 'on') : '';
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
        // option: function () {
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
        // options: function (opt_toArray) {
        //    var el = this[0];
        //
        //    if (isSelectInput(el)) {
        //        return !opt_toArray ? el[NAME_OPTIONS] : $array(el[NAME_OPTIONS]);
        //    }
        // }
    });

    // dom: id & name
    toDomPrototype(Dom, {
        /**
         * Id.
         * @param  {String} id?
         * @return {String|undefined|this}
         */
        id: function (id) {
            return this.attr(NAME_ID, id);
        },

        /**
         * Name.
         * @param  {String} name?
         * @return {String|undefined|this}
         */
        name: function (name) {
            return this.attr(NAME_NAME, name);
        }
    });

    // class helpers
    function toClassRegExp(name, opt_cache) {
        return $re('(^|\\s+)'+ $trim(name).replaceAll(' ', '\\s+') +'(\\s+|$)', 'g', (
            opt_cache ? '1m' : ''
        ));
    }

    function hasClass(el, name, opt_cache, _value) {
        return $bool((_value = getClass(el)) && test(_value, toClassRegExp(name, opt_cache)));
    }

    function addClass(el, name) {
        $each(split(name, re_space), function (name) {
            if (!hasClass(el, name)) {
                 setClass(el, getClass(el) +' '+ name);
            }
        });
    }

    function setClass(el, value) {
        el && (el[NAME_CLASS_NAME] = $trim(value));
    }

    function getClass(el) {
        return $trim(el && el[NAME_CLASS_NAME]);
    }

    function removeClass(el, name) {
        $each(split(name, re_space), function (name) {
            setClass(el, getClass(el).replace(toClassRegExp(name), ' '));
        });
    }

    // dom: class
    toDomPrototype(Dom, {
        /**
         * Class.
         * @param  {String}      name?
         * @param  {String|Bool} option?
         * @return {Bool|this}
         */
        class: function (name, option) {
            return $isUndefined(name) ? this.getClass()
                 : $isUndefined(option) ? this.addClass(name)
                 : $isNull(option) || $isNulls(option) ? this.removeClass(name)
                 : $isTrue(option) ? this.setClass(name) : this.replaceClass(name, option);
        },

        /**
         * Class list.
         * @return {Array}
         */
        classList: function () {
            return this.getClass().split(re_space).filter();
        },

        /**
         * Has class.
         * @param  {String} name
         * @return {Bool}
         */
        hasClass: function (name) {
            return hasClass(this[0], name);
        },

        /**
         * Add class.
         * @param  {String} name
         * @return {this}
         */
        addClass: function (name) {
            return this.for(function (el) {
                addClass(el, name);
            });
        },

        /**
         * Remove class.
         * @param  {String} name
         * @return {this}
         */
        removeClass: function (name) {
            return this.for(function (el) {
                if (name == '*') { // all
                    name = getClass(el);
                }
                removeClass(el, name);
            });
        },

        /**
         * Replace class.
         * @param  {String} oldName
         * @param  {String} newName
         * @return {this}
         */
        replaceClass: function (oldName, newName) {
            return this.for(function (el) {
                !hasClass(el, oldName) ? addClass(el, newName)
                                       : setClass(el, getClass(el).replace(
                                             toClassRegExp(oldName), (' '+ $trim(newName) +' ')
                                         ));
            });
        },

        /**
         * Toggle.
         * @param  {String}           name
         * @param  {Function}         fn?
         * @param  {Int|Float|String} fnDelay?
         * @return {this}
         */
        toggleClass: function (name, fn, fnDelay) {
            var _this = this;

            _this.for(function (el) {
                !hasClass(el, name, !!fn) ? addClass(el, name)
                                          : removeClass(el, name);
            });

            if (fn) {
                fnDelay ? $fire(fnDelay, fn, _this, _this)
                        : fn(_this);
            }

            return _this;
        },

        /**
         * Toggle classes.
         * @param  {String}           name1
         * @param  {String}           name2
         * @param  {Function}         fn?
         * @param  {Int|Float|String} fnDelay?
         * @return {this}
         */
        toggleClasses: function (name1, name2, fn, fnDelay) {
            var _this = this;

            _this.for(function (el) {
                if (hasClass(el, name1, !!fn)) {
                    removeClass(el, name1), addClass(el, name2);
                } else if (hasClass(el, name2, !!fn)) {
                    removeClass(el, name2), addClass(el, name1);
                }
            });

            if (fn) {
                fnDelay ? $fire(fnDelay, fn, _this, _this)
                        : fn(_this);
            }

            return _this;
        },

        /**
         * Set class.
         * @param  {String} name
         * @return {this}
         */
        setClass: function (name) {
            return this.for(function (el) {
                setClass(el, name);
            });
        },

        /**
         * Get class.
         * @return {String}
         */
        getClass: function () {
            return getClass(this[0]);
        }
    });

    // data helpers
    function checkData(el) {
        el[DATA] = el[DATA] || {};
    }

    function hasData(el, key) {
        return $bool(el && $isDefined(key) ? $isDefined(getData(el, key))
                                           : !$.empty(getData(el, '*')))
    }

    function setData(el, key, value) {
        if (el) {
            checkData(el);

            if ($isString(key)) {
                el[DATA][$trim(key)] = value;
            } else {
                var data = toKeyValue(key, value);
                for (key in data) {
                    el[DATA][key] = data[key];
                }
            }
        }
    }

    function getData(el, key, opt_remove) {
        if (el) {
            checkData(el);
            key = $trim(key);

            var ret;
            if (key == '*') { // all
                ret = el[DATA], (opt_remove && delete el[DATA]);
            } else {
                ret = el[DATA][key], (opt_remove && delete el[DATA][key]);
            }
            return ret;
        }
    }

    // dom: data
    toDomPrototype(Dom, {
        /**
         * Data.
         * @param  {String|Object} key?
         * @param  {Any}           value?
         * @return {Any}
         */
        data: function (key, value) {
            return $isObject(key) ? this.setData(key)
                 : $isDefined(value) ? this.setData(key, value)
                 : $isDefined(key) ? this.getData(key) : this.getData('*');
        },

        /**
         * Has data.
         * @param  {String} key?
         * @return {Bool}
         */
        hasData: function (key) {
            return hasData(this[0], key);
        },

        /**
         * Set data.
         * @param  {String|Object} key
         * @param  {Any}           value
         * @return {this}
         */
        setData: function (key, value) {
            return this.for(function (el) {
                setData(el, key, value);
            });
        },

        /**
         * Get data.
         * @param  {String} key
         * @return {Any}
         */
        getData: function (key) {
            return getData(this[0], key);
        },

        /**
         * Remove data.
         * @param  {String} key
         * @return {this}
         */
        removeData: function (key) {
            key = split(key, re_comma);

            return this.for(function (el) {
                checkData(el);
                if (key[0] == '*') { // all
                    el[DATA] = NULL;
                } else {
                    $each(key, function (key) {
                        delete el[DATA][key];
                    });
                }
            });
        }
    });

    var re_plus = /%20/g;
    var encode = $util.urlEncode, decode = $util.urlDecode;

    // dom: form
    toDomPrototype(Dom, {
        /**
         * Serialize.
         * @param  {Bool} opt_plus?
         * @return {String|undefined}
         */
        serialize: function (opt_plus) {
            var form = this[0];
            var name, value;
            var data = [], ret;

            if (getTag(form) == 'form') { // forms only
                $forEach(form.elements, function (i, el) {
                    if (!$isNumeric(i)) return; // indexed elements only

                    name = $trim(el[NAME_NAME]);
                    if (!name || el[NAME_DISABLED]) {
                        return;
                    }
                    if (isCheckInput(el) && !el[NAME_CHECKED]) {
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
        serializeArray: function () {
            var _ret = function (data, ret) {
                return ret = [], data.split('&').each(function (item) {
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
        serializeObject: function () {
            var _ret = function (data, ret) {
                return ret = {}, $for(data, function (item) {
                    if (item.key) ret[item.key] = item.value;
                }), ret;
            };

            return _ret(this.serializeArray());
        },

        /**
         * Serialize json.
         * @return {String|undefined}
         */
        serializeJson: function () {
            var _ret = function (data, ret) {
                return ret = {}, $for(data, function (item) {
                    if (item.key) ret[item.key] = item.value;
                }), $util.jsonEncode(ret);
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

    // dom: form element states
    toDomPrototype(Dom, {
        /**
         * Checked.
         * @param  {Bool|Int|null} option?
         * @return {Bool|this}
         */
        checked: function (option) {
            return $isUndefined(option) ? getState(this[0], NAME_CHECKED) : this.for(function (el) {
                setState(el, NAME_CHECKED, option);
            });
        },

        /**
         * Selected.
         * @param  {Bool|Int|null} option?
         * @return {Bool|this}
         */
        selected: function (option) {
            return $isUndefined(option) ? getState(this[0], NAME_SELECTED) : this.for(function (el) {
                setState(el, NAME_SELECTED, option);
            });
        },

        /**
         * Disabled.
         * @param  {Bool|Int|null} option?
         * @return {Bool|this}
         */
        disabled: function (option) {
            return $isUndefined(option) ? getState(this[0], NAME_DISABLED) : this.for(function (el) {
                setState(el, NAME_DISABLED, option);
            });
        },

        /**
         * Readonly.
         * @param  {Bool|Int|null} option?
         * @return {Bool|this}
         */
        readonly: function (option) {
            return $isUndefined(option) ? getState(this[0], NAME_READONLY) : this.for(function (el) {
                setState(el, NAME_READONLY, option);
            });
        },

        /**
         * Hidden.
         * @param  {Bool|Int|null} option?
         * @return {Bool|this}
         */
        hidden: function (option) {
            return $isUndefined(option) ? getState(this[0], NAME_HIDDEN) : this.for(function (el) {
                setState(el, NAME_HIDDEN, option);
            });
        }
    });

    // dom: events
    if ($event) {
        toDomPrototype(Dom, {
            /**
             * On.
             * @param  {String|Object} type
             * @param  {Function}      fn
             * @param  {Object}        options?
             * @return {this}
             */
            on: function (type, fn, options) {
                return this.for(function (el) {
                    if ($isString(type)) {
                        $event.on(el, type, fn, options);
                    } else if ($isObject(type)) {
                        $forEach(type, function (type, fn) {
                            $event.on(el, type, fn);
                        })
                    }
                });
            },

            /**
             * Off.
             * @param  {String|Object} type
             * @param  {Function}      fn
             * @param  {Object}        options?
             * @return {this}
             */
            off: function (type, fn, options) {
                return this.for(function (el) {
                    if ($isString(type)) {
                        $event.off(el, type, fn, options);
                    } else if ($isObject(type)) {
                        $forEach(type, function (type, fn) {
                            $event.off(el, type, fn);
                        })
                    }
                });
            },

            /**
             * Once.
             * @param  {String|Object} type
             * @param  {Function}      fn
             * @param  {Object}        options?
             * @return {this}
             */
            once: function (type, fn, options) {
                return this.for(function (el) {
                    if ($isString(type)) {
                        $event.once(el, type, fn, options);
                    } else if ($isObject(type)) {
                        $forEach(type, function (type, fn) {
                            $event.once(el, type, fn);
                        })
                    }
                });
            },

            /**
             * Fire.
             * @param  {String}          type
             * @param  {Function|Object} fn?
             * @param  {Object}          options?
             * @return {this}
             */
            fire: function (type, fn, options) {
                if ($isObject(fn)) {
                    options = fn, fn = NULL;
                }

                return this.for(function (el) {
                    $event.fire(el, type, fn, options);
                });
            },

            /**
             * Event (alias of on()).
             */
            event: function (type, fn, options) {
                return this.on(type, fn, options);
            },

            /**
             * Has event.
             * @param  {String}   type
             * @param  {Function} fn
             * @param  {Bool}     opt_typeOnly?
             * @return {Bool}
             */
            hasEvent: function (type, fn, opt_typeOnly) {
                return $event.has(this[0], type, fn, opt_typeOnly);
            }
        });
    }

    // dom: observer
    toDomPrototype(Dom, {
        observe: function (options) {
            try { // safe for MutationObserver support
                var _this = this;
                return _this.for(function (el) {
                    el[OBSERVER] = new MutationObserver(function (mutationRecords) {
                        $for(mutationRecords, function (mutationRecord) {
                            $forEach(options, function (type, fn) {
                                if (mutationRecord.type == type) {
                                    fn.call(el, el, _this, mutationRecord);
                                }
                            });
                        });
                    });
                    el[OBSERVER].options = options;
                    el[OBSERVER].observe(el, options);
                })
            } catch (e) { warn(e) }
        },
        unobserve: function () {
            return this.for(function (el) {
                el[OBSERVER] && el[OBSERVER].disconnect();
            });
        }
    });

    function fadeCallback(callback) {
        if ($isTrue(callback)) { // remove element after fading out
            callback = function (animation) {
                animation.$dom.remove();
            };
        }
        return callback;
    }

    function fadeDisplay(el, none, callback, animation) {
        el[NAME_STYLE][NAME_DISPLAY] = none ? NAME_NONE : getDefaultStyle(el, NAME_DISPLAY);

        if (callback = fadeCallback(callback)) {
            callback(animation);
        }
    }

    function fadeSpeed(speed) { return speed || 0; }
    function fadeOpacity(opacity) { return {opacity: opacity}; }

    function scrollOptions(options) {
        // eg: Number or {top: Number, left: Number, gapTop: Number, gapLeft: Number,
        //                noGap: Bool, relative: Bool, speed: Number|String, easing: String}
        var optionsOrig = options;

        options = $extend({direction: NAME_TOP}, options);
        if ($isNumeric(optionsOrig)) {
            options[options.direction] = $float(optionsOrig);
        }

        return options;
    }

    // dom: animations
    var animate = $.animation && $.animation.animate;
    if (animate) {
        toDomPrototype(Dom, {
            /**
             * Animate.
             * @param  {Object|Bool}     properties
             * @param  {Int|String}      speed?
             * @param  {String|Function} easing?
             * @param  {Function}        callback?
             * @return {this}
             */
            animate: function (properties, speed, easing, callback) {
                return $isFalse(properties) // stop previous animation
                     ? this.for(function (el, animation) {
                         animation = el[ANIMATION];
                         if (animation && animation.running) {
                             animation.stop();
                         }
                     })
                     : this.for(function (el) {
                         animate(el, properties, speed, easing, callback);
                     });
            },

            /**
             * Animated.
             * @return {Bool}
             */
            animated: function () {
                return $bool(this[0] && $isDefined(this[0][ANIMATION]));
            },

            /**
             * Stop.
             * @return {this}
             */
            stop: function () {
                return this.animate(FALSE);
            },

            /**
             * Fade.
             * @param  {Float}      to
             * @param  {Int|String} speed?
             * @param  {Function}   callback?
             * @return {this}
             */
            fade: function (to, speed, callback) {
                return this.animate(fadeOpacity(to), speed, callback);
            },

            /**
             * Fade in.
             * @param  {Int|String} speed?
             * @param  {Function}   callback?
             * @return {this}
             */
            fadeIn: function (speed, callback) {
                return this.fade(1, speed, callback);
            },

            /**
             * Fade out.
             * @param  {Int|String}    speed?
             * @param  {Function|Bool} callback?
             * @return {this}
             */
            fadeOut: function (speed, callback) {
                return this.fade(0, speed, fadeCallback(callback));
            },

            /**
             * Show.
             * @param  {Int|String} speed?
             * @param  {Function}   callback?
             * @return {this}
             */
            show: function (speed, callback) {
                return this.for(function (el) {
                    fadeDisplay(el); // set & restore display
                    animate(el, fadeOpacity(1), fadeSpeed(speed), callback);
                });
            },

            /**
             * Hide.
             * @param  {Int|String} speed?
             * @param  {Function}   callback?
             * @return {this}
             */
            hide: function (speed, callback) {
                return this.for(function (el) {
                    animate(el, fadeOpacity(0), fadeSpeed(speed), function (animation) {
                        fadeDisplay(el, TRUE, callback, animation); // set & restore display
                    });
                });
            },

            /**
             * Toggle.
             * @param  {Int|String} speed?
             * @param  {Function}   callback?
             * @return {this}
             */
            toggle: function (speed, callback) {
                speed = fadeSpeed(speed);

                return this.for(function (el) {
                    if (!isVisible(el)) {
                        fadeDisplay(el); // set & restore display
                        animate(el, fadeOpacity(1), speed, callback);
                    } else {
                        animate(el, fadeOpacity(0), speed, function (animation) {
                            fadeDisplay(el, TRUE, callback, animation); // set & restore display
                        });
                    }
                });
            },

            /**
             * Toggle display.
             * @param  {Function}         fn?
             * @param  {Int|Float|String} fnDelay?
             * @return {this}
             */
            toggleDisplay: function (fn, fnDelay) {
                var _this = this;

                _this.for(function (el) {
                    isVisible(el) ? setStyle(el, NAME_DISPLAY, NAME_NONE)
                                  : setStyle(el, NAME_DISPLAY, '')
                });

                if (fn) {
                    fnDelay ? $fire(fnDelay, fn, _this, _this)
                            : fn(_this);
                }

                return _this;
            },

            /**
             * Toggle with.
             * @param  {String|Node} selector (with)
             * @param  {Int|String}  speed?
             * @param  {Function}    callback?
             * @return {this}
             */
            toggleWith: function (selector, speed, callback) {
                speed = fadeSpeed(speed);

                var $dom = toDom(selector);
                return this.for(function (el) {
                    if (!isVisible(el)) {
                        fadeDisplay(el); // set & restore display
                        animate(el, fadeOpacity(1), speed, function () {
                            $dom.for(function (_el) {
                                if (!isVisible(_el)) {
                                    fadeDisplay(_el); // set & restore display
                                    animate(_el, fadeOpacity(1), speed, callback);
                                } else {
                                    animate(_el, fadeOpacity(0), speed, function (animation) {
                                        fadeDisplay(_el, TRUE, callback, animation); // set & restore display
                                    });
                                }
                            });
                        });
                    } else {
                        animate(el, fadeOpacity(0), speed, function (animation) {
                            fadeDisplay(el, TRUE, callback, animation); // set & restore display
                            $dom.for(function (_el) {
                                animate(_el, fadeOpacity(0), speed, function (animation) {
                                    fadeDisplay(_el, TRUE, callback, animation); // set & restore display
                                });
                            });
                        });
                    }
                });
            },

            /**
             * Toggle by.
             * @param  {Bool}       option
             * @param  {Int|String} speed?
             * @param  {Function}   callback?
             * @return {this}
             */
            toggleBy: function (option, speed, callback) {
                return this[(option ? 'show' : 'hide')](speed, callback);
            },

            /**
             * Blip.
             * @param  {Int}        times?
             * @param  {Int|String} speed?
             * @param  {Function}   callback?
             * @return {this}
             */
            blip: function (times, speed, callback) {
                times = times || Infinity;
                speed = speed || 255;

                return this.for(function (el) {
                    var count = times > 0 ? 1 : 0;
                    !function run() {
                        if (count && count > times) {
                            callback && callback();
                            return;
                        }
                        animate(el, fadeOpacity(0), speed, function () {
                            animate(el, fadeOpacity(1), speed, run);
                            count++;
                        });
                    }();
                });
            },

            /**
             * Scroll to.
             * @param  {Object|Number} options
             * @param  {Function}      callback?
             * @return {this}
             */
            scrollTo: function (options, callback) {
                options = scrollOptions(options);

                return this.for(function (el) {
                    // 'cos window, document or (even body, for chrome & its gangs) won't be animated so..
                    if (isRoot(el) || isRootElement(el)) {
                        el = $getDocument(el)[NAME_SCROLLING_ELEMENT] || $getDocument(el)[NAME_DOCUMENT_ELEMENT];
                    }

                    var properties = {};
                    properties[NAME_SCROLL_TOP] = (options[NAME_TOP] != NULL) ? options[NAME_TOP] : el[NAME_OFFSET_TOP];
                    properties[NAME_SCROLL_LEFT] = (options[NAME_LEFT] != NULL) ? options[NAME_LEFT] : el[NAME_OFFSET_LEFT];

                    // manual gaps are useful for an accurate position
                    if (options[NAME_TOP] != NULL && options.gapTop) {
                        properties[NAME_SCROLL_TOP] -= $float(options.gapTop);
                    }
                    if (options[NAME_LEFT] != NULL && options.gapLeft) {
                        properties[NAME_SCROLL_LEFT] -= $float(options.gapLeft);
                    }

                    animate(el, properties, options.speed, options.easing, callback);
                });
            },

            /**
             * Scroll at.
             * @param  {String|Object} selector
             * @param  {Object}        options?
             * @param  {Function}      callback?
             * @return {this}
             */
            scrollAt: function (selector, options, callback) {
                var el = toDom(selector)[0], optionsOther, offset, _this = this;

                if (el) {
                    options = scrollOptions(options);
                    options.relative = options.relative || (
                        getCssStyle(el).position == 'absolute'
                    );

                    optionsOther = {}, offset = getOffset(el, options.relative);
                    if (options.direction) {
                        optionsOther[options.direction] = offset[options.direction];
                    }

                    options = $extend(options, optionsOther);

                    // fix gaps?
                    if (options.noGap) {
                        if (options[NAME_TOP] != NULL && el[NAME_PARENT_ELEMENT]) {
                            options[NAME_TOP] = options[NAME_TOP] - el[NAME_PARENT_ELEMENT][NAME_OFFSET_TOP];
                        }
                        if (options[NAME_LEFT] != NULL && el[NAME_PARENT_ELEMENT]) {
                            options[NAME_LEFT] = options[NAME_LEFT] - el[NAME_PARENT_ELEMENT][NAME_OFFSET_LEFT];
                        }
                    }

                    _this.scrollTo(options, callback);
                }

                return _this;
            }
        });
    }

    // xpath helper
    function toXDom(selector, root, one) {
        var doc = root || $doc, docEvl = doc.evaluate;
        var docEl = doc && doc[NAME_DOCUMENT_ELEMENT], docEls = docEl && docEl.selectNodes;
        var nodes = [], node, iter, ret;
        if (!docEl) {
            throw ('No XPath support by root!');
        }

        if (docEvl) {
            iter = docEvl.call(doc, selector, docEl, NULL, 0, NULL);
            while (node = iter.iterateNext()) {
                nodes.push(node);
                if (one) {
                    break;
                }
            }
        } else if (docEls) { // ie (still..)
            nodes = docEls.call(doc, selector);
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
     * @param  {String|Object}          selector
     * @param  {String|Object|Function} root?
     * @param  {Bool|Object}            one?
     * @return {Dom}
     */
    var $dom = function (selector, root, one) {
        return !$isFunction(root)
            ? toDom(selector, root, one)
            : toDom(selector).each(root, one);
    };

    // add static methods to dom
    $extend($dom, {
        // find by selector
        find: function (selector, root) {
            return toDom(selector, root, TRUE);
        },
        findAll: function (selector, root) {
            return toDom(selector, root);
        },

        // find by xpath
        xfind: function (selector, root) {
            return toXDom(selector, root, TRUE);
        },
        xfindAll: function (selector, root) {
            return toXDom(selector, root);
        },

        // (name, value) or ({name: value})
        define: function (name, value) {
            var names = Object.keys(Dom[PROTOTYPE]);
            $forEach(toKeyValue(name, value), function (name, value) {
                if (names.has(name)) {
                    throw ('Cannot override Dom.'+ name +'!');
                }
                Dom[PROTOTYPE][name] = value;
            });
        },

        create: function (content, attributes, doc) {
            return create(content, doc, attributes);
        },
        createDom: function (content, attributes, doc) {
            return toDom(create(content, doc, attributes));
        },

        loadStyle: function (src, root, onload, attributes) {
            if ($isFunction(root)) {
                onload = root, root = NULL;
            }

            var el = createElement(NULL, 'link');
            el.href = src, el.onload = onload, el.rel = 'stylesheet';

            if (attributes) $forEach(attributes, function (name, value) {
                setAttr(el, name, value);
            });

            appendChild(toDom(root || $doc[TAG_HEAD])[0], el);
        },
        loadScript: function (src, root, onload, attributes) {
            if ($isFunction(root)) {
                onload = root, root = NULL;
            }

            var el = createElement(NULL, 'script');
            el.src = src, el.onload = onload;

            if (attributes) $forEach(attributes, function (name, value) {
                setAttr(el, name, value);
            });

            appendChild(toDom(root || $doc[TAG_HEAD])[0], el);
        },

        q: function (selector, root) {
            return querySelector(root || $doc, selector);
        },
        qa: function (selector, root) {
            return $array(querySelectorAll(root || $doc, selector));
        }
    });

    // export dom
    $.dom = $dom;

})(window.so, null, true, false);
