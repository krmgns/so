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
        fn_warn = function(message) { console.warn(message) },
        fn_throw = function(message) { throw (message); },
        optionsDefault = {
            once: false, useCapture: false, passive: false, data: {}, custom: false,
            bubbles: true, cancelable: true, composed: false, // common
            view: window, detail: null, // ui
            relatedNode: null, prevValue: '', newValue: '', attrName: '', attrChange: 0, // mutation
            screenX: 0, screenY: 0, clientX: 0, clientY: 0, ctrlKey: false, altKey: false,
            shiftKey: false, metaKey: false, button: 1, relatedTarget: null // mouse
        }
    ;

    function createEvent(eventClass, eventType, options) { // temizle
        if (!eventType) {
            fn_throw('Type required.');
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
        if (!fn) return;

        return function(e) {
            var target = e.target;
            // for auto-fired stuff (using fire() in other location)
            if (!target) {
                target = event.eventTarget.target;
            }

            event.event = e; // overwrite on initial
            event.fired = true;
            if (event.once) { // remember once
                event.unbind(target);
            }

            if (!e.data) {
                e.data = event.data;
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
        function initEvent(type, fn, options) {
            return new Event(type, fn, options);
        }
        function initEventTarget(target) {
            return new EventTarget(target);
        }
        function checkTarget(target) {
            if (!target) fn_throw('No target given.');
        }

        function Event(type, fn, options) {
            if (!type) fn_throw('Type required.');

            if ($.isObject(fn)) {
                options = fn, fn = options.fn;
            }

            var _this = this, event;
            this.type = type.toLowerCase();
            this.options = $.extend({}, optionsDefault, options);
            this.data = this.options.data;

            event = createEvent(null, this.type, this.options);
            this.event = event.event;
            this.eventClass = event.eventClass;
            this.eventTarget = null;

            this.fn = extendFn(this, fn);
            this.fnOrig = fn;

            options = $.pickAll(this.options, 'once', 'passive', 'useCapture', 'target', 'custom');
            this.once = options.once;
            this.passive = options.passive;
            this.useCapture = options.useCapture;
            this.target = options.target || null;

            this.i = -1;
            this.fired = false;
            this.cancalled = false;
            this.custom = !!(options.custom || event.eventClass == 'CustomEvent' || !re_typesStandard.test(type));
        }

        $.extend(Event.prototype, {
            bind: function() {
                initEventTarget(this.target).addEvent(this);
                return this;
            },
            bindTo: function(target) {
                initEventTarget(target).addEvent(this);
                return this;
            },
            unbind: function() {
                initEventTarget(this.target).removeEvent(this);
                return this;
            },
            fire: function() {
                initEventTarget(this.target).fireEvents(this);
                return this;
            }
        });

        function EventTarget(target) {
            checkTarget(target);
            this.target = target;
            if (!this.target._events) {
                this.target._events = {};
            }
        }

        $.extend(EventTarget.prototype, {
            addEvent: function(event) {
                var _this = this;
                checkTarget(this.target);
                if (!this.target._events[event.type]) {
                    this.target._events[event.type] = [];
                }
                event.target = this.target;
                event.eventTarget = this;
                event.i += this.target._events[event.type].push(event);
                this.target.addEventListener(event.type, event.fn, event.useCapture);
            },
            removeEvent: function(event) {
                var _this = this, events = _this.target._events, toRemoveEvents = [];
                checkTarget(_this.target);

                if (events[event.type]) {
                    if (!event.fn) { // all 'x' types
                        toRemoveEvents = $.copy(events[event.type]);
                    } else { // all matched fn's
                        toRemoveEvents = $.list(events[event.type]).select(function(_event) {
                            return _event && _event.fnOrig == event.fnOrig;
                        }).data;
                    }
                } else if (event.type == '*') { // all
                    toRemoveEvents = $.list(events).selectAll([], function(_event) {
                        return !!_event;
                    }).data;
                } else if (event.type == '**') { // all fired
                    toRemoveEvents = $.list(events).selectAll([], function(_event) {
                        return _event && _event.fired;
                    }).data;
                } else if (event.type.indexOf('**')) { // all fired 'x' types (i.e: click**)
                    var type = event.type.slice(0, -2);
                    if (events[type]) {
                        toRemoveEvents = $.list(events[type]).select(function(_event) {
                            return _event && _event.fired;
                        }).data;
                    }
                }

                $.forEach(toRemoveEvents, function(e) {
                    if (!e) return;
                    var type = e.type;
                    delete events[type][e.i]; // splice sucks..

                    events[type].length--; // think memory
                    if (!events[type].length) {
                        events[type] = null;
                    }

                    _this.target.removeEventListener(type, e.fn, e.useCapture);
                });
            },
            fireEvents: function(event) {
                var _this = this, events = this.target._events, i;
                checkTarget(this.target);
                if (events[event.type]) {
                    events = events[event.type], i = 0;
                    while (i < events.length) {
                        events[i].fn(event.event);
                        i++;
                    }
                } else fn_warn('No `%s` type event found.'.format(event.type));
            }
        });

        function prepareArgs(fn, options, target, once) {
            if ($.isObject(fn)) {
                options = fn, fn = options.fn;
            }
            return {fn: fn, options: $.extend(options, {target: target, once: !!once})};
        }

        function on(target, type, fn, options, args /* @internal */) {
            args = prepareArgs(fn, options, target);
            return initEvent(type, args.fn, args.options).bind();
        }
        function once(target, type, fn, options, args /* @internal */) {
            args = prepareArgs(fn, options, target, true);
            return initEvent(type, args.fn, args.options).bind();
        }
        function off(target, type, fn, options, args /* @internal */) {
            args = prepareArgs(fn, options, target);
            return initEvent(type, args.fn, args.options).unbind();
        }
        function fire(target, type, fn, options, args /* @internal */) {
            args = prepareArgs(fn, options, target);
            return initEvent(type, args.fn, args.options).fire();
        }

        Element.prototype.on = function(type, fn, options) { return on(this, type, fn, options); };
        Element.prototype.off = function(type, fn, options) { return off(this, type, fn, options); };
        Element.prototype.once = function(type, fn, options) { return once(this, type, fn, options); };
        Element.prototype.fire = function(type, fn, options) { return fire(this, type, fn, options); };

        $.onReady(function() {
            var el = document.body, event, f1, f2

            event = el.on('aaa', function(e) { log('aaa') })

            event = el.on('click', f1 = function(e) { log('click 1') })//.unbind()

            event = el.on('click', f2 = function(e) {
                log('click 2')
                // el.fire('aaa')
                // el.off('*')
                // el.off('**')
                // el.off('click')
                // el.off('click**')
                el.off('click', f1)
            })
            // el.off('click')
            // event.unbind()

            // log(event)


            // event = $.event.Event('click', function(e) { log(e) }, {once: true})
            // event.bindTo(el)

            // event = new Event('load', function(e) {
            //     log(e, e.data)
            // }, {once: !true, target: !el, data: 111}).bindTo(el)

            // // event.fire()

            // el.addEventListener("click", function(e) {
            //     event.fire() //.unbind()
            // }, false)
        });


        return {
            on: on,
            off: off,
            once: once,
            // fire: fire,
            create: createEvent,
            Event: initEvent,
            EventTarget: initEventTarget,
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
