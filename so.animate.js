/**
 * @name: so.animate
 * @deps: so, so.ext, so.dom
 */

;(function($) {

"use strict"; // @tmp

var opt_fps = 60,
    opt_durations = {fast: 50, default: 350, slow: 650},
    // credits: http://easings.net/ (easeOutQuad)
    fn_easing = function(t,b,c,d) {return -c*(t/=d)*(t-2)+b},
    fn_toStyleProperty = $.ext.camelizeStyleProperty
;

function timer(fn) {
    setTimeout(fn, 1000 / opt_fps);
}

/*** the animation ***/
function Animation(el, properties, duration, callback) {
    this.$el = $.dom(el);
    this.callback = callback;
    this.duration = (typeof duration === "number")
        ? duration : opt_durations[duration] || opt_durations.default;

    this.running = false
    this.stopped = false;

    this.animations = [];
    var property, startValue, stopValue, isScroll;
    // add properties
    for (property in properties) {
        if (properties.hasOwnProperty(property)) {
            stopValue  = properties[property];
            property   = fn_toStyleProperty(property);
            isScroll   = (property === "scrollTop" || property === "scrollLeft");
            startValue = !isScroll
                ? parseFloat(this.$el.getStyle(property)) || 0
                : parseFloat(this.$el.scroll(property.substring(6).toLowerCase()));

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

Animation.prototype.animate = function(easing) {
    // stop if running
    this.stop();

    this.easing = ($.ext.easing && $.ext.easing[easing]) || fn_easing;

    this.running = true;
    this.stopped = false;
    this.startTime = $.now();
    this.elapsedTime = 0;

    // for stop tool
    this.$el[0].$animation = this;

    var _this = this;

    // run animation
    ;(function run() {
        if (!_this.stopped) {
            if (_this.elapsedTime < _this.duration) {
                timer(run);
                _this._start();
            } else {
                // finito!
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
            el = this.$el, animations = this.animations;

        this.elapsedTime = $.now() - this.startTime;

        while (a = animations[i++]) {
            current = this.easing(this.elapsedTime, 0.0, a.diff, this.duration);
            current = a.reverse ? (a.startValue - current) : (a.startValue + current);
            if (!a.isScroll) {
                // use `toFixed` to get max percent
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
        var a, i = 0, el = this.$el, animations = this.animations;
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

        // call `callback` handler
        if (typeof this.callback === "function") {
            this.callback(this.$el[0], this);
        }
    },
    stop: function() {
        if (this.running) {
            this.running = false;
            this.stopped = true;
        }

        // remove animation
        this.$el[0].$animation = null;

        return this;
    }
});

// add `animate` to so
$.animate = function(el, properties, duration, callback, easing) {
    // swap args
    if (typeof callback === "string") {
        easing = callback;
    }
    return (new Animation(el, properties, duration, callback)).animate(easing);
};

// define exposer
$.toString("animate");

})(so);
