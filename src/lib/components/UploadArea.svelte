<script lang="ts">
	import { writable, derived } from 'svelte/store';
	import { Upload, X, AlertTriangle, CheckCircle, FileImage, Loader2 } from 'lucide-svelte';
	import type { Photo, DuplicateInfo } from '$lib/types';
	import { PROCESSES, MAX_FILE_SIZE } from '$lib/types';
	import { archiveStore } from '$lib/stores/archiveStore';
	import { validatePhotoData, normalizeFloor, sanitizeRemark } from '$lib/utils/validator';
	import { getTodayString } from '$lib/utils/date';
	import Modal from './Modal.svelte';
	import EmptyState from './EmptyState.svelte';

	export let showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;

	const showUploadModal = writable(false);
	const isDragging = writable(false);
	const isUploading = writable(false);
	const selectedFiles = writable<File[]>([]);
	const uploadMetadata = writable({
		date: getTodayString(),
		floor: '',
		process: '砌筑',
		remark: ''
	});
	const formErrors = writable<string[]>([]);

	const showDuplicateModal = writable(false);
	const pendingDuplicate = writable<DuplicateInfo | null>(null);
	const pendingDuplicateIndex = writable(0);
	const pendingFiles = writable<File[]>([]);
	const pendingMetadata = writable({
		date: getTodayString(),
		floor: '',
		process: '砌筑',
		remark: ''
	});
	const uploadedPhotos = writable<Photo[]>([]);

	const filePreviewUrls = derived(selectedFiles, ($files) => {
		return $files.map((file) => URL.createObjectURL(file));
	});

	function openUploadModal() {
		showUploadModal.set(true);
		selectedFiles.set([]);
		uploadMetadata.set({
			date: getTodayString(),
			floor: '',
			process: '砌筑',
			remark: ''
		});
		formErrors.set([]);
	}

	function closeUploadModal() {
		showUploadModal.set(false);
		selectedFiles.set([]);
		formErrors.set([]);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging.set(true);
	}

	function handleDragLeave() {
		isDragging.set(false);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging.set(false);
		const files = Array.from(e.dataTransfer?.files || []).filter((f) =>
			f.type.startsWith('image/')
		);
		if (files.length > 0) {
			selectedFiles.update(($f) => [...$f, ...files]);
		}
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = Array.from(input.files || []);
		if (files.length > 0) {
			selectedFiles.update(($f) => [...$f, ...files]);
		}
		input.value = '';
	}

	function removeFile(index: number) {
		selectedFiles.update(($f) => $f.filter((_, i) => i !== index));
	}

	async function handleUpload() {
		const metadata = $uploadMetadata;
		const validation = validatePhotoData(metadata);

		if (!validation.valid) {
			formErrors.set(validation.errors);
			return;
		}

		if ($selectedFiles.length === 0) {
			formErrors.set(['请选择至少一张照片']);
			return;
		}

		formErrors.set([]);
		isUploading.set(true);

		try {
			const result = await archiveStore.uploadFiles($selectedFiles, {
				date: metadata.date,
				floor: normalizeFloor(metadata.floor),
				process: metadata.process,
				remark: sanitizeRemark(metadata.remark)
			});

			if (result.success.length > 0) {
				showToast('success', `成功上传 ${result.success.length} 张照片`);
			}

			if (result.errors.length > 0) {
				showToast('error', `${result.errors.length} 个文件上传失败：${result.errors[0].error}`);
			}

			if (result.duplicates.length > 0) {
				pendingDuplicate.set(result.duplicates[0]);
				pendingDuplicateIndex.set(0);
				pendingFiles.set($selectedFiles);
				pendingMetadata.set(metadata);
				uploadedPhotos.set(result.success);
				showDuplicateModal.set(true);
				showUploadModal.set(false);
			} else {
				closeUploadModal();
			}
		} catch (e) {
			showToast('error', e instanceof Error ? e.message : '上传失败');
		} finally {
			isUploading.set(false);
		}
	}

	async function handleForceUpload() {
		if (!$pendingDuplicate) return;

		isUploading.set(true);
		try {
			const photo = await archiveStore.forceUploadDuplicate($pendingDuplicate, {
				date: $pendingMetadata.date,
				floor: normalizeFloor($pendingMetadata.floor),
				process: $pendingMetadata.process,
				remark: sanitizeRemark($pendingMetadata.remark)
			});
			uploadedPhotos.update(($p) => [...$p, photo]);
			showToast('success', `已强制上传重复照片`);
			closeDuplicateModal();
		} catch (e) {
			showToast('error', e instanceof Error ? e.message : '上传失败');
		} finally {
			isUploading.set(false);
		}
	}

	function closeDuplicateModal() {
		showDuplicateModal.set(false);
		pendingDuplicate.set(null);
		uploadedPhotos.set([]);
	}

	async function handleDropAreaClick() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.multiple = true;
		input.onchange = (e) => {
			const target = e.target as HTMLInputElement;
			const files = Array.from(target.files || []);
			if (files.length > 0) {
				selectedFiles.update(($f) => [...$f, ...files]);
			}
		};
		input.click();
	}
</script>

<div class="card">
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center gap-2">
			<Upload class="w-5 h-5 text-construction-orange" />
			<h3 class="font-semibold text-construction-gray-dark">上传照片</h3>
		</div>
		<button on:click={openUploadModal} class="btn btn-primary">
			<Upload class="w-4 h-4" />
			选择照片
		</button>
	</div>

	<div
		class="drop-zone p-8 text-center"
		class:dragging={$isDragging}
		on:dragover={handleDragOver}
		on:dragleave={handleDragLeave}
		on:drop={handleDrop}
		on:click={handleDropAreaClick}
	>
		<EmptyState type="upload" />
		<p class="text-xs text-construction-gray mt-4">
			支持 JPG、PNG 格式，单张不超过 {(MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)}MB
		</p>
	</div>
</div>

<Modal show={$showUploadModal} title="上传照片" on:close={closeUploadModal}>
	<div class="space-y-4">
		{#if $formErrors.length > 0}
			<div class="p-3 bg-red-50 border border-red-200 rounded-lg">
				{#each $formErrors as error}
					<p class="text-sm text-red-600">{error}</p>
				{/each}
			</div>
		{/if}

		<div
			class="drop-zone p-6 text-center"
			class:dragging={$isDragging}
			on:dragover={handleDragOver}
			on:dragleave={handleDragLeave}
			on:drop={handleDrop}
		>
			<input
				type="file"
				accept="image/*"
				multiple
				on:change={handleFileSelect}
				class="hidden"
				id="file-input"
			/>
			<label for="file-input" class="cursor-pointer">
				<FileImage class="w-12 h-12 mx-auto mb-2 text-construction-gray" />
				<p class="text-construction-gray-dark">点击或拖拽照片到此处</p>
				<p class="text-xs text-construction-gray mt-1">支持多选</p>
			</label>
		</div>

		{#if $selectedFiles.length > 0}
			<div>
				<div class="flex items-center justify-between mb-2">
					<label class="label mb-0">已选择 {$selectedFiles.length} 个文件</label>
					<button
						on:click={() => selectedFiles.set([])}
						class="text-xs text-red-500 hover:text-red-600"
					>
						清空
					</button>
				</div>
				<div class="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
					{#each $selectedFiles as file, index}
						<div class="relative group">
							<img
								src={$filePreviewUrls[index]}
								alt={file.name}
								class="w-full aspect-square object-cover rounded"
							/>
							<button
								on:click={() => removeFile(index)}
								class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<X class="w-3 h-3" />
							</button>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<div class="grid grid-cols-2 gap-4">
			<div>
				<label class="label">拍摄日期</label>
				<input
					type="date"
					bind:value={$uploadMetadata.date}
					class="input"
				/>
			</div>
			<div>
				<label class="label">楼层</label>
				<input
					type="text"
					bind:value={$uploadMetadata.floor}
					class="input"
					placeholder="如：18层 或 十八层"
				/>
			</div>
		</div>

		<div>
			<label class="label">工序</label>
			<div class="flex flex-wrap gap-2">
				{#each PROCESSES as process}
					<button
						type="button"
						on:click={() => ($uploadMetadata.process = process)}
						class="badge cursor-pointer transition-colors
							{$uploadMetadata.process === process
								? 'badge-orange'
								: 'badge-gray hover:bg-construction-orange hover:bg-opacity-20'}"
					>
						{process}
					</button>
				{/each}
			</div>
		</div>

		<div>
			<label class="label">备注</label>
			<textarea
				bind:value={$uploadMetadata.remark}
				class="input min-h-[80px]"
				placeholder="添加照片备注..."
			/>
		</div>

		<div class="flex gap-2 pt-2">
			<button on:click={closeUploadModal} class="btn btn-secondary flex-1" disabled={$isUploading}>
				取消
			</button>
			<button on:click={handleUpload} class="btn btn-primary flex-1" disabled={$isUploading}>
				{#if $isUploading}
					<Loader2 class="w-4 h-4 animate-spin" />
					上传中...
				{:else}
					<Upload class="w-4 h-4" />
					上传
				{/if}
			</button>
		</div>
	</div>
</Modal>

<Modal show={$showDuplicateModal} title="检测到重复照片">
	{#if $pendingDuplicate}
		<div class="space-y-4">
			<div class="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
				<AlertTriangle class="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
				<div>
					<p class="font-medium text-yellow-800">该照片已存在</p>
					<p class="text-sm text-yellow-700 mt-1">
						文件名：{$pendingDuplicate.file.name}
					</p>
					<p class="text-sm text-yellow-700">
						已存在于：{$pendingDuplicate.existingPhoto.date} · {$pendingDuplicate.existingPhoto.floor} · {$pendingDuplicate.existingPhoto.process}
					</p>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<p class="text-sm text-construction-gray mb-2">新上传的照片</p>
					<img
						src={URL.createObjectURL($pendingDuplicate.file)}
						alt="新照片"
						class="w-full aspect-[4/3] object-cover rounded-lg"
					/>
				</div>
				<div>
					<p class="text-sm text-construction-gray mb-2">已存在的照片</p>
					<img
						src={$pendingDuplicate.existingPhoto.dataUrl}
						alt="已存在"
						class="w-full aspect-[4/3] object-cover rounded-lg"
					/>
				</div>
			</div>

			<p class="text-sm text-construction-gray">
				是否仍然要上传这张照片？（强制上传会保留两份相同内容的照片）
			</p>

			<div class="flex gap-2">
				<button on:click={closeDuplicateModal} class="btn btn-secondary flex-1" disabled={$isUploading}>
					取消
				</button>
				<button on:click={handleForceUpload} class="btn btn-primary flex-1" disabled={$isUploading}>
					{#if $isUploading}
						<Loader2 class="w-4 h-4 animate-spin" />
						上传中...
					{:else}
						<CheckCircle class="w-4 h-4" />
						强制上传
					{/if}
				</button>
			</div>
		</div>
	{/if}
</Modal>
