<?php

require_once __DIR__ . '/bootstrap.php';

$message = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = (int)($_POST['id'] ?? 0);
    $estado = trim($_POST['estado'] ?? '');
    $observacao = trim($_POST['observacao'] ?? '');

    if ($id > 0 && in_array($estado, $config['statuses'], true)) {
        $db->updateReportStatus($id, $estado, $observacao ?: null);
        $message = 'Estado actualizado com sucesso.';
    } else {
        $message = 'Pedido inválido. Verifique o estado seleccionado.';
    }
}

$filterEstado = trim($_GET['estado'] ?? '');
$filterBairro = trim($_GET['bairro'] ?? '');
$reports = $db->listReports($filterEstado ?: null, $filterBairro ?: null);
$stats = $db->stats();
?>
<!doctype html>
<html lang="pt">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Painel Administrativo</title>
    <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
<main class="admin-layout">
    <header class="card header">
        <div>
            <h1>Sistema De Denúncia De Lixo Urbano</h1>
            <p>Painel administrativo local do protótipo USSD.</p>
        </div>
        <a class="button-link" href="/simulator.php">Voltar ao simulador</a>
    </header>

    <?php if ($message): ?>
        <div class="notice"><?= htmlspecialchars($message) ?></div>
    <?php endif; ?>

    <section class="grid-stats">
        <div class="card stat">
            <span>Total De Denúncias</span>
            <strong><?= (int)$stats['total'] ?></strong>
        </div>
        <?php foreach ($stats['by_status'] as $row): ?>
            <div class="card stat">
                <span><?= htmlspecialchars($row['estado']) ?></span>
                <strong><?= (int)$row['total'] ?></strong>
            </div>
        <?php endforeach; ?>
    </section>

    <section class="card">
        <h2>Filtros</h2>
        <form method="get" class="filters">
            <label>Estado</label>
            <select name="estado">
                <option value="">Todos</option>
                <?php foreach ($config['statuses'] as $status): ?>
                    <option value="<?= htmlspecialchars($status) ?>" <?= $filterEstado === $status ? 'selected' : '' ?>><?= htmlspecialchars($status) ?></option>
                <?php endforeach; ?>
            </select>

            <label>Bairro</label>
            <input type="text" name="bairro" value="<?= htmlspecialchars($filterBairro) ?>" placeholder="Ex.: Hulene">
            <button type="submit">Filtrar</button>
            <a class="button-link secondary-link" href="/admin.php">Limpar</a>
        </form>
    </section>

    <section class="card table-card">
        <h2>Denúncias Registadas</h2>
        <div class="table-wrap">
            <table>
                <thead>
                <tr>
                    <th>Código</th>
                    <th>Telefone</th>
                    <th>Bairro</th>
                    <th>Tipo</th>
                    <th>Ponto De Referência</th>
                    <th>Estado</th>
                    <th>Data</th>
                    <th>Actualizar</th>
                </tr>
                </thead>
                <tbody>
                <?php if ($reports === []): ?>
                    <tr><td colspan="8">Ainda não existem denúncias registadas.</td></tr>
                <?php endif; ?>
                <?php foreach ($reports as $report): ?>
                    <tr>
                        <td><strong><?= htmlspecialchars($report['codigo']) ?></strong></td>
                        <td><?= htmlspecialchars($report['telefone']) ?></td>
                        <td><?= htmlspecialchars($report['bairro']) ?></td>
                        <td><?= htmlspecialchars($report['tipo_ocorrencia']) ?></td>
                        <td><?= htmlspecialchars($report['ponto_referencia']) ?></td>
                        <td><?= htmlspecialchars($report['estado']) ?></td>
                        <td><?= htmlspecialchars($report['created_at']) ?></td>
                        <td>
                            <form method="post" class="inline-form">
                                <input type="hidden" name="id" value="<?= (int)$report['id'] ?>">
                                <select name="estado">
                                    <?php foreach ($config['statuses'] as $status): ?>
                                        <option value="<?= htmlspecialchars($status) ?>" <?= $report['estado'] === $status ? 'selected' : '' ?>><?= htmlspecialchars($status) ?></option>
                                    <?php endforeach; ?>
                                </select>
                                <input type="text" name="observacao" placeholder="Observação">
                                <button type="submit">Guardar</button>
                            </form>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </section>
</main>
</body>
</html>
