/**
 * @name: so.ajax
 * @deps: so, so.array
 */

;(function($) {

"use strict"; // @tmp

var re_query = /\?&(.*)/,
    re_validJson = /^\{.*?\}|\[.*?\]$/,
    re_theRequest = /^([a-z]+|)\s*(.*?)\s*(?:@(json|xml|html)|)\s*$/i,
    xmlHttpObjects = [
        function() { return new ActiveXObject("Microsoft.XMLHTTP"); },
        function() { return new ActiveXObject("Msxml3.XMLHTTP"); },
        function() { return new ActiveXObject("Msxml2.XMLHTTP"); },
        function() { return new XMLHttpRequest(); }
    ],
    xmlHttpStatuses = {
        UNSENT: 0,
        OPENED: 1,
        HEADERS_RECEIVED: 2,
        LOADING: 3,
        DONE: 4
    },
    optionsDefault = {
        autoSend: true,
        url: "",
        method: "GET",
        async: true,
        data: null,
        dataType: "json",
        noCache: true,
        requestHeaders: {"X-Requested-With": "XMLHttpRequest"},
        responseHeaders: {},
        onStart: $.fun,
        onStop: $.fun, // @todo: queue
        onDone: $.fun,
        onProgress: $.fun,
        onSuccess: $.fun,
        onFail: $.fun,
        onAbort: $.fun,
        beforeSend: null,
        afterSend: null
    }
;

function createRequest() {
    for (var i = xmlHttpObjects.length; i--;) {
        try { return xmlHttpObjects[i](); } catch (e) { continue; }
    }
}

function toXml(input) {
    // already document?
    if (input && input.nodeType === 9) {
        return input;
    }

    if (!input || typeof input !== "string") {
        return null;
    }

    var xml;
    if (DOMParser) {
        xml = (new DOMParser).parseFromString(input , "text/xml");
    } else {
        xml = new ActiveXObject("Microsoft.XMLDOM");
        xml.async = "false";
        xml.loadXML(input);
    }

    return xml;
}

function toJson(input) {
    if (!input || typeof input !== "string") {
        return null;
    }

    input = $.trim(input);
    if (!re_validJson.test(input)) {
        throw ("No valid JSON provided!");
    }
    if (JSON && JSON.parse) {
        return JSON.parse(input);
    }

    // ay em sori beybe...
    return eval("("+ input +")");
}

function parseResponseHeaders(rawHeaders) {
    if (!rawHeaders) {
        return;
    }

    var header, headers = rawHeaders.split("\r\n"),
        responseHeaders = {}, tmp;
    while (header = headers.shift()) {
        tmp = header.split(":", 2);
        responseHeaders[tmp[0].toLowerCase()] = $.trim(tmp[1]);
    }

    return responseHeaders;
}

/*** the ajax ***/
function Ajax(options) {
    var key, data = [];
    // response data
    this.responseData = null;
    this.responseDataType = undefined; // @todo

    // create $xhr
    this.$xhr = createRequest();

    // extend request headers
    if (options.headers) {
        optionsDefault.requestHeaders = $.mix({}, optionsDefault.requestHeaders, options.headers);
        delete options.headers;
    }

    // extend default options
    options = $.mix({}, optionsDefault, options);

    // set method name as uppercase
    options.method && (options.method = options.method.toUpperCase());

    // correct file path for "localhost" only
    if (location.host === "localhost"
            && options.url && options.url.charAt(0) == "/") {
        options.url = options.url.substring(1);
    }

    // prepare request data
    if (options.data) {
        if ($.typeOf(options.data) === "object") {
            for (key in options.data) {
                options.data.hasOwnProperty(key)
                    && data.push(encodeURIComponent(key) +"="+ encodeURIComponent(options.data[key]));
            }
            data = data.join("&").replace(/%20/g, "+");
        } else {
            data = options.data;
        }

        if (options.method == "GET") {
            if (options.url != "") {
                options.url = options.url.indexOf("?") === -1
                    ? options.url += "?"+ data
                    : options.url += "&"+ data;
            } else {
                options.url += "?"+ data
            }
        } else {
            options.data = data;
        }
    }
    // add no-cache helper
    if (options.method == "GET" && options.noCache !== false) {
        options.url += options.url.indexOf("?") === -1 ? "?_="+ $.now() : "&_="+ $.now();
    }
    // clear url
    options.url = options.url.replace(re_query, "?$1");

    // set options
    this.options = options;
    this.isAborted = this.isSent = this.isDone = false;

    // send if autosend not false
    if (options.autoSend !== false) {
        return this.send();
    }
}

Ajax.prototype = {
    send: function() {
        var _this = this,
            options = this.options, key;

        // prevent re-send for chaining callbacks
        if (this.isSent || this.isAborted) {
            return this;
        }

        // open connection
        this.$xhr.open(options.method, options.url, options.async);
        // set request header for post etc.
        if (options.method != "GET" && options.data && options.data.length) {
            this.$xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        }

        // set request headers if exist
        for (key in options.requestHeaders) {
            options.requestHeaders.hasOwnProperty(key)
                && this.$xhr.setRequestHeader(key, options.requestHeaders[key]);
        }

        // define ready state change method
        if (options.async) {
            this.$xhr.onreadystatechange = function() {
                _this._handleResponse(_this, options);
            };
        }

        // call beforesend function
        if (typeof options.beforeSend === "function") {
            options.beforeSend.call(this, this.$xhr);
        }

        // send request
        this.$xhr.send(options.data);

        // call aftersend function
        if (typeof options.afterSend === "function") {
            options.afterSend.call(this, this.$xhr);
        }

        // handle async
        if (!options.async) {
            this._handleResponse(this, options);
        }

        // sent flag
        this.isSent = true;

        // check timeout
        if (options.timeout) {
            setTimeout(function() {
                _this.abort();
            }, options.timeout);
        }

        return this;
    },
    abort: function() {
        // abort request
        this.isAborted = true;
        this.$xhr.abort();

        // call onabort method
        this.options.onAbort.call(this, this.$xhr);
    },
    _handleResponse: function(_this, options) {
        if (_this.isAborted) {
            _this.$xhr.onreadystatechange = null;
            return;
        }

        // handle states
        switch (_this.$xhr.readyState) {
            case xmlHttpStatuses.OPENED:
                // call onstart
                options.onStart.call(_this, _this.$xhr);
                break;
            case xmlHttpStatuses.HEADERS_RECEIVED:
                // get headers (suppressing ie7 error)
                if (typeof _this.$xhr.getAllResponseHeaders === "function") {
                    options.responseHeaders = parseResponseHeaders(_this.$xhr.getAllResponseHeaders());
                }
                break;
            case xmlHttpStatuses.LOADING:
                // call onprogress
                options.onProgress.call(_this, _this.$xhr);
                break;
            case xmlHttpStatuses.DONE:
                _this.isDone = true;
                // assign shortcuts
                _this.statusCode = _this.$xhr.status;
                _this.statusText = _this.$xhr.statusText;
                _this.readyState = _this.$xhr.readyState;

                // process response data
                this.responseData = (options.dataType == "xml")
                    ? _this.$xhr.responseXML || _this.$xhr.responseText
                    : _this.$xhr.responseText;

                if (options.dataType == "json") {
                    this.responseData = toJson(this.responseData);
                } else if (options.dataType == "xml") {
                    this.responseData = toXml(this.responseData);
                }

                // call response status methods if exist
                if (typeof options[_this.statusCode] === "function") {
                    options[_this.statusCode].call(_this, this.responseData, _this.$xhr);
                }

                // call onsuccess/onfail method
                if (_this.statusCode >= 100 && _this.statusCode < 400) {
                    options.onSuccess.call(_this, this.responseData, _this.$xhr);
                } else {
                    options.onFail.call(_this, this.responseData, _this.$xhr);
                }

                // call ondone method
                options.onDone.call(_this, this.responseData, _this.$xhr);

                // remove onreadystatechange
                _this.$xhr.onreadystatechange = null;
                break;
        }
    },
    setRequestHeader: function(key, val) {
        // while calling this method, don't forget to set autosend=false
        if (typeof key === "object") {
            for (var i in key) {
                key.hasOwnProperty(i)
                    && (this.options.requestHeaders[i] = key[i]);
            }
        } else {
            this.options.requestHeaders[key] = val;
        }
        return this;
    },
    getResponseHeader: function(key) {
        return this.options.responseHeaders[key.toLowerCase()];
    },
    getResponseHeaderAll: function() {
        return this.options.responseHeaders;
    }
};

// add ajax to so
$.ajax = function(options, data, onDone, onSuccess, onFail) {
    if (typeof options === "string") {
        // <method> <url> <response data type>
        // notation: /foo
        // notation: /foo @json
        // notation: GET /foo @json
        var theRequest = re_theRequest.exec($.trim(options)) || [, , ,];
        options = {};
        options.url = $.trim(theRequest[2]);
        options.method = $.trim(theRequest[1]) || optionsDefault.method;
        options.dataType = $.trim(theRequest[3]) || optionsDefault.dataType;
    } else {
        options = options || {};
    }

    if (!options.url) {
        throw ("URL is required!");
    }

    // no data, change the alignment
    if (typeof data === "function") {
        // keep arguments
        var args = $.array.make(arguments);
        // prevent re-calls
        data = onDone = onSuccess = onFail = null;
        onDone    = args[1];
        onSuccess = args[2];
        onFail    = args[3];
    }

    return new Ajax($.mix(options, {
              data: data       || options.data       || null,
          dataType:               options.dataType   || optionsDefault.dataType,
            onDone: onDone     || options.onDone     || optionsDefault.onDone,
         onSuccess: onSuccess  || options.onSuccess  || optionsDefault.onSuccess,
            onFail: onFail     || options.onFail     || optionsDefault.onFail
    }));
};

// shortcuts get/post/load?
$.forEach({get: "GET", post: "POST", load: "GET"}, function(fn, method) {
    $.ajax[fn] = function(options, data, onDone, onSuccess, onFail) {
        if (typeof options === "string") {
            return $.ajax(method +" "+ options, data, onDone, onSuccess, onFail);
        } else {
            options = options || {};
            options.method = method;
            return $.ajax(options, data, onDone, onSuccess, onFail);
        }
    };
});

// add more shortcuts like loadJson()
$.forEach(["Xml", "Json", "Html"], function(dataType){
    $.ajax["load"+ dataType] = function(url, data, onDone, onSuccess, onFail) {
        return $.ajax("GET "+ url +" @"+ dataType.toLowerCase(), data, onDone, onSuccess, onFail);
    };
});

// @todo: remote calls
// $.ajax.remote = function() {};

// define exposer
$.toString("ajax", "so.ajax");

})(so);
