<?php
$files = array(
    'qwery.min',
    'so',
    'so.ext',
    'so.array',
    'so.object',
    'so.event',
    'so.animate',
    'so.dom',
    'so.ajax',
);

header('Content-Type: text/javascript');
foreach ($files as $file) {
    print "// {$file}.js ******************\n";
    print file_get_contents("../{$file}.js");
    print "\n\n";
}
