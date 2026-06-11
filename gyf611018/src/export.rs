use serde::{Deserialize, Serialize};
use csv::Writer;
use base64::{engine::general_purpose, Engine as _};
use crate::models::{DetectionRecord, BrandExportRecord, AppSettings, ShiftType};
use chrono::{DateTime, Local, TimeZone};

pub fn export_to_brand_csv(records: &[DetectionRecord], settings: &AppSettings) -> Result<String, String> {
    let mut wtr = Writer::from_writer(Vec::new());

    wtr.write_record(&[
        "记录编号",
        "机芯编号",
        "检测时间",
        "班次",
        "振幅(度)",
        "频率(Hz)",
        "日差(秒/日)",
        "检测结果",
        "操作员",
        "品牌代码",
        "波形哈希",
    ]).map_err(|e| e.to_string())?;

    for record in records {
        let beat_error = super::waveform::beat_error(
            record.analysis.frequency,
            4.0,
        );

        let result = if record.analysis.is_below_threshold {
            "不合格".to_string()
        } else {
            "合格".to_string()
        };

        let waveform_hash = compute_waveform_hash(&record.waveform_data.samples);

        wtr.write_record(&[
            record.id.to_string(),
            record.movement_id.clone(),
            record.created_at.format("%Y-%m-%d %H:%M:%S").to_string(),
            record.shift.label().to_string(),
            format!("{:.2}", record.analysis.amplitude),
            format!("{:.4}", record.analysis.frequency),
            format!("{:.2}", beat_error),
            result,
            record.operator.clone(),
            settings.brand_code.clone(),
            waveform_hash,
        ]).map_err(|e| e.to_string())?;
    }

    let data = wtr.into_inner().map_err(|e| e.to_string())?;
    String::from_utf8(data).map_err(|e| e.to_string())
}

pub fn export_to_json(records: &[DetectionRecord]) -> Result<String, String> {
    serde_json::to_string_pretty(records).map_err(|e| e.to_string())
}

pub fn generate_brand_exchange_format(
    records: &[DetectionRecord],
    settings: &AppSettings,
) -> Result<BrandExchangeData, String> {
    let export_records: Vec<BrandExportRecord> = records
        .iter()
        .map(|r| {
            let beat_error = super::waveform::beat_error(r.analysis.frequency, 4.0);
            let result = if r.analysis.is_below_threshold {
                "FAIL".to_string()
            } else {
                "PASS".to_string()
            };
            BrandExportRecord {
                record_id: r.id.to_string(),
                movement_id: r.movement_id.clone(),
                detection_time: r.created_at.to_rfc3339(),
                shift: r.shift.label().to_string(),
                amplitude: r.analysis.amplitude,
                frequency: r.analysis.frequency,
                beat_error,
                result,
                operator: r.operator.clone(),
                brand_code: settings.brand_code.clone(),
                waveform_hash: compute_waveform_hash(&r.waveform_data.samples),
            }
        })
        .collect();

    let now = Local::now();
    let checksum = generate_checksum(&export_records);

    Ok(BrandExchangeData {
        version: "1.0".to_string(),
        brand_code: settings.brand_code.clone(),
        export_time: now.to_rfc3339(),
        record_count: export_records.len(),
        records: export_records,
        checksum,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrandExchangeData {
    pub version: String,
    pub brand_code: String,
    pub export_time: String,
    pub record_count: usize,
    pub records: Vec<BrandExportRecord>,
    pub checksum: String,
}

fn compute_waveform_hash(samples: &[f32]) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    for sample in samples.iter().step_by(100) {
        sample.to_bits().hash(&mut hasher);
    }
    let hash = hasher.finish();
    format!("{:016x}", hash)
}

fn generate_checksum(records: &[BrandExportRecord]) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    for record in records {
        record.record_id.hash(&mut hasher);
        record.movement_id.hash(&mut hasher);
        record.amplitude.to_bits().hash(&mut hasher);
    }
    let hash = hasher.finish();
    format!("{:016x}", hash)
}

pub fn download_csv(data: &str, filename: &str) -> Result<(), String> {
    use wasm_bindgen::JsCast;
    use web_sys::{Blob, BlobPropertyBag, Url, window};

    let window = window().ok_or("Window not found")?;

    let mut parts = Vec::new();
    parts.push(wasm_bindgen::JsValue::from_str(data));

    let mut props = BlobPropertyBag::new();
    props.type_("text/csv;charset=utf-8");

    let blob = Blob::new_with_str_sequence_and_options(&parts, &props)
        .map_err(|e| format!("Failed to create blob: {:?}", e))?;

    let url = Url::create_object_url_with_blob(&blob)
        .map_err(|e| format!("Failed to create URL: {:?}", e))?;

    let document = window.document().ok_or("Document not found")?;
    let a = document
        .create_element("a")
        .map_err(|e| format!("Failed to create element: {:?}", e))?
        .dyn_into::<web_sys::HtmlAnchorElement>()
        .map_err(|e| format!("Failed to cast to anchor: {:?}", e))?;

    a.set_href(&url);
    a.set_download(filename);
    a.click();

    Url::revoke_object_url(&url).map_err(|e| format!("Failed to revoke URL: {:?}", e))?;

    Ok(())
}

pub fn download_json(data: &str, filename: &str) -> Result<(), String> {
    use wasm_bindgen::JsCast;
    use web_sys::{Blob, BlobPropertyBag, Url, window};

    let window = window().ok_or("Window not found")?;

    let mut parts = Vec::new();
    parts.push(wasm_bindgen::JsValue::from_str(data));

    let mut props = BlobPropertyBag::new();
    props.type_("application/json;charset=utf-8");

    let blob = Blob::new_with_str_sequence_and_options(&parts, &props)
        .map_err(|e| format!("Failed to create blob: {:?}", e))?;

    let url = Url::create_object_url_with_blob(&blob)
        .map_err(|e| format!("Failed to create URL: {:?}", e))?;

    let document = window.document().ok_or("Document not found")?;
    let a = document
        .create_element("a")
        .map_err(|e| format!("Failed to create element: {:?}", e))?
        .dyn_into::<web_sys::HtmlAnchorElement>()
        .map_err(|e| format!("Failed to cast to anchor: {:?}", e))?;

    a.set_href(&url);
    a.set_download(filename);
    a.click();

    Url::revoke_object_url(&url).map_err(|e| format!("Failed to revoke URL: {:?}", e))?;

    Ok(())
}
