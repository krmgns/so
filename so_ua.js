/**
 * @package so
 * @object  so.ua
 * @depends so
 * @author  Kerem Güneş <k-gun@mail.com>
 * @license The MIT License <https://opensource.org/licenses/MIT>
 */
;(function($) { 'use strict';

    var $win = $.win();

    // all re's enough for general purpose
    var re_ua1 = /(opr|edge)\/([\d.]+)/;
    var re_ua2 = /(chrome|safari|firefox|opera|msie|trident(?=\/))(?:.*version)?\/? *([\d.]+)/;
    var re_mobile = /mobile|android|ip(?:hone|ad|od)|opera *mini|webos|blackberry|bb\d+|windows *phone/;
    var re_tablet = /tablet|ipad/; // no more clue :/
    var re_os = /(linux|mac|windows)/;
    var re_osm = [
        /(android) *([\d.]+)/,
        /(ip(?:hone|ad|od))(?:; cpu)? *os ([\d_]+)/,
        /(windows *phone) *(?:os)? *([\d.]+)/
    ];
    var re_osx = /(os(?: x))? ([\d_]+)/;
    var re_bit = /(64|32)/;
    // @link https://stackoverflow.com/q/19877924/362780
    var re_platform = /(linux|mac(ppc|int(el|osh)|68k)?|win(dows|ce|\d+)?|(free|open)bsd|symbian|blackberry|(sun|web|palm)os)/;

    var nav = $win.navigator,
        ua = nav.userAgent.lower().slice(0, 250), // slice safe..
        uap = nav.platform.lower();
    var screen = $win.screen,
        screenAngle = $win.orientation // happy old days..
            || (screen.orientation && screen.orientation.angle);

    $.ua = (function() {
        var _ = {
            os: {},
            screen: [screen.width, screen.height, screenAngle],
            isMobile: function() { return re_mobile.test(ua); },
            isTablet: function() { return re_tablet.test(ua); },
            isTouchable: function() {
                return (nav.maxTouchPoints > 0 || 'ontouchend' in $win);
            }
        }, re;

        // device
        _.device = _.isTablet() ? 'tablet' : _.isMobile() ? 'mobile' : 'desktop';

        // name & version
        if (re = (re_ua1.exec(ua) || re_ua2.exec(ua))) {
            if (re[1]) {
                _.name = (re[1] == 'msie') ? 'ie' : (re[1] == 'opr') ? 'opera' : re[1];
            }
            if (re[2]) {
                _.version = re[2];
                _.versionArray = re[2].split('.').map($.float)
           }
        }

        // os
        if (re = re_os.exec(ua)) {
            var os = _.os, name = re[1], version, platform, bit;

            // mobile details
            if (_.isMobile()) {
                while (re = re_osm.shift()) {
                    if (re = re.exec(ua)) {
                        if (re[1].slice(0, 2) == 'ip') { // ip(hone|ad|od)
                            platform = re[1];
                            re = [, 'ios', re[2].replace(/_/g, '.')];
                        }
                        name = re[1].remove(' ');
                        version = re[2];
                        break;
                    }
                };
            } else if (name == 'mac') {
                re = re_osx.exec(ua);
                name = (re[1] || '').replace(/ /g, '');
                version = (re[2] || '').replace(/_/g, '.');
            }

            // bit & platform
            bit = uap.grep(re_bit) || ua.grep(re_bit);
            platform = platform || uap.grep(re_platform);

            os.name = name, os.version = version, os.platform = platform, os.bit = bit;
        }

        // geoposition
        _.getGeoposition = function(onDone, onError, options) {
            options = $.extend({}, {
                timeout: 5000,
                maximumAge: 0,
                enableHighAccuracy: true
            }, options);

            nav.geolocation.getCurrentPosition(function(position) {
                onDone(position, position.coords.latitude, position.coords.longitude);
            }, onError, options);
        };

        // beacon (sendBeacon() not supported by all)
        _.sendBeacon = function(url, data) {
            if (nav.sendBeacon) {
                nav.sendBeacon(url, data);
            } else {
                var request = new XMLHttpRequest();
                request.open('POST', url, false);
                request.setRequestHeader('Content-Type', 'text/plain; charset=utf-8');
                request.send(data);
            }
        };

        return _;
    })();

})(window.so);
