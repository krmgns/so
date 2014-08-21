/**
 * @name: mii.ext.windowScroll
 * @deps: mii
 */

;(function($){

// For now, it is only scroll to 'Y' direction...

"use strict"; // @tmp

var opt_fps = 60,
    opt_defaultDuration = 350,
    opt_shortcutDurations = {fast: 150, slow: 750},
    fn_ease = function(t,b,c,d) {return -c*(t/=d)*(t-2)+b}
;

function timer(fn) {
    setTimeout(fn, 1000 / opt_fps);
}

var WindowScroll = function(window) {
    this.window  = window || $.win();
    this.running = false
    this.stopped = false;
};

WindowScroll.prototype.run = function(to, duration, fn) {
    this.stop();

    this.fn          = fn;
    this.duration    = typeof duration === "number" ? duration : opt_shortcutDurations[duration] || opt_defaultDuration;
    this.running     = true;
    this.stopped     = false;
    this.startTime   = $.now();
    this.elapsedTime = 0;

    this.stopValue  = to;
    this.startValue = this.window.pageYOffset || this.window.document.documentElement.scrollTop || 0;
    this.reverse    = this.startValue > this.stopValue;
    this.diff       = Math.abs(this.stopValue - this.startValue);

    var _this = this;
    // Run animation
    ;(function run() {
        if (!_this.stopped) {
            if (_this.elapsedTime < _this.duration) {
                timer(run);
                _this._start();
            } else {
                _this._end(); // Finito!
            }
        }
    })();

    return this;
};

$.extend(WindowScroll.prototype, {
    _start: function() {
        var current;
        this.elapsedTime = $.now() - this.startTime;
        current = fn_ease(this.elapsedTime, 0.0, this.diff, this.duration);
        current = (this.reverse ? this.startValue - current : this.startValue + current);
        this.window.scrollTo(0, current);
    },
    _end: function() {
        this.window.scrollTo(0, this.stopValue);
        // Call `onend` handler
        if (typeof this.fn === "function") {
            this.fn.call(this, this.el, this);
        }
        this.stopped = true;
    },
    stop: function() {
        if (this.running) {
            this.stopped = true;
        }
        return this;
    }
});

// Add `WindowScroll` to mii
$.ext.windowScroll = function(window, to, duration, fn) {
    return (new WindowScroll(window)).run(to, duration, fn);
}

})(mii);
