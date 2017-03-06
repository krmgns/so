/**
 * @package so
 * @object  so.event
 * @depends so, so.list
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $) { 'use strict';

    var re_types = {
        UIEvent: 'resize|scroll|select|(un)?load|DOMActivate',
        MouseEvent: '(dbl)?click|mouse(up|down|enter|leave|in|out|over|move|wheel)|show|contextmenu|DOMMouseScroll',
        FocusEvent: 'blur|focus(in|out)?|DOMFocus(In|Out)',
        KeyboardEvent: 'key(up|down|press)',
        TouchEvent: 'touch(end|start|move|cancel)',
        DragEvent: 'drag(end|start|enter|leave|over|exit|gesture|drop)?|drop',
        WheelEvent: 'wheel',
        HashChangeEvent: 'hashchange',
        BeforeUnloadEvent: 'beforeunload',
        MutationEvent: 'DOM((Attr|CharacterData|Subtree)Modified|Node(Inserted(IntoDocument)?|Removed(FromDocument)?))',
        MessageEvent: 'message', PopStateEvent: 'popstate', StorageEvent: 'storage',
        AnimationEvent: 'animation(end|start|iteration)',
        TransitionEvent: 'transition(end|start)', PageTransitionEvent: 'page(hide|show)',
        ProgressEvent: 'load(end|start)|progress|timeout',
        CompositionEvent: 'composition(end|start|update)',
        DeviceMotionEvent: 'devicemotion', DeviceOrientationEvent: 'deviceorientation'
    };
    var re_typesFix = /^(UI|Mouse|Mutation|HTML)Event$/i;
    var re_typesStandard = $.re('('+ Object.values(re_types).join('|') +')', 'i');
    var re_comma = /,\s*/;
    var optionsDefault = {
        bubbles: true, cancelable: true, scoped: false, composed: false, // all
        view: window, detail: null, // ui, mouse, custom
        relatedNode: null, prevValue: '', newValue: '', attrName: '', attrChange: 0, // mutation
        screenX: 0, screenY: 0, clientX: 0, clientY: 0, ctrlKey: false, altKey: false, shiftKey: false,
            metaKey: false, button: 1, relatedTarget: null, // mouse
        useCapture: false, once: false, passive: false, data: {}
    };

    /**
     * Create event.
     * @param  {String} eventClass
     * @param  {String} eventType
     * @param  {Object} options
     * @return {Object}
     */
    function createEvent(eventClass, eventType, options) {
        if (!eventType) throw ('Type required.');

        options = $.extend({}, optionsDefault, options);

        var event, eventClassOrig;
        if (!eventClass) { // autodetect
            $.forEach(re_types, function(_eventClass, re) {
                re = $.re('^('+ re +')$', 'i');
                if (re.test(eventType)) {
                    eventClass = eventClassOrig = _eventClass;
                    return 0;
                }
            });
        }

        eventClass = eventClassOrig = eventClass || 'Event'; // @default
        try { // wrong parameters causes error (opera/12)
            event = (eventClass != 'MutationEvent' && new window[eventClass](eventType, options));
        } catch(e) {}

        if (!event) {
            // add 's' if needed
            if ($.DOMLevel < 3 && re_typesFix.test(eventClass)) {
                eventClass += 's';
            }

            event = document.createEvent(eventClass);
            switch (eventClassOrig) {
                case 'UIEvent':
                    event.initUIEvent(eventType, options.bubbles, options.cancelable, options.view, options.detail);
                    break;
                case 'MouseEvent':
                case 'DragEvent':
                case 'WheelEvent':
                    event.initMouseEvent(eventType, options.bubbles, options.cancelable, options.view, options.detail,
                        options.screenX, options.screenY, options.clientX, options.clientY,
                        options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
                        options.button, options.relatedTarget);
                    break;
                case 'MutationEvent':
                    event.initMutationEvent(eventType, options.bubbles, options.cancelable, options.relatedNode,
                        options.prevValue, options.newValue, options.attrName, options.attrChange);
                    break;
                default:
                    if (eventClass == 'CustomEvent') {
                        event.initCustomEvent(eventType, options.bubbles, options.cancelable, options.detail);
                    } else {
                        event.initEvent(eventType, options.bubbles, options.cancelable); // all others
                    }
            }
        }

        return {event: event, eventClass: (eventClass in re_types) ? eventClass : 'CustomEvent'};
    }

    /**
     * Extend fn.
     * @param  {Event}    event
     * @param  {Function} fn
     * @return {Function}
     */
    function extendFn(event, fn) {
        if (!fn) return;

        return function(e) {
            if (event.once) { // once?
                event.unbind();
            }

            event.event = e; // overwrite on initial
            event.fired++;

            if (!e.data) {
                e.data = event.data;
            }
            if (!e.target) {
                e = Object.defineProperty(e, 'target', {value: event.target});
            }

            // sugars..
            $.extend(e, {
                event: event,
                eventTarget: event.eventTarget,
                stopped: false,
                stoppedAll: false,
                stoppedDefault: false,
                stoppedBubble: false,
                stoppedBubbleAll: false,
                stop: function() {
                    e.stopDefault();
                    e.stopBubble();
                    e.stopped = true;
                },
                stopAll: function() {
                    e.stopDefault();
                    e.stopBubble();
                    e.stopBubbleAll();
                    e.stoppedAll = true;
                },
                stopDefault: function() {
                    e.preventDefault();
                    e.stoppedDefault = true;
                },
                stopBubble: function() {
                    e.stopPropagation();
                    e.stoppedBubble = true;
                },
                stopBubbleAll: function() {
                    e.stopImmediatePropagation();
                    e.stoppedBubbleAll = true;
                }
            });

            return fn.call(event.target, e);
        };
    }

    // helpers
    function initEvent(type, fn, options) {
        return new Event(type, fn, options);
    }
    function initCustomEvent(type, fn, options) {
        return new Event(type, fn, $.extend({}, options, {custom: true}));
    }
    function initEventTarget(target) {
        return new EventTarget(target);
    }
    function checkTarget(target, eventType) {
        if (!target) throw ('No target given.');

        if (!target.$events) {
            target.$events = $.list();
        }

        if (eventType && !target.$events.has(eventType)) {
            target.$events.set(eventType, $.list());
        }

        return target;
    }

    /**
     * Event.
     * @param {String}   type
     * @param {Function} fn
     * @param {Object}   options
     */
    function Event(type, fn, options) {
        if (!type) throw ('Type required.');

        // ..('click', {fn: function(){...}})
        if ($.isObject(fn)) {
            options = fn, fn = options.fn;
        }

        var _this = this, event;

        _this.type = type.toLowerCase();
        _this.options = $.extend({}, optionsDefault, options);
        _this.data = _this.options.data;

        _this.custom = $.pick(_this.options, 'custom');
        if (_this.custom) {
            _this.options.eventClass = 'CustomEvent';
        }

        event = createEvent(_this.options.eventClass, _this.type, _this.options);
        _this.event = event.event;
        _this.eventClass = event.eventClass;
        _this.eventTarget = null;

         options = $.pickAll(_this.options, 'target', 'useCapture');
        _this.target = options.target;
        _this.useCapture = !!options.useCapture;

        _this.fn = extendFn(_this, fn);
        _this.fnOrig = fn;

        options = $.pickAll(_this.options, 'once', 'passive');
        _this.once = !!options.once;
        _this.passive = !!options.passive;

        _this.i = -1; // no bind yet
        _this.fired = 0;
        _this.cancalled = false;
        _this.custom = event.eventClass == 'CustomEvent' || !re_typesStandard.test(type);
    }

    Event.extendPrototype({
        /**
         * Copy.
         * @return {Event}
         */
        copy: function() {
            var _this = this,
                event = initEvent(_this.type, _this.fnOrig, _this.options);

            return $.extend(event, _this);
        },

        /**
         * Bind.
         * @param  {String} type?
         * @return {this}
         */
        bind: function(type) {
            var _this = this.copy();

            if (!type) {
                initEventTarget(_this.target).addEvent(_this);
            } else {
                type.split(re_comma).forEach(function(type) {
                    _this.type = type;
                    initEventTarget(_this.target).addEvent(_this);
                });
            }

            return _this;
        },

        /**
         * Bind to.
         * @param  {Object} target
         * @return {Event}
         */
        bindTo: function(target) {
            var event = this.copy(), fn;

            event.target = event.options.target = target;

            // add fn after target set
            fn = this.fnOrig.bind(target);
            event.fn = extendFn(event, fn);
            event.fnOrig = fn;

            initEventTarget(target).addEvent(event);

            return event;
        },

        /**
         * Unbind.
         * @param  {String} type?
         * @return {this}
         */
        unbind: function(type) {
            var _this = this.copy();

            if (!type) {
                initEventTarget(_this.target).removeEvent(_this);
            } else {
                type.split(re_comma).forEach(function(type) {
                    _this.type = type;
                    initEventTarget(_this.target).removeEvent(_this);
                });
            }

            return _this;
        },

        /**
         * Fire.
         * @param  {String} type?
         * @param  {Object} data
         * @return {this}
         */
        fire: function(type, data) {
            var _this = this.copy();

            if (!type) {
                initEventTarget(_this.target).dispatch(_this, data);
            } else {
                type.split(re_comma).forEach(function(type) {
                    _this.type = type;
                    initEventTarget(_this.target).dispatch(_this, data);
                });
            }

            return _this;
        },

        /**
         * Is fired.
         * @return {Boolean}
         */
        isFired: function() {
            return !!this.fired;
        },

        // for chaining, eg: el.on(...).fire().off()
        off: function(type) { return this.unbind(type); }
    });

    /**
     * Event Target.
     * @param {Object} target
     */
    function EventTarget(target) {
        this.target = checkTarget(target);
    }

    EventTarget.extendPrototype({
        /**
         * Add event.
         * @param  {Event} event
         * @return {void}
         */
        addEvent: function(event) {
            var target = checkTarget(this.target, event.type);

            event.target = target;
            event.eventTarget = this;
            event.i = target.$events.get(event.type).append(event).size - 1;

            target.addEventListener(event.type, event.fn, event.useCapture);
        },

        /**
         * Remove event.
         * @param  {Event} event
         * @return {void}
         */
        removeEvent: function(event) {
            var target = checkTarget(this.target),
                events = target.$events, eventsRemove, type = event.type,
                filter = function(event) { return !!event; };

            if (events) {
                eventsRemove = $.list();
                if (type == '*') { // all
                    eventsRemove = events.selectAll(filter);
                } else if (type == '**') { // all fired 'x' types, eg: .off('**')
                    eventsRemove = events.selectAll(function(_event) {
                        return _event && _event.fired;
                    });
                } else if (type.has('**')) { // all fired 'x' types, eg: .off('click**')
                    type = type.slice(0, -2);
                    eventsRemove = events.selectAll(function(_event) {
                        return _event && _event.type == type && _event.fired;
                    });
                } else if (events.data[type]) {
                    events = events.data[type];
                    if (event.fn) { // all matched fn's, eg: .off('x', fn)
                        eventsRemove = events.select(function(_event) {
                            return _event && _event.fnOrig == event.fnOrig;
                        });
                    } else { // all 'x' types, eg: .off('x')
                        eventsRemove = events.selectAll(filter);
                    }
                }
            } else {
                $.logWarn('No `%s` events found to fire.'.format(event.type));
            }

            if (eventsRemove) {
                events = target.$events;
                eventsRemove.for(function(event) {
                    events.data[event.type].removeAt(event.i);
                    target.removeEventListener(event.type, event.fn, event.useCapture);
                });

                // think memory!
                events.forEach(function(key, list) {
                    if (list && !list.size) {
                        events.replaceAt(key, null);
                    }
                });
            }
        },

        /**
         * Dispatch.
         * @param  {Event}  event
         * @param  {Object} data
         * @return {void}
         */
        dispatch: function(event, data) {
            var target = checkTarget(this.target),
                events = target.$events.get(event.type);

            if (events) {
                events.for(function(event) {
                    // call-time data
                    if (data) {
                        event.event.data = event.event.data || {}; // ensure
                        for (var key in data) {
                            event.data[key] = event.event.data[key] = data[key];
                        }
                    }
                    event.fn(event.event);
                });
            } else {
                $.logWarn('No `%s` type events found to fire.'.format(event.type));
            }
        }
    });

    // on, once, off, fire helper
    function prepareArgs(fn, options, target, once) {
        if ($.isObject(fn)) {
            options = fn, fn = options.fn;
        }

        return {fn: fn, options: $.options(options, {target: target, once: !!once})};
    }

    /**
     * On, once, off, fire.
     * @param  {Object}   target
     * @param  {String}   type
     * @param  {Function} fn
     * @param  {Object}   options
     * @return {Event}
     */
    function on(target, type, fn, options) {
        var args = prepareArgs(fn, options, target);

        type.split(re_comma).forEach(function(type) {
            initEvent(type, args.fn, args.options).bind(type);
        });
    }
    function once(target, type, fn, options) {
        var args = prepareArgs(fn, options, target, true);

        type.split(re_comma).forEach(function(type) {
            initEvent(type, function(e) {
                return e.event.unbind(), args.fn.apply(target, arguments);
            }, args.options).bind(type);
        });
    }
    function off(target, type, fn, options) {
        var args = prepareArgs(fn, options, target);

        type.split(re_comma).forEach(function(type) {
            initEvent(type, args.fn, args.options).unbind(type);
        });
    }
    function fire(target, type, fn, options) {
        var args = prepareArgs(fn, options, target);

        type.split(re_comma).forEach(function(type) {
            initEvent(type, args.fn, args.options).fire(type, args.options.data);
        });
    }

    // shortcuts for Window & Node (Document, Element, ..) objects
    var objects = [Node];
    var prototype = 'prototype';
    var names = ['on', 'once', 'off', 'fire'];
    if (window.Window) {
        objects.push(window.Window);
    } else if (window.__proto__) { // fails on safari/5.1 (maybe others too)
        prototype = '__proto__';
    }

    objects.forEach(function(object) {
        names.forEach(function(name) {
            object[prototype][name] = function(type, fn, options) {
                $.event[name](this, type, fn, options);
            };
        });
    });

    $.event = {
        on: on,
        once: once,
        off: off,
        fire: fire,
        create: createEvent,
        Event: initEvent,
        CustomEvent: initCustomEvent,
        EventTarget: initEventTarget,
        keyCode: {
            BACKSPACE:  8, TAB:      9, ENTER:      13, ESC:       27,  LEFT:     37,
            UP:        38, RIGHT:   39, DOWN:       40, DELETE:    46,  HOME:     36,
            END:       35, PAGEUP:  33, PAGEDOWN:   34, INSERT:    45,  CAPSLOCK: 20,
            ARROWLEFT: 37, ARROWUP: 38, ARROWRIGHT: 39, ARROWDOWN: 40,
            SHIFT:     16, CONTROL: 17, ALT:        18, ALTGRAPH:  225
        }
    };

})(window, so);
