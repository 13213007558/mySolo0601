use yew::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::spawn_local;
use web_sys::{
    AudioContext, MediaStream, MediaStreamConstraints, AnalyserNode,
    MediaStreamAudioSourceNode, HtmlCanvasElement, CanvasRenderingContext2d,
};
use gloo_timers::callback::Interval;
use crate::waveform::{WaveformData, WaveformAnalysis, analyze_waveform, normalize_samples};
use crate::models::{DetectionRecord, RepairRequest, ShiftType, DetectionStatus, AppSettings};
use crate::storage::{add_record, add_repair_request, load_settings, save_settings};
use crate::components::WaveformViewer;

const CANVAS_WIDTH: u32 = 800;
const CANVAS_HEIGHT: u32 = 200;

#[function_component(DetectionPage)]
pub fn detection_page() -> Html {
    let is_recording = use_state(|| false);
    let current_amplitude = use_state(|| 0.0f64);
    let current_frequency = use_state(|| 0.0f64);
    let movement_id = use_state(|| String::new());
    let settings = use_state(|| AppSettings::default());
    let last_analysis = use_state(|| None::<WaveformAnalysis>);
    let last_waveform = use_state(|| None::<WaveformData>);
    let show_waveform_viewer = use_state(|| false);
    let show_repair_modal = use_state(|| false);
    let pending_record = use_state(|| None::<DetectionRecord>);
    let settings_expanded = use_state(|| false);
    let message = use_state(|| None::<(String, String)>);
    let recording_progress = use_state(|| 0u32);

    let canvas_ref = use_node_ref();
    let shift = ShiftType::current();

    {
        let settings = settings.clone();
        use_effect_with_deps(
            move |_| {
                let loaded = load_settings();
                settings.set(loaded);
                || {}
            },
            (),
        );
    }

    let show_message = {
        let message = message.clone();
        Callback::from(move |(msg_type, msg): (String, String)| {
            message.set(Some((msg_type, msg)));
            let message = message.clone();
            let handle = gloo_timers::callback::Timeout::new(3000, move || {
                message.set(None);
            });
            handle.forget();
        })
    };

    let start_recording = {
        let is_recording = is_recording.clone();
        let current_amplitude = current_amplitude.clone();
        let current_frequency = current_frequency.clone();
        let last_analysis = last_analysis.clone();
        let last_waveform = last_waveform.clone();
        let settings = settings.clone();
        let show_message = show_message.clone();
        let movement_id = movement_id.clone();
        let canvas_ref = canvas_ref.clone();
        let pending_record = pending_record.clone();
        let show_repair_modal = show_repair_modal.clone();
        let recording_progress = recording_progress.clone();

        Callback::from(move |_| {
            if movement_id.is_empty() {
                show_message.emit(("error".to_string(), "请先输入机芯编号".to_string()));
                return;
            }

            let is_recording = is_recording.clone();
            let current_amplitude = current_amplitude.clone();
            let current_frequency = current_frequency.clone();
            let last_analysis = last_analysis.clone();
            let last_waveform = last_waveform.clone();
            let settings = settings.clone();
            let canvas_ref = canvas_ref.clone();
            let pending_record = pending_record.clone();
            let show_repair_modal = show_repair_modal.clone();
            let show_message = show_message.clone();
            let move_id = movement_id.clone();
            let progress = recording_progress.clone();

            spawn_local(async move {
                if let Some(window) = web_sys::window() {
                    let navigator = window.navigator();
                    if let Ok(media_devices) = navigator.media_devices() {
                        let mut constraints = MediaStreamConstraints::new();
                        constraints.audio(&wasm_bindgen::JsValue::from_bool(true));
                        constraints.video(&wasm_bindgen::JsValue::from_bool(false));

                        if let Ok(promise) = media_devices.get_user_media_with_constraints(&constraints) {
                            match wasm_bindgen_futures::JsFuture::from(promise).await {
                                Ok(stream_val) => {
                                    let stream: MediaStream = stream_val.dyn_into().unwrap();

                                    if let Ok(audio_context) = AudioContext::new() {
                                        if let Ok(source) = MediaStreamAudioSourceNode::new(&audio_context, &stream) {
                                            if let Ok(analyser) = AnalyserNode::new(&audio_context) {
                                                analyser.set_fft_size(2048);
                                                analyser.set_smoothing_time_constant(0.8);

                                                let _ = source.connect_with_audio_node(&analyser);

                                                is_recording.set(true);
                                                progress.set(0);

                                                let threshold = settings.amplitude_threshold;
                                                let sample_rate = settings.sample_rate;
                                                let canvas_ref_clone = canvas_ref.clone();
                                                let current_amp = current_amplitude.clone();
                                                let current_freq = current_frequency.clone();
                                                let last_anal = last_analysis.clone();
                                                let last_wf = last_waveform.clone();
                                                let pending_rec = pending_record.clone();
                                                let show_repair = show_repair_modal.clone();
                                                let show_msg = show_message.clone();
                                                let sett = settings.clone();
                                                let is_rec = is_recording.clone();
                                                let stream_clone = stream.clone();
                                                let audio_ctx_clone = audio_context.clone();
                                                let progress_clone = progress.clone();
                                                let mid = move_id.clone();

                                                let mut accumulated_samples: Vec<f32> = Vec::new();
                                                let mut elapsed_ms = 0u32;
                                                let duration_ms = settings.recording_duration_ms;

                                                let interval = Interval::new(50, move || {
                                                    if !*is_rec {
                                                        return;
                                                    }

                                                    let mut data = vec![0f32; analyser.fft_size() as usize];
                                                    analyser.get_float_time_domain_data(&mut data);

                                                    accumulated_samples.extend_from_slice(&data);

                                                    let analysis = analyze_waveform(&data, sample_rate, threshold);
                                                    current_amp.set(analysis.amplitude);
                                                    current_freq.set(analysis.frequency);

                                                    let wf_data = WaveformData::new(data.clone(), sample_rate, 0.0);
                                                    last_wf.set(Some(wf_data));
                                                    last_anal.set(Some(analysis.clone()));

                                                    draw_live_waveform(&canvas_ref_clone, &data, analysis.amplitude, threshold);

                                                    elapsed_ms += 50;
                                                    let pct = ((elapsed_ms as f64 / duration_ms as f64) * 100.0) as u32;
                                                    progress_clone.set(pct.min(100));
                                                });

                                                let stop_handle = gloo_timers::callback::Timeout::new(duration_ms, move || {
                                                    is_rec.set(false);
                                                    interval.forget();

                                                    let tracks = stream_clone.get_audio_tracks();
                                                    for i in 0..tracks.length() {
                                                        if let Some(track) = tracks.get(i) {
                                                            track.stop();
                                                        }
                                                    }

                                                    let _ = audio_ctx_clone.close();

                                                    if !accumulated_samples.is_empty() {
                                                        let normalized = normalize_samples(&accumulated_samples);
                                                        let analysis = analyze_waveform(&normalized, sett.sample_rate, sett.amplitude_threshold);
                                                        let waveform = WaveformData::new(normalized, sett.sample_rate, 0.0);

                                                        let record = DetectionRecord::new(
                                                            (*mid).clone(),
                                                            waveform.clone(),
                                                            analysis.clone(),
                                                            sett.operator.clone(),
                                                        );

                                                        last_wf.set(Some(waveform));
                                                        last_anal.set(Some(analysis));

                                                        if analysis.is_below_threshold {
                                                            pending_rec.set(Some(record));
                                                            show_repair.set(true);
                                                            show_msg.emit(("warning".to_string(), "振幅低于阈值，请确认是否创建返修单".to_string()));
                                                        } else {
                                                            match add_record(&record) {
                                                                Ok(_) => {
                                                                    show_msg.emit(("success".to_string(), "检测记录已保存".to_string()));
                                                                }
                                                                Err(e) => {
                                                                    show_msg.emit(("error".to_string(), format!("保存失败: {}", e)));
                                                                }
                                                            }
                                                        }
                                                    }

                                                    progress_clone.set(0);
                                                });
                                                stop_handle.forget();
                                            }
                                        }
                                    }
                                }
                                Err(_) => {
                                    show_message.emit(("error".to_string(), "获取麦克风权限失败，请允许麦克风访问".to_string()));
                                }
                            }
                        }
                    }
                }
            });
        })
    };

    let confirm_save_with_repair = {
        let pending_record = pending_record.clone();
        let show_repair_modal = show_repair_modal.clone();
        let show_message = show_message.clone();
        let movement_id = movement_id.clone();

        Callback::from(move |create_repair: bool| {
            if let Some(record) = (*pending_record).clone() {
                match add_record(&record) {
                    Ok(_) => {
                        if create_repair {
                            let repair = RepairRequest::from_record(&record);
                            match add_repair_request(&repair) {
                                Ok(_) => {
                                    show_message.emit(("success".to_string(), "检测记录已保存，返修申请已创建".to_string()));
                                }
                                Err(e) => {
                                    show_message.emit(("warning".to_string(), format!("记录已保存，但返修单创建失败: {}", e)));
                                }
                            }
                        } else {
                            show_message.emit(("success".to_string(), "检测记录已保存".to_string()));
                        }
                    }
                    Err(e) => {
                        show_message.emit(("error".to_string(), format!("保存失败: {}", e)));
                    }
                }
                movement_id.set(String::new());
            }
            show_repair_modal.set(false);
            pending_record.set(None);
        })
    };

    let handle_movement_change = {
        let movement_id = movement_id.clone();
        Callback::from(move |e: InputEvent| {
            let target = e.target().unwrap();
            let input = target.dyn_ref::<web_sys::HtmlInputElement>().unwrap();
            movement_id.set(input.value());
        })
    };

    let handle_threshold_change = {
        let settings = settings.clone();
        Callback::from(move |e: InputEvent| {
            let target = e.target().unwrap();
            let input = target.dyn_ref::<web_sys::HtmlInputElement>().unwrap();
            let value: f64 = input.value().parse().unwrap_or(220.0);
            let mut new_settings = (*settings).clone();
            new_settings.amplitude_threshold = value;
            settings.set(new_settings);
            let _ = save_settings(&new_settings);
        })
    };

    let handle_operator_change = {
        let settings = settings.clone();
        Callback::from(move |e: InputEvent| {
            let target = e.target().unwrap();
            let input = target.dyn_ref::<web_sys::HtmlInputElement>().unwrap();
            let mut new_settings = (*settings).clone();
            new_settings.operator = input.value();
            settings.set(new_settings);
            let _ = save_settings(&new_settings);
        })
    };

    let view_waveform = {
        let show_waveform_viewer = show_waveform_viewer.clone();
        Callback::from(move |_| {
            show_waveform_viewer.set(true);
        })
    };

    let close_waveform_viewer = {
        let show_waveform_viewer = show_waveform_viewer.clone();
        Callback::from(move |_| {
            show_waveform_viewer.set(false);
        })
    };

    let toggle_settings = {
        let settings_expanded = settings_expanded.clone();
        Callback::from(move |_| {
            settings_expanded.set(!*settings_expanded);
        })
    };

    let is_below_threshold = *current_amplitude < settings.amplitude_threshold && *is_recording;

    html! {
        <div class="detection-page">
            <div class="page-header">
                <h1 class="page-title">{"擒纵摆幅检测台"}</h1>
                <p class="page-subtitle">
                    {"当前班次: "}
                    <span class="shift-badge">{shift.label()}</span>
                    {" | 操作员: "}
                    <strong>{if settings.operator.is_empty() { "未设置" } else { &settings.operator }}</strong>
                </p>
            </div>

            {
                if let Some((msg_type, msg)) = &*message {
                    let msg_type_clone = msg_type.clone();
                    html! {
                        <div class="status-indicator" style="margin-bottom: 1rem;">
                            <span class={format!("status-dot {}", msg_type_clone)}></span>
                            {msg.clone()}
                        </div>
                    }
                } else {
                    html! {}
                }
            }

            <div class="card">
                <div class="card-header">
                    <div class="card-title">{"机芯信息"}</div>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label" for="movementId">{"机芯编号 (扫码或手动输入)"}</label>
                        <input
                            id="movementId"
                            type="text"
                            class="form-input"
                            placeholder="请扫描或输入机芯编号..."
                            value={(*movement_id).clone()}
                            oninput={handle_movement_change}
                            disabled={*is_recording}
                        />
                    </div>
                </div>
            </div>

            <div class="card" style="margin-top: 1.5rem;">
                <div class="card-header">
                    <div class="card-title">{"实时波形"}</div>
                    <div class="recording-status">
                        <div class={
                            if *is_recording {
                                "recording-indicator"
                            } else {
                                "recording-indicator stopped"
                            }
                        }></div>
                        <span>
                            {if *is_recording { format!("采集中... {}%", *recording_progress) } else { "已停止".to_string() }}
                        </span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="waveform-display">
                        <canvas
                            ref={canvas_ref}
                            class="waveform-canvas"
                            width={CANVAS_WIDTH.to_string()}
                            height={CANVAS_HEIGHT.to_string()}
                            onclick={view_waveform}
                            style="cursor: pointer;"
                        />
                    </div>

                    <div class="amplitude-display">
                        <div class="amplitude-item">
                            <div class={
                                if is_below_threshold {
                                    "amplitude-value danger"
                                } else {
                                    "amplitude-value"
                                }
                            }>
                                {format!("{:.1}", *current_amplitude)}
                                <span class="amplitude-unit">{"度"}</span>
                            </div>
                            <div class="amplitude-label">{"当前振幅"}</div>
                        </div>
                        <div class="amplitude-item">
                            <div class="amplitude-value">
                                {format!("{:.3}", *current_frequency)}
                                <span class="amplitude-unit">{"Hz"}</span>
                            </div>
                            <div class="amplitude-label">{"频率"}</div>
                        </div>
                        <div class="amplitude-item">
                            <div class="amplitude-value" style="color: var(--warning-color);">
                                {format!("{:.1}", settings.amplitude_threshold)}
                                <span class="amplitude-unit">{"度"}</span>
                            </div>
                            <div class="amplitude-label">{"阈值"}</div>
                        </div>
                    </div>

                    <div class="recording-controls">
                        {
                            if !*is_recording {
                                html! {
                                    <button
                                        class="btn btn-primary btn-lg"
                                        onclick={start_recording}
                                        disabled={movement_id.is_empty()}
                                    >
                                        {"🎤 开始采集"}
                                    </button>
                                }
                            } else {
                                html! {
                                    <button
                                        class="btn btn-secondary btn-lg"
                                        disabled=true
                                    >
                                        {"⏳ 采集中..."}
                                    </button>
                                }
                            }
                        }
                    </div>

                    {
                        if is_below_threshold {
                            html! {
                                <div class="red-line-notice" style="margin-top: 1.5rem;">
                                    <div class="red-line-notice-title">{"⚠️ 制度红线"}</div>
                                    <div class="red-line-notice-text">
                                        {"当前振幅低于阈值，该机芯禁止直接返客，须走复检工位二次采集确认或创建返修申请"}
                                    </div>
                                </div>
                            }
                        } else {
                            html! {}
                        }
                    }
                </div>
            </div>

            <div class="card" style="margin-top: 1.5rem;">
                <div class="card-header" style="cursor: pointer;" onclick={toggle_settings}>
                    <div class="card-title">{"检测设置"}</div>
                    <span>{if *settings_expanded { "▲" } else { "▼" }}</span>
                </div>
                {
                    if *settings_expanded {
                        html! {
                            <div class="card-body">
                                <div class="settings-grid">
                                    <div class="form-group">
                                        <label class="form-label">{"振幅阈值 (度)"}</label>
                                        <input
                                            type="number"
                                            class="form-input"
                                            value={settings.amplitude_threshold.to_string()}
                                            oninput={handle_threshold_change}
                                            min="0"
                                            step="1"
                                        />
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">{"操作员"}</label>
                                        <input
                                            type="text"
                                            class="form-input"
                                            placeholder="请输入操作员姓名"
                                            value={settings.operator.clone()}
                                            oninput={handle_operator_change}
                                        />
                                    </div>
                                </div>
                            </div>
                        }
                    } else {
                        html! {}
                    }
                }
            </div>

            {
                if *show_waveform_viewer {
                    match &*last_waveform {
                        Some(wf) => html! {
                            <WaveformViewer
                                waveform={wf.clone()}
                                analysis={(*last_analysis).clone()}
                                on_close={close_waveform_viewer.clone()}
                                title={Some("波形详情".to_string())}
                            />
                        },
                        None => html! {},
                    }
                } else {
                    html! {}
                }
            }

            {
                if *show_repair_modal {
                    match &*pending_record {
                        Some(record) => html! {
                            <div class="modal-backdrop">
                                <div class="modal">
                                    <div class="modal-header">
                                        <h3 class="modal-title">{"⚠️ 振幅异常"}</h3>
                                        <button class="modal-close" onclick={
                                            let confirm = confirm_save_with_repair.clone();
                                            Callback::from(move |_| confirm.emit(false))
                                        }>
                                            {"×"}
                                        </button>
                                    </div>
                                    <div class="modal-body">
                                        <div class="red-line-notice">
                                            <div class="red-line-notice-title">{"制度红线提示"}</div>
                                            <div class="red-line-notice-text">
                                                {"标红机芯禁止直接返客，须走复检工位二次采集确认"}
                                            </div>
                                        </div>

                                        <p style="margin-top: 1rem;">
                                            {"检测到振幅低于阈值，是否自动创建返修申请？"}
                                        </p>

                                        <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                                            <p><strong>{"机芯编号:"}</strong> {&record.movement_id}</p>
                                            <p><strong>{"当前振幅:"}</strong>
                                                <span class="alert-text">
                                                    {format!(" {:.2}°", record.analysis.amplitude)}
                                                </span>
                                            </p>
                                            <p><strong>{"阈值:"}</strong> {format!("{:.2}°", record.analysis.threshold)}</p>
                                        </div>
                                    </div>
                                    <div class="modal-footer">
                                        <button class="btn btn-secondary" onclick={
                                            let confirm = confirm_save_with_repair.clone();
                                            Callback::from(move |_| confirm.emit(false))
                                        }>
                                            {"仅保存记录"}
                                        </button>
                                        <button class="btn btn-danger" onclick={
                                            let confirm = confirm_save_with_repair.clone();
                                            Callback::from(move |_| confirm.emit(true))
                                        }>
                                            {"创建返修申请"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        },
                        None => html! {},
                    }
                } else {
                    html! {}
                }
            }
        </div>
    }
}

fn draw_live_waveform(
    canvas_ref: &NodeRef,
    samples: &[f32],
    amplitude: f64,
    threshold: f64,
) {
    if let Some(canvas) = canvas_ref.cast::<HtmlCanvasElement>() {
        if let Ok(ctx) = canvas.get_context("2d") {
            let ctx: CanvasRenderingContext2d = ctx.unwrap();
            let width = canvas.width() as f64;
            let height = canvas.height() as f64;

            ctx.set_fill_style(&"#1a202c".into());
            ctx.fill_rect(0.0, 0.0, width, height);

            let center = height / 2.0;
            let scale = (height / 2.0) * 0.85;

            let display_samples = if samples.len() > width as usize {
                let step = samples.len() / width as usize;
                samples.iter().step_by(step).cloned().collect::<Vec<f32>>()
            } else {
                samples.to_vec()
            };

            let is_below = amplitude < threshold && amplitude > 0.0;
            let line_color = if is_below { "#fc8181" } else { "#63b3ed" };
            ctx.set_stroke_style(&line_color.into());
            ctx.set_line_width(1.5);

            ctx.begin_path();
            for (i, &sample) in display_samples.iter().enumerate() {
                let x = (i as f64 / display_samples.len() as f64) * width;
                let y = center - (sample as f64 * scale);
                if i == 0 {
                    ctx.move_to(x, y);
                } else {
                    ctx.line_to(x, y);
                }
            }
            ctx.stroke();

            if threshold > 0.0 {
                let normalized_threshold = threshold / 360.0;
                let threshold_y = center - normalized_threshold * scale;
                ctx.set_stroke_style(&"#f6ad55".into());
                ctx.set_line_width(1.0);
                let _ = ctx.set_line_dash(&[5.0, 5.0]);
                ctx.begin_path();
                ctx.move_to(0.0, threshold_y);
                ctx.line_to(width, threshold_y);
                ctx.stroke();
                let _ = ctx.set_line_dash(&[]);
            }
        }
    }
}
