use yew::prelude::*;
use yew_router::prelude::*;

pub mod detection_page;
pub mod records_page;
pub mod dashboard_page;
pub mod repair_page;
pub mod settings_page;
pub mod waveform_viewer;
pub mod header;

pub use detection_page::*;
pub use records_page::*;
pub use dashboard_page::*;
pub use repair_page::*;
pub use settings_page::*;
pub use waveform_viewer::*;
pub use header::*;

#[derive(Debug, Clone, PartialEq, Routable)]
pub enum Route {
    #[at("/")]
    Home,
    #[at("/records")]
    Records,
    #[at("/dashboard")]
    Dashboard,
    #[at("/repairs")]
    Repairs,
    #[at("/settings")]
    Settings,
    #[not_found]
    #[at("/404")]
    NotFound,
}

pub fn switch(route: Route) -> Html {
    match route {
        Route::Home => html! { <DetectionPage /> },
        Route::Records => html! { <RecordsPage /> },
        Route::Dashboard => html! { <DashboardPage /> },
        Route::Repairs => html! { <RepairPage /> },
        Route::Settings => html! { <SettingsPage /> },
        Route::NotFound => html! { <NotFoundPage /> },
    }
}

#[function_component(NotFoundPage)]
pub fn not_found_page() -> Html {
    html! {
        <div class="empty-state">
            <div class="empty-state-icon">{"🔍"}</div>
            <div class="empty-state-text">{"页面未找到"}</div>
            <p style="margin-top: 1rem; color: var(--text-muted);">
                {"您访问的页面不存在，请检查地址是否正确"}
            </p>
            <Link<Route> to={Route::Home} classes="btn btn-primary" style="margin-top: 1.5rem;">
                {"返回首页"}
            </Link<Route>>
        </div>
    }
}

#[function_component(App)]
pub fn app() -> Html {
    html! {
        <BrowserRouter>
            <div class="app-container">
                <AppHeader />
                <main class="app-main">
                    <Switch<Route> render={switch} />
                </main>
            </div>
        </BrowserRouter>
    }
}
