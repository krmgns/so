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
            $.throw('Type required.');
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
        function checkTarget(target, eventType) {
            if (!target) $.throw('No target given.');
            if (!target.Events) {
                target.Events = $.list();
            }
            if (eventType && !target.Events.get(eventType)) {
                target.Events.set(eventType, $.list());
            }
            return target;
        }

        function Event(type, fn, options) {
            if (!type) $.throw('Type required.');

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
            unbind: function(type) {
                if (!type) {
                    initEventTarget(this.target).removeEvent(this);
                } else {
                    var _this = this;
                    type.split(/,\s*/).forEach(function(type) {
                        _this.type = type;
                        initEventTarget(_this.target).removeEvent(_this);
                    });
                }
                return this;
            },
            fire: function(type) {
                if (!type) {
                    initEventTarget(this.target).fireEvent(this);
                } else {
                    var _this = this;
                    type.split(/,\s*/).forEach(function(type) {
                        _this.type = type;
                        initEventTarget(_this.target).fireEvent(_this);
                    });
                }
                return this;
            },
            // for chaining >> el.on(...).fire().off()
            off: function(type) { return this.unbind(type); }
        });

        function EventTarget(target) {
            this.target = checkTarget(target);
        }

        $.extend(EventTarget.prototype, {
            addEvent: function(event) {
                var target = checkTarget(this.target, event.type);
                event.target = target;
                event.eventTarget = this;
                event.i = target.Events.get(event.type).append(event).size - 1;
                // target.addEventListener(event.type, event.fn, event.useCapture); // ?
            },
            removeEvent: function(event) {
                var target = checkTarget(this.target),
                    events = target.Events, eventsRemove, type = event.type;

                if (events) {
                    eventsRemove = $.list();
                    if (type == '*') { // all
                        eventsRemove = events.selectAll();
                    } else if (type == '**') { // all fired 'x' types, eg: .off('**')
                        eventsRemove = events.selectAll(function(_event) {
                            return _event && _event.fired;
                        });
                    } else if (type.index('**')) { // all fired 'x' types, eg: .off('click**')
                        type = type.slice(0, -2);
                        eventsRemove = events.selectAll(function(_event) {
                            return _event.type == type && _event && _event.fired;
                        });
                    } else if (events.data[type]) {
                        events = events.data[type];
                        if (event.fn) { // all matched fn's, eg: .off('x', fn)
                            eventsRemove = events.select(function(_event) {
                                return _event && _event.fnOrig === event.fnOrig;
                            });
                        } else { // all 'x' types, eg: .off('x')
                            eventsRemove = events;
                        }
                    }
                } else $.logWarn('No `%s` type events found to fire.'.format(event.type));

                if (eventsRemove) {
                    events = target.Events;
                    eventsRemove.forEach(function(event) {
                        events.data[event.type].removeAt(event.i);
                    });

                    // think memory!
                    events.forEach(function(list, i) {
                        if (!list.size) {
                            events.replaceAt(i, null);
                        }
                    });
                }
            },
            fireEvent: function(event) {
                var target = checkTarget(this.target),
                    events = target.Events.get(event.type);
                if (events) {
                    events.forEach(function(event) {
                        event.fn(event.event);
                    });
                } else $.logWarn('No `%s` type events found to fire.'.format(event.type));
            }
        });

        $.onReady(function() {
            var el = document.body, event, f0, f1

            el.on('a1', function(e) { log('a1') })
            el.on('a2', function(e) { log('a2') }) .fire() //.off()

            el.on('click', f0 = function(e) { log('click 0', e) }) .fire() //.unbind()

            el.on('click', f1 = function(e) { log('click 1', e)
                // el.fire('aaa')
                // el.off('*')
                // el.off('**')
                // el.off('click')
                // el.off('click**')
                // el.off('click', f0)
                // log(this._events)
            })
            // event.unbind()

            // el.off('*')
            // el.off('**')
            // el.off('click')
            // el.off('click**')
            el.off('click', f0)

            // el.fire('click')

            // el.on('a3', function(e) { log('a3') }).fire()

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
            return initEvent(type, args.fn, args.options).unbind(type);
        }
        function fire(target, type, fn, options, args /* @internal */) {
            args = prepareArgs(fn, options, target);
            return initEvent(type, args.fn, args.options).fire(type);
        }

        Element.prototype.on = function(type, fn, options) { return on(this, type, fn, options); };
        Element.prototype.off = function(type, fn, options) { return off(this, type, fn, options); };
        Element.prototype.once = function(type, fn, options) { return once(this, type, fn, options); };
        Element.prototype.fire = function(type, fn, options) { return fire(this, type, fn, options); };

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
