/**
 * @package so
 * @object  so.browser
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $) { 'use strict';

    var navigator = window.navigator,
        re_src = /(chrome|safari|firefox|opera|msie|trident(?=\/))\/?\s*([\d.]+)/,
        fns_os = ['isMac', 'isWindows', 'isLinux', 'isUnix'],
        fns_ua = ['isChrome', 'isSafari', 'isFirefox', 'isOpera', 'isIE', 'isTrident'],
        ret_isTouchDevice = navigator.maxTouchPoints > 0 || 'ontouchstart' in window,
        ret_isMobileDevice = /android|ip(hone|od|ad)|opera *mini|webos|blackberry|mobile|windows *phone/i.test(navigator)
    ;

    $.extend('@browser', (function() {
        var ua = navigator.userAgent.toLowerCase(), uap = navigator.platform.toLowerCase(),
            re, name, test, browser = {};

        browser.isTouchDevice = function() { return ret_isTouchDevice; };
        browser.isMobileDevice = function() { return ret_isMobileDevice; };

        // set 'is' functions for os
        fns_os.forEach(function(fn) {
            var osName = fn.slice(2).toLowerCase();

            browser[fn] = (fn == 'isUnix')
                ? function() { return ua.index('x11') && !ua.index('linux'); }
                : function() { return ua.index(osName); };

            // set os name testing
            if (browser[fn]()) {
                browser['osName'] = osName;
            }
        });

        // set 'is' functions for browser
        fns_ua.forEach(function(fn) {
            browser[fn] = function() { return false; };
        });

        if (re = re_src.exec(ua)) {
            if (re[1]) {
                browser['name'] = (re[1] == 'msie') ? 'ie' : re[1];
                // re-set 'is' function
                browser['is'+ (browser['name'] == 'ie'
                    ? browser['name'].toUpperCase()
                    : browser['name'].toCapitalCase(false))] = function() { return true; };
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
        browser.getGeoposition = function(onDone, onFail, options) {
            options = $.extend({}, {
                timeout: 5000,
                maximumAge: 0,
                enableHighAccuracy: true
            }, options);

            navigator.geolocation.getCurrentPosition(function(position, onFail, options){
                onDone(position, position.coords.latitude, position.coords.longitude);
            });
        };

        return browser;
    })());

})(window, so);
