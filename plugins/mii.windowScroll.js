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

function windowScroll(window) {
    this.window  = window || $.win();
    this.running = false
    this.stopped = false;
}

windowScroll.prototype.run = function(to, duration, fn) {
    this.stop();

    this.fn          = fn;
    this.duration    = typeof duration === "number" ? duration : opt_shortcutDurations[duration] || opt_defaultDuration;
    this.running     = true;
    this.stopped     = false;
    this.startTime   = $.now();
    this.elapsedTime = 0;

    this.stopValue  = to;
    this.startValue = this.window.scrollY || 0;
    this.reverse    = this.startValue > this.stopValue;
    this.diff       = Math.abs(this.stopValue - this.startValue);

    var that = this;
    // Run animation
    ;(function run() {
        if (!that.stopped) {
            if (that.elapsedTime < that.duration) {
                timer(run);
                that._start();
            } else {
                that._end(); // Finito!
            }
        }
    })();

    return this;
};

$.extend(windowScroll.prototype, {
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

// Add `windowScroll` to mii
$.windowScroll = function(window, to, duration, fn) {
    return (new windowScroll(window)).run(to, duration, fn);
}

})(mii);