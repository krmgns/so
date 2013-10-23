;(function($) {

"use strict"; // @tmp

var event = (function() {
    /**
     * Based on "mjijackson / events.js" <https://gist.github.com/1000988>
     * // Event handling functions modified from originals by Dean Edwards.
     * // http://dean.edwards.name/my/events.js
     */
    var preventDefault  = function() { this.returnValue = false; },
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
        var result = true, handlers = this.events[e.type];
        for (var i in handlers) {
            // Unable to get property 'call' of undefined or null reference
            if (handlers[i] && handlers[i].call(this, e) === false) {
                result = false;
            }
        }
        return result;
    }

    function addEvent(el, type, fn) {
        if (el.addEventListener) {
            el.addEventListener(type, fn, false);
        } else {
            var handlers;
            if (el.nodeType === 3 || el.nodeType === 8) {
                return;
            }
            if (el.setInterval && (el !== window && !el.frameElement)) {
                el = window;
            }

            el.events = el.events || {};
            handlers  = el.events[type];
            if (!handlers) {
                handlers = el.events[type] = {};
                if (el["on" + type]) handlers[0] = el["on" + type];
            }

            fn.UUID = fn.UUID || $.uuid();
            handlers[fn.UUID] = fn;
            el["on" + type] = handleEvent;
        }
    }

    function removeEvent(el, type, fn) {
        if (el.removeEventListener) {
            el.removeEventListener(type, fn, false);
        } else {
            if (el.events && el.events[type] && fn.UUID) {
                // delete el.events[type][fn.UUID];
                el.events[type][fn.UUID] = null;
            }
        }
    }

    function once(el, type, fn) {
        var _fn;
        addEvent(el, type, _fn = function(e){
            removeEvent(el, type, _fn);
            fn.call(el, e);
        });
    }

    function fire(el, type, fn) {
        var eventKey = "mii.event.fire."+ type;
        if (document.createEventObject) {
            // Dispatch for IE
            var e = document.createEventObject();
            if (el[eventKey] == null) {
                el[eventKey] = "OK";
                addEvent(el, type, fn);
            }
            return el.fireEvent("on"+ type, e);
        } else {
            // Dispatch for Firefox & others
            var e = document.createEvent("Event");
            e.initEvent(type, true, true); // type, bubbling, cancelable
            if (el[eventKey] == null) {
                el[eventKey] = "OK";
                addEvent(el, type, fn);
            }
            return !el.dispatchEvent(e);
        }
    }

    return {
        once: once,
        on: addEvent,
        off: removeEvent,
        addEvent: addEvent,
        removeEvent: removeEvent,
        fire: fire
    };
})();

$.event = event;

// Define exposer
$.toString("event", "mii.event");

})(mii);
