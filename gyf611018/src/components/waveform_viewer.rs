use yew::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{HtmlCanvasElement, CanvasRenderingContext2d};
use crate::waveform::{WaveformData, WaveformAnalysis, downsample};

#[derive(Properties, PartialEq)]
pub struct WaveformThumbnailProps {
    pub waveform: WaveformData,
    pub analysis: Option<WaveformAnalysis>,
    #[prop_or(120)]
    pub width: u32,
    #[prop_or(40)]
    pub height: u32,
    #[prop_or(false)]
    pub is_alert: bool,
}

#[function_component(WaveformThumbnail)]
pub fn waveform_thumbnail(props: &WaveformThumbnailProps) -> Html {
    let canvas_ref = use_node_ref();
    let waveform = props.waveform.clone();
    let is_alert = props.is_alert;
    let width = props.width;
    let height = props.height;

    use_effect_with_deps(
        move |(canvas, wf, alert, w, h)| {
            draw_thumbnail(canvas, wf, *alert, *w, *h);
            || {}
        },
        (canvas_ref.clone(), waveform, is_alert, width, height),
    );

    html! {
        <canvas
            ref={canvas_ref}
            class="waveform-thumbnail"
            width={width.to_string()}
            height={height.to_string()}
        />
    }
}

fn draw_thumbnail(
    canvas_ref: &NodeRef,
    waveform: &WaveformData,
    is_alert: bool,
    width: u32,
    height: u32,
) {
    if let Some(canvas) = canvas_ref.cast::<HtmlCanvasElement>() {
        if let Ok(ctx) = canvas.get_context("2d") {
            let ctx: CanvasRenderingContext2d = ctx.unwrap();

            ctx.set_fill_style(&"#ffffff".into());
            ctx.fill_rect(0.0, 0.0, width as f64, height as f64);

            let line_color = if is_alert { "#e53e3e" } else { "#3182ce" };
            ctx.set_stroke_style(&line_color.into());
            ctx.set_line_width(1.0);

            let samples = downsample(&waveform.samples, width as usize);
            let center = height as f64 / 2.0;
            let scale = (height as f64 / 2.0) * 0.8;

            ctx.begin_path();
            for (i, &sample) in samples.iter().enumerate() {
                let x = i as f64;
                let y = center - (sample as f64 * scale);
                if i == 0 {
                    ctx.move_to(x, y);
                } else {
                    ctx.line_to(x, y);
                }
            }
            ctx.stroke();

            if is_alert {
                ctx.set_stroke_style(&"#e53e3e".into());
                ctx.set_line_width(2.0);
                ctx.stroke_rect(0.0, 0.0, width as f64, height as f64);
            }
        }
    }
}

#[derive(Properties, PartialEq)]
pub struct WaveformViewerProps {
    pub waveform: WaveformData,
    pub analysis: Option<WaveformAnalysis>,
    #[prop_or(800)]
    pub width: u32,
    #[prop_or(300)]
    pub height: u32,
    pub title: Option<String>,
    pub on_close: Callback<()>,
}

#[function_component(WaveformViewer)]
pub fn waveform_viewer(props: &WaveformViewerProps) -> Html {
    let canvas_ref = use_node_ref();
    let waveform = props.waveform.clone();
    let analysis = props.analysis.clone();
    let width = props.width;
    let height = props.height;
    let on_close = props.on_close.clone();

    use_effect_with_deps(
        move |(canvas, wf, an, w, h)| {
            draw_waveform(canvas, wf, an.as_ref(), *w, *h);
            || {}
        },
        (canvas_ref.clone(), waveform, analysis, width, height),
    );

    let handle_backdrop_click = {
        let on_close = on_close.clone();
        Callback::from(move |e: MouseEvent| {
            if e.target().is_some() {
                let target = e.target().unwrap();
                if let Some(el) = target.dyn_ref::<web_sys::HtmlDivElement>() {
                    if el.class_list().contains("waveform-modal") {
                        on_close.emit(());
                    }
                }
            }
        })
    };

    html! {
        <div class="waveform-modal" onclick={handle_backdrop_click}>
            <div class="waveform-modal-content" onclick={Callback::from(|e: MouseEvent| e.stop_propagation())}>
                {
                    if let Some(title) = &props.title {
                        html! { <h3 style="margin-bottom: 1rem; color: var(--text-primary);">{title}</h3> }
                    } else {
                        html! {}
                    }
                }
                <canvas
                    ref={canvas_ref}
                    class="waveform-modal-canvas"
                    width={width.to_string()}
                    height={height.to_string()}
                />
                {
                    if let Some(analysis) = &props.analysis {
                        html! {
                            <div style="margin-top: 1rem; display: flex; gap: 2rem; flex-wrap: wrap;">
                                <div>
                                    <span style="color: var(--text-secondary); font-size: 0.9rem;">{"振幅:"}</span>
                                    <span style={
                                        if analysis.is_below_threshold {
                                            "color: var(--danger-color); font-weight: 600; margin-left: 0.5rem;"
                                        } else {
                                            "color: var(--success-color); font-weight: 600; margin-left: 0.5rem;"
                                        }
                                    }>
                                        {format!("{:.2}°", analysis.amplitude)}
                                    </span>
                                </div>
                                <div>
                                    <span style="color: var(--text-secondary); font-size: 0.9rem;">{"频率:"}</span>
                                    <span style="margin-left: 0.5rem; font-weight: 500;">
                                        {format!("{:.4} Hz", analysis.frequency)}
                                    </span>
                                </div>
                                <div>
                                    <span style="color: var(--text-secondary); font-size: 0.9rem;">{"峰峰值:"}</span>
                                    <span style="margin-left: 0.5rem; font-weight: 500;">
                                        {format!("{:.2}", analysis.peak_to_peak)}
                                    </span>
                                </div>
                                <div>
                                    <span style="color: var(--text-secondary); font-size: 0.9rem;">{"阈值:"}</span>
                                    <span style="margin-left: 0.5rem; font-weight: 500;">
                                        {format!("{:.2}°", analysis.threshold)}
                                    </span>
                                </div>
                            </div>
                        }
                    } else {
                        html! {}
                    }
                }
                <div style="margin-top: 1rem; text-align: right;">
                    <button class="btn btn-secondary" onclick={move |_| on_close.emit(())}>
                        {"关闭"}
                    </button>
                </div>
            </div>
        </div>
    }
}

fn draw_waveform(
    canvas_ref: &NodeRef,
    waveform: &WaveformData,
    analysis: Option<&WaveformAnalysis>,
    width: u32,
    height: u32,
) {
    if let Some(canvas) = canvas_ref.cast::<HtmlCanvasElement>() {
        if let Ok(ctx) = canvas.get_context("2d") {
            let ctx: CanvasRenderingContext2d = ctx.unwrap();

            ctx.set_fill_style(&"#1a202c".into());
            ctx.fill_rect(0.0, 0.0, width as f64, height as f64);

            ctx.set_stroke_style(&"#2d3748".into());
            ctx.set_line_width(0.5);
            let grid_lines = 5;
            for i in 0..=grid_lines {
                let y = (height as f64 / grid_lines as f64) * i as f64;
                ctx.begin_path();
                ctx.move_to(0.0, y);
                ctx.line_to(width as f64, y);
                ctx.stroke();
            }

            ctx.set_stroke_style(&"#4a5568".into());
            ctx.set_line_width(1.0);
            let center = height as f64 / 2.0;
            ctx.begin_path();
            ctx.move_to(0.0, center);
            ctx.line_to(width as f64, center);
            ctx.stroke();

            let is_alert = analysis.map(|a| a.is_below_threshold).unwrap_or(false);
            let line_color = if is_alert { "#fc8181" } else { "#63b3ed" };
            ctx.set_stroke_style(&line_color.into());
            ctx.set_line_width(1.5);

            let samples = if waveform.samples.len() > width as usize {
                downsample(&waveform.samples, width as usize)
            } else {
                waveform.samples.clone()
            };

            let scale = (height as f64 / 2.0) * 0.85;

            ctx.begin_path();
            for (i, &sample) in samples.iter().enumerate() {
                let x = (i as f64 / samples.len() as f64) * width as f64;
                let y = center - (sample as f64 * scale);
                if i == 0 {
                    ctx.move_to(x, y);
                } else {
                    ctx.line_to(x, y);
                }
            }
            ctx.stroke();

            if let Some(analysis) = analysis {
                if analysis.threshold > 0.0 {
                    let threshold_y = center - (analysis.threshold / 360.0 * scale);
                    ctx.set_stroke_style(&"#f6ad55".into());
                    ctx.set_line_width(1.0);
                    ctx.set_line_dash(&[5.0, 5.0]).unwrap();
                    ctx.begin_path();
                    ctx.move_to(0.0, threshold_y);
                    ctx.line_to(width as f64, threshold_y);
                    ctx.stroke();
                    ctx.set_line_dash(&[]).unwrap();

                    ctx.set_fill_style(&"#f6ad55".into());
                    ctx.font("12px sans-serif");
                    ctx.fill_text("阈值", width as f64 - 60.0, threshold_y - 5.0).unwrap();
                }
            }
        }
    }
}
