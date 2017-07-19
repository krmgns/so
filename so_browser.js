/**
 * @package so
 * @object  so.browser
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $) { 'use strict';

    var re_opr = /(opr)\/([\d.]+)/;
    var re_ua = /(chrome|safari|firefox|opera|msie|trident(?=\/))(?:.*version)?\/?\s*([\d.]+)/;
    var fns_os = ['isMac', 'isWindows', 'isLinux', 'isUnix'];
    var fns_ua = ['isChrome', 'isSafari', 'isFirefox', 'isOpera', 'isWebkitOpera', 'isIE', 'isTrident'];
    var navigator = window.navigator;
    var ua = navigator.userAgent.toLowerCase();
    var uap = navigator.platform.toLowerCase();
    var isTouchDevice = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
    var isMobileDevice = /android|ip(hone|od|ad)|opera *mini|webos|blackberry|mobile|windows *phone/.test(ua);

    $.browser = (function() {
        var re, name, test, browser = {};

        browser.isTouchDevice = function() { return isTouchDevice; };
        browser.isMobileDevice = function() { return isMobileDevice; };

        // set 'is' functions for os
        fns_os.forEach(function(fn) {
            var osName = fn.slice(2).toLowerCase();

            browser[fn] = (fn == 'isUnix')
                ? function() { return ua.has('x11') && !ua.has('linux'); }
                : function() { return ua.has(osName); };

            // set os name testing
            if (browser[fn]()) {
                browser['osName'] = osName;
            }
        });

        // set 'is' functions for browser
        fns_ua.forEach(function(fn) {
            browser[fn] = function() { return false; };
        });

        if (re = (re_opr.exec(ua) || re_ua.exec(ua))) {
            if (re[1]) {
                var name = (re[1] == 'msie') ? 'ie' : re[1];
                if (name == 'opr') {
                    name = 'opera';
                }
                browser['name'] = name;

                // re-set 'is' function
                browser['is'+ (name == 'ie' ? name.toUpperCase()
                    : name.toCapitalCase(false))] = function() { return true; };
                browser['isWebkitOpera'] = function() { return re[1] == 'opr'; };
            }
            if (re[2]) {
                var versionArray = re[2].split('.').map(function(value) {
                    return value.toInt();
                }), versionString;
                versionString = versionArray.slice(0,2).join('.');
                browser['version'] = versionString.toFloat();
                browser['versionArray'] = versionArray;
                browser['versionString'] = versionString;
                browser['versionOrig'] = re[2];
           }
        }

        if (browser['osName']) {
            /* x86_64 x86-64 x64; amd64 amd64 wow64 x64_64 ia64 sparc64 ppc64 irix64
                linux i386 linux i686 linux x86_64 win32 win64 macintel? */
            test = browser.isOpera() ? ua : uap;
            if (/64/.test(test)) {
                browser['osBit'] = 64;
            } else if (/32|86/.test(test)) {
                browser['osBit'] = 32;
            }
        }

        // geoposition
        browser.getGeoposition = function(onDone, onError, options) {
            options = $.extend({}, {
                timeout: 5000,
                maximumAge: 0,
                enableHighAccuracy: true
            }, options);

            navigator.geolocation.getCurrentPosition(function(position, onError, options){
                onDone(position, position.coords.latitude, position.coords.longitude);
            });
        };

        // beacon (navigator.sendBeacon() not supported by all browsers)
        browser.sendBeacon = function(url, data) {
            if (navigator.sendBeacon) {
                return navigator.sendBeacon(url, data);
            }

            var request = new XMLHttpRequest();
            request.open('POST', url, false);
            request.setRequestHeader('Content-Type', 'text/plain; charset=utf-8');
            request.send(data);
        };

        return browser;
    })();

})(window, so);
