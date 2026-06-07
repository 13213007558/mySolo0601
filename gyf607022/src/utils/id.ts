export function genId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone ?? "";
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ingredientsHash(ingredients: { name: string; day: string; meal: string }[]): string {
  const sorted = [...ingredients]
    .sort((a, b) => `${a.day}${a.meal}${a.name}`.localeCompare(`${b.day}${b.meal}${b.name}`))
    .map((i) => `${i.day}|${i.meal}|${i.name}`)
    .join("||");
  let h = 0;
  for (let i = 0; i < sorted.length; i++) {
    h = (h << 5) - h + sorted.charCodeAt(i);
    h |= 0;
  }
  return h.toString(36);
}
