;(function(window, $) { 'use strict';

    var opt_fps = 1000 / 60;
    var opt_durations = {fast: 50, slow: 650, default: 350};
    var re_root = /(?:html|body)/i;
    var re_scroll = /scroll(?:Top|Left)/i;
    var toStyleName = $.util.toCamelCaseFromDashCase;
    // thanks: http://easings.net/ (easeOutQuad)
    var fn_easing = function(t,b,c,d) { return -c*(t/=d)*(t-2)+b; };
    var fn_runner = window.requestAnimationFrame || function(fn) { setTimeout(fn, opt_fps); };

    function runner(fn) {
        fn_runner(fn);
    }

    function Animation(target, properties, duration, easing, onEnd) {
        var _this = this;

        this.target = $.dom(target);
        this.properties = properties;
        this.duration = $.isNumber(duration)
            ? duration : opt_durations[duration] || opt_durations.default;

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
        $.forEach(properties, function(name, value) {
                var scroll, startValue, endValue;
                name = toStyleName(name);
                scroll = re_scroll.test(name);
                startValue = !scroll ? _this.target.getStyle(name)
                    : _this.target.scroll()[name.slice().toLowerCase()];
                endValue = value;

                _this.tasks.push({
                    property: name,
                    startValue: startValue,
                    endValue: endValue,
                    diff: Math.abs(endValue - startValue),
                    reverse: startValue > endValue,
                    scroll: scroll
                });
        });

        // for stop tool
        this.target.me.$animation = this;
    }

    Animation.extendPrototype({
        run: function() {
            this.stop(); // stop if running

            this.running = true;
            this.startTime = $.now();

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
        start: function() {
            var target = this.target
            var root = re_root.test(target.me.tagName);
            var scroll, current;

            this.elapsedTime = $.now() - this.startTime;

            var _this = this;
            this.tasks.forEach(function(task) {
                current = fn_easing(_this.elapsedTime, 0.00, task.diff, _this.duration);
                current = task.reverse ? task.startValue - current : task.startValue + current;
                if (!task.scroll) {
                    target.setStyle(task.property, current.toFixed(20)); // use 'toFixed' to get max percent
                } else {
                    target.setProperty(task.property, root ? current + target.me[task.property]
                        : current + (target.me[task.property] /= 2));
                }
            });
        },
        stop: function() {
            if (this.running) {
                this.running = false;
                this.stopped = true;
            }
            this.target.me.$animation = null; // remove animation

            return this;
        },
        end: function() {
            var target = this.target;

            this.ended = true;

            this.tasks.forEach(function(task) {
                if (!task.scroll) {
                    target.setStyle(task.property, task.endValue);
                } else {
                    target.setProperty(task.property, task.endValue);
                }
            });

            $.isFunction(this.onEnd) && this.onEnd(this);
        }
    });

    function initAnimation(target, properties, duration, easing, onEnd) {
        return new Animation(target, properties, duration, easing, onEnd);
    }

    $.animation = {
        animate: function(target, properties, duration, easing, onEnd) {
            return initAnimation(target, properties, duration, easing, onEnd).run();
        },
        Animation: initAnimation
    };

})(window, so);
