<?php

date_default_timezone_set('Africa/Maputo');

$logDir = __DIR__ . '/../storage/logs';

if (!is_dir($logDir)) {
    mkdir($logDir, 0777, true);
}

$payload = [
    'time' => date('Y-m-d H:i:s'),
    'method' => $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN',
    'post' => $_POST,
    'get' => $_GET,
    'raw' => file_get_contents('php://input'),
];

file_put_contents(
    $logDir . '/ussd_events.log',
    json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL . str_repeat('-', 80) . PHP_EOL,
    FILE_APPEND
);

http_response_code(200);
echo "OK";