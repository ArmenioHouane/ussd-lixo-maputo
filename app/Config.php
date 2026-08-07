<?php

return [
    'app_name' => 'Sistema USSD de Denúncia de Lixo Urbano',
    'timezone' => 'Africa/Maputo',
    'database_path' => __DIR__ . '/../data/database.sqlite',
    'service_code' => '*384*73407#',
    'default_status' => 'Recebida',
    'statuses' => [
        'Recebida',
        'Em Análise',
        'Encaminhada',
        'Em Atendimento',
        'Resolvida',
        'Rejeitada',
    ],
    'neighborhoods' => [
        '1' => 'Hulene',
        '2' => 'Magoanine',
        '3' => 'Zimpeto',
        '4' => 'Inhagoia',
        '5' => 'Outro',
    ],
    'occurrence_types' => [
        '1' => 'Lixo Acumulado',
        '2' => 'Contentor Cheio',
        '3' => 'Lixo Em Vala De Drenagem',
        '4' => 'Queimada De Lixo',
        '5' => 'Outro',
    ],
];
