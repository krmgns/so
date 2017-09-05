/**
 * @package so
 * @object  so.util
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $) { 'use strict';

    var re_rgb = /.*rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(.*))?\)/i;

    $.util = {
        /**
         * toCamelCaseFromDashCase.
         * @param  {String} input
         * @return {String}
         */
        toCamelCaseFromDashCase: function(input) {
            input = (''+ input);
            if (input.indexOf('-') > 0) {
                input = input.replace(/-([a-z])/gi, function(_, $1) {
                    return $1.toUpperCase();
                });
            }
            return input;
        },

        /**
         * toDashCaseFromUpperCase.
         * @param  {String} input
         * @return {String}
         */
        toDashCaseFromUpperCase: function(input) {
            return (''+ input).replace(/([A-Z])/g, function(_, $1) {
                return '-'+ $1.toLowerCase();
            });
        },

        /**
         * toHexFromRgb.
         * @param  {String} input
         * @return {String}
         */
        toHexFromRgb: function(input) {
            if (!(input = ''+ input) || input[0] == '#' || input.indexOf('rgb') < 0) {
                return input;
            }

            var rgb = $.util.parseRgb(input),
                r = rgb.r.toString(16), g = rgb.g.toString(16), b = rgb.b.toString(16);

            return '#'+ (
                (r.length == 1 ? '0'+ r : r) +
                (g.length == 1 ? '0'+ g : g) +
                (b.length == 1 ? '0'+ b : b)
            );
        },

        /**
         * parseRgb.
         * @param  {String} input
         * @return {Object}
         */
        parseRgb: function(input) {
            var re = re_rgb.exec(input),
                ret = {r: 0, g: 0, b: 0, opacity: 0.00};

            if (re) {
                ret.r = re[1].toInt(), ret.g = re[2].toInt(), ret.b = re[3].toInt();
                if (re[4]) {
                    ret.opacity = re[4].toFloat();
                }
            }

            return ret;
        },

        /**
         * Escape RegExp input.
         * @param  {String} input
         * @return {String}
         */
        escapeRegExpInput: function(input) {
            return input.replace(/[.*+?^$|{}()\[\]\\]/g, '\\$&');
        }
    };

    // Base64
    (function(){'Base64';
        var w=window, ab=w.atob, ba=w.btoa, s=String, r="replace", ca="charAt", cca="charCodeAt", fcc="fromCharCode";
        var c="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        // https://developer.mozilla.org/en/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
        var d=function(a){return encodeURIComponent(a)[r](/%([0-9A-F]{2})/g,function(a,b){return s[fcc]("0x"+b)})};
        var e=function(a){return decodeURIComponent(a.split("").map(function(a){return"%"+("00"+a[cca](0).toString(16)).slice(-2)}).join(""))};
        // encode
        $.util.base64Encode=function(b){if(b=d(b),ba)return ba(b);for(var e,f,g=0,h=c,i="";b[ca](0|g)||(h="=",g%1);i+=h[ca](63&e>>8-8*(g%1))){if(f=b[cca](g+=.75),f>255)throw"'btoa' error!";e=e<<8|f}return i};
        // decode
        $.util.base64Decode=function(b){if(ab)return e(ab(b));if(b=b[r](/=+$/,""),1==b.length%4)throw"'atob' error!";for(var d,f,g=0,h=0,i="";f=b[ca](h++);~f&&(d=g%4?64*d+f:f,g++%4)?i+=s[fcc](255&d>>(6&-2*g)):0)f=c.indexOf(f);return e(i)}
    })();

})(window, so);
