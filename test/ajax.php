<?php
header('http/1.1 404 not found');
// header('http/1.1 500 internal server error');

sleep(1);

$response = rand() * 1.01;
// $response = '"'. rand() .'.1"';
$response = json_encode(["hello" => "world!"]);
// $response = json_encode([["hello" => "world!"]]);
// $response = json_encode(null);

// $response = json_encode($_GET);
// $response = json_encode($_POST);


// header("Content-Type: text/plain");
// header("Content-Type: text/xml");
// header("Content-Type: application/json");

// header("HTTP/1.0 200 OK");
// header("HTTP/1.0 304 Not Modified");
// header("HTTP/1.0 404 Not Found");
// header("HTTP/1.0 500 Internal Server Error");

echo $response;
