;(function(window, $) { 'use strict';

    var re_typesFix = /^(UI|Mouse|Mutation|HTML)Event/i,
        re_types = {
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
        },
        re_typesStandard = new RegExp(Object.values(re_types).join('|'), 'i'),
        optionsDefault = {
            once: false, useCapture: false, passive: false, data: null, custom: false,
            bubbles: true, cancelable: true, // common
            view: window, detail: null, // ui
            relatedNode: null, prevValue: '', newValue: '', attrName: '', attrChange: 0, // mutation
            screenX: 0, screenY: 0, clientX: 0, clientY: 0, ctrlKey: false, altKey: false,
            shiftKey: false, metaKey: false, button: 1, relatedTarget: null // mouse
        },
        fnId = 0
    ;

    function createEvent(eventClass, eventType, options) {
        if (!eventType) {
            throw ('Type required.');
        }

        var event, eventClass, eventClassOrig;
        options = $.extend({}, optionsDefault, options);

        if (!eventClass) { // autodetect
            $.forEach(re_types, function(re, _eventClass) {
                re = new RegExp('^('+ re +')$', 'i');
                if (re.test(eventType)) {
                    eventClass = eventClassOrig = _eventClass;
                    return 0;
                }
            });
        }


        eventClass = eventClassOrig = eventClass || 'Event'; // @default
        if ($.isFunction(window[eventClass])) {
            event = new window[eventClass](eventType, options);
        } else {
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

    function extendFn(event, fn) {
        return function(e) {
            var target = e.target, properties;
            // for auto-fired stuff (using fire(), fireEvent())
            if (!target && event.eventTarget.constructor.name == 'EventTarget') {
                target = event.eventTarget.target;
            }

            event.event = e; // overwrite on initial
            event.fired = true;
            if (event.once) { // remember once
                event.unbind(target);
            }

            // overwrite nö!
            // e = Object.create(e, {
            //     target: {value: target}
            // });

            // sugars..
            $.extend(e, {
                event: event,
                eventTarget: event.eventTarget,
                originalTarget: event.target,
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

            return fn.call(target, e);
        };
    }

    $.extend('@event', (function() {
        function Event(type, fn, options) {
            var _this = this, event;
            this.type = type.toLowerCase();
            this.options = $.extend({}, optionsDefault, options);
            this.data = this.options.data;

            event = createEvent(null, this.type, this.options);
            this.event = event.event;
            this.eventClass = event.eventClass;
            this.eventTarget = null;

            this.fn = extendFn(this, fn);
            this.fnId = fnId++;
            this.fnOrig = fn;

            options = $.pickAll(this.options, ['once', 'passive', 'useCapture', 'target', 'custom']);
            this.once = options.once;
            this.passive = options.passive;
            this.useCapture = options.useCapture;
            this.target = options.target || null;

            this.fired = false;
            this.cancalled = false;
            this.custom = !!(options.custom || event.eventClass == 'CustomEvent' || !re_typesStandard.test(type));
        }

        function newEventTarget(event, target) {
            return new EventTarget(target || event.target);
        }

        $.extend(Event.prototype, {
            bind: function() {
                newEventTarget(this).addEvent(this);
                return this;
            },
            bindTo: function(target) {
                newEventTarget(null, target).addEvent(this);
                return this;
            },
            unbind: function(target) {
                newEventTarget(this, target).removeEvent(this);
                return this;
            },
            fire: function(target) {
                newEventTarget(this, target).fireEvent(this);
                return this;
            }
        });

        function checkTarget(target) {
            if (!target) throw ('No target given.');
        }

        function EventTarget(target) {
            checkTarget(target);
            this.target = target;
            if (!this.target._events) {
                this.target._events = {};
            }
        }

        $.extend(EventTarget.prototype, {
            addEvent: function(event) {
                checkTarget(this.target);
                if (!this.target._events[event.type]) {
                    this.target._events[event.type] = [];
                }
                event.target = this.target;
                event.eventTarget = this;
                this.target._events[event.type].push(event);
                this.target.addEventListener(event.type, event.fn, event.useCapture);
            },
            removeEvent: function(event) {
                checkTarget(this.target);
                if (this.target._events[event.type]) {
                    var events = this.target._events[event.type], i = 0;
                    while (i < events.length) {
                        if (events[i].fn === event.fn) {
                            this.target.removeEventListener(event.type, event.fn, event.useCapture);
                            events.splice(i, 1);
                            break;
                        }
                        i++;
                    }
                }
            },
            fireEvent: function(event) {
                checkTarget(this.target);
                if (this.target._events[event.type]) {
                    var events = this.target._events[event.type], i = 0;
                    while (i < events.length) {
                        events[i].fn(event.event, event);
                        i++;
                    }
                }
            }
        });

        $.onReady(function() {
            var el = document.body, event, f1, f2;
            event = new Event('load', function(e) { // data >> ( [ "Custom", "Event" ] );
                log(e, e.event.fired)
                // log(e.event, e.eventTarget, e.targetObject)
            }, {once: !true, target: !el}).bindTo(el)

            // event.fire()

            el.addEventListener("click", function(e) {
                event.fire()
            }, false)
        });

        return {
            // on: on,
            // onTo: onTo,
            // off: off,
            // once: once,
            // fire: fire,
            // bind: bind,
            // unbind: unbind,
            create: createEvent,
            Event: Event,
            EventTarget: EventTarget,
            keyCode: {
                BACKSPACE:  8, TAB:      9, ENTER:      13, ESC:       27,  LEFT:     37,
                UP:        38, RIGHT:   39, DOWN:       40, DELETE:    46,  HOME:     36,
                END:       35, PAGEUP:  33, PAGEDOWN:   34, INSERT:    45,  CAPSLOCK: 20,
                ARROWLEFT: 37, ARROWUP: 38, ARROWRIGHT: 39, ARROWDOWN: 40,
                SHIFT:     16, CONTROL: 17, ALT:        18, ALTGRAPH:  225
            }
        };
    })());

})(window, so);
