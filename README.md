Actually, I know that there are buch of JavaScript library, even more powerfull. But sometimes doing things myself makes me happy. That's it...

Usage:

    <div id="container">
        ...
        <div id="div">div#div</div>
        <p class="p1">The p1 <i class="red">iii</i> <a href="#aaa" id="a">a</a>.</p>
        <p class="p2">The p2 <i class="red">iii</i> <b>b</b>.</p>
        <p class="p3">The p3 <i class="red">iii</i>.</p>
        <p class="p4">The p4 <i class="red">iii</i>.</p>
        <div><p class="red">p.in</p></div>
        <input type="text" value="The input!">
        <input type="button" value="The button!">
    </div>
    <p>external p</p>
    
    /* Selectors */
    var ps = $.dom("#container p") // all "p" in "#container"
    ps.first() // first p
    ps.last()  // last p
    ps.nth(1)  // nth(1) p
    ps.find(".p1") // p with .p1 class
    ps.not(".p1")  // p without .p1 class
    ps.not("div < p")  // p not in div
    ps = ps.filter(function(el){ // p with .p2 class
        return el.className == "p2";
    })
    
    /* Paths */
    var el = $.dom("p.p2")
    el.parent()   // parent node (#container)
    el.siblings() // all elements in #container except p.p2
    el.children() // i.red, b
    el.prev()     // p.p1
    el.next()     // p.p3
    el.prevAll()  // div#div, p.p1
    el.nextAll()  // p.p3, p.p4, div, input, input
    el.siblings("p.p4") // sibling with .p4 class
    el.children("i")    // all i elements in .p2
    el.prevAll("p")     // all p elements before p.p2
    el.nextAll("p").not(".p4") // all p elements after p.p2 except p.p4
    el.contains("i.red") // true
    
    /* DOM Manipulation */
    var ps = $.dom("p")
    ps.append(" append text...")
    ps.prepend(" prepend text...")
    ps.before(" before text...")
    ps.after(" after text...")
    ps.setHtml(" setHtml ")
    ps.setText(" setText ")
    ps.empty()
    ps.remove()
    // add all p before #container, also removes all p from #container
    ps.clone().reverse().prependTo("#container")
    // create new element, both same
    var a = $.dom({tag:"a", href:"#", text:"The a!"})
    var a = $.dom().create({tag:"a", href:"#", text:"The a!"})
    a.appendTo("#container")
    $.dom("<a href='#'>The a!</a>").appendTo("#container")
    // or
    ps.append("<a href='#'>The a!</a>")
    ps.forEach(function(el){
        $.dom(el).append(a.clone())
    })
    
    /* Style Tools */
    el.setStyle("color","pink")
    el.setStyle({color:"pink", border:"1px solid red", width:"100px"})
    el.setStyle("color:pink; border:1px solid red; width:100px; top:10px; left:50px; padding:5px")
    el.getStyle("borderTopColor") // rgb(255, 0, 0) (or #ff0000 for old IE)
    el.getStyle("borderTopColor", false) // #ff0000
    el.getStyle("width") // 100px
    el.width() // 100
    el.innerWidth() // 110
    el.outerWidth() // 112
    el.dimensions() // {width:100, height:20}
    el.offset()     // {top:26, left:50}
    el.offset(true) // {top:18, left:42} (true = offset by parent node)
    el.scroll()     // {top:0, left:0}
    el.scroll("top") // 0 get top
    el.scroll(10, 100) // set, get {top:10, left:100}
    // Note: this function for only window as a shortcut
    $.dom(window).viewport() // get {width:1270, height:650}
    $.dom(document).dimensions() // get {width:1270, height:880}
    
    /* Attributes & Values */
    var el = $.dom("input[type=text]").first()
    el.hasAttr("value") // true
    el.getAttr("value") // The input!
    el.setAttr("value", "The foo!") // The foo!
    el.removeAttr("value")  // undefined
    el.setValue("The foo!") // "The foo!"
    el.getValue()           // "The foo!"
    
    /* Class Tools */
    var el = $.dom(".p1")
    el.hasClass("blue") // false
    el.addClass("blue")
    el.setClass("blue") // remove all classes and set "blue" only one
    el.removeClass("blue")
    el.removeClass("blue green")
    el.removeClass("*") // remove all classes
    el.replaceClass("blue", "green") // remove "blue", add "green"
    
    /* Data Tools */
    var el = $.dom("#div")
    el.data("foo") // undefined
    el.data("foo", "The foo!") // The foo!
    // foo: goes to el as an attribute, bar: goes to cache as an object
    el.data({foo:"The foo!", bar:{x:1, y:2}, baz:true})
    el.data("baz") === true // true
    el.data("bar").x === 1  // true
    el.removeData("bar")    // undefined
    el.removeData("*") // remove all data
    el.removeDataAll("*") // remove all data
    
    /* form tools */
    $.dom("#form").serialize() // only for "form" elements
    
    /* events */
    ps.on("click", function() { alert("Hey!"); }) // alert on every click
    ps.on("click", function click() {
        alert("Hey!");
        // remove event
        $.dom(this).off("click", click);
    })
    ps.once("click", function() { alert("Hey!"); }) // alert only once click
    
    /* Animations */
    ps.setStyle("color:#4d93bc; border:1px solid red; width:100px; margin:3px") // @tmp
    ps.animate({
        marginLeft: 100,
        opacity: 0.1
    }, 1000, function(){
        alert("Finito!");
    })
    ps.fadeIn(450)
    ps.fadeOut("slow")
    ps.fadeTo(0.35, /* duration */)
    ps.toggle("fast")
    ps.show(/* duration */)
    ps.hide(/* duration */)
    
    /* Ajax */
    // basic
    var req = ajax({
        url: "/ajax.php",
        onSuccess: function(content){ console.log(content); }
    });
    
    // complicated
    var req = ajax({
        // The request URL
        url: "/ajax.php",
        // The request method (GET/POST/PUT/DELET)
        method: "POST",
        // Required for chaining methods below
        autoSend: false,
        // Adds no-cache buster to the request url
        noCache: true,
        // If set, uses setTimeout method of window, and abort the request
        timeout: 1000,
        // Sets request data
        data: {foo:1, bar:"the bar!"},
        // Sets response data type
        dataType: "text",
        // sets request headers with this param or uses setRequestHeader as below
        // headers: {"X-Foo": "The foo!", "X-Bar": "The bar!"}
        // onstart handler
        onStart: function(xhr){ console.log("Start!"); },
        // onprogress handler (actually does nothing cos this method can run in very limited time)
        onProgress: function(xhr){ console.log("Progress!"); },
        // onsuccess handler (called when no server error, decided by xhr.status 10*|20*|30*)
        onSuccess: function(content, xhr){ console.log("Success!"); },
        // oncomplete handler (called when xhr.readyState = 4, so done)
        onComplete: function(content, xhr){ console.log(this.getAllResponseHeaders()); },
        // onerror handler (called when server error, decided by xhr.status 40*|50*)
        onError: function(content, xhr){ console.log(this.statusCode, this.statusText); },
        // onabort handler (called when request aborted)
        onAbort: function(xhr){ console.log("Aborted!"); },
        // Special status handlers (called when xhr.status matched)
        200: function(content, xhr){ console.log("Status: 200") },
        404: function(content, xhr){ console.log("Status: 404") },
        304: function(content, xhr){ console.log("Status: 304") },
        500: function(content, xhr){ console.log("Status: 500") }
    })
    // Sets request header single
    .setRequestHeader("X-Foo", "The foo!")
    // Sets request header multiple
    .setRequestHeader({"X-Foo": "The foo!", "X-Bar": "The bar!"})
    // Finally send the request
    .send();
    // console.log(req)

    ajax("POST /ajax.php", {foo:1, bar:"the bar!"}, function(content){ /* onSuccess */
        console.log(content)
    });
    // Shortcut of GET
    ajax.get("/ajax.php?a=1", function(content){ console.log(content) });
    // Shortcut of POST
    ajax.post("/ajax.php?a=1", function(content){ console.log(content) });
    ajax.post("/ajax.php?a=1", {foo:"the foo!"}, function(content){ console.log(content) });
    // Shortcut of load (GET)
    ajax.load("/ajax.php", function(content){
        console.log(content);
    });
    ajax.load("/ajax.php", {foo:"the foo!"}, function(content){
        console.log(content);
    });
