;(function(window, $) { 'use strict';

    var TRUE = true, FALSE = false, NULL = null,
        optionsDefault = {bubbles: FALSE, cancelable: FALSE, detail: NULL};

    function createEvent(type, options) {
        try {
            return new Event(type, options);
        } catch (e) {
            var event;
            event = document.createEvent('Event');
            event.initEvent(type, options.bubbles, options.cancelable);
            return event;
        }
    }

    function createCustomEvent(type, options) {
        try {
            return new CustomEvent(type, options);
        } catch (e) {
            var event = document.createEvent('CustomEvent');
            event.initCustomEvent(type, options.bubbles, options.cancelable, options.detail);
            return event;
        }
    }

    $.extend('@event', (function() {
        var id = 0,
            optionsDefault = {once: false, useCapture: false, data: {}, id: null},
            optionsDefaultEvent = {bubbles: true, cancelable: true, scoped: false, composed: false,
                detail: null};

        function splitTypes(types) {
            return types.split(/,\s*/);
        }

        function setEventOf(el, type, event) {
            if (el) {
                el._events = el._events || {};
                el._events[type] = el._events[type] || [];
                el._events[type].push(event);
            }
        }
        function getEventOf(el, type) {
            var ret;
            if (el && el._events && el._events[type]) {
                $.forEach(el._events[type], function(event) {
                    if (event && event.type == type) {
                        ret = event;
                        return 0; // break
                    }
                })
            }
            return ret;
        }
        function removeEventOf(el, type, callback) {
            if (el && el._events) {
                if (type == '*') {
                    el._events = {};
                } else if (type == '**') {
                    // sonra burdan ..
                } else if (el._events[type]) {
                    $.forEach(el._events[type], function(event, i) {
                        if (event && event.callback == callback) {
                            el._events[type][i] = null;
                        }
                    });
                }
            }
        }

        // shortcut methods for event
        function createCallback(callback) {
            return function(e) {
                e.stop = function() { e.preventDefault(); e.stopPropagation(); };
                e.stopDefault = function() { e.preventDefault(); }
                return callback.call(e.target, e);
            };
        }

        // $.class.create ...
        function Event(type, callback, options, isCustom) {
            options = $.extend({}, optionsDefault, optionsDefaultEvent, options);
            this.type = type.toLowerCase();
            this.callback = createCallback(callback);
            this.options = options;
            this.event = createEvent(this.type, options);

            this.isFired = FALSE;
            this.isCancelled = FALSE;

            // this.isCustom = !!isCustom;
            // if (this.isCustom) {
            //     // create custom event.. ?
            // }
        }

        $.extend(Event.prototype, {
            add: function(el) {
                setEventOf(el, this.type, this);
                el.addEventListener(this.type, this.callback, this.options.useCapture);
                return this;
            },
            // remove: function(el, type) {
            //     removeEventOf(el, this.type, this.callback);
            //     el.removeEventListener(this.type, this.callback, this.options.useCapture);
            //     return this;
            // }
        });

        function isEvent(input) {
            return input instanceof Event;
        }

        function create(type, callback, options) {
            return new Event(type, callback, options);
        }

        // .on( types, callback, options { [, id ] [, data ], ...} ) <<
        // .on( types [, id ] [, data ], callback )
        // .on( types [, id ] [, data ] )
        // .on( event )

        // .off( types, callback, options { [, id ] [, data ], ...} ) <<
        // .off( types [, id ] [, callback ] )
        // .off( types [, id ] )
        // .off( event )
        // .off( '*' )  // all
        // .off( '**' ) // all isFired

        function on(el, types, callback, options) {
            if ($.isString(types)) {
                splitTypes(types).forEach(function(type) {
                    create(type, callback, options).add(el);
                });
            } else if ($.isObject(types)) {
                create(types.type, types.callback, types.options).add(el);
            } else if (types instanceof Event) {
                types.add(el);
            }
        }
        function once(el, types, callback, options) {
            once(el, types, callback, $.extend({}, options, {once: true}));
        }

        function off(el, types, callback, options) {
            if ($.isString(types)) {
                if (types == '*' || types == '**') {
                    // removeEventOf
                }
            }
        }

        // function addEvent(el, type, callback, options) {
        //     return new Event(type, callback, options).add(el);
        // }
        // function removeEvent(el, type, callback, options) {
        //     // return new Event(type, callback, options).remove(el);
        //     return new Event(type, callback, options).remove(el);
        // }

        function fire(el, type, opt_native) {
            // default events like form.submit() etc.
            if (opt_native && $.isFunction(el[type])) {
                return el[type].call(el);
            }

            var event = getEventOf(el, type);
            // log(event);
            if (event) {
                event.isFired = TRUE; // burdan cikti gecikme '**' ler için
                event.isCancelled = !el.dispatchEvent(event.event);
                if (event.options.once) {
                    removeEvent(el, type, event.callback);
                }
            }

            return el;
        }
        function fireEvent(el, type) {
            fire(el, type, true);
        }

        // test
        $.onReady(function() {
            var el = document.body, event;

            el = document.querySelector('#form');

            on(el, 'submit', function(e) {
                e.stopDefault();
                log("submit", e, e.stop, this)
            })

            return;

            // on(el, "click", function() {
            //     log("click")
            // });

            // var event = {type: "click", callback: function() {
            //     log("click")
            // }};
            // var event = new Event("change", function(e) {
            //     log(e)
            // });

            // on(el, event);

            // el.fireEvent("change")
            // el.submit()
            // fire(el, "submit")

            // addEvent(el, "click1", function() {
            //     log("click1:", $.now())
            // }, {once: true});
            // addEvent(el, "click1", function() {
            //     log("click2:", $.now())
            // }, {once: false});

            // addEvent(el, "click", function() {
            //     fire(el, "click1")
            //     fire(el, "click2")
            // })

            // var click1, click2
            // addEvent(el, "click", click1 = function() {
            //     log("click1")
            // }, {once: true});
            // addEvent(el, "click", click2 = function() {
            //     log("click2")
            // }, {once: false});

            // $.forEach(el._events, function(value, key) {
            //     $.forEach(value, function(event) {
            //         log(event.callback == click1)
            //     })
            // })

            // var type = 'foo';
            // addEvent(el, type, log, {once: true})
            // log(el)

            // addEvent(el, 'click', function() {
            //     fire(el, type)
            // })

            // event = new Event('click', function(e) {
            //     // event.remove(el);
            //     log(e)
            //     log(event)
            //     log(this)
            // }).add(el);

            // event = new Event('foo', function(e) {
            //     log(e)
            // });

            // event = createEvent('foo')
            // log(event)
            // log(el)

            // var event = new window.Event('click');
            // // Dispatch the event.
            // el.dispatchEvent(event);
            // // Listen for the event.
            // el.addEventListener('click', function (e) { log(e) }, false);
        });

        // return Event;

        return {
            Event: Event,
            // on: on,
            // off: off,
            // once: once,
            // fire: fire
        };
    })());


        // function addEventOnce(el, type, callback, options) {
        //     var event = new Event(type, function(e) {
        //         event.remove(el);
        //         callback.call(el, e);
        //     }).add(el);
        //     return event;
        // }

    // $.event = (function() {
    //     function addEvent(el, type, callback) {
    //         el = prepareElementEvents(el, type, callback);
    //         el.addEventListener(type, callback, false);
    //     }

    //     function removeEvent(el, type, callback) {
    //         el = prepareElementEvents(el, type, callback);
    //         el.removeEventListener(type, callback, false);
    //         if (el.__events && el.__events[type]) {
    //             delete el.__events[type][callback.i];
    //         }
    //     }

    //     function once(el, type, callback) {
    //         var _callback;
    //         addEvent(el, type, _callback = function(){
    //             removeEvent(el, type, _callback);
    //             return callback.apply(el, arguments);
    //         });
    //     }

    //     function fire(el, type) {
    //         // default events like form.submit() etc.
    //         if (typeof el[type] == 'function') {
    //             return el[type].call(el);
    //         }

    //         var e;
    //         // custom?
    //         if (e = el[cek(type)]) {
    //             return invokeCustomEvent(el, type, e);
    //         }

    //         if (document.createEventObject) {
    //             e = document.createEventObject();
    //             e.type = type;
    //             return el.fireEvent('on'+ e.type, e);
    //         } else {
    //             e = document.createEvent('Event');
    //             e.initEvent(type, true, true);
    //             return !el.dispatchEvent(e);
    //         }
    //     }

    //     function addCustomEvent(el, type, fn) {
    //         var key = cek(type), e;
    //         if (document.createEventObject) {
    //             // create for ie
    //             e = document.createEventObject();
    //             e.type = type;
    //             if (!el[key]) {
    //                 addEvent(el, type, fn);
    //             }
    //         } else {
    //             // create for firefox & others
    //             e = document.createEvent('Event');
    //             e.initEvent(type, true, true); // type, bubbling, cancelable
    //             if (!el[key]) {
    //                 addEvent(el, type, fn);
    //             }
    //         }
    //         el[key] = e;
    //     }

    //     function removeCustomEvent(el, type) {
    //         el[cek(type)] = -1;
    //     }

    //     function invokeCustomEvent(el, type, e /*internal*/) {
    //         e = e || el[cek(type)];
    //         if (e && e !== -1) {
    //             return el.fireEvent
    //                 // dispatch for ie
    //                 ? el.fireEvent('on'+ type, e)
    //                 // dispatch for firefox & others
    //                 : !el.dispatchEvent(e);
    //         }
    //     }

    //     return {
    //         on: addEvent,
    //         off: removeEvent,
    //         once: once,
    //         fire: fire,
    //         // regular events
    //         addEvent: addEvent,
    //         removeEvent: removeEvent,
    //         invokeEvent: fire,
    //         // custom events
    //         addCustomEvent: addCustomEvent,
    //         removeCustomEvent: removeCustomEvent,
    //         invokeCustomEvent: invokeCustomEvent
    //     };
    // })();

var keys = {
    BACKSPACE: 8,
    TAB:       9,
    RETURN:   13,
    ESC:      27,
    LEFT:     37,
    UP:       38,
    RIGHT:    39,
    DOWN:     40,
    DELETE:   46,
    HOME:     36,
    END:      35,
    PAGEUP:   33,
    PAGEDOWN: 34,
    INSERT:   45,
};

function stop(event) {
    // $.extend(event);
    event.preventDefault();
    event.stopPropagation();
    event.stopped = true;
}

})(window, window.so);
