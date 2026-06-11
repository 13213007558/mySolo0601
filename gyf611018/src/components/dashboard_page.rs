use yew::prelude::*;
use chrono::{Local, NaiveDate};
use crate::models::{ShiftType, DetectionRecord, DetectionStatus, AppSettings};
use crate::storage::{load_records, get_shift_summary, load_settings};
use crate::export::{export_to_brand_csv, download_csv};

#[function_component(DashboardPage)]
pub fn dashboard_page() -> Html {
    let records = use_state(|| Vec::<DetectionRecord>::new());
    let settings = use_state(|| AppSettings::default());
    let selected_date = use_state(|| Local::now().date_naive());

    {
        let records = records.clone();
        let settings = settings.clone();
        use_effect_with_deps(
            move |_| {
                records.set(load_records());
                settings.set(load_settings());
                || {}
            },
            (),
        );
    }

    let morning_summary = get_shift_summary(*selected_date, ShiftType::Morning);
    let afternoon_summary = get_shift_summary(*selected_date, ShiftType::Afternoon);
    let night_summary = get_shift_summary(*selected_date, ShiftType::Night);

    let total_today = morning_summary.total_count + afternoon_summary.total_count + night_summary.total_count;
    let total_normal = morning_summary.normal_count + afternoon_summary.normal_count + night_summary.normal_count;
    let total_alert = morning_summary.alert_count + afternoon_summary.alert_count + night_summary.alert_count;
    let total_repair = morning_summary.repair_count + afternoon_summary.repair_count + night_summary.repair_count;

    let export_shift_csv = {
        let records = records.clone();
        let settings = settings.clone();
        let date = *selected_date;
        Callback::from(move |shift: ShiftType| {
            let shift_records: Vec<DetectionRecord> = records
                .iter()
                .filter(|r| r.shift_date == date && r.shift == shift)
                .cloned()
                .collect();

            match export_to_brand_csv(&shift_records, &settings) {
                Ok(csv_data) => {
                    let filename = format!(
                        "{}_{}_检测记录.csv",
                        date.format("%Y%m%d"),
                        shift.label()
                    );
                    let _ = download_csv(&csv_data, &filename);
                }
                Err(e) => {
                    gloo_console::error!(format!("导出失败: {}", e));
                }
            }
        })
    };

    let export_all_csv = {
        let records = records.clone();
        let settings = settings.clone();
        let date = *selected_date;
        Callback::from(move |_| {
            let day_records: Vec<DetectionRecord> = records
                .iter()
                .filter(|r| r.shift_date == date)
                .cloned()
                .collect();

            match export_to_brand_csv(&day_records, &settings) {
                Ok(csv_data) => {
                    let filename = format!(
                        "{}_全天检测记录.csv",
                        date.format("%Y%m%d")
                    );
                    let _ = download_csv(&csv_data, &filename);
                }
                Err(e) => {
                    gloo_console::error!(format!("导出失败: {}", e));
                }
            }
        })
    };

    html! {
        <div class="dashboard-page">
            <div class="page-header">
                <h1 class="page-title">{"班次批量检测看板"}</h1>
                <p class="page-subtitle">
                    {"日期: "}
                    <strong>{selected_date.format("%Y年%m月%d日").to_string()}</strong>
                    <button
                        class="btn btn-secondary btn-sm"
                        style="margin-left: 1rem;"
                        onclick={export_all_csv}
                    >
                        {"📤 导出当日全部"}
                    </button>
                </p>
            </div>

            <div class="dashboard-grid">
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-label">{"今日总检测"}</span>
                        <span class="stat-icon">{"📊"}</span>
                    </div>
                    <div class="stat-value">{total_today}</div>
                    <div class="stat-change" style="color: var(--text-muted);">
                        {"条记录"}
                    </div>
                </div>

                <div class="stat-card success">
                    <div class="stat-card-header">
                        <span class="stat-label">{"正常通过"}</span>
                        <span class="stat-icon">{"✅"}</span>
                    </div>
                    <div class="stat-value">{total_normal}</div>
                    <div class="stat-change">
                        {if total_today > 0 {
                            format!("{:.1}% 合格率", total_normal as f64 / total_today as f64 * 100.0)
                        } else {
                            "-".to_string()
                        }}
                    </div>
                </div>

                <div class="stat-card danger">
                    <div class="stat-card-header">
                        <span class="stat-label">{"振幅异常"}</span>
                        <span class="stat-icon">{"⚠️"}</span>
                    </div>
                    <div class="stat-value">{total_alert}</div>
                    <div class="stat-change" style="color: var(--danger-color);">
                        {if total_today > 0 {
                            format!("{:.1}% 异常率", total_alert as f64 / total_today as f64 * 100.0)
                        } else {
                            "-".to_string()
                        }}
                    </div>
                </div>

                <div class="stat-card warning">
                    <div class="stat-card-header">
                        <span class="stat-label">{"返修申请"}</span>
                        <span class="stat-icon">{"🔧"}</span>
                    </div>
                    <div class="stat-value">{total_repair}</div>
                    <div class="stat-change" style="color: var(--warning-color);">
                        {"待处理返修单"}
                    </div>
                </div>
            </div>

            <div class="shift-summary" style="margin-top: 2rem;">
                <ShiftCard
                    shift={ShiftType::Morning}
                    summary={morning_summary}
                    on_export={export_shift_csv.clone()}
                />
                <ShiftCard
                    shift={ShiftType::Afternoon}
                    summary={afternoon_summary}
                    on_export={export_shift_csv.clone()}
                />
                <ShiftCard
                    shift={ShiftType::Night}
                    summary={night_summary}
                    on_export={export_shift_csv}
                />
            </div>

            <div class="card" style="margin-top: 2rem;">
                <div class="card-header">
                    <div class="card-title">{"实时班次数据"}</div>
                </div>
                <div class="card-body">
                    <div class="chart-container">
                        <h3 class="chart-title">{"各班次检测数量分布"}</h3>
                        <div style="display: flex; align-items: flex-end; height: 200px; gap: 2rem; padding: 1rem 0;">
                            <ShiftBar
                                label="早班"
                                count={morning_summary.total_count}
                                alert_count={morning_summary.alert_count}
                                max_count={total_today.max(1)}
                                color="#3182ce"
                            />
                            <ShiftBar
                                label="午班"
                                count={afternoon_summary.total_count}
                                alert_count={afternoon_summary.alert_count}
                                max_count={total_today.max(1)}
                                color="#38a169"
                            />
                            <ShiftBar
                                label="夜班"
                                count={night_summary.total_count}
                                alert_count={night_summary.alert_count}
                                max_count={total_today.max(1)}
                                color="#805ad5"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}

#[derive(Properties, PartialEq)]
struct ShiftCardProps {
    shift: ShiftType,
    summary: crate::models::ShiftSummary,
    on_export: Callback<ShiftType>,
}

#[function_component(ShiftCard)]
fn shift_card(props: &ShiftCardProps) -> Html {
    let shift = props.shift.clone();
    let on_export = props.on_export.clone();

    html! {
        <div class="card">
            <div class="card-header">
                <div class="card-title">{shift.label()}</div>
                <button
                    class="btn btn-secondary btn-sm"
                    onclick={Callback::from(move |_| on_export.emit(shift.clone()))}
                >
                    {"导出"}
                </button>
            </div>
            <div class="card-body">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">{"检测数"}</div>
                        <div style="font-size: 1.5rem; font-weight: 700;">
                            {props.summary.total_count}
                        </div>
                    </div>
                    <div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">{"合格率"}</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--success-color);">
                            {if props.summary.total_count > 0 {
                                format!("{:.1}%", props.summary.normal_count as f64 / props.summary.total_count as f64 * 100.0)
                            } else {
                                "-".to_string()
                            }}
                        </div>
                    </div>
                    <div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">{"异常数"}</div>
                        <div style="font-size: 1.25rem; font-weight: 600; color: var(--danger-color);">
                            {props.summary.alert_count}
                        </div>
                    </div>
                    <div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">{"平均振幅"}</div>
                        <div style="font-size: 1.25rem; font-weight: 600;">
                            {format!("{:.1}°", props.summary.avg_amplitude)}
                        </div>
                    </div>
                    <div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">{"最小振幅"}</div>
                        <div style="font-size: 1.1rem; color: var(--danger-color);">
                            {format!("{:.1}°", props.summary.min_amplitude)}
                        </div>
                    </div>
                    <div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">{"最大振幅"}</div>
                        <div style="font-size: 1.1rem; color: var(--success-color);">
                            {format!("{:.1}°", props.summary.max_amplitude)}
                        </div>
                    </div>
                </div>

                {
                    if props.summary.alert_count > 0 {
                        html! {
                            <div class="red-line-notice" style="margin-top: 1rem;">
                                <div class="red-line-notice-title">{"⚠️ 制度红线"}</div>
                                <div class="red-line-notice-text">
                                    {format!("本班次有 {} 台机芯振幅不达标，禁止直接返客，须走复检或返修流程", props.summary.alert_count)}
                                </div>
                            </div>
                        }
                    } else {
                        html! {}
                    }
                }
            </div>
        </div>
    }
}

#[derive(Properties, PartialEq)]
struct ShiftBarProps {
    label: String,
    count: usize,
    alert_count: usize,
    max_count: usize,
    color: String,
}

#[function_component(ShiftBar)]
fn shift_bar(props: &ShiftBarProps) -> Html {
    let height = if props.max_count > 0 {
        (props.count as f64 / props.max_count as f64 * 160.0).max(20.0)
    } else {
        20.0
    };

    let alert_height = if props.count > 0 {
        (props.alert_count as f64 / props.count as f64 * height)
    } else {
        0.0
    };

    let normal_height = height - alert_height;

    html! {
        <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
            <div style="font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-secondary);">
                {props.count}{" 台"}
            </div>
            <div style="
                width: 60px;
                height: 160px;
                background: var(--bg-tertiary);
                border-radius: 8px 8px 0 0;
                display: flex;
                flex-direction: column;
                justify-content: flex-end;
                overflow: hidden;
            ">
                <div
                    style={format!(
                        "height: {}px; background: {};",
                        normal_height, props.color
                    )}
                />
                <div
                    style={format!(
                        "height: {}px; background: var(--danger-color);",
                        alert_height
                    )}
                />
            </div>
            <div style="margin-top: 0.5rem; font-weight: 500;">{&props.label}</div>
            {
                if props.alert_count > 0 {
                    html! {
                        <div style="font-size: 0.8rem; color: var(--danger-color);">
                            {format!("{} 异常", props.alert_count)}
                        </div>
                    }
                } else {
                    html! {}
                }
            }
        </div>
    }
}
