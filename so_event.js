/**
 * @package so
 * @object  so.event
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $) { 'use strict';

    // minify tools
    var NULL = null, NULLS = '',
        TRUE = true, FALSE = false
    ;

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
        },
        re_typesFix = /^(UI|Mouse|Mutation|HTML)Event$/i,
        re_typesStandard = new RegExp(Object.values(re_types).join('|'), 'i'),
        optionsDefault = {
            bubbles: TRUE, cancelable: TRUE, scoped: FALSE, composed: FALSE, // all
            view: window, detail: NULL, // ui, mouse, custom
            relatedNode: NULL, prevValue: NULLS, newValue: NULLS, attrName: NULLS, attrChange: 0, // mutation
            screenX: 0, screenY: 0, clientX: 0, clientY: 0, ctrlKey: FALSE, altKey: TRUE, shiftKey: FALSE,
                metaKey: FALSE, button: 1, relatedTarget: NULL, // mouse
            useCapture: FALSE, once: FALSE, passive: FALSE, data: {}
        }
    ;

    /**
     * Create event.
     * @param  {String} eventClass
     * @param  {String} eventType
     * @param  {Object} options
     * @return {Object}
     */
    function createEvent(eventClass, eventType, options) {
        if (!eventType) throw ('Type required.');

        var event, eventClassOrig;
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

            var target = e.target;
            if (!target) { // for auto-fired stuff (using fire() in other location)
                target = event.eventTarget.target;
            }

            event.event = e; // overwrite on initial
            event.fired++;

            if (!e.data) {
                e.data = event.data;
            }

            // sugars..
            $.extend(e, {
                event: event,
                eventTarget: event.eventTarget,
                originalTarget: event.target,
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

            return fn.call(target, e);
        };
    }

    $.extend('@event', (function() {
        // private helpers
        function initEvent(type, fn, options) {
            return new Event(type, fn, options);
        }
        function initEventTarget(target) {
            return new EventTarget(target);
        }
        function checkTarget(target, eventType) {
            if (!target) throw ('No target given.');

            if (!target.Events) {
                target.Events = $.list();
            }

            if (eventType && !target.Events.get(eventType)) {
                target.Events.set(eventType, $.list());
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
            _this.data = options.data;

            options = $.pickAll(_this.options, 'target', 'useCapture');
            _this.target = options.target;
            _this.useCapture = !!options.useCapture;

            var event = createEvent(options.eventClass, _this.type, _this.options);
            _this.event = event.event;
            _this.eventClass = event.eventClass;
            _this.eventTarget = NULL;

            _this.fn = extendFn(_this, fn);
            _this.fnOrig = fn;

            options = $.pickAll(_this.options, 'once', 'passive');
            _this.once = !!options.once;
            _this.passive = !!options.passive;

            _this.i = -1; // no bind yet
            _this.fired = 0;
            _this.cancalled = FALSE;
            _this.custom = event.eventClass == 'CustomEvent' || !re_typesStandard.test(type);

        }

        $.extend(Event.prototype, {
            /**
             * Bind.
             * @return {this}
             */
            bind: function() {
                return initEventTarget(this.target).addEvent(this), this;
            },

            /**
             * Bind to.
             * @param  {Object} target
             * @return {this}
             */
            bindTo: function(target) {
                return initEventTarget(target).addEvent(this), this;
            },

            /**
             * Unbind.
             * @param  {String|undefined} type
             * @return {this}
             */
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

            /**
             * Fire.
             * @param  {String|undefined} type
             * @return {this}
             */
            fire: function(type) {
                if (!type) {
                    initEventTarget(this.target).dispatch(this);
                } else {
                    var _this = this;
                    type.split(/,\s*/).forEach(function(type) {
                        _this.type = type;
                        initEventTarget(_this.target).dispatch(_this);
                    });
                }

                return this;
            },

            /**
             * Is fired.
             * @return {Boolean}
             */
            isFired: function() {
                return !!this.fired;
            },

            // for chaining >> el.on(...).fire().off()
            off: function(type) { return this.unbind(type); }
        });

        /**
         * Event Target
         * @param {Object} target
         */
        function EventTarget(target) {
            this.target = checkTarget(target);
        }

        $.extend(EventTarget.prototype, {
            /**
             * Add event.
             * @param  {Event} event
             * @return {void}
             */
            addEvent: function(event) {
                var target = checkTarget(this.target, event.type);
                event.target = target;
                event.eventTarget = this;
                event.i = target.Events.get(event.type).append(event).size - 1;
                target.addEventListener(event.type, event.fn, event.useCapture);
            },

            /**
             * Remove event.
             * @param  {Event} event
             * @return {void}
             */
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
                            return _event && _event.type == type && _event.fired;
                        });
                    } else if (events.data[type]) {
                        events = events.data[type];
                        if (event.fn) { // all matched fn's, eg: .off('x', fn)
                            eventsRemove = events.select(function(_event) {
                                return _event && _event.fnOrig == event.fnOrig;
                            });
                        } else { // all 'x' types, eg: .off('x')
                            eventsRemove = events;
                        }
                    }
                } else $.logWarn('No `%s` events found to fire.'.format(event.type));

                if (eventsRemove) {
                    events = target.Events;
                    eventsRemove.forEach(function(event) {
                        events.data[event.type].removeAt(event.i);
                        target.removeEventListener(event.type, event.fn, event.useCapture);
                    });

                    // think memory!
                    events.forEach(function(list, i) {
                        if (!list.size) {
                            events.replaceAt(i, NULL);
                        }
                    });
                }
            },

            /**
             * Dispatch.
             * @param  {Events} event
             * @return {void}
             */
            dispatch: function(event) {
                var target = checkTarget(this.target),
                    events = target.Events.get(event.type);
                if (events) {
                    events.forEach(function(event) {
                        event.fn(event.event);
                    });
                } else $.logWarn('No `%s` type events found to fire.'.format(event.type));
            }
        });

        // on, once, off, fire helper
        function prepareArgs(fn, options, target, once) {
            if ($.isObject(fn)) {
                options = fn, fn = options.fn;
            }
            return {fn: fn, options: $.extend(options, {target: target, once: !!once})};
        }

        /**
         * On, once, off, fire.
         * @param  {Object}   target
         * @param  {String}   type
         * @param  {Function} fn
         * @param  {Object}   options
         * @return {Event}
         */
        function on(target, type, fn, options, args /* @internal */) {
            args = prepareArgs(fn, options, target);
            return initEvent(type, args.fn, args.options).bind();
        }
        function once(target, type, fn, options, args /* @internal */) {
            args = prepareArgs(fn, options, target, TRUE);
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

        // shortcuts for element
        $.extend(Element.prototype, {
            on: function(type, fn, options) { return on(this, type, fn, options); },
            off: function(type, fn, options) { return off(this, type, fn, options); },
            once: function(type, fn, options) { return once(this, type, fn, options); },
            fire: function(type, fn, options) { return fire(this, type, fn, options); }
        });

        return {
            on: on,
            off: off,
            once: once,
            fire: fire,
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
