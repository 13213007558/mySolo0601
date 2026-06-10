import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(date: Date | string): string {
	const d = typeof date === 'string' ? parseISO(date) : date;
	return format(d, 'yyyy-MM-dd');
}

export function formatDateTime(date: Date | string): string {
	const d = typeof date === 'string' ? parseISO(date) : date;
	return format(d, 'yyyy-MM-dd HH:mm:ss');
}

export function formatDateChinese(date: Date | string): string {
	const d = typeof date === 'string' ? parseISO(date) : date;
	return format(d, 'yyyy年MM月dd日', { locale: zhCN });
}

export function formatMonthChinese(date: Date | string): string {
	const d = typeof date === 'string' ? parseISO(date) : date;
	return format(d, 'yyyy年MM月', { locale: zhCN });
}

export function getDaysInMonth(date: Date): Date[] {
	const start = startOfMonth(date);
	const end = endOfMonth(date);
	return eachDayOfInterval({ start, end });
}

export function isSameMonthWrapper(date1: Date, date2: Date): boolean {
	return isSameMonth(date1, date2);
}

export function isSameDayWrapper(date1: Date, date2: Date): boolean {
	return isSameDay(date1, date2);
}

export function addMonthsWrapper(date: Date, amount: number): Date {
	return addMonths(date, amount);
}

export function subMonthsWrapper(date: Date, amount: number): Date {
	return subMonths(date, amount);
}

export function getTodayString(): string {
	return formatDate(new Date());
}
