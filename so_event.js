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
        optionsDefault = {
            once: false, useCapture: false, passive: false, data: null,
            bubbles: true, cancelable: true, // common
            view: window, detail: null, // ui
            relatedNode: null, prevValue: '', newValue: '', attrName: '', attrChange: 0, // mutation
            screenX: 0, screenY: 0, clientX: 0, clientY: 0, ctrlKey: false, altKey: false,
            shiftKey: false, metaKey: false, button: 1, relatedTarget: null // mouse
        },
        DOMLevel = document.adoptNode ? 3 : 2,
        fnId = 0
    ;

    function createEvent(cType, eType, options) {
        var event, cTypeOrig;
        if (!cType && eType) { // autodetect
            $.forEach(re_types, function(re, _cType) {
                re = new RegExp('^('+ re +')$', 'i');
                if (re.test(eType)) {
                    cType = cTypeOrig = _cType;
                    return 0;
                }
            });
        }

        // @defaults
        cType = cTypeOrig = cType || 'Event';
        eType = eType || '';
        options = $.extend({}, optionsDefault, options);

        if ($.isFunction(window[cType])) {
            return new window[cType](eType, options);
        }

        if (DOMLevel < 3 && re_typesFix.test(cType)) {
            cType += 's';
        }

        event = document.createEvent(cType);
        switch (cTypeOrig) {
            case 'UIEvent':
                event.initUIEvent(eType, options.bubbles, options.cancelable, options.view, options.detail);
                break;
            case 'MouseEvent':
            case 'DragEvent':
            case 'WheelEvent':
                event.initMouseEvent(eType, options.bubbles, options.cancelable, options.view, options.detail,
                    options.screenX, options.screenY, options.clientX, options.clientY,
                    options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
                    options.button, options.relatedTarget
                );
            case 'MutationEvent':
                event.initMutationEvent(eType, options.bubbles, options.cancelable, options.relatedNode,
                    options.prevValue, options.newValue, options.attrName, options.attrChange)
                break;
            default:
                if (cType == 'CustomEvent') {
                    event.initCustomEvent(eType, options.bubbles, options.cancelable, options.detail);
                } else {
                    event.initEvent(eType, options.bubbles, options.cancelable); // all others
                }
        }

        return event;
    }

    function extendFn(fn, event) {
        return function(e) {
            var target = e.target;
            // for auto-fired stuff (using fire(), fireEvent())
            if (!target && this.constructor.name == 'EventTarget') {
                target = this.target;
            }

            event.target
            event.event = e; // overwrite on initial
            event.fired = true;
            if (event.once) { // remove if 'once'
                event.remove(target);
            }

            e.stop = function() { e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation() };
            e.stopDefault = function() { e.preventDefault(); }
            return fn.call(target, e, event);
        };
    }

    $.extend('@event', (function() {
        function Event(type, fn, options) {
            this.type = type.toLowerCase();
            this.options = $.extend({}, optionsDefault, options);
            this.event = createEvent(null, this.type, this.options);
            this.eventTarget = null;
            this.fn = extendFn(fn, this);
            this.fnId = fnId++;
            this.fired = false;
            options = $.pickAll(this.options, ['once', 'passive', 'useCapture']);
            this.once = options[0];
            this.passive = options[1];
            this.useCapture = options[2];
            this.target = options.target || null; // @todo
        }

        $.extend(Event.prototype, {
            add: function(target) {
                var eventTarget = new EventTarget(target);
                eventTarget.addEvent(this);
            },
            remove: function(target) {
                var eventTarget = new EventTarget(target);
                eventTarget.removeEvent(this);
            },
            fire: function(target) {
                var eventTarget = new EventTarget(target);
                eventTarget.fireEvent(this);
            }
        });

        function checkTarget(target) {
            if (!target || !target.target) throw ('No target given.');
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
                checkTarget(this);
                if (!this.target._events[event.type]) {
                    this.target._events[event.type] = [];
                }
                event.target = this.target;
                event.eventTarget = this;
                this.target._events[event.type].push(event);
                this.target.addEventListener(event.type, event.fn, event.useCapture);
            },
            removeEvent: function(event) {
                checkTarget(this);
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
                checkTarget(this);
                if (this.target._events[event.type]) {
                    var events = this.target._events[event.type], i = 0;
                    while (i < events.length) {
                        events[i].fn.call(this, event.event, event);
                        i++;
                    }
                }
            }
        });

        $.onReady(function() {
            var el = document.body, event, f1, f2;
            event = new Event('click', function(e, event) {
                log(this, e.target, event.target)
                // log(this, this == el)
                e.stop()
            }, {once: !true});

            event.add(el)

            event.fire()

            // log(event)
        });

        return {
            // on: on,
            // off: off,
            // once: once,
            // fire: fire,
            create: createEvent,
            Event: Event,
            EventTarget: EventTarget
        };
    })());

})(window, so);
