<?php

final class UssdService
{
    public function __construct(
        private readonly Database $db,
        private readonly array $config
    ) {
        date_default_timezone_set($config['timezone'] ?? 'Africa/Maputo');
    }

    public function handle(array $request): string
    {
        $phoneNumber = $this->sanitize($request['phoneNumber'] ?? 'unknown');
        $text = trim((string)($request['text'] ?? ''));
        $tokens = $text === '' ? [] : array_map('trim', explode('*', $text));

        if ($tokens === []) {
            return $this->continue("Bem-vindo ao Sistema de Denuncia de Lixo Urbano\n1. Denunciar lixo\n2. Consultar denuncia\n3. Informacoes\n4. Sair");
        }

        return match ($tokens[0]) {
            '1' => $this->handleReport($tokens, $phoneNumber),
            '2' => $this->handleStatusQuery($tokens),
            '3' => $this->end("Este servico permite denunciar focos de lixo urbano e consultar o estado da denuncia. Nao necessita de internet."),
            '4' => $this->end("Obrigado por usar o Sistema de Denuncia de Lixo Urbano."),
            default => $this->end("Opcao invalida. Volte a marcar o codigo USSD e tente novamente."),
        };
    }

    private function handleReport(array $tokens, string $phoneNumber): string
    {
        $index = 1;

        if (!isset($tokens[$index])) {
            return $this->continue("Seleccione o bairro/zona:\n1. Hulene\n2. Magoanine\n3. Zimpeto\n4. Inhagoia\n5. Outro");
        }

        $neighborhoods = $this->config['neighborhoods'];
        $bairroToken = $tokens[$index];
        if (!array_key_exists($bairroToken, $neighborhoods)) {
            return $this->end("Bairro invalido. Volte a iniciar e escolha uma opcao valida.");
        }

        if ($bairroToken === '5') {
            $index++;
            if (!isset($tokens[$index]) || trim($tokens[$index]) === '') {
                return $this->continue("Digite o nome do bairro ou zona:");
            }
            $bairro = $this->sanitize($tokens[$index]);
            $index++;
        } else {
            $bairro = $neighborhoods[$bairroToken];
            $index++;
        }

        if (!isset($tokens[$index])) {
            return $this->continue("Seleccione o tipo de ocorrencia:\n1. Lixo acumulado\n2. Contentor cheio\n3. Lixo em vala\n4. Queimada de lixo\n5. Outro");
        }

        $types = $this->config['occurrence_types'];
        $typeToken = $tokens[$index];
        if (!array_key_exists($typeToken, $types)) {
            return $this->end("Tipo de ocorrencia invalido. Volte a iniciar e tente novamente.");
        }

        if ($typeToken === '5') {
            $index++;
            if (!isset($tokens[$index]) || trim($tokens[$index]) === '') {
                return $this->continue("Descreva o tipo de problema:");
            }
            $tipo = $this->sanitize($tokens[$index]);
            $index++;
        } else {
            $tipo = $types[$typeToken];
            $index++;
        }

        if (!isset($tokens[$index]) || trim($tokens[$index]) === '') {
            return $this->continue("Informe um ponto de referencia. Exemplo: perto do mercado, escola ou paragem:");
        }

        $pontoReferencia = $this->sanitize($tokens[$index]);
        $index++;

        if (!isset($tokens[$index])) {
            return $this->continue("Confirme a denuncia:\nBairro: {$bairro}\nTipo: {$tipo}\nLocal: {$pontoReferencia}\n1. Confirmar\n2. Cancelar");
        }

        if ($tokens[$index] === '2') {
            return $this->end("Denuncia cancelada. Nenhum registo foi gravado.");
        }

        if ($tokens[$index] !== '1') {
            return $this->end("Opcao de confirmacao invalida. A denuncia nao foi gravada.");
        }

        $codigo = $this->db->createReport([
            'telefone' => $phoneNumber,
            'bairro' => $bairro,
            'tipo_ocorrencia' => $tipo,
            'ponto_referencia' => $pontoReferencia,
            'estado' => $this->config['default_status'],
            'origem' => 'USSD',
        ]);

        return $this->end("Denuncia registada com sucesso. Codigo: {$codigo}. Use a opcao 2 para consultar o estado.");
    }

    private function handleStatusQuery(array $tokens): string
    {
        if (!isset($tokens[1]) || trim($tokens[1]) === '') {
            return $this->continue("Digite o codigo da denuncia. Exemplo: DLX-260426-ABC123");
        }

        $codigo = $this->sanitize($tokens[1]);
        $report = $this->db->findReportByCode($codigo);

        if (!$report) {
            return $this->end("Nenhuma denuncia encontrada com o codigo informado.");
        }

        return $this->end(
            "Estado da denuncia {$report['codigo']}: {$report['estado']}\n" .
            "Bairro: {$report['bairro']}\n" .
            "Tipo: {$report['tipo_ocorrencia']}\n" .
            "Registada em: {$report['created_at']}"
        );
    }

    private function continue(string $message): string
    {
        return 'CON ' . $message;
    }

    private function end(string $message): string
    {
        return 'END ' . $message;
    }

    private function sanitize(string $value): string
    {
        $value = strip_tags($value);
        $value = preg_replace('/\s+/', ' ', $value) ?? $value;
        return trim(substr($value, 0, 180));
    }
}
