;(function($) {

"use strict"; // @tmp

var DOC = $.doc(),
    WIN = $.win(DOC),
    ie = $.browser.ie,
    ie_lt8 = ie && $.browser.version < 8,
    ie_lt9 = ie && $.browser.version < 9,
    re_tagName = /<([a-z]+)/i,
    re_tableChildren = /^(?:thead|tbody|tfoot|col|colgroup|caption)$/i,
    re_formChildren = /^(button|input|select|textarea)$/i,
    re_stateAttrs = /^(checked|disabled|selected|readonly)$/i,
    re_styleUnits = /^-?[\d\.]+(?:in|cm|mm|em|ex|pt|pc|%)/i,
    re_digit = /^-?[\d\.]+$/,
    re_bool = /^(true|false)$/,
    re_opacity = /opacity=(.*)?\)/i,
    re_rgb = /(.*?)rgb\((\d+),\s*(\d+),\s*(\d+)\)/,
    re_htmlContent = /^<[^>]*>|<[^>]*>.*?<\/[^>]>$/i,
    _pick = function(o,i,d) {o||(o={});var r=o[i]; if(d!==false) delete o[i]; return r},
    _re_cache = {}
;

function RE(re, flags, x /*internal*/) {
    x = re + (flags || "");
    if (!_re_cache[x]) {
        _re_cache[x] = new RegExp(re, flags);
    }

    // Simple GC
    setTimeout(function(){
        _re_cache = {};
    }, 60*1000);

    return _re_cache[x];
}

function isNode(node) {
    return node && node.nodeType &&
        (node.nodeType === 1 || node.nodeType === 3 || node.nodeType === 11);
}

function getNodeName(node) {
    return node && node.nodeName && node.nodeName.toLowerCase();
}

function getByTag(root, tag, i) {
    var els = root.getElementsByTagName(tag);
    return (i === true)
        ? $.array.make(els) : isNaN(i)
        ? els : els[i];
}

function fixTable(table, doc) {
    var els = getByTag(table, "tbody"),
        el, i = els.length;

    while (el = els[--i]) { // clean
        !el.childNodes.length
            && el.parentNode.removeChild(el);
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
    "html": function(el, val) { $.dom(el).setHtml(val); },
    "text": function(el, val) { $.dom(el).setText(val); },
    // Remember!!! data:{foo:"The foo!"}
    "data": function(el, val) { $.dom(el).data(val); },
    // Remember!!! style:{color:"blue"}
    "style": function(el, val) { $.dom(el).setStyle(val); }
};

function setAttributes(el, attrs) {
    if (el && el.nodeType === 1) {
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
                // Set attribute as boolean
                el[key] = (state = re_true.test(val));
                if (keyFixedDef) {
                    el[keyFixedDef] = state;
                }
                if (state) {
                    // Set proper attribute (e.g: disabled="disabled")
                    el.setAttribute(keyFixed, key);
                } else {
                    // Remove attribute
                    el.removeAttribute(keyFixed);
                }
                continue;
            }

            // Bind `on*` events
            (val && val.apply &&
                (el[key.toLowerCase()] = function() {
                    return val.apply(el, arguments);
                })
            // Or just set attribute
            ) || el.setAttribute(keyFixed, ""+ val);
        }
    }
    return el;
}

function cloneElement(el, deep) {
    var clone;
    deep = !(deep === false);
    clone = el.cloneNode(deep);
    // if (deep) // copy events?
    return clone;
}

function create(tag, attrs, doc) {
    return setAttributes(
        createElementSafe(tag, doc, _pick(attrs, "name")),
        attrs
    );
}

function createFragment(content, doc) {
    var tmp = doc.createElement("tmp"), // tmp?
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
        // Set name for IE
        element = doc.createElement("<"+ tag +" name='" + nameAttr + "'>");
    } else {
        element = doc.createElement(tag);
        if (nameAttr) element.setAttribute("name", ""+ nameAttr);
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
        return (tag = getNodeName(content))
                    && _return(tag, [content], fixedNodes[tag]);
    }

    if ($.typeOf(content) === "object") {
        return (tag = _pick(content, "tag"))
                    && _return(tag, [create(tag, content, doc)], fixedNodes[tag]);
    }

    tag = (re_tagName.exec(content) || [, ""])[1].toLowerCase();
    if (tag === "") { // Text node
        return _return("#text", [doc.createTextNode(content)]);
    }

    if (fix = fixedNodes[tag]) {
        content = fix.content.replace("#", content);
        frg = createFragment(content, doc).firstChild;
        dep = fix.dep;
        // Remove node (FF sets selected=true last option)
        if (fix.skip) {
            frg.removeChild(frg.firstChild);
        }
        while (--dep) frg = frg.firstChild;
    } else {
        frg = createFragment(content, doc);
    }

    return _return(tag, $.array.make(frg.childNodes), !!fix);
}

function insert(fn, el, content, rev) {
    var doc = $.doc(el),
        element = createElement(content, doc),
        nodes = element.nodes, node,
        scope, tBody, i = 0;

    // Set target as `tbody`, otherwise IE7 doesn't insert
    if (element.fixed && element.tag === "tr"
            && (tBody = getByTag(el, "tbody", 0)) != null) {
        el = tBody;
    }

    fn = insertFunctions[fn], scope = el;
    while (node = nodes[i++]) {
        // For insertBefore/After etc.
        if (rev) {
            scope = node; node = el;
        }
        fn.call(scope, node);
    }

    // Removes empty tbody's on IE (7-8)
    if (element.fixed && ie_lt9 && re_tableChildren.test(element.tag)) {
        fixTable(el, doc);
    }

    return nodes;
}

function cleanElement(el) {
    // @todo: Remove data & events
    // forEachRecursive(el.childNodes, cleanElement)
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
    return el;
}

// Credits: http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
function toPixel(el, key, value) {
    var left, leftRS;
    left = el.style.left;
    leftRS = el.runtimeStyle && el.runtimeStyle.left;
    leftRS && (el.runtimeStyle.left = el.currentStyle.left);
    el.style.left = (key === "fontSize") ? "1em" : value;
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
        var val, filter = el.style.filter || "";
        if (key == "opacity") {
            val = re_opacity.exec(filter) || [, 100];
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
    var sum = 0, i = 0, prop;
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
    if (color.substr(0, 1) === "#" || color.indexOf("rgb") === -1) {
        return color;
    }
    var nums = re_rgb.exec(color) || [, 0, 0, 0, 0],
        r = parseInt(nums[2], 10).toString(16),
        g = parseInt(nums[3], 10).toString(16),
        b = parseInt(nums[4], 10).toString(16);
    return "#"+ (
        (r.length === 1 ? "0"+ r : r) +
        (g.length === 1 ? "0"+ g : g) +
        (b.length === 1 ? "0"+ b : b)
    );
}

function getOffset(el, rel) {
    var tag = getNodeName(el);
    if (rel && (tag === "body" || tag === "html")) {
        return {top: 0, left: 0};
    }
    var rect = el.getBoundingClientRect ? el.getBoundingClientRect() : {},
        doc = $.doc(el),
        win = $.win(doc),
        docEl = doc.documentElement,
        docBody = doc.body,
        topScroll = win.pageYOffset || docEl.scrollTop,
        leftScroll = win.pageXOffset || docEl.scrollLeft;
    return {
        top: rect.top + topScroll -
                Math.max(0, docEl && docEl.clientTop, docBody.clientTop),
        left: rect.left + leftScroll -
                Math.max(0, docEl && docEl.clientLeft, docBody.clientLeft)
    };
}

function getScroll(el, type /*internal*/) {
    type = type || $.typeOf(el);

    var tag, scroll, doc, docEl, win;

    if (type === "window" || type === "document" ||
            ((tag = getNodeName(el)) && tag === "html" || tag === "body")) {
        // IE issue: Works only if `onscroll` called, does not work on `onload`
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

var uuidKey = "x-mii-uuid",
    dataKey = "x-mii-data-",
    re_dataKey = RE("^("+ dataKey +"[^=]*)$"),
    re_reduceDash = /-+/g,
    _data_cache = {};

function getUuid(el) {
    return el.getAttribute(uuidKey) || $.uuid();
}

function getDataKey(key) {
    return (key = key.replace(re_reduceDash, "-")) &&
                re_dataKey.test(key) ? key : dataKey + key;
}

// qwery integration
function QSA(s, root) { // @tmp
    // return (typeof s === "string") ? (root&&root.nodeType?root:DOC).querySelectorAll(s) : (s && s.nodeType) ? [s] : (s || [])
    return qwery(s, root);
}

function isDomInstance(x) {
    return (x instanceof Dom);
}

/*** The Dom! ***/
function Dom(nodes) {
    // Set length first
    this.length = 0;
    if (nodes) {
        nodes = (!nodes.nodeType && typeof nodes.length === "number") // For node list or arrays
                    && /*and*/ (!nodes.document || !nodes.document.nodeType)  // For window
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
    // Base methods...
    __init: function(selector, root, i) {
        if (isDomInstance(selector)) {
            return selector;
        }

        var typeofSelector = typeof selector;
        if (selector && typeofSelector === "object" &&
                !selector.nodeType && selector.length === undefined) {
            // Notation: $.dom({tag:"span"})
            selector = createElement(selector, DOC).nodes;
        } else if (typeofSelector === "string" &&
            (root && typeof root === "object" &&
                !root.nodeType && root.length === undefined)) {
            selector = $.trim(selector);
            // Notation: $.dom("span", {id: "foo"}) or $.dom("<span>", {id: "foo"})
            if (re_tagName.test(selector)) {
                selector = $.trim(RegExp.$1);
            }
            root.tag = selector;
            selector = createElement(root, DOC).nodes;
        } else if (typeofSelector === "string") {
            selector = $.trim(selector);
            if (re_htmlContent.test(selector)) {
                // Notation: $.dom("<span>")
                selector = createElement(selector, DOC).nodes;
            } else {
                selector = QSA(selector, root);
                if (!isNaN(i) && selector && selector.length) { // NodeList
                    selector = selector[i];
                }
            }
        }

        return new Dom(selector);
    },
    find: function(s, i) {
        return this[0] ? this.__init(s, this[0], i) : this;
    },
    not: function(s) {
        var type = $.typeOf(s), src, els = [];

        // Notation: $.dom("p").not(".red")
        if (s && (type === "string" || type === "object")) {
            src = this.__init(s).toArray();
            this.forEach(function(el, i){
                var e, j = 0;
                while (e = src[j++]) {
                    if (e === el) {
                        delete this[i];
                    }
                }
            });
            return this.__init(this.toArray());
        }

        // Notation: $.dom("p").not(0) or $.dom("p").not([0,1])
        if (type === "number" || type === "array") {
            s = $.array.make(s);
            this.forEach(function(el, i){
                if (!$.array.has(s, i)) {
                    els.push(el);
                }
            });
            return this.__init(els);
        }

        return this;
    },
    toArray: function() {
        return $.array.make(this);
    },
    forEach: function(fn) {
        return $.forEach(this, fn, this /*scope*/);
    },
    filter: function(fn) {
        return this.__init($.array.filter(this.toArray(), fn));
    },
    reverse: function() {
        // "clone" needs this sometimes (multiple clones)
        return this.__init(this.toArray().reverse());
    },
    item: function(i) {
        return this.__init(this[i]);
    },
    first: function() {
        return this.item(0);
    },
    last: function() {
        return this.item(this.length - 1);
    },
    nth: function(i) {
        return this.item(i);
    },
    get: function(i) {
        return this[i];
    }
};

// Dom: setters & getters
$.forEach(["append", "prepend", "before", "after", "replace"], function(fn) {
    Dom.prototype[fn] = function(content) {
        return this.forEach(function(el) {
            insert(fn, el, content);
        });
    };
});

$.forEach(["appendTo", "prependTo", "insertBefore", "insertAfter"], function(fn) {
    Dom.prototype[fn] = function(toEl) {
        return this.forEach(function(el) {
            if (!isDomInstance(toEl)) toEl = this.__init(toEl);
            toEl.forEach(function(to) {
                insert(fn, to, el /*content*/, true /*reverse*/);
            });
        });
    };
});

$.forEach({setHtml: "innerHTML", setText: textProp}, function(fn, prop) {
    Dom.prototype[fn] = function(content) {
        return this.forEach(function(el) {
            el[prop] = (content != null) ? content : "";
        });
    };
});

$.forEach({getHtml: "innerHTML", getText: textProp}, function(fn, prop) {
    Dom.prototype[fn] = function() {
        return this[0] && this[0][prop] || "";
    };
});

$.extend(Dom.prototype, {
    create: function(tag, attrs) {
        return this.__init(create(tag, attrs));
    },
    clone: function(deep) {
        var clones = [];
        this.forEach(function(el, i) {
            clones[i] = cloneElement(el, deep);
        });
        return this.__init(clones);
    },
    remove: function() {
        return this.forEach(function(el) {
            el = cleanElement(el);
            el.parentNode && el.parentNode.removeChild(el);
        });
    },
    empty: function() {
        return this.forEach(function(el) {
            return cleanElement(el);
        });
    }
});

// Dom: walkers
$.forEach({parent: "parentNode", prev: "previousSibling", next: "nextSibling"}, function(fn, node) {
    Dom.prototype[fn] = function() {
        var n = this[0] && this[0][node];
        while (n && n.nodeType !== 1) {
            n = n[node];
        }
        return this.__init(n);
    };
});

$.extend(Dom.prototype, {
    prevAll: function(src) {
        var el = this[0], els = [], j = 0, n, ns, tmp;
        if (el && el.parentNode) {
            ns = el.parentNode.childNodes;
            while (n = ns[j++]) {
                if (n === el) {
                    break;
                }
                n.nodeType === 1 && els.push(n);
            }
            if (typeof src === "string") {
                tmp = this.__init(src, el.parentNode).toArray();
                els = $.array.filter(tmp, function(e) {
                    for (var i = 0, len = els.length; i < len; i++) {
                        if (els[i] == e) return true;
                    }
                });
            }
        }
        return this.__init(els);
    },
    nextAll: function(src) {
        var el = this[0], els = [], j = 0, n, ns, tmp, found;
        if (el && el.parentNode) {
            ns = el.parentNode.childNodes;
            while (n = ns[j++]) {
                if (n === el) {
                    found = true;
                }
                found && n !== el && n.nodeType === 1 && els.push(n);
            }
            if (typeof src === "string") {
                tmp = this.__init(src, el.parentNode).toArray();
                els = $.array.filter(tmp, function(e) {
                    for (var i = 0, len = els.length; i < len; i++) {
                        if (els[i] == e) return true;
                    }
                });
            }
        }
        return this.__init(els);
    },
    children: function(i) {
        var el = this[0], els = [], j = 0, n, ns, type = typeof i;
        if (el) {
            if (i && type === "string") {
                els = this.__init(i, el);
            } else {
                ns = el.childNodes;
                while (n = ns[j++]) {
                    n.nodeType === 1 && els.push(n);
                }
                els = (type === "number") ? els[i] : els;
            }
        }
        return this.__init(els);
    },
    siblings: function(i) {
        var el = this[0], els = [], j = 0, n, ns, type = typeof i;
        if (el && el.parentNode) {
            if (i && type === "string") {
                this.__init(i, el.parentNode).forEach(function(e) {
                    if (e !== el && e.parentNode === el.parentNode) {
                        els.push(e);
                    }
                });
            } else {
                ns = el.parentNode.childNodes;
                while (n = ns[j++]) {
                    n !== el && n.nodeType === 1 && els.push(n);
                }
                els = (type === "number") ? els[i] : els;
            }
        }
        return this.__init(els);
    },
    contains: function(node, i) {
        var el = this[0];
        node = this.__init(node);
        node = isNaN(i) ? node[0] : node[i];
        if (el && node) {
            return el.contains
                ? el != node && el.contains(node)
                : !!(el.compareDocumentPosition(node) & 16);
        }
    }
});

// Dom: styles & dimensions
$.extend(Dom.prototype, {
    setStyle: function(key, val) {
        return this.forEach(function(el) {
            var styles = key, k, v;

            if (typeof styles === "string") {
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
                    if (re_digit.test(v) && !(k in nonuniteStyles)) v = v +"px";
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
        if (el && el.nodeType === 9) return this.dimensions("document").width;
        return this.innerWidth(el) - sumComputedPixels(el, ["paddingLeft", "paddingRight"]);
    },
    height: function() {
        var el = this[0];
        if (el && el.alert) return this.dimensions("window").height;
        if (el && el.nodeType === 9) return this.dimensions("document").height;
        return this.innerHeight(el) - sumComputedPixels(el, ["paddingTop", "paddingBottom"]);
    },
    dimensions: function(type /*internal*/) {
        var el = this[0];
        type = type || $.typeOf(el);
        if (type == "window") {
            var doc = el.document,
                docBody = doc.body,
                docEl = doc.documentElement,
                css1Compat = (doc.compatMode === "CSS1Compat");
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
            // Fix for IE
            if (ie && docEl.clientWidth >= docEl.scrollWidth) width = docEl.clientWidth;
            if (ie && docEl.clientHeight >= docEl.scrollHeight) height = docEl.clientHeight;
            return {width: width, height: height};
        }
        return {width: this.width(), height: this.height()};
    },
    viewport: function() {
        if ($.typeOf(this[0]) !== "window") {
            throw ("mii.dom.viewport(): This function only for `window`, use `mii.dom.dimensions()` instead.");
        }
        return this.dimensions();
    },
    offset: function(rel) {
        var el, type;
        if (el = this[0]) {
            type = $.typeOf(el);
            if (type === "window" || type === "document") {
                return {top: 0, left: 0};
            }
            if (rel) { // Get real & relative position
                var offset = getOffset(el), parentEl = el.parentNode,
                    parentOffset = getOffset(parentEl, rel);
                if (parentEl && parentEl.nodeType === 1) {
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
            // Get scroll top | left
            if (typeof top === "string") {
                return getScroll(el, type)[top];
            }
            // Get scroll top & left
            if (top == null && left == null) {
                return getScroll(el, type);
            }
            // Set scroll top & left
            var doc, win, tag;
            if (type === "window" || type === "document" ||
                    ((tag = getNodeName(el)) && tag === "html" || tag === "body")) {
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

// Dom: attributes & values
$.extend(Dom.prototype, {
    hasAttr: function(key, el /*internal*/) {
        if ((el = this[0]) == null) {
            return;
        }
        return el.hasAttribute ? el.hasAttribute(key)
            : (el.attributes[key] && el.attributes[key].specified) || el[key]; // IE7
    },
    setAttr: function(key, val) {
        return this.forEach(function(el) {
            var attrs = key;
            if (typeof attrs === "string") {
                attrs = {}, (attrs[key] = val || "");
            }
            if ("type" in attrs && ie_lt8) {
                throw ("mii.dom.setAttr(): `type` attribute can not be modified!");
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
                    val = el[key] === true || typeof el[key] !== "boolean"
                            && (val = el.getAttributeNode(key))
                                && val.nodeValue !== false ? key : null;
                } else {
                    val = el.getAttribute(fixedAttributes[key] || key);
                }
        }
        // IE7 (onclick etc.)
        if (ie && typeof val === "function") {
            val = /function.*?\(.*?\)\s*\{\s*(.*?)\s*\}/mi.exec(""+ val)
            val = val && val[1];
        }
        return (val !== null) ? val : undefined;
    },
    removeAttr: function(key) {
        if (key === "*") {
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

        var keys = $.trim(key).split(RE("\\s+")),
            i, keyFixed, keyFixedDef;

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
        val += "";
        return this.forEach(function(el) {
            var tag = getNodeName(el), i = 0, opt, valAttr;
            if (re_formChildren.test(tag)) {
                if (tag === "select") {
                    while (opt = el.options[i++]) {
                        if (opt.value === val) opt.selected = true;
                    }
                } else if (tag === "button" && ie_lt8) {
                    valAttr = $.doc(el).createAttribute("value");
                    valAttr.value = val;
                    el.setAttributeNode(valAttr);
                } else {
                    el.value = val;
                }
            }
        });
    },
    getValue: function(el /*internal*/) {
        if (el = this[0]) {
            var val, tag = getNodeName(el);
            if (tag === "select") {
                val = el.options[el.selectedIndex];
                val = (val.disabled || val.parentNode.disabled) ? null : val.value;
            } else if (tag === "button" && ie_lt8) {
                val = el.getAttributeNode("value");
                val = val && val.specified ? val.value : null;
            } else {
                val = el.value;
            }
            return (val != null) ? val : "";
        }
    }
});

// Dom: class tools
$.extend(Dom.prototype, {
    hasClass: function(cls, el /*internal*/) {
        // Thanks: jsperf.com/pure-js-hasclass-vs-jquery-hasclass/30
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
        if (cls === "*") {
            // Remove all classes
            return this.setClass("");
        }
        var c, cl = $.trim(cls).split(RE("\\s+")), i;
        return this.forEach(function(el) {
            i = 0;
            while (c = cl[i++]) {
                el.className = (""+ el.className).replace(classRE(c), " ");
            }
            el.className = $.trim(el.className);
        });
    },
    setClass: function(cls) {
        // Remove all classes and set only `cls` one
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

        // Remove existing class
        $.forEach(els1, function(el){
            el.className = $.trim((""+ el.className).replace(classRE(cls), " "));
        });

        // Add absent class
        $.forEach(els2, function(el){
            el.className = $.trim(el.className +" "+ cls);
        });

        return this;
    }
});

// Dom: data tools
$.extend(Dom.prototype, {
    data: function(key, val) {
        if (!this.length) return this;

        // Set data
        if (typeof key === "object" || typeof val !== "undefined") {
            var data = key, uuid;
            if (typeof data === "string") {
                data = {}, (data[key] = val);
            }
            return this.forEach(function(el) {
                uuid = getUuid(el);
                el.setAttribute(uuidKey, uuid);
                for (key in data) {
                    val = data[key], key = getDataKey(key);
                    if (typeof val === "function" || typeof val === "object") {
                        // Cache!!!
                        _data_cache[uuid] || (_data_cache[uuid] = {});
                        _data_cache[uuid][key] = val;
                    } else {
                        el.setAttribute(key, ""+ val);
                    }
                }
            });
        }

        // Get data
        key = getDataKey(key);
        var el = this[0],
            uuid = getUuid(el),
            attr = el.attributes[key],
            data = (attr && attr.specified) ? attr.value : (_data_cache[uuid] && _data_cache[uuid][key]),
            num;

        if (typeof data === "string") {
            switch (data) {
                case "null":
                    data = null;
                    break;
                case "true":
                case "false":
                    data = (data === "true") ? true : false;
                    break;
                default:
                    if (typeof (num = parseFloat(data)) === "number" && !isNaN(num)) {
                        data = num;
                    }
            }
        }
        return data;
    },
    removeData: function(key) {
        return this.forEach(function(el) {
            if (key === "*") {
                return this.removeDataAll();
            }
            var uuid = el.getAttribute(uuidKey);
            if (uuid !== null) { // Has uuid?
                key = getDataKey(key);
                if (_data_cache[uuid] && _data_cache[uuid][key]) {
                    try { delete _data_cache[uuid][key]; }
                        catch(e) { _data_cache[uuid][key] = null; }
                } else {
                    el.removeAttribute(key);
                }
            }
        });
    },
    removeDataAll: function() {
        return this.forEach(function(el) {
            var uuid = el.getAttribute(uuidKey), data, dataAttrs = [], i;
            if (uuid !== null) { // Has uuid?
                if (_data_cache[uuid]) {
                    try { delete _data_cache[uuid]; }
                        catch(e) { _data_cache[uuid] = null; }
                }
                for (i = el.attributes.length - 1; i >= 0; --i) {
                    re_dataKey.test(el.attributes[i].name) && dataAttrs.push(RegExp.$1);
                }
                for (i = dataAttrs.length - 1; i >= 0; --i) {
                    el.removeAttribute(dataAttrs[i]);
                }
            }
        });
    }
});

// Dom: form tools
$.extend(Dom.prototype, {
    builtQuery: function(ws2plus /*internal*/) {
        var form = this[0],
            data = [], i = 0,
            el, type, name, nodeName, attrs;
        // Only forms!!!
        if (form && getNodeName(form) === "form") {
            while (el = form.elements[i++]) {
                type = $.trim(el.type).toLowerCase();
                name = $.trim(el.name);
                attrs = el.attributes;
                nodeName = getNodeName(el);

                if (!type || !name || el.disabled ||
                        (attrs.disabled != null &&
                            attrs.disabled.specified && attrs.disabled === true)) {
                    continue;
                }

                if (/^(textarea|select|button)$/i.test(nodeName)) {
                    data.push(encodeURIComponent(name) +"="+
                                encodeURIComponent(el.value));
                } else {
                    switch (type) {
                        case "radio":
                        case "checkbox":
                            if (el.checked) {
                                data.push(encodeURIComponent(name) +"="+
                                    (type === "checkbox" ? "on" : encodeURIComponent(el.value)));
                            }
                            break;
                        default:
                            data.push(encodeURIComponent(name) +"="+ encodeURIComponent(el.value));
                    }
                }
            }
        }
        data = data.join("&");
        if (ws2plus !== false) {
            data = data.replace(/%20/g, "+");
        }
        return data;
    },
    builtQueryArray: function() {
        var tmp = this.builtQuery(false), array = {};
        $.forEach(tmp.split("&"), function(a){
            a = a.split("=");
            array[decodeURIComponent(a[0])] = decodeURIComponent(a[1]);
        });
        return array;
    }
});

// Dom: events
if ($.event) {
    $.forEach($.event, function(fn) {
        if (fn !== "toString") { // Skip exposer
            Dom.prototype[fn] = function(type, callback) {
                var _this = this;
                if (type.indexOf(",") > -1) {
                    // Multi events
                    $.forEach(type.split(/\s*,\s*/), function(type) {
                        return _this.forEach(function(el) {
                            $.event[fn](el, type, callback);
                        });
                    });
                } else {
                    // Single event
                    return _this.forEach(function(el) {
                        $.event[fn](el, type, callback);
                    });
                }
            };
        }
    });
}

var defaultDisplays = {},
    ddIframe, ddIframeDoc;

// Credits: http://jquery.com
function getDefaultDisplay(tagName) {
    var el, ddIframeDoc,
        display = defaultDisplays[tagName];

    if (!display) {
        el = document.createElement(tagName);
        document.body.appendChild(el);
        display = defaultDisplays[tagName] = getStyle(el, "display");
        document.body.removeChild(el);

        if (!display || display === "none") {
            if (!ddIframe) {
                ddIframe = document.createElement("iframe");
                ddIframe.width = ddIframe.height = ddIframe.frameBorder = 0;
                document.body.appendChild(ddIframe);
            }

            if (!ddIframeDoc || !ddIframeDoc.createElement) {
                ddIframeDoc = (ddIframe.contentWindow || ddIframe.contentDocument).document;
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

// Dom: animations
if ($.animate) {
    $.extend(Dom.prototype, {
        animate: function(properties, duration, fn) {
            return this.forEach(function(el) {
                $.animate(el, properties, duration, fn);
            });
        },
        fade: function(to, duration, fn) {
            return this.animate({opacity: to}, duration, fn);
        },
        fadeIn: function(duration, fn) {
            return this.fade(1, duration, fn);
        },
        fadeOut: function(duration, fn) {
            if (fn === true || fn === "remove") {
                fn = function(el) {
                    $.dom(el).remove();
                };
            }
            return this.fade(0, duration, fn);
        },
        show: function(duration, fn) {
            return this.forEach(function(el) {
                if (!(el.offsetWidth || el.offsetHeight)) {
                    el.style.display = getDefaultDisplay(el.tagName);
                    $.animate(el, {opacity: 1}, duration || 0, fn);
                }
            });
        },
        hide: function(duration, fn) {
            return this.forEach(function(el) {
                if (el.offsetWidth || el.offsetHeight) {
                    $.animate(el, {opacity: 0}, duration || 0, function(){
                        el.style.display = "none";
                        fn && fn.call(this);
                    });
                }
            });
        },
        toggle: function(duration, fn) {
            return this.forEach(function(el) {
                if (!(el.offsetWidth || el.offsetHeight)) {
                    // Show element
                    el.style.display = getDefaultDisplay(el.tagName);
                    $.animate(el, {opacity: 1}, duration || 0, fn);
                } else {
                    // Hide element
                    $.animate(el, {opacity: 0}, duration || 0, function(){
                        el.style.display = "none";
                        fn && fn.call(this);
                    });
                }
            });
        },
        blip: function(duration) {
            return this.forEach(function(el){
                // "duration" is a must for this method
                $.animate(el, {opacity: 0}, duration, function(){
                    $.animate(el, {opacity: 1}, duration);
                });
            });
        }
    });
}

// Add `dom` to mii
$.dom = function(selector, root, i) {
    return (new Dom).__init(selector, root, i);
};

// Define exposer
$.toString("dom", "mii.dom");

})(mii);
