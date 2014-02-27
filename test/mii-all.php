<?php
$files = array('qwery.min', 'mii', 'mii.ext', 'mii.array', 'mii.object', 'mii.event', 'mii.animate', 'mii.dom', 'mii.ajax');

header('Content-Type: text/javascript');
foreach ($files as $file) {
    print "// {$file}.js ******************\n";
    print file_get_contents("../{$file}.js");
    print "\n\n";
}