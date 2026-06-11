use serde::{Deserialize, Serialize};
use gloo_storage::{LocalStorage, Storage};
use chrono::NaiveDate;
use crate::models::{DetectionRecord, RepairRequest, AppSettings, ShiftSummary, ShiftType, DetectionStatus};
use crate::waveform::WaveformData;

const STORAGE_KEY_RECORDS: &str = "detection_records";
const STORAGE_KEY_REPAIRS: &str = "repair_requests";
const STORAGE_KEY_SETTINGS: &str = "app_settings";

pub fn load_records() -> Vec<DetectionRecord> {
    LocalStorage::get::<Vec<DetectionRecord>>(STORAGE_KEY_RECORDS)
        .unwrap_or_default()
}

pub fn save_records(records: &[DetectionRecord]) -> Result<(), String> {
    LocalStorage::set(STORAGE_KEY_RECORDS, records)
        .map_err(|e| e.to_string())
}

pub fn add_record(record: &DetectionRecord) -> Result<(), String> {
    let mut records = load_records();
    records.insert(0, record.clone());
    save_records(&records)
}

pub fn update_record(record: &DetectionRecord) -> Result<(), String> {
    let mut records = load_records();
    if let Some(idx) = records.iter().position(|r| r.id == record.id) {
        records[idx] = record.clone();
        save_records(&records)
    } else {
        Err("Record not found".to_string())
    }
}

pub fn load_repair_requests() -> Vec<RepairRequest> {
    LocalStorage::get::<Vec<RepairRequest>>(STORAGE_KEY_REPAIRS)
        .unwrap_or_default()
}

pub fn save_repair_requests(requests: &[RepairRequest]) -> Result<(), String> {
    LocalStorage::set(STORAGE_KEY_REPAIRS, requests)
        .map_err(|e| e.to_string())
}

pub fn add_repair_request(request: &RepairRequest) -> Result<(), String> {
    let mut requests = load_repair_requests();
    requests.insert(0, request.clone());
    save_repair_requests(&requests)
}

pub fn update_repair_request(request: &RepairRequest) -> Result<(), String> {
    let mut requests = load_repair_requests();
    if let Some(idx) = requests.iter().position(|r| r.id == request.id) {
        requests[idx] = request.clone();
        save_repair_requests(&requests)
    } else {
        Err("Repair request not found".to_string())
    }
}

pub fn load_settings() -> AppSettings {
    LocalStorage::get::<AppSettings>(STORAGE_KEY_SETTINGS)
        .unwrap_or_default()
}

pub fn save_settings(settings: &AppSettings) -> Result<(), String> {
    LocalStorage::set(STORAGE_KEY_SETTINGS, settings)
        .map_err(|e| e.to_string())
}

pub fn get_shift_summary(date: NaiveDate, shift: ShiftType) -> ShiftSummary {
    let records = load_records();
    let shift_records: Vec<&DetectionRecord> = records
        .iter()
        .filter(|r| r.shift_date == date && r.shift == shift)
        .collect();

    let total_count = shift_records.len();
    let normal_count = shift_records
        .iter()
        .filter(|r| r.status == DetectionStatus::Normal || r.status == DetectionStatus::RecheckPassed)
        .count();
    let alert_count = shift_records
        .iter()
        .filter(|r| r.status.is_alert() || r.status == DetectionStatus::PendingRecheck)
        .count();
    let recheck_count = shift_records
        .iter()
        .filter(|r| r.is_recheck)
        .count();
    let repair_count = shift_records
        .iter()
        .filter(|r| r.status == DetectionStatus::Repaired)
        .count();

    let amplitudes: Vec<f64> = shift_records
        .iter()
        .map(|r| r.analysis.amplitude)
        .collect();

    let (avg_amplitude, min_amplitude, max_amplitude) = if amplitudes.is_empty() {
        (0.0, 0.0, 0.0)
    } else {
        let sum: f64 = amplitudes.iter().sum();
        let avg = sum / amplitudes.len() as f64;
        let min = *amplitudes.iter().fold(&f64::INFINITY, |a, b| a.min(b));
        let max = *amplitudes.iter().fold(&f64::NEG_INFINITY, |a, b| a.max(b));
        (avg, min, max)
    };

    ShiftSummary {
        date,
        shift,
        total_count,
        normal_count,
        alert_count,
        recheck_count,
        repair_count,
        avg_amplitude,
        min_amplitude,
        max_amplitude,
    }
}

pub fn get_records_by_movement(movement_id: &str) -> Vec<DetectionRecord> {
    let records = load_records();
    records
        .into_iter()
        .filter(|r| r.movement_id == movement_id)
        .collect()
}

pub fn get_pending_repair_count() -> usize {
    let requests = load_repair_requests();
    requests
        .iter()
        .filter(|r| r.status == crate::models::RepairStatus::Pending)
        .count()
}

pub fn clear_all_data() -> Result<(), String> {
    LocalStorage::delete(STORAGE_KEY_RECORDS);
    LocalStorage::delete(STORAGE_KEY_REPAIRS);
    Ok(())
}
