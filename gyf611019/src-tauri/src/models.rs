use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordInfo {
    pub id: String,
    pub seller_id: String,
    pub seller_name: String,
    pub record_no: String,
    pub record_title: String,
    pub artist: String,
    pub original_price: f64,
    pub weight: f64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GrooveImage {
    pub id: String,
    pub record_id: String,
    pub image_data: String,
    pub width: i32,
    pub height: i32,
    pub uploaded_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WearAnalysis {
    pub score: i32,
    pub groove_depth_loss: i32,
    pub scratch_density: i32,
    pub noise_level: i32,
    pub suggestion: String,
    pub needs_review: bool,
    pub confidence: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapturedImage {
    pub image_data: String,
    pub width: i32,
    pub height: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InspectionItem {
    pub id: String,
    pub record: RecordInfo,
    pub image: Option<GrooveImage>,
    pub analysis: Option<WearAnalysis>,
    pub final_price: f64,
    pub status: String,
    pub reviewed_by: Option<String>,
    pub reviewed_at: Option<String>,
    pub position: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SellerDispute {
    pub seller_name: String,
    pub count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisputeReport {
    pub id: String,
    pub date_range: [String; 2],
    pub total_records: i32,
    pub scrap_count: i32,
    pub regenerate_count: i32,
    pub disputed_count: i32,
    pub average_score: f64,
    pub seller_disputes: Vec<SellerDispute>,
}
