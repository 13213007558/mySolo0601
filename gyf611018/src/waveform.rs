use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WaveformAnalysis {
    pub amplitude: f64,
    pub frequency: f64,
    pub peak_to_peak: f64,
    pub rms: f64,
    pub is_below_threshold: bool,
    pub threshold: f64,
    pub sample_count: usize,
    pub peaks: Vec<usize>,
    pub troughs: Vec<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WaveformData {
    pub samples: Vec<f32>,
    pub sample_rate: f64,
    pub timestamp: f64,
}

impl WaveformData {
    pub fn new(samples: Vec<f32>, sample_rate: f64, timestamp: f64) -> Self {
        Self {
            samples,
            sample_rate,
            timestamp,
        }
    }

    pub fn len(&self) -> usize {
        self.samples.len()
    }

    pub fn is_empty(&self) -> bool {
        self.samples.is_empty()
    }
}

pub fn analyze_waveform(samples: &[f32], sample_rate: f64, threshold: f64) -> WaveformAnalysis {
    let len = samples.len();
    if len < 2 {
        return WaveformAnalysis {
            amplitude: 0.0,
            frequency: 0.0,
            peak_to_peak: 0.0,
            rms: 0.0,
            is_below_threshold: true,
            threshold,
            sample_count: len,
            peaks: Vec::new(),
            troughs: Vec::new(),
        };
    }

    let mut max_val = f32::NEG_INFINITY;
    let mut min_val = f32::INFINITY;
    let mut sum_sq = 0.0f64;

    for &sample in samples {
        if sample > max_val {
            max_val = sample;
        }
        if sample < min_val {
            min_val = sample;
        }
        sum_sq += (sample as f64).powi(2);
    }

    let peak_to_peak = (max_val - min_val) as f64;
    let amplitude = peak_to_peak / 2.0;
    let rms = (sum_sq / len as f64).sqrt();

    let (peaks, troughs) = find_peaks_and_troughs(samples);
    let frequency = calculate_frequency(&peaks, sample_rate, len);

    let is_below_threshold = amplitude < threshold;

    WaveformAnalysis {
        amplitude,
        frequency,
        peak_to_peak,
        rms,
        is_below_threshold,
        threshold,
        sample_count: len,
        peaks,
        troughs,
    }
}

fn find_peaks_and_troughs(samples: &[f32]) -> (Vec<usize>, Vec<usize>) {
    let mut peaks = Vec::new();
    let mut troughs = Vec::new();

    if samples.len() < 3 {
        return (peaks, troughs);
    }

    let threshold = 0.01;

    let mut i = 1;
    while i < samples.len() - 1 {
        let prev = samples[i - 1];
        let curr = samples[i];
        let next = samples[i + 1];

        if curr > prev && curr > next && curr.abs() > threshold {
            peaks.push(i);
            i += 2;
        } else if curr < prev && curr < next && curr.abs() > threshold {
            troughs.push(i);
            i += 2;
        } else {
            i += 1;
        }
    }

    (peaks, troughs)
}

fn calculate_frequency(peaks: &[usize], sample_rate: f64, total_samples: usize) -> f64 {
    if peaks.len() < 2 {
        return 0.0;
    }

    let mut intervals = Vec::new();
    for window in peaks.windows(2) {
        let diff = window[1] - window[0];
        if diff > 0 {
            intervals.push(diff);
        }
    }

    if intervals.is_empty() {
        return 0.0;
    }

    let avg_interval: f64 = intervals.iter().sum::<usize>() as f64 / intervals.len() as f64;
    let period = avg_interval / sample_rate;

    if period > 0.0 {
        1.0 / period
    } else {
        0.0
    }
}

pub fn normalize_samples(samples: &[f32]) -> Vec<f32> {
    if samples.is_empty() {
        return Vec::new();
    }

    let mut max_abs = 0.0f32;
    for &s in samples {
        let abs = s.abs();
        if abs > max_abs {
            max_abs = abs;
        }
    }

    if max_abs == 0.0 {
        return samples.to_vec();
    }

    samples.iter().map(|&s| s / max_abs).collect()
}

pub fn downsample(samples: &[f32], target_size: usize) -> Vec<f32> {
    if samples.len() <= target_size {
        return samples.to_vec();
    }

    let ratio = samples.len() as f64 / target_size as f64;
    let mut result = Vec::with_capacity(target_size);

    for i in 0..target_size {
        let start = (i as f64 * ratio) as usize;
        let end = ((i + 1) as f64 * ratio) as usize;
        let end = end.min(samples.len());

        if start >= end {
            result.push(samples[start]);
        } else {
            let mut sum = 0.0f32;
            for &s in &samples[start..end] {
                sum += s;
            }
            result.push(sum / (end - start) as f32);
        }
    }

    result
}

pub fn calculate_amplitude_degrees(peak_to_peak_volts: f64, sensitivity: f64) -> f64 {
    peak_to_peak_volts / sensitivity * 180.0
}

pub fn is_amplitude_normal(amplitude: f64, threshold: f64) -> bool {
    amplitude >= threshold
}

pub fn beat_error(frequency: f64, nominal_frequency: f64) -> f64 {
    if nominal_frequency == 0.0 {
        return 0.0;
    }
    (frequency - nominal_frequency) / nominal_frequency * 86400.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_analyze_waveform_empty() {
        let samples = vec![];
        let result = analyze_waveform(&samples, 44100.0, 220.0);
        assert_eq!(result.amplitude, 0.0);
        assert!(result.is_below_threshold);
    }

    #[test]
    fn test_normalize_samples() {
        let samples = vec![0.0, 0.5, 1.0, 0.5, 0.0, -0.5, -1.0];
        let normalized = normalize_samples(&samples);
        assert_eq!(normalized[0], 0.0);
        assert_eq!(normalized[2], 1.0);
        assert_eq!(normalized[6], -1.0);
    }

    #[test]
    fn test_downsample() {
        let samples: Vec<f32> = (0..100).map(|i| i as f32).collect();
        let downsampled = downsample(&samples, 10);
        assert_eq!(downsampled.len(), 10);
    }

    #[test]
    fn test_is_amplitude_normal() {
        assert!(is_amplitude_normal(300.0, 220.0));
        assert!(!is_amplitude_normal(200.0, 220.0));
    }
}
