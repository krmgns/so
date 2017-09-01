/**
 * @package so
 * @object  so.event
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, document, $) { 'use strict';

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
    var domLevel = document.adoptNode ? 3 : 2;
    var optionsDefault = {
        bubbles: true, cancelable: true, scoped: false, composed: false, // all
        view: window, detail: null, // ui, mouse, custom
        relatedNode: null, prevValue: '', newValue: '', attrName: '', attrChange: 0, // mutation
        screenX: 0, screenY: 0, clientX: 0, clientY: 0, ctrlKey: false, altKey: false, shiftKey: false,
            metaKey: false, button: 1, relatedTarget: null, // mouse
        useCapture: false, once: false, passive: false, data: {}
    };
    var trims = $.trimSpace, extend = $.extend;

    /**
     * Create.
     * @param  {String} eventClass
     * @param  {String} eventType
     * @param  {Object} options
     * @return {Object}
     */
    function create(eventClass, eventType, options) {
        eventType = trims(eventType);
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

            if (!e.data) {
                e.data = event.data;
            }
            if (!e.target) {
                e = Object.defineProperty(e, 'target', {value: event.target});
            }

            // sugars..
            extend(e, {
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
                },
                // key functions
                isKey: function(keyCode) { return keyCode == e.keyCode; },
                isBackspaceKey: function() { return e.isKey(8); },
                isTabKey: function() { return e.isKey(9); },
                isEnterKey: function() { return e.isKey(13); },
                isEscKey: function() { return e.isKey(27); },
                isLeftKey: function() { return e.isKey(37); },
                isUpKey: function() { return e.isKey(38); },
                isRightKey: function() { return e.isKey(39); },
                isDownKey: function() { return e.isKey(40); },
                isDeleteKey: function() { return e.isKey(46); },
                isHomeKey: function() { return e.isKey(36); },
                isEndKey: function() { return e.isKey(35); },
                isPageUpKey: function() { return e.isKey(33); },
                isPageDownKey: function() { return e.isKey(34); },
                isInsertKey: function() { return e.isKey(45); },
                isCapsLockKey: function() { return e.isKey(20); },
                isArrowLeftKey: function() { return e.isKey(37); },
                isArrowUpKey: function() { return e.isKey(38); },
                isArrowRightKey: function() { return e.isKey(39); },
                isArrowDownKey: function() { return e.isKey(40); },
                isShiftKey: function() { return e.isKey(16); },
                isControlKey: function() { return e.isKey(17); },
                isAltKey: function() { return e.isKey(18); },
                isAltGraphKey: function() { return e.isKey(225); }
            });

            return fn.call(event.target, e);
        };
    }

    // helpers
    function initEvent(type, fn, options) {
        return new Event(type, fn, options);
    }
    function initCustomEvent(type, fn, options) {
        return new Event(type, fn, extend({}, options, {custom: true}));
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
            target.$events[eventType] = [];
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
        type = trims(type);
        options = options || {};
        if ($.isObject(fn)) { // ..('click', {fn: function(){...}})
            options = fn, fn = options.fn;
        }

        options = extend({}, optionsDefault, options);

        this.type = type.toLowerCase();
        this.options = options;
        this.data = options.data;

        this.custom = options.custom;
        if (this.custom) {
            this.options.eventClass = 'CustomEvent';
        }

        var event = create(this.options.eventClass, this.type, options);
        this.event = event.event;
        this.eventClass = event.eventClass;
        this.eventTarget = null;

        this.target = options.target;
        this.useCapture = options.useCapture;

        this.fn = extendFn(this, fn);
        this.fno = fn; // original fn

        this.once = options.once;
        this.passive = options.passive;

        this.i = -1; // no bind yet
        this.fired = 0;
        this.cancalled = false;
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
            var event = this.copy();
            event.target = event.options.target = target;

            // add fn after target set
            var fn = this.fno.bind(target);
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

            event.target = target;
            event.eventTarget = this;
            event.i = target.$events[event.type].push(event) - 1;

            target.addEventListener(event.type, event.fn, event.useCapture);
        },

        /**
         * Remove event.
         * @param  {Event} event
         * @return {void}
         */
        removeEvent: function(event) {
            var target = checkTarget(this.target);
            var remove;

            if (target.$events) {
                remove = [];
                if (event.type == '*') { // all
                    $.for(target.$events, function(events) {
                        $.for(events, function(event, i) {
                            remove.push(event);
                        });
                    });
                } else if (event.type == '**') { // all fired
                    $.for(target.$events, function(events) {
                        $.for(events, function(event, i) {
                            if (event && event.fired) {
                                remove.push(event);
                            }
                        });
                    });
                } else if (event.type.has('**')) { // all fired 'x' types, eg: .off('click**')
                    var type = event.type.slice(0, -2);
                    $.for(target.$events, function(events) {
                        $.for(events, function(event, i) {
                            if (event && event.fired && event.type == type) {
                                remove.push(event);
                            }
                        });
                    });
                } else if (target.$events[event.type]) {
                    var fno = event.fno;
                    if (fno) { // all matched fn's, eg: .off('click', fn)
                        $.for(target.$events, function(events) {
                            $.for(events, function(event, i) {
                                if (event && event.fno == fno) {
                                    remove.push(event);
                                }
                            });
                        });
                    } else { // all matched type's, eg: .off('click')
                        $.for(target.$events[event.type], function(event, i) {
                            remove.push(event);
                        });
                    }
                }


                if (remove.length) {
                    $.for(remove, function(event) {
                        delete target.$events[event.type][event.i];
                        target.removeEventListener(event.type, event.fn, event.useCapture);
                    });

                    // think memory!
                    $.forEach(target.$events, function(type, events) {
                        if ($.isEmpty(events)) {
                            target.$events[type] = null;
                        } else {
                            target.$events[type] = Object.values(target.$events[type]);
                        }
                    });
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
        trims(type).split(re_comma).forEach(function(type) {
            event = initEvent(type, args.fn, args.options);
            eventTarget = initEventTarget(target);
            eventTarget.addEvent(event);
        });
    }
    function one(target, type, fn, options) {
        var args = prepareArgs(fn, $.options(options, {once: true}), target), event, eventTarget;
        trims(type).split(re_comma).forEach(function(type) {
            event = initEvent(type, args.fn, args.options);
            eventTarget = initEventTarget(target);
            eventTarget.addEvent(event);
        });
    }
    function off(target, type, fn, options) {
        var args = prepareArgs(fn, options, target), event, eventTarget;
        trims(type).split(re_comma).forEach(function(type) {
            event = initEvent(type, args.fn, args.options);
            eventTarget = initEventTarget(target);
            eventTarget.removeEvent(event);
        });
    }
    function fire(target, type, fn, options) {
        var args = prepareArgs(fn, options, target), event;
        trims(type).split(re_comma).forEach(function(type) {
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
            BACKSPACE:  8,  TAB:       9, ENTER:       13, ESC:        27,  LEFT:      37,
            UP:         38, RIGHT:    39, DOWN:        40, DELETE:     46,  HOME:      36,
            END:        35, PAGE_UP:  33, PAGE_DOWN:   34, INSERT:     45,  CAPS_LOCK: 20,
            ARROW_LEFT: 37, ARROW_UP: 38, ARROW_RIGHT: 39, ARROW_DOWN: 40,
            SHIFT:      16, CONTROL:  17, ALT:         18, ALT_GRAPH:  225
        }
    };

})(window, document, so);
