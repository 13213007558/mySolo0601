import { writable, derived } from 'svelte/store';
import { loadPhotos, savePhotos, loadLogs, saveLogs } from '$lib/utils/storage';
import { calculateFileHash, findDuplicatePhotos, generateId, generateThumbnail } from '$lib/utils/hash';
import { normalizeFloor, validateFile, validatePhotoData, sanitizeRemark } from '$lib/utils/validator';
import { formatDateTime } from '$lib/utils/date';
import type { Photo, ConstructionLog, PendingEvidence, UploadResult, DuplicateInfo } from '$lib/types';

function createArchiveStore() {
	const photos = writable<Photo[]>(loadPhotos());
	const logs = writable<ConstructionLog[]>(loadLogs());
	const selectedPhotoIds = writable<string[]>([]);
	const isLoading = writable(false);
	const error = writable<string | null>(null);

	photos.subscribe((value) => savePhotos(value));
	logs.subscribe((value) => saveLogs(value));

	const pendingEvidence = derived([photos, logs], ([$photos, $logs]) => {
		const pending: PendingEvidence[] = [];
		for (const log of $logs) {
			if (!log.hasPhoto || log.photoIds.length === 0) {
				pending.push({
					id: generateId(),
					logId: log.id,
					date: log.date,
					floor: log.floor,
					process: log.process,
					missingReason: '该日志条目缺少照片证据'
				});
			}
		}
		return pending;
	});

	const stats = derived(photos, ($photos) => {
		const total = $photos.length;
		const completed = $photos.filter((p) => p.isCompleted).length;
		const pending = total - completed;
		const byDate: Record<string, number> = {};
		const byFloor: Record<string, number> = {};
		const byProcess: Record<string, number> = {};

		for (const photo of $photos) {
			byDate[photo.date] = (byDate[photo.date] || 0) + 1;
			byFloor[photo.floor] = (byFloor[photo.floor] || 0) + 1;
			byProcess[photo.process] = (byProcess[photo.process] || 0) + 1;
		}

		return { total, completed, pending, byDate, byFloor, byProcess };
	});

	async function uploadFiles(
		files: File[],
		metadata: { date: string; floor: string; process: string; remark?: string }
	): Promise<UploadResult> {
		isLoading.set(true);
		error.set(null);

		const result: UploadResult = {
			success: [],
			duplicates: [],
			errors: []
		};

		try {
			const normalizedFloor = normalizeFloor(metadata.floor);
			const sanitizedRemark = sanitizeRemark(metadata.remark || '');

			const validation = validatePhotoData({
				date: metadata.date,
				floor: normalizedFloor,
				process: metadata.process
			});

			if (!validation.valid) {
				throw new Error(validation.errors.join('；'));
			}

			const currentPhotos = await new Promise<Photo[]>((resolve) => {
				const unsub = photos.subscribe(($p) => {
					resolve($p);
					unsub();
				});
			});

			for (const file of files) {
				const fileValidation = validateFile(file);
				if (!fileValidation.valid) {
					result.errors.push({ file, error: fileValidation.error! });
					continue;
				}

				try {
					const hash = await calculateFileHash(file);
					const existing = findDuplicatePhotos(hash, currentPhotos);

					if (existing) {
						result.duplicates.push({ file, existingPhoto: existing });
						continue;
					}

					const dataUrl = await fileToDataUrl(file);
					const thumbnailUrl = await generateThumbnail(file);

					const photo: Photo = {
						id: generateId(),
						hash,
						name: file.name,
						date: metadata.date,
						floor: normalizedFloor,
						process: metadata.process,
						remark: sanitizedRemark,
						dataUrl,
						thumbnailUrl,
						size: file.size,
						uploadTime: formatDateTime(new Date()),
						isCompleted: false
					};

					photos.update(($photos) => [...$photos, photo]);
					result.success.push(photo);
				} catch (e) {
					result.errors.push({
						file,
						error: e instanceof Error ? e.message : '上传失败'
					});
				}
			}
		} catch (e) {
			error.set(e instanceof Error ? e.message : '上传失败');
		} finally {
			isLoading.set(false);
		}

		return result;
	}

	async function forceUploadDuplicate(
		duplicate: DuplicateInfo,
		metadata: { date: string; floor: string; process: string; remark?: string }
	): Promise<Photo> {
		isLoading.set(true);
		error.set(null);

		try {
			const normalizedFloor = normalizeFloor(metadata.floor);
			const sanitizedRemark = sanitizeRemark(metadata.remark || '');
			const dataUrl = await fileToDataUrl(duplicate.file);
			const thumbnailUrl = await generateThumbnail(duplicate.file);

			const photo: Photo = {
				id: generateId(),
				hash: duplicate.existingPhoto.hash,
				name: duplicate.file.name,
				date: metadata.date,
				floor: normalizedFloor,
				process: metadata.process,
				remark: sanitizedRemark,
				dataUrl,
				thumbnailUrl,
				size: duplicate.file.size,
				uploadTime: formatDateTime(new Date()),
				isCompleted: false
			};

			photos.update(($photos) => [...$photos, photo]);
			return photo;
		} catch (e) {
			error.set(e instanceof Error ? e.message : '上传失败');
			throw e;
		} finally {
			isLoading.set(false);
		}
	}

	function updatePhoto(id: string, updates: Partial<Photo>): void {
		if (updates.floor) {
			updates.floor = normalizeFloor(updates.floor);
		}
		if (updates.remark) {
			updates.remark = sanitizeRemark(updates.remark);
		}
		photos.update(($photos) => $photos.map((p) => (p.id === id ? { ...p, ...updates } : p)));
	}

	function deletePhotos(ids: string[]): void {
		photos.update(($photos) => $photos.filter((p) => !ids.includes(p.id)));
		selectedPhotoIds.update(($selected) => $selected.filter((id) => !ids.includes(id)));
	}

	function toggleSelect(id: string): void {
		selectedPhotoIds.update(($selected) =>
			$selected.includes(id) ? $selected.filter((i) => i !== id) : [...$selected, id]
		);
	}

	function selectAll(ids: string[]): void {
		selectedPhotoIds.set([...ids]);
	}

	function clearSelection(): void {
		selectedPhotoIds.set([]);
	}

	function toggleCompleted(ids: string[], isCompleted: boolean): void {
		photos.update(($photos) =>
			$photos.map((p) => (ids.includes(p.id) ? { ...p, isCompleted } : p))
		);
	}

	function batchUpdate(ids: string[], updates: Partial<Photo>): void {
		if (updates.floor) {
			updates.floor = normalizeFloor(updates.floor);
		}
		if (updates.remark) {
			updates.remark = sanitizeRemark(updates.remark);
		}
		photos.update(($photos) =>
			$photos.map((p) => (ids.includes(p.id) ? { ...p, ...updates } : p))
		);
	}

	function importData(newPhotos: Photo[], newLogs: ConstructionLog[]): void {
		photos.set(newPhotos);
		logs.set(newLogs);
		selectedPhotoIds.set([]);
	}

	function clearAllData(): void {
		photos.set([]);
		logs.set([]);
		selectedPhotoIds.set([]);
	}

	function addLog(log: Omit<ConstructionLog, 'id' | 'photoIds' | 'hasPhoto'>): void {
		const newLog: ConstructionLog = {
			...log,
			id: generateId(),
			photoIds: [],
			hasPhoto: false
		};
		logs.update(($logs) => [...$logs, newLog]);
	}

	function setError(message: string | null): void {
		error.set(message);
	}

	return {
		photos,
		logs,
		selectedPhotoIds,
		pendingEvidence,
		stats,
		isLoading,
		error,
		uploadFiles,
		forceUploadDuplicate,
		updatePhoto,
		deletePhotos,
		toggleSelect,
		selectAll,
		clearSelection,
		toggleCompleted,
		batchUpdate,
		importData,
		clearAllData,
		addLog,
		setError
	};
}

function fileToDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(new Error('文件读取失败'));
		reader.readAsDataURL(file);
	});
}

export const archiveStore = createArchiveStore();
