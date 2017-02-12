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

    // shortcut methods for event
    function extendFn(fn, event) {
        return function(e) {
            event.event = e; // overwrite
            event.fired = true;
            e.stop = function() { e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation() };
            e.stopDefault = function() { e.preventDefault(); }
            var ret = fn.apply(e.target, [e, event]);
            if (event.once) {
                event.remove(e.target);
            }
            return ret;
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
            log(options)
            this.once = options[0];
            this.passive = options[1];
            this.useCapture = options[2];
        }
        // log(Event.prototype)
        $.extend(Event.prototype, {
            add: function(el) {
                var eventTarget = new EventTarget(el);
                eventTarget.addEvent(this);
            },
            remove: function(el) {
                var eventTarget = new EventTarget(el);
                eventTarget.removeEvent(this);
            }
        });

        function EventTarget(el) {
            this.el = el;
            if (!this.el._events) {
                this.el._events = {};
            }
        }
        $.extend(EventTarget.prototype, {
            addEvent: function(event) {
                if (!this.el._events[event.type]) {
                    this.el._events[event.type] = [];
                }
                event.eventTarget = this;
                this.el._events[event.type].push(event);
                this.el.addEventListener(event.type, event.fn, event.useCapture);
            },
            removeEvent: function(event) {
                if (this.el._events[event.type]) {
                    var events = this.el._events[event.type], eventsLength = events.length, i = 0;
                    while (i < eventsLength) {
                        if (events[i].fn === event.fn) {
                            this.el.removeEventListener(event.type, event.fn, event.useCapture);
                            events.splice(i, 1);
                            break;
                        }
                        i++;
                    }
                }
            },
            fireEvent: function(event) {
                if (this.el._events[event.type]) {
                    var events = this.el._events[event.type], eventsLength = events.length, i = 0;
                    while (i < eventsLength) {
                        events[i].fired = true;
                        events[i].fn.call(this, event);
                        i++;
                    }
                }
            }
        });

        $.onReady(function() {
            var el = document.body, event, f1, f2;
            event = new Event('click', function(e, ev) {
                // log('click1', e, ev, this)
                log('click1')
            }, {once: true});
            event.add(el)

            log(event)
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
