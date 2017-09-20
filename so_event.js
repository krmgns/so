/**
 * @package so
 * @object  so.event
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $, NULL, TRUE, FALSE) { 'use strict';

    var document = $.document;
    var id = 0;
    var objectValues = Object.values;
    var objectDefineProperty = Object.defineProperty;
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
    var re_typesStandard = $.re('('+ objectValues(re_types).join('|') +')', 'i');
    var re_comma = /\s*,\s*/;
    var domLevel = document.adoptNode ? 3 : 2;
    var optionsDefault = {
        bubbles: TRUE, cancelable: TRUE, scoped: FALSE, composed: FALSE, // all
        view: window, detail: NULL, // ui, mouse, custom
        relatedNode: NULL, prevValue: '', newValue: '', attrName: '', attrChange: 0, // mutation
        screenX: 0, screenY: 0, clientX: 0, clientY: 0, ctrlKey: FALSE, altKey: FALSE, shiftKey: FALSE,
            metaKey: FALSE, button: 1, relatedTarget: NULL, // mouse
        useCapture: FALSE, once: FALSE, passive: FALSE, data: {}
    };
    var trim = $.trim, extend = $.extend;
    var KEY_BACKSPACE =  8,  KEY_TAB =       9, KEY_ENTER =       13, KEY_ESC =        27,  KEY_LEFT =      37,
        KEY_UP =         38, KEY_RIGHT =    39, KEY_DOWN =        40, KEY_DELETE =     46,  KEY_HOME =      36,
        KEY_END =        35, KEY_PAGE_UP =  33, KEY_PAGE_DOWN =   34, KEY_INSERT =     45,  KEY_CAPS_LOCK = 20,
        KEY_ARROW_LEFT = 37, KEY_ARROW_UP = 38, KEY_ARROW_RIGHT = 39, KEY_ARROW_DOWN = 40,
        KEY_SHIFT =      16, KEY_CONTROL =  17, KEY_ALT =         18, KEY_ALT_GRAPH =  225;

    /**
     * Create.
     * @param  {String} eventClass
     * @param  {String} eventType
     * @param  {Object} options
     * @return {Object}
     */
    function create(eventClass, eventType, options) {
        eventType = trim(eventType);
        if (!eventType) {
            throw ('Type required.');
        }

        options = extend({}, optionsDefault, options);

        var event, eventClassOrig;
        if (!eventClass) { // autodetect
            $.forEach(re_types, function(_eventClass, re) {
                re = $.re('^('+ re +')$', 'i');
                if (re.test(eventType)) {
                    eventClass = eventClassOrig = _eventClass;
                    return 0; // break
                }
            });
        }

        eventClass = eventClassOrig = eventClass || 'Event'; // @default
        try { // wrong parameters causes error (opera/12)
            event = (eventClass != 'MutationEvent' && new window[eventClass](eventType, options));
        } catch(e) {}

        if (!event) {
            // add 's' if needed
            if (domLevel < 3 && re_typesFix.test(eventClass)) {
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
            if (event.once) { // remove after call if once
                event.unbind();
            }

            event.event = e; // overwrite on initial
            event.fired++;

            if (!e.data) e = objectDefineProperty(e, 'data', {value: event.data});
            if (!e.target) e = objectDefineProperty(e, 'target', {value: event.target});

            // sugars..
            extend(e, {
                event: event,
                eventTarget: event.eventTarget,
                stopped: FALSE,
                stoppedAll: FALSE,
                stoppedDefault: FALSE,
                stoppedBubble: FALSE,
                stoppedBubbleAll: FALSE,
                stop: function() {
                    e.stopDefault();
                    e.stopBubble();
                    e.stopped = TRUE;
                },
                stopAll: function() {
                    e.stopDefault();
                    e.stopBubble();
                    e.stopBubbleAll();
                    e.stoppedAll = TRUE;
                },
                stopDefault: function() {
                    e.preventDefault();
                    e.stoppedDefault = TRUE;
                },
                stopBubble: function() {
                    e.stopPropagation();
                    e.stoppedBubble = TRUE;
                },
                stopBubbleAll: function() {
                    e.stopImmediatePropagation();
                    e.stoppedBubbleAll = TRUE;
                }
            });

            if ($.isDefined(e.keyCode)) {
                var eKeyCode = e.keyCode;
                // key sugars..
                extend(e, {
                    isKey: function(keyCode) { return eKeyCode == keyCode; },
                    isBackspaceKey: function() { return eKeyCode == KEY_BACKSPACE; },
                    isTabKey: function() { return eKeyCode == KEY_TAB; },
                    isEnterKey: function() { return eKeyCode == KEY_ENTER; },
                    isEscKey: function() { return eKeyCode == KEY_ESC; },
                    isLeftKey: function() { return eKeyCode == KEY_LEFT; },
                    isUpKey: function() { return eKeyCode == KEY_UP; },
                    isRightKey: function() { return eKeyCode == KEY_RIGHT; },
                    isDownKey: function() { return eKeyCode == KEY_DOWN; },
                    isDeleteKey: function() { return eKeyCode == KEY_DELETE; },
                    isHomeKey: function() { return eKeyCode == KEY_HOME; },
                    isEndKey: function() { return eKeyCode == KEY_END; },
                    isPageUpKey: function() { return eKeyCode == KEY_PAGE_UP; },
                    isPageDownKey: function() { return eKeyCode == KEY_PAGE_DOWN; },
                    isInsertKey: function() { return eKeyCode == KEY_INSERT; },
                    isCapsLockKey: function() { return eKeyCode == KEY_CAPS_LOCK; },
                    isArrowLeftKey: function() { return eKeyCode == KEY_ARROW_LEFT; },
                    isArrowUpKey: function() { return eKeyCode == KEY_ARROW_UP; },
                    isArrowRightKey: function() { return eKeyCode == KEY_ARROW_RIGHT; },
                    isArrowDownKey: function() { return eKeyCode == KEY_ARROW_DOWN; },
                    isShiftKey: function() { return eKeyCode == KEY_SHIFT; },
                    isControlKey: function() { return eKeyCode == KEY_CONTROL; },
                    isAltKey: function() { return eKeyCode == KEY_ALT; },
                    isAltGraphKey: function() { return eKeyCode == KEY_ALT_GRAPH; }
                });
            }

            return fn.call(event.target, e);
        };
    }

    // helpers
    function initEvent(type, fn, options) {
        return new Event(type, fn, options);
    }
    function initCustomEvent(type, fn, options) {
        return new Event(type, fn, extend({}, options, {custom: TRUE}));
    }
    function initEventTarget(target) {
        return new EventTarget(target);
    }
    function checkTarget(target, eventType) {
        if (!target) throw ('No target given.');

        if (!target.$events) {
            target.$events = {};
        }
        if (eventType && !target.$events[eventType]) {
            target.$events[eventType] = {};
        }

        return target;
    }

    /**
     * Event.
     * @param {String}   type
     * @param {Function} fn
     * @param {Object}   options?
     */
    function Event(type, fn, options) {
        type = trim(type);
        options = options || {};
        if ($.isObject(fn)) { // ..('click', {fn: function(){...}})
            options = fn, fn = options.fn;
        }

        options = extend({}, optionsDefault, options);

        this.type = type;
        this.options = options;
        this.data = options.data;

        this.custom = options.custom;
        if (this.custom) {
            this.options.eventClass = 'CustomEvent';
        }

        var event = create(this.options.eventClass, this.type, options);
        this.event = event.event;
        this.eventClass = event.eventClass;
        this.eventTarget = NULL;

        this.target = options.target;
        this.useCapture = options.useCapture;

        this.fn = extendFn(this, fn);
        this.fno = fn; // original fn

        this.once = options.once;
        this.passive = options.passive;

        this.id = ++id;
        this.fired = 0;
        this.cancalled = FALSE;
        this.custom = event.eventClass == 'CustomEvent' || !re_typesStandard.test(type);
    }

    Event.extendPrototype({
        /**
         * Copy.
         * @return {Event}
         */
        copy: function() {
            var event = this;
            var eventCopy = initEvent(event.type, event.fno, event.options);

            return extend(eventCopy, event);
        },

        /**
         * Bind.
         * @param  {String} type?
         * @return {Event}
         */
        bind: function(type) {
            var event = this.copy();
            var eventTarget = initEventTarget(event.target);

            if (!type) {
                eventTarget.addEvent(event);
            } else {
                type.split(re_comma).forEach(function(type) {
                    event.type = type;
                    eventTarget.addEvent(event);
                });
            }

            return event;
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
            // fn = this.fno.bind(target);
            fn = event.fno;
            event.fn = extendFn(event, fn);
            event.fno = fn;

            initEventTarget(target).addEvent(event);

            return event;
        },

        /**
         * Unbind.
         * @param  {String} type?
         * @return {Event}
         */
        unbind: function(type) {
            var event = this.copy();
            var eventTarget = initEventTarget(event.target);

            if (!type) {
                eventTarget.removeEvent(event);
            } else {
                type.split(re_comma).forEach(function(type) {
                    event.type = type;
                    eventTarget.removeEvent(event);
                });
            }

            return event;
        },

        /**
         * Fire.
         * @param  {String} type?
         * @param  {Object} data
         * @return {Event}
         */
        fire: function(type, data) {
            var event = this.copy();
            var eventTarget = initEventTarget(event.target);

            if (!type) {
                eventTarget.dispatch(event, data);
            } else {
                type.split(re_comma).forEach(function(type) {
                    event.type = type;
                    eventTarget.dispatch(event, data);
                });
            }

            return event;
        },

        /**
         * Off (alias of unbind(), for chaining, eg: el.on(...).fire().off())
         */
        off: function(type) {
            return this.unbind(type);
        }
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
            var targetEvents = target.$events;

            event.id = (event.id || ++id);
            event.target = target;
            event.eventTarget = this;
            targetEvents[event.type][event.id] = event;

            target.addEventListener(event.type, event.fn, event.useCapture);
        },

        /**
         * Remove event.
         * @param  {Event} event
         * @return {void}
         */
        removeEvent: function(event) {
            var target = checkTarget(this.target);
            var targetEvents;
            var remove = [];

            if (target.$events) {
                if (event.type == '*') { // all
                    $.for(target.$events, function(events) {
                        $.for(events, function(event) {
                            remove.push(event);
                        });
                    });
                } else if (event.type == '**') { // all fired
                    $.for(target.$events, function(events) {
                        $.for(events, function(event) {
                            if (event && event.fired) {
                                remove.push(event);
                            }
                        });
                    });
                } else if (event.type.startsWith('**')) { // all fired 'x' types, eg: .off('**click')
                    var type = event.type.slice(2);
                    $.for(target.$events, function(events) {
                        $.for(events, function(event) {
                            if (event && event.fired && event.type == type) {
                                remove.push(event);
                            }
                        });
                    });
                } else if (target.$events[event.type]) {
                    var fno = event.fno, events = target.$events[event.type];
                    if (fno) { // all matched type's & fn's, eg: .off('click', fn)
                        $.for(events, function(event) {
                            if (event && event.fno == fno) {
                                remove.push(event);
                            }
                        });
                    } else { // all matched type's, eg: .off('click')
                        $.for(events, function(event) {
                            remove.push(event);
                        });
                    }
                }

                if (remove.length) {
                    targetEvents = target.$events;
                    $.for(remove, function(event) {
                        if (event && event.id in targetEvents[event.type]) {
                            delete targetEvents[event.type][event.id];
                            target.removeEventListener(event.type, event.fn, event.useCapture);
                        }
                    });

                    // think memory!
                    $.forEach(targetEvents, function(type, events) {
                        targetEvents[type] = !$.isEmpty(events) ? events : NULL;
                    });
                } else if ($.isFunction(target['on'+ event.type])) { // natives
                    target['on'+ event.type] = null;
                }
            } else {
                $.logWarn('No `'+ event.type +'` events found to remove.');
            }
        },

        /**
         * Dispatch.
         * @param  {Event}  event
         * @param  {Object} data
         * @return {void}
         */
        dispatch: function(event, data) {
            var target = checkTarget(this.target);

            if (target.$events[event.type]) {
                $.for(target.$events[event.type], function(event) {
                    // call-time data
                    if (data) {
                        event.event.data = event.event.data || {};
                        for (var key in data) {
                            event.data[key] = event.event.data[key] = data[key];
                        }
                    }
                    event.fn(event.event);
                });
            } else if ($.isFunction(target[event.type])) { // natives
                target[event.type](event.event);
            } else {
                $.logWarn('No `'+ event.type +'` type events found to fire.');
            }
        }
    });

    // on, one, off, fire helper
    function prepareArgs(fn, options, target) {
        options = options || {};
        if ($.isObject(fn)) {
            options = fn, fn = options.fn;
        }
        return {fn: fn, options: extend(options, {target: target})};
    }

    /**
     * On, one, off, fire.
     * @param  {Object}   target
     * @param  {String}   type
     * @param  {Function} fn
     * @param  {Object}   options
     * @return {Event}
     */
    function on(target, type, fn, options) {
        var args = prepareArgs(fn, options, target), event, eventTarget;
        trim(type).split(re_comma).forEach(function(type) {
            event = initEvent(type, args.fn, args.options);
            eventTarget = initEventTarget(target);
            eventTarget.addEvent(event);
        });
    }
    function one(target, type, fn, options) {
        var args = prepareArgs(fn, $.options(options, {once: TRUE}), target), event, eventTarget;
        trim(type).split(re_comma).forEach(function(type) {
            event = initEvent(type, args.fn, args.options);
            eventTarget = initEventTarget(target);
            eventTarget.addEvent(event);
        });
    }
    function off(target, type, fn, options) {
        var args = prepareArgs(fn, options, target), event, eventTarget;
        trim(type).split(re_comma).forEach(function(type) {
            event = initEvent(type, args.fn, args.options);
            eventTarget = initEventTarget(target);
            eventTarget.removeEvent(event);
        });
    }
    function fire(target, type, fn, options) {
        var args = prepareArgs(fn, options, target), event;
        trim(type).split(re_comma).forEach(function(type) {
            event = initEvent(type, args.fn, args.options);
            event.fire(type, args.options.data);
        });
    }

    // shortcuts for Window & Node (Document, Element, ..) objects
    var objects = [Node], prototype = 'prototype', names = ['on', 'one', 'off', 'fire'];
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

    // add event to so
    $.event = {
        on: on,
        one: one,
        off: off,
        fire: fire,
        create: create,
        Event: initEvent,
        CustomEvent: initCustomEvent,
        EventTarget: initEventTarget,
        key: {
            BACKSPACE: KEY_BACKSPACE, TAB:         KEY_TAB,         ENTER:      KEY_ENTER,      ESC:        KEY_ESC,
            LEFT:      KEY_LEFT,      UP:          KEY_UP,          RIGHT:      KEY_RIGHT,      DOWN:       KEY_DOWN,
            DELETE:    KEY_DELETE,    HOME:        KEY_HOME,        END:        KEY_END,        PAGE_UP:    KEY_END,
            PAGE_DOWN: KEY_PAGE_DOWN, INSERT:      KEY_INSERT,      CAPS_LOCK:  KEY_CAPS_LOCK,  ARROW_LEFT: KEY_ARROW_LEFT,
            ARROW_UP:  KEY_ARROW_UP,  ARROW_RIGHT: KEY_ARROW_RIGHT, ARROW_DOWN: KEY_ARROW_DOWN, SHIFT:      KEY_SHIFT,
            CONTROL:   KEY_CONTROL,   ALT:         KEY_ALT,         ALT_GRAPH:  KEY_ALT_GRAPH
        }
    };

})(window, window.so, null, true, false);
