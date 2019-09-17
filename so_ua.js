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
    var re_bit = /(64|32)/;
    var re_platform = /(linux|mac(ppc|int(el|osh))?|win(dows|ce|\d+)?)/ // @link: https://stackoverflow.com/q/19877924/362780

    var navigator = $win.navigator,
        ua = navigator.userAgent.lower().slice(0, 250), // safe..
        uap = navigator.platform.lower();

    $.ua = (function() {
        var _ = {
            os: {},
            isMobile: function() { return re_mobile.test(ua); },
            isTablet: function() { return re_tablet.test(ua); },
            isTouchable: function() {
                return (navigator.maxTouchPoints > 0 || 'ontouchend' in $win);
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
            _.os.name = re[1];

            // mobile details
            if (_.isMobile()) {
                re_osm.each(function(re) {
                    if (re = re.exec(ua)) {
                        if (re[1].slice(0, 2) == 'ip') { // ip(hone|ad|od)
                            re = [, 'ios', re[2].replace(/_/g, '.')];
                        }
                        _.os.name = re[1].remove(' ');
                        _.os.version = re[2];
                        return 0; // break
                    }
                });
            }

            // bit & platform
            _.os.bit = uap.grep(re_bit) || ua.grep(re_bit);
            _.os.platform = uap.grep(re_platform);
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

})(window.so);
