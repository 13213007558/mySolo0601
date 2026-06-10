import type { Photo } from '$lib/types';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '$lib/types';

const CHINESE_NUM_MAP: Record<string, string> = {
	零: '0',
	一: '1',
	二: '2',
	三: '3',
	四: '4',
	五: '5',
	六: '6',
	七: '7',
	八: '8',
	九: '9',
	十: '10',
	十一: '11',
	十二: '12',
	十三: '13',
	十四: '14',
	十五: '15',
	十六: '16',
	十七: '17',
	十八: '18',
	十九: '19',
	二十: '20',
	三十: '30',
	四十: '40',
	五十: '50',
	六十: '60',
	七十: '70',
	八十: '80',
	九十: '90',
	百: '100'
};

const SINGLE_NUMS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const TENS = ['十', '二十', '三十', '四十', '五十', '六十', '七十', '八十', '九十'];

export function normalizeFloor(floor: string): string {
	if (!floor || floor.trim() === '') return floor;

	let numPart = floor.replace(/层$/, '').trim();

	if (CHINESE_NUM_MAP[numPart]) {
		return CHINESE_NUM_MAP[numPart] + '层';
	}

	const match = numPart.match(/^([一二三四五六七八九]?)十([一二三四五六七八九]?)$/);
	if (match) {
		const tens = match[1] ? CHINESE_NUM_MAP[match[1]] : '1';
		const ones = match[2] ? CHINESE_NUM_MAP[match[2]] : '0';
		return (parseInt(tens) * 10 + parseInt(ones)) + '层';
	}

	for (const ten of TENS) {
		for (const single of SINGLE_NUMS) {
			const combined = ten + single;
			if (numPart === combined) {
				const tenVal = parseInt(CHINESE_NUM_MAP[ten]);
				const singleVal = parseInt(CHINESE_NUM_MAP[single]);
				return (tenVal + singleVal) + '层';
			}
		}
	}

	if (/^\d+$/.test(numPart)) {
		return numPart + '层';
	}

	return floor;
}

export function isValidDate(dateString: string): boolean {
	if (!dateString) return false;
	const regex = /^\d{4}-\d{2}-\d{2}$/;
	if (!regex.test(dateString)) return false;

	const date = new Date(dateString);
	const timestamp = date.getTime();
	if (isNaN(timestamp)) return false;

	return date.toISOString().startsWith(dateString);
}

export function isDateInRange(date: string, startDate: string, endDate: string): boolean {
	if (!date || !startDate || !endDate) return false;
	const d = new Date(date).getTime();
	const start = new Date(startDate).getTime();
	const end = new Date(endDate).getTime();
	return d >= start && d <= end;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
	if (!ALLOWED_FILE_TYPES.includes(file.type)) {
		return {
			valid: false,
			error: `不支持的文件类型 "${file.type}"，请上传 JPG 或 PNG 格式的图片`
		};
	}

	if (file.size > MAX_FILE_SIZE) {
		const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
		const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
		return {
			valid: false,
			error: `文件 "${file.name}" 大小 (${fileSizeMB}MB) 超过限制 (最大 ${maxSizeMB}MB)`
		};
	}

	return { valid: true };
}

export function escapeMarkdown(text: string): string {
	if (!text) return '';
	return text
		.replace(/\\/g, '\\\\')
		.replace(/`/g, '\\`')
		.replace(/\*/g, '\\*')
		.replace(/_/g, '\\_')
		.replace(/#/g, '\\#')
		.replace(/\+/g, '\\+')
		.replace(/-/g, '\\-')
		.replace(/\./g, '\\.')
		.replace(/!/g, '\\!')
		.replace(/\|/g, '\\|');
}

export function escapeHtml(text: string): string {
	if (!text) return '';
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

export function validatePhotoData(photo: Partial<Photo>): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!photo.date || photo.date.trim() === '') {
		errors.push('请选择施工日期');
	} else if (!isValidDate(photo.date)) {
		errors.push('日期格式不正确，请使用 YYYY-MM-DD 格式');
	}

	if (!photo.floor || photo.floor.trim() === '') {
		errors.push('请填写楼层');
	}

	if (!photo.process || photo.process.trim() === '') {
		errors.push('请选择工序');
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

export function sanitizeRemark(remark: string): string {
	if (!remark) return '';
	return remark.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/javascript:/gi, '');
}

export function extractFloorNumber(floor: string): number | null {
	const normalized = normalizeFloor(floor);
	const match = normalized.match(/(\d+)/);
	if (match) {
		return parseInt(match[1], 10);
	}
	return null;
}
