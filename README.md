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
mobile/               App mobile React Native + Expo (modo offline)
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

## App Mobile (React Native + Expo)

A pasta `mobile/` contém a versão Android do protótipo. Funciona **totalmente offline**
usando AsyncStorage e replica o fluxo USSD com ecrãs nativos. Inclui também um
**simulador USSD** interno que reproduz o comportamento do backend PHP sem precisar
de rede.

### Pré-requisitos

- Node.js 18+ (recomendado 20, igual ao `eas.json`)
- Expo Go instalado no Android (Play Store) — só para testes via QR
- Conta Expo gratuita em https://expo.dev — só para gerar APK

### Estrutura do `mobile/`

```text
mobile/
├── App.tsx                  raiz da app (providers)
├── index.js                 bootstrap Expo
├── app.json                 config Expo (ícone, splash, Android pkg, ATS)
├── eas.json                 perfis de build (preview/production/ios)
├── assets/                  ícone, splash, adaptive icon
├── scripts/
│   ├── generate_assets.py   regenera os PNGs placeholder
│   ├── smoke_ussd.ts        testes do motor USSD (lógica pura)
│   ├── smoke_db.ts          testes da camada de base de dados
│   └── stub_async_storage.cjs  mock para correr smoke_db em Node
└── src/
    ├── components/          Button, Card, InfoRow, Screen, StatusBadge
    ├── context/             ReportsProvider (estado global)
    ├── data/catalog.ts      bairros, tipos, estados, service code
    ├── navigation/          RootNavigator (tabs + stack)
    ├── screens/             Home, Reports, ReportDetail, Info, UssdSimulator
    ├── storage/database.ts  CRUD em AsyncStorage
    ├── ussd/engine.ts       motor USSD (espelho do UssdService.php)
    ├── theme.ts             cores, espaçamentos, tipografia
    └── types.ts             tipos partilhados
```

### 1. Rodar localmente em desenvolvimento (Expo Go)

```bash
cd mobile
npm install
npm start          # sobe Metro Bundler e mostra QR
```

No terminal do Expo aparece um QR code. Abrir a app **Expo Go** no Android, tocar em
"Scan QR code" e apontar para o QR. A app é carregada directamente no telemóvel
(garantir que PC e telemóvel estão na mesma Wi-Fi).

Alternativas:
- `npm run android` — lança em AVD/emulador local (precisa Android Studio + SDK)
- `npm run ios` — emulador iOS (precisa Xcode, só macOS)
- `npm run web` — abre no browser (limitado; sem Native bridge real)

> **Nota em redes corporativas**: se o `expo start` der `fetch failed`, o PC não
> consegue chegar aos servidores deles. Em ambiente isolado usar:
> `EXPO_OFFLINE=1 npx expo start -c`.

### 2. Validar o código sem dispositivo

```bash
npm run typecheck                           # tsc --noEmit (strict)
npx tsx scripts/smoke_ussd.ts               # 13 cenários do motor USSD
npx tsx -r ./scripts/stub_async_storage.cjs scripts/smoke_db.ts   # 9 cenários da BD
```

Ambos os smoke-tests devem terminar com `Todos os smoke-tests passaram ✅`.

### 3. Gerar APK para o cliente testar (sem Android SDK local)

A Expo compila na cloud; o teu PC só precisa de Node + conta Expo.

```bash
cd mobile
npm install
npx eas-cli login            # abrir browser e autenticar
npx eas-cli init             # cria eas.projectId e actualiza app.json
npm run build:android        # perfil preview → APK
```

O `eas build` envia o código para os servidores da Expo. Demora ~10-15 min e o
terminal devolve um link directo para o `.apk`:

```text
✔ Build finished 🤖 Android app:
  https://expo.dev/artifacts/eas/xxxxx.apk
```

O cliente descarrega esse `.apk` no telemóvel Android → autoriza "Instalar de fontes
desconhecidas" → instala.

### 4. Build Android local (precisa SDK)

Requer JDK 17 + Android SDK (platform-tools, `platforms;android-34`,
`build-tools;34.0.0`). O proxy corporativo a cortar downloads longos (>30 MB) do
Google torna este caminho difícil em portáteis empresariais — preferir EAS.

```bash
npm run prebuild            # gera android/ a partir do app.json
npm run build:local:android # gradlew :app:assembleRelease
# APK em android/app/build/outputs/apk/release/app-release.apk
```

### 5. Funcionalidades da app

**Navegação:** 3 tabs (Início, Denúncias, Info) + 2 stack screens (Detalhe, Simulador).

**Início (HomeScreen):**
- Menu principal com 4 opções (1 Denunciar / 2 Consultar / 3 Info / 4 Sair)
- Wizard de denúncia: bairro (5 + Outro) → tipo (5 + Outro) → ponto de referência → confirmar
- Consultar por código `DLX-...`
- Ecrã de sucesso com código, botão "Ver detalhes" e "Nova denúncia"
- Atalho para o Simulador USSD

**Denúncias (ReportsScreen):**
- Lista em `FlatList` com código, bairro, tipo, ponto de referência, origem, data
- Filtros por estado (chips): Todos +6 estados

**Detalhe (ReportDetailScreen):**
- Todos os campos + linha do tempo do histórico de mudanças
- Edição de estado com nota opcional → cria entrada automática no histórico

**Info (InfoScreen):**
- Sobre o sistema
- Estatísticas locais (totais, por estado, top 10 bairros)
- Botão "Limpar base local" (reseta AsyncStorage)

**Simulador USSD (UssdSimulatorScreen):**
- Ecrã monocromático verde estilo telemóvel
- **Modo "Motor local"** — executa o motor USSD em TypeScript, idêntico ao `UssdService.php`, sem rede
- **Modo "Servidor PHP"** — `POST` para `ussd.php` (compatível Africa's Talking). Em Android Emulator usar `http://10.0.2.2:8000/ussd.php`; em dispositivo físico, o IP do PC (ex.: `http://192.168.1.10:8000/ussd.php`)
- Histórico da sessão (entrada/saída + CON vs END)

### 6. Testar a app passo a passo (no Expo Go ou APK)

1. Abrir a app. Aparece o **Menu Principal** com o `service code *384*73407#`.
2. **Criar denúncia:**
   - Tocar em **"1. Denunciar lixo"**.
   - Escolher um bairro (ex.: `1` Hulene).
   - Escolher um tipo (ex.: `1` Lixo Acumulado).
   - Digitar um ponto de referência (ex.: `perto do mercado`).
   - Tocar em **"1. Confirmar"**.
   - Aparece o ecrã verde com o código gerado (formato `DLX-YYMMDD-XXXXXX`).
   - Tocar em **"Ver detalhes da denúncia"** para ver toda a informação + histórico.
3. **Consultar denúncia:**
   - Voltar ao menu principal.
   - Tocar em **"2. Consultar denúncia"**.
   - Digitar o código (em maiúsculas, com ou sem espaços).
   - Ver estado, bairro, tipo e data de registo.
4. **Mudar estado de uma denúncia:**
   - Ir à tab **Denúncias** → escolher uma denúncia.
   - Tocar num dos chips de estado (ex.: `Em Análise`).
   - Opcionalmente escrever uma observação.
   - Tocar em **"Guardar actualização"** → cria entrada nova no histórico.
5. **Ver estatísticas:**
   - Tab **Info** → ver totais por estado e top bairros.
6. **Limpar base local:**
   - Tab **Info** → **"Limpar base local"** (acção irreversível no dispositivo).
7. **Simulador USSD (modo Motor Local):**
   - No menu principal, tocar em **"Abrir simulador USSD"**.
   - Digitar `1` → escolher bairro → escolher tipo → texto livre → `1` para confirmar.
   - O ecrã monocromático mostra passo a passo a sessão USSD.

### 7. Modo USSD "Servidor PHP" (avançado)

Se quiseres testar a integração com o backend PHP local:

1. Noutro terminal, na raiz do projecto:
   ```bash
   php -S 0.0.0.0:8000 -t public
   ```
2. Abrir a app, ir ao Simulador USSD, mudar o modo para **"Servidor PHP"**.
3. URL por defeito: `http://10.0.2.2:8000/ussd.php` (no emulador Android) ou
   `http://<IP-DO-PC>:8000/ussd.php` (em dispositivo físico).

> O modo "Servidor PHP" **não** partilha dados com o "Motor local" — cada canal tem
> a sua própria base (PHP usa SQLite, app usa AsyncStorage).

### 8. Comandos úteis

```bash
npm run typecheck           # validação TypeScript
npm run lint                # placeholder
npm run prebuild            # gera android/ + ios/
npm run build:android       # APK via EAS (preview)
npm run build:android:prod  # AAB via EAS (production, Play Store)
npm run build:ios           # iOS via EAS
npm run build:local:android # APK local via gradlew
```

### Observação académica

A app é **offline-first**. Para sincronização com o backend PHP seria necessário
adicionar uma camada HTTP (ex.: sincronizar ao abrir a app, fila de envio, etc.) —
hoje não é prioridade do protótipo. O motor USSD local é fiel à versão PHP e foi
validado com 13 cenários de smoke-test (`scripts/smoke_ussd.ts`).
