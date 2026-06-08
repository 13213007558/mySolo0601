import { db } from '../db/init';
import { Baby } from '../../shared/types';

function mapBaby(row: any): Baby {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    classId: row.class_id,
    className: row.class_name,
    allergyHistory: row.allergy_history,
    parentPhone: row.parent_phone,
    address: row.address,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function getBabiesByClassId(classId: string): Baby[] {
  const sql = `
    SELECT b.*, c.name as class_name
    FROM babies b
    LEFT JOIN classes c ON b.class_id = c.id
    WHERE b.class_id = ?
    ORDER BY b.name
  `;
  const rows = db.prepare(sql).all(classId);
  return rows.map(mapBaby);
}

export function getBabyById(id: string): Baby | null {
  const sql = `
    SELECT b.*, c.name as class_name
    FROM babies b
    LEFT JOIN classes c ON b.class_id = c.id
    WHERE b.id = ?
  `;
  const row = db.prepare(sql).get(id);
  return row ? mapBaby(row) : null;
}

export function getAllBabies(): Baby[] {
  const sql = `
    SELECT b.*, c.name as class_name
    FROM babies b
    LEFT JOIN classes c ON b.class_id = c.id
    ORDER BY b.name
  `;
  const rows = db.prepare(sql).all();
  return rows.map(mapBaby);
}
