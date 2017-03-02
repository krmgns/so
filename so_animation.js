/**
 * @package so
 * @object  so.animation
 * @depends so, so.util
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $) { 'use strict';

    var re_root = /(?:html|body)/;
    var re_digit = /\d+/;
    var re_scroll = /scroll(?:Top|Left)/;
    var opt_fps = 1000 / 60;
    var opt_durations = {fast: 50, slow: 650, default: 350};
    // thanks: http://easings.net/ (easeOutQuad)
    var fn_easing = function(t,b,c,d) { return -c*(t/=d)*(t-2)+b; };
    var fn_runner = window.requestAnimationFrame || function(fn) { setTimeout(fn, opt_fps); };
    var now = $.now;
    var toStyleName = $.util.toCamelCaseFromDashCase;
    var toFloat = function(input) { return parseFloat(input) || 0; };

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

        this.target = $.dom(target);
        this.properties = properties;
        this.duration = $.isNumber(duration)
            ? duration : opt_durations[duration] || opt_durations.default;

        // swap
        if ($.isFunction(easing)) {
            onEnd = easing, easing = null;
        }

        this.easing = (easing && $.ext && $.ext.easing && $.ext.easing[easing]) || fn_easing;
        this.onEnd = onEnd;

        this.running = false
        this.stopped = false;
        this.ended = false;
        this.startTime = 0;
        this.elapsedTime = 0;

        this.tasks = [];

        // assign animation tasks
        $.forEach(properties, function(name, value) {
            var root, scroll, unit, startValue, endValue, style, styleUnit;
            name = toStyleName(name);
            root = re_root.test(_this.target.tag());
            scroll = re_scroll.test(name);

            if (!scroll) {
                style = $.isString(value)
                    ? _this.target.getCssStyle(name)
                    : _this.target.getStyle(name, false);
                unit = style.replace(re_digit, '');
                startValue = toFloat(style);
                endValue = toFloat(value);
            } else {
                startValue = _this.target.scroll()[name.slice().toLowerCase()];
                endValue = value;
            }

            _this.tasks.push({
                name: name,
                root: root,
                scroll: scroll,
                unit: unit,
                startValue: startValue,
                endValue: endValue,
                reverse: startValue > endValue,
                diff: Math.abs(endValue - startValue)
            });
        });

        // for stop tool
        this.target.me.$animation = this;
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
            this.stop(); // stop if running

            this.running = true;
            this.startTime = now();

            var _this = this;
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

            return this;
        },

        /**
         * Start.
         * @return {this}
         */
        start: function() {
            var target = this.target
            var scroll, current;

            this.elapsedTime = now() - this.startTime;

            var _this = this;
            this.tasks.forEach(function(task) {
                current = fn_easing(_this.elapsedTime, 0.00, task.diff, _this.duration);
                current = task.reverse ? task.startValue - current : task.startValue + current;
                if (!task.scroll) {
                    // use 'toFixed' to get max percent
                    target.setStyle(task.name, current.toFixed(20) + task.unit);
                } else {
                    target.setProperty(task.name, task.root ? current + target.me[task.name]
                        : current + (target.me[task.name] /= 2));
                }
            });
        },

        /**
         * Stop.
         * @return {this}
         */
        stop: function() {
            this.target.me.$animation = null; // remove animation

            if (this.running) {
                this.running = false;
                this.stopped = true;
            }

            return this;
        },

        /**
         * End.
         * @return {this}
         */
        end: function() {
            var target = this.target;

            this.tasks.forEach(function(task) {
                if (!task.scroll) {
                    target.setStyle(task.name, task.endValue + task.unit);
                } else {
                    target.setProperty(task.name, task.endValue);
                }
            });

            this.ended = true;

            if ($.isFunction(this.onEnd)) {
                this.onEnd(this);
            }

            return this;
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
