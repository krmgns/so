/**
 * @package so
 * @object  so.http
 * @depends so, so.class
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function($, NULL, TRUE, FALSE, UNDEFINED) { 'use strict';

    var $win = $.win();
    var $trim = $.trim, $extend = $.extend, $options = $.options, $for = $.for, $forEach = $.forEach,
        $isFunction = $.isFunction, $isString = $.isString, $isArray = $.isArray,
        $isObject = $.isObject, $isIterable = $.isIterable, $isDocument = $.isDocument,
        $isNumeric = $.isNumeric, $isDefined = $.isDefined, $class = $.class,
        $logWarn = $.logWarn;

    var re_space = /%20/g;
    var re_httpHost = /^(?:https?:)?\/\/([^:/]+)/i;
    var re_post = /^P(?:OST|UT|ATCH)$/i;
    var re_json = /^(?:\{.*\}|\[.*\]|".*"|-?\d+(?:\.\d+)?|true|false|null)$/;
    var re_request = /^([A-Z]+)?\s*(.*?)\s*(?:@(json|xml|html|plain))?$/;
    var re_dataType = /\/(json|xml|html|plain)(?:[; ])?/i;

    var xhr = 'XMLHttpRequest'; // what an ugly name..
    var optionsDefault = {
        method: 'GET',
        uri: '', uriParams: NULL,
        data: NULL, dataType: NULL,
        async: TRUE, autoSend: TRUE, noCache: UNDEFINED,
        headers: {'X-Requested-With': xhr},
        // onStart: NULL, onStop: NULL, /* @todo: queue? */
        // onHeaders: NULL, onProgress: NULL,
        // onDone: NULL, onSuccess: NULL, onFailure: NULL,
        // onAbort: NULL, onTimeout: NULL, onBeforeSend: NULL, onAfterSend: NULL,
        ons: {} // all other on.. stuff
    };

    var STATE_OPENED = 1, STATE_HEADERS_RECEIVED = 2, STATE_LOADING = 3, STATE_DONE = 4;

    // add base methods
    var $http = {
        /**
         * Parse XML.
         * @param  {Any}    input
         * @param  {String} inputType?
         * @return {Document}
         */
        parseXml: function(input, inputType) {
            if ($isDocument(input)) {
                return input;
            }

            if (!$isString(input)) {
                return $logWarn('No valid XML.'), NULL;
            }

            return new DOMParser.parseFromString(input, inputType || 'text/xml');
        },

        /**
         * Parse JSON.
         * @param  {String} input
         * @return {Any}
         */
        parseJson: function(input) {
            input = $trim(input);

            if (!re_json.test(input)) {
                return $logWarn('No valid JSON.'), NULL;
            }

            return $.util.jsonDecode(input);
        },

        /**
         * Parse headers.
         * @param  {String} headers
         * @return {Object}
         */
        parseHeaders: function(headers) {
            var i = 0, ret = {};

            headers = $trim(headers);
            if (headers) {
                headers.split('\r\n').each(function(header) {
                    header = header.splits(':', 2);
                    if (header[1] == NULL) { // status line etc.
                        ret[i++] = $trim(header[0]);
                    } else {
                        ret[$trim(header[0]).toCamelCase('-')] = $trim(header[1]);
                    }
                });
            }

            return ret;
        },

        /**
         * Serialize.
         * @param  {Any}  data
         * @param  {Bool} opt_array?
         * @return {String}
         */
        serialize: function(data, opt_array) {
            if ($isString(data) || !$isIterable(data)) {
                return data;
            }

            var ret = [], encode = $.util.urlEncode;

            // check if comes from $.dom.serializeArray()
            if (opt_array) {
                $for(data, function(item) {
                    ret.push('%s=%s'.format(item.key, encode(item.value)));
                });
            } else {
                // only two-dimensionals prosessed
                $forEach(data, function(key, value) {
                    key = encode(key);
                    if ($isArray(value)) {
                        if (value.len()) {
                            while (value.len()) {
                                ret.push('%s[]=%s'.format(key, encode(value.shift())));
                            }
                        } else ret.push('%s[]='.format(key));
                    } else if ($isObject(value)) {
                        $forEach(value, function(_key, _value) {
                            ret.push('%s[%s]=%s'.format(key, _key, encode(_value)));
                        });
                    } else {
                        ret.push('%s=%s'.format(key, encode(value)));
                    }
                });
            }

            return ret.join('&').replace(re_space, '+');
        }
    };

    /**
     * Message.
     * @param {Client} client
     * @param {Object} _this @internal // just as minify candy
     */
    function Message(client, _this) {
        _this = this;
        _this.client = client;
        _this.headers = {};
        _this.data = NULL;
        _this.dataType = NULL;
    }

    /**
     * Request.
     * @param {Client} client
     * @param {Object} _this @internal // just as minify candy
     */
    function Request(client, _this) {
        _this = this;
        _this.super(client);
        _this.method = client.options.method;
        _this.uri = client.options.uri;
        _this.uriParams = client.options.uriParams;
    }

    /**
     * Response.
     * @param {Client} client
     * @param {Object} _this @internal // just as minify candy
     */
    function Response(client, _this) {
        _this = this;
        _this.super(client);
        _this.status = NULL;
        _this.statusCode = NULL;
        _this.statusText = NULL;
    }

    // extend request & response
    $class(Request).extends(Message);
    $class(Response).extends(Message);

    // shortcut helpers
    function addUriParams(uri, uriParams) {
        return $.empty(uriParams) ? uri : (uri += (!uri.has('?') ? '?' : '&') + $http.serialize(uriParams));
    }

    function onReadyStateChange(client) {
        if (client.aborted) {
            return offReadyStateChange(client);
        }

        // handle states
        client.state = client.api.readyState;
        switch (client.state) {
            case STATE_OPENED:           client.fire('start');    break;
            case STATE_HEADERS_RECEIVED: client.fire('headers');  break;
            case STATE_LOADING:          client.fire('progress'); break;
            case STATE_DONE:             client.done = TRUE;
                var statusCode = client.api.status;
                var statusText = client.api.statusText;
                var status = statusCode ? 'HTTP/1.1 %s %s'.format(statusCode, statusText) : NULL; // HTTP/1.1?
                var headers = $http.parseHeaders(client.api.getAllResponseHeaders());
                var data = client.api.responseText;
                var dataType = client.options.dataType || (re_dataType.exec(headers.contentType) || [, NULL])[1];
                var trigger = client.options.trigger;

                // release trigger object (element)
                if (trigger) {
                    trigger.disabled = FALSE;
                }

                if (status) {
                    client.response.status = headers[0] = status;
                }
                client.response.statusCode = statusCode;
                client.response.statusText = statusText;
                client.response.headers = headers;

                // parse wars..
                if (dataType == 'json') {
                    data = $http.parseJson(data);
                } else if (dataType == 'xml') {
                    data = $http.parseXml(data);
                }
                client.response.data = data;
                client.response.dataType = dataType;

                // specials, eg: 200: function(){...}
                client.fire(statusCode);

                // success or failure?
                client.fire(statusCode > 99 && statusCode < 400 ? 'success' : 'failure', data);

                // end!
                client.fire('done', data);

                offReadyStateChange(client);
                break;
            default:
                $logWarn('Unknown HTTP error.');
        }
    }

    function offReadyStateChange(client) {
        client.api.onreadystatechange = NULL;
    }

    /**
     * Client.
     * @param {String} uri
     * @param {Object} options
     */
    function Client(uri, options) {
        uri = $trim(uri);
        if (!uri) {
            throw ('URI required!');
        }

        options = $options(optionsDefault, options);
        options.method = (options.method || optionsDefault.method).upper();
        options.uri = uri;
        options.headers = $options(optionsDefault.headers, options.headers);

        // cross domain?
        var match = uri.match(re_httpHost);
        if (match && match[1] != $win.location.host) {
            delete options.headers['X-Requested-With'];
        }

        // handle post content type
        if (re_post.test(options.method)) {
            options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }

        if (options.uriParams) {
            options.uri = addUriParams(options.uri, options.uriParams);
        } else if (options.data && options.method == 'GET') {
            options.uri = addUriParams(options.uri, options.data);
        }

        if (options.noCache) {
            options.uri = addUriParams(options.uri, {_: $.now()});
        }

        // update uriParams
        if (options.uri.has('?')) {
            options.uriParams = options.uriParams || {}
            options.uri.split('?')[1].split('&').each(function(query) {
                query = query.splits('=', 2);
                if (query[0]) {
                    options.uriParams[query[0]] = query[1];
                }
            });
        }

        var _this = this; // just as minify candy
        _this.sent = _this.done = _this.error = _this.aborted = FALSE;
        _this.state = NULL;

        _this.options = options;
        _this.request = new Request(_this);
        _this.response = new Response(_this);

        _this.request.data = options.data;
        _this.request.dataType = options.dataType;
        _this.request.headers = options.headers;

        _this.api = new $win[xhr];
        _this.api.open(_this.request.method, _this.request.uri, !!options.async);
        _this.api.onerror = function(e) {
            _this.fire('error', e);
            _this.error = TRUE;
        };
        _this.api.client = _this;

        if (options.async) {
            _this.api.onreadystatechange = function() {
                onReadyStateChange(_this);
            };
        }

        // sen if autoSend true
        if (options.autoSend) {
            _this.send();
        }
    }

    $extend(Client.prototype, {
        /**
         * Send.
         * @return {Client}
         */
        send: function() {
            var _this = this, data,
                request = _this.request,
                timeout = _this.options.timeout,
                trigger = _this.options.trigger;

            if (!_this.sent && !_this.aborted) {
                _this.fire('beforeSend');

                $forEach(request.headers, function(name, value) {
                    _this.api.setRequestHeader(name, value);
                });

                // check data
                if (re_post.test(request.method)) {
                    data = $http.serialize(request.data);
                }

                _this.api.send(data);
                _this.fire('afterSend');
                _this.sent = TRUE;

                // hold trigger object (element)
                if (trigger) {
                    trigger.disabled = TRUE;
                }

                if (timeout) {
                    $.fire(timeout, function() {
                        _this.cancel(TRUE);
                    });
                }
            }

            return _this;
        },

        /**
         * Fire.
         * @param  {String|Function} fn
         * @param  {Array}           fnArgs?
         * @return {void}
         */
        fire: function(fn, fnArgs) {
            var _this = this;

            // check 'ons'
            if (_this.options.ons[fn]) {
                fn = _this.options.ons[fn];
            } else if (!$isFunction(fn)) {
                fn = $isNumeric(fn) ? fn // status code functions (eg: 200)
                   : 'on'+ fn.toCapitalCase();
                if (_this.options[fn]) {
                    fn = _this.options[fn];
                }
            }

            if ($isFunction(fn)) {
                var args = [_this];
                if ($isDefined(fnArgs)) {
                    args = [fnArgs].concat(args); // prepend
                }
                fn.apply(_this, args);
            }
        },

        /**
         * Cancel
         * @param  {Bool} opt_timeout?
         * @return {void}
         */
        cancel: function(opt_timeout) {
            var _this = this;

            _this.api.abort();
            _this.fire('abort');
            _this.aborted = TRUE;

            if (opt_timeout) {
                _this.fire('timeout');
            }
        },

        /**
         * End.
         * @param  {Function} fn
         * @return {Client}
         */
        end: function(fn) {
            return this.on('done', fn);
        },

        /**
         * Ok.
         * @return {Bool}
         */
        ok: function() {
            return (200 === this.response.statusCode);
        },

        /**
         * Is success.
         * @return {Bool}
         */
        isSuccess: function(code /* @internal */) {
            return (code = this.response.statusCode)
                && (code >= 200 && code <= 299);
        },

        /**
         * Is failure.
         * @return {Bool}
         */
        isFailure: function(code /* @internal */) {
            return (code = this.response.statusCode)
                && (code >= 400 && code <= 599);
        },

        /**
         * On.
         * @param  {String}   name
         * @param  {Function} callback
         * @return {Client}
         */
        on: function(name, callback) {
            this.options.ons[name] = callback;
            return this;
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
     * Init.
     * @param  {String}          uri
     * @param  {Object|Function} options?
     * @param  {Function}        onDone?
     * @param  {Function}        onSuccess?
     * @param  {Function}        onFailure?
     * @param  {String}          method? @internal
     * @return {Client}
     */
    function init(uri, options, onDone, onSuccess, onFailure, method) {
        if ($isFunction(options)) {
            onDone = options, options = NULL;
        }

        options = options || {};
        if (!$isString(uri)) throw ('URI must be a string!');
        if (!$isObject(options)) throw ('Options must be an object!');

        uri = $trim(uri);
        if (uri.has(' ')) {
            // <method> <uri> @<dataType>, (eg: '/foo', '/foo @json', 'GET /foo', 'GET /foo @json')
            var re = re_request.exec(uri);
            if (re) {
                options.method = re[1] || method;
                options.uri = uri = re[2];
                options.dataType = re[3];
            }
        } else if (method) { // for get/post/put/delete shortcut methods
            options.method = method;
            options.uri = uri;
        }

        return initClient(uri, $options(options, {
            onDone: options.onDone || onDone,
            onSuccess: options.onSuccess || onSuccess,
            onFailure: options.onFailure || onFailure
        }));
    }

    // add more methods
    $extend($http, {
        Client: initClient,
        Request: initRequest,
        Response: initResponse,
        get: function(uri, options, onDone, onSuccess, onFailure) {
            return init(uri, options, onDone, onSuccess, onFailure, 'get');
        },
        post: function(uri, options, onDone, onSuccess, onFailure) {
            return init(uri, options, onDone, onSuccess, onFailure, 'post');
        },
        put: function(uri, options, onDone, onSuccess, onFailure) {
            return init(uri, options, onDone, onSuccess, onFailure, 'put');
        },
        delete: function(uri, options, onDone, onSuccess, onFailure) {
            return init(uri, options, onDone, onSuccess, onFailure, 'delete');
        },
        request: function(uri, options, onDone, onSuccess, onFailure) {
            return init(uri, options, onDone, onSuccess, onFailure);
        },
        load: function(uri, options, onDone, onSuccess, onFailure) {
            return init(uri, options, onDone, onSuccess, onFailure, 'get');
        }
    });

    // export http
    $.http = $http;

})(window.so, null, true, false);
