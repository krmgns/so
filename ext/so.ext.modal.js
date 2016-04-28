/**
 * @name: so.ext.modal
 * @deps: so, so.dom
 */

;(function($){

// global scope for close events
$.ext.modalObjects = [];

var tpl = '\
<div class="modal">\
    <div class="modal-box">\
        <div class="modal-x"><i class="fa fa-close"></i></div>\
        <div class="modal-head"></div>\
        <div class="modal-body"></div>\
        <div class="modal-foot"></div>\
    </div>\
</div>';

var optionsDefault = {
    width: 450,
    height: null,
    title: "", body: "",
    onOpen: $.fun(), onClose: $.fun(),
    closable: false
};

function Modal(options){
    this.options = $.mix({}, optionsDefault, options);

    this.$modal = $.dom(tpl);
    this.$modal.find(".modal-box").setStyle("width", this.options.width);
    if (this.options.height != null) {
        this.$modal.find(".modal-body").setStyle({
            "height": this.options.height,
            "min-height": this.options.height
        });
    }

    this.$modal.find(".modal-head").setHtml(this.options.title);
    this.$modal.find(".modal-body").setHtml(this.options.body);

    // add global scope
    $.ext.modalObjects.push(this);
}

$.extend(Modal.prototype, {
    open: function(){
        var _this = this;
        // add click-close events
        this.$modal.find(".modal-x").on("click", function(){
            _this.close();
        });
        if (this.options.closable) {
            this.$modal.on("click", function(e){
                if ($.dom(e.target).hasClass("modal")) {
                    _this.close();
                }
            });
        }

        // any button given?
        if (this.options.buttons) {
            $.forEach(this.options.buttons, function(button){
                var $button = $.dom("<button class='btn'>");
                $button.setText(button.text);
                if ("class" in button) {
                    $button.addClass(button.class);
                }
                if ("click" in button) {
                    var clicktType = typeof button.click;
                    // shorcut for modal form's submit() etc.
                    if (clicktType == "string") {
                        $button.on("click", function(){
                            _this.$modal.find("form").fire(button.click);
                        });
                    } else if (clicktType == "function") {
                        $button.on("click", function(e){
                            button.click.call($button[0], e, _this);
                        });
                    }
                }
                // add button
                _this.$modal.find(".modal-foot").append($button, false);
            });
        }

        // append modal to body
        this.$modal.appendTo("body", false);

        // lock scroll
        var $body = $.dom("body"), a, b;
        a = $body.width();
        $.dom("html, body").setStyle("overflow", "hidden");
        b = $body.width();
        $.dom("body,#head").setStyle("padding-right", (b - a));

        // call onopen
        window.setTimeout(function() {
            _this.$modal.find(".modal-box").addClass("open");
            _this.options.onOpen && _this.options.onOpen(_this);

            var $head = _this.$modal.find(".modal-head");
            if ($head.getHtml() == "") {
                $head.hide(0);
            }

            var $foot = _this.$modal.find(".modal-foot");
            if ($foot.getHtml() == "") {
                $foot.hide(0);
            }
        }, 100);
    },
    close: function(el){
        // animate
        this.$modal.addClass("close").find(".modal-box").addClass("close");
        var _this = this;
        // and remove 1 second later
        window.setTimeout(function() {
            _this.$modal.fadeOut(0, function(el){
                if (typeof _this.options.onClose) {
                    _this.options.onClose(_this);
                }
                $.dom(el).remove();
            });
        }, 1000);

        // unlock scroll
        $.dom("html, body, #head").setStyle({"overflow": "", "padding-right": ""});
    }
});

// register
$.ext.modal = function(options){
    if ($.isEmpty(options)) {
        throw ("Options could not be empty!");
    }
    return new Modal(options);
};

// add close event to esc key
$.dom(window.document).on("keydown", function(e){
    if (e.which == 27) {
        var modal;
        while (modal = $.ext.modalObjects.shift()) {
            modal.close();
        }
    }
});

})(so);
