;(function(window, $) { 'use strict';

    var re_query = /\?&+(.*)/,
        re_post = /P(UT|OST)/i,
        re_json = /^(\{.*\}|\[.*\]|".*"|\d+(\.\d+)?|true|false|null)$/,
        re_request = /^([a-z]+)?\s*(.*?)\s*(?:@(json|xml|html|text))?$/i,
        re_dataTypes = /\/(json|xml|html|plain)(?:[; ])?/i,
        fn_encode = encodeURIComponent,
        optionsDefault = {
            method: 'GET', uri: '', uriParams: null, data: null, dataType: 'json', headers: {},
            async: true, noCache: true, autoSend: true,
            onStart: null, onStop: null, /* @todo: queue */ onProgress: null, onHeaders: null,
            onDone: null, onSuccess: null, onFailure: null,
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
        serialize: function(data) {
            if (!$.isIterable(data)) {
                return data;
            }
            if ($.isList(data)) {
                data = data.data;
            }
            var ret = [];
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
            var ret = {};
            if ($.isString(headers)) {
                headers.trim().split('\r\n').forEach(function(header) {
                    header = header.split(':', 2),
                        ret[$.trim(header[0]).toLowerCase()] = $.trim(header[1]);
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
    }

    function Request(client) {
        this.super(client);
        this.method = client.options.method;
        this.uri = client.options.uri;
        this.uriParams = client.options.uriParams;
    }

    function Response(client) {
        this.super(client);
        this.status = null;
        this.statusCode = null;
        this.statusText = null;
    }

    $.class(Request).extends(Stream);
    $.class(Response).extends(Stream);

    function removeReadyStateChange(client) {
        client.api.onreadystatechange = null;
    }

    function onReadyStateChange(client) {
        if (client.aborted) {
            return removeReadyStateChange(client);
        }

        // handle states
        client.state = client.api.readyState;
        switch (client.state) {
            case STATE_OPENED:           client.fire('start');    break;
            case STATE_HEADERS_RECEIVED: client.fire('headers');  break;
            case STATE_LOADING:          client.fire('progress'); break;
            case STATE_DONE:
                client.done = true;

                var status = 'HTTP/1.1 %s %s'.format(client.api.status, client.api.statusText),
                    headers = $.http.parseHeaders(client.api.getAllResponseHeaders()),
                    data = client.api.responseText,
                    dataType = client.options.dataType
                        || (re_dataTypes.exec(headers['content-type']) || [,])[1];

                client.response.status = headers[0] = status;
                client.response.statusCode = client.api.status;
                client.response.statusText = client.api.statusText;
                client.response.headers = headers;

                if (dataType == 'json') {
                    client.response.data = $.http.parseJson(data);
                } else if (dataType == 'xml') {
                    client.response.data = $.http.parseXml(data);
                } else {
                    client.response.data = data;
                }
                client.response.dataType = dataType;

                // specials, e.g: 200: function(){...}
                client.fire(null, client.response.statusCode);

                // success or failure
                client.fire((client.response.statusCode > 99 && client.response.statusCode < 400)
                    ? 'success' : 'failure');

                // end!
                client.fire('done');

                removeReadyStateChange(client);
                break;
        }
    }

    function Client(uri, options) {
        if (!uri) {
            throw ('URI required!');
        }

        options = $.extend({}, optionsDefault, options);
        options.uri = uri;
        options.method = (options.method || optionsDefault.method).toUpperCase();
        options.headers = $.extend({}, optionsDefault.headers, options.headers);
        if (re_post.test(options.method)) {
            options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        if (options.uriParams) {
            options.uri = options.uri.append(!options.uri.index('?') ? '?' : '&',
                $.http.serialize(options.uriParams));
        }
        if (!options.noCache) {
            options.uri = options.uri.append(!options.uri.index('?') ? '?' : '&', '_=', $.now());
        }
        options.uri = options.uri.replace(re_query, '?$1');

        var _this = this;
        this.options = options;
        this.request = new Request(this);
        this.response = new Response(this);

        this.api = new XMLHttpRequest(); // what an ugly name..
        this.api.open(this.request.method, this.request.uri, !!options.async);

        this.request.data = options.data;
        this.request.dataType = options.dataType;
        this.request.headers = $.extend({}, options.headers, {'X-Requested-With': 'XMLHttpRequest'});

        if (options.async) {
            this.api.onreadystatechange = function() {
                onReadyStateChange(_this);
            };
        }

        this.state = 0;
        this.sent = false;
        this.done = false;
        this.aborted = false;

        this.api.client = this;

        if (options.autoSend) {
            this.send();
        }
    }

    $.extendPrototype(Client, {
        send: function() {
            var _this = this, options = this.options;
            if (!this.sent && !this.aborted) {
                $.forEach(this.request.headers, function(value, key) {
                    _this.api.setRequestHeader(key, value);
                });

                this.fire('beforeSend');
                this.api.send($.http.serialize(this.request.data));
                this.fire('afterSend');

                this.sent = true;

                if (options.timeout) {
                    var i = setTimeout(function(){
                        _this.cancel();
                        _this.fire('timeout');
                        clearTimeout(i);
                    }, options.timeout);
                }
            }
            return this;
        },
        fire: function(fn, fnCode) {
            if (!$.isFunction(fn)) {
                fn = fn ? 'on'+ fn.toCapitalCase() : fnCode;
                if (this.options[fn]) {
                    fn = this.options[fn];
                }
            }
            $.isFunction(fn) && fn(this.request, this.response, this);
        },
        cancel: function() {
            this.api.abort();
            this.call('abort');
            this.aborted = true;
        },
        // final callback
        end: function(fn) {
            var _this = this, i;
            i = setInterval(function() {
                if (_this.done) {
                    _this.fire(fn);
                    clearInterval(i);
                }
            }, 1);
            return this;
        }
    });

    // shortcuts
    function initClient(uri, options) { return new Client(uri, options); }
    function initRequest(client) { return new Request(client); }
    function initResponse(client) { return new Response(client); }

    // init's helper
    function prepareArgs(uri, options, onDone, onSuccess, onFailure, method) {
        if (!$.isString(uri)) {
            throw ('URI must be string!');
        }
        var re, optionsNew = {uri: uri, method: method};
        if (uri.index(' ')) {
            re = re_request.exec(uri);
            re && (optionsNew.method = re[1], optionsNew.uri = re[2], optionsNew.dataType = re[3]);
        } else {
            optionsNew.uri = uri;
        }

        if ($.isFunction(options)) {
            optionsNew = $.extend(optionsNew,
                {onDone: options, onSuccess: onDone, onFailure: onSuccess});
        } else if ($.isObject(options)) {
            optionsNew = $.extend(optionsNew,
                $.extend({onDone: onDone, onSuccess: onSuccess, onFailure: onSuccess}, options));
        }

        return {uri: uri, options: optionsNew};
    }

    $.extend('@http', {
        Client: initClient,
        Request: initRequest,
        Response: initResponse,
        get: function(uri, options, onDone, onSuccess, onFailure) {
            var args = prepareArgs(uri, options, onDone, onSuccess, onFailure, 'GET');
            return initClient(args.uri, args.options);
        },
        post: function(uri, options, onDone, onSuccess, onFailure) {
            var args = prepareArgs(uri, options, onDone, onSuccess, onFailure, 'POST');
            return initClient(args.uri, args.options);
        },
        request: function(uri, options, onDone, onSuccess, onFailure) {
            var args = prepareArgs(uri, options, onDone, onSuccess, onFailure);
            return initClient(args.uri, args.options);
        }
    });

})(window, so);
