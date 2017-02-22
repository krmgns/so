/**
 * @package so
 * @object  so.http
 * @depends so, so.class
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $) { 'use strict';

    // minify candies
    var NULL = null, NULLS = '';
    var TRUE = true, FALSE = false;

    var re_query = /\?&+(.*)/;
    var re_post = /P(U|OS)T/i;
    var re_json = /^(\{.*\}|\[.*\]|".*"|\d+(\.\d+)?|true|false|null)$/;
    var re_request = /^([a-z]+)?\s*(.*?)\s*(?:@(json|xml|html|text))?$/i;
    var re_dataTypes = /\/(json|xml|html|plain)(?:[; ])?/i;
    var fn_encode = encodeURIComponent;
    var optionsDefault = {
        method: 'GET', uri: NULLS, uriParams: NULL, data: NULL, dataType: 'json',
        async: TRUE, noCache: TRUE, autoSend: TRUE, headers: {},
        onStart: NULL, onStop: NULL, /* @todo: queue */ onProgress: NULL, onHeaders: NULL,
        onDone: NULL, onSuccess: NULL, onFailure: NULL,
        onAbort: NULL, onTimeout: NULL, onBeforeSend: NULL, onAfterSend: NULL,
        ons: {} // all other on.. stuff
    };
    var STATE_OPENED = 1, STATE_HEADERS_RECEIVED = 2, STATE_LOADING = 3, STATE_DONE = 4;

    // export base methods
    $.http = {
        /**
         * Parse XML.
         * @param  {Any}    input
         * @param  {String} inputType
         * @return {Document}
         */
        parseXml: function(input, inputType) {
            if ($.isDocument(input)) {
                return input;
            }

            if (!$.isString(input)) {
                return NULL;
            }

            return new DOMParser.parseFromString(input, inputType || 'text/xml');
        },

        /**
         * Parse JSON.
         * @param  {String} input
         * @return {Any}
         */
        parseJson: function(input) {
            input = $.trim(input);

            if (!re_json.test(input)) {
                return input;
            }

            return JSON.parse(input);
        },

        /**
         * Parse headers.
         * @param  {String} headers
         * @return {Object}
         */
        parseHeaders: function(headers) {
            var ret = {};

            if ($.isString(headers)) {
                headers.trim().split('\r\n').forEach(function(header) {
                    header = header.split(':', 2),
                        ret[$.trim(header[0]).toLowerCase()] = $.trim(header[1]);
                });
            }

            return ret;
        },

        /**
         * Serialize.
         * @param  {Any} data
         * @return {String}
         */
        serialize: function(data) {
            if (!$.isIterable(data)) {
                return data;
            }

            if ($.isList(data)) {
                data = data.data;
            }

            var ret = [];

            $.forEach(data, function(key, value) { // only two-dimensionals
                key = fn_encode(key);
                if ($.isArray(value)) {
                    if (value.length) {
                        while (value.length) {
                            ret.push('%s[]=%s'.format(key, fn_encode(value.shift())));
                        }
                    } else ret.push('%s[]='.format(key));
                } else if ($.isObject(value)) {
                    $.forEach(value, function(_key, _value) {
                        ret.push('%s[%s]=%s'.format(key, _key, fn_encode(_value)));
                    });
                } else {
                    ret.push('%s=%s'.format(key, fn_encode(value)));
                }
            });

            return ret.join('&').replace(/%20/g, '+');
        }
    };

    /**
     * Stream.
     * @param {Client} client
     */
    function Stream(client) {
        this.client = client;
        this.headers = {};
        this.data = NULL;
        this.dataType = NULL;
    }

    /**
     * Request.
     * @param {Client} client
     */
    function Request(client) {
        this.super(client);
        this.method = client.options.method;
        this.uri = client.options.uri;
        this.uriParams = client.options.uriParams;
    }

    /**
     * Response.
     * @param {Client} client
     */
    function Response(client) {
        this.super(client);
        this.status = NULL;
        this.statusCode = NULL;
        this.statusText = NULL;
    }

    // extend request & response
    $.class(Request).extends(Stream);
    $.class(Response).extends(Stream);

    // shortcut helpers
    function removeReadyStateChange(client) {
        client.api.onreadystatechange = NULL;
    }

    function onReadyStateChange(client) {
        if (client.aborted) {
            return removeReadyStateChange(client);
        }

        // hold trigger button
        if (client.options.trigger) {
            client.options.trigger.disabled = 1;
        }

        // handle states
        client.state = client.api.readyState;
        switch (client.state) {
            case STATE_OPENED:           client.fire('start');    break;
            case STATE_HEADERS_RECEIVED: client.fire('headers');  break;
            case STATE_LOADING:          client.fire('progress'); break;
            case STATE_DONE:
                client.done = TRUE;

                var status = 'HTTP/1.1 %s %s'.format(client.api.status, client.api.statusText),
                    headers = $.http.parseHeaders(client.api.getAllResponseHeaders()),
                    data = client.api.responseText,
                    dataType = client.options.dataType
                        || (re_dataTypes.exec(headers['content-type']) || [,])[1];

                client.response.status = headers[0] = status;
                client.response.statusCode = client.api.status;
                client.response.statusText = client.api.statusText;
                client.response.headers = headers;

                // parse wars..
                if (dataType == 'json') {
                    client.response.data = $.http.parseJson(data);
                } else if (dataType == 'xml') {
                    client.response.data = $.http.parseXml(data);
                } else {
                    client.response.data = data;
                }
                client.response.dataType = dataType;

                // on('data', ...) if data exist
                if (!$.isNulls(client.response.data)) {
                    client.fire('data', client.response.data);
                }

                // specials, eg: 200: function(){...}
                client.fire(client.response.statusCode);

                // success or failure?
                client.fire((client.response.statusCode > 99 && client.response.statusCode < 400)
                    ? 'success' : 'failure');

                // end!
                client.fire('done');

                // release trigger button
                if (client.options.trigger) {
                    client.options.trigger.disabled = 0;
                }

                removeReadyStateChange(client);
                break;
            default:
                throw ('Unknown HTTP error!');
        }
    }

    /**
     * Client.
     * @param {String} uri
     * @param {Object} options
     */
    function Client(uri, options) {
        if (!uri) {
            throw ('URI required!');
        }

        options = $.extend({}, optionsDefault, options);
        options.uri = uri;
        options.method = (options.method || optionsDefault.method).toUpperCase();
        options.headers = $.extend({}, optionsDefault.headers, options.headers);

        // handle post streams
        if (re_post.test(options.method)) {
            options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }

        if (options.uriParams) {
            options.uri = options.uri.append(!options.uri.has('?') ? '?' : '&',
                $.http.serialize(options.uriParams));
        }
        if (!options.noCache) {
            options.uri = options.uri.append(!options.uri.has('?') ? '?' : '&', '_=', $.now());
        }
        options.uri = options.uri.replace(re_query, '?$&');

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
        this.sent = FALSE;
        this.done = FALSE;
        this.aborted = FALSE;

        this.api.client = this;

        // sen if auto-send
        if (options.autoSend) {
            this.send();
        }
    }

    $.extendPrototype(Client, {
        /**
         * Send.
         * @return {this}
         */
        send: function() {
            var _this = this, options = this.options;

            if (!this.sent && !this.aborted) {
                $.forEach(this.request.headers, function(key, value) {
                    _this.api.setRequestHeader(key, value);
                });

                this.fire('beforeSend');
                this.api.send($.http.serialize(this.request.data));
                this.fire('afterSend');

                this.sent = TRUE;

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

        /**
         * Fire.
         * @param  {String|Function} fn
         * @param  {Array}           fnArgs
         * @return {void}
         */
        fire: function(fn, fnArgs) {
            // check 'ons'
            if (this.options.ons[fn]) {
                fn = this.options.ons[fn];
            } else if (!$.isFunction(fn)) {
                fn = $.isNumeric(fn) // status code functions
                    ? fn : fn.toCapitalCase().prepend('on');
                if (this.options[fn]) {
                    fn = this.options[fn];
                }
            }

            if($.isFunction(fn)) {
                var args = [this.request, this.response, this];
                if (fnArgs) {
                    args = [fnArgs].concat(args);
                }
                fn.apply(this, args);
            }
        },

        /**
         * Cancel
         * @return {void}
         */
        cancel: function() {
            this.api.abort();
            this.call('abort');
            this.aborted = TRUE;
        },

        /**
         * End.
         * @param  {Function} fn
         * @return {this}
         */
        end: function(fn) {
            var _this = this, i;

            // actually just calls onDone
            i = setInterval(function() {
                if (_this.done) {
                    _this.fire(fn);
                    clearInterval(i);
                }
            }, 1);

            return this;
        },

        /**
         * On.
         * @param  {String}   name
         * @param  {Function} callback
         * @return {this}
         */
        on: function(name, callback) {
            return this.options.ons[name] = callback, this;
        }
    });

    // shortcut helpers
    function initClient(uri, options) {
        return new Client(uri, options);
    }
    function initRequest(client) {
        return new Request(client);
    }
    function initResponse(client) {
        return new Response(client);
    }

    /**
     * Invoke.
     * @param  {String}             uri
     * @param  {Object|Function}    options
     * @param  {Function|undefined} onDone
     * @param  {Function|undefined} onSuccess
     * @param  {Function|undefined} onFailure
     * @param  {String}             method @internal
     * @return {Client}
     */
    function invoke(uri, options, onDone, onSuccess, onFailure, method) {
        if (!$.isString(uri)) {
            throw ('URI must be string!');
        }

        var re, _options = options = options || {};
        uri = uri.trim();
        if (uri.has(' ')) {
            // <method> <uri> @<data type>, eg: '/foo', '/foo @json', 'GET /foo', 'GET /foo @json'
            re = re_request.exec(uri);
            re && (options.method = re[1], options.uri = re[2], options.dataType = re[3]);
        } else {
            options.uri = uri, options.method = method;
        }

        if ($.isFunction(_options)) {
            // eg: '/foo', function() {...}
            options = $.extend(options, {onDone: _options, onSuccess: onDone, onFailure: onSuccess});
        } else if ($.isObject(_options)) {
            // eg: '/foo', {...}
            options = $.extend(options,
                $.extend({onDone: onDone, onSuccess: onSuccess, onFailure: onSuccess}, _options));
        }

        return initClient(uri, options);
    }

    // export more methods
    $.extend($.http, {
        Client: initClient,
        Request: initRequest,
        Response: initResponse,
        get: function(uri, options, onDone, onSuccess, onFailure) {
            return invoke(uri, options, onDone, onSuccess, onFailure, 'get');
        },
        post: function(uri, options, onDone, onSuccess, onFailure) {
            return invoke(uri, options, onDone, onSuccess, onFailure, 'post');
        },
        request: function(uri, options, onDone, onSuccess, onFailure) {
            return invoke(uri, options, onDone, onSuccess, onFailure);
        }
    });

})(window, so);
