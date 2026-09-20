--[[
  Серверный модуль Nakama для «Друзья Файтинг».

  Зачем он нужен: лидерборды здесь authoritative, то есть клиент физически не может
  записать в них произвольный счёт. Единственный путь наверх — RPC record_win,
  который всегда прибавляет ровно 1. Браузер остаётся недоверенной средой
  (накрутить можно повторными вызовами), но выставить себе 9999 одной записью уже нельзя.
]]

local nk = require("nakama")

local LB_TOTAL = "wins_total"
local LB_WEEKLY = "wins_weekly"

-- enable_ranks = true обязателен: без него Nakama не вычисляет места,
-- и в таблице неоткуда взять номер строки.
-- leaderboard_create идемпотентен — существующий лидерборд не трогается.
nk.leaderboard_create(LB_TOTAL, true, "desc", "incr", nil, {}, true)
nk.leaderboard_create(LB_WEEKLY, true, "desc", "incr", "0 0 * * 1", {}, true)

local VALID_KINDS = { bot = true, boss = true, pvp = true }

local function record_win(context, payload)
  if context.user_id == nil or context.user_id == "" then
    error("unauthenticated")
  end

  local decoded, input = pcall(nk.json_decode, payload)
  local kind = nil
  if decoded and type(input) == "table" then
    kind = input.kind
  end
  if not VALID_KINDS[kind] then
    error("unknown win kind")
  end

  -- username аккаунта технический (ASCII-логин от device id), показывать его нельзя.
  -- В таблицу пишем display_name, а на username откатываемся, только если имя пустое.
  local shown = context.username or ""
  local ok_users, users = pcall(nk.users_get_id, { context.user_id })
  if ok_users and users and users[1] and users[1].display_name and users[1].display_name ~= "" then
    shown = users[1].display_name
  end

  local username = shown
  local metadata = { kind = kind }

  -- Величину прибавки задаёт сервер, а не клиент.
  nk.leaderboard_record_write(LB_TOTAL, context.user_id, username, 1, 0, metadata)
  nk.leaderboard_record_write(LB_WEEKLY, context.user_id, username, 1, 0, metadata)

  return nk.json_encode({ success = true, kind = kind })
end

nk.register_rpc(record_win, "record_win")
