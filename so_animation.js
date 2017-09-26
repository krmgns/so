/**
 * @package so
 * @object  so.animation
 * @depends so, so.util
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function($) { 'use strict';

    var re_root = /(?:html|body)/;
    var re_digit = /\d+/;
    var re_scroll = /scroll(?:Top|Left)/;
    var re_noneUnitStyles = /(?:(?:fill-?)?opacity|z(?:oom|index)|(?:font-?w|line-?h)eight|column(?:-?count|s))/i;
    var opt_fps = 1000 / 60;
    var opt_speeds = {fast: 50, slow: 650, default: 350};
    // thanks: http://easings.net/ (easeOutQuad)
    var fn_easing = function(t,b,c,d) { return -c*(t/=d)*(t-2)+b; };
    var fn_runner = window.requestAnimationFrame || function(fn) { setTimeout(fn, opt_fps); };
    var toStyleName = $.util.toCamelCaseFromDashCase;

    // shortcut
    function runner(fn) {
        fn_runner(fn);
    }

    /**
     * Animation.
     * @param {Element}  target
     * @param {Object}   properties
     * @param {Int}      speed?
     * @param {String}   easing?
     * @param {Function} callback?
     */
    function Animation(target, properties, speed, easing, callback) {
        this.$target = $.dom(target);
        this.properties = properties;
        this.speed = $.isNumber(speed) ? speed : opt_speeds[speed] || opt_speeds.default;

        // swap
        if ($.isFunction(easing)) {
            callback = easing, easing = null;
        }

        this.easing = (easing && $.ext && $.ext.easing && $.ext.easing[easing]) || fn_easing;
        this.callback = callback;

        this.running = false;
        this.stopped = false;
        this.ended = false;
        this.startTime = 0;
        this.elapsedTime = 0;

        this.tasks = [];

        if (this.$target._size) {
            // for stop tool
            this.$target.setProperty('$animation', this);

            // assign animation tasks
            var _this = this;
            $.forEach(properties, function(name, value) {
                var root, scroll, startValue, endValue, style, unit = '';
                name = toStyleName(name);
                root = re_root.test(_this.$target.tag());
                scroll = re_scroll.test(name);

                if (!scroll) {
                    style = $.isString(value)
                        ? _this.$target.getCssStyle(name) // get original style to catch unit sign
                        : _this.$target.getComputedStyle(name);

                    startValue = $.float(style);
                    endValue = $.float(value);

                    if (!re_noneUnitStyles.test(name)) {
                        unit = style.replace(re_digit, '');
                    }
                } else {
                    startValue = _this.$target.scroll()[name.slice(6).toLowerCase()];
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
            this.stop(); // stop if running
            this.running = true;
            this.startTime = $.now();

            var _this = this;
            !function run() {
                if (!_this.stopped && !_this.ended) {
                    if (_this.elapsedTime < _this.speed) {
                        runner(run)
                        _this.start();
                    } else {
                        _this.end();
                        _this.stop();
                    }
                }
            }();

            return this;
        },

        /**
         * Start.
         * @return {this}
         */
        start: function() {
            var target = this.$target, scroll, value;

            if (target._size) {
                this.elapsedTime = $.now() - this.startTime;

                var _this = this;
                this.tasks.forEach(function(task) {
                    value = fn_easing(_this.elapsedTime, 0.00, task.diff, _this.speed);
                    value = task.reverse ? task.startValue - value : task.startValue + value;
                    if (!task.scroll) {
                        target.setStyle(task.name, value.toFixed(9) /* use 'toFixed' to get a good percent */
                            + task.unit);
                    } else {
                        target.setProperty(task.name, value.toFixed(0));
                    }
                });
            }

            return this;
        },

        /**
         * Stop.
         * @return {this}
         */
        stop: function() {
            var target = this.$target;

            if (this.running) {
                this.running = false;
                this.stopped = true;
            }

            // set as null (for isAnimated() etc.)
            target.setProperty('$animation', null);

            return this;
        },

        /**
         * End.
         * @return {this}
         */
        end: function() {
            var target = this.$target;

            if (target._size) {
                this.tasks.forEach(function(task) {
                    if (!task.scroll) {
                        target.setStyle(task.name, task.endValue + task.unit);
                    } else {
                        target.setProperty(task.name, task.endValue);
                    }
                });
            }

            this.ended = true;

            if ($.isFunction(this.callback)) {
                this.callback(this);
            }

            return this;
        }
    });

    // shortcut
    function initAnimation(target, properties, speed, easing, callback) {
        return new Animation(target, properties, speed, easing, callback);
    }

    // add animation to so
    $.animation = {
        Animation: initAnimation,
        animate: function(target, properties, speed, easing, callback) {
            return initAnimation(target, properties, speed, easing, callback).run();
        }
    };

})(window.so);
