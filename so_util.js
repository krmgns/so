/**
 * @package so
 * @object  so.util
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $, UNDEFINED) { 'use strict';

    var JSON = window.JSON;
    var re_rgb = /.*rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(.*))?\)/i;
    var $int = $.int, $float = $.float, $string = $.string;

    // random hex
    function rand(size) {
        return Math.random().toString(16).slice(-size);
    }

    $.util = {
        /**
         * Uuid.
         * @param  {Bool} noDash?
         * @return {String}
         */
        uuid: function(noDash) {
            var ret = '%s-%s-%s-%s-%s'.format(rand(8), rand(4), rand(4), rand(4), rand(12));

            if (noDash) {
                ret = ret.removeAll('-');
            }

            return ret;
        },

        /**
         * To camel case from dash case.
         * @param  {String} input
         * @return {String}
         */
        toCamelCaseFromDashCase: function(input) {
            input = $string(input);

            if (input.has('-')) {
                input = input.replace(/-([a-z])/gi, function(_, _1) {
                    return _1.toUpperCase();
                });
            }

            return input;
        },

        /**
         * To dash case from upper case.
         * @param  {String} input
         * @return {String}
         */
        toDashCaseFromUpperCase: function(input) {
            return $string(input).replace(/([A-Z])/g, function(_, _1) {
                return '-'+ _1.toLowerCase();
            });
        },

        /**
         * Parse rgb.
         * @param  {String} input
         * @return {Object}
         */
        parseRgb: function(input) {
            input = $string(input);

            var re = re_rgb.exec(input),
                ret = {r: 0, g: 0, b: 0, opacity: 0.00};

            if (re) {
                ret.r = $int(re[1]), ret.g = $int(re[2]), ret.b = $int(re[3]);
                if (re[4]) {
                    ret.opacity = $float(re[4]);
                }
            }

            return ret;
        },

        /**
         * Parse rgb as hex.
         * @param  {String} input
         * @return {String}
         */
        parseRgbAsHex: function(input) {
            input = $string(input);

            if (!input.has('rgb')) {
                return '';
            }

            var rgb = this.parseRgb(input),
                r = rgb.r.toString(16), g = rgb.g.toString(16), b = rgb.b.toString(16);

            return '#'+ (
                (r.length == 1 ? '0'+ r : r) +
                (g.length == 1 ? '0'+ g : g) +
                (b.length == 1 ? '0'+ b : b)
            );
        },

        /**
         * Json encode.
         * @param  {Any}    input
         * @param  {Object} options?
         * @return {String|undefined}
         */
        jsonEncode: function(input, options) {
            try {
                options = options || {};
                return JSON.stringify(input, options.replacer, options.space);
            } catch(e) {
                return UNDEFINED;
            }
        },

        /**
         * Json decode.
         * @param  {String} input
         * @param  {Object} options?
         * @return {Any|undefined}
         */
        jsonDecode: function(input, options) {
            try {
                options = options || {};
                return JSON.parse(input, options.reviver);
            } catch(e) {
                return UNDEFINED;
            }
        }
    };

    // Base64
    (function(){
        var ab=window.atob, ba=window.btoa, s=String, r="replace", ca="charAt", cca="charCodeAt", fcc="fromCharCode";
        var c="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        // https://developer.mozilla.org/en/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
        var d=function(a){return encodeURIComponent(a)[r](/%([0-9A-F]{2})/g,function(a,b){return s[fcc]("0x"+b)})};
        var e=function(a){return decodeURIComponent(a.split("").map(function(a){return"%"+("00"+a[cca](0).toString(16)).slice(-2)}).join(""))};
        // encode
        $.util.base64Encode=function(b){if(b=d(b),ba)return ba(b);for(var e,f,g=0,h=c,i="";b[ca](0|g)||(h="=",g%1);i+=h[ca](63&e>>8-8*(g%1))){if(f=b[cca](g+=.75),f>255)throw"'btoa' error!";e=e<<8|f}return i};
        // decode
        $.util.base64Decode=function(b){if(ab)return e(ab(b));if(b=b[r](/=+$/,""),1==b.length%4)throw"'atob' error!";for(var d,f,g=0,h=0,i="";f=b[ca](h++);~f&&(d=g%4?64*d+f:f,g++%4)?i+=s[fcc](255&d>>(6&-2*g)):0)f=c.indexOf(f);return e(i)}
    })();

})(window, window.so);
