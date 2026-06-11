use yew::prelude::*;
use crate::models::{RepairRequest, RepairStatus, DetectionRecord};
use crate::storage::{load_repair_requests, update_repair_request, load_records};
use uuid::Uuid;

#[function_component(RepairPage)]
pub fn repair_page() -> Html {
    let repairs = use_state(|| Vec::<RepairRequest>::new());
    let records = use_state(|| Vec::<DetectionRecord>::new());
    let filter_status = use_state(|| None::<RepairStatus>);
    let selected_repair = use_state(|| None::<RepairRequest>);
    let show_detail = use_state(|| false);

    {
        let repairs = repairs.clone();
        let records = records.clone();
        use_effect_with_deps(
            move |_| {
                repairs.set(load_repair_requests());
                records.set(load_records());
                || {}
            },
            (),
        );
    }

    let filtered_repairs: Vec<&RepairRequest> = repairs
        .iter()
        .filter(|r| {
            if let Some(status) = &*filter_status {
                &r.status == status
            } else {
                true
            }
        })
        .collect();

    let pending_count = repairs.iter().filter(|r| r.status == RepairStatus::Pending).count();
    let approved_count = repairs.iter().filter(|r| r.status == RepairStatus::Approved).count();
    let completed_count = repairs.iter().filter(|r| r.status == RepairStatus::Completed).count();

    let handle_status_filter = {
        let filter_status = filter_status.clone();
        Callback::from(move |e: Event| {
            let target = e.target().unwrap();
            let select = target.dyn_ref::<web_sys::HtmlSelectElement>().unwrap();
            let value = select.value();
            filter_status.set(match value.as_str() {
                "all" => None,
                "pending" => Some(RepairStatus::Pending),
                "approved" => Some(RepairStatus::Approved),
                "rejected" => Some(RepairStatus::Rejected),
                "completed" => Some(RepairStatus::Completed),
                _ => None,
            });
        })
    };

    let view_detail = {
        let selected_repair = selected_repair.clone();
        let show_detail = show_detail.clone();
        Callback::from(move |repair: RepairRequest| {
            selected_repair.set(Some(repair));
            show_detail.set(true);
        })
    };

    let close_detail = {
        let show_detail = show_detail.clone();
        Callback::from(move |_| {
            show_detail.set(false);
        })
    };

    let approve_repair = {
        let repairs = repairs.clone();
        let selected_repair = selected_repair.clone();
        let show_detail = show_detail.clone();
        Callback::from(move |id: Uuid| {
            let updated: Vec<RepairRequest> = repairs
                .iter()
                .map(|r| {
                    if r.id == id {
                        let mut r = r.clone();
                        r.status = RepairStatus::Approved;
                        r.approved_at = Some(chrono::Local::now());
                        r.approved_by = Some("系统管理员".to_string());
                        let _ = update_repair_request(&r);
                        r
                    } else {
                        r.clone()
                    }
                })
                .collect();
            repairs.set(updated);
            show_detail.set(false);
            selected_repair.set(None);
        })
    };

    let reject_repair = {
        let repairs = repairs.clone();
        let selected_repair = selected_repair.clone();
        let show_detail = show_detail.clone();
        Callback::from(move |id: Uuid| {
            let updated: Vec<RepairRequest> = repairs
                .iter()
                .map(|r| {
                    if r.id == id {
                        let mut r = r.clone();
                        r.status = RepairStatus::Rejected;
                        r.approved_at = Some(chrono::Local::now());
                        r.approved_by = Some("系统管理员".to_string());
                        let _ = update_repair_request(&r);
                        r
                    } else {
                        r.clone()
                    }
                })
                .collect();
            repairs.set(updated);
            show_detail.set(false);
            selected_repair.set(None);
        })
    };

    let complete_repair = {
        let repairs = repairs.clone();
        let selected_repair = selected_repair.clone();
        let show_detail = show_detail.clone();
        Callback::from(move |id: Uuid| {
            let updated: Vec<RepairRequest> = repairs
                .iter()
                .map(|r| {
                    if r.id == id {
                        let mut r = r.clone();
                        r.status = RepairStatus::Completed;
                        let _ = update_repair_request(&r);
                        r
                    } else {
                        r.clone()
                    }
                })
                .collect();
            repairs.set(updated);
            show_detail.set(false);
            selected_repair.set(None);
        })
    };

    html! {
        <div class="repair-page">
            <div class="page-header">
                <h1 class="page-title">{"返修申请管理"}</h1>
                <p class="page-subtitle">
                    {"共 "}<strong>{repairs.len()}</strong>{" 条返修申请，"}
                    <span style="color: var(--warning-color); font-weight: 600;">
                        {pending_count}{" 条待审批"}
                    </span>
                </p>
            </div>

            <div class="dashboard-grid">
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-label">{"待审批"}</span>
                        <span class="stat-icon">{"⏳"}</span>
                    </div>
                    <div class="stat-value" style="color: var(--warning-color);">{pending_count}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-label">{"已批准"}</span>
                        <span class="stat-icon">{"✅"}</span>
                    </div>
                    <div class="stat-value" style="color: var(--accent-color);">{approved_count}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-header">
                        <span class="stat-label">{"已完成"}</span>
                        <span class="stat-icon">🎉</span>
                    </div>
                    <div class="stat-value" style="color: var(--success-color);">{completed_count}</div>
                </div>
            </div>

            <div class="toolbar" style="margin-top: 2rem;">
                <div class="toolbar-left">
                    <select class="form-input" style="width: auto;" onchange={handle_status_filter}>
                        <option value="all">{"全部状态"}</option>
                        <option value="pending">{"待审批"}</option>
                        <option value="approved">{"已批准"}</option>
                        <option value="rejected">{"已拒绝"}</option>
                        <option value="completed">{"已完成"}</option>
                    </select>
                </div>
            </div>

            <div class="card" style="margin-top: 1rem;">
                <div class="card-header">
                    <div class="card-title">{"返修申请列表"}</div>
                </div>
                <div class="card-body">
                    {
                        if filtered_repairs.is_empty() {
                            html! {
                                <div class="empty-state">
                                    <div class="empty-state-icon">{"📋"}</div>
                                    <div class="empty-state-text">{"暂无返修申请"}</div>
                                </div>
                            }
                        } else {
                            html! {
                                <ul class="repair-list">
                                    {
                                        filtered_repairs.iter().map(|repair| {
                                            let repair_clone = (*repair).clone();
                                            let view_detail = view_detail.clone();
                                            let status_class = match repair.status {
                                                RepairStatus::Pending => "pending",
                                                RepairStatus::Approved => "approved",
                                                RepairStatus::Rejected => "rejected",
                                                RepairStatus::Completed => "approved",
                                            };

                                            html! {
                                                <li class={format!("repair-item {}", status_class)}>
                                                    <div class="repair-info">
                                                        <h4>{&repair.movement_id}</h4>
                                                        <p>{&repair.reason}</p>
                                                        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
                                                            {"申请时间: "}{repair.created_at.format("%Y-%m-%d %H:%M:%S").to_string()}
                                                        </p>
                                                    </div>
                                                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                                                        <span class={
                                                            match repair.status {
                                                                RepairStatus::Pending => "badge badge-warning",
                                                                RepairStatus::Approved => "badge badge-success",
                                                                RepairStatus::Rejected => "badge badge-danger",
                                                                RepairStatus::Completed => "badge badge-info",
                                                            }
                                                        }>
                                                            {repair.status.label()}
                                                        </span>
                                                        <button
                                                            class="btn btn-secondary btn-sm"
                                                            onclick={Callback::from(move |_| view_detail.emit(repair_clone.clone()))}
                                                        >
                                                            {"查看详情"}
                                                        </button>
                                                    </div>
                                                </li>
                                            }
                                        }).collect::<Html>()
                                    }
                                </ul>
                            }
                        }
                    }
                </div>
            </div>

            if *show_detail {
                if let Some(repair) = (*selected_repair).clone() {
                    let repair_id = repair.id;
                    let approve = approve_repair.clone();
                    let reject = reject_repair.clone();
                    let complete = complete_repair.clone();
                    let close = close_detail.clone();

                    html! {
                        <div class="modal-backdrop" onclick={
                            let close = close.clone();
                            Callback::from(move |e: MouseEvent| {
                                if e.target().is_some() {
                                    let target = e.target().unwrap();
                                    if let Some(el) = target.dyn_ref::<web_sys::HtmlDivElement>() {
                                        if el.class_list().contains("modal-backdrop") {
                                            close.emit(());
                                        }
                                    }
                                }
                            })
                        }>
                            <div class="modal" style="max-width: 600px;" onclick={Callback::from(|e: MouseEvent| e.stop_propagation())}>
                                <div class="modal-header">
                                    <h3 class="modal-title">{"返修申请详情"}</h3>
                                    <button class="modal-close" onclick={
                                        let close = close.clone();
                                        Callback::from(move |_| close.emit(()))
                                    }>
                                        {"×"}
                                    </button>
                                </div>
                                <div class="modal-body">
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                        <div>
                                            <label style="color: var(--text-secondary); font-size: 0.9rem;">{"机芯编号"}</label>
                                            <p style="font-weight: 600; font-size: 1.1rem;">{&repair.movement_id}</p>
                                        </div>
                                        <div>
                                            <label style="color: var(--text-secondary); font-size: 0.9rem;">{"申请状态"}</label>
                                            <p>
                                                <span class={
                                                    match repair.status {
                                                        RepairStatus::Pending => "badge badge-warning",
                                                        RepairStatus::Approved => "badge badge-success",
                                                        RepairStatus::Rejected => "badge badge-danger",
                                                        RepairStatus::Completed => "badge badge-info",
                                                    }
                                                }>
                                                    {repair.status.label()}
                                                </span>
                                            </p>
                                        </div>
                                        <div>
                                            <label style="color: var(--text-secondary); font-size: 0.9rem;">{"测量振幅"}</label>
                                            <p style="font-weight: 600; color: var(--danger-color);">
                                                {format!("{:.2}°", repair.amplitude)}
                                            </p>
                                        </div>
                                        <div>
                                            <label style="color: var(--text-secondary); font-size: 0.9rem;">{"阈值"}</label>
                                            <p style="font-weight: 600;">
                                                {format!("{:.2}°", repair.threshold)}
                                            </p>
                                        </div>
                                        <div style="grid-column: span 2;">
                                            <label style="color: var(--text-secondary); font-size: 0.9rem;">{"申请原因"}</label>
                                            <p style="background: var(--bg-tertiary); padding: 0.75rem; border-radius: 6px; margin-top: 0.25rem;">
                                                {&repair.reason}
                                            </p>
                                        </div>
                                        <div>
                                            <label style="color: var(--text-secondary); font-size: 0.9rem;">{"申请时间"}</label>
                                            <p>{repair.created_at.format("%Y-%m-%d %H:%M:%S").to_string()}</p>
                                        </div>
                                        {
                                            if let Some(approved_at) = repair.approved_at {
                                                html! {
                                                    <div>
                                                        <label style="color: var(--text-secondary); font-size: 0.9rem;">{"审批时间"}</label>
                                                        <p>{approved_at.format("%Y-%m-%d %H:%M:%S").to_string()}</p>
                                                    </div>
                                                }
                                            } else {
                                                html! {}
                                            }
                                        }
                                        {
                                            if let Some(approved_by) = &repair.approved_by {
                                                html! {
                                                    <div>
                                                        <label style="color: var(--text-secondary); font-size: 0.9rem;">{"审批人"}</label>
                                                        <p>{approved_by}</p>
                                                    </div>
                                                }
                                            } else {
                                                html! {}
                                            }
                                        }
                                    </div>

                                    <div class="red-line-notice" style="margin-top: 1.5rem;">
                                        <div class="red-line-notice-title">{"制度红线"}</div>
                                        <div class="red-line-notice-text">
                                            {"振幅低于阈值的机芯禁止直接返客，必须经过复检工位二次采集确认，或完成返修流程后方可返回客户"}
                                        </div>
                                    </div>
                                </div>
                                <div class="modal-footer">
                                    <button class="btn btn-secondary" onclick={
                                        let close = close.clone();
                                        Callback::from(move |_| close.emit(()))
                                    }>
                                        {"关闭"}
                                    </button>
                                    {
                                        match repair.status {
                                            RepairStatus::Pending => html! {
                                                <>
                                                    <button class="btn btn-danger" onclick={
                                                        let reject = reject.clone();
                                                        Callback::from(move |_| reject.emit(repair_id))
                                                    }>
                                                        {"拒绝"}
                                                    </button>
                                                    <button class="btn btn-success" onclick={
                                                        let approve = approve.clone();
                                                        Callback::from(move |_| approve.emit(repair_id))
                                                    }>
                                                        {"批准返修"}
                                                    </button>
                                                </>
                                            },
                                            RepairStatus::Approved => html! {
                                                <button class="btn btn-primary" onclick={
                                                    let complete = complete.clone();
                                                    Callback::from(move |_| complete.emit(repair_id))
                                                }>
                                                    {"标记完成"}
                                                </button>
                                            },
                                            _ => html! {},
                                        }
                                    }
                                </div>
                            </div>
                        </div>
                    }
                } else {
                    html! {}
                }
            }
        </div>
    }
}
