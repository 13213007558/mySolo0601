export interface Photo {
	id: string;
	hash: string;
	name: string;
	date: string;
	floor: string;
	process: string;
	remark: string;
	dataUrl: string;
	thumbnailUrl?: string;
	size: number;
	uploadTime: string;
	isCompleted: boolean;
}

export interface ConstructionLog {
	id: string;
	date: string;
	floor: string;
	process: string;
	content: string;
	photoIds: string[];
	hasPhoto: boolean;
	createTime: string;
}

export interface PendingEvidence {
	id: string;
	logId: string;
	date: string;
	floor: string;
	process: string;
	missingReason: string;
}

export interface FilterState {
	dateRange: [string, string] | null;
	selectedDate: string | null;
	floors: string[];
	processes: string[];
	keyword: string;
	onlyPending: boolean;
	onlyCompleted: boolean | null;
}

export interface UploadResult {
	success: Photo[];
	duplicates: DuplicateInfo[];
	errors: { file: File; error: string }[];
}

export interface DuplicateInfo {
	file: File;
	existingPhoto: Photo;
}

export const PROCESSES = ['砌筑', '钢筋', '模板', '混凝土', '防水', '抹灰', '其他'] as const;
export type ProcessType = typeof PROCESSES[number];

export const STORAGE_KEYS = {
	PHOTOS: 'construction-archive-photos',
	LOGS: 'construction-archive-logs'
} as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
}
