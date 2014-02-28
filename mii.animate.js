/**
 * @name: mii.animate
 * @deps: mii, mii.ext, mii.dom
 */

;(function($) {

"use strict"; // @tmp

var opt_fps = 60,
    opt_defaultDuration = 350,
    opt_shortcutDurations = {fast: 150, slow: 750},
    // Credits: http://easings.net/ (easeOutQuad)
    fn_ease = function(t,b,c,d) {return -c*(t/=d)*(t-2)+b}
;

function timer(fn) {
    setTimeout(fn, 1000 / opt_fps);
}

/*** The Animation ***/
function Animation(el, properties) {
    this.el = $.dom(el);
    this.running = false
    this.stopped = false;
    this.animations = [];

    var property, startValue, stopValue, isScroll;
    // Add properties
    for (property in properties) {
        if (properties.hasOwnProperty(property)) {
            stopValue  = properties[property];
            property   = $.ext.camelizeStyleProperty(property);
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
}

Animation.prototype.animate = function(duration, onEnd) {
    // Stop if running
    var animation = this.el[0].$animation;
    if (animation && animation.running) {
        animation.stop();
    }

    this.duration = typeof duration === "number" ? duration : opt_shortcutDurations[duration] || opt_defaultDuration;
    this.onEnd = onEnd;

    this.running = true;
    this.stopped = false;
    this.startTime = $.now();
    this.elapsedTime = 0;

    // For stop tool
    this.el[0].$animation = this;

    var _this = this;
    // Run animation
    ;(function run() {
        if (!_this.stopped) {
            if (_this.elapsedTime < _this.duration) {
                timer(run);
                _this._start();
            } else {
                // Finito!
                _this._end();
                _this.stop();
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
        if (typeof this.onEnd === "function") {
            this.onEnd.call(this, this.el, this);
        }
    },
    stop: function() {
        if (this.running) {
            this.running = false;
            this.stopped = true;
        }
        // Remove animation [No delete, can be used for `is(":animated")` like function]
        this.el[0].$animation = null;

        return this;
    }
});

// Add `animate` to mii
$.animate = function(el, properties, duration, onEnd) {
    return (new Animation(el, properties)).animate(duration, onEnd);
};

// Define exposer
$.toString("animate", "mii.animate");

})(mii);
