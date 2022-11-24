/**
 * @package so
 * @object  so.event
 * @depends so
 * @author  Kerem Güneş
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function ($, NULL, TRUE, FALSE, UNDEFINED) { 'use strict';

    var PROTOTYPE = 'prototype', EVENTS = '$events';

    var $win = $.win(), $doc = $.doc();
    var $trim = $.trim, $extend = $.extend, $for = $.for, $forEach = $.forEach, $fire = $.fire,
        $isObject = $.isObject, $isFunction = $.isFunction

    var Object = $win.Object, objectDefineProperty = Object.defineProperty, warn = console.warn;

    var types = {
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
    var re_comma = /\s*,\s*/;

    var domLevel = $doc.adoptNode ? 3 : 2;
    var optionsDefault = {
        bubbles: TRUE, cancelable: TRUE, scoped: FALSE, composed: FALSE, // all
        view: $win, detail: NULL, // ui, mouse, custom
        relatedNode: NULL, prevValue: '', newValue: '', attrName: '', attrChange: 0, // mutation
        screenX: 0, screenY: 0, clientX: 0, clientY: 0, ctrlKey: FALSE, altKey: FALSE, shiftKey: FALSE,
            metaKey: FALSE, button: 1, relatedTarget: NULL, // mouse
        once: FALSE, capture: FALSE, passive: FALSE, useCapture: FALSE, data: {}, delay: 0
    };

    var KEY_BACKSPACE  = 8,  KEY_TAB      =  9, KEY_ENTER       = 13, KEY_ESC        = 27,  KEY_LEFT      = 37,
        KEY_UP         = 38, KEY_RIGHT    = 39, KEY_DOWN        = 40, KEY_DELETE     = 46,  KEY_HOME      = 36,
        KEY_END        = 35, KEY_PAGE_UP  = 33, KEY_PAGE_DOWN   = 34, KEY_INSERT     = 45,  KEY_CAPS_LOCK = 20,
        KEY_ARROW_LEFT = 37, KEY_ARROW_UP = 38, KEY_ARROW_RIGHT = 39, KEY_ARROW_DOWN = 40,
        KEY_SHIFT      = 16, KEY_CONTROL  = 17, KEY_ALT         = 18, KEY_ALT_GRAPH  = 225;

    var _id = 0;
    var _break = FALSE;

    function split(s, re) {
        return $trim(s).split(re).filter();
    }

    /**
     * Create.
     * @param  {String} eventClass
     * @param  {String} eventType
     * @param  {Object} options
     * @return {Object}
     */
    function create(eventClass, eventType, options) {
        eventType = $trim(eventType);
        if (!eventType) {
            throw ('Type required!');
        }

        options = $extend({}, optionsDefault, options);

        var event, eventClassOrig;
        if (!eventClass) { // autodetect
            $forEach(types, function (name, re) {
                re = $.re('^('+ re +')$', 'i', '1m');
                if (re.test(eventType)) {
                    eventClass = eventClassOrig = name;
                    return _break;
                }
            });
        }

        eventClass = eventClassOrig = eventClass || 'Event'; // @default
        try { // wrong parameters causes error (opera/12)
            event = (eventClass != 'MutationEvent' && new $win[eventClass](eventType, options));
        } catch (_) {}

        if (!event) {
            // add 's' if needed
            if (domLevel < 3 && re_typesFix.test(eventClass)) {
                eventClass += 's';
            }

            event = $doc.createEvent(eventClass);
            if (eventClassOrig == 'UIEvent') {
                event.initUIEvent(eventType, options.bubbles, options.cancelable, options.view, options.detail);
            } else if (eventClassOrig == 'MouseEvent'
                    || eventClassOrig == 'DragEvent'
                    || eventClassOrig == 'WheelEvent') {
                event.initMouseEvent(eventType, options.bubbles, options.cancelable, options.view, options.detail,
                    options.screenX, options.screenY, options.clientX, options.clientY,
                    options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
                    options.button, options.relatedTarget);
            } else if (eventClassOrig == 'MutationEvent') {
                event.initMutationEvent(eventType, options.bubbles, options.cancelable, options.relatedNode,
                    options.prevValue, options.newValue, options.attrName, options.attrChange);
            } else {
                (eventClass == 'CustomEvent')
                    ? event.initCustomEvent(eventType, options.bubbles, options.cancelable, options.detail)
                    : event.initEvent(eventType, options.bubbles, options.cancelable); // all others
            }
        }

        // return {event: event, eventClass: (eventClass in types) ? eventClass : 'CustomEvent'};
        return [event, (eventClass in types) ? eventClass : 'CustomEvent'];
    }

    /**
     * Extend fn.
     * @param  {Event}    event
     * @param  {Function} fn
     * @return {Function}
     */
    function extendFn(event, fn) {
        if (!fn) return;

        return function (e) {
            if (event.once) { // remove after call if once
                event.unbind();
            }

            event.event = e; // overwrite on initial
            event.fired++;

            // when "e.foo = event.foo", error: cannot assign to read only property 'foo'..
            if (!e.data) {
                e = objectDefineProperty(e, 'data', {value: event.options.data || {}, writable: TRUE});
            }
            if (!e.target) {
                e = objectDefineProperty(e, 'target', {value: event.target});
            }

            // sugars..
            $extend(e, {
                $: $(e.target),
                event: event,
                eventTarget: event.eventTarget,
                stop: function (immediate) {
                    e.stopDefault();
                    e.stopBubble(immediate);
                },
                stopDefault: function () {
                    e.preventDefault();
                },
                stopBubble: function (immediate) {
                    e.stopPropagation();
                    if (immediate) {
                        e.stopImmediatePropagation();
                    }
                }
            });

            // workaround for key,keyCode for (on)input events
            if (e.type == 'input') {
                var char = $isObject(e.data) ? NULL : e.data;
                if (char != NULL) {
                    e.key = char;
                    e.keyCode = char.upper().charCodeAt();
                }
            }

            var isKey = function (keyCode) {
                return (keyCode == e.keyCode);
            };

            // key sugars..
            $extend(e, {
                isKey: isKey,
                isBackspaceKey:  function () { return isKey(KEY_BACKSPACE) },
                isTabKey:        function () { return isKey(KEY_TAB) },
                isEnterKey:      function () { return isKey(KEY_ENTER) },
                isEscKey:        function () { return isKey(KEY_ESC) },
                isLeftKey:       function () { return isKey(KEY_LEFT) },
                isUpKey:         function () { return isKey(KEY_UP) },
                isRightKey:      function () { return isKey(KEY_RIGHT) },
                isDownKey:       function () { return isKey(KEY_DOWN) },
                isDeleteKey:     function () { return isKey(KEY_DELETE) },
                isHomeKey:       function () { return isKey(KEY_HOME) },
                isEndKey:        function () { return isKey(KEY_END) },
                isPageUpKey:     function () { return isKey(KEY_PAGE_UP) },
                isPageDownKey:   function () { return isKey(KEY_PAGE_DOWN) },
                isInsertKey:     function () { return isKey(KEY_INSERT) },
                isCapsLockKey:   function () { return isKey(KEY_CAPS_LOCK) },
                isArrowLeftKey:  function () { return isKey(KEY_ARROW_LEFT) },
                isArrowUpKey:    function () { return isKey(KEY_ARROW_UP) },
                isArrowRightKey: function () { return isKey(KEY_ARROW_RIGHT) },
                isArrowDownKey:  function () { return isKey(KEY_ARROW_DOWN) },
                isShiftKey:      function () { return isKey(KEY_SHIFT) },
                isControlKey:    function () { return isKey(KEY_CONTROL) },
                isAltKey:        function () { return isKey(KEY_ALT) },
                isAltGraphKey:   function () { return isKey(KEY_ALT_GRAPH) }
            });

            return fn.call(event.target, e, event.target);
        };
    }

    // helpers
    function initEvent(type, fn, options) {
        return new Event(type, fn, options);
    }
    function initCustomEvent(type, fn, options) {
        return new Event(type, fn, $extend(options, {custom: TRUE}));
    }
    function initEventTarget(target) {
        return new EventTarget(target);
    }
    function prepareEventTarget(target, eventType) {
        if (!target) {
            throw ('No target given!');
        }

        target[EVENTS] || (target[EVENTS] = {});
        if (eventType && !target[EVENTS][eventType]) {
            target[EVENTS][eventType] = {};
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
        var _this, event;

        type = $trim(type);
        options = options || {};
        if ($isObject(fn)) { // ..('click', {fn: function (){..}})
            options = fn, fn = options.fn;
        }

        options = $extend({}, optionsDefault, options);

        _this = this; // just as minify candy
        _this.type = type;
        _this.options = options;

        _this.custom = !!options.custom;
        if (_this.custom) {
            _this.options.eventClass = 'CustomEvent';
        }

        event = create(_this.options.eventClass, _this.type, options);
        _this.event = event[0];
        _this.eventClass = event[1];
        _this.eventTarget = NULL;

        _this.target = options.target;
        _this.useCapture = options.useCapture;

        _this.fn = extendFn(_this, fn);
        _this.fno = fn; // original fn

        _this.once = options.once;
        _this.passive = options.passive;

        _this.id = ++_id;
        _this.fired = 0;
        _this.cancalled = FALSE;
    }

    $extend(Event[PROTOTYPE], {
        /**
         * Copy.
         * @return {Event}
         */
        copy: function () {
            var event = this,
                eventCopy = initEvent(event.type, event.fno, event.options);

            return $extend(eventCopy, event);
        },

        /**
         * Bind.
         * @param  {String} type?
         * @return {Event}
         */
        bind: function (type) {
            var event = this.copy(),
                eventTarget = initEventTarget(event.target);

            if (!type) {
                eventTarget.addEvent(event);
            } else {
                split(type, re_comma).each(function (type) {
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
        bindTo: function (target) {
            var event = this.copy(), fn;
            event.target = event.options.target = target;

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
        unbind: function (type) {
            var event = this.copy(),
                eventTarget = initEventTarget(event.target);

            if (!type) {
                eventTarget.removeEvent(event);
            } else {
                split(type, re_comma).each(function (type) {
                    event.type = type;
                    eventTarget.removeEvent(event);
                });
            }

            return event;
        },

        /**
         * Fire.
         * @param  {String}     type?
         * @param  {Object}     data?
         * @param  {Int|String} delay?
         * @return {Event}
         */
        fire: function (type, data, delay) {
            var event = this.copy(),
                eventTarget = initEventTarget(event.target);

            if (!type) {
                eventTarget.fireEvent(event, data, delay);
            } else {
                split(type, re_comma).each(function (type) {
                    event.type = type;
                    eventTarget.fireEvent(event, data, delay);
                });
            }

            return event;
        },

        /**
         * Off (alias of unbind(), for chaining, eg: el.on(..).fire().off())
         */
        off: function (type) {
            return this.unbind(type);
        }
    });

    /**
     * Event Target.
     * @param {Object} target
     */
    function EventTarget(target) {
        this.target = prepareEventTarget(target);
    }

    $extend(EventTarget[PROTOTYPE], {
        /**
         * Add event.
         * @param  {Event} event
         * @return {void}
         */
        addEvent: function (event) {
            var target = prepareEventTarget(this.target, event.type);

            event.id = event.id || ++_id;
            event.target = target;
            event.eventTarget = this;
            target[EVENTS][event.type][event.id] = event;

            target.addEventListener(event.type, event.fn, event.useCapture);
        },

        /**
         * Remove event.
         * @param  {Event} event
         * @return {void}
         */
        removeEvent: function (event) {
            var target = prepareEventTarget(this.target),
                targetEvents = target[EVENTS],
                removeStack = [], type;

            if (target[EVENTS]) {
                if (event.type == '*') { // all
                    $for(targetEvents, function (events) {
                        $for(events, function (event) {
                            removeStack.push(event);
                        });
                    });
                } else if (event.type == '**') { // all fired
                    $for(targetEvents, function (events) {
                        $for(events, function (event) {
                            if (event && event.fired) {
                                removeStack.push(event);
                            }
                        });
                    });
                } else if (event.type.endsWith('**')) { // all fired 'x' types, eg: .off('click**')
                    type = event.type.slice(0, -2);
                    $for(target[EVENTS][type], function (event) {
                        if (event && event.fired) {
                            removeStack.push(event);
                        }
                    });
                } else if (targetEvents[event.type]) {
                    var fno = event.fno, events = targetEvents[event.type];
                    if (fno) { // all matched type's & fn's, eg: .off('click', fn)
                        $for(events, function (event) {
                            if (event && event.fno == fno) {
                                removeStack.push(event);
                            }
                        });
                    } else { // all matched type's, eg: .off('click')
                        $for(events, function (event) {
                            removeStack.push(event);
                        });
                    }
                }

                if (removeStack.len()) {
                    $for(removeStack, function (event) {
                        if (event && (event.id in targetEvents[event.type])) {
                            delete targetEvents[event.type][event.id];
                            target.removeEventListener(event.type, event.fn, event.useCapture);
                        }
                    });

                    // think memory!
                    $forEach(targetEvents, function (type, events) {
                        targetEvents[type] = $.empty(events) ? NULL : events;
                    });
                } else if ($isFunction(target['on'+ event.type])) { // natives
                    target['on'+ event.type] = NULL;
                }
            } else {
                warn('No "'+ event.type +'" to remove!');
            }
        },

        /**
         * Fire event.
         * @param  {Event}      event
         * @param  {Object}     data?
         * @param  {Int|String} delay?
         * @return {void}
         */
        fireEvent: function (event, data, delay) {
            var target = prepareEventTarget(this.target), key;

            if (target[EVENTS][event.type]) {
                $for(target[EVENTS][event.type], function (event) {
                    data = data || event.options.data;
                    delay = delay || event.options.delay;

                    if (data) { // call-time data (eg: fire("foo", {data: {a: 1, b: ..}}))
                        event.event.data = event.event.data || {};
                        for (key in data) {
                            event.event.data[key] = data[key];
                        }
                    }

                    $fire(delay, function () {
                        event.fn(event.event);
                    });
                });
            } else if ($isFunction(target[event.type])) { // natives
                delay = delay || event.options.delay;

                $fire(delay, function () {
                    target[event.type](event.event);
                });
            } else {
                warn('No "'+ event.type +'" to fire!');
            }
        }
    });

    function prepareArguments(fn, options, target) {
        options = options || {};
        if ($isObject(fn)) {
            options = fn, fn = options.fn;
        }
        return {fn: fn, options: $extend(options, {target: target})};
    }

    /**
     * On, off, once, fire.
     * @param  {Object}   target
     * @param  {String}   type
     * @param  {Function} fn
     * @param  {Object}   options
     * @return {void}
     */
    function on(target, type, fn, options) {
        var args = prepareArguments(fn, options, target), event, eventTarget;
        split(type, re_comma).each(function (type) {
            event = initEvent(type, args.fn, args.options);
            eventTarget = initEventTarget(target);
            eventTarget.addEvent(event);
        });
    }
    function off(target, type, fn, options) {
        var args = prepareArguments(fn, options, target), event, eventTarget;
        split(type, re_comma).each(function (type) {
            event = initEvent(type, args.fn, args.options);
            eventTarget = initEventTarget(target);
            eventTarget.removeEvent(event);
        });
    }
    function once(target, type, fn, options) {
        var args = prepareArguments(fn, $extend(options, {once: TRUE}), target), event, eventTarget;
        split(type, re_comma).each(function (type) {
            event = initEvent(type, args.fn, args.options);
            eventTarget = initEventTarget(target);
            eventTarget.addEvent(event);
        });
    }
    function fire(target, type, fn, options) {
        var args = prepareArguments(fn, options, target), event;
        split(type, re_comma).each(function (type) {
            event = initEvent(type, args.fn, args.options);
            event.fire(type, args.options.data, args.options.delay);
        });
    }

    /**
     * Has.
     * @param  {Object}   target
     * @param  {String}   type
     * @param  {Function} fn
     * @param  {Object}   opt_typeOnly?
     * @return {Bool}
     */
    function has(target, type, fn, opt_typeOnly) {
        var events = target && target[EVENTS], ret = FALSE;
        if (!events) {
            return ret;
        }

        if (opt_typeOnly) {
            ret = !!events[type]; // just check type
        } else if (events[type] && fn) {
            $for(events[type], function (event) {
                if (event.fno && event.fno == fn) {
                    ret = TRUE;
                    return _break;
                }
            });
        } else if ($isFunction(target[type])) { // natives
            ret = TRUE;
        }

        return ret;
    }

    // add event to so
    $.event = {
        on: on,
        off: off,
        once: once,
        fire: fire,
        has: has,
        create: create,
        Event: initEvent,
        EventTarget: initEventTarget,
        CustomEvent: initCustomEvent,
        key: {
            BACKSPACE: KEY_BACKSPACE, TAB:         KEY_TAB,         ENTER:      KEY_ENTER,      ESC:        KEY_ESC,
            LEFT:      KEY_LEFT,      UP:          KEY_UP,          RIGHT:      KEY_RIGHT,      DOWN:       KEY_DOWN,
            DELETE:    KEY_DELETE,    HOME:        KEY_HOME,        END:        KEY_END,        PAGE_UP:    KEY_END,
            PAGE_DOWN: KEY_PAGE_DOWN, INSERT:      KEY_INSERT,      CAPS_LOCK:  KEY_CAPS_LOCK,  ARROW_LEFT: KEY_ARROW_LEFT,
            ARROW_UP:  KEY_ARROW_UP,  ARROW_RIGHT: KEY_ARROW_RIGHT, ARROW_DOWN: KEY_ARROW_DOWN, SHIFT:      KEY_SHIFT,
            CONTROL:   KEY_CONTROL,   ALT:         KEY_ALT,         ALT_GRAPH:  KEY_ALT_GRAPH
        }
    };

})(window.so, null, true, false);
