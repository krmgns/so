;(function($) {

"use strict"; // @tmp

var re_validJson = /^\{.*?\}|\[.*?\]$/,
    re_theRequest = /^([a-z]+?\s+|)(.*?)$/i,
    re_query = /\?&(.*)/,
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
    defaultOptions = {
        autoSend: true,
        url: "",
        method: "GET",
        async: true,
        data: null,
        dataType: "html",
        noCache: true,
        requestHeaders: {"X-Requested-With": "XMLHttpRequest"},
        responseHeaders: {},
        onStart: $.emptyFunction,
        onStop: $.emptyFunction, // @todo: queue
        onComplete: $.emptyFunction,
        onProgress: $.emptyFunction,
        onSuccess: $.emptyFunction,
        onError: $.emptyFunction,
        onAbort: $.emptyFunction,
        beforeSend: null,
        afterSend: null
    }
;

function createRequest() {
    for (var i = xmlHttpObjects.length; i--;) {
        try { return xmlHttpObjects[i](); } catch (e) { continue; }
    }
}

function toJson(input) {
    if (!input || typeof input !== "string") return null;

    input = $.trim(input);
    if (!re_validJson.test(input)) {
        throw ("No valid JSON data provided!");
    }
    if (window.JSON && window.JSON.parse) {
        return window.JSON.parse(input);
    }
    return eval("("+ input +")");
}

function toXml(input) {
    // Already document?
    if (input && input.nodeType === 9) {
        return input;
    }

    if (!input || typeof input !== "string") return null;

    var xml;
    if (window.DOMParser) {
        xml = (new DOMParser).parseFromString(input , "text/xml");
    } else {
        xml = new ActiveXObject("Microsoft.XMLDOM");
        xml.async = "false";
        xml.loadXML(input);
    }
    return xml;
}

function parseResponseHeaders(allHeaders) {
    if (!allHeaders) return;
    var header, headers = allHeaders.split("\r\n"),
        responseHeaders = {}, tmp;
    while (header = headers.shift()) {
        tmp = header.split(":", 2);
        responseHeaders[tmp[0].toLowerCase()] = $.trim(tmp[1]);
    }
    return responseHeaders;
}

/*** The Ajax! ***/
function Ajax(options) {
    var key, data = [];

    // Create _xhr
    this._xhr = createRequest();

    // Extend request headers
    if (options.headers) {
        defaultOptions.requestHeaders = $.mix({}, defaultOptions.requestHeaders, options.headers);
        delete options.headers;
    }

    // Extend default options
    options = $.mix(defaultOptions, options);

    // Set method name as uppercase
    options.method && (options.method = options.method.toUpperCase());

    // Correct file path for "localhost" only
    if (location.host === "localhost"
            && options.url && options.url.charAt(0) == "/") {
        options.url = options.url.substring(1);
    }

    // Prepare request data
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
    // Add no-cache helper
    if (options.method == "GET" && options.noCache !== false) {
        options.url += options.url.indexOf("?") === -1 ? "?_="+ $.now() : "&_="+ $.now();
    }
    // Clear url
    options.url = options.url.replace(re_query, "?$1");

    // Set options
    this.options = options;
    this.isAborted = this.isSent = false;

    // Send if autoSend not false
    if (options.autoSend !== false) {
        return this.send();
    }
}

Ajax.prototype = {
    send: function() {
        var that = this,
            options = this.options, key;

        // Prevent re-send for chaining callbacks
        if (this.isSent || this.isAborted) {
            return this;
        }


        // Open connection
        this._xhr.open(options.method, options.url, options.async);
        // Set request header for POST etc.
        if (options.method != "GET" && options.data && options.data.length) {
            this._xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        }

        // Set request headers if exist
        for (key in options.requestHeaders) {
            options.requestHeaders.hasOwnProperty(key)
                && this._xhr.setRequestHeader(key, options.requestHeaders[key]);
        }

        // Define ready state change method
        if (options.async) {
            this._xhr.onreadystatechange = function() {
                that._handleResponse(that, options);
            };
        }

        // Call beforeSend function
        if (typeof options.beforeSend === "function") {
            options.beforeSend.call(this, this._xhr);
        }

        // Send request
        this._xhr.send(options.data);

        // Call afterSend function
        if (typeof options.afterSend === "function") {
            options.afterSend.call(this, this._xhr);
        }

        // Handle async
        if (!options.async) {
            this._handleResponse(this, options);
        }

        // Flag sent
        this.isSent = true;

        // Check timeout
        if (options.timeout) {
            setTimeout(function() {
                that.abort();
            }, options.timeout);
        }

        return this;
    },
    abort: function() {
        // Abort request
        this.isAborted = true;
        this._xhr.abort();

        // Call onabort method
        this.options.onAbort.call(this, this._xhr);
    },
    _handleResponse: function(that, options) {
        if (that.isAborted) {
            that._xhr.onreadystatechange = null;
            return;
        }

        // Handle states
        switch (that._xhr.readyState) {
            case xmlHttpStatuses.OPENED:
                // Call onstart
                options.onStart.call(that, that._xhr);
                break;
            case xmlHttpStatuses.HEADERS_RECEIVED:
                // Get headers (suppressing IE7 error)
                if (typeof that._xhr.getAllResponseHeaders === "function") {
                    options.responseHeaders = parseResponseHeaders(that._xhr.getAllResponseHeaders());
                }
                break;
            case xmlHttpStatuses.LOADING:
                // Call onprogress
                // options.onProgress.call(that, that._xhr);
                break;
            case xmlHttpStatuses.DONE:
                // Assign shortcuts
                that.readyState = that._xhr.readyState;
                that.statusCode = that._xhr.status;
                that.statusText = that._xhr.statusText;

                // Process response content
                var content = (options.dataType == "xml")
                            ? that._xhr.responseXML || that._xhr.responseText
                            : that._xhr.responseText;
                if (options.dataType == "json") {
                    content = toJson(content);
                } else if (options.dataType == "xml") {
                    content = toXml(content);
                }

                var statusCode = that._xhr.status;
                // Call response status methods if exist
                if (typeof options[statusCode] === "function") {
                    options[statusCode].call(that, content, that._xhr);
                }

                // Call onsuccess/onerror method
                if (statusCode >= 100 && statusCode < 400) {
                    options.onSuccess.call(that, content, that._xhr);
                } else {
                    options.onError.call(that, content, that._xhr);
                }

                // Call oncomplete method
                options.onComplete.call(that, content, that._xhr);

                // Remove onreadystatechange
                that._xhr.onreadystatechange = null;
                break;
        }
    },
    setRequestHeader: function(key, val) {
        // While calling this method, don't forget to set autoSend=false
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
    getAllResponseHeaders: function() {
        return this.options.responseHeaders;
    }
};

function request(theRequest, data, onSuccess, onError, onComplete) {
    theRequest = re_theRequest.exec($.trim(theRequest)) || [, "", ""];
    // No data, change the alignment
    if (typeof data === "function") {
        // Keep arguments
        var args = $.toArray(arguments);
        // Prevent re-calls
        data = onSuccess = onError = onComplete = undefined;
        onSuccess = args[1], onError = args[2], onComplete = args[3];
    }

    return new Ajax({
        method: $.trim(theRequest[1]) || defaultOptions.method,
        url: $.trim(theRequest[2]),
        data: data,
        onSuccess: onSuccess || defaultOptions.onSuccess,
        onError: onError || defaultOptions.onError,
        onComplete: onComplete || defaultOptions.onComplete
    });
};

// Add ajax to mii
$.ajax = function(options, data, onSuccess, onError, onComplete) {
    if (typeof options === "string") {
        return request(options, data, onSuccess, onError, onComplete);
    }
    options = $.mix(options, {
              data: data,
         onSuccess: onSuccess  || options.onSuccess  || defaultOptions.onSuccess,
           onError: onError    || options.onError    || defaultOptions.onError,
        onComplete: onComplete || options.onComplete || defaultOptions.onComplete
    });
    return new Ajax(options);
};

// Shortcuts get/post/load/json?
$.forEach({get: "GET", post: "POST", load: "GET"}, function(fn, method) {
    $.ajax[fn] = function(url, data, onSuccess, onError, onComplete) {
        return request(method +" "+ url, data, onSuccess, onError, onComplete);
    };
});

// @todo: Remote calls
// $.ajax.remote = function() {};

// Define exposer
$.toString("ajax", "mii.ajax");

})(mii);