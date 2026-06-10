import { STORAGE_KEYS } from '$lib/types';
import type { Photo, ConstructionLog } from '$lib/types';

export function saveToStorage<T>(key: string, data: T): void {
	try {
		const jsonString = JSON.stringify(data);
		localStorage.setItem(key, jsonString);
	} catch (e) {
		if (e instanceof Error && e.name === 'QuotaExceededError') {
			console.error('存储空间不足，请清理一些照片后重试');
			throw new Error('存储空间不足，请删除一些旧照片后重试');
		}
		console.error('保存数据失败:', e);
		throw e;
	}
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
	try {
		const jsonString = localStorage.getItem(key);
		if (!jsonString) return defaultValue;
		return JSON.parse(jsonString) as T;
	} catch (e) {
		console.error('加载数据失败，使用默认值:', e);
		return defaultValue;
	}
}

export function savePhotos(photos: Photo[]): void {
	saveToStorage(STORAGE_KEYS.PHOTOS, photos);
}

export function loadPhotos(): Photo[] {
	return loadFromStorage<Photo[]>(STORAGE_KEYS.PHOTOS, []);
}

export function saveLogs(logs: ConstructionLog[]): void {
	saveToStorage(STORAGE_KEYS.LOGS, logs);
}

export function loadLogs(): ConstructionLog[] {
	return loadFromStorage<ConstructionLog[]>(STORAGE_KEYS.LOGS, []);
}

export function exportData(): string {
	const photos = loadPhotos();
	const logs = loadLogs();
	return JSON.stringify({ photos, logs, exportTime: new Date().toISOString() }, null, 2);
}

export function importData(jsonString: string): { photos: Photo[]; logs: ConstructionLog[] } {
	try {
		const data = JSON.parse(jsonString);
		if (!data.photos || !Array.isArray(data.photos)) {
			throw new Error('数据格式错误：缺少 photos 数组');
		}
		if (!data.logs || !Array.isArray(data.logs)) {
			throw new Error('数据格式错误：缺少 logs 数组');
		}
		return { photos: data.photos, logs: data.logs };
	} catch (e) {
		if (e instanceof SyntaxError) {
			throw new Error('JSON 格式错误，请检查文件内容');
		}
		throw e;
	}
}

export function getStorageSize(): number {
	let total = 0;
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key) {
			const value = localStorage.getItem(key);
			if (value) {
				total += value.length * 2;
			}
		}
	}
	return total;
}

export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return bytes + ' B';
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
	return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function clearAllData(): void {
	localStorage.removeItem(STORAGE_KEYS.PHOTOS);
	localStorage.removeItem(STORAGE_KEYS.LOGS);
}
