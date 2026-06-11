use crate::models::{InspectionItem, RecordInfo, GrooveImage, WearAnalysis};
use rusqlite::{params, Connection, OptionalExtension};
use std::path::PathBuf;

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new() -> Result<Self, String> {
        let path = Self::db_path()?;
        let conn = Connection::open(&path).map_err(|e| e.to_string())?;
        let db = Self { conn };
        db.init_tables()?;
        Ok(db)
    }

    fn db_path() -> Result<PathBuf, String> {
        let mut path = dirs_data();
        path.push("vinyl_groove_microscope");
        std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
        path.push("data.db");
        Ok(path)
    }

    fn init_tables(&self) -> Result<(), String> {
        self.conn
            .execute_batch(
                r#"
                CREATE TABLE IF NOT EXISTS records (
                    id TEXT PRIMARY KEY,
                    seller_id TEXT NOT NULL,
                    seller_name TEXT NOT NULL,
                    record_no TEXT NOT NULL,
                    record_title TEXT NOT NULL,
                    artist TEXT NOT NULL,
                    original_price REAL NOT NULL,
                    weight REAL NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS images (
                    id TEXT PRIMARY KEY,
                    record_id TEXT NOT NULL,
                    image_data TEXT NOT NULL,
                    width INTEGER NOT NULL,
                    height INTEGER NOT NULL,
                    uploaded_at TEXT NOT NULL,
                    FOREIGN KEY (record_id) REFERENCES records(id)
                );

                CREATE TABLE IF NOT EXISTS analyses (
                    id TEXT PRIMARY KEY,
                    record_id TEXT NOT NULL,
                    score INTEGER NOT NULL,
                    groove_depth_loss INTEGER NOT NULL,
                    scratch_density INTEGER NOT NULL,
                    noise_level INTEGER NOT NULL,
                    suggestion TEXT NOT NULL,
                    needs_review INTEGER NOT NULL,
                    confidence INTEGER NOT NULL,
                    FOREIGN KEY (record_id) REFERENCES records(id)
                );

                CREATE TABLE IF NOT EXISTS inspections (
                    id TEXT PRIMARY KEY,
                    record_id TEXT NOT NULL,
                    image_id TEXT,
                    analysis_id TEXT,
                    final_price REAL NOT NULL,
                    status TEXT NOT NULL,
                    reviewed_by TEXT,
                    reviewed_at TEXT,
                    position INTEGER NOT NULL,
                    FOREIGN KEY (record_id) REFERENCES records(id),
                    FOREIGN KEY (image_id) REFERENCES images(id),
                    FOREIGN KEY (analysis_id) REFERENCES analyses(id)
                );

                CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
                CREATE INDEX IF NOT EXISTS idx_records_no ON records(record_no);
                "#,
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn save_inspection(&self, item: &InspectionItem) -> Result<(), String> {
        let tx = self.conn.unchecked_transaction().map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT OR REPLACE INTO records (id, seller_id, seller_name, record_no, record_title, artist, original_price, weight, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                item.record.id,
                item.record.seller_id,
                item.record.seller_name,
                item.record.record_no,
                item.record.record_title,
                item.record.artist,
                item.record.original_price,
                item.record.weight,
                item.record.created_at,
            ],
        ).map_err(|e| e.to_string())?;

        if let Some(img) = &item.image {
            tx.execute(
                "INSERT OR REPLACE INTO images (id, record_id, image_data, width, height, uploaded_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![img.id, item.record.id, img.image_data, img.width, img.height, img.uploaded_at],
            ).map_err(|e| e.to_string())?;
        }

        if let Some(a) = &item.analysis {
            tx.execute(
                "INSERT OR REPLACE INTO analyses (id, record_id, score, groove_depth_loss, scratch_density, noise_level, suggestion, needs_review, confidence) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![
                    format!("a-{}", item.record.id),
                    item.record.id,
                    a.score,
                    a.groove_depth_loss,
                    a.scratch_density,
                    a.noise_level,
                    a.suggestion,
                    a.needs_review as i32,
                    a.confidence,
                ],
            ).map_err(|e| e.to_string())?;
        }

        tx.execute(
            "INSERT OR REPLACE INTO inspections (id, record_id, image_id, analysis_id, final_price, status, reviewed_by, reviewed_at, position) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                item.id,
                item.record.id,
                item.image.as_ref().map(|i| i.id.clone()),
                item.analysis.as_ref().map(|_| format!("a-{}", item.record.id)),
                item.final_price,
                item.status,
                item.reviewed_by,
                item.reviewed_at,
                item.position,
            ],
        ).map_err(|e| e.to_string())?;

        tx.commit().map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_inspections(&self) -> Result<Vec<InspectionItem>, String> {
        let mut stmt = self
            .conn
            .prepare(
                r#"
                SELECT i.id, i.final_price, i.status, i.reviewed_by, i.reviewed_at, i.position,
                       r.id, r.seller_id, r.seller_name, r.record_no, r.record_title, r.artist, r.original_price, r.weight, r.created_at,
                       img.id, img.image_data, img.width, img.height, img.uploaded_at,
                       a.score, a.groove_depth_loss, a.scratch_density, a.noise_level, a.suggestion, a.needs_review, a.confidence
                FROM inspections i
                JOIN records r ON i.record_id = r.id
                LEFT JOIN images img ON i.image_id = img.id
                LEFT JOIN analyses a ON a.record_id = r.id
                ORDER BY i.position ASC
                "#,
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([], |row| {
                let record = RecordInfo {
                    id: row.get(6)?,
                    seller_id: row.get(7)?,
                    seller_name: row.get(8)?,
                    record_no: row.get(9)?,
                    record_title: row.get(10)?,
                    artist: row.get(11)?,
                    original_price: row.get(12)?,
                    weight: row.get(13)?,
                    created_at: row.get(14)?,
                };

                let image_id: Option<String> = row.get(15).ok();
                let image = if image_id.is_some() {
                    Some(GrooveImage {
                        id: image_id.unwrap(),
                        record_id: record.id.clone(),
                        image_data: row.get(16)?,
                        width: row.get(17)?,
                        height: row.get(18)?,
                        uploaded_at: row.get(19)?,
                    })
                } else {
                    None
                };

                let has_analysis: Option<i32> = row.get(20).optional().ok().flatten();
                let analysis = if has_analysis.is_some() {
                    Some(WearAnalysis {
                        score: row.get(20)?,
                        groove_depth_loss: row.get(21)?,
                        scratch_density: row.get(22)?,
                        noise_level: row.get(23)?,
                        suggestion: row.get(24)?,
                        needs_review: row.get::<_, i32>(25)? != 0,
                        confidence: row.get(26)?,
                    })
                } else {
                    None
                };

                Ok(InspectionItem {
                    id: row.get(0)?,
                    record,
                    image,
                    analysis,
                    final_price: row.get(1)?,
                    status: row.get(2)?,
                    reviewed_by: row.get(3).ok(),
                    reviewed_at: row.get(4).ok(),
                    position: row.get(5)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut items = Vec::new();
        for row in rows {
            items.push(row.map_err(|e| e.to_string())?);
        }
        Ok(items)
    }

    pub fn confirm_scrap(&self, item_id: &str, reviewer: &str) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE inspections SET status = 'completed', reviewed_by = ?1, reviewed_at = ?2 WHERE id = ?3",
                params![reviewer, chrono::Utc::now().to_rfc3339(), item_id],
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }
}

fn dirs_data() -> PathBuf {
    if let Some(home) = std::env::var_os("HOME") {
        let mut p = PathBuf::from(home);
        p.push(".local");
        p.push("share");
        return p;
    }
    PathBuf::from("/tmp")
}
