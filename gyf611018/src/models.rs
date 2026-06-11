use serde::{Deserialize, Serialize};
use chrono::{DateTime, Local, NaiveDate};
use uuid::Uuid;
use crate::waveform::{WaveformData, WaveformAnalysis};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ShiftType {
    Morning,
    Afternoon,
    Night,
}

impl ShiftType {
    pub fn label(&self) -> &'static str {
        match self {
            ShiftType::Morning => "早班",
            ShiftType::Afternoon => "午班",
            ShiftType::Night => "夜班",
        }
    }

    pub fn current() -> Self {
        let now = Local::now();
        let hour = now.hour();
        match hour {
            6..=13 => ShiftType::Morning,
            14..=21 => ShiftType::Afternoon,
            _ => ShiftType::Night,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DetectionStatus {
    Normal,
    Warning,
    Critical,
    PendingRecheck,
    RecheckPassed,
    Repaired,
}

impl DetectionStatus {
    pub fn label(&self) -> &'static str {
        match self {
            DetectionStatus::Normal => "正常",
            DetectionStatus::Warning => "警告",
            DetectionStatus::Critical => "异常",
            DetectionStatus::PendingRecheck => "待复检",
            DetectionStatus::RecheckPassed => "复检通过",
            DetectionStatus::Repaired => "已返修",
        }
    }

    pub fn is_alert(&self) -> bool {
        matches!(self, DetectionStatus::Critical | DetectionStatus::Warning)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectionRecord {
    pub id: Uuid,
    pub movement_id: String,
    pub waveform_data: WaveformData,
    pub analysis: WaveformAnalysis,
    pub status: DetectionStatus,
    pub shift: ShiftType,
    pub shift_date: NaiveDate,
    pub operator: String,
    pub created_at: DateTime<Local>,
    pub is_recheck: bool,
    pub recheck_of: Option<Uuid>,
    pub notes: Option<String>,
}

impl DetectionRecord {
    pub fn new(
        movement_id: String,
        waveform_data: WaveformData,
        analysis: WaveformAnalysis,
        operator: String,
    ) -> Self {
        let now = Local::now();
        let status = if analysis.is_below_threshold {
            DetectionStatus::Critical
        } else {
            DetectionStatus::Normal
        };

        Self {
            id: Uuid::new_v4(),
            movement_id,
            waveform_data,
            analysis,
            status,
            shift: ShiftType::current(),
            shift_date: now.date_naive(),
            operator,
            created_at: now,
            is_recheck: false,
            recheck_of: None,
            notes: None,
        }
    }

    pub fn is_alert(&self) -> bool {
        self.status.is_alert()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepairRequest {
    pub id: Uuid,
    pub detection_record_id: Uuid,
    pub movement_id: String,
    pub amplitude: f64,
    pub threshold: f64,
    pub reason: String,
    pub status: RepairStatus,
    pub created_at: DateTime<Local>,
    pub approved_at: Option<DateTime<Local>>,
    pub approved_by: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RepairStatus {
    Pending,
    Approved,
    Rejected,
    Completed,
}

impl RepairStatus {
    pub fn label(&self) -> &'static str {
        match self {
            RepairStatus::Pending => "待审批",
            RepairStatus::Approved => "已批准",
            RepairStatus::Rejected => "已拒绝",
            RepairStatus::Completed => "已完成",
        }
    }
}

impl RepairRequest {
    pub fn from_record(record: &DetectionRecord) -> Self {
        Self {
            id: Uuid::new_v4(),
            detection_record_id: record.id,
            movement_id: record.movement_id.clone(),
            amplitude: record.analysis.amplitude,
            threshold: record.analysis.threshold,
            reason: format!(
                "振幅低于阈值: {:.2}° < {:.2}°",
                record.analysis.amplitude, record.analysis.threshold
            ),
            status: RepairStatus::Pending,
            created_at: Local::now(),
            approved_at: None,
            approved_by: None,
            notes: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShiftSummary {
    pub date: NaiveDate,
    pub shift: ShiftType,
    pub total_count: usize,
    pub normal_count: usize,
    pub alert_count: usize,
    pub recheck_count: usize,
    pub repair_count: usize,
    pub avg_amplitude: f64,
    pub min_amplitude: f64,
    pub max_amplitude: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub amplitude_threshold: f64,
    pub sample_rate: f64,
    pub window_size: usize,
    pub recording_duration_ms: u64,
    pub operator: String,
    pub brand_code: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            amplitude_threshold: 220.0,
            sample_rate: 44100.0,
            window_size: 2048,
            recording_duration_ms: 5000,
            operator: "".to_string(),
            brand_code: "BRAND-A".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrandExportRecord {
    pub record_id: String,
    pub movement_id: String,
    pub detection_time: String,
    pub shift: String,
    pub amplitude: f64,
    pub frequency: f64,
    pub beat_error: f64,
    pub result: String,
    pub operator: String,
    pub brand_code: String,
    pub waveform_hash: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::waveform::WaveformData;

    #[test]
    fn test_shift_type_current() {
        let shift = ShiftType::current();
        match shift {
            ShiftType::Morning | ShiftType::Afternoon | ShiftType::Night => (),
        }
    }

    #[test]
    fn test_detection_status_alert() {
        assert!(DetectionStatus::Critical.is_alert());
        assert!(DetectionStatus::Warning.is_alert());
        assert!(!DetectionStatus::Normal.is_alert());
    }
}
