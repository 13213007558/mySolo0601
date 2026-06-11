type ElAttribs = Record<string, string | boolean | number>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: ElAttribs = {},
  children: Array<HTMLElement | Text | string | null | undefined> = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') {
      el.className = String(v);
    } else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v as unknown as EventListener);
    } else if (k === 'html') {
      el.innerHTML = String(v);
    } else if (v === true) {
      el.setAttribute(k, '');
    } else {
      el.setAttribute(k, String(v));
    }
  }
  for (const c of children) {
    if (c === null || c === undefined) continue;
    if (typeof c === 'string') {
      el.appendChild(document.createTextNode(c));
    } else {
      el.appendChild(c);
    }
  }
  return el;
}

export function t(s: string): Text {
  return document.createTextNode(s);
}

export function clear(el: HTMLElement): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function actionLabel(a: string): string {
  const map: Record<string, string> = {
    SPIT_RECORDED: '吐酒计数',
    SCORE_SUBMITTED: '评分提交',
    WINE_LOCKED_AUTO: '系统自动锁定',
    SUPERVISOR_UNLOCK: '监审解锁',
    SIP_LIMIT_EXCEEDED: '口数超限告警',
    SENSOR_MISMATCH: '传感器校验异常',
    SENSOR_VERIFIED: '传感器校验通过',
    JUDGE_LOGIN: '评委登录',
    WINE_ACTIVATED: '酒款激活',
  };
  return map[a] ?? a;
}
