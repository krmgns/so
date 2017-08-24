/**
 * @name: so.ext.cookie
 * @deps: so
 * @vers: 1.1.0
 * @cred: https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
 */

!function(e){var n={getItem:function(e){return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*"+encodeURIComponent(e).replace(/[\-\.\+\*]/g,"\\$&")+"\\s*\\=\\s*([^;]*).*$)|^.*$"),"$1"))||null},setItem:function(e,n,t,o,r,i){if(!e||/^(?:expires|max\-age|path|domain|secure)$/i.test(e))return!1;var c="";if(t)switch(t.constructor){case Number:c=t===1/0?"; expires=Fri, 31 Dec 9999 23:59:59 GMT":"; max-age="+t;break;case String:c="; expires="+t;break;case Date:c="; expires="+t.toUTCString()}var s=encodeURIComponent(e)+"="+encodeURIComponent(n)+c+(r?"; domain="+r:"")+(o?"; path="+o:"")+(i?"; secure":"");return document.cookie=s,!0},removeItem:function(e,n,t){return!(!e||!this.hasItem(e))&&(document.cookie=encodeURIComponent(e)+"=; expires=Thu, 01 Jan 1970 00:00:00 GMT"+(t?"; domain="+t:"")+(n?"; path="+n:""),!0)},hasItem:function(e){return new RegExp("(?:^|;\\s*)"+encodeURIComponent(e).replace(/[\-\.\+\*]/g,"\\$&")+"\\s*\\=").test(document.cookie)},keys:function(){for(var e=document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g,"").split(/\s*(?:\=[^;]*)?;\s*/),n=0;n<e.length;n++)e[n]=decodeURIComponent(e[n]);return e}};e.ext.cookie={expiryTimes:{"-1":-1,"1 hour":3600,"1 day":86400,"1 week":604800,"1 month":2592e3,"1 year":31536e3},options:{expires:0,path:"/",domain:null,secure:!1},set:function(t,o,r){r=e.extend({},this.options,r),n.setItem(t,o,this.expiryTimes[r.expires],r.path,r.domain,r.secure)},get:function(n){if(document.cookie.length){var t,o,r,i=document.cookie.split("; "),c=new RegExp("^"+e.trimSpace(n)+"=([^;]*)");for(r=0;t=i[r];r++)if((o=t.match(c))&&o[1])return unescape(o[1])}return null},remove:function(t,o){o=e.extend({},this.options,o),n.removeItem(t,o.path,o.domain)},check:function(e){return null!=this.get(e)}}}(so);
