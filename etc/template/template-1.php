<!doctype html>
<html>
<head>
    <title>Template #1</title>

    <meta charset="utf-8">

    <link rel="stylesheet" href="template-1/all.css">

    <script src="//dev.local/mii/test/mii-all.php"></script>
</head>
<body>

<div class="tmp-container">
<h1><u>Navbar</u></h1>
<? include_once('template-1/html/navbar.html'); ?>
</div><!-- .tmp-container -->

<div class="tmp-container">
<h1><u>Nav</u></h1>
<? include_once('template-1/html/nav.html'); ?>
</div><!-- .tmp-container -->

<div class="tmp-container">
<h1><u>Button</u></h1>
<? include_once('template-1/html/button.html'); ?>
</div><!-- .tmp-container -->

<div class="tmp-container">
<h1><u>Form</u></h1>
<? include_once('template-1/html/form.html'); ?>
</div><!-- .tmp-container -->

<div class="tmp-container">
<h1><u>Indicator</u></h1>
<? include_once('template-1/html/indicator.html'); ?>
</div><!-- .tmp-container -->

<div class="tmp-container">
<h1><u>Container</u></h1>
<? include_once('template-1/html/container.html'); ?>
</div><!-- .tmp-container -->

<div class="tmp-container">
<h1><u>Typography</u></h1>
<? include_once('template-1/html/typography.html'); ?>
</div><!-- .tmp-container -->

<div class="tmp-container">
<h1><u>Table</u></h1>
<? include_once('template-1/html/table.html'); ?>
</div><!-- .tmp-container -->


<?=str_repeat('<br>', 10)?>

<script>
mii.onReady(function($){
    function hideOpenDropdowns() {
        $.dom(".nav a[role='toggle'], .navbar a[role='toggle']").removeClass("active");
        $.dom(".dropdown-open").removeClass("dropdown-open");
    }

    $.dom(".nav a[role='toggle'], .navbar a[role='toggle']").on("click", function(e){
        e.preventDefault();
        e.stopPropagation();

        var $this = $.dom(this);
        var $thisParent = $this.parent();

        $.dom(".dropdown-open").forEach(function(el){
            var $el = $.dom(el);
            if ($el[0] != $thisParent[0]) {
                $el.removeClass("dropdown-open");
                $el.find("a[role='toggle']").removeClass("active");
            }
        });

        if ($thisParent.hasClass("dropdown-open")) {
            hideOpenDropdowns();
            return;
        }

        $thisParent.addClass("dropdown-open");
        $this.addClass("active");
    });

    $.dom(document).on("click", function(e){
        e.stopPropagation();
        hideOpenDropdowns();
    });
});
</script>

<script>
mii.onReady(function($){
    $.dom("[width]").forEach(function(el){
        el = $.dom(el);
        el.setStyle("width", el.getAttr("width"));
    });

    $.dom("[disabled]").on("click", function(e){
        e.preventDefault();
    });

    $.dom("button[cancel]").on("click", function(e){
        e.preventDefault();
    });
});
</script>

</body>
</html>