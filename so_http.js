;(function(window, $) { 'use strict';

    var re_query = /\?&(.*)/,
        re_json = /^(\{.*\}|\[.*\]|".*"|\d+(\.\d+)?|true|false|null)$/,
        re_request = /^([a-z]+)?\s*(.*?)\s*(?:@(json|text|html|xml))?$/i,
        fn_encode = encodeURIComponent,
        optionsDefault = {
            method: 'GET', uri: '', async: true, data: null, dataType: 'json',
            noCache: true, autoSend: true, onStart: null, onStop: null, /* @todo: queue */
            onProgress: null, onHeaders: null, onDone: null, onSuccess: null, onFailure: null,
            onAbort: null, onTimeout: null, onBeforeSend: null, onAfterSend: null
        },
        STATE_OPENED = 1, STATE_HEADERS_RECEIVED = 2, STATE_LOADING = 3, STATE_DONE = 4
    ;

    $.extend('@http', {
        parseXml: function(input, inputType) {
            if ($.isDocument(input)) { return input; }
            if (!$.isString(input)) { return null; }
            return new DOMParser.parseFromString(input, inputType || 'text/xml');
        },
        parseJson: function(input) {
            input = $.trim(input);
            if (!re_json.test(input)) { return input; }
            return JSON.parse(input);
        },
        // only two-dimensionals
        toQueryString: function(data) {
            var ret = [];
            if ($.isList(data)) data = data.data;
            $.forEach(data, function(value, key) {
                key = fn_encode(key);
                if ($.isArray(value)) {
                    if (value.length) {
                        while (value.length) {
                            ret.push('%s[]=%s'.format(key, fn_encode(value.shift())));
                        }
                    } else ret.push('%s[]='.format(key));
                } else if ($.isObject(value)) {
                    $.forEach(value, function(_value, _key) {
                        ret.push('%s[%s]=%s'.format(key, _key, fn_encode(_value)));
                    });
                } else {
                    ret.push('%s=%s'.format(key, fn_encode(value)));
                }
            });
            return ret.join('&').replace(/%20/g, '+');
        },
        parseHeaders: function(headers) {
            var ret = {}, key, value;
            if ($.isString(headers)) {
                headers.split('\r\n').forEach(function(header) {
                    header = header.split(':', 2);
                    if (header.length == 1) {
                        key = 0, value = header[0];
                    } else {
                        key = header[0], value = header[1];
                    }
                    ret[$.trim(key)] = $.trim(value);
                });
            }
            return ret;
        }
    });

    function Stream(client) {
        this.client = client;
        this.headers = {};
        this.data = null;
        this.dataType = null;
        this.parseData = function() {
            var data = this.data;
            if (this.dataType == 'json') {
                data = $.http.parseJson(data);
            } else if (this.dataType == 'xml') {
                data = $.http.parseXml(data)
            }
            return data;
        };
    }

    function Request(client) {
        this.super(client);
        this.method = client.options.method;
        this.uri = client.options.uri;
    }
    function Response(client) {
        this.super(client);
        this.status = null;
        this.statusCode = null;
        this.statusText = null;
    }

    $.class(Request).extends(Stream);
    $.class(Response).extends(Stream);

    function Client(uri, options) {
        if (!uri) {
            throw ('URI required!');
        }
        options = $.extend({uri: uri}, optionsDefault, options);
        this.options = options;
        this.request = new Request(this);
        this.response = new Response(this);

        this.$xhr = new XMLHttpRequest();
        this.$xhr.open(options.method, options.uri, options.async);
        if (this.request.method != 'GET') {
            this.$xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        if (options.headers) {
            $.forEach(this.request.headers, function(key, value) {
                this.$xhr.setRequestHeader(key, this.request.headers[key] = value);
            }, this);
        }

        // correct file path for 'localhost' only
        if (window.location.host == 'localhost' && this.request.uri && this.request.uri.charAt(0) == '/') {
            this.request.uri = this.request.uri.substring(1);
        }

        if (options.async) {
            // this.$xhr.onreadystatechange = onReadyStateChange;
        }
    }

    $.extend(Client, null, {
        send: function() {
            var _this = this, options = this.options;
            if (this.sent || this.aborted) {
                return this;
            }
            options.onBeforeSend && options.onBeforeSend(this);
            this.$xhr.send(this.request.data);
            this.sent = true;
            options.onAfterSend && options.onAfterSend(this);
            if (options.timeout) {
                setTimeout(function(){
                    _this.abort();
                    options.onTimeout && options.onTimeout(_this);
                }, options.timeout);
            }
            return this;
        }
    });

    log(Client.prototype)
    var a = new Client("/")
    log(a.send)


})(window, so);
