<?php

session_start();
require_once __DIR__ . '/bootstrap.php';

if (!isset($_SESSION['ussd_text'])) {
    $_SESSION['ussd_text'] = '';
}
if (!isset($_SESSION['session_id'])) {
    $_SESSION['session_id'] = 'local-' . bin2hex(random_bytes(4));
}
if (!isset($_SESSION['phone_number'])) {
    $_SESSION['phone_number'] = '+258840000000';
}

$lastResponse = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['reset'])) {
        $_SESSION['ussd_text'] = '';
        $_SESSION['session_id'] = 'local-' . bin2hex(random_bytes(4));
        $lastResponse = null;
    } else {
        $_SESSION['phone_number'] = trim($_POST['phoneNumber'] ?? $_SESSION['phone_number']);
        $input = trim($_POST['input'] ?? '');
        if ($input !== '') {
            $_SESSION['ussd_text'] = $_SESSION['ussd_text'] === '' ? $input : $_SESSION['ussd_text'] . '*' . $input;
        }
    }
}

$lastResponse = $ussd->handle([
    'sessionId' => $_SESSION['session_id'],
    'serviceCode' => $config['service_code'],
    'phoneNumber' => $_SESSION['phone_number'],
    'text' => $_SESSION['ussd_text'],
]);

$isEnded = str_starts_with($lastResponse, 'END');
$screenText = preg_replace('/^(CON|END)\s*/', '', $lastResponse);
?>
<!doctype html>
<html lang="pt">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Simulador USSD Local</title>
    <link rel="stylesheet" href="/assets/style.css">
</head>
<body>
<main class="layout">
    <section class="card phone">
        <div class="phone-top">USSD Local <?= htmlspecialchars($config['service_code']) ?></div>
        <pre class="screen"><?= htmlspecialchars($screenText) ?></pre>
        <form method="post" class="form">
            <label>Número de telefone</label>
            <input type="text" name="phoneNumber" value="<?= htmlspecialchars($_SESSION['phone_number']) ?>">

            <label>Resposta do utilizador</label>
            <input type="text" name="input" placeholder="Digite a opção ou texto" <?= $isEnded ? 'disabled' : '' ?> autofocus>

            <div class="actions">
                <button type="submit" <?= $isEnded ? 'disabled' : '' ?>>Enviar</button>
                <button type="submit" name="reset" value="1" class="secondary">Nova sessão</button>
            </div>
        </form>
        <p class="muted">Texto acumulado enviado ao webhook: <code><?= htmlspecialchars($_SESSION['ussd_text'] ?: '(vazio)') ?></code></p>
    </section>

    <section class="card">
        <h1>Como testar</h1>
        <p>Fluxo principal de denúncia:</p>
        <ol>
            <li>Escolha <strong>1</strong> para denunciar lixo.</li>
            <li>Escolha o bairro.</li>
            <li>Escolha o tipo de ocorrência.</li>
            <li>Digite um ponto de referência.</li>
            <li>Confirme com <strong>1</strong>.</li>
        </ol>
        <p>Depois abra o painel administrativo para ver o registo gravado.</p>
        <p><a href="/admin.php">Abrir painel administrativo</a></p>
        <p><a href="/ussd.php" target="_blank">Ver endpoint USSD bruto</a></p>
    </section>
</main>
</body>
</html>
