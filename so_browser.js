/**
 * @package so
 * @object  so.browser
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $) { 'use strict';

    var re_ua1 = /(opr|edge)\/([\d.]+)/;
    var re_ua2 = /(chrome|safari|firefox|opera|msie|trident(?=\/))(?:.*version)?\/? *([\d.]+)/;
    var fns_os = ['isLinux', 'isUnix', 'isMac', 'isWindows'];
    var fns_ua = ['isChrome', 'isSafari', 'isFirefox', 'isOpera', 'isOldOpera', 'isIe', 'isEdge', 'isTrident'];
    var navigator = window.navigator;
    var ua = navigator.userAgent.lower();
    var uap = navigator.platform.lower();
    var isTouchDevice = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
    var isMobileDevice = /android|ip(hone|od|ad)|opera *mini|webos|blackberry|mobile|windows *phone/.test(ua);

    $.browser = (function() {
        var browser = {};

        browser.isTouchDevice = function() { return isTouchDevice; };
        browser.isMobileDevice = function() { return isMobileDevice; };

        // set 'is' functions for os
        fns_os.each(function(fn) {
            var osName = fn.slice(2).lower();

            browser[fn] = (fn == 'isUnix')
                ? function() { return ua.has('x11') && !ua.has('linux'); }
                : function() { return ua.has(osName); };

            // set os name testing
            if (browser[fn]()) {
                browser['osName'] = osName;
            }
        });

        // set default 'is' functions for browser
        fns_ua.each(function(fn) {
            browser[fn] = function() { return false; };
        });

        var re;
        if (re = (re_ua1.exec(ua) || re_ua2.exec(ua))) {
            if (re[1]) {
                var name = (re[1] == 'msie') ? 'ie' : re[1];
                if (name == 'opr' || name == 'edge') {
                    name = (name == 'opr') ? 'opera' : 'edge';
                }
                browser['name'] = name;

                // re-set 'is' function e.g browser.isOpera()
                browser['is'+ name.toCapitalCase()] = function() { return true; };
                browser['isOldOpera'] = function() { return re[1] == 'opera'; };
            }
            if (re[2]) {
                var versionArray = re[2].split('.').map(function(value) {
                    return $.int(value);
                });
                var versionString = versionArray.slice(0,2).join('.');
                browser['version'] = versionString.toFloat();
                browser['versionArray'] = versionArray;
                browser['versionString'] = versionString;
                browser['versionOrig'] = re[2];
           }
        }

        if (browser['osName']) {
            /* x86_64 x86-64 x64; amd64 amd64 wow64 x64_64 ia64 sparc64 ppc64 irix64
                linux i386 linux i686 linux x86_64 win32 win64 macintel? */
            var test = browser.isOldOpera() ? ua : uap;
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

            navigator.geolocation.getCurrentPosition(function(position) {
                onDone(position, position.coords.latitude, position.coords.longitude);
            }, onError, options);
        };

        // beacon (navigator.sendBeacon() not supported by all)
        browser.sendBeacon = function(url, data) {
            if (navigator.sendBeacon) {
                navigator.sendBeacon(url, data);
            } else {
                var request = new XMLHttpRequest();
                request.open('POST', url, false);
                request.setRequestHeader('Content-Type', 'text/plain; charset=utf-8');
                request.send(data);
            }
        };

        return browser;
    })();

})(window, window.so);
