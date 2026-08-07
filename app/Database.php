<?php

final class Database
{
    private string $path;
    private array $data;

    public function __construct(array $config)
    {
        $this->path = dirname($config['database_path']) . '/database.json';
        $dir = dirname($this->path);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        if (!file_exists($this->path)) {
            file_put_contents($this->path, json_encode([
                'last_id' => 0,
                'reports' => [],
                'history' => [],
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }

        $raw = file_get_contents($this->path);
        $decoded = json_decode($raw ?: '', true);
        if (!is_array($decoded)) {
            $decoded = ['last_id' => 0, 'reports' => [], 'history' => []];
        }
        $this->data = $decoded + ['last_id' => 0, 'reports' => [], 'history' => []];
    }

    public function createReport(array $data): string
    {
        $codigo = $this->generateCode();
        $now = date('Y-m-d H:i:s');
        $id = ((int)$this->data['last_id']) + 1;

        $report = [
            'id' => $id,
            'codigo' => $codigo,
            'telefone' => $data['telefone'],
            'bairro' => $data['bairro'],
            'tipo_ocorrencia' => $data['tipo_ocorrencia'],
            'ponto_referencia' => $data['ponto_referencia'],
            'estado' => $data['estado'],
            'origem' => $data['origem'] ?? 'USSD',
            'created_at' => $now,
            'updated_at' => $now,
        ];

        $this->data['last_id'] = $id;
        $this->data['reports'][] = $report;
        $this->data['history'][] = [
            'id' => count($this->data['history']) + 1,
            'denuncia_id' => $id,
            'estado_anterior' => null,
            'estado_novo' => $data['estado'],
            'observacao' => 'Denúncia criada pelo canal USSD.',
            'created_at' => $now,
        ];
        $this->save();

        return $codigo;
    }

    public function findReportByCode(string $codigo): ?array
    {
        $codigo = strtoupper(trim($codigo));
        foreach ($this->data['reports'] as $report) {
            if (strtoupper($report['codigo']) === $codigo) {
                return $report;
            }
        }
        return null;
    }

    public function listReports(?string $estado = null, ?string $bairro = null): array
    {
        $reports = $this->data['reports'];

        $reports = array_filter($reports, function (array $report) use ($estado, $bairro): bool {
            if ($estado !== null && $estado !== '' && $report['estado'] !== $estado) {
                return false;
            }
            if ($bairro !== null && $bairro !== '' && stripos($report['bairro'], $bairro) === false) {
                return false;
            }
            return true;
        });

        usort($reports, fn(array $a, array $b): int => $b['id'] <=> $a['id']);
        return array_values($reports);
    }

    public function updateReportStatus(int $id, string $newStatus, ?string $observacao = null): bool
    {
        foreach ($this->data['reports'] as &$report) {
            if ((int)$report['id'] === $id) {
                $oldStatus = $report['estado'];
                $now = date('Y-m-d H:i:s');
                $report['estado'] = $newStatus;
                $report['updated_at'] = $now;
                $this->data['history'][] = [
                    'id' => count($this->data['history']) + 1,
                    'denuncia_id' => $id,
                    'estado_anterior' => $oldStatus,
                    'estado_novo' => $newStatus,
                    'observacao' => $observacao ?: 'Estado actualizado no painel administrativo local.',
                    'created_at' => $now,
                ];
                unset($report);
                $this->save();
                return true;
            }
        }
        unset($report);
        return false;
    }

    public function stats(): array
    {
        $byStatus = [];
        $byNeighborhood = [];

        foreach ($this->data['reports'] as $report) {
            $byStatus[$report['estado']] = ($byStatus[$report['estado']] ?? 0) + 1;
            $byNeighborhood[$report['bairro']] = ($byNeighborhood[$report['bairro']] ?? 0) + 1;
        }

        arsort($byStatus);
        arsort($byNeighborhood);

        return [
            'total' => count($this->data['reports']),
            'by_status' => array_map(
                fn(string $estado, int $total): array => ['estado' => $estado, 'total' => $total],
                array_keys($byStatus),
                array_values($byStatus)
            ),
            'by_neighborhood' => array_slice(array_map(
                fn(string $bairro, int $total): array => ['bairro' => $bairro, 'total' => $total],
                array_keys($byNeighborhood),
                array_values($byNeighborhood)
            ), 0, 10),
        ];
    }

    private function generateCode(): string
    {
        do {
            $code = 'DLX-' . date('ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
        } while ($this->findReportByCode($code) !== null);

        return $code;
    }

    private function save(): void
    {
        file_put_contents($this->path, json_encode($this->data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
}
