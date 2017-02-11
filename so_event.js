;(function(window, $) { 'use strict';

    $.extend('@event', (function() {
        var id = 0,
            optionsDefault = {once: false, useCapture: false},
            optionsDefaultEvent = {bubbles: true, cancelable: true, scoped: false, composed: false,
                detail: null};

        function setEventOf(el, name, event) {
            if (el) {
                el._events = el._events || {};
                el._events[name] = el._events[name] || [];
                if (event == null) {
                    // el._events[name] = null;
                }
                el._events[name].push(event);
            }
        }
        function getEventOf(el, name) {
            var event;
            if (el && el._events && el._events[name]) {
                $.forEach(el._events[name], function(value) {
                    if (value && value.name == name) {
                        event = value;
                        return 0; // break
                    }
                })
            }
            return event;
        }
        function delEventOf(el, name, event, callback) {
            if (el && el._events && el._events[name]) {
                $.forEach(el._events[name], function(value, key) {
                    if (value.name == name /* && value.callback == callback */) {
                        el._events[name][key] = null;
                        return 0; // break
                    }
                })
            }
        }

        // $.class.create ...
        function Event(name, callback, options, isCustom) {
            options = $.extend({}, optionsDefault, optionsDefaultEvent, options);
            this.name = name.toLowerCase();
            this.callback = callback;
            this.options = options;
            try {
                this.event = new window.Event(name, options);
            } catch (e) {
                this.event = window.document.createEvent('Event');
                this.event.initEvent(name, options.bubbles, options.cancelable);
            }
            // this.isCustom = !!isCustom;
            // if (this.isCustom) {
            //     // create custom event.. ?
            // }
        }

        $.extend(Event.prototype, {
            add: function(el, once) {
                // el._events.append(...) or push(...)
                setEventOf(el, this.name, this);
                el.addEventListener(this.name, this.callback, this.options.useCapture);
                return this;
            },
            remove: function(el) {
                // el._events.remove(...)
                el.removeEventListener(this.name, this.callback, this.options.useCapture);
                return this;
            }
        });

        // $.extend(Event, {add: ...})
        function addEvent(el, name, callback, options) {
            return new Event(name, callback, options).add(el);
        }
        function removeEvent(el, name, callback, options) {
            $.forEach(el._events, function(events, name) {
                $.forEach(events, function(event, i) {
                    if (event.callback == callback) {
                        el._events[name][i] = null;
                    }
                });
            });
            return new Event(name, callback, options).remove(el);
        }

        function fire(el, name) { // names.split(/,\s+/) multiple event call için, add remove için de olucak
            // default events like form.submit() etc.
            if ($.isFunction(el[name])) {
                return el[name].call(el);
            }

            var event = getEventOf(el, name);
            if (event) {
                el.dispatchEvent(event.event);
                if (event.options.once) {
                    removeEvent(el, name, event.callback)
                }
                return true;
            }

            return false;
        }

        // test
        $.onReady(function() {
            var el = document.body, event;

            addEvent(el, "click1", function() {
                log("click1:", $.now())
            }, {once: true});
            addEvent(el, "click1", function() {
                log("click2:", $.now())
            }, {once: false});

            addEvent(el, "dblclick", function() {
                fire(el, "click1")
                fire(el, "click2")
            })

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

            // var name = 'foo';
            // addEvent(el, name, log, {once: true})
            // log(el)

            // addEvent(el, 'click', function() {
            //     fire(el, name)
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

        return Event;
    })());


        // function addEventOnce(el, name, callback, options) {
        //     var event = new Event(name, function(e) {
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

})(window, window.so);
