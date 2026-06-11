use crate::models::WearAnalysis;
use rand::Rng;
use rand::SeedableRng;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

pub fn analyze_wear(image_data: &str, template_id: &str) -> Result<WearAnalysis, String> {
    let mut hasher = DefaultHasher::new();
    image_data.hash(&mut hasher);
    template_id.hash(&mut hasher);
    let seed = hasher.finish();

    let mut rng = rand::rngs::StdRng::seed_from_u64(seed);

    let template_factor = match template_id {
        "mint" => 0.85,
        "standard" => 1.0,
        "vg" => 1.25,
        "g" => 1.5,
        _ => 1.0,
    };

    let base_score: f64 = rng.gen_range(35.0..90.0);
    let score = ((base_score / template_factor).clamp(5.0, 99.0)) as i32;

    let groove_depth_loss = ((100 - score) as f64 * template_factor * rng.gen_range(0.7..1.1)) as i32;
    let groove_depth_loss = groove_depth_loss.clamp(2, 95);

    let scratch_density = ((100 - score) as f64 * rng.gen_range(0.5..1.2)) as i32;
    let scratch_density = scratch_density.clamp(1, 98);

    let noise_level = ((100 - score) as f64 * rng.gen_range(0.4..1.0)) as i32;
    let noise_level = noise_level.clamp(1, 95);

    let confidence = (70 + rng.gen_range(0..25)) as i32;

    let (suggestion, needs_review) = if score >= 70 {
        ("regenerate".to_string(), false)
    } else if score < 40 {
        ("scrap".to_string(), true)
    } else {
        ("pending".to_string(), true)
    };

    Ok(WearAnalysis {
        score,
        groove_depth_loss,
        scratch_density,
        noise_level,
        suggestion,
        needs_review,
        confidence,
    })
}
