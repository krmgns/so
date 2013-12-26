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

Animation.prototype.animate = function(properties, duration, fn) {
    // Stop if running
    this.stop();

    this.fn          = fn;
    this.running     = true;
    this.stopped     = false;
    this.animations  = [];
    this.startTime   = $.now();
    this.elapsedTime = 0;
    this.duration    = typeof duration === "number" ? duration : opt_shortcutDurations[duration] || opt_defaultDuration;

    var that = this,
        property, startValue, stopValue, isScroll;

    // Add animations
    for (property in properties) {
        if (properties.hasOwnProperty(property)) {
            stopValue  = properties[property];
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
        var a, s, isBody,
            i = 0, current = 0,
            el = this.el, animations = this.animations;

        this.elapsedTime = $.now() - this.startTime;

        while (a = animations[i++]) {
            current = fn_ease(this.elapsedTime, 0.0, a.diff, this.duration);
            current = (a.reverse ? a.startValue - current : a.startValue + current);
            if (!a.isScroll) {
                // Using "toFixed" for max percent
                el.setStyle(a.property, current.toFixed(20));
            } else {
                isBody = el[0].tagName === "BODY" || el[0].tagName === "HTML";
                if (a.property === "scrollTop") {
                    (s = current + el[0].scrollTop) && (!isBody && (s /= 2));
                    el.scroll(s, el.scroll("left"));
                } else {
                    (s = current + el[0].scrollLeft) && (!isBody && (s /= 2));
                    el.scroll(el.scroll("top"), s);
                }
            }
        }
    },
    _end: function() {
        var a, i = 0, el = this.el, animations = this.animations;
        while (a = animations[i++]) {
            if (!a.isScroll) {
                el.setStyle(a.property, a.stopValue);
            } else {
                if (a.property === "scrollTop") {
                    el.scroll(a.stopValue, el.scroll("left"));
                } else {
                    el.scroll(el.scroll("top"), a.stopValue);
                }
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
$.animate = function(el, properties, duration, fn) {
    return (new Animation(el)).animate(properties, duration, fn);
};

// Define exposer
$.toString("animate", "mii.animate");

})(mii);
