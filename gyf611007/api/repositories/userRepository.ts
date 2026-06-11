import bcrypt from "bcryptjs";
import { db } from "../db.js";
import { type User, type UserRole } from "../types.js";

export function findUserByUsername(username: string): User | undefined {
  return db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as User | undefined;
}

export function findUserById(id: number): User | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | User
    | undefined;
}

export function verifyPassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.password_hash);
}

export function getUsersByRole(role: UserRole): User[] {
  return db
    .prepare("SELECT id, username, display_name, role FROM users WHERE role = ?")
    .all(role) as User[];
}
