use crate::models::{CapturedImage, InspectionItem};
use rand::Rng;
use std::fs;
use std::io::Write;

pub fn read_scale_weight() -> Result<f64, String> {
    let mut rng = rand::thread_rng();
    Ok(118.0 + rng.gen_range(0.0..40.0))
}

pub fn capture_microscope() -> Result<CapturedImage, String> {
    let width = 2560;
    let height = 1920;
    let data_url = generate_test_pattern(width, height);
    Ok(CapturedImage {
        image_data: data_url,
        width,
        height,
    })
}

fn generate_test_pattern(width: i32, height: i32) -> String {
    let mut rng = rand::thread_rng();
    let size = (width * height * 3) as usize;
    let mut pixels = Vec::with_capacity(size);

    for i in 0..(width * height) {
        let x = i % width;
        let y = i / width;

        let groove_y = (height / 8) as i32;
        let groove_idx = (y / groove_y) as f64;

        let base_r = 20 + (groove_idx * 15.0) as u8;
        let base_g = 15 + (groove_idx * 10.0) as u8;
        let base_b = 40 + (groove_idx * 20.0) as u8;

        let wobble = ((x as f64 * 0.02 + groove_idx).sin() * 12.0
            + (x as f64 * 0.008 + groove_idx * 2.0).sin() * 6.0)
            .abs();

        let groove_dist = ((y % groove_y) - groove_y / 2).abs();
        let is_groove = groove_dist < (4 + wobble as i32 / 2);

        let (r, g, b) = if is_groove {
            (
                base_r.saturating_add(40 + (wobble * 2.0) as u8),
                base_g.saturating_add(30 + (wobble * 1.5) as u8),
                base_b.saturating_add(80 + (wobble * 3.0) as u8),
            )
        } else {
            (base_r, base_g, base_b)
        };

        let scratch: bool = rng.gen_range(0..200) == 0;
        let (r, g, b) = if scratch {
            (
                r.saturating_add(80),
                g.saturating_add(80),
                b.saturating_add(80),
            )
        } else {
            (r, g, b)
        };

        pixels.push(r);
        pixels.push(g);
        pixels.push(b);
    }

    let png_data = encode_bmp(&pixels, width, height);
    let b64 = base64_encode(&png_data);
    format!("data:image/bmp;base64,{}", b64)
}

fn encode_bmp(pixels: &[u8], width: i32, height: i32) -> Vec<u8> {
    let row_size = ((width * 3 + 3) / 4) * 4;
    let pixel_data_size = row_size * height;
    let file_size = 54 + pixel_data_size;

    let mut data = Vec::with_capacity(file_size as usize);

    data.extend_from_slice(b"BM");
    data.extend_from_slice(&(file_size as u32).to_le_bytes());
    data.extend_from_slice(&0u16.to_le_bytes());
    data.extend_from_slice(&0u16.to_le_bytes());
    data.extend_from_slice(&54u32.to_le_bytes());

    data.extend_from_slice(&40u32.to_le_bytes());
    data.extend_from_slice(&(width as i32).to_le_bytes());
    data.extend_from_slice(&(height as i32).to_le_bytes());
    data.extend_from_slice(&1u16.to_le_bytes());
    data.extend_from_slice(&24u16.to_le_bytes());
    data.extend_from_slice(&0u32.to_le_bytes());
    data.extend_from_slice(&(pixel_data_size as u32).to_le_bytes());
    data.extend_from_slice(&2835i32.to_le_bytes());
    data.extend_from_slice(&2835i32.to_le_bytes());
    data.extend_from_slice(&0u32.to_le_bytes());
    data.extend_from_slice(&0u32.to_le_bytes());

    let padding = (row_size - width * 3) as usize;
    for y in (0..height).rev() {
        for x in 0..width {
            let idx = ((y * width + x) * 3) as usize;
            data.push(pixels[idx + 2]);
            data.push(pixels[idx + 1]);
            data.push(pixels[idx]);
        }
        for _ in 0..padding {
            data.push(0);
        }
    }

    data
}

fn base64_encode(data: &[u8]) -> String {
    let chars: Vec<char> = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
        .chars()
        .collect();
    let mut result = String::new();
    let mut i = 0;

    while i < data.len() {
        let b1 = data[i] as u32;
        let b2 = if i + 1 < data.len() { data[i + 1] as u32 } else { 0 };
        let b3 = if i + 2 < data.len() { data[i + 2] as u32 } else { 0 };
        let triple = (b1 << 16) | (b2 << 8) | b3;

        result.push(chars[((triple >> 18) & 0x3F) as usize]);
        result.push(chars[((triple >> 12) & 0x3F) as usize]);
        if i + 1 < data.len() {
            result.push(chars[((triple >> 6) & 0x3F) as usize]);
        } else {
            result.push('=');
        }
        if i + 2 < data.len() {
            result.push(chars[(triple & 0x3F) as usize]);
        } else {
            result.push('=');
        }

        i += 3;
    }

    result
}

pub fn list_ports() -> Result<Vec<String>, String> {
    Ok(vec![
        "/dev/ttyUSB0".to_string(),
        "/dev/ttyUSB1".to_string(),
        "/dev/tty.usbserial-1410".to_string(),
    ])
}

#[allow(dead_code)]
pub fn save_image(_image: &CapturedImage, _path: &str) -> Result<(), String> {
    Ok(())
}

#[allow(dead_code)]
pub fn save_csv_report(_items: &[InspectionItem], path: &str) -> Result<(), String> {
    let mut file = fs::File::create(path).map_err(|e| e.to_string())?;
    writeln!(
        file,
        "唱片编号,名称,卖家,磨损分,建议,原价,建议价"
    )
    .map_err(|e| e.to_string())?;
    for item in _items {
        let suggestion = item
            .analysis
            .as_ref()
            .map(|a| a.suggestion.clone())
            .unwrap_or_default();
        writeln!(
            file,
            "{},{},{},{},{},{:.2},{:.2}",
            item.record.record_no,
            item.record.record_title,
            item.record.seller_name,
            item.analysis.as_ref().map(|a| a.score).unwrap_or(0),
            suggestion,
            item.record.original_price,
            item.final_price
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}
