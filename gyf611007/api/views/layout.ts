import type { SessionUser } from "../types.js";

export function renderLayout(
  content: string,
  options: {
    title: string;
    user?: SessionUser | null;
  }
): string {
  const header = options.user ? renderHeader(options.user) : renderSimpleHeader();

  return `<!DOCTYPE html>
<html lang="zh-CN" class="dark">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${options.title} · 茶叶杯测啜饮席</title>
  <link rel="stylesheet" href="/output.css" />
  <script src="https://unpkg.com/htmx.org@2.0.4/dist/htmx.min.js"></script>
  <script src="https://unpkg.com/hyperscript.org@0.9.13/dist/_hyperscript.min.js"></script>
</head>
<body class="bg-charcoal-700 text-amber-50 min-h-screen font-sans flex flex-col">
  ${header}
  <main class="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
    ${content}
  </main>
  <footer class="py-4 text-center text-charcoal-300 text-xs border-t border-charcoal-600">
    <p>茶叶拍卖行杯测师协会 · 审评室专用系统</p>
  </footer>
</body>
</html>`;
}

function renderSimpleHeader(): string {
  return `<header class="bg-charcoal-600 border-b border-charcoal-400 px-6 py-4">
    <div class="max-w-7xl mx-auto flex items-center justify-center">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-glow">
          <span class="text-charcoal-900 font-serif font-bold text-lg">茶</span>
        </div>
        <div>
          <h1 class="font-serif text-xl font-bold text-amber-300 glow-text">茶叶杯测啜饮席</h1>
          <p class="text-xs text-charcoal-200">Tea Cupping Sip Station</p>
        </div>
      </div>
    </div>
  </header>`;
}

function renderHeader(user: SessionUser): string {
  const roleLabel =
    user.role === "chief"
      ? "主评师"
      : user.role === "assistant"
      ? "辅评师"
      : "管理员";

  return `<header class="bg-charcoal-600 border-b border-charcoal-400 px-6 py-4">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <a href="/dashboard" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-glow">
          <span class="text-charcoal-900 font-serif font-bold text-lg">茶</span>
        </div>
        <div>
          <h1 class="font-serif text-xl font-bold text-amber-300 glow-text">茶叶杯测啜饮席</h1>
          <p class="text-xs text-charcoal-200">Tea Cupping Sip Station</p>
        </div>
      </a>
      <nav class="flex items-center gap-6">
        <a href="/dashboard" class="text-amber-100 hover:text-amber-300 transition-colors text-sm">批次管理</a>
        <div class="flex items-center gap-3 pl-4 border-l border-charcoal-400">
          <div class="text-right">
            <p class="text-sm font-medium text-amber-100">${user.display_name}</p>
            <p class="text-xs text-charcoal-200">${roleLabel}</p>
          </div>
          <button
            hx-post="/api/auth/logout"
            hx-headers='{"Content-Type": "application/x-www-form-urlencoded"}'
            class="px-3 py-1.5 text-sm bg-charcoal-500 text-amber-100 rounded hover:bg-charcoal-400 transition-colors"
          >
            退出
          </button>
        </div>
      </nav>
    </div>
  </header>`;
}
