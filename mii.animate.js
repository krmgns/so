;(function($) {

"use strict"; // @tmp

var defaultDuration = 350,
    shortcutDurations = {fast: 150, slow: 750},
    fps = 60,
    ease = function(t,b,c,d) {return -c*(t/=d)*(t-2)+b},
    nonuniteStyles = {
        "opacity"    : 1, "zoom"      : 1, "zIndex"     : 1,
        "columnCount": 1, "columns"   : 1, "fillOpacity": 1,
        "fontWeight" : 1, "lineHeight": 1
    },
    oldIE = $.browser.ie && $.browser.version < 9,
    requestAnimationFrame = window.requestAnimationFrame
;

if (!requestAnimationFrame) {
    requestAnimationFrame = (function() {
        return window.webkitRequestAnimationFrame ||
               window.mozRequestAnimationFrame ||
               window.oRequestAnimationFrame ||
               window.msRequestAnimationFrame ||
               function(fn, element) {
                   window.setTimeout(fn, 1000 / fps);
               };
    })();
}

function setOpacity(el, opacity) {
    el.style.opacity = opacity;
    if (oldIE) {
        el.style.filter = "alpha(opacity="+ (100 * opacity) +")";
        el.style.zoom = 1;
    }
}

/*** The Animation ***/
function Animation(el) {
    this.el = el;
    this.running = false
    this.stopped = false;
}

Animation.prototype.animate = function(options, duration, fn) {
    this.stop();
    this.running = true;
    this.stopped = false;
    this.options = options;
    this.duration = (duration !== "" && !isNaN(duration)) ? duration : shortcutDurations[duration] || defaultDuration;
    this.fix = (this.duration / 10) * 0.01 * 2;
    this.animations = [];
    this.startTime = $.now();
    this.elapsedTime = 0;
    this.fn = fn;

    var that = this,
        key, startValue, endValue;

    // Add animations
    for (key in this.options) {
        if (this.options.hasOwnProperty(key)) {
            startValue = parseFloat($.dom(this.el).getStyle(key)) || 0;
            endValue = this.options[key];
            this.animations.push({
                styleProp: key,
                startValue: startValue,
                endValue: endValue,
                diff: Math.abs(endValue - startValue),
                reverse: startValue > endValue
            });
        }
    }

    // Run animation
    (function run() {
        if (!that.stopped) {
            if (that.elapsedTime < that.duration) {
                requestAnimationFrame(run);
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
        var a, i = 0, animations = this.animations, current = 0;
        this.elapsedTime = $.now() - this.startTime;
        while (a = animations[i++]) {
            // Already runned, just used for `onend` handler
            if (a.styleProp == "opacity") {
                this._fade(a.startValue, a.endValue, a.reverse);
                continue;
            }
            current = Math.round(ease(this.elapsedTime, 0, a.diff, this.duration));
            current = (a.reverse ? a.startValue - current : a.startValue + current);
            this.el.style[a.styleProp] = current + (nonuniteStyles[a.styleProp] ? "" : "px");
        }
    },
    _end: function() {
        var a, i = 0, animations = this.animations;
        while (a = animations[i++]) {
            // Already runned, just used for `onend` handler
            if (a.styleProp == "opacity") {
                this.el.style.opacity = a.endValue;
                this.el.style.opacityValue = null; // Clear mem?
                continue;
            }
            this.el.style[a.styleProp] = a.endValue + (nonuniteStyles[a.styleProp] ? "" : "px");
        }
        // Call `onend` handler
        if (typeof this.fn === "function") {
            this.fn.call(this, this.el, this);
        }
        this.stopped = true;
    },
    _fade: function(from, to, reverse) {
        var el = this.el, style = el.style;

        // Set start value
        if (style.opacityValue == null) {
            style.opacityValue = from;
        }

        if (reverse) {
            // Decrease opacity
            if (style.opacityValue <= to) {
                style.opacityValue = to;
                setOpacity(el, to);
                return;
            }
            style.opacityValue -= ((this.elapsedTime / this.fix) / this.duration) * 0.1;
        } else {
            // Increase opacity
            if (style.opacityValue >= to) {
                style.opacityValue = to;
                setOpacity(el, to);
                return;
            }
            style.opacityValue += ((this.elapsedTime / this.fix) / this.duration) * 0.1;
        }

        // Set opacity
        setOpacity(el, style.opacityValue);
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
    return new Animation(el).animate(options, duration, fn);
};

// Define exposer
$.toString("animate", "mii.animate");

})(mii);
