use yew::prelude::*;
use yew_router::prelude::*;
use crate::components::Route;

#[function_component(AppHeader)]
pub fn app_header() -> Html {
    html! {
        <header class="app-header">
            <div class="header-content">
                <div class="app-title">
                    <span class="icon">{"⏱️"}</span>
                    <span>{"擒纵摆幅Mic台"}</span>
                </div>
                <nav class="nav-menu">
                    <Link<Route> to={Route::Home} classes="nav-item">
                        {"检测台"}
                    </Link<Route>>
                    <Link<Route> to={Route::Records} classes="nav-item">
                        {"记录查询"}
                    </Link<Route>>
                    <Link<Route> to={Route::Dashboard} classes="nav-item">
                        {"班次看板"}
                    </Link<Route>>
                    <Link<Route> to={Route::Repairs} classes="nav-item">
                        {"返修管理"}
                    </Link<Route>>
                    <Link<Route> to={Route::Settings} classes="nav-item">
                        {"设置"}
                    </Link<Route>>
                </nav>
            </div>
        </header>
    }
}
