/**
 * @name: so.ajax
 * @deps: so, so.array, so.object
 */

;(function($) {

"use strict"; // @tmp

var re_query = /\?&(.*)/,
    re_json = /^\{.*?\}|\[.*?\]$/,
    re_request = /^([a-z]+|)\s*(.*?)\s*(?:@(json|xml|html)|)\s*$/i,
    xmlHttpObjects = [
        function() { return new ActiveXObject("Microsoft.XMLHTTP"); },
        function() { return new ActiveXObject("Msxml3.XMLHTTP"); },
        function() { return new ActiveXObject("Msxml2.XMLHTTP"); },
        function() { return new XMLHttpRequest(); }
    ],
    // ready states
    readyStates = {
        UNSENT: 0,
        OPENED: 1,
        HEADERS_RECEIVED: 2,
        LOADING: 3,
        DONE: 4
    },
    // default options
    optionsDefault = {
        autoSend: true,
        url: "",
        method: "GET",
        async: true,
        data: null,
        dataType: "json",
        noCache: true,
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
    if (input && input.nodeType == 9) {
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
    if (!re_json.test(input)) {
        throw ("No valid JSON provided!");
    }
    if (JSON && JSON.parse) {
        return JSON.parse(input);
    }

    // ay em sori beybe...
    return eval("("+ input +")");
}

function buildQuery(data) {
    var key, query = [];
    for (key in data) {
        data.hasOwnProperty(key)
            && query.push(encodeURIComponent(key) +"="+ encodeURIComponent(data[key]));
    }
    return query.join("&").replace(/%20/g, "+");
}

function parseHeaders(headers) {
    if (!headers) {
        return;
    }

    var tmp, tmps = headers.split("\r\n");
    headers = {};
    while (tmp = tmps.shift()) {
        tmp = tmp.split(":", 2);
        headers[$.trim(tmp[0]).toLowerCase()] = $.trim(tmp[1]);
    }

    return headers;
}

function onReadyStateChange(_this) {
    if (_this.isAborted) {
        _this.$xhr.onreadystatechange = null;
        return;
    }

    // handle states
    _this.readyState = _this.$xhr.readyState;
    switch (_this.readyState) {
        case readyStates.OPENED:
            // call onstart
            _this.options.onStart.call(_this, _this);
            break;
        case readyStates.HEADERS_RECEIVED:
            // get headers (suppressing ie7 error)
            if (typeof _this.$xhr.getAllResponseHeaders == "function") {
                _this.response.headers = parseHeaders(_this.$xhr.getAllResponseHeaders());
            }
            break;
        case readyStates.LOADING:
            // call onprogress
            _this.options.onProgress.call(_this, _this);
            break;
        case readyStates.DONE:
            _this.isDone = true;
            _this.response.status.code = _this.$xhr.status;
            _this.response.status.text = _this.$xhr.statusText;

            // process response data
            _this.response.data = (_this.request.dataType == "xml")
                ? _this.$xhr.responseXML || _this.$xhr.responseText
                : _this.$xhr.responseText;

            if (_this.request.dataType == "json") {
                _this.response.data = toJson(_this.response.data);
                _this.response.dataType = "json";
            } else if (_this.request.dataType == "xml") {
                _this.response.data = toXml(_this.response.data);
                _this.response.dataType = "xml";
            }

            // call response status methods if exist
            if (typeof _this.options[_this.response.status.code] == "function") {
                _this.options[_this.response.status.code].call(_this, _this.response.data);
            }

            // call onsuccess/onfail method
            if (_this.response.status.code >= 100 && _this.response.status.code < 400) {
                _this.options.onSuccess.call(_this, _this.response.data);
            } else {
                _this.options.onFail.call(_this, _this.response.data);
            }

            // call ondone method
            _this.options.onDone.call(_this, _this.response.data);

            // remove onreadystatechange
            _this.$xhr.onreadystatechange = null;
            break;
    }
}

/*** the ajax ***/
function Ajax(options) {
    // extend options
    this.options = $.mix({}, optionsDefault, options);

    // create request
    this.$xhr = createRequest();

    // request & response
    this.request = {
            data: null,
        dataType: optionsDefault.dataType,
         headers: {"X-Requested-With": "XMLHttpRequest"}
    };
    this.response = {
            data: null,
        dataType: undefined,
         headers: {},
          status: {code: 0, text: ""}
    };

    // extend request headers
    if (this.options.headers) {
        this.request.headers = $.extend(
            this.request.headers, $.object.pick(this.options, 'headers'));
    }

    // set method name as uppercase
    this.request.url = $.trim(this.options.url);
    this.request.method = $.trim(this.options.method).toUpperCase();

    // correct file path for "localhost" only
    if (location.host == "localhost"
            && this.request.url && this.request.url.charAt(0) == "/") {
        this.request.url = this.request.url.substring(1);
    }

    // prepare request data
    if (this.options.data) {
        this.request.data = (typeof this.options.data == "object")
            ? buildQuery(this.options.data) : this.options.data;
        // add data as query string
        if (this.request.method == "GET") {
            if (this.request.url) {
                this.request.url = (this.request.url.indexOf("?") == -1)
                    ? this.request.url += "?"+ this.request.data
                    : this.request.url += "&"+ this.request.data;
            } else {
                this.request.url += "?"+ this.request.data
            }
        }
    }

    // add no-cache helper
    if (this.request.method == "GET" && this.options.noCache !== false) {
        this.request.url += (this.request.url.indexOf("?") == -1)
            ? "?_="+ $.now() : "&_="+ $.now();
    }

    // clear url
    this.request.url = this.request.url.replace(re_query, "?$1");

    // set states
    this.readyState = 0;
    this.isAborted  = false;
    this.isSent     = false;
    this.isDone     = false;

    // send if autosend not false
    if (this.options.autoSend !== false) {
        return this.send();
    }
}

$.extend(Ajax.prototype, {
    send: function() {
        var _this = this;

        // prevent re-send for chaining callbacks
        if (this.isSent || this.isAborted) {
            return this;
        }

        // open connection
        this.$xhr.open(this.request.method, this.request.url, this.options.async);
        // set request header for post etc.
        if (this.request.method != "GET" && this.request.data && this.request.data.length) {
            this.$xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        }

        // set request headers if exist
        for (var key in this.request.headers) {
            this.request.headers.hasOwnProperty(key)
                && this.$xhr.setRequestHeader(key, this.request.headers[key]);
        }

        // define ready state change method
        if (this.options.async) {
            this.$xhr.onreadystatechange = function(){
                onReadyStateChange(_this);
            };
        }

        // call beforesend function
        if (typeof this.options.beforeSend == "function") {
            this.options.beforeSend.call(this, this);
        }

        // send request
        this.$xhr.send(this.request.data);

        // call aftersend function
        if (typeof this.options.afterSend == "function") {
            this.options.afterSend.call(this, this);
        }

        // handle async
        if (!this.options.async) {
            onReadyStateChange(this);
        }

        // sent flag
        this.isSent = true;

        // check timeout
        if (this.options.timeout) {
            setTimeout(function(){ _this.abort(); }, this.options.timeout);
        }

        return this;
    },
    abort: function() {
        this.isAborted = true;
        // abort request
        this.$xhr.abort();
        // call onabort method
        this.options.onAbort.call(this, this);
    },
    setRequestHeader: function(key, value) {
        // while calling this method, don't forget to set autoSend=false
        if (typeof key == "object") {
            for (var i in key) {
                key.hasOwnProperty(i)
                    && (this.request.headers[i] = key[i]);
            }
        } else {
            this.request.headers[key] = value;
        }
        return this;
    },
    getResponseHeader: function(key) {
        return this.response.headers[key.toLowerCase()];
    },
    getResponseHeaderAll: function() {
        return this.response.headers;
    }
});

// add ajax to so
$.ajax = function(options, data, onDone, onSuccess, onFail) {
    if (typeof options == "string") {
        // <method> <url> <response data type>
        // notation: /foo
        // notation: /foo @json
        // notation: GET /foo @json
        var tmp = re_request.exec($.trim(options)) || [,,,];
        options = {};
        options.url = $.trim(tmp[2]);
        options.method = $.trim(tmp[1]) || optionsDefault.method;
        options.dataType = $.trim(tmp[3]) || optionsDefault.dataType;
    } else {
        options = options || {};
    }

    if (!options.url) {
        throw ("URL is required!");
    }

    // swap args
    if (typeof data == "function") {
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
        if (typeof options == "string") {
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
