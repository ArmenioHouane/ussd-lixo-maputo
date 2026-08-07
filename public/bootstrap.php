<?php

require_once __DIR__ . '/../app/Database.php';
require_once __DIR__ . '/../app/UssdService.php';

$config = require __DIR__ . '/../app/Config.php';
date_default_timezone_set($config['timezone']);
$db = new Database($config);
$ussd = new UssdService($db, $config);
