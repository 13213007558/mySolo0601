use yew::prelude::*;
use crate::models::AppSettings;
use crate::storage::{load_settings, save_settings, clear_all_data};

#[function_component(SettingsPage)]
pub fn settings_page() -> Html {
    let settings = use_state(|| AppSettings::default());
    let message = use_state(|| None::<String>);
    let show_confirm = use_state(|| false);

    {
        let settings = settings.clone();
        use_effect_with_deps(
            move |_| {
                settings.set(load_settings());
                || {}
            },
            (),
        );
    }

    let show_message = {
        let message = message.clone();
        Callback::from(move |msg: String| {
            message.set(Some(msg));
            let message = message.clone();
            let handle = gloo_timers::callback::Timeout::new(3000, move || {
                message.set(None);
            });
            handle.forget();
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
        })
    };

    let handle_brand_change = {
        let settings = settings.clone();
        Callback::from(move |e: InputEvent| {
            let target = e.target().unwrap();
            let input = target.dyn_ref::<web_sys::HtmlInputElement>().unwrap();
            let mut new_settings = (*settings).clone();
            new_settings.brand_code = input.value();
            settings.set(new_settings);
        })
    };

    let handle_sample_rate_change = {
        let settings = settings.clone();
        Callback::from(move |e: InputEvent| {
            let target = e.target().unwrap();
            let input = target.dyn_ref::<web_sys::HtmlInputElement>().unwrap();
            let value: f64 = input.value().parse().unwrap_or(44100.0);
            let mut new_settings = (*settings).clone();
            new_settings.sample_rate = value;
            settings.set(new_settings);
        })
    };

    let handle_duration_change = {
        let settings = settings.clone();
        Callback::from(move |e: InputEvent| {
            let target = e.target().unwrap();
            let input = target.dyn_ref::<web_sys::HtmlInputElement>().unwrap();
            let value: u64 = input.value().parse().unwrap_or(5000);
            let mut new_settings = (*settings).clone();
            new_settings.recording_duration_ms = value;
            settings.set(new_settings);
        })
    };

    let save_settings = {
        let settings = settings.clone();
        let show_message = show_message.clone();
        Callback::from(move |_| {
            match save_settings(&settings) {
                Ok(_) => {
                    show_message.emit("设置已保存".to_string());
                }
                Err(e) => {
                    show_message.emit(format!("保存失败: {}", e));
                }
            }
        })
    };

    let handle_clear_data = {
        let show_confirm = show_confirm.clone();
        Callback::from(move |_| {
            show_confirm.set(true);
        })
    };

    let confirm_clear = {
        let show_confirm = show_confirm.clone();
        let show_message = show_message.clone();
        Callback::from(move |confirm: bool| {
            if confirm {
                match clear_all_data() {
                    Ok(_) => {
                        show_message.emit("所有数据已清除".to_string());
                    }
                    Err(e) => {
                        show_message.emit(format!("清除失败: {}", e));
                    }
                }
            }
            show_confirm.set(false);
        })
    };

    html! {
        <div class="settings-page">
            <div class="page-header">
                <h1 class="page-title">{"系统设置"}</h1>
                <p class="page-subtitle">{"配置检测参数和系统选项"}</p>
            </div>

            if let Some(msg) = &*message {
                <div class="status-indicator" style="margin-bottom: 1rem; color: var(--success-color);">
                    <span class="status-dot success"></span>
                    {msg}
                </div>
            }

            <div class="card">
                <div class="card-header">
                    <div class="card-title">{"检测参数"}</div>
                </div>
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
                            <small style="color: var(--text-muted);">
                                {"低于此值的机芯将被标记为异常"}
                            </small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">{"采样率 (Hz)"}</label>
                            <input
                                type="number"
                                class="form-input"
                                value={settings.sample_rate.to_string()}
                                oninput={handle_sample_rate_change}
                                min="8000"
                                step="1000"
                            />
                            <small style="color: var(--text-muted);">
                                {"麦克风采样频率"}
                            </small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">{"采集时长 (毫秒)"}</label>
                            <input
                                type="number"
                                class="form-input"
                                value={settings.recording_duration_ms.to_string()}
                                oninput={handle_duration_change}
                                min="1000"
                                step="500"
                            />
                            <small style="color: var(--text-muted);">
                                {"单次采集的持续时间"}
                            </small>
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
                            <small style="color: var(--text-muted);">
                                {"当前登录操作员"}
                            </small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">{"品牌代码"}</label>
                            <input
                                type="text"
                                class="form-input"
                                placeholder="请输入品牌代码"
                                value={settings.brand_code.clone()}
                                oninput={handle_brand_change}
                            />
                            <small style="color: var(--text-muted);">
                                {"用于品牌售后交换格式"}
                            </small>
                        </div>
                    </div>

                    <div style="margin-top: 1.5rem;">
                        <button class="btn btn-primary" onclick={save_settings}>
                            {"💾 保存设置"}
                        </button>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-top: 1.5rem;">
                <div class="card-header">
                    <div class="card-title" style="color: var(--danger-color);">{"危险操作"}</div>
                </div>
                <div class="card-body">
                    <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                        {"清除所有数据将删除所有检测记录和返修申请，此操作不可撤销。"}
                    </p>
                    <button class="btn btn-danger" onclick={handle_clear_data}>
                        {"🗑️ 清除所有数据"}
                    </button>
                </div>
            </div>

            <div class="card" style="margin-top: 1.5rem;">
                <div class="card-header">
                    <div class="card-title">{"制度红线"}</div>
                </div>
                <div class="card-body">
                    <div class="red-line-notice" style="margin: 0;">
                        <div class="red-line-notice-title">{"重要规定"}</div>
                        <div class="red-line-notice-text">
                            <ul style="list-style-position: inside; margin-top: 0.5rem;">
                                <li>{"标红机芯禁止直接返客"}</li>
                                <li>{"振幅低于阈值须走复检工位二次采集确认"}</li>
                                <li>{"复检仍不达标须创建返修申请"}</li>
                                <li>{"返修完成后方可返回客户"}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            if *show_confirm {
                <div class="modal-backdrop" onclick={
                    let confirm_clear = confirm_clear.clone();
                    Callback::from(move |_| confirm_clear.emit(false))
                }>
                    <div class="modal" onclick={Callback::from(|e: MouseEvent| e.stop_propagation())}>
                        <div class="modal-header">
                            <h3 class="modal-title">{"确认清除数据"}</h3>
                        </div>
                        <div class="modal-body">
                            <p>{"确定要清除所有检测记录和返修申请吗？此操作不可撤销！"}</p>
                            <p style="color: var(--danger-color); margin-top: 0.5rem;">
                                <strong>{"警告：所有数据将被永久删除！"}</strong>
                            </p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick={
                                let confirm_clear = confirm_clear.clone();
                                Callback::from(move |_| confirm_clear.emit(false))
                            }>
                                {"取消"}
                            </button>
                            <button class="btn btn-danger" onclick={
                                let confirm_clear = confirm_clear.clone();
                                Callback::from(move |_| confirm_clear.emit(true))
                            }>
                                {"确认清除"}
                            </button>
                        </div>
                    </div>
                </div>
            }
        </div>
    }
}
