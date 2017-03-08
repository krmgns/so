<?php
$files = array(
    'so.js',
    'so_util.js',
    'so_class.js',
    'so_list.js',
    'so_browser.js',
    'so_http.js',
    'so_event.js',
    'so_animation.js',
    'so_dom.js',
);

header('Content-Type: text/javascript');
foreach ($files as $file) {
    print "// {$file} ******************\n";
    print file_get_contents("../{$file}");
    print "\n\n";
}
