#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-http://127.0.0.1:8000/ussd.php}"
PHONE="+258840000001"
SESSION="test-session-001"

post() {
  curl -s -X POST "$BASE_URL" \
    -d "sessionId=$SESSION" \
    -d "serviceCode=*384*123#" \
    -d "phoneNumber=$PHONE" \
    -d "text=$1"
  printf '\n---\n'
}

echo "1) Menu inicial"
post ""

echo "2) Escolher Denunciar lixo"
post "1"

echo "3) Escolher Hulene"
post "1*1"

echo "4) Escolher Lixo acumulado"
post "1*1*1"

echo "5) Informar ponto de referência"
post "1*1*1*Perto do Mercado"

echo "6) Confirmar"
post "1*1*1*Perto do Mercado*1"
