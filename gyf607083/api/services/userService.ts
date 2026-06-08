import { db } from '../db/init';
import { User, UserRole } from '../../shared/types';

function mapUser(row: any): User {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    name: row.name,
    createdAt: row.created_at
  };
}

export function getAllUsers(): User[] {
  const rows = db.prepare('SELECT id, username, role, name, created_at FROM users ORDER BY name').all();
  return rows.map(mapUser);
}

export function getUserById(id: string): User | null {
  const row = db.prepare('SELECT id, username, role, name, created_at FROM users WHERE id = ?').get(id);
  return row ? mapUser(row) : null;
}

export function getUserByUsername(username: string): User | null {
  const row = db.prepare('SELECT id, username, role, name, created_at FROM users WHERE username = ?').get(username);
  return row ? mapUser(row) : null;
}

export function getUsersByRole(role: UserRole): User[] {
  const rows = db.prepare('SELECT id, username, role, name, created_at FROM users WHERE role = ? ORDER BY name').all(role);
  return rows.map(mapUser);
}
