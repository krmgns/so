/**
 * @name: so.ext.slide
 * @deps: so, so.dom, so.animate
 * @vers: 1.0.1
 */

;(function($){

// default options
var optionsDefault = {
    speed: 350,
    easing: "",
    // easing: "ease-out-back",
    noPrev: "reset",
    noNext: "reset",
    visibleBoxes: 1,
};

function Slide(options) {
    this.box = $.dom(options.box);
    this.boxWidth = this.box.outerWidth(true);

    this.boxlay = $.dom(options.boxlay);
    this.boxlayWidth = this.box.length * this.boxWidth;

    // set layer width
    this.boxlay.setStyle({
        "position": "relative",
        "width"   : this.boxlayWidth
    });

    // set animating as false
    this.animating = false;

    // set options
    if (options) {
        this.options = $.mix({}, optionsDefault, options);
    }
}

$.extend(Slide.prototype, {
    prev: function(){
        if (this.animating || this.box.length < 2) {
            return;
        }

        var left = parseFloat(this.boxlay.getStyle("left")) || 0;
        if (Math.abs(left) <= 0) {
            var act = this.options.noPrev;
            if (act == "return") {
                return;
            }
            if (act == "reset") {
                left = -(this.boxlayWidth - (this.boxWidth * this.options.visibleBoxes));
            }
        } else {
            left = left + (this.boxWidth * this.options.visibleBoxes);
            if (left >= 0) {
                left = 0;
            }
        }
        this.animating = true;

        var _this = this;
        this.boxlay.animate({left: left}, this.options.speed, function(){
            _this.animating = false;
        }, this.options.easing);
    },
    next: function(){
        if (this.animating || this.box.length < 2) {
            return;
        }

        var left = parseFloat(this.boxlay.getStyle("left")) || 0;
        var leftMax = this.boxlayWidth - (this.boxWidth * this.options.visibleBoxes);
        if (Math.abs(left) >= leftMax) {
            var act = this.options.noNext;
            if (act == "return") {
                return;
            }
            if (act == "reset") {
                left = 0;
            }
        } else {
            left = left - this.boxWidth * this.options.visibleBoxes;
            if (Math.abs(left) >= leftMax) {
                left = -leftMax;
            }
        }
        this.animating = true;

        var _this = this;
        this.boxlay.animate({left: left}, this.options.speed, function(){
            _this.animating = false;
        }, this.options.easing);
    },
    listen: function(){
        var _this = this;
        if (this.options.prevBtn) {
            $.dom(this.options.prevBtn).on("click", function(){ _this.prev(); });
        }
        if (this.options.nextBtn) {
            $.dom(this.options.nextBtn).on("click", function(){ _this.next(); });
        }
        return this;
    },
    setOption: function(key, value){
        this.options[key] = value;
    },
    getOption: function(key){
        return this.options[key];
    }
});

// register
$.ext.slide = function(options) {
    if ($.isEmpty(options)) {
        throw ("Options could not be empty!");
    }
    return new Slide(options);
}

})(so);
