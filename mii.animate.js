;(function($) {

"use strict"; // @tmp

var op_fps = 60,
    opt_defaultDuration = 350,
    opt_shortcutDurations = {fast: 150, slow: 750},
    fn_ease = function(t,b,c,d) {return -c*(t/=d)*(t-2)+b}
;

function timer(fn) {
    setTimeout(fn, 1000 / op_fps);
}

/*** The Animation ***/
function Animation(el) {
    this.el      = $.dom(el);
    this.running = false
    this.stopped = false;
}

Animation.prototype.animate = function(options, duration, fn) {
    this.stop();
    this.running = true;
    this.stopped = false;
    this.options = options;
    this.duration = (duration !== "" && !isNaN(duration)) ? duration : opt_shortcutDurations[duration] || opt_defaultDuration;
    this.opacityFixer = (this.duration / 10) * 0.01 * 2;
    this.animations = [];
    this.startTime = $.now();
    this.elapsedTime = 0;
    this.fn = fn;

    var that = this,
        property, startValue, stopValue, isScroll = false;

    // Add animations
    for (property in this.options) {
        if (this.options.hasOwnProperty(property)) {
            stopValue  = this.options[property];
            property   = $.ext.toCamelCase(property);
            isScroll   = property === "scrollTop" || property === "scrollLeft";
            startValue = isScroll
                ? parseFloat(this.el.scroll(property.substring(6).toLowerCase()))
                : parseFloat(this.el.getStyle(property)) || 0;

            this.animations.push({
                property: property,
                stopValue: stopValue,
                startValue: startValue,
                diff: Math.abs(stopValue - startValue),
                reverse: startValue > stopValue,
                isScroll: isScroll
            });
        }
    }

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

$.extend(Animation.prototype, {
    _start: function() {
        var a, i = 0, el = this.el, animations = this.animations, current = 0;
        this.elapsedTime = $.now() - this.startTime;
        while (a = animations[i++]) {
            current = fn_ease(this.elapsedTime, 0.0, a.diff, this.duration);
            current = (a.reverse ? a.startValue - current : a.startValue + current);
            if (a.isScroll) {
                a.property === "scrollTop" && el.scroll(current + el[0].scrollTop, el.scroll("left"));
                a.property === "scrollLeft" && el.scroll(el.scroll("top"), current + el[0].scrollLeft);
            } else {
                el.setStyle(a.property, current);
            }
        }
    },
    _end: function() {
        var a, i = 0, el = this.el, animations = this.animations;
        while (a = animations[i++]) {
            if (a.isScroll) {
                a.property === "scrollTop" && el.scroll(a.stopValue, el.scroll("left"));
                a.property === "scrollLeft" && el.scroll(el.scroll("top"), a.stopValue);
            } else {
               el.setStyle(a.property, a.stopValue);
            }
        }
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

// Add `animate` to mii
$.animate = function(el, options, duration, fn) {
    return (new Animation(el)).animate(options, duration, fn);
};

// Define exposer
$.toString("animate", "mii.animate");

})(mii);
