export function calculateHash(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function formatTime(timeStr: string): string {
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return timeStr;
}

export function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10) || 0;
  let totalMinutes = hours * 60 + minutes;
  if (hours < 12) {
    totalMinutes += 24 * 60;
  }
  return totalMinutes;
}

export function minutesToTimeString(minutes: number): string {
  let mins = minutes;
  if (mins >= 24 * 60) {
    mins -= 24 * 60;
  }
  const hours = Math.floor(mins / 60);
  const minsRemainder = mins % 60;
  return `${hours.toString().padStart(2, '0')}:${minsRemainder.toString().padStart(2, '0')}`;
}
