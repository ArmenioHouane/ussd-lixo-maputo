# Sistema USSD De Denúncia De Lixo Urbano - Protótipo PHP

Protótipo académico de sistema USSD para denúncia de focos de lixo urbano na cidade de Maputo.

## Stack

- PHP 8+
- SQLite local
- Servidor embutido do PHP
- Simulador web local
- Compatível com callback USSD da Africa's Talking Sandbox

## Estrutura

```text
app/
  Config.php          Configurações gerais
  Database.php        Migração automática e acesso à BD
  UssdService.php     Motor dos menus USSD
public/
  ussd.php            Webhook compatível com Africa's Talking
  simulator.php       Simulador local de sessão USSD
  admin.php           Painel administrativo local
  assets/style.css    Estilos simples
data/
  database.sqlite     Criado automaticamente na primeira execução
tests/
  test_ussd.sh        Teste via curl
```

## Como executar localmente

Na pasta do projecto:

```bash
php -S 127.0.0.1:8000 -t public
```

Abrir no navegador:

```text
http://127.0.0.1:8000/simulator.php
```

Painel administrativo:

```text
http://127.0.0.1:8000/admin.php
```

Endpoint USSD:

```text
http://127.0.0.1:8000/ussd.php
```

## Como testar por curl

Com o servidor local activo:

```bash
bash tests/test_ussd.sh
```

Ou manualmente:

```bash
curl -X POST http://127.0.0.1:8000/ussd.php \
  -d "sessionId=local-1" \
  -d "serviceCode=*384*123#" \
  -d "phoneNumber=+258840000001" \
  -d "text="
```

## Fluxo USSD implementado

Menu inicial:

```text
1. Denunciar lixo
2. Consultar denúncia
3. Informações
4. Sair
```

Fluxo de denúncia:

```text
Denunciar lixo
→ seleccionar bairro
→ seleccionar tipo de ocorrência
→ informar ponto de referência
→ confirmar
→ gerar código da denúncia
```

Estados administrativos:

```text
Recebida
Em Análise
Encaminhada
Em Atendimento
Resolvida
Rejeitada
```

## Integração com Africa's Talking Sandbox

1. Executar o servidor local.
2. Expor o servidor com ngrok:

```bash
ngrok http 8000
```

3. Copiar a URL pública do ngrok.
4. No Africa's Talking Sandbox, criar/configurar o canal USSD.
5. Usar como callback URL:

```text
https://SEU-NGROK.ngrok-free.app/ussd.php
```

6. Abrir o simulador da Africa's Talking e testar o service code criado.

## Observação académica

Este protótipo é funcional em ambiente simulado. Para produção real seria necessário contratar/configurar um código USSD com uma operadora móvel ou agregador autorizado, adicionar autenticação forte no painel administrativo, logs de auditoria e políticas de protecção de dados pessoais.
