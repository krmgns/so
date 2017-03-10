So.js is a multipurpose JavaScript library that contains DOM, HTTP, Event, Animation objects and extensions built with So.

**DOM Example**
```js
// set each '<p>' font size animating to '15px', wich has no 'foo' class
so.onReady(function($) {
    $.dom("p:not(.foo)").animate({"font-size": 15});
    // or
    $.dom("p").not(".foo").animate({"font-size": 15});
    // or
    $.dom("p").filter(function(el) {
        retur !$.dom(el).hasClass('.foo');
    }).animate({"font-size": 15});
});
```

**Browser Support (Desktop)**

| Firefox | Chrome | Opera | Safari | IE  |
| ------- | ------ | ----- | ------ | --- |
| 4       | 5      | 11.6  | 5      | 9   |

**Browser Support (Mobile)**

| Firefox | Chrome | Opera | Safari | IE  | Android |
| ------- | ------ | ----- | ------ | --- | ------- |
| 4       | ✓      | 11.5  | ✓      | ✓   | ✓       |

<br>

See documentation [here](https://github.com/k-gun/so/wiki).
