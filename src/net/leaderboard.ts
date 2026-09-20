import { LEADERBOARD_TOTAL, LEADERBOARD_WEEKLY } from './config';
import { connect, getClient, getSession } from './client';

/** За что засчитана победа. Набор должен совпадать с VALID_KINDS в leaderboards.lua. */
export type WinKind = 'bot' | 'boss' | 'pvp';

export type BoardId = typeof LEADERBOARD_TOTAL | typeof LEADERBOARD_WEEKLY;

export interface LeaderboardRow {
  rank: number;
  username: string;
  score: number;
  own: boolean;
}

/**
 * Победа засчитывается только через серверный RPC: лидерборды authoritative,
 * прямую запись счёта Nakama отклоняет. Величину прибавки задаёт сервер.
 *
 * Функция намеренно не бросает исключений — проигранная сетевая запись
 * не должна ломать экран победы.
 */
export async function recordWin(kind: WinKind): Promise<boolean> {
  try {
    const ok = await connect();
    const client = getClient();
    const session = getSession();
    if (!ok || !client || !session) return false;

    await client.rpc(session, 'record_win', { kind });
    return true;
  } catch (err) {
    console.warn('[leaderboard] победу записать не удалось:', err);
    return false;
  }
}

export async function loadLeaderboard(board: BoardId, limit = 20): Promise<LeaderboardRow[]> {
  try {
    const ok = await connect();
    const client = getClient();
    const session = getSession();
    if (!ok || !client || !session) return [];

    const list = await client.listLeaderboardRecords(session, board, undefined, limit);
    const ownId = session.user_id;

    return (list.records ?? []).map((r, index) => ({
      // rank приходит строкой; если рангов нет — падаем обратно на позицию в списке
      rank: Number(r.rank ?? index + 1) || index + 1,
      username: r.username ?? 'неизвестный',
      score: Number(r.score ?? 0) || 0,
      own: r.owner_id === ownId
    }));
  } catch (err) {
    console.warn('[leaderboard] таблицу загрузить не удалось:', err);
    return [];
  }
}

export const BOARDS: ReadonlyArray<{ id: BoardId; label: string }> = [
  { id: LEADERBOARD_TOTAL, label: 'За всё время' },
  { id: LEADERBOARD_WEEKLY, label: 'За неделю' }
];
