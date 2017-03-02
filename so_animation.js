/**
 * @package so
 * @object  so.animation
 * @depends so, so.util
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $) { 'use strict';

    // minify candies
    var NULL = null, NULLS = '';
    var TRUE = true, FALSE = false;

    var re_root = /(?:html|body)/;
    var re_digit = /\d+/;
    var re_scroll = /scroll(?:Top|Left)/;
    var opt_fps = 1000 / 60;
    var opt_durations = {fast: 50, slow: 650, default: 350};
    // thanks: http://easings.net/ (easeOutQuad)
    var fn_easing = function(t,b,c,d) { return -c*(t/=d)*(t-2)+b; };
    var fn_runner = window.requestAnimationFrame || function(fn) { setTimeout(fn, opt_fps); };
    var now = $.now;
    var toFloat = $.float;
    var toStyleName = $.util.toCamelCaseFromDashCase;

    // shortcut
    function runner(fn) {
        fn_runner(fn);
    }

    /**
     * Animation.
     * @param {Element}            target
     * @param {Object}             properties
     * @param {Int}                duration
     * @param {String|undefined}   easing
     * @param {Function|undefined} onEnd
     */
    function Animation(target, properties, duration, easing, onEnd) {
        var _this = this;

        _this.target = $.dom(target);
        _this.properties = properties;
        _this.duration = $.isNumber(duration)
            ? duration : opt_durations[duration] || opt_durations.default;

        // swap
        if ($.isFunction(easing)) {
            onEnd = easing, easing = NULL;
        }

        _this.easing = (easing && $.ext && $.ext.easing && $.ext.easing[easing]) || fn_easing;
        _this.onEnd = onEnd;

        _this.running = FALSE;
        _this.stopped = FALSE;
        _this.ended = FALSE;
        _this.startTime = 0;
        _this.elapsedTime = 0;

        _this.tasks = [];

        if (_this.target.size) {
            // for stop tool
            _this.target.me.$animation = _this;

            // assign animation tasks
            $.forEach(properties, function(name, value) {
                var root, scroll, startValue, endValue, style, unit = NULLS;
                name = toStyleName(name);
                root = re_root.test(_this.target.tag());
                scroll = re_scroll.test(name);

                if (!scroll) {
                    style = $.isString(value)
                        ? _this.target.getCssStyle(name) // get original style to catch unit sign
                        : _this.target.getComputedStyle(name);

                    startValue = toFloat(style);
                    endValue = toFloat(value);

                    if ($.dom.isUnitStyle(name)) {
                        unit = style.replace(re_digit, NULLS);
                    }
                } else {
                    startValue = _this.target.scroll()[name.slice(6).toLowerCase()];
                    endValue = value;
                }

                _this.tasks.push({
                    name: name,
                    root: root,
                    scroll: scroll,
                    startValue: startValue,
                    endValue: endValue,
                    reverse: startValue > endValue,
                    diff: Math.abs(endValue - startValue),
                    unit: unit
                });
            });
        }
    }

    /**
     * Animation prototype.
     */
    Animation.extendPrototype({
        /**
         * Run.
         * @return {this}
         */
        run: function() {
            var _this = this;

            _this.stop(); // stop if running
            _this.running = TRUE;
            _this.startTime = now();

            ;(function run() {
                if (!_this.stopped && !_this.ended) {
                    if (_this.elapsedTime < _this.duration) {
                        runner(run)
                        _this.start();
                    } else {
                        _this.end();
                        _this.stop();
                    }
                }
            })();

            return _this;
        },

        /**
         * Start.
         * @return {this}
         */
        start: function() {
            var _this = this;
            var target = _this.target
            var scroll, value;

            if (target.size) {
                _this.elapsedTime = now() - _this.startTime;

                _this.tasks.forEach(function(task) {
                    value = fn_easing(_this.elapsedTime, 0.00, task.diff, _this.duration);
                    value = task.reverse ? task.startValue - value : task.startValue + value;
                    if (!task.scroll) {
                        target.setStyle(task.name, value.toFixed(20) /* use 'toFixed' to get max percent */
                            + task.unit);
                    } else {
                        target.setProperty(task.name, value.toFixed(0));
                    }
                });
            }

            return _this;
        },

        /**
         * Stop.
         * @return {this}
         */
        stop: function() {
            var _this = this;

            if (_this.running) {
                _this.running = FALSE;
                _this.stopped = TRUE;
            }

            // set as null (for isAnimated() etc.)
            _this.target.me && (_this.target.me.$animation = NULL);

            return _this;
        },

        /**
         * End.
         * @return {this}
         */
        end: function() {
            var _this = this;
            var target = _this.target;

            if (target.size) {
                _this.tasks.forEach(function(task) {
                    if (!task.scroll) {
                        target.setStyle(task.name, task.endValue + task.unit);
                    } else {
                        target.setProperty(task.name, task.endValue);
                    }
                });
            }

            _this.ended = TRUE;

            if ($.isFunction(_this.onEnd)) {
                _this.onEnd(_this);
            }

            return _this;
        }
    });

    // shortcut
    function initAnimation(target, properties, duration, easing, onEnd) {
        return new Animation(target, properties, duration, easing, onEnd);
    }

    // return animation object
    $.animation = {
        animate: function(target, properties, duration, easing, onEnd) {
            return initAnimation(target, properties, duration, easing, onEnd).run();
        },
        Animation: initAnimation
    };

})(window, so);
