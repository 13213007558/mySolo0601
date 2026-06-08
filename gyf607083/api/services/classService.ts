import { db } from '../db/init';
import { Class, ClassWithStats } from '../../shared/types';

function mapClass(row: any): Class {
  return {
    id: row.id,
    name: row.name,
    teacherName: row.teacher_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function getAllClasses(): Class[] {
  const rows = db.prepare('SELECT * FROM classes ORDER BY name').all();
  return rows.map(mapClass);
}

export function getAllClassesWithStats(): ClassWithStats[] {
  const sql = `
    SELECT 
      c.*,
      COUNT(DISTINCT b.id) as baby_count,
      SUM(CASE WHEN sr.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN sr.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
      SUM(CASE WHEN sr.status IN ('pending', 'rejected') THEN 1 ELSE 0 END) as exception_count
    FROM classes c
    LEFT JOIN babies b ON c.id = b.class_id
    LEFT JOIN supply_records sr ON b.id = sr.baby_id
    GROUP BY c.id
    ORDER BY c.name
  `;
  
  const rows = db.prepare(sql).all();
  return rows.map((row: any) => ({
    ...mapClass(row),
    babyCount: row.baby_count || 0,
    pendingCount: row.pending_count || 0,
    rejectedCount: row.rejected_count || 0,
    exceptionCount: row.exception_count || 0
  }));
}

export function getClassById(id: string): Class | null {
  const row = db.prepare('SELECT * FROM classes WHERE id = ?').get(id);
  return row ? mapClass(row) : null;
}

export function getClassStats(classId: string): Omit<ClassWithStats, keyof Class> | null {
  const sql = `
    SELECT 
      COUNT(DISTINCT b.id) as baby_count,
      SUM(CASE WHEN sr.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN sr.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
      SUM(CASE WHEN sr.status IN ('pending', 'rejected') THEN 1 ELSE 0 END) as exception_count
    FROM classes c
    LEFT JOIN babies b ON c.id = b.class_id
    LEFT JOIN supply_records sr ON b.id = sr.baby_id
    WHERE c.id = ?
    GROUP BY c.id
  `;
  
  const row: any = db.prepare(sql).get(classId);
  if (!row) return null;
  
  return {
    babyCount: row.baby_count || 0,
    pendingCount: row.pending_count || 0,
    rejectedCount: row.rejected_count || 0,
    exceptionCount: row.exception_count || 0
  };
}
