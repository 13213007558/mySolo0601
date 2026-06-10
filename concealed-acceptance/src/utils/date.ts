import { format, parseISO, isBefore, isAfter, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDateChinese(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = parseISO(dateStr);
    return format(date, 'yyyy年MM月dd日', { locale: zhCN });
  } catch {
    return dateStr;
  }
}

export function formatDateTimeChinese(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = parseISO(dateStr);
    return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
  } catch {
    return dateStr;
  }
}

export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getNowString(): string {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
}

export function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  try {
    const d = parseISO(date);
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    return (isAfter(d, start) || isSameDay(d, start)) && (isBefore(d, end) || isSameDay(d, end));
  } catch {
    return false;
  }
}

export function isAcceptanceAfterFormwork(acceptanceDate: string, formworkDate: string): boolean {
  try {
    const acceptance = parseISO(acceptanceDate);
    const formwork = parseISO(formworkDate);
    return isAfter(acceptance, formwork) || isSameDay(acceptance, formwork);
  } catch {
    return false;
  }
}

export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = parseISO(dateString);
  return !isNaN(date.getTime());
}
