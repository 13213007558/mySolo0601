import { PageProps } from "$fresh/server.ts";
import UserRoleSwitch from "../islands/UserRoleSwitch.tsx";

export default function Layout({ Component, route }: PageProps) {
  const navItems = [
    { path: "/", label: "构件总览", icon: "📦" },
    { path: "/tasks", label: "复检待办", icon: "📋" },
    { path: "/batches", label: "批次管理", icon: "📑" },
  ];

  return (
    <div class="layout">
      <header class="header">
        <div class="header-content">
          <div class="brand">
            <span class="brand-icon">⚓</span>
            <div>
              <div class="brand-title">古船含水拭检台</div>
              <div class="brand-subtitle">明代沉船文物保护电子台账系统</div>
            </div>
          </div>
          <nav class="nav">
            {navItems.map((item) => (
              <a
                href={item.path}
                class={`nav-link ${route === item.path ? "active" : ""}`}
              >
                <span style="margin-right: 4px;">{item.icon}</span>
                {item.label}
              </a>
            ))}
            <UserRoleSwitch />
          </nav>
        </div>
      </header>
      <main class="main">
        <Component />
      </main>
      <footer class="footer">
        <p>古船含水拭检台 · 文物保护数字化管理系统 · 边缘节点部署</p>
        <p style="margin-top: 4px; font-size: 11px;">
          含水率阈值 18% · 复检间隔 ≥ 4小时 · 离线队列上限 50条
        </p>
      </footer>
    </div>
  );
}
