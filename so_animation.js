/**
 * @package so
 * @object  so.animation
 * @depends so, so.util, so.dom
 * @author  Kerem Güneş
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function ($, NULL, TRUE, FALSE) { 'use strict';

    var $win = $.win();
    var $toStyleName = $.util.toStyleName;
    var $easing = ($.ext && $.ext.easing) || {};
    var $extend = $.extend, $for = $.for, $forEach = $.forEach, $float = $.float, $now = $.now,
        $isNumber = $.isNumber, $isString = $.isString, $isFunction = $.isFunction;

    var re_digit = /^[\d.]+/;
    var re_scroll = /scroll(?:Top|Left)/;
    var re_nonUnitStyles = /(?:(?:fill-?)?opacity|z(?:oom|index)|(?:font-?w|line-?h)eight|column(?:-?count|s))/i;

    var opt_fps = 1000 / 60;
    var opt_speeds = {fast: 50, slow: 650, ease: 255, normal: 150, default: 325};

    // thanks: http://easings.net/ (easeOutQuad)
    var fn_easing = function (t,b,c,d) { return -c*(t/=d)*(t-2)+b; };
    var fn_runner = $win.requestAnimationFrame || function (fn) { $win.setTimeout(fn, opt_fps); };

    /**
     * Animation.
     * @param {Element}         el
     * @param {Object}          properties
     * @param {Int|Function}    speed?
     * @param {String|Function} easing?
     * @param {Function}        callback?
     */
    function Animation(el, properties, speed, easing, callback) {
        var _this = this; // just as minify candy
        _this.$dom = $(el);
        _this.properties = properties;

        // swap arguments
        if ($isFunction(speed)) {
            callback = speed, speed = NULL;
        } else if ($isFunction(easing)) {
            callback = easing, easing = NULL;
        }

        _this.speed = $isNumber(speed) ? speed : opt_speeds[speed] || opt_speeds.default;
        _this.easing = easing ? $easing[easing] || fn_easing : NULL;
        _this.callback = callback ? function () { callback(_this) } : NULL;

        _this.running = _this.stopped = _this.ended = FALSE;
        _this.startTime = _this.elapsedTime = 0;

        _this.tasks = [];

        if (_this.$dom.len()) {
            // for stop tool
            _this.$dom.set('$animation', _this);

            // assign animation tasks
            $forEach(properties, function (name, value) {
                var scroll, startValue, endValue, diff, style, unit = '';

                name = $toStyleName(name);
                scroll = re_scroll.test(name);

                if (!scroll) {
                    style = $isString(value)
                        ? _this.$dom.getCssStyles(name)[name] // get original style to catch unit sign
                        : _this.$dom.getComputedStyles(name)[name];

                    startValue = $float(style);
                    endValue = $float(value);

                    if (!re_nonUnitStyles.test(name)) {
                        unit = style.remove(re_digit);
                    }
                } else {
                    startValue = _this.$dom.scroll()[name.slice(6).lower()];
                    endValue = value;
                }

                diff = Math.abs(endValue - startValue);

                // no need to get excited
                if (!diff) return;

                _this.tasks.push({
                    name: name,
                    scroll: scroll,
                    startValue: startValue,
                    endValue: endValue,
                    reverse: startValue > endValue,
                    diff: diff,
                    unit: unit
                });
            });
        }
    }

    $extend(Animation.prototype, {
        /**
         * Run.
         * @return {this}
         */
        run: function () {
            var _this = this;

            _this.stop(); // stop if running
            _this.running = TRUE;
            _this.startTime = $now();

            !function run() {
                if (!_this.$dom.len()) {
                    // no element(s) to animate
                    return (_this.running = FALSE, _this.stopped = _this.ended = TRUE);
                }

                if (!_this.stopped && !_this.ended) {
                    if (_this.elapsedTime < _this.speed) {
                        fn_runner(run);
                        _this.start();
                    } else {
                        _this.end();
                        _this.stop();
                    }
                }
            }();

            return _this;
        },

        /**
         * Start.
         * @return {this}
         */
        start: function () {
            var _this = this, $dom = _this.$dom, scroll, value;

            _this.elapsedTime = $now() - _this.startTime;

            $for(_this.tasks, function (task) {
                value = fn_easing(_this.elapsedTime, 0.00, task.diff, _this.speed);
                value = task.reverse ? task.startValue - value : task.startValue + value;
                if (!task.scroll) {
                    $dom.setStyle(task.name, value.toFixed(9) /* use 'toFixed' for a good percent */
                        + task.unit);
                } else {
                    $dom.set(task.name, value.toFixed(0));
                }
            });

            return _this;
        },

        /**
         * End.
         * @return {this}
         */
        end: function () {
            var _this = this, $dom = _this.$dom;

            $for(_this.tasks, function (task) {
                if (!task.scroll) {
                    $dom.setStyle(task.name, task.endValue + task.unit);
                } else {
                    $dom.set(task.name, task.endValue);
                }
            });

            _this.ended = TRUE;

            if ($isFunction(_this.callback)) {
                _this.callback(_this);
            }

            return _this;
        },

        /**
         * Stop.
         * @return {this}
         */
        stop: function () {
            var _this = this, $dom = _this.$dom;

            if (_this.running) {
                _this.running = FALSE, _this.stopped = TRUE;
            }

            // set as null (for stop, animated() etc.)
            $dom.set('$animation', NULL);

            return _this;
        }
    });

    // shortcut
    function initAnimation(el, properties, speed, easing, callback) {
        return new Animation(el, properties, speed, easing, callback);
    }

    // add animation to so
    $.animation = {
        Animation: initAnimation,
        animate: function (el, properties, speed, easing, callback) {
            return initAnimation(el, properties, speed, easing, callback).run();
        }
    };

})(window.so, null, true, false);
