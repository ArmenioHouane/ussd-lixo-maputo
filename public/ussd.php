<?php

require_once __DIR__ . '/bootstrap.php';

header('Content-Type: text/plain; charset=utf-8');

$request = [
    'sessionId' => $_POST['sessionId'] ?? $_GET['sessionId'] ?? '',
    'serviceCode' => $_POST['serviceCode'] ?? $_GET['serviceCode'] ?? ($config['service_code'] ?? ''),
    'phoneNumber' => $_POST['phoneNumber'] ?? $_GET['phoneNumber'] ?? '',
    'text' => $_POST['text'] ?? $_GET['text'] ?? '',
];

echo $ussd->handle($request);
