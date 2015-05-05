/**
 * @name            : so.js
 * @version         : v4.0.4
 * @description     : Multipurpose JavaScript library. <https://github.com/qeremy/so>
 * @copyright       : Kerem Gunes (2013)
 * @license         : MIT license <http://opensource.org/licenses/MIT>
 *
 * Internal Modules : so.js (base), so.ext.js, so.array.js, so.object.js, so.event.js, so.animate.js, so.dom.js, so.ajax.js
 * External Modules : qwery.js <https://github.com/ded/qwery>
 * Compress Tool    : <http://jscompress.com>
 */

function log(s) { console.log(s); } // @tmp

// so.js
!function(n,e){"use strict";function t(){for(;c.length;)c.shift()(a)}var r=n.document,o={}.toString,i=/^\s+|\s+$/g,u={firefox:/firefox\/([\d\.]+)/,chrome:/chrome\/([\d\.]+)/,safari:/webkit.*?version\/([\d\.]+)/,opera:/opera.*?version\/([\d\.]+)/,ie:/msie\s+([\d\.]+)/},f=0,a={fun:function(){return function(){}},now:function(){return Date.now?Date.now():(new Date).getTime()},uuid:function(){return++f},win:function(e){return e?e==e.window?e:9===e.nodeType?e.defaultView||e.parentWindow:null:n},doc:function(n){return n&&n.ownerDocument||r},trim:function(n){return null!=n?(""+n).replace(i,""):""},typeOf:function(n){return null===n?"null":n===e||"undefined"==typeof n?"undefined":n.alert&&n==n.window?"window":9===n.nodeType?"document":o.call(n).slice(8,-1).toLowerCase()},isSet:function(n,e){return null==e?null!=n:null!=n[e]},isEmpty:function(n){var e,t=this.typeOf(n);if(!n||"undefined"===t)return!0;if("array"===t||"number"==typeof n.length)return!n.length;if("object"===t){for(e in n)return!1;return!0}return!1},forEach:function(n,t,r){var o,i=n&&n.length;if(i!==e)for(o=0;i>o&&t.call(r||n[o],n[o],o,n)!==!1;o++);else for(o in n)if(t.call(r||n[o],o,n[o],n)===!1)break;return r||n},mix:function(){var n,e,t=arguments,r=1;if(t.length<2)throw"so.mix(): Function accepts at least 2 arguments.";for(n=t[0];e=t[r++];)for(var o in e)e.hasOwnProperty(o)&&(n[o]=e[o]);return n},extend:function(n,e){var t=typeof n,r=typeof e;return"object"===t&&"undefined"===r?(e=n,n=this):"string"===t&&(n=this[n]?this[n]:this[n]={}),this.mix(n,e)},toString:function(){var n=arguments;return n.length?void(this[n[0]].toString=function(){return"[object "+n[1]+"]"}):"[object so]"}},c=[];a.onReady=function(n){return"function"==typeof n&&c.push(n),r.addEventListener?r.addEventListener("DOMContentLoaded",function e(){r.removeEventListener("DOMContentLoaded",e,!1),t()},!1):void(r.onreadystatechange=function(){"complete"===this.readyState&&(r.onreadystatechange=null,t())})},a.browser=function(){var e,t,r=n.navigator.userAgent.toLowerCase(),o={};for(e in u)if(t=u[e].exec(r))break;return o[e]=!0,o.version=parseFloat(t&&t[1]),o.versionOrig=t[1],o}(),a.ext={},a.array={},a.object={},n.so=a}(window);

// so.ext.js
!function(e){"use strict";e.extend(e.ext,{camelizeStyleProperty:function(e){return(""+e).replace(/-([a-z])/gi,function(e,t){return t.toUpperCase()})},dasherizeStyleProperty:function(e){return(""+e).replace(/([A-Z])/g,function(e,t){return"-"+t.toLowerCase()})}}),e.toString("ext","so.ext")}(so);

// so.array.js
!function(r){"use strict";function t(t){if("array"===r.typeOf(t))return t;var e=0,a=[];if(!t||"string"==typeof t||t.nodeType||void 0===t.length||t==window)a=[t];else try{a=n.call(t)}catch(o){for(;e<t.length;)a.push(t[e++])}return a}var n=[].slice;r.extend(r.array,{make:function(){for(var r=0,n=arguments.length,e=[];n>r;)e=e.concat(t(arguments[r++]));return e},filter:function(r,t){var n=0,e=r.length,a=[];for(n;e>n;n++)t.call(r,r[n],n)&&a.push(r[n]);return a},has:function(r,t){for(var n=r.length-1;n>=0;n--)if(t==r[n])return!0;return!1}}),r.toString("array","so.array")}(so);

// so.object.js
!function(r){"use strict";r.extend(r.object,{filter:function(r,n){for(var t in r)n.call(r,r[t],t)||delete r[t];return r},hasKey:function(r,n){for(var t in r)if(n==t)return!0;return!1},hasVal:function(r,n){for(var t in r)if(n==r[t])return!0;return!1},keys:function(r){var n,t=[];for(n in r)t.push(n);return t},vals:function(r){var n,t=[];for(n in r)t.push(r[n]);return t},pick:function(r,n,t){r||(r={});var e=r[n];return t!==!1&&delete r[n],e}}),r.toString("object","so.object")}(so);

// so.event.js
!function(e){"use strict";var t=function(){function e(e){return"so.event.custom."+e}function t(e){return e.preventDefault=f,e.stopPropagation=E,e.target=e.srcElement,e.relatedTarget=e.fromElement,e.keyCode=e.which,e}function n(e){e=e||t(((this.ownerDocument||this.document||this).parentWindow||window).event);var n,o,r=!0,v=this.$events[e.type];for(o in v)n=v[o],n&&n.call(this,e)===!1&&(r=!1);return r}function o(e,t,o){e.$events=e.$events||{},e.$events[t]||(e.$events[t]={},e["on"+t]&&(e.$events[t][0]=e["on"+t])),o.$i=o.$i||a++,e.$events[t][o.$i]=o,e.addEventListener?e.addEventListener(t,o,!1):e["on"+t]=n}function r(e,t,n){e.removeEventListener?e.removeEventListener(t,n,!1):e.$events&&e.$events[t]&&delete e.$events[t][n.$i]}function v(e,t,n){var v;o(e,t,v=function(){return r(e,t,v),n.apply(e,arguments)})}function i(t,n){if("function"==typeof t[n])return t[n].call(t);var o;return(o=t[e(n)])?s(t,n,o):document.createEventObject?(o=document.createEventObject(),o.type=n,t.fireEvent("on"+o.type,o)):(o=document.createEvent("Event"),o.initEvent(n,!0,!0),!t.dispatchEvent(o))}function c(t,n,r){var v,i=e(n);document.createEventObject?(v=document.createEventObject(),v.type=n,t[i]||o(t,n,r)):(v=document.createEvent("Event"),v.initEvent(n,!0,!0),t[i]||o(t,n,r)),t[i]=v}function u(t,n){t[e(n)]=-1}function s(t,n,o){return o=o||t[e(n)],o&&-1!==o?t.fireEvent?t.fireEvent("on"+n,o):!t.dispatchEvent(o):void 0}var a=0,f=function(){this.returnValue=!1},E=function(){this.cancelBubble=!0};return{on:o,off:r,once:v,fire:i,addEvent:o,removeEvent:r,invokeEvent:i,addCustomEvent:c,removeCustomEvent:u,invokeCustomEvent:s}}();e.event=t,e.toString("event","so.event")}(so);

// so.animate.js
!function(t){"use strict";function s(t){setTimeout(t,1e3/i)}function e(s,e,i,n){this.el=t.dom(s),this.callback=n,this.duration="number"==typeof i?i:l[i]||o,this.running=!1,this.stopped=!1,this.animations=[];var r,a,p,h;for(r in e)e.hasOwnProperty(r)&&(p=e[r],r=t.ext.camelizeStyleProperty(r),h="scrollTop"===r||"scrollLeft"===r,a=h?parseFloat(this.el.scroll(r.substring(6).toLowerCase())):parseFloat(this.el.getStyle(r))||0,this.animations.push({property:r,stopValue:p,startValue:a,diff:Math.abs(p-a),reverse:a>p,isScroll:h}))}var i=60,o=350,l={fast:150,slow:750},n=function(t,s,e,i){return-e*(t/=i)*(t-2)+s};e.prototype.animate=function(e){this.stop(),this.easing=t.ext.easing&&t.ext.easing[e]||n,this.running=!0,this.stopped=!1,this.startTime=t.now(),this.elapsedTime=0,this.el[0].$animation=this;var i=this;return function o(){i.stopped||(i.elapsedTime<i.duration?(s(o),i._start()):(i._end(),i.stop()))}(),this},t.extend(e.prototype,{_start:function(){var s,e,i,o=0,l=0,n=this.el,r=this.animations;for(this.elapsedTime=t.now()-this.startTime;s=r[o++];)l=this.easing.call(null,this.elapsedTime,0,s.diff,this.duration),l=s.reverse?s.startValue-l:s.startValue+l,s.isScroll?(i="BODY"===n[0].tagName||"HTML"===n[0].tagName,"scrollTop"===s.property?((e=l+n[0].scrollTop)&&!i&&(e/=2),n.scroll(e,n.scroll("left"))):((e=l+n[0].scrollLeft)&&!i&&(e/=2),n.scroll(n.scroll("top"),e))):n.setStyle(s.property,l.toFixed(20))},_end:function(){for(var t,s=0,e=this.el,i=this.animations;t=i[s++];)t.isScroll?"scrollTop"===t.property?e.scroll(t.stopValue,e.scroll("left")):e.scroll(e.scroll("top"),t.stopValue):e.setStyle(t.property,t.stopValue);"function"==typeof this.callback&&this.callback(this.el[0],this)},stop:function(){return this.running&&(this.running=!1,this.stopped=!0),this.el[0].$animation=null,this}}),t.animate=function(t,s,i,o,l){return"string"==typeof o&&(l=o),new e(t,s,i,o).animate(l)},t.toString("animate","so.animate")}(so);

// so.ajax.js
!function($){"use strict";function createRequest(){for(var e=xmlHttpObjects.length;e--;)try{return xmlHttpObjects[e]()}catch(t){continue}}function toJson(input){if(!input||"string"!=typeof input)return null;if(input=$.trim(input),!re_validJson.test(input))throw"No valid JSON data provided!";return window.JSON&&window.JSON.parse?window.JSON.parse(input):eval("("+input+")")}function toXml(e){if(e&&9===e.nodeType)return e;if(!e||"string"!=typeof e)return null;var t;return DOMParser?t=(new DOMParser).parseFromString(e,"text/xml"):(t=new ActiveXObject("Microsoft.XMLDOM"),t.async="false",t.loadXML(e)),t}function parseResponseHeaders(e){if(e){for(var t,r,n=e.split("\r\n"),s={};t=n.shift();)r=t.split(":",2),s[r[0].toLowerCase()]=$.trim(r[1]);return s}}function Ajax(e){var t,r=[];if(this.$xhr=createRequest(),e.headers&&(defaultOptions.requestHeaders=$.mix({},defaultOptions.requestHeaders,e.headers),delete e.headers),e=$.mix({},defaultOptions,e),e.method&&(e.method=e.method.toUpperCase()),"localhost"===location.host&&e.url&&"/"==e.url.charAt(0)&&(e.url=e.url.substring(1)),e.data){if("object"===$.typeOf(e.data)){for(t in e.data)e.data.hasOwnProperty(t)&&r.push(encodeURIComponent(t)+"="+encodeURIComponent(e.data[t]));r=r.join("&").replace(/%20/g,"+")}else r=e.data;"GET"==e.method?""!=e.url?e.url=e.url+=-1===e.url.indexOf("?")?"?"+r:"&"+r:e.url+="?"+r:e.data=r}return"GET"==e.method&&e.noCache!==!1&&(e.url+=-1===e.url.indexOf("?")?"?_="+$.now():"&_="+$.now()),e.url=e.url.replace(re_query,"?$1"),this.options=e,this.isAborted=this.isSent=this.isDone=!1,e.autoSend!==!1?this.send():void 0}function request(e,t,r,n,s){if(e=re_theRequest.exec($.trim(e))||[,"",""],"function"==typeof t){var o=$.array.make(arguments);t=r=n=s=void 0,r=o[1],n=o[2],s=o[3]}return new Ajax({method:$.trim(e[1])||defaultOptions.method,url:$.trim(e[2]),data:t,onSuccess:r||defaultOptions.onSuccess,onError:n||defaultOptions.onError,onComplete:s||defaultOptions.onComplete})}var re_validJson=/^\{.*?\}|\[.*?\]$/,re_theRequest=/^([a-z]+?\s+|)(.*?)$/i,re_query=/\?&(.*)/,xmlHttpObjects=[function(){return new ActiveXObject("Microsoft.XMLHTTP")},function(){return new ActiveXObject("Msxml3.XMLHTTP")},function(){return new ActiveXObject("Msxml2.XMLHTTP")},function(){return new XMLHttpRequest}],xmlHttpStatuses={UNSENT:0,OPENED:1,HEADERS_RECEIVED:2,LOADING:3,DONE:4},defaultOptions={autoSend:!0,url:"",method:"GET",async:!0,data:null,dataType:"json",noCache:!0,requestHeaders:{"X-Requested-With":"XMLHttpRequest"},responseHeaders:{},onStart:$.fun,onStop:$.fun,onComplete:$.fun,onProgress:$.fun,onSuccess:$.fun,onError:$.fun,onAbort:$.fun,beforeSend:null,afterSend:null};Ajax.prototype={send:function(){var e,t=this,r=this.options;if(this.isSent||this.isAborted)return this;this.$xhr.open(r.method,r.url,r.async),"GET"!=r.method&&r.data&&r.data.length&&this.$xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");for(e in r.requestHeaders)r.requestHeaders.hasOwnProperty(e)&&this.$xhr.setRequestHeader(e,r.requestHeaders[e]);return r.async&&(this.$xhr.onreadystatechange=function(){t._handleResponse(t,r)}),"function"==typeof r.beforeSend&&r.beforeSend.call(this,this.$xhr),this.$xhr.send(r.data),"function"==typeof r.afterSend&&r.afterSend.call(this,this.$xhr),r.async||this._handleResponse(this,r),this.isSent=!0,r.timeout&&setTimeout(function(){t.abort()},r.timeout),this},abort:function(){this.isAborted=!0,this.$xhr.abort(),this.options.onAbort.call(this,this.$xhr)},_handleResponse:function(e,t){if(e.isAborted)return void(e.$xhr.onreadystatechange=null);switch(e.$xhr.readyState){case xmlHttpStatuses.OPENED:t.onStart.call(e,e.$xhr);break;case xmlHttpStatuses.HEADERS_RECEIVED:"function"==typeof e.$xhr.getAllResponseHeaders&&(t.responseHeaders=parseResponseHeaders(e.$xhr.getAllResponseHeaders()));break;case xmlHttpStatuses.LOADING:t.onProgress.call(e,e.$xhr);break;case xmlHttpStatuses.DONE:e.isDone=!0,e.readyState=e.$xhr.readyState,e.statusCode=e.$xhr.status,e.statusText=e.$xhr.statusText;var r="xml"==t.dataType?e.$xhr.responseXML||e.$xhr.responseText:e.$xhr.responseText;"json"==t.dataType?r=toJson(r):"xml"==t.dataType&&(r=toXml(r));var n=e.$xhr.status;"function"==typeof t[n]&&t[n].call(e,r,e.$xhr),n>=100&&400>n?t.onSuccess.call(e,r,e.$xhr):t.onError.call(e,r,e.$xhr),t.onComplete.call(e,r,e.$xhr),e.$xhr.onreadystatechange=null}},setRequestHeader:function(e,t){if("object"==typeof e)for(var r in e)e.hasOwnProperty(r)&&(this.options.requestHeaders[r]=e[r]);else this.options.requestHeaders[e]=t;return this},getResponseHeader:function(e){return this.options.responseHeaders[e.toLowerCase()]},getResponseHeaderAll:function(){return this.options.responseHeaders}},$.ajax=function(e,t,r,n,s){if("string"==typeof e)return request(e,t,r,n,s);if("function"==typeof t){var o=$.array.make(arguments);t=r=n=s=void 0,r=o[1],n=o[2],s=o[3]}return e=$.mix(e,{onSuccess:r||e.onSuccess||defaultOptions.onSuccess,onError:n||e.onError||defaultOptions.onError,onComplete:s||e.onComplete||defaultOptions.onComplete}),new Ajax(e)},$.forEach({get:"GET",post:"POST",load:"GET"},function(e,t){$.ajax[e]=function(e,r,n,s,o){return request(t+" "+e,r,n,s,o)}}),$.toString("ajax","so.ajax")}(so);

// so.dom.js
!function(t){"use strict";function e(t,e,n){return n=t+(e||""),F[n]||(F[n]=new RegExp(t,e)),setTimeout(function(){F={}},6e4),F[n]}function n(t){return t&&t.nodeType&&(1===t.nodeType||11===t.nodeType)}function i(t){return t&&t.nodeName&&t.nodeName.toLowerCase()}function o(e,n,i){var o=e.getElementsByTagName(n);return i===!0?t.array.make(o):isNaN(i)?o:o[i]}function r(e,n){for(var i,r=o(e,"tbody"),a=r.length;i=r[--a];)!i.childNodes.length&&i.parentNode.removeChild(i);t.forEach(o(e,"tbody",!0),function(t){for(i=n.createElement("tbody");t.firstChild;)i.appendChild(t.firstChild);e.replaceChild(i,t)})}function a(t,e){if(t&&1===t.nodeType){var n,i,o,r,a,s=/^(1|true)$/;for(o in e)n=M[o]||o,i=M["default"+o],n&&(r=null!=(r=e[o])?r:"",o in j?j[o](t,r):k.test(o)?(t[o]=a=s.test(r)||""!=r,i&&(t[i]=a),a?t.setAttribute(n,o):t.removeAttribute(n)):r&&r.apply&&(t[o.toLowerCase()]=function(){return r.apply(t,arguments)})||t.setAttribute(n,""+r))}return t}function s(e,n){n=n!==!1;var i=e.cloneNode(!1);return n&&(e.childNodes.length&&t.forEach(e.childNodes,function(t){i.appendChild(s(t,n))}),i=c(e,i)),i}function c(e,n){return e.$events&&t.forEach(e.$events,function(e,i){t.forEach(i,function(i,o){t.event.on(n,e,o)})}),n}function f(t,e){for(;e=t.firstChild;)void 0!==e.$data&&delete e.$data,void 0!==e.$events&&delete e.$events,f(e),t.removeChild(e);return t}function l(t,e){var n=e.createElement("so-tmp"),i=e.createDocumentFragment();for(n.innerHTML=t;n.firstChild;)i.appendChild(n.firstChild);return i}function u(e,o){var r,a,s,c,f=function(t,e,n){return{tag:t,nodes:e,fixed:!!n}};if(C(e))return f("Dom",e.toArray());if(n(e))return(c=i(e))&&f(c,[e],z[c]);if(c=(W.exec(e)||[,""])[1].toLowerCase(),""===c)return f("#text",[o.createTextNode(e)]);if(a=z[c])for(e=a.content.replace("#",e),r=l(e,o).firstChild,s=a.dep,a.skip&&r.removeChild(r.firstChild);--s;)r=r.firstChild;else r=l(e,o);return f(c,t.array.make(r.childNodes),!!a)}function d(e,n,i,a){var s,c,f,l=t.doc(n),d=u(i,l),h=d.nodes,p=0;for(d.fixed&&"tr"===d.tag&&null!=(f=o(n,"tbody",0))&&(n=f),e=V[e],c=n;s=h[p++];)a&&(c=s,s=n),e.call(c,s);return d.fixed&&S&&H.test(d.tag)&&r(n,l),h}function h(t,e,n){var i,o;return i=t.style.left,o=t.runtimeStyle&&t.runtimeStyle.left,o&&(t.runtimeStyle.left=t.currentStyle.left),t.style.left="fontSize"===e?"1em":n,n=t.style.pixelLeft,t.style.left=i,o&&(t.runtimeStyle.left=o),n+"px"}function p(t,e){for(var n,i=0,o=0;n=e[i++];)o+=parseFloat(P(t,n))||0;return o}function m(e){return t.ext.camelizeStyleProperty(e)}function y(n){var i,o={};for(n=(""+n).split(e("\\s*;\\s*"));n.length;)(i=n.shift().split(e("\\s*:\\s*")))&&(i[0]=t.trim(i[0]))&&(o[i[0]]=i[1]||"");return o}function g(t){if("#"===t.charAt(0)||-1===t.indexOf("rgb"))return t;var e=O.exec(t)||[,0,0,0,0],n=parseInt(e[2],10).toString(16),i=parseInt(e[3],10).toString(16),o=parseInt(e[4],10).toString(16);return"#"+((1===n.length?"0"+n:n)+(1===i.length?"0"+i:i)+(1===o.length?"0"+o:o))}function v(e,n){var o=i(e),r={top:0,left:0};if(n&&("body"===o||"html"===o))return r;var a=e.getBoundingClientRect?e.getBoundingClientRect():r,s=t.doc(e),c=t.win(s),f=s.documentElement,l=s.body,u=c.pageYOffset||f.scrollTop,d=c.pageXOffset||f.scrollLeft;return{top:a.top+u-Math.max(0,f&&f.clientTop,l.clientTop),left:a.left+d-Math.max(0,f&&f.clientLeft,l.clientLeft)}}function b(e,n){n=n||t.typeOf(e);var o,r,a,s,c;return"window"===n||"document"===n||(o=i(e))&&"html"===o||"body"===o?(a=t.doc(e),c=t.win(a),s=a.documentElement,r={top:c.pageYOffset||s.scrollTop,left:c.pageXOffset||s.scrollLeft}):r={top:e.scrollTop,left:e.scrollLeft},r}function N(t){return e("(^|\\s)"+t+"(\\s|$)")}function E(t,e){return qwery(t,e)}function C(t){return t instanceof w}function w(t){if(this.length=0,t){t=t.nodeType||"number"!=typeof t.length||t.document&&t.document.nodeType?[t]:t;for(var e=0,n=t.length;n>e;e++)t[e]&&(this[this.length++]=t[e])}return this}function x(t){var e,n=Y[t];return n||(e=document.createElement(t),document.body.appendChild(e),n=Y[t]=P(e,"display"),document.body.removeChild(e),n&&"none"!==n||(Q||(Q=document.createElement("iframe"),Q.width=Q.height=Q.frameBorder=0,document.body.appendChild(Q)),X&&X.createElement||(X=(Q.contentWindow||Q.contentDocument).document,X.write("<html><body></body></html>"),X.close()),e=X.createElement(t),X.body.appendChild(e),n=Y[t]=P(e,"display"),document.body.removeChild(Q))),n}var _=t.doc(),T=(t.win(_),t.browser.ie),A=T&&t.browser.version<8,S=T&&t.browser.version<9,W=/<([a-z-]+)/i,H=/^(?:thead|tbody|tfoot|col|colgroup|caption)$/i,$=/^(button|input|select|textarea)$/i,k=/^(checked|disabled|selected|readonly)$/i,L=/^-?[\d\.]+(?:in|cm|mm|em|ex|pt|pc|%)/i,B=/^-?[\d\.]+$/,I=/opacity=(.*)?\)/i,O=/(.*?)rgb\((\d+),\s*(\d+),\s*(\d+)\)/,R=/^<([a-z-]+).*\/?>(?:.*<\/\1>|)$/i,F={},z={option:{content:"<select><option selected></option>#</select>",dep:1,skip:!0},tbody:{content:"<table>#</table>",dep:1},tr:{content:"<table><tbody>#</tbody></table>",dep:2},th:{content:"<table><tbody><tr>#</tr></tbody></table>",dep:3},fieldset:{content:"<form>#</form>",dep:1},legend:{content:"<form><fieldset>#</fieldset></form>",dep:2},area:{content:"<map>#</map>",dep:1},_p:{content:"<p>-#</p>",dep:1,skip:!0}};t.mix(z,{optgroup:z.option,thead:z.tbody,tfoot:z.tbody,col:z.tbody,colgroup:z.tbody,caption:z.tbody,td:z.th,style:z._p,script:z._p,param:z._p,link:z._p,base:z._p});var M=A?{"for":"htmlFor","class":"className",enctype:"encoding"}:{htmlFor:"for",className:"class",encoding:"enctype"};t.mix(M,{acceptcharset:"acceptCharset",accesskey:"accessKey",allowtransparency:"allowTransparency",bgcolor:"bgColor",cellpadding:"cellPadding",cellspacing:"cellSpacing",colspan:"colSpan",defaultchecked:"defaultChecked",defaultselected:"defaultSelected",defaultvalue:"defaultValue",frameborder:"frameBorder",hspace:"hSpace",longdesc:"longDesc",maxlength:"maxLength",marginwidth:"marginWidth",marginheight:"marginHeight",noresize:"noResize",noshade:"noShade",readonly:"readOnly",rowspan:"rowSpan",valign:"vAlign",vspace:"vSpace",tabindex:"tabIndex",usemap:"useMap",contenteditable:"contentEditable"});var U=void 0!==_.documentElement.textContent?"textContent":"innerText",V={append:function(t){this.appendChild(t)},prepend:function(t){this.insertBefore(t,this.firstChild)},before:function(t){this.parentNode.insertBefore(t,this)},after:function(t){this.parentNode.insertBefore(t,this.nextSibling)},replace:function(t){this.parentNode.replaceChild(t,this)},appendTo:function(t){t.appendChild(this)},prependTo:function(t){t.insertBefore(this,t.firstChild)},insertBefore:function(t){t.parentNode.insertBefore(this,t)},insertAfter:function(t){t.parentNode.insertBefore(this,t.nextSibling)}},j={name:function(t,e){t.name=e},data:function(e,n){t.dom(e).data(n)},style:function(e,n){t.dom(e).setStyle(n)}},D=({"float":void 0!==_.documentElement.style.styleFloat?"styleFloat":"cssFloat"},{opacity:1,zoom:1,zIndex:1,columnCount:1,columns:1,fillOpacity:1,fontWeight:1,lineHeight:1}),P=function(t,e){return t.style[e]||""};_.defaultView&&_.defaultView.getComputedStyle?P=function(e,n){var i;return(i=t.doc(e).defaultView.getComputedStyle(e,""))?i[n]||i.getPropertyValue(n)||"":""}:T&&_.documentElement.currentStyle&&(P=function(t,e){var n;return"opacity"===e?(n=I.exec(t.style.filter||"")||[,100],n=parseFloat(n[1])/100):(n=t.currentStyle[e]||"",L.test(n)&&(n=h(t,e,n))),n}),w.prototype={constructor:w,__init:function(e,n,i){if(C(e))return e;var o;return"string"==typeof e&&(e=t.trim(e),R.test(e)&&(o=u(e,_).nodes,n&&"object"==typeof n&&!n.nodeType&&void 0===n.length&&t.forEach(o,function(t){a(t,n)}))),o||(o=E(e,n),!isNaN(i)&&o&&o.length&&(o=o[i])),new w(o)},find:function(t,e){return this[0]?this.__init(t,this[0],e):this},not:function(e){var n,i=t.typeOf(e),o=[];return!e||"object"!==i&&"string"!==i&&"html"!==i.substring(0,4)?"number"===i||"array"===i?(e=t.array.make(e),this.forEach(function(n,i){t.array.has(e,i)||o.push(n)}),this.__init(o)):this:(n=this.__init(e).toArray(),this.forEach(function(t,e){for(var i,o=0;i=n[o++];)i===t&&delete this[e]}),this.__init(this.toArray()))},toArray:function(){return t.array.make(this)},forEach:function(e){return t.forEach(this,e,this)},filter:function(e){return this.__init(t.array.filter(this.toArray(),e))},reverse:function(){return this.__init(this.toArray().reverse())},item:function(t){return this.__init(this[t])},first:function(){return this.item(0)},last:function(){return this.item(this.length-1)},nth:function(t){return this.item(t)},get:function(t){return this[t]},tag:function(){return i(this[0])}},t.forEach(["append","prepend","before","after","replace"],function(t){w.prototype[t]=function(e,n){return this.forEach(function(i){n!==!1&&(e.cloneNode?e=s(e):e[0]&&e[0].cloneNode&&(e=s(e[0]))),d(t,i,e)})}}),t.forEach(["appendTo","prependTo","insertBefore","insertAfter"],function(t){w.prototype[t]=function(e,n){return this.forEach(function(i){C(e)||(e=this.__init(e)),e.forEach(function(e){n!==!1&&(i=s(i)),d(t,e,i,!0)})})}}),t.extend(w.prototype,{clone:function(t){var e=[];return this.forEach(function(n,i){e[i]=s(n,t)}),this.__init(e)},remove:function(){return this.forEach(function(t){t=f(t),t.parentNode&&t.parentNode.removeChild(t)})},empty:function(){return this.forEach(function(t){return f(t)})}}),t.forEach({setHtml:"innerHTML",setText:U},function(t,e){w.prototype[t]=function(t){return this.forEach(function(n){n[e]=null!=t?t:""})}}),t.forEach({getHtml:"innerHTML",getText:U},function(t,e){w.prototype[t]=function(){return this[0]&&this[0][e]||""}}),t.forEach({parent:"parentNode",prev:"previousSibling",next:"nextSibling"},function(t,e){w.prototype[t]=function(){for(var t=this[0]&&this[0][e];t&&1!==t.nodeType;)t=t[e];return this.__init(t)}}),t.extend(w.prototype,{prevAll:function(e){var n,i,o,r=this[0],a=[],s=0;if(r&&r.parentNode){for(i=r.parentNode.childNodes;(n=i[s++])&&n!==r;)1===n.nodeType&&a.push(n);"string"==typeof e&&(o=this.__init(e,r.parentNode).toArray(),a=t.array.filter(o,function(t){for(var e=0,n=a.length;n>e;e++)if(a[e]==t)return!0}))}return this.__init(a)},nextAll:function(e){var n,i,o,r,a=this[0],s=[],c=0;if(a&&a.parentNode){for(i=a.parentNode.childNodes;n=i[c++];)n===a&&(r=!0),r&&n!==a&&1===n.nodeType&&s.push(n);"string"==typeof e&&(o=this.__init(e,a.parentNode).toArray(),s=t.array.filter(o,function(t){for(var e=0,n=s.length;n>e;e++)if(s[e]==t)return!0}))}return this.__init(s)},children:function(t){var e,n,i=this[0],o=[],r=0,a=typeof t;if(i)if(t&&"string"===a)o=this.__init(t,i);else{for(n=i.childNodes;e=n[r++];)1===e.nodeType&&o.push(e);o="number"===a?o[t]:o}return this.__init(o)},siblings:function(t){var e,n,i=this[0],o=[],r=0,a=typeof t;if(i&&i.parentNode)if(t&&"string"===a)this.__init(t,i.parentNode).forEach(function(t){t!==i&&t.parentNode===i.parentNode&&o.push(t)});else{for(n=i.parentNode.childNodes;e=n[r++];)e!==i&&1===e.nodeType&&o.push(e);o="number"===a?o[t]:o}return this.__init(o)},contains:function(t,e){return this[0]&&0!=this.__init(this[0]).find(t,e).length},hasChild:function(){for(var t=this[0]&&this[0].firstChild;t;){if(n(t))return!0;t=t.nextSibling}return!1}}),t.extend(w.prototype,{setStyle:function(t,e){return this.forEach(function(n){var i,o,r=t;"string"==typeof r&&(null!=e?(r={},r[t]=e):r=y(t)),S&&"opacity"in r&&(r.filter="alpha(opacity="+100*r.opacity+")",r.zoom=r.zoom||1,delete r.opacity);for(i in r)r.hasOwnProperty(i)&&(o=r[i],i=m(i),!B.test(o)||i in D||(o+="px"),n.style[i]=o);return n})},getStyle:function(t,e){var n,i=this[0];return i&&(t=m(t),n=P(i,t)||"",null!=n&&e===!0&&/color/i.test(t)&&(n=g(n))),n},removeStyle:function(t){return this.forEach(function(e){for(var n=t.split(/,+/);n.length;)e.style[m(n.shift())]=""})},innerWidth:function(t){return(t=t||this[0])&&t.offsetWidth-p(t,["borderLeftWidth","borderRightWidth"])},innerHeight:function(t){return(t=t||this[0])&&t.offsetHeight-p(t,["borderTopWidth","borderBottomWidth"])},outerWidth:function(t,e){return(e=this[0])?t?e.offsetWidth+p(e,["marginLeft","marginRight"]):e.offsetWidth:void 0},outerHeight:function(t,e){return(e=this[0])?t?e.offsetHeight+p(e,["marginTop","marginBottom"]):e.offsetHeight:void 0},width:function(){var t=this[0];return t&&t.alert?this.dimensions("window").width:t&&9===t.nodeType?this.dimensions("document").width:this.innerWidth(t)-p(t,["paddingLeft","paddingRight"])},height:function(){var t=this[0];return t&&t.alert?this.dimensions("window").height:t&&9===t.nodeType?this.dimensions("document").height:this.innerHeight(t)-p(t,["paddingTop","paddingBottom"])},dimensions:function(e){var n=this[0];if(e=e||t.typeOf(n),"window"==e){var i=n.document,o=i.body,r=i.documentElement,a="CSS1Compat"===i.compatMode;return{width:a&&r.clientWidth||o&&o.clientWidth||r.clientWidth,height:a&&r.clientHeight||o&&o.clientHeight||r.clientHeight}}if("document"==e){var o=n.body,r=n.documentElement,s=Math.max(o.scrollWidth,o.offsetWidth,r.scrollWidth,r.offsetWidth),c=Math.max(o.scrollHeight,o.offsetHeight,r.scrollHeight,r.offsetHeight);return T&&r.clientWidth>=r.scrollWidth&&(s=r.clientWidth),T&&r.clientHeight>=r.scrollHeight&&(c=r.clientHeight),{width:s,height:c}}return{width:this.width(),height:this.height()}},viewport:function(){if("window"!==t.typeOf(this[0]))throw"so.dom.viewport(): This function only for `window`, use `so.dom.dimensions()` instead.";return this.dimensions()},offset:function(e){var n,i;if(n=this[0]){if(i=t.typeOf(n),"window"===i||"document"===i)return{top:0,left:0};if(e){var o=v(n),r=n.parentNode,a=v(r,e);return r&&1===r.nodeType&&(a.top+=parseFloat(P(r,"borderTopWidth"))||0,a.left+=parseFloat(P(r,"borderLeftWidth"))||0),n.style.marginTop&&(o.top-=parseFloat(P(n,"marginTop"))||0),n.style.marginLeft&&(o.left-=parseFloat(P(n,"marginLeft"))||0),{top:o.top-a.top,left:o.left-a.left}}return v(n)}},scroll:function(e,n){var o,r;if(o=this[0]){if(r=t.typeOf(o),"string"==typeof e)return b(o,r)[e];if(null==e&&null==n)return b(o,r);var a,s,c;return"window"===r||"document"===r||(c=i(o))&&"html"===c||"body"===c?(a=t.doc(o),s=t.win(a),s.scrollTo(n,e)):(isNaN(e)||(o.scrollTop=e),isNaN(n)||(o.scrollLeft=n)),{top:e,left:n}}}}),t.extend(w.prototype,{hasAttr:function(t,e){return null==(e=this[0])?!1:e.hasAttribute?e.hasAttribute(t):e.attributes[t]&&e.attributes[t].specified||e[t]},setAttr:function(t,e){return this.forEach(function(n){var i=t;if("string"==typeof i&&(i={},i[t]=e||""),"type"in i&&A)throw"so.dom.setAttr(): `type` attribute can not be modified!";a(n,i)})},getAttr:function(t,e){if(null!=(e=this[0])){var n,i=e.attributes;switch(t){case"class":case"className":n=i["class"]&&i["class"].specified?e.className:null;break;case"src":case"href":n=e.getAttribute(t,2);break;case"style":n=A?i.style&&i.style.specified?e.style.cssText:null:e.getAttribute("style"),n=n&&n.toLowerCase();break;case"tabindex":case"tabIndex":n=(n=e.getAttributeNode("tabindex"))&&n.specified?n.value:e.getAttribute("tabindex");break;case"for":case"htmlFor":n=e.htmlFor||e.getAttribute("for");break;case"enctype":case"encoding":n=e.getAttribute("enctype")||e.enctype;break;default:n=k.test(t)?e[t]===!0||"boolean"!=typeof e[t]&&(n=e.getAttributeNode(t))&&n.nodeValue!==!1?t:null:e.getAttribute(M[t]||t)}return T&&"function"==typeof n&&(n=/function.*?\(.*?\)\s*\{\s*(.*?)\s*\}/im.exec(""+n),n=n&&n[1]),null!==n?n:void 0}},removeAttr:function(n){if("*"===n)return this.forEach(function(t){for(var e,n=(t.attributes,t.attributes.length-1);e=t.attributes[n];--n)e.specified&&t.removeAttribute(e.name)});var i,o,r,a=t.trim(n).split(e("\\s+"));return this.forEach(function(t){for(i=0;i<a.length;i++)o=M[a[i]]||a[i],r=M["default"+a[i]],$.test(t.tagName)&&k.test(o)&&(t[o]=!1,r&&(t[r]=!1)),t.removeAttribute(o)})},setValue:function(e){return e+="",this.forEach(function(n){var o,r,a=i(n),s=0;if($.test(a))if("select"===a)for(;o=n.options[s++];)o.value===e&&(o.selected=!0);else"button"===a&&A?(r=t.doc(n).createAttribute("value"),r.value=e,n.setAttributeNode(r)):n.value=e})},getValue:function(t){if(t=this[0]){var e,n=i(t);return"select"===n?(e=t.options[t.selectedIndex],e=e.disabled||e.parentNode.disabled?null:e.value):"button"===n&&A?(e=t.getAttributeNode("value"),e=e&&e.specified?e.value:null):e=t.value,null!=e?e:""}}}),t.extend(w.prototype,{hasClass:function(t,e){return(e=e||this[0])&&N(t).test(e.className)},addClass:function(n){return n=t.trim(n).split(e("\\s+")),this.forEach(function(e){for(var i,o=0,r=[];i=n[o++];)this.hasClass(i,e)||r.push(i);e.className=t.trim(e.className+" "+r.join(" "))})},removeClass:function(n){if("*"===n)return this.setClass("");var i,o,r=t.trim(n).split(e("\\s+"));return this.forEach(function(e){for(i=0;o=r[i++];)e.className=(""+e.className).replace(N(o)," ");e.className=t.trim(e.className)})},setClass:function(e){return this.forEach(function(n){n.className=t.trim(e)})},replaceClass:function(e,n){return this.forEach(function(i){i.className=t.trim((""+i.className).replace(N(e)," "+n+" "))})},toggleClass:function(e){var n=[],i=[];return this.forEach(function(t){this.hasClass(e,t)?n.push(t):i.push(t)}),t.forEach(n,function(n){n.className=t.trim((""+n.className).replace(N(e)," "))}),t.forEach(i,function(n){n.className=t.trim(n.className+" "+e)}),this}}),t.extend(w.prototype,{data:function(t,e){if("object"==typeof t||"undefined"!=typeof e){var n=t;return"string"==typeof n&&(n={},n[t]=e),this.forEach(function(t){t.$data=t.$data||{};for(var e in n)t.$data[e]=n[e]})}var i,n;return(i=this[0])&&(i.$data=i.$data||{},n=i.$data[t]),n},removeData:function(t){return this.forEach(function(e){void 0!==e.$data&&("*"===t?delete e.$data:void 0!==e.$data[t]&&delete e.$data[t])})}}),t.extend(w.prototype,{buildQuery:function(e){var n,o,r,a,s,c=this[0],f=[],l=0;if(c&&"form"===i(c))for(;n=c.elements[l++];)if(o=t.trim(n.type).toLowerCase(),r=t.trim(n.name),s=n.attributes,a=i(n),o&&r&&!n.disabled&&(null==s.disabled||!s.disabled.specified||s.disabled!==!0))if(/^(textarea|select|button)$/i.test(a))f.push(encodeURIComponent(r)+"="+encodeURIComponent(n.value));else switch(o){case"radio":case"checkbox":n.checked&&f.push(encodeURIComponent(r)+"="+("checkbox"===o?null!=n.value?n.value:"on":encodeURIComponent(n.value)));break;default:f.push(encodeURIComponent(r)+"="+encodeURIComponent(n.value))}return f=f.join("&"),e!==!1&&(f=f.replace(/%20/g,"+")),f},buildQueryArray:function(){var e=this.buildQuery(!1),n={};return t.forEach(e.split("&"),function(t){t=t.split("="),n[decodeURIComponent(t[0])]=decodeURIComponent(t[1])}),n}}),t.event&&t.forEach(t.event,function(e){"toString"!==e&&(w.prototype[e]=function(n,i){var o=this;return n.indexOf(",")>-1?void t.forEach(n.split(/\s*,\s*/),function(n){return o.forEach(function(o){t.event[e](o,n,i)})}):o.forEach(function(o){t.event[e](o,n,i)})})});var Q,X,Y={};t.animate&&t.extend(w.prototype,{animate:function(e,n,i,o){return this.forEach("stop"===e?function(t){var e=t.$animation;e&&e.running&&e.stop()}:function(r){t.animate(r,e,n,i,o)})},fade:function(t,e,n){return this.animate({opacity:t},e,n)},fadeIn:function(t,e){return this.fade(1,t,e)},fadeOut:function(e,n){return(n===!0||"remove"===n)&&(n=function(e){t.dom(e).remove()}),this.fade(0,e,n)},show:function(e,n){return this.forEach(function(i){i.offsetWidth||i.offsetHeight||(i.style.display=x(i.tagName),t.animate(i,{opacity:1},e||0,n))})},hide:function(e,n){return this.forEach(function(i){(i.offsetWidth||i.offsetHeight)&&t.animate(i,{opacity:0},e||0,function(){i.style.display="none",n&&n.call(this,i)})})},toggle:function(e,n){return this.forEach(function(i){i.offsetWidth||i.offsetHeight?t.animate(i,{opacity:0},e||0,function(){i.style.display="none",n&&n.call(this,i)}):(i.style.display=x(i.tagName),t.animate(i,{opacity:1},e||0,n))})},blip:function(e){return this.forEach(function(n){t.animate(n,{opacity:0},e,function(){t.animate(n,{opacity:1},e)})})}}),t.dom=function(t,e,n){return(new w).__init(t,e,n)},t.toString("dom","so.dom")}(so);

/**
 * Copyright (c) Dustin Diaz 2012 <https://github.com/ded/qwery>
 */
;(function(e,t,n){typeof module!="undefined"&&module.exports?module.exports=n():typeof t["define"]=="function"&&t.define.amd?define(n):t[e]=n()})("qwery",this,function(){function L(){this.c={}}function D(e){return A.g(e)||A.s(e,"(^|\\s+)"+e+"(\\s+|$)",1)}function P(e,t){var n=0,r=e.length;for(;n<r;n++)t(e[n])}function H(e){for(var t=[],n=0,r=e.length;n<r;++n)$(e[n])?t=t.concat(e[n]):t[t.length]=e[n];return t}function B(e){var t=0,n=e.length,r=[];for(;t<n;t++)r[t]=e[t];return r}function j(e){while(e=e.previousSibling)if(e[u]==1)break;return e}function F(e){return e.match(C)}function I(e,t,n,r,i,s,a,c,h,p,d){var v,m,g,y,b;if(this[u]!==1)return!1;if(t&&t!=="*"&&this[o]&&this[o].toLowerCase()!==t)return!1;if(n&&(m=n.match(f))&&m[1]!==this.id)return!1;if(n&&(b=n.match(l)))for(v=b.length;v--;)if(!D(b[v].slice(1)).test(this.className))return!1;if(h&&Q.pseudos[h]&&!Q.pseudos[h](this,d))return!1;if(r&&!a){y=this.attributes;for(g in y)if(Object.prototype.hasOwnProperty.call(y,g)&&(y[g].name||g)==i)return this}return r&&!R(s,Z(this,i)||"",a)?!1:this}function q(e){return O.g(e)||O.s(e,e.replace(b,"\\$1"))}function R(e,t,n){switch(e){case"=":return t==n;case"^=":return t.match(M.g("^="+n)||M.s("^="+n,"^"+q(n),1));case"$=":return t.match(M.g("$="+n)||M.s("$="+n,q(n)+"$",1));case"*=":return t.match(M.g(n)||M.s(n,q(n),1));case"~=":return t.match(M.g("~="+n)||M.s("~="+n,"(?:^|\\s+)"+q(n)+"(?:\\s+|$)",1));case"|=":return t.match(M.g("|="+n)||M.s("|="+n,"^"+q(n)+"(-|$)",1))}return 0}function U(e,t){var n=[],i=[],s,a,f,l,h,p,d,v,m=t,g=_.g(e)||_.s(e,e.split(N)),y=e.match(T);if(!g.length)return n;l=(g=g.slice(0)).pop(),g.length&&(f=g[g.length-1].match(c))&&(m=K(t,f[1]));if(!m)return n;d=F(l),p=m!==t&&m[u]!==9&&y&&/^[+~]$/.test(y[y.length-1])?function(e){while(m=m.nextSibling)m[u]==1&&(d[1]?d[1]==m[o].toLowerCase():1)&&(e[e.length]=m);return e}([]):m[r](d[1]||"*");for(s=0,a=p.length;s<a;s++)if(v=I.apply(p[s],d))n[n.length]=v;return g.length?(P(n,function(e){W(e,g,y)&&(i[i.length]=e)}),i):n}function z(e,t,n){if(X(t))return e==t;if($(t))return!!~H(t).indexOf(e);var r=t.split(","),i,s;while(t=r.pop()){i=_.g(t)||_.s(t,t.split(N)),s=t.match(T),i=i.slice(0);if(I.apply(e,F(i.pop()))&&(!i.length||W(e,i,s,n)))return!0}return!1}function W(e,t,n,r){function s(e,r,o){while(o=k[n[r]](o,e))if(X(o)&&I.apply(o,F(t[r]))){if(!r)return o;if(i=s(o,r-1,o))return i}}var i;return(i=s(e,t.length-1,e))&&(!r||Y(i,r))}function X(e,t){return e&&typeof e=="object"&&(t=e[u])&&(t==1||t==9)}function V(e){var t=[],n,r;e:for(n=0;n<e.length;++n){for(r=0;r<t.length;++r)if(t[r]==e[n])continue e;t[t.length]=e[n]}return t}function $(e){return typeof e=="object"&&isFinite(e.length)}function J(t){return t?typeof t=="string"?Q(t)[0]:!t[u]&&$(t)?t[0]:t:e}function K(e,t,n){return e[u]===9?e.getElementById(t):e.ownerDocument&&((n=e.ownerDocument.getElementById(t))&&Y(n,e)&&n||!Y(e,e.ownerDocument)&&a('[id="'+t+'"]',e)[0])}function Q(e,t){var i,s,o=J(t);if(!o||!e)return[];if(e===window||X(e))return!t||e!==window&&X(o)&&Y(e,o)?[e]:[];if(e&&$(e))return H(e);if(i=e.match(x)){if(i[1])return(s=K(o,i[1]))?[s]:[];if(i[2])return B(o[r](i[2]));if(et&&i[3])return B(o[n](i[3]))}return a(e,o)}function G(e,t){return function(n){var r,i;if(v.test(n)){e[u]!==9&&((i=r=e.getAttribute("id"))||e.setAttribute("id",i="__qwerymeupscotty"),n='[id="'+i+'"]'+n,t(e.parentNode||e,n,!0),r||e.removeAttribute("id"));return}n.length&&t(e,n,!1)}}var e=document,t=e.documentElement,n="getElementsByClassName",r="getElementsByTagName",i="querySelectorAll",s="useNativeQSA",o="tagName",u="nodeType",a,f=/#([\w\-]+)/,l=/\.[\w\-]+/g,c=/^#([\w\-]+)$/,h=/^\.([\w\-]+)$/,p=/^([\w\-]+)$/,d=/^([\w]+)?\.([\w\-]+)$/,v=/(^|,)\s*[>~+]/,m=/^\s+|\s*([,\s\+\~>]|$)\s*/g,g=/[\s\>\+\~]/,y=/(?![\s\w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^'"]*\]|[\s\w\+\-]*\))/,b=/([.*+?\^=!:${}()|\[\]\/\\])/g,w=/^(\*|[a-z0-9]+)?(?:([\.\#]+[\w\-\.#]+)?)/,E=/\[([\w\-]+)(?:([\|\^\$\*\~]?\=)['"]?([ \w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^]+)["']?)?\]/,S=/:([\w\-]+)(\(['"]?([^()]+)['"]?\))?/,x=new RegExp(c.source+"|"+p.source+"|"+h.source),T=new RegExp("("+g.source+")"+y.source,"g"),N=new RegExp(g.source+y.source),C=new RegExp(w.source+"("+E.source+")?"+"("+S.source+")?"),k={" ":function(e){return e&&e!==t&&e.parentNode},">":function(e,t){return e&&e.parentNode==t.parentNode&&e.parentNode},"~":function(e){return e&&e.previousSibling},"+":function(e,t,n,r){return e?(n=j(e))&&(r=j(t))&&n==r&&n:!1}};L.prototype={g:function(e){return this.c[e]||undefined},s:function(e,t,n){return t=n?new RegExp(t):t,this.c[e]=t}};var A=new L,O=new L,M=new L,_=new L,Y="compareDocumentPosition"in t?function(e,t){return(t.compareDocumentPosition(e)&16)==16}:"contains"in t?function(e,n){return n=n[u]===9||n==window?t:n,n!==e&&n.contains(e)}:function(e,t){while(e=e.parentNode)if(e===t)return 1;return 0},Z=function(){var t=e.createElement("p");return(t.innerHTML='<a href="#x">x</a>')&&t.firstChild.getAttribute("href")!="#x"?function(e,t){return t==="class"?e.className:t==="href"||t==="src"?e.getAttribute(t,2):e.getAttribute(t)}:function(e,t){return e.getAttribute(t)}}(),et=!!e[n],tt=e.querySelector&&e[i],nt=function(e,t){var n=[],r,s;try{return t[u]===9||!v.test(e)?B(t[i](e)):(P(r=e.split(","),G(t,function(e,t){s=e[i](t),s.length==1?n[n.length]=s.item(0):s.length&&(n=n.concat(B(s)))})),r.length>1&&n.length>1?V(n):n)}catch(o){}return rt(e,t)},rt=function(e,t){var n=[],i,s,o,a,f,l;e=e.replace(m,"$1");if(s=e.match(d)){f=D(s[2]),i=t[r](s[1]||"*");for(o=0,a=i.length;o<a;o++)f.test(i[o].className)&&(n[n.length]=i[o]);return n}return P(l=e.split(","),G(t,function(e,r,i){f=U(r,e);for(o=0,a=f.length;o<a;o++)if(e[u]===9||i||Y(f[o],t))n[n.length]=f[o]})),l.length>1&&n.length>1?V(n):n},it=function(e){typeof e[s]!="undefined"&&(a=e[s]?tt?nt:rt:rt)};return it({useNativeQSA:!0}),Q.configure=it,Q.uniq=V,Q.is=z,Q.pseudos={},Q});
