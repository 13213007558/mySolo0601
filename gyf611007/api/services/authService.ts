import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";
import { type User, type SessionUser } from "../types.js";

const SESSION_TTL_HOURS = 24;

export function createSession(userId: number): string {
  const sessionId = uuidv4();
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000
  ).toISOString();

  db.prepare(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)"
  ).run(sessionId, userId, expiresAt);

  return sessionId;
}

export function getSessionUser(sessionId: string | undefined): SessionUser | null {
  if (!sessionId) return null;

  const row = db
    .prepare(
      `SELECT u.id, u.username, u.role, u.display_name, s.expires_at
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`
    )
    .get(sessionId) as (User & { expires_at: string }) | undefined;

  if (!row) return null;

  if (new Date(row.expires_at) < new Date()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    role: row.role,
    display_name: row.display_name,
  };
}

export function destroySession(sessionId: string): void {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}
