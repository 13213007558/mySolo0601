pub fn calculate_price(original_price: f64, score: i32) -> f64 {
    let factor = score as f64 / 100.0;
    let depreciation = (1.0 - factor) * 0.7;
    let final_price = original_price * (1.0 - depreciation);
    let min_price = original_price * 0.1;
    final_price.max(min_price)
}
