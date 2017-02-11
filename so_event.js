;(function(window, $) { 'use strict';

    var DOMLevel = document.adoptNode ? 3 : 2
        , re_types = {
            UIEvent: 'resize|scroll|select|(un)?load|DOMActivate',
         MouseEvent: '(dbl)?click|mouse(up|down|enter|leave|in|out|over|move|wheel)|show|contextmenu|DOMMouseScroll',
         FocusEvent: 'blur|focus(in|out)?|DOMFocus(In|Out)',
      KeyboardEvent: 'key(up|down|press)',
         TouchEvent: 'touch(end|start|move|cancel)',
          DragEvent: 'drag(end|start|enter|leave|over|exit|gesture|drop)?|drop',
         WheelEvent: 'wheel',
    HashChangeEvent: 'hashchange',
  BeforeUnloadEvent: 'beforeunload',
      MutationEvent: 'DOM((Attr|CharacterData|Subtree)Modified|Node(Inserted(IntoDocument)?|Removed(FromDocument)?))',
       MessageEvent: 'message', PopStateEvent: 'popstate', StorageEvent: 'storage',
     AnimationEvent: 'animation(end|start|iteration)',
    TransitionEvent: 'transition(end|start)', PageTransitionEvent: 'page(hide|show)',
      ProgressEvent: 'load(end|start)|progress|timeout',
   CompositionEvent: 'composition(end|start|update)',
  DeviceMotionEvent: 'devicemotion', DeviceOrientationEvent: 'deviceorientation'
        }
        , re_typesFix = /^(UI|Mouse|Mutation|HTML)Event/i
        , optionsDefault = {
                bubbles: true, cancelable: true, // common
                   view: window, detail: null, // ui
            relatedNode: null, prevValue: '', newValue: '', attrName: '', attrChange: 0, // mutation
                screenX: 0, screenY: 0, clientX: 0, clientY: 0, ctrlKey: false, altKey: false,
                    shiftKey: false, metaKey: false, button: 1, relatedTarget: null // mouse
        }

    function createEvent(cType, eType, options) {
        var event, cTypeOrig;
        if (!cType && eType) { // autodetect
            $.forEach(re_types, function(re, _cType) {
                re = new RegExp('^('+ re +')$', 'i');
                if (re.test(eType)) {
                    cType = cTypeOrig = _cType;
                    return 0;
                }
            });
        }

        // @defaults
        cType = cTypeOrig = cType || 'Event';
        eType = eType || '';
        options = $.extend({}, optionsDefault, options);

        if ($.isFunction(window[cType])) {
            // return new window[cType](eType);
        }

        if (DOMLevel < 311111111 && re_typesFix.test(cType)) {
            cType += 's';
        }

        event = document.createEvent(cType);
        switch (cTypeOrig) {
            case 'UIEvent':
                event.initUIEvent(eType, options.bubbles, options.cancelable, options.view, options.detail);
                break;
            case 'MouseEvent':
            case 'DragEvent':
            case 'WheelEvent':
                event.initMouseEvent(eType, options.bubbles, options.cancelable, options.view, options.detail,
                    options.screenX, options.screenY, options.clientX, options.clientY,
                    options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
                    options.button, options.relatedTarget
                );
            default:
                if (cType == 'CustomEvent') {
                    event.initCustomEvent(eType, options.bubbles, options.cancelable, options.detail);
                } else {
                    event.initEvent(eType, options.bubbles, options.cancelable); // all others
                }
        }

        return event;
    }

    var event = createEvent("KeyboardEvent", "");
    document.dispatchEvent(event)

    $.onReady(function() {
        document.addEventListener("keydown", function(e) {
            log(e)
        }, false)
    });

    $.extend('@event', (function() {
        function Event() {}
        function EventTarget() {} // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget

        // return {
        //     create: createEvent,
        // };
    })());

})(window, so);
