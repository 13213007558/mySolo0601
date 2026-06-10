<script lang="ts">
	import { derived, writable, get } from 'svelte/store';
	import { CheckCircle, Clock, Trash2, Edit3, X, Building2, Layers, FileText } from 'lucide-svelte';
	import type { Photo } from '$lib/types';
	import { archiveStore } from '$lib/stores/archiveStore';
	import { PROCESSES } from '$lib/types';
	import { normalizeFloor, sanitizeRemark, validatePhotoData } from '$lib/utils/validator';
	import Modal from './Modal.svelte';

	export let photos: Photo[] = [];

	const selectedPhotoIds = archiveStore.selectedPhotoIds;

	const selectedCount = derived(selectedPhotoIds, ($ids) => $ids.length);
	const hasSelection = derived(selectedCount, ($count) => $count > 0);

	const showEditModal = writable(false);
	const batchEditForm = writable({
		floor: '',
		process: '',
		remark: ''
	});
	const editErrors = writable<string[]>([]);

	function markCompleted() {
		archiveStore.toggleCompleted($selectedPhotoIds, true);
	}

	function markPending() {
		archiveStore.toggleCompleted($selectedPhotoIds, false);
	}

	function deleteSelected() {
		const count = $selectedPhotoIds.length;
		if (confirm(`确定要删除选中的 ${count} 张照片吗？此操作不可恢复。`)) {
			archiveStore.deletePhotos($selectedPhotoIds);
		}
	}

	function openBatchEdit() {
		batchEditForm.set({ floor: '', process: '', remark: '' });
		editErrors.set([]);
		showEditModal.set(true);
	}

	function closeBatchEdit() {
		showEditModal.set(false);
		editErrors.set([]);
	}

	function applyBatchEdit() {
		const form = $batchEditForm;
		const updates: Partial<Photo> = {};

		if (form.floor) {
			updates.floor = normalizeFloor(form.floor);
		}
		if (form.process) {
			updates.process = form.process;
		}
		if (form.remark) {
			updates.remark = sanitizeRemark(form.remark);
		}

		if (Object.keys(updates).length === 0) {
			editErrors.set(['请至少填写一项要修改的内容']);
			return;
		}

		archiveStore.batchUpdate($selectedPhotoIds, updates);
		closeBatchEdit();
	}

	function clearSelection() {
		archiveStore.clearSelection();
	}
</script>

{#if $hasSelection}
	<div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 animate-slide-up">
		<div class="container mx-auto px-4 py-3">
			<div class="flex flex-wrap items-center justify-between gap-4">
				<div class="flex items-center gap-4">
					<span class="text-construction-gray">
						已选择 <span class="font-semibold text-construction-orange">{$selectedCount}</span> 张照片
					</span>
					<button
						on:click={clearSelection}
						class="text-sm text-construction-gray hover:text-construction-orange transition-colors flex items-center gap-1"
					>
						<X class="w-4 h-4" />
						取消选择
					</button>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<button on:click={markCompleted} class="btn btn-primary btn-sm">
						<CheckCircle class="w-4 h-4" />
						标记完成
					</button>
					<button on:click={markPending} class="btn btn-secondary btn-sm">
						<Clock class="w-4 h-4" />
						标记待确认
					</button>
					<button on:click={openBatchEdit} class="btn btn-secondary btn-sm">
						<Edit3 class="w-4 h-4" />
						批量编辑
					</button>
					<button on:click={deleteSelected} class="btn btn-danger btn-sm">
						<Trash2 class="w-4 h-4" />
						删除
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<Modal show={$showEditModal} title="批量编辑" on:close={closeBatchEdit}>
	<div class="space-y-4">
		<p class="text-sm text-construction-gray">
			将修改 <span class="font-semibold text-construction-orange">{$selectedCount}</span> 张照片的属性，留空的字段不修改
		</p>

		{#if $editErrors.length > 0}
			<div class="p-3 bg-red-50 border border-red-200 rounded-lg">
				{#each $editErrors as error}
					<p class="text-sm text-red-600">{error}</p>
				{/each}
			</div>
		{/if}

		<div>
			<label class="label flex items-center gap-2">
				<Building2 class="w-4 h-4" />
				楼层
			</label>
			<input
				type="text"
				bind:value={$batchEditForm.floor}
				class="input"
				placeholder="如：18层 或 十八层（留空不修改）"
			/>
		</div>

		<div>
			<label class="label flex items-center gap-2">
				<Layers class="w-4 h-4" />
				工序
			</label>
			<select bind:value={$batchEditForm.process} class="input">
				<option value="">-- 不修改 --</option>
				{#each PROCESSES as process}
					<option value={process}>{process}</option>
				{/each}
			</select>
		</div>

		<div>
			<label class="label flex items-center gap-2">
				<FileText class="w-4 h-4" />
				备注
			</label>
			<textarea
				bind:value={$batchEditForm.remark}
				class="input min-h-[80px]"
				placeholder="添加统一备注（留空不修改）"
			/>
		</div>

		<div class="flex gap-2 pt-2">
			<button on:click={closeBatchEdit} class="btn btn-secondary flex-1">
				取消
			</button>
			<button on:click={applyBatchEdit} class="btn btn-primary flex-1">
				应用修改
			</button>
		</div>
	</div>
</Modal>
