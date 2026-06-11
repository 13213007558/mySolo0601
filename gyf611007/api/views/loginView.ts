export function renderLoginPage(): string {
  return `<div class="max-w-md mx-auto mt-16">
      <div class="card shadow-glow-lg">
        <div class="text-center mb-8">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-glow">
            <span class="text-charcoal-900 font-serif font-bold text-2xl">茶</span>
          </div>
          <h2 class="font-serif text-2xl font-bold text-amber-300">审评室登录</h2>
          <p class="text-charcoal-200 text-sm mt-2">请输入您的审评账号</p>
        </div>
        <form
          hx-post="/api/auth/login"
          hx-target="#login-error"
          hx-swap="innerHTML"
          hx-headers='{"Content-Type": "application/x-www-form-urlencoded"}'
          class="space-y-4"
        >
          <div id="login-error"></div>
          <div>
            <label class="block text-sm text-amber-100 mb-2">账号</label>
            <input
              type="text"
              name="username"
              required
              class="input-field"
              placeholder="请输入账号"
              autocomplete="username"
            />
          </div>
          <div>
            <label class="block text-sm text-amber-100 mb-2">密码</label>
            <input
              type="password"
              name="password"
              required
              class="input-field"
              placeholder="请输入密码"
              autocomplete="current-password"
            />
          </div>
          <button type="submit" class="btn-primary w-full mt-6">
            登录审评室
          </button>
        </form>
        <div class="mt-6 pt-6 border-t border-charcoal-400">
          <p class="text-xs text-charcoal-200 text-center">
            测试账号：chief1 / chief123（主评师）<br/>
            assistant1 / assist123（辅评师）
          </p>
        </div>
      </div>
    </div>`;
}
