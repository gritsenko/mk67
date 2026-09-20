#!/usr/bin/env bash
#
# Проверка, что бэкенд действительно работает — а не просто «процессы запущены».
# Удобно запускать после перезагрузки сервера.
#
# Установка:  sudo cp healthcheck.sh /opt/nakama/ && sudo chmod +x /opt/nakama/healthcheck.sh
# Запуск:     /opt/nakama/healthcheck.sh
#
# Почему --resolve: с самого сервера обращение на внешний IP уходит на роутер и
# возвращается обратно (hairpin NAT), что работает через раз. Резолвим домен в
# localhost — TLS при этом проверяется по-настоящему, по имени из сертификата.

set -uo pipefail

COMPOSE_DIR=/opt/nakama
DOMAIN=dev.gritsenko.biz
BASE="https://${DOMAIN}/game_api"
PROBE_DEVICE="healthcheck-probe-0000-1111-2222-3333"

ok=0
fail=0

green() { printf '  \033[32mOK\033[0m   %s\n' "$1"; ok=$((ok + 1)); }
red()   { printf '  \033[31mFAIL\033[0m %s\n' "$1"; fail=$((fail + 1)); }

echo "== Службы =="
systemctl is-active --quiet nginx && green "nginx запущен" || red "nginx не запущен"
systemctl is-active --quiet docker && green "docker запущен" || red "docker не запущен"

for c in nakama nakama-postgres; do
  status=$(sudo docker inspect -f '{{.State.Health.Status}}' "$c" 2>/dev/null)
  if [ "$status" = "healthy" ]; then green "контейнер $c: healthy"
  else red "контейнер $c: ${status:-не найден}"; fi
done

echo
echo "== Доступность API =="
code=$(curl -s -m 10 --resolve "${DOMAIN}:443:127.0.0.1" -o /dev/null -w '%{http_code}' "${BASE}/healthcheck")
[ "$code" = "200" ] && green "healthcheck отвечает 200" || red "healthcheck вернул ${code:-нет ответа}"

KEY=$(sudo grep NAKAMA_SERVER_KEY "${COMPOSE_DIR}/.env" 2>/dev/null | cut -d= -f2)
if [ -z "$KEY" ]; then
  red "не удалось прочитать ключ сервера из ${COMPOSE_DIR}/.env"
else
  TOKEN=$(curl -s -m 15 --resolve "${DOMAIN}:443:127.0.0.1" \
    -X POST "${BASE}/v2/account/authenticate/device?create=true" \
    -H 'Content-Type: application/json' -u "${KEY}:" \
    -d "{\"id\":\"${PROBE_DEVICE}\"}" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

  if [ -n "$TOKEN" ]; then
    green "авторизация проходит"

    # WebSocket идёт по тому же 443 с Upgrade — отдельного порта у него нет.
    upgrade=$(curl -s -i -m 10 --resolve "${DOMAIN}:443:127.0.0.1" --http1.1 \
      -H 'Connection: Upgrade' -H 'Upgrade: websocket' \
      -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' \
      "${BASE}/ws?lang=en&status=true&token=${TOKEN}" | head -1)
    case "$upgrade" in
      *101*) green "websocket поднимается (101)" ;;
      *)     red "websocket не поднялся: ${upgrade:-нет ответа}" ;;
    esac

    board=$(curl -s -m 10 --resolve "${DOMAIN}:443:127.0.0.1" \
      "${BASE}/v2/leaderboard/wins_total?limit=1" -H "Authorization: Bearer ${TOKEN}")
    case "$board" in
      *error*|'') red "лидерборд не отвечает: ${board:-пусто}" ;;
      *)          green "лидерборд wins_total доступен" ;;
    esac

    # Пробный аккаунт в базе не оставляем.
    sudo docker compose -f "${COMPOSE_DIR}/docker-compose.yml" exec -T postgres \
      psql -U postgres -d nakama -tc \
      "delete from users where id in (select user_id from user_device where id='${PROBE_DEVICE}');" \
      > /dev/null 2>&1
  else
    red "авторизация не прошла"
  fi
fi

echo
echo "== Сертификат =="
days=$(echo | openssl s_client -connect 127.0.0.1:443 -servername "$DOMAIN" 2>/dev/null \
  | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -n "$days" ]; then
  left=$(( ( $(date -d "$days" +%s) - $(date +%s) ) / 86400 ))
  [ "$left" -gt 14 ] && green "сертификат действует ещё ${left} дн." \
                     || red "сертификат истекает через ${left} дн."
else
  red "не удалось прочитать сертификат"
fi

echo
if [ "$fail" -eq 0 ]; then
  printf '\033[32mВсё работает\033[0m (проверок: %s)\n' "$ok"
else
  printf '\033[31mЕсть проблемы: %s из %s\033[0m\n' "$fail" "$((ok + fail))"
  echo "Логи: cd ${COMPOSE_DIR} && sudo docker compose logs --tail=50 nakama"
fi

exit "$fail"
