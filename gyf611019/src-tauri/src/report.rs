use crate::db::Database;
use crate::models::{DisputeReport, SellerDispute};

pub fn generate_report(db: &Database, start_date: &str, end_date: &str) -> Result<DisputeReport, String> {
    let items = db.list_inspections()?;

    let completed: Vec<_> = items
        .iter()
        .filter(|i| i.status == "completed" || i.status == "pending_review")
        .collect();

    let total_records = completed.len() as i32;
    let scrap_count = completed
        .iter()
        .filter(|i| i.analysis.as_ref().map(|a| a.suggestion == "scrap").unwrap_or(false))
        .count() as i32;
    let regenerate_count = completed
        .iter()
        .filter(|i| i.analysis.as_ref().map(|a| a.suggestion == "regenerate").unwrap_or(false))
        .count() as i32;
    let disputed_count = completed
        .iter()
        .filter(|i| {
            i.analysis
                .as_ref()
                .map(|a| a.suggestion == "scrap" || a.suggestion == "pending")
                .unwrap_or(false)
        })
        .count() as i32;

    let average_score = if !completed.is_empty() {
        let total: i32 = completed
            .iter()
            .map(|i| i.analysis.as_ref().map(|a| a.score).unwrap_or(0))
            .sum();
        total as f64 / completed.len() as f64
    } else {
        0.0
    };

    let mut seller_map: std::collections::HashMap<String, (String, i32)> = std::collections::HashMap::new();
    for item in &completed {
        let key = item.record.seller_id.clone();
        let entry = seller_map
            .entry(key)
            .or_insert_with(|| (item.record.seller_name.clone(), 0));
        if item
            .analysis
            .as_ref()
            .map(|a| a.suggestion == "scrap" || a.suggestion == "pending")
            .unwrap_or(false)
        {
            entry.1 += 1;
        }
    }

    let mut seller_disputes: Vec<SellerDispute> = seller_map
        .into_iter()
        .map(|(_, (name, count))| SellerDispute {
            seller_name: name,
            count,
        })
        .collect();
    seller_disputes.sort_by(|a, b| b.count.cmp(&a.count));

    Ok(DisputeReport {
        id: format!("report-{}-{}", start_date, end_date),
        date_range: [start_date.to_string(), end_date.to_string()],
        total_records,
        scrap_count,
        regenerate_count,
        disputed_count,
        average_score,
        seller_disputes,
    })
}
