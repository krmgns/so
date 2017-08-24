/**
 * @name: so.ext.cookie
 * @deps: so
 * @vers: 1.1.0
 * @cred: https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
 */

;(function($){

var docCookies = {
  getItem: function (sKey) {
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
        case Number:
          sExpires = (vEnd === Infinity) ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
          break;
        case String:
          sExpires = "; expires=" + vEnd;
          break;
        case Date:
          sExpires = "; expires=" + vEnd.toUTCString();
          break;
      }
    }
    var cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    document.cookie = cookie;
    return true;
  },
  removeItem: function (sKey, sPath, sDomain) {
    if (!sKey || !this.hasItem(sKey)) { return false; }
    document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ( sDomain ? "; domain=" + sDomain : "") + ( sPath ? "; path=" + sPath : "");
    return true;
  },
  hasItem: function (sKey) {
    return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
  },
  keys: /* optional method: you can safely remove it! */ function () {
    var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
    for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
    return aKeys;
  }
};

var fn_expiresDate = function(expires) {
    if (expires === "") {
        throw ("Invalid expires parameter!");
    }
    if (typeof expires === "string") {
        expires = $.cookie.expiryTimes[expires];
    } else if (expires == null) {
        expires = -1;
    } else {
        expires = parseInt(expires, 10);
    }
    var date = new Date();
    date.setTime(date.getTime() + expires * 1000);
    return date.toUTCString();
};

$.ext.cookie = {
    expiryTimes: {
        "-1"     : -1,
        "1 hour" : 3600,
        "1 day"  : 86400,
        "1 week" : 86400 * 7,
        "1 month": 86400 * 30,
        "1 year" : 86400 * 365
    },
    options: {
        expires: 0, path: "/", domain: null, secure: false
    },
    set: function(name, value, options) {
        options = $.extend({}, this.options, options);
        docCookies.setItem(name, value, this.expiryTimes[options.expires],
            options.path, options.domain, options.secure);
    },
    get: function(name) {
        if (document.cookie.length) {
            var s = document.cookie.split("; "), p, m, i,
                r = new RegExp("^"+ $.trimSpace(name) +"=([^;]*)");
            for (i = 0; p = s[i]; i++) {
                m = p.match(r);
                if (m && m[1]) {
                    return unescape(m[1]);
                }
            }
        }
        return null;
    },
    remove: function(name, options) {
        options = $.extend({}, this.options, options);
        docCookies.removeItem(name, options.path, options.domain);
    },
    check: function(name) {
        return (null != this.get(name));
    }
};

})(so);
