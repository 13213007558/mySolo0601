use serde::{Deserialize, Serialize};
use chrono::{DateTime, Local};
use uuid::Uuid;

pub mod waveform;
pub mod models;
pub mod storage;
pub mod export;
pub mod components;

pub use waveform::*;
pub use models::*;
pub use storage::*;
pub use export::*;
pub use components::App;

pub const DEFAULT_AMPLITUDE_THRESHOLD: f64 = 220.0;
pub const DEFAULT_SAMPLE_RATE: f64 = 44100.0;
pub const DEFAULT_WINDOW_SIZE: usize = 2048;
