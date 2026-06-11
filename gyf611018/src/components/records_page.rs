use yew::prelude::*;
use crate::models::{DetectionRecord, DetectionStatus, AppSettings};
use crate::storage::{load_records, update_record, load_settings};
use crate::waveform::WaveformData;
use crate::components::{WaveformThumbnail, WaveformViewer};
use crate::export::{export_to_brand_csv, download_csv, generate_brand_exchange_format, download_json};
use chrono::{DateTime, Local, TimeZone};
use uuid::Uuid;

const PAGE_SIZE: usize = 10;

#[function_component(RecordsPage)]
pub fn records_page() -> Html {
    let records = use_state(|| Vec::<DetectionRecord>::new());
    let settings = use_state(|| AppSettings::default());
    let search_query = use_state(|| String::new());
    let filter_status = use_state(|| None::<DetectionStatus>);
    let current_page = use_state(|| 1u32);
    let selected_record = use_state(|| None::<DetectionRecord>);
    let show_waveform = use_state(|| false);
    let show_export_menu = use_state(|| false);

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

    let filtered_records: Vec<&DetectionRecord> = records
        .iter()
        .filter(|r| {
            if !search_query.is_empty() {
                let query = search_query.to_lowercase();
                r.movement_id.to_lowercase().contains(&query)
                    || r.id.to_string().to_lowercase().contains(&query)
                    || r.operator.to_lowercase().contains(&query)
            } else {
                true
            }
        })
        .filter(|r| {
            if let Some(status) = &*filter_status {
                &r.status == status
            } else {
                true
            }
        })
        .collect();

    let total_pages = (filtered_records.len() as f64 / PAGE_SIZE as f64).ceil() as u32;
    let start_idx = (*current_page - 1) as usize * PAGE_SIZE;
    let end_idx = (start_idx + PAGE_SIZE).min(filtered_records.len());
    let page_records = &filtered_records[start_idx..end_idx];

    let handle_search = {
        let search_query = search_query.clone();
        let current_page = current_page.clone();
        Callback::from(move |e: InputEvent| {
            let target = e.target().unwrap();
            let input = target.dyn_ref::<web_sys::HtmlInputElement>().unwrap();
            search_query.set(input.value());
            current_page.set(1);
        })
    };

    let handle_status_filter = {
        let filter_status = filter_status.clone();
        let current_page = current_page.clone();
        Callback::from(move |e: Event| {
            let target = e.target().unwrap();
            let select = target.dyn_ref::<web_sys::HtmlSelectElement>().unwrap();
            let value = select.value();
            filter_status.set(match value.as_str() {
                "all" => None,
                "normal" => Some(DetectionStatus::Normal),
                "warning" => Some(DetectionStatus::Warning),
                "critical" => Some(DetectionStatus::Critical),
                "recheck" => Some(DetectionStatus::PendingRecheck),
                "recheck_passed" => Some(DetectionStatus::RecheckPassed),
                "repaired" => Some(DetectionStatus::Repaired),
                _ => None,
            });
            current_page.set(1);
        })
    };

    let view_waveform = {
        let selected_record = selected_record.clone();
        let show_waveform = show_waveform.clone();
        Callback::from(move |record: DetectionRecord| {
            selected_record.set(Some(record));
            show_waveform.set(true);
        })
    };

    let close_waveform = {
        let show_waveform = show_waveform.clone();
        Callback::from(move |_| {
            show_waveform.set(false);
        })
    };

    let export_csv = {
        let records = records.clone();
        let settings = settings.clone();
        Callback::from(move |_| {
            match export_to_brand_csv(&records, &settings) {
                Ok(csv_data) => {
                    let filename = format!(
                        "检测记录_{}.csv",
                        Local::now().format("%Y%m%d_%H%M%S")
                    );
                    let _ = download_csv(&csv_data, &filename);
                }
                Err(e) => {
                    gloo_console::error!(format!("导出失败: {}", e));
                }
            }
        })
    };

    let export_brand_format = {
        let records = records.clone();
        let settings = settings.clone();
        Callback::from(move |_| {
            match generate_brand_exchange_format(&records, &settings) {
                Ok(data) => {
                    match serde_json::to_string_pretty(&data) {
                        Ok(json_str) => {
                            let filename = format!(
                                "品牌交换格式_{}.json",
                                Local::now().format("%Y%m%d_%H%M%S")
                            );
                            let _ = download_json(&json_str, &filename);
                        }
                        Err(e) => {
                            gloo_console::error!(format!("序列化失败: {}", e));
                        }
                    }
                }
                Err(e) => {
                    gloo_console::error!(format!("导出失败: {}", e));
                }
            }
        })
    };

    let go_to_page = {
        let current_page = current_page.clone();
        Callback::from(move |page: u32| {
            current_page.set(page);
        })
    };

    let mark_as_repaired = {
        let records = records.clone();
        let selected_record = selected_record.clone();
        let show_waveform = show_waveform.clone();
        Callback::from(move |id: Uuid| {
            let mut updated_records: Vec<DetectionRecord> = records
                .iter()
                .map(|r| {
                    if r.id == id {
                        let mut r = r.clone();
                        r.status = DetectionStatus::Repaired;
                        let _ = update_record(&r);
                        r
                    } else {
                        r.clone()
                    }
                })
                .collect();
            records.set(updated_records);
            show_waveform.set(false);
            selected_record.set(None);
        })
    };

    html! {
        <div class="records-page">
            <div class="page-header">
                <h1 class="page-title">{"检测记录查询"}</h1>
                <p class="page-subtitle">
                    {"共 "}<strong>{filtered_records.len()}</strong>{" 条记录"}
                </p>
            </div>

            <div class="toolbar">
                <div class="toolbar-left">
                    <input
                        type="text"
                        class="search-input"
                        placeholder="搜索机芯编号、记录ID、操作员..."
                        value={(*search_query).clone()}
                        oninput={handle_search}
                    />
                    <select class="form-input" style="width: auto;" onchange={handle_status_filter}>
                        <option value="all">{"全部状态"}</option>
                        <option value="normal">{"正常"}</option>
                        <option value="warning">{"警告"}</option>
                        <option value="critical">{"异常"}</option>
                        <option value="recheck">{"待复检"}</option>
                        <option value="recheck_passed">{"复检通过"}</option>
                        <option value="repaired">{"已返修"}</option>
                    </select>
                </div>
                <div class="toolbar-right">
                    <button class="btn btn-secondary" onclick={export_csv.clone()}>
                        {"📊 导出CSV"}
                    </button>
                    <button class="btn btn-primary" onclick={export_brand_format.clone()}>
                        {"📤 品牌交换格式"}
                    </button>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 60px;">{"序号"}</th>
                            <th>{"机芯编号"}</th>
                            <th style="width: 140px;">{"波形"}</th>
                            <th>{"振幅"}</th>
                            <th>{"频率"}</th>
                            <th>{"状态"}</th>
                            <th>{"班次"}</th>
                            <th>{"操作员"}</th>
                            <th>{"检测时间"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            if page_records.is_empty() {
                                html! {
                                    <tr>
                                        <td colspan="9" class="empty-state" style="padding: 3rem 1rem;">
                                            <div class="empty-state-icon">{"📋"}</div>
                                            <div class="empty-state-text">{"暂无检测记录"}</div>
                                        </td>
                                    </tr>
                                }
                            } else {
                                    page_records.iter().enumerate().map(|(idx, record)| {
                                        let record_clone = (*record).clone();
                                        let view_waveform = view_waveform.clone();
                                        let is_alert = record.is_alert();
                                        let row_class = if is_alert { "alert-row" } else { "" };

                                        html! {
                                            <tr class={row_class}>
                                                <td>{start_idx + idx + 1}</td>
                                                <td>
                                                    <strong style={if is_alert { "color: var(--danger-color);" } else { "" }}>
                                                        {&record.movement_id}
                                                    </strong>
                                                    {
                                                        if record.is_recheck {
                                                            html! {
                                                                <span class="badge badge-warning" style="margin-left: 0.5rem;">
                                                                    {"复检"}
                                                                </span>
                                                            }
                                                        } else {
                                                            html! {}
                                                        }
                                                    }
                                                </td>
                                                <td>
                                                    <div onclick={
                                                        let record = record_clone.clone();
                                                        Callback::from(move |_| view_waveform.emit(record.clone()))
                                                    }>
                                                        <WaveformThumbnail
                                                            waveform={record.waveform_data.clone()}
                                                            analysis={Some(record.analysis.clone())}
                                                            is_alert={is_alert}
                                                        />
                                                    </div>
                                                </td>
                                                <td class={
                                                    if is_alert { "alert-text" } else { "normal-text" }
                                                }>
                                                    <strong>{format!("{:.2}°", record.analysis.amplitude)}</strong>
                                                </td>
                                                <td>{format!("{:.4} Hz", record.analysis.frequency)}</td>
                                                <td>
                                                    <span class={
                                                        match record.status {
                                                            DetectionStatus::Normal => "badge badge-success",
                                                            DetectionStatus::Warning => "badge badge-warning",
                                                            DetectionStatus::Critical => "badge badge-danger",
                                                            DetectionStatus::PendingRecheck => "badge badge-warning",
                                                            DetectionStatus::RecheckPassed => "badge badge-success",
                                                            DetectionStatus::Repaired => "badge badge-info",
                                                        }
                                                    }>
                                                        {record.status.label()}
                                                    </span>
                                                </td>
                                                <td>{record.shift.label()}</td>
                                                <td>{&record.operator}</td>
                                                <td style="font-size: 0.85rem; color: var(--text-muted);">
                                                    {record.created_at.format("%Y-%m-%d %H:%M:%S").to_string()}
                                                </td>
                                            </tr>
                                        }
                                    }).collect::<Html>()
                            }
                        }
                    </tbody>
                </table>
            </div>

            if total_pages > 1 {
                <div class="pagination">
                    <button
                        class="page-btn"
                        disabled={*current_page == 1}
                        onclick={
                            let current_page = *current_page;
                            let go_to_page = go_to_page.clone();
                            Callback::from(move |_| go_to_page.emit(current_page - 1))
                        }
                    >
                        {"上一页"}
                    </button>
                    {
                        (1..=total_pages).map(|page| {
                            let go_to_page = go_to_page.clone();
                            let is_active = page == *current_page;
                            html! {
                                <button
                                    class={classes!("page-btn", if is_active { Some("active") } else { None })}
                                    onclick={Callback::from(move |_| go_to_page.emit(page))}
                                >
                                    {page}
                                </button>
                            }
                        }).collect::<Html>()
                    }
                    <button
                        class="page-btn"
                        disabled={*current_page == total_pages}
                        onclick={
                            let current_page = *current_page;
                            let go_to_page = go_to_page.clone();
                            Callback::from(move |_| go_to_page.emit(current_page + 1))
                        }
                    >
                        {"下一页"}
                    </button>
                </div>
            }

            {
                if *show_waveform {
                    match &*selected_record {
                        Some(record) => html! {
                            <WaveformViewer
                                waveform={record.waveform_data.clone()}
                                analysis={Some(record.analysis.clone())}
                                on_close={close_waveform.clone()}
                                title={Some(format!("波形详情 - {}", record.movement_id))}
                            />
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
