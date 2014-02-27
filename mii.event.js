;(function($) {

"use strict"; // @tmp

// Credits: https://gist.github.com/1000988 & http://dean.edwards.name/my/events.js
var event = (function() {
    var _i = 0,
        preventDefault = function() { this.returnValue = false; },
        stopPropagation = function() { this.cancelBubble = true; };

    function _fix(e) {
        e.preventDefault = preventDefault;
        e.stopPropagation = stopPropagation;
        e.target = e.srcElement;
        e.relatedTarget = e.fromElement;
        e.keyCode = e.which;
        return e;
    }

    function handleEvent(e) {
        e = e || _fix(((this.ownerDocument || this.document || this).parentWindow || window).event);
        var result = true, callbacks = this.$events[e.type], callback, i;
        for (i in callbacks) {
            callback = callbacks[i];
            // Unable to get property 'call' of undefined or null reference
            if (callback && callback.call(this, e) === false) {
                result = false;
            }
        }
        return result;
    }

    function addEvent(el, type, callback) {
        el.$events = el.$events || {};
        if (!el.$events[type]) {
            el.$events[type] = {};
            if (el["on" + type]) {
                el.$events[type][0] = el["on" + type];
            }
        }

        callback.$i = callback.$i || _i++;
        el.$events[type][callback.$i] = callback;

        if (el.addEventListener) {
            el.addEventListener(type, callback, false);
        } else {
            el["on" + type] = handleEvent;
        }
    }

    function removeEvent(el, type, callback) {
        if (el.removeEventListener) {
            el.removeEventListener(type, callback, false);
        } else {
            if (el.$events && el.$events[type]) {
                delete el.$events[type][callback.$i];
            }
        }
    }

    function once(el, type, callback) {
        var _callback;
        // Doesn't work with cloned elements!!! Sorry :(
        addEvent(el, type, _callback = function(){
            removeEvent(el, type, _callback);
            return callback.apply(el, arguments);
        });
    }

    function fire(el, type) {
        var fn = el[type] || el["on"+ type];
        if (fn && fn.call) {
            fn.call(el);
        }

        // I won't use this way...
        // var e;
        // if (document.createEventObject) {
        //     e = document.createEventObject();
        //     e.type = type;
        //     el.fireEvent("on" + e.type, e);
        // } else {
        //     e = document.createEvent("Event");
        //     e.initEvent(type, true, true);
        //     el.dispatchEvent(e);
        // }
    }

    var _ek = function(type) {
        return "mii.event.custom."+ type;
    };

    function addCustomEvent(el, type, fn) {
        var eventKey = _ek(type), e;
        if (document.createEventObject) {
            // Create for IE
            e = document.createEventObject();
            e.type = type;
            if (!el[eventKey]) {
                addEvent(el, type, fn);
            }
        } else {
            // Create for Firefox & others
            e = document.createEvent("Event");
            e.initEvent(type, true, true); // type, bubbling, cancelable
            if (!el[eventKey]) {
                addEvent(el, type, fn);
            }
        }
        el[eventKey] = e;
    }

    function removeCustomEvent(el, type) {
        delete el[_ek(type)];
    }

    function invokeCustomEvent(el, type) {
        var e = el[_ek(type)];
        if (e) {
            if (el.fireEvent) {
                // Dispatch for IE
                return el.fireEvent("on"+ type, e);
            } else {
                // Dispatch for Firefox & others
                return !el.dispatchEvent(e);
            }
        }
    }

    return {
        on: addEvent,
        off: removeEvent,
        once: once,
        fire: fire,
        // Normal events
        addEvent: addEvent,
        removeEvent: removeEvent,
        invokeEvent: fire,
        // Custom events
        addCustomEvent: addCustomEvent,
        removeCustomEvent: removeCustomEvent,
        invokeCustomEvent: invokeCustomEvent
    };
})();

$.event = event;

// Define exposer
$.toString("event", "mii.event");

})(mii);