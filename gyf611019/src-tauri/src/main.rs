#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod models;
mod wear;
mod serial;
mod pricing;
mod report;

use db::Database;
use std::sync::Mutex;
use tauri::State;

struct AppState {
    db: Mutex<Database>,
}

#[tauri::command]
fn analyze_wear(image_data: String, template_id: String) -> Result<models::WearAnalysis, String> {
    wear::analyze_wear(&image_data, &template_id)
}

#[tauri::command]
fn read_scale_weight() -> Result<f64, String> {
    serial::read_scale_weight()
}

#[tauri::command]
fn capture_microscope() -> Result<models::CapturedImage, String> {
    serial::capture_microscope()
}

#[tauri::command]
fn list_serial_ports() -> Result<Vec<String>, String> {
    serial::list_ports()
}

#[tauri::command]
fn confirm_scrap(item_id: String, reviewer: String, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.confirm_scrap(&item_id, &reviewer)
}

#[tauri::command]
fn save_inspection(item: models::InspectionItem, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.save_inspection(&item)
}

#[tauri::command]
fn list_inspections(state: State<AppState>) -> Result<Vec<models::InspectionItem>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.list_inspections()
}

#[tauri::command]
fn export_dispute_report(
    start_date: String,
    end_date: String,
    state: State<AppState>,
) -> Result<models::DisputeReport, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    report::generate_report(&db, &start_date, &end_date)
}

#[tauri::command]
fn calculate_price(original_price: f64, score: i32) -> f64 {
    pricing::calculate_price(original_price, score)
}

fn main() {
    let db = Database::new().expect("Failed to initialize database");

    tauri::Builder::default()
        .manage(AppState {
            db: Mutex::new(db),
        })
        .invoke_handler(tauri::generate_handler![
            analyze_wear,
            read_scale_weight,
            capture_microscope,
            list_serial_ports,
            confirm_scrap,
            save_inspection,
            list_inspections,
            export_dispute_report,
            calculate_price
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
