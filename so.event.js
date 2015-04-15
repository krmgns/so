/**
 * @name: so.event
 * @deps: so
 */

;(function($) {

"use strict"; // @tmp

// credits https://gist.github.com/1000988 & http://dean.edwards.name/my/events.js
var event = (function() {
    var _i = 0,
        preventDefault = function() { this.returnValue = false; },
        stopPropagation = function() { this.cancelBubble = true; };

    function _ek(type) {
        return "so.event.custom."+ type;
    }

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
            // unable to get property 'call' of undefined or null reference
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
        // doesn't work with cloned elements, sorry :(
        addEvent(el, type, _callback = function(){
            removeEvent(el, type, _callback);
            return callback.apply(el, arguments);
        });
    }

    function fire(el, type) {
        // default events like form.submit() etc.
        if (typeof el[type] == "function") {
            return el[type].call(el);
        }

        var e;
        // custom?
        if (e = el[_ek(type)]) {
            return invokeCustomEvent(el, type, e);
        }

        if (document.createEventObject) {
            e = document.createEventObject();
            e.type = type;
            return el.fireEvent("on"+ e.type, e);
        } else {
            e = document.createEvent("Event");
            e.initEvent(type, true, true);
            return !el.dispatchEvent(e);
        }
    }

    function addCustomEvent(el, type, fn) {
        var key = _ek(type), e;
        if (document.createEventObject) {
            // create for ie
            e = document.createEventObject();
            e.type = type;
            if (!el[key]) {
                addEvent(el, type, fn);
            }
        } else {
            // create for firefox & others
            e = document.createEvent("Event");
            e.initEvent(type, true, true); // type, bubbling, cancelable
            if (!el[key]) {
                addEvent(el, type, fn);
            }
        }
        el[key] = e;
    }

    function removeCustomEvent(el, type) {
        el[_ek(type)] = -1;
    }

    function invokeCustomEvent(el, type, e /*internal*/) {
        var e = el[_ek(type)];
        if (e && e !== -1) {
            return el.fireEvent
                // dispatch for ie
                ? el.fireEvent("on"+ type, e)
                // dispatch for firefox & others
                : !el.dispatchEvent(e);
        }
    }

    return {
        on: addEvent,
        off: removeEvent,
        once: once,
        fire: fire,
        // regular events
        addEvent: addEvent,
        removeEvent: removeEvent,
        invokeEvent: fire,
        // custom events
        addCustomEvent: addCustomEvent,
        removeCustomEvent: removeCustomEvent,
        invokeCustomEvent: invokeCustomEvent
    };
})();

$.event = event;

// define exposer
$.toString("event", "so.event");

})(so);
