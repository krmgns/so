;(function($) { 'use strict';

    var i = 0;

    // custom event key
    // function cek(type) {
    //     return 'so.cek.'+ type;
    // }

    // function prepareElementEvents(el, callback) {
    //     el.__events = el.__events || {};
    //     el.__events[type] = el.__events[type] || [];
    //     if (callback) {
    //         el.__events[type][(callback.i = callback.i || i++)] = callback;
    //         el.__events[type].push(callback); ?
    //     }
    //     return el;
    // }

    $.extend('@event', (function() {
        var id = 0, defaultOptions = {useCapture: false};

        function Event(type, callback, options) {
            this.type = type;
            this.callback = callback;
            this.options = $.extend({}, defaultOptions, options);
            // return this;
        }

        $.extend(Event.prototype, {
            add: function(el) {
                el.addEventListener(this.type, this.callback, this.options.useCapture);
                return this;
            },
            remove: function(el) {
                el.removeEventListener(this.type, this.callback, this.options.useCapture);
                return this;
            },
        });

        function addEvent(el, type, callback, options) {
            new Event(type, callback, options).add(el);
        }
        function removeEvent(el, type, callback, options) {
            new Event(type, callback, options).remove(el);
        }

        function addEventOnce(el, type, callback, options) {
            var event = new Event(type, function(e) {
                event.remove(el);
                callback.call(el, e);
            }).add(el);
        }

        // function addCustomEvent(el, type, callback, options) {}
        // function removeCustomEvent(el, type, callback, options) {}

        // function fire(el, type) {
        //     if (custom...) {
        //     }
        }

        // test
        $.onReady(function() {
            var el = document.body, event;

            // event = new Event('click', function(e) {
            //     event.remove(el);
            //     log(e)
            // }).add(el);

            addEventOnce(el, 'click', function(e) {
                log("log..")
                log(this)
                log(e)
            });

            log(el)
        });

        return Event;
    })());


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

})(so);
