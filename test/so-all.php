<?php
$files = array(
    'qwery.min',
    'so',
    'so.ext',
    'so.array',
    'so.object',
    'so.browser',
    'so.animate',
    'so.event',
    'so.dom',
    'so.ajax',
);

header('Content-Type: text/javascript');
foreach ($files as $file) {
    print "// {$file}.js ******************\n";
    print file_get_contents("../{$file}.js");
    print "\n\n";
}
