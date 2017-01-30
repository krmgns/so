/**
 * @name: so.dom
 * @deps: so, so.ext, so.array, so.object, so.event, so.animate
 */

;(function($) {

"use strict"; // @tmp

var DOC = $.doc(),
    WIN = $.win(DOC),
    ie = $.browser.ie,
    ie_lt8 = ie && $.browser.version < 8,
    ie_lt9 = ie && $.browser.version < 9,
    re_tagName = /<([a-z-]+)/i,
    re_tableChildren = /^(?:thead|tbody|tfoot|col|colgroup|caption)$/i,
    re_formChildren = /^(button|input|select|textarea)$/i,
    re_stateAttrs = /^(checked|selected|disabled|readonly)$/i,
    re_styleUnits = /^-?[\d\.]+(?:in|cm|mm|em|ex|pt|pc|%)/i,
    re_digit = /^-?[\d\.]+$/,
    re_bool = /^(true|false)$/,
    re_opacity = /opacity=(.*)?\)/i,
    re_rgb = /(.*?)rgb\((\d+),\s*(\d+),\s*(\d+)\)/,
    re_htmlContent = /^<([a-z-]+).*\/?>(?:.*<\/\1>|)$/i,
    _re_cache = {}
;

function RE(re, flags, x /*internal*/) {
    x = re + (flags || "");
    if (!_re_cache[x]) {
        _re_cache[x] = new RegExp(re, flags);
    }

    // simple gc
    setTimeout(function(){
        _re_cache = {};
    }, 60*1000);

    return _re_cache[x];
}

function isNode(node) {
    return node && (node.nodeType == 1 || node.nodeType == 11);
}

function isNodeElement(node) {
    return node && node.nodeType == 1;
}

function getTagName(node) {
    return node && node.nodeName && node.nodeName.toLowerCase();
}

function getByTag(root, tag, i) {
    var els = root.getElementsByTagName(tag);
    return (i === true) ? $.array.make(els) : isNaN(i) ? els : els[i];
}

function fixTable(table, doc) {
    var els = getByTag(table, "tbody"), el, i = els.length;

    while (el = els[--i]) { // clean
        if (!el.childNodes.length) el.parentNode.removeChild(el);
    }

    $.forEach(getByTag(table, "tbody", true), function(e) { // fix
        el = doc.createElement("tbody");
        while (e.firstChild) {
            el.appendChild(e.firstChild);
        }
        table.replaceChild(el, e);
    });
}

var fixedNodes = {
     option: {content: "<select><option selected></option>#</select>", dep: 1, skip: true},
      tbody: {content: "<table>#</table>", dep: 1},
         tr: {content: "<table><tbody>#</tbody></table>", dep: 2},
         th: {content: "<table><tbody><tr>#</tr></tbody></table>", dep: 3},
   fieldset: {content: "<form>#</form>", dep: 1},
     legend: {content: "<form><fieldset>#</fieldset></form>", dep: 2},
       area: {content: "<map>#</map>", dep: 1},
         _p: {content: "<p>-#</p>", dep: 1, skip: true}
};
$.mix(fixedNodes, {optgroup: fixedNodes.option, thead: fixedNodes.tbody, tfoot: fixedNodes.tbody, col: fixedNodes.tbody, colgroup: fixedNodes.tbody, caption: fixedNodes.tbody, td: fixedNodes.th, style: fixedNodes._p, script: fixedNodes._p, param: fixedNodes._p, link: fixedNodes._p, base: fixedNodes._p});

var fixedAttributes = (ie_lt8)
    ? {"for": "htmlFor", "class": "className", enctype: "encoding"}
    : {"htmlFor": "for", "className": "class", encoding: "enctype"};
$.mix(fixedAttributes, {acceptcharset: "acceptCharset", accesskey: "accessKey", allowtransparency: "allowTransparency", bgcolor: "bgColor", cellpadding: "cellPadding", cellspacing: "cellSpacing", colspan: "colSpan", defaultchecked: "defaultChecked", defaultselected: "defaultSelected", defaultvalue: "defaultValue", frameborder: "frameBorder", hspace: "hSpace", longdesc: "longDesc", maxlength: "maxLength", marginwidth: "marginWidth", marginheight: "marginHeight", noresize: "noResize", noshade: "noShade", readonly: "readOnly", rowspan: "rowSpan", valign: "vAlign", vspace: "vSpace", tabindex: "tabIndex", usemap: "useMap", contenteditable: "contentEditable"});

var textProp = (DOC.documentElement.textContent !== undefined) ? "textContent" : "innerText";

var insertFunctions = {
          "append": function(node) { this.appendChild(node); },
         "prepend": function(node) { this.insertBefore(node, this.firstChild); },
          "before": function(node) { this.parentNode.insertBefore(node, this); },
           "after": function(node) { this.parentNode.insertBefore(node, this.nextSibling); },
         "replace": function(node) { this.parentNode.replaceChild(node, this); },
        "appendTo": function(node) { node.appendChild(this); },
       "prependTo": function(node) { node.insertBefore(this, node.firstChild); },
    "insertBefore": function(node) { node.parentNode.insertBefore(this, node); },
     "insertAfter": function(node) { node.parentNode.insertBefore(this, node.nextSibling); }
};

var attrFunctions = {
    "name": function(el, val) { el.name = val; },
    // notation: data:{foo:"The foo!"}
    "data": function(el, val) { $.dom(el).data(val); },
    // notation: style:{color:"blue"}
    "style": function(el, val) { $.dom(el).setStyle(val); }
};

function setAttributes(el, attrs) {
    if (isNodeElement(el)) {
        var keyFixed, keyFixedDef, key, val, state,
            re_true = /^(1|true)$/;

        for (key in attrs) {
            keyFixed = fixedAttributes[key] || key;
            keyFixedDef = fixedAttributes["default"+ key];
            if (!keyFixed) continue;

            val = (val = attrs[key]) != null ? val : "";
            if (key in attrFunctions) {
                attrFunctions[key](el, val);
                continue;
            }

            if (re_stateAttrs.test(key)) {
                // set attribute as boolean
                el[key] = (state = re_true.test(val) || val != "");
                if (keyFixedDef) {
                    el[keyFixedDef] = state;
                }
                if (state) {
                    // set proper attribute (e.g: disabled="disabled")
                    el.setAttribute(keyFixed, key);
                } else {
                    // remove attribute
                    el.removeAttribute(keyFixed);
                }
                continue;
            }

            // bind `on*` events
            (val && val.apply &&
                (el[key.toLowerCase()] = function() {
                    return val.apply(el, arguments);
                })
            // or just set attribute
            ) || el.setAttribute(keyFixed, ""+ val);
        }
    }
    return el;
}

function cloneElement(el, deep) {
    deep = (deep !== false);
    var clone = el.cloneNode(false);
    if (deep) {
        if (el.childNodes.length) {
            $.forEach(el.childNodes, function(e){
                clone.appendChild(cloneElement(e, deep));
            });
        }
        clone = cloneElementEvents(el, clone);
    }
    return clone;
}

function cloneElementEvents(el, clone) {
    // needs `$.event` and `el.$events`
    if (el.$events) {
        $.forEach(el.$events, function(type, events){
            $.forEach(events, function(i, callback){
                $.event.on(clone, type, callback);
            });
        });
    }
    return clone;
}

function cleanElement(el, child /*internal*/) {
    while (child = el.firstChild) {
        // remove data & events
        if (child.$data   !== undefined) delete child.$data;
        if (child.$events !== undefined) delete child.$events;
        // clean child element
        cleanElement(child);
        // remove child element
        el.removeChild(child);
    }
    return el;
}

function create(tag, attrs, doc) {
    return setAttributes(
        createElementSafe(tag, doc, $.object.pick(attrs, "name")),
        attrs
    );
}

function createFragment(content, doc) {
    var tmp = doc.createElement("so-tmp"),
        frg = doc.createDocumentFragment();

    tmp.innerHTML = content;
    while (tmp.firstChild) {
        frg.appendChild(tmp.firstChild);
    }

    return frg;
}

function createElementSafe(tag, doc, nameAttr) {
    var element;
    doc || (doc = DOC);
    nameAttr || (nameAttr = "");

    if (ie_lt8) {
        // set name for ie
        element = doc.createElement("<"+ tag +" name='" + nameAttr + "'>");
    } else {
        element = doc.createElement(tag);
        if (nameAttr) {
            element.setAttribute("name", nameAttr);
        }
    }

    return element;
}

function createElement(content, doc) {
    var frg, fix, dep, tag,
        _return = function(a, b, c) {
            return {tag: a, nodes: b, fixed: !!c};
        };

    if (isDomInstance(content)) {
        return _return("Dom", content.toArray());
    }

    if (isNode(content)) {
        return (tag = getTagName(content)) && _return(tag, [content], fixedNodes[tag]);
    }

    tag = (re_tagName.exec(content) || [, ""])[1].toLowerCase();
    if (tag == "") { // text node
        return _return("#text", [doc.createTextNode(content)]);
    }

    if (fix = fixedNodes[tag]) {
        content = fix.content.replace("#", content);
        frg = createFragment(content, doc).firstChild;
        dep = fix.dep;
        // remove node (ff sets selected=true last option)
        if (fix.skip) {
            frg.removeChild(frg.firstChild);
        }
        while (--dep) frg = frg.firstChild;
    } else {
        frg = createFragment(content, doc);
    }

    return _return(tag, $.array.make(frg.childNodes), !!fix);
}

function insert(fn, target, contents, reverse) {
    var doc = $.doc(target),
        element = createElement(contents, doc),
        node, nodes = element.nodes,
        scope, tBody, i = 0;

    // set target as `tbody`, otherwise ie7 doesn't insert
    if (element.fixed && element.tag == "tr" && (tBody = getByTag(target, "tbody", 0)) != null) {
        target = tBody;
    }

    fn = insertFunctions[fn], scope = target;
    while (node = nodes[i++]) {
        // for insertbefore/insertafter etc.
        if (reverse) {
            scope = node;
            node = target;
        }
        fn.call(scope, node);
    }

    // removes empty tbody's on ie (7-8)
    if (element.fixed && ie_lt9 && re_tableChildren.test(element.tag)) {
        fixTable(target, doc);
    }

    return nodes;
}

// credits: http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
function toPixel(el, key, value) {
    var left, leftRS;
    left = el.style.left;
    leftRS = el.runtimeStyle && el.runtimeStyle.left;
    leftRS && (el.runtimeStyle.left = el.currentStyle.left);
    el.style.left = (key == "fontSize") ? "1em" : value;
    value = el.style.pixelLeft;
    el.style.left = left;
    leftRS && (el.runtimeStyle.left = leftRS);
    return value +"px";
}

var fixedStyles = {
        "float": (DOC.documentElement.style.styleFloat !== undefined) ? "styleFloat" : "cssFloat"
    },
    nonuniteStyles = {
        "opacity"    : 1, "zoom"      : 1, "zIndex"     : 1,
        "columnCount": 1, "columns"   : 1, "fillOpacity": 1,
        "fontWeight" : 1, "lineHeight": 1
    },
    getStyle = function(el, key) {
        return el.style[key] || "";
    };

if (DOC.defaultView && DOC.defaultView.getComputedStyle) {
    getStyle = function(el, key) {
        var styles;
        return (styles = $.doc(el).defaultView.getComputedStyle(el, ""))
                   ? styles[key] || styles.getPropertyValue(key) || ""
                       : "";
    };
} else if (ie && DOC.documentElement.currentStyle) {
    getStyle = function(el, key) {
        var val;
        if (key == "opacity") {
            val = re_opacity.exec(el.style.filter || "") || [, 100];
            val = parseFloat(val[1]) / 100;
        } else {
            val = el.currentStyle[key] || "";
            if (re_styleUnits.test(val)) {
                val = toPixel(el, key, val);
            }
        }
        return val;
    };
}

function sumComputedPixels(el, props) {
    var i = 0, sum = 0, prop;
    while (prop = props[i++]) {
        sum += parseFloat(getStyle(el, prop)) || 0;
    }
    return sum;
}

function toStyleProp(key) {
    return $.ext.camelizeStyleProperty(key);
}

function parseStyleText(text) {
    var styles = {}, s;
    text = (""+ text).split(RE("\\s*;\\s*"));
    while (text.length) {
        // wtf! :)
        (s = text.shift().split(RE("\\s*:\\s*")))
            && (s[0] = $.trim(s[0]))
                && (styles[s[0]] = s[1] || "");
    }
    return styles;
}

function rgbToHex(color) {
    if (!color || color.charAt(0) == "#" || color.indexOf("rgb") == -1) {
        return color;
    }

    var nums = re_rgb.exec(color) || [, 0, 0, 0, 0],
        r = parseInt(nums[2], 10).toString(16),
        g = parseInt(nums[3], 10).toString(16),
        b = parseInt(nums[4], 10).toString(16);

    return "#"+ (
        (r.length == 1 ? "0"+ r : r) +
        (g.length == 1 ? "0"+ g : g) +
        (b.length == 1 ? "0"+ b : b)
    );
}

function getOffset(el, rel) {
    var tag = getTagName(el), rect = {top: 0, left: 0};

    if (rel && (tag == "body" || tag == "html")) {
        return rect;
    }

    var bcr = el.getBoundingClientRect ? el.getBoundingClientRect() : rect,
        doc = $.doc(el),
        win = $.win(doc),
        docEl = doc.documentElement,
        docBody = doc.body,
        topScroll = win.pageYOffset || docEl.scrollTop,
        leftScroll = win.pageXOffset || docEl.scrollLeft;

    return {
        top: bcr.top + topScroll -
                Math.max(0, docEl && docEl.clientTop, docBody.clientTop),
        left: bcr.left + leftScroll -
                Math.max(0, docEl && docEl.clientLeft, docBody.clientLeft)
    };
}

function getScroll(el, type /*internal*/) {
    type = type || $.typeOf(el);

    var tag, scroll, doc, docEl, win;

    if (type == "window" || type == "document" ||
            ((tag = getTagName(el)) && tag == "html" || tag == "body")) {
        // ie issue: works only if `onscroll` called, does not work on `onload`
        doc = $.doc(el);
        win = $.win(doc);
        docEl = doc.documentElement;
        scroll = {
            top: win.pageYOffset || docEl.scrollTop,
            left: win.pageXOffset || docEl.scrollLeft
        };
    } else {
        scroll = {top: el.scrollTop, left: el.scrollLeft};
    }
    return scroll;
}

function classRE(cls) {
    return RE("(^|\\s)"+ cls + "(\\s|$)");
}

// qwery integration (for now, qwery will be removed in the future)
function query(selector, root) {
    return qwery(selector, root);
}

function isDomInstance(x) {
    return (x instanceof Dom);
}

function initDom(selector, root, i) {
    if (isDomInstance(selector)) {
        return selector;
    }

    // somehow qwery does not catch iframe windows (detected while adding getWindow() method)
    var type = $.typeOf(selector);
    if (type == "window" || type == "document") {
        return new Dom(selector, selector);
    }

    var nodes;
    if (type == "string") {
        selector = $.trim(selector);
        // notation: $.dom("<span>", {id: "foo"})
        // notation: $.dom("<span id='foo'>")
        // notation: $.dom("<span id='foo'>The span!</span>")
        if (re_htmlContent.test(selector)) {
            nodes = createElement(selector, DOC).nodes;
            // set attributes
            if (root && typeof root == "object" && !root.nodeType && root.length == null) {
                $.forEach(nodes, function(node){
                    setAttributes(node, root);
                });
            }
        }
    }

    if (!nodes) {
        nodes = query(selector, root);
        if (!isNaN(i) && nodes && nodes.length) { // node list
            nodes = nodes[i];
        }
    }

    return new Dom(nodes, selector);
}

/*** the dom ***/
function Dom(nodes, selector) {
    // set length first
    this.length = 0;
    if (nodes) {
        nodes = (!nodes.nodeType && typeof nodes.length == "number") // for node list or arrays
                    && /*and*/ (!nodes.document || !nodes.document.nodeType)  // for window
                        ? nodes /*get node list*/ : [nodes] /*make array*/;
        for (var i = 0, len = nodes.length; i < len; i++) {
            if (nodes[i]) {
                this[this.length++] = nodes[i];
            }
        }
    }
    return this;
}

Dom.prototype = {
    constructor: Dom,
    find: function(selector, i) {
        return this[0] ? initDom(selector, this[0], i) : this;
    },
    not: function(selector) {
        var type = $.typeOf(selector), src, els = [];

        // notation: $.dom("p").not(this)
        // notation: $.dom("p").not(".red")
        if (selector && (type == "object" || type == "string" || type.substring(0,4) == "html")) {
            src = initDom(selector).toArray();
            this.forEach(function(el, i){
                var e, j = 0;
                while (e = src[j++]) {
                    if (e !== el) {
                        els.push(el);
                    }
                }
            });
            return initDom(els);
        }

        // notation: $.dom("p").not(0) or $.dom("p").not([0,1])
        if (type == "number" || type == "array") {
            selector = $.array.make(selector);
            this.forEach(function(el, i){
                if (!$.array.has(selector, i)) {
                    els.push(el);
                }
            });
            return initDom(els);
        }

        return this;
    },
    toArray: function() {
        return $.array.make(this);
    },
    forEach: function(fn) {
        return $.forEach(this, fn, this /*scope*/);
    },
    map: function(fn) {
        return initDom($.array.map(this.toArray(), fn));
    },
    filter: function(fn) {
        return initDom($.array.filter(this.toArray(), fn));
    },
    reverse: function() {
        // "clone" needs this sometimes (multiple clones)
        return initDom(this.toArray().reverse());
    },
    get: function(i) {
        return initDom(this[i = (i != null) ? i : 0]);
    },
    first: function() {
        return this.get(0);
    },
    last: function() {
        return this.get(this.length - 1);
    },
    tag: function() {
        return getTagName(this[0]);
    }
};

// dom: modifiers
$.forEach(["append", "prepend", "before", "after", "replace"], function(fn) {
    Dom.prototype[fn] = function(contents, cloning) {
        return this.forEach(function(el) {
            // @note: doesn't work without `clone` (so inserts only once)
            if (cloning) {
                if (contents.cloneNode) {
                    contents = cloneElement(contents);
                } else if (contents[0] && contents[0].cloneNode) {
                    contents = cloneElement(contents[0]);
                }
            }
            insert(fn, el, contents);
        });
    };
});

// dom: modifiers
$.forEach(["appendTo", "prependTo", "insertBefore", "insertAfter"], function(fn) {
    Dom.prototype[fn] = function(toEl, cloning) {
        return this.forEach(function(el) {
            if (!isDomInstance(toEl)) {
                toEl = initDom(toEl);
            }
            toEl.forEach(function(to) {
                // @note: doesn't work without `clone` (so inserts only once)
                if (cloning) {
                    el = cloneElement(el);
                }
                insert(fn, to, el /*contents*/, true /*reverse*/);
            });
        });
    };
});

// dom: modifiers
$.extend(Dom.prototype, {
    clone: function(deep) {
        var clones = [];
        this.forEach(function(el, i) {
            clones[i] = cloneElement(el, deep);
        });
        return initDom(clones);
    },
    remove: function() {
        return this.forEach(function(el) {
            el = cleanElement(el);
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
    },
    empty: function() {
        return this.forEach(function(el) {
            return cleanElement(el);
        });
    }
});

// dom: contents
$.forEach({setHtml: "innerHTML", setText: textProp}, function(fn, prop) {
    Dom.prototype[fn] = function(content) {
        return this.forEach(function(el) {
            el[prop] = (content != null) ? content : "";
        });
    };
});

$.forEach({getHtml: "innerHTML", getText: textProp}, function(fn, prop) {
    Dom.prototype[fn] = function(outer) {
        if (outer && fn == "getHtml") { // outerHTML requested
            prop = "outerHTML";
        }
        return this[0] && this[0][prop] || "";
    };
});

// dom: walkers
$.forEach({parent: "parentNode", prev: "previousSibling", next: "nextSibling"}, function(fn, node) {
    Dom.prototype[fn] = function() {
        var n = this[0] && this[0][node];
        while (n && n.nodeType !== 1) {
            n = n[node];
        }
        return initDom(n);
    };
});

// dom: walkers
$.extend(Dom.prototype, {
    prevAll: function(src) {
        var el = this[0], els = [], j = 0, n, ns, tmp;
        if (el && el.parentNode) {
            ns = el.parentNode.childNodes;
            while (n = ns[j++]) {
                if (n == el) {
                    break;
                }
                if (isNodeElement(n)) els.push(n);
            }
            if (typeof src == "string") {
                tmp = initDom(src, el.parentNode).toArray();
                els = $.array.filter(tmp, function(e) {
                    for (var i = 0, len = els.length; i < len; i++) {
                        if (els[i] == e) return true;
                    }
                });
            }
        }
        return initDom(els);
    },
    nextAll: function(src) {
        var el = this[0], els = [], j = 0, n, ns, tmp, found;
        if (el && el.parentNode) {
            ns = el.parentNode.childNodes;
            while (n = ns[j++]) {
                if (n == el) {
                    found = true;
                }
                if (found && n != el && isNodeElement(n)) els.push(n);
            }
            if (typeof src == "string") {
                tmp = initDom(src, el.parentNode).toArray();
                els = $.array.filter(tmp, function(e) {
                    for (var i = 0, len = els.length; i < len; i++) {
                        if (els[i] == e) return true;
                    }
                });
            }
        }
        return initDom(els);
    },
    children: function(i) {
        var el = this[0], els = [], j = 0, n, ns, type = typeof i;
        if (el) {
            if (i && type == "string") {
                els = initDom(i, el);
            } else {
                ns = el.childNodes;
                while (n = ns[j++]) {
                    if (isNodeElement(n)) els.push(n);
                }
                els = (type == "number") ? els[i] : els;
            }
        }
        return initDom(els);
    },
    siblings: function(i) {
        var el = this[0], els = [], j = 0, n, ns, type = typeof i;
        if (el && el.parentNode) {
            if (i && type == "string") {
                initDom(i, el.parentNode).forEach(function(e) {
                    if (e != el && e.parentNode == el.parentNode) {
                        els.push(e);
                    }
                });
            } else {
                ns = el.parentNode.childNodes;
                while (n = ns[j++]) {
                    if (n != el && isNodeElement(n)) els.push(n);
                }
                els = (type == "number") ? els[i] : els;
            }
        }
        return initDom(els);
    },
    contains: function(el, i) {
        return this[0] && !!initDom(this[0]).find(el, i).length;
    },
    hasChild: function(){
        var child = this[0] && this[0].firstChild;
        while (child) {
            if (isNode(child)) {
                return true;
            }
            child = child.nextSibling;
        }
        return false;
    }
});

// dom: styles & dimensions
$.extend(Dom.prototype, {
    setStyle: function(key, val) {
        return this.forEach(function(el) {
            var styles = key, k, v;

            if (typeof styles == "string") {
                if (val != null) {
                    styles = {}, (styles[key] = val);
                } else {
                    styles = parseStyleText(key);
                }
            }

            if (ie_lt9 && "opacity" in styles) {
                styles.filter = "alpha(opacity=" + (styles.opacity * 100) + ")";
                styles.zoom = styles.zoom || 1;
                delete styles.opacity;
            }

            for (k in styles) {
                if (styles.hasOwnProperty(k)) {
                    v = styles[k], k = toStyleProp(k);
                    if (re_digit.test(v) && !(k in nonuniteStyles)) {
                        v += "px";
                    }
                    el.style[k] = v;
                }
            }

            return el;
        });
    },
    getStyle: function(key, hex) {
        var el = this[0], val;
        if (el) {
            key = toStyleProp(key), val = getStyle(el, key) || "";
            if (val != null && hex === true && /color/i.test(key)) {
                val = rgbToHex(val);
            }
        }
        return val;
    },
    removeStyle: function(key) {
        return this.forEach(function(el) {
            var tmp = key.split(/,+/);
            while (tmp.length) {
                el.style[toStyleProp(tmp.shift())] = "";
            }
        });
    },
    innerWidth: function (el /*internal*/) {
        return (el = el || this[0]) && el.offsetWidth
                    - sumComputedPixels(el, ["borderLeftWidth", "borderRightWidth"]);
    },
    innerHeight: function (el /*internal*/) {
        return (el = el || this[0]) && el.offsetHeight
                    - sumComputedPixels(el, ["borderTopWidth", "borderBottomWidth"]);
    },
    outerWidth: function (margins, el /*internal*/) {
        if (el = this[0]) {
            return !margins
                ? el.offsetWidth
                : el.offsetWidth + sumComputedPixels(el, ["marginLeft", "marginRight"]);
        }
    },
    outerHeight: function (margins, el /*internal*/) {
        if (el = this[0]) {
            return !margins
                ? el.offsetHeight
                : el.offsetHeight + sumComputedPixels(el, ["marginTop", "marginBottom"]);
        }
    },
    width: function() {
        var el = this[0];
        if (el && el.alert) return this.dimensions("window").width;
        if (el && el.nodeType == 9) return this.dimensions("document").width;
        return this.innerWidth(el) - sumComputedPixels(el, ["paddingLeft", "paddingRight"]);
    },
    height: function() {
        var el = this[0];
        if (el && el.alert) return this.dimensions("window").height;
        if (el && el.nodeType == 9) return this.dimensions("document").height;
        return this.innerHeight(el) - sumComputedPixels(el, ["paddingTop", "paddingBottom"]);
    },
    dimensions: function(type /*internal*/) {
        var el = this[0];
        type = type || $.typeOf(el);
        if (type == "window") {
            var doc = el.document,
                docBody = doc.body,
                docEl = doc.documentElement,
                css1Compat = (doc.compatMode == "CSS1Compat");
            return {
                width: css1Compat && docEl.clientWidth ||
                            docBody && docBody.clientWidth || docEl.clientWidth,
                height: css1Compat && docEl.clientHeight ||
                            docBody && docBody.clientHeight || docEl.clientHeight
            };
        }
        if (type == "document") {
            var docBody = el.body,
                docEl = el.documentElement,
                width = Math.max(docBody.scrollWidth, docBody.offsetWidth,
                                 docEl.scrollWidth, docEl.offsetWidth),
                height = Math.max(docBody.scrollHeight, docBody.offsetHeight,
                                  docEl.scrollHeight, docEl.offsetHeight);
            // fix for ie
            if (ie && docEl.clientWidth >= docEl.scrollWidth) width = docEl.clientWidth;
            if (ie && docEl.clientHeight >= docEl.scrollHeight) height = docEl.clientHeight;
            return {width: width, height: height};
        }
        return {width: this.width(), height: this.height()};
    },
    viewport: function() {
        if ($.typeOf(this[0]) != "window") {
            throw ("so.dom.viewport(): This function only for `window`, use `so.dom.dimensions()` instead.");
        }
        return this.dimensions();
    },
    offset: function(rel) {
        var el, type;
        if (el = this[0]) {
            type = $.typeOf(el);
            if (type == "window" || type == "document") {
                return {top: 0, left: 0};
            }
            // get real & relative position
            if (rel) {
                var offset = getOffset(el), parentEl = el.parentNode,
                    parentOffset = getOffset(parentEl, rel);
                if (isNodeElement(parentEl)) {
                    parentOffset.top += parseFloat(getStyle(parentEl, "borderTopWidth")) || 0;
                    parentOffset.left += parseFloat(getStyle(parentEl, "borderLeftWidth")) || 0;
                }
                el.style.marginTop && (offset.top -= parseFloat(getStyle(el, "marginTop")) || 0);
                el.style.marginLeft && (offset.left -= parseFloat(getStyle(el, "marginLeft")) || 0);
                return {
                    top: offset.top - parentOffset.top,
                    left: offset.left - parentOffset.left
                };
            } else {
                return getOffset(el);
            }
        }
    },
    scroll: function(top, left) {
        var el, type;
        if (el = this[0]) {
            type = $.typeOf(el);
            // get scroll top | left
            if (typeof top == "string") {
                return getScroll(el, type)[top];
            }
            // get scroll top & left
            if (top == null && left == null) {
                return getScroll(el, type);
            }
            // set scroll top & left
            var doc, win, tag;
            if (type == "window" || type == "document" || ((tag = getTagName(el)) && tag == "html" || tag == "body")) {
                doc = $.doc(el);
                win = $.win(doc);
                win.scrollTo(left, top);
            } else {
                if (!isNaN(top)) el.scrollTop = top;
                if (!isNaN(left)) el.scrollLeft = left;
            }
            return {top: top, left: left};
        }
    }
});

// dom: attributes & values
$.extend(Dom.prototype, {
    hasAttr: function(key, el /*internal*/) {
        if ((el = this[0]) == null) {
            return false;
        }
        return el.hasAttribute ? el.hasAttribute(key)
            : (el.attributes[key] && el.attributes[key].specified) || el[key]; // IE7
    },
    setAttr: function(key, val) {
        return this.forEach(function(el) {
            var attrs = key;
            if (typeof attrs == "string") {
                attrs = {}, (attrs[key] = val || "");
            }
            if ("type" in attrs && ie_lt8) {
                throw ("so.dom.setAttr(): `type` attribute can not be modified!");
            }
            setAttributes(el, attrs);
        });
    },
    getAttr: function(key, el /*internal*/) {
        if ((el = this[0]) == null) {
            return;
        }

        var attrs = el.attributes, val;
        switch (key) {
            case "class":
            case "className":
                val = attrs["class"] && attrs["class"].specified
                        ? el.className : null;
                break;
            case "src":
            case "href":
                val = el.getAttribute(key, 2);
                break;
            case "style":
                val = ie_lt8
                    ? (attrs.style && attrs.style.specified)
                        ? el.style.cssText : null
                            : el.getAttribute("style");
                val = val && val.toLowerCase();
                break;
            case "tabindex":
            case "tabIndex":
                val = (val = el.getAttributeNode("tabindex")) && val.specified
                        ? val.value
                        : el.getAttribute("tabindex");
                break;
            case "for":
            case "htmlFor":
                val = el.htmlFor || el.getAttribute("for");
                break;
            case "enctype":
            case "encoding":
                val = el.getAttribute("enctype") || el.enctype;
                break;
            default:
                if (re_stateAttrs.test(key)) {
                    val = el[key] === true || typeof el[key] != "boolean"
                            && (val = el.getAttributeNode(key))
                                && val.nodeValue !== false ? key : null;
                } else {
                    val = el.getAttribute(fixedAttributes[key] || key);
                }
        }
        // ie7 (onclick etc.)
        if (ie && typeof val == "function") {
            val = /function.*?\(.*?\)\s*\{\s*(.*?)\s*\}/mi.exec(""+ val)
            val = val && val[1];
        }
        return (val !== null) ? val : undefined;
    },
    removeAttr: function(key) {
        if (key == "*") {
            return this.forEach(function(el) {
                var attrs = el.attributes, attr,
                        i = el.attributes.length - 1;
                for (; i >= 0, (attr = el.attributes[i]); --i) {
                    if (attr.specified)  {
                        el.removeAttribute(attr.name);
                    }
                }
            });
        }

        var keys = $.trim(key).split(RE("\\s+")), keyFixed, keyFixedDef, i;

        return this.forEach(function(el) {
            for (i = 0; i < keys.length; i++) {
                keyFixed = fixedAttributes[keys[i]] || keys[i];
                keyFixedDef = fixedAttributes["default"+ keys[i]];
                if (re_formChildren.test(el.tagName)
                        && re_stateAttrs.test(keyFixed)) {
                    el[keyFixed] = false;
                    if (keyFixedDef) el[keyFixedDef] = false;
                }
                el.removeAttribute(keyFixed);
            }
        });
    },
    setValue: function(val) {
        val += ""; // @important
        return this.forEach(function(el) {
            var tag = getTagName(el), i = 0, opt, valAttr;
            if (re_formChildren.test(tag)) {
                if (tag == "select") {
                    while (opt = el.options[i++]) {
                        if (opt.value === val) {
                            opt.selected = true;
                        }
                    }
                } else if (tag == "button" && ie_lt8) {
                    valAttr = $.doc(el).createAttribute("value");
                    valAttr.value = val;
                    el.setAttributeNode(valAttr);
                } else {
                    el.value = val;
                }
            }
        });
    },
    getValue: function() {
        var el = this[0];
        if (el) {
            var val, tag = getTagName(el);
            if (tag == "select" && null != (val = el.options[el.selectedIndex])) {
                val = (val.disabled || val.parentNode.disabled) ? null : val.value;
            } else if (tag == "button" && ie_lt8 && null != (val = el.getAttributeNode("value"))) {
                val = val && val.specified ? val.value : null;
            } else {
                val = el.value;
            }
            return (val != null) ? val : "";
        }
    }
});

// dom: class tools
$.extend(Dom.prototype, {
    hasClass: function(cls, el /*internal*/) {
        // thanks: jsperf.com/pure-js-hasclass-vs-jquery-hasclass/30
        return (el = el || this[0]) && classRE(cls).test(el.className);
    },
    addClass: function(cls) {
        cls = $.trim(cls).split(RE("\\s+"));
        return this.forEach(function(el) {
            var i = 0, cl = [], c;
            while (c = cls[i++]) {
                if (!this.hasClass(c, el)) {
                    cl.push(c);
                }
            }
            el.className = $.trim(el.className +" "+ cl.join(" "));
        });
    },
    removeClass: function(cls) {
        // remove all classes
        if (cls == "*") {
            return this.setClass("");
        }
        var i, c, cl = $.trim(cls).split(RE("\\s+"));
        return this.forEach(function(el) {
            i = 0;
            while (c = cl[i++]) {
                el.className = (""+ el.className).replace(classRE(c), " ");
            }
            el.className = $.trim(el.className);
        });
    },
    setClass: function(cls) {
        // remove all classes and set only `cls` one
        return this.forEach(function(el) {
            el.className = $.trim(cls);
        });
    },
    replaceClass: function(cls1, cls2) {
        return this.forEach(function(el) {
            el.className = $.trim((""+ el.className).replace(classRE(cls1), " "+ cls2 +" "));
        });
    },
    toggleClass: function(cls) {
        var els1 = [], els2 = [];
        this.forEach(function(el){
            if (this.hasClass(cls, el)) {
                els1.push(el);
            } else {
                els2.push(el);
            }
        });

        // remove existing class
        $.forEach(els1, function(el){
            el.className = $.trim((""+ el.className).replace(classRE(cls), " "));
        });

        // add non-existing class
        $.forEach(els2, function(el){
            el.className = $.trim(el.className +" "+ cls);
        });

        return this;
    }
});

// dom: data tools
$.extend(Dom.prototype, {
    data: function(key, val) {
        // set data
        // notation: $.dom(".foo").data("foo", "The foo!")
        // notation: $.dom(".foo").data({"foo": "The foo!"})
        if (typeof key == "object" || typeof val != "undefined") {
            var data = key;
            if (typeof data == "string") {
                data = {}, (data[key] = val);
            }
            return this.forEach(function(el) {
                el.$data = el.$data || {};
                for (var key in data) {
                    el.$data[key] = data[key];
                }
            });
        }

        // get data
        // notation: $.dom(".foo").data("foo")
        var el, data;
        if (el = this[0]) {
            el.$data = el.$data || {};
            data = el.$data[key];
        }
        return data;
    },
    removeData: function(key) {
        return this.forEach(function(el) {
            if (el.$data) {
                if (key == "*") {
                    delete el.$data; // remove all
                } else if (el.$data[key] !== undefined) {
                    delete el.$data[key];
                }
            }
        });
    },
    dataAttr: function(key, val) {
        return (val !== undefined)
            ? initDom(this[0]).setAttr("data-"+ key, val) : initDom(this[0]).getAttr("data-"+ key);
    },
    removeDataAttr: function(key){
        return initDom(this[0]).removeAttr("data-"+ key);
    }
});

// dom: form tools
$.extend(Dom.prototype, {
    buildQuery: function(plus /*internal*/) {
        var form = this[0], data = "";
        if (getTagName(form) == "form") {
            var data = [], i = 0, el, elType, elName;
            while (el = form.elements[i++]) {
                elType = $.trim(el.type).toLowerCase();
                elName = $.trim(el.name);
                if (!elType || !elName || el.disabled ||
                        (el.attributes && el.attributes.disabled != null &&
                            el.attributes.disabled.specified && el.attributes.disabled === true)) {
                    continue;
                }

                if ($.array.has(["select", "textarea", "button"], getTagName(el))) {
                    data.push(encodeURIComponent(elName) +"="+ encodeURIComponent(el.value));
                } else if ($.array.has(["radio", "checkbox"]) && el.checked) {
                    data.push(encodeURIComponent(elName) +"="+
                        (elType == "checkbox" ? (el.value != null ? el.value : "on") : encodeURIComponent(el.value)));
                } else {
                    data.push(encodeURIComponent(elName) +"="+ encodeURIComponent(el.value));
                }
            }
            data = data.join("&");
            if (plus !== false) {
                data = data.replace(/%20/g, "+");
            }
        }
        return data;
    },
    buildQueryArray: function() {
        var tmp = this.buildQuery(false), array = {};
        $.forEach(tmp.split("&"), function(a){
            a = a.split("="), array[decodeURIComponent(a[0])] = decodeURIComponent(a[1]);
        });
        return array;
    }
});

// dom: form element tools
$.extend(Dom.prototype, {
    checked: function(option){
        if (option == null) {
            return this[0] && !!this[0].checked;
        }
        return this.setAttr({checked: !!option});
    },
    selected: function(option){
        if (option == null) {
            return this[0] && !!this[0].selected;
        }
        return this.setAttr({selected: !!option});
    },
    disabled: function(option){
        if (option == null) {
            return this[0] && !!this[0].disabled;
        }
        return this.setAttr({disabled: !!option});
    },
    readonly: function(option){
        if (option == null) {
            return this[0] && !!this[0].readOnly;
        }
        return this.setAttr({readonly: !!option});
    }
});

// dom: iframe tools
$.extend(Dom.prototype, {
    getWindow: function(el /*internal*/){
        if (el = this[0]) {
            return initDom(el.contentWindow);
        }
    },
    getDocument: function(el /*internal*/){
        if (el = this[0]) {
            return initDom(el.contentDocument || el.contentWindow.document);
        }
    }
});

// dom: events
if ($.event) {
    $.forEach($.event, function(fn) {
        if (fn !== "toString") { // skip exposer
            Dom.prototype[fn] = function(type, callback) {
                if (type.indexOf(",") > -1) {
                    // multi events
                    var _this = this;
                    $.forEach(type.split(/\s*,\s*/), function(type) {
                        return _this.forEach(function(el) {
                            $.event[fn](el, type, callback);
                        });
                    });
                } else {
                    // single event
                    return this.forEach(function(el) {
                        $.event[fn](el, type, callback);
                    });
                }
            };
        }
    });
}

var defaultDisplays = {},
    ddIframe, ddIframeDoc;

// credits: http://jquery.com
function getDefaultDisplay(tagName) {
    var el, display = defaultDisplays[tagName];

    if (!display) {
        el = document.createElement(tagName);
        document.body.appendChild(el);
        display = defaultDisplays[tagName] = getStyle(el, "display");
        document.body.removeChild(el);

        if (!display || display == "none") {
            if (!ddIframe) {
                ddIframe = document.createElement("iframe");
                ddIframe.width = ddIframe.height = ddIframe.frameBorder = 0;
                document.body.appendChild(ddIframe);
            }

            if (!ddIframeDoc || !ddIframeDoc.createElement) {
                ddIframeDoc = (ddIframe.contentDocument || ddIframe.contentWindow.document);
                ddIframeDoc.write("<html><body></body></html>");
                ddIframeDoc.close();
            }

            el = ddIframeDoc.createElement(tagName);
            ddIframeDoc.body.appendChild(el);
            display = defaultDisplays[tagName] = getStyle(el, "display");
            document.body.removeChild(ddIframe);
        }
    }

    return display;
}

// dom: animations
if ($.animate) {
    $.extend(Dom.prototype, {
        animate: function(properties, duration, callback, easing) {
            // stop previous animation
            if (properties == "stop") {
                return this.forEach(function(el){
                    var animation = el.$animation;
                    if (animation && animation.running) {
                        animation.stop();
                    }
                });
            }
            // do animation
            return this.forEach(function(el) {
                $.animate(el, properties, duration, callback, easing);
            });
        },
        fade: function(to, duration, callback) {
            return this.animate({opacity: to}, duration, callback);
        },
        fadeIn: function(duration, callback) {
            return this.fade(1, duration, callback);
        },
        fadeOut: function(duration, callback) {
            // remove element after fading out
            if (callback === true || callback == "remove") {
                callback = function(el) {
                    $.dom(el).remove();
                };
            }
            return this.fade(0, duration, callback);
        },
        show: function(duration, callback) {
            return this.forEach(function(el) {
                if (!(el.offsetWidth || el.offsetHeight)) {
                    el.style.display = getDefaultDisplay(el.tagName);
                    $.animate(el, {opacity: 1}, duration || 0, callback);
                }
            });
        },
        hide: function(duration, callback) {
            return this.forEach(function(el) {
                if (el.offsetWidth || el.offsetHeight) {
                    $.animate(el, {opacity: 0}, duration || 0, function(){
                        el.style.display = "none";
                        callback && callback.call(this, el);
                    });
                }
            });
        },
        toggle: function(duration, callback) {
            return this.forEach(function(el) {
                if (!(el.offsetWidth || el.offsetHeight)) {
                    // show element
                    el.style.display = getDefaultDisplay(el.tagName);
                    $.animate(el, {opacity: 1}, duration || 0, callback);
                } else {
                    // hide element
                    $.animate(el, {opacity: 0}, duration || 0, function(){
                        el.style.display = "none";
                        callback && callback.call(this, el);
                    });
                }
            });
        },
        blip: function(duration) {
            return this.forEach(function(el){
                // `duration` is a must for this method
                $.animate(el, {opacity: 0}, duration, function(){
                    $.animate(el, {opacity: 1}, duration);
                });
            });
        }
    });
}

// add `dom` to so
$.dom = function(selector, root, i) {
    return initDom(selector, root, i);
};

// define exposer
$.toString("dom", "so.dom");

})(so);
