/**
 * @package so
 * @object  so.ua
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function(window, $) { 'use strict';

    // all re's enough for general purpose
    var re_ua1 = /(opr|edge)\/([\d.]+)/;
    var re_ua2 = /(chrome|safari|firefox|opera|msie|trident(?=\/))(?:.*version)?\/? *([\d.]+)/;
    var re_mobile = /mobile|android|ip(hone|ad|od)|opera *mini|webos|blackberry|bb\d+|windows *phone/;
    var re_tablet = /tablet|ipad/; // no more clue :/
    var re_os = /(linux|unix|mac|windows)/;
    var re_mobs = [
        /(android) *([\d.]+)/,
        /(ip(?:hone|ad|od))(?:; cpu)? *os ([\d_]+)/,
        /(windows phone) *(?:os)? *([\d.]+)/
    ];

    var navigator = window.navigator,
        ua = navigator.userAgent.lower().sub(0, 250),
        uap = navigator.platform.lower();

    $.ua = (function() {
        var _ = {
            os: {},
            isMobile: function() { return re_mobile.test(ua); },
            isTablet: function() { return re_tablet.test(ua); },
            isTouchable: function() {
                return (navigator.maxTouchPoints > 0 || 'ontouchend' in window);
            }
        }, re;

        // name & version stuff
        if (re = (re_ua1.exec(ua) || re_ua2.exec(ua))) {
            if (re[1]) {
                var name = re[1];
                if (name == 'msie') {
                    name = 'ie';
                } else if (name == 'opr') {
                    name = 'opera';
                }
                _.name = name;
            }
            if (re[2]) {
                _.version = re[2];
                _.versionArray = re[2].split('.').map($.float)
           }
        }

        // os stuff
        if (re = re_os.exec(ua)) {
            _.os.name = re[1];
        }

        if (_.os.name) {
            // details for mobile
            if (_.isMobile()) {
                re_mobs.each(function(re) {
                    if (re = re.exec(ua)) {
                        if (re[1].sub(0, 2) == 'ip') {
                            re = [, 'ios', re[2].replace(/_/g, '.')];
                        }
                        _.os.name = re[1];
                        _.os.version = re[2];
                        return 0; // break
                    }
                });
            }

            /* x86_64 x86-64 x64; amd64 amd64 wow64 x64_64 ia64 sparc64 ppc64 irix64
                linux i386 linux i686 linux x86_64 win32 win64 */
            var test = (_.name == 'opera') ? ua : uap;
            if (/64/.test(test)) {
                _.os.bit = 64;
            } else if (/32|86/.test(test)) {
                _.os.bit = 32;
            }

            _.os.platform = (re_os.exec(uap) || [,])[1];
        }

        // geoposition
        _.getGeoposition = function(onDone, onError, options) {
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
        _.sendBeacon = function(url, data) {
            if (navigator.sendBeacon) {
                navigator.sendBeacon(url, data);
            } else {
                var request = new XMLHttpRequest();
                request.open('POST', url, false);
                request.setRequestHeader('Content-Type', 'text/plain; charset=utf-8');
                request.send(data);
            }
        };

        return _;
    })();

})(window, window.so);
