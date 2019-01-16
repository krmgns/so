/**
 * @package so
 * @object  so.http
 * @depends so, so.class
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $, NULL, TRUE, FALSE) { 'use strict';

    var re_query = /\?&+(.*)/;
    var re_space = /%20/g;
    var re_httpHost = /^(?:https?:)?\/\/([^:/]+)/i;
    var re_post = /^P(?:U|OS)T$/i;
    var re_json = /^(?:\{.*\}|\[.*\]|".*"|-?\d+(?:\.\d+)?|true|false|null)$/;
    var re_request = /^([A-Z]+)?\s*(.*?)\s*(?:@(json|xml|html|plain))?$/;
    var re_dataType = /\/(json|xml|html|plain)(?:[; ])?/i;
    var xhr = 'XMLHttpRequest'; // what an ugly name..
    var optionsDefault = {
        method: 'GET', uri: '', uriParams: NULL, data: NULL, dataType: NULL,
        async: TRUE, noCache: TRUE, autoSend: TRUE, headers: {'X-Requested-With': xhr},
        // onStart: NULL, onStop: NULL, /* @todo: queue */
        // onHeaders: NULL, onProgress: NULL,
        // onDone: NULL, onSuccess: NULL, onFailure: NULL,
        // onAbort: NULL, onTimeout: NULL, onBeforeSend: NULL, onAfterSend: NULL,
        ons: {} // all other on.. stuff
    };
    var STATE_OPENED = 1, STATE_HEADERS_RECEIVED = 2, STATE_LOADING = 3, STATE_DONE = 4;
    var $trim = $.trim, $extend = $.extend, $options = $.options, $forEach = $.forEach,
        $isFunction = $.isFunction, $isString = $.isString, $isArray = $.isArray,
        $isObject = $.isObject, $isIterable = $.isIterable, $isDocument = $.isDocument,
        $isNumeric = $.isNumeric, $isDefined = $.isDefined, $split = $.split, $class = $.class,
        $logWarn = $.logWarn, $jsonDecode = $.util.jsonDecode;

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
                return $logWarn('No valid XML given.'), NULL;
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
                return $logWarn('No valid JSON given.'), NULL;
            }

            return $jsonDecode(input);
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
                headers.split('\r\n').forEach(function(header) {
                    header = $split(header, ':', 2);
                    if (header[1] == NULL) { // status line etc.
                        ret[i++] = $trim(header[0]);
                    } else {
                        ret[$trim(header[0]).toLowerCase()] = $trim(header[1]);
                    }
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
            if ($isString(data) || !$isIterable(data)) {
                return data;
            }

            var ret = [], encode = encodeURIComponent;

            // only two-dimensionals prosessed
            $forEach(data, function(key, value) {
                key = encode(key);
                if ($isArray(value)) {
                    if (value.length) {
                        while (value.length) {
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

            return ret.join('&').replace(re_space, '+');
        }
    };

    /**
     * Message.
     * @param {Client} client
     */
    function Message(client) {
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
    $class(Request).extends(Message);
    $class(Response).extends(Message);

    // shortcut helpers
    function addUriParams(uri, uriParams) {
        return (uri += (!uri.has('?') ? '?' : '&') + $http.serialize(uriParams));
    }

    function onReadyStateChange(client) {
        if (client.aborted) {
            return offReadyStateChange(client);
        }

        // hold trigger object (element)
        var trigger = client.options.trigger;
        if (trigger) trigger.disabled = TRUE;

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
                var dataType = client.options.dataType || (re_dataType.exec(headers['content-type']) || [,])[1];

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

                // release trigger
                if (trigger) trigger.disabled = FALSE;

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
        options.method = (options.method || optionsDefault.method).toUpperCase();
        options.uri = uri;
        options.headers = $options(optionsDefault.headers, options.headers);

        // cross domain?
        var match = uri.match(re_httpHost);
        if (match && match[1] != window.location.host) {
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
            options.uri = addUriParams(options.uri, {'_': $.now()});
        }
        options.uri = options.uri.replace(re_query, '?$1');

        this.options = options;
        this.request = new Request(this);
        this.response = new Response(this);

        this.request.data = options.data;
        this.request.dataType = options.dataType;
        this.request.headers = options.headers;

        var _this = this;

        this.api = new window[xhr];
        this.api.open(this.request.method, this.request.uri, !!options.async);
        this.api.onerror = function(e) {
            _this.fire('error');
        };

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

        // sen if autoSend true
        if (options.autoSend) {
            this.send();
        }
    }

    $extend(Client.prototype, {
        /**
         * Send.
         * @return {self}
         */
        send: function() {
            var _this = this, data;

            if (!_this.sent && !_this.aborted) {

                _this.fire('beforeSend');

                $forEach(_this.request.headers, function(name, value) {
                    _this.api.setRequestHeader(name, value);
                });

                // check data
                if (re_post.test(_this.request.method)) {
                    data = $http.serialize(_this.request.data);
                }

                _this.api.send(data);

                _this.fire('afterSend');

                if (_this.options.timeout) {
                    $.fire(_this.options.timeout, function(){
                        _this.cancel();
                        _this.fire('timeout');
                    });
                }

                _this.sent = TRUE;
            }

            return _this;
        },

        /**
         * Fire.
         * @param  {String|Function} fn
         * @param  {Array}           fnArgs
         * @return {void}
         */
        fire: function(fn, fnArgs) {
            var _this = this;

            // check 'ons'
            if (_this.options.ons[fn]) {
                fn = _this.options.ons[fn];
            } else if (!$isFunction(fn)) {
                fn = $isNumeric(fn) // status code functions
                    ? fn : 'on'+ fn.toCapitalCase();
                if (_this.options[fn]) {
                    fn = _this.options[fn];
                }
            }

            if ($isFunction(fn)) {
                var args = [_this];
                // prepend
                if ($isDefined(fnArgs)) {
                    args = [fnArgs].concat(args);
                }
                fn.apply(_this, args);
            }
        },

        /**
         * Cancel
         * @return {void}
         */
        cancel: function() {
            var _this = this;

            _this.api.abort();
            _this.fire('abort');
            _this.aborted = TRUE;
        },

        /**
         * End.
         * @param  {Function} fn
         * @return {self}
         */
        end: function(fn) {
            return this.on('done', fn);
        },

        /**
         * Ok.
         * @return {Bool}
         */
        ok: function() {
            return this.response.statusCode === 200;
        },

        /**
         * Is success.
         * @return {Bool}
         */
        isSuccess: function() {
            var code = this.response.statusCode;

            return code >= 200 && code <= 299;
        },

        /**
         * Is failure.
         * @return {Bool}
         */
        isFailure: function() {
            var code = this.response.statusCode;

            return code >= 400 && code <= 599;
        },

        /**
         * On.
         * @param  {String}   name
         * @param  {Function} callback
         * @return {self}
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
     * Init.
     * @param  {String}          uri
     * @param  {Object|Function} options
     * @param  {Function}        onDone?
     * @param  {Function}        onSuccess?
     * @param  {Function}        onFailure?
     * @param  {String}          method? @internal
     * @return {Client}
     */
    function init(uri, options, onDone, onSuccess, onFailure, method) {
        options = options || {};
        if (!$isString(uri)) throw ('URI must be a string!');
        if (!$isObject(options)) throw ('Options must be an object!');

        uri = $trim(uri);
        if (uri.has(' ')) {
            // <method> <uri> @<data type>, ie: '/foo', '/foo @json', 'GET /foo', 'GET /foo @json'
            var re = re_request.exec(uri);
            if (re) {
                options.method = re[1] || method;
                options.uri = uri = re[2];
                options.dataType = re[3];
            }
        } else if (method) { // for get/post shortcut methods
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
        request: function(uri, options, onDone, onSuccess, onFailure) {
            return init(uri, options, onDone, onSuccess, onFailure);
        }
    });

    // export http
    $.http = $http;

})(window, window.so, null, true, false);
