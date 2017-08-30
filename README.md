So.js is a multipurpose JavaScript library that contains DOM, HTTP, Event, Animation objects and extensions built with So.

### DOM Example
```js
// set each '<p>' font size to '15px', wich has no 'foo' class
so.onReady(function($) {
    $.dom("p:not(.foo)").style("font-size", 15);
    // or
    $.dom("p").not(".foo").style("font-size", 15);
    // or
    $.dom("p").filter(function(el) {
        return !$.dom(el).hasClass('.foo');
    }).style("font-size", 15);
});
```

### HTTP (Ajax) Example
```js
so.onReady(function($) {
    $.http.get("/url", function(data, /* client */) {
        console.log(data);
        /* console.log(client, client.request, client.response); */
    });
});
```

### Event Example
```js
// stop default actions of each <a> if 'href' is '#'
so.onReady(function($) {
    $.dom("a[href='#']").on("click", function(e) {
        e.stopDefault();
    });
});
```

### Animation Example
```js
// set each '<p>' font size animating to '15px', wich has no 'foo' class
so.onReady(function($) {
    $.dom("p:not(.foo)").animate({"font-size": 15});
    // or
    $.dom("p").not(".foo").animate({"font-size": 15});
    // or
    $.dom("p").filter(function(el) {
        return !$.dom(el).hasClass('.foo');
    }).animate({"font-size": 15});
});
```

### Browser Support (Desktop)

| Firefox | Chrome | Opera | Safari | IE  |
| ------- | ------ | ----- | ------ | --- |
| 4       | 5      | 11.6  | 5      | 9   |

### Browser Support (Mobile)

| Firefox | Chrome | Opera | Safari | IE  | Android |
| ------- | ------ | ----- | ------ | --- | ------- |
| 4       | ✓      | 11.5  | ✓      | ✓   | ✓       |

<br>

See documentation [here](https://github.com/k-gun/so/wiki).
