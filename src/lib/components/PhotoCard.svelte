<script lang="ts">
	import { CheckCircle, Clock, Trash2, Edit3, MoreVertical, X, Check } from 'lucide-svelte';
	import type { Photo } from '$lib/types';
	import { archiveStore } from '$lib/stores/archiveStore';
	import { escapeHtml, normalizeFloor, validatePhotoData } from '$lib/utils/validator';
	import { formatDateChinese } from '$lib/utils/date';
	import { writable } from 'svelte/store';
	import Modal from './Modal.svelte';

	export let photo: Photo;
	export let isSelected = false;

	const showDetail = writable(false);
	const isEditing = writable(false);
	const editForm = writable({
		date: photo.date,
		floor: photo.floor,
		process: photo.process,
		remark: photo.remark
	});
	const editErrors = writable<string[]>([]);

	function toggleSelect() {
		archiveStore.toggleSelect(photo.id);
	}

	function toggleCompleted() {
		archiveStore.toggleCompleted([photo.id], !photo.isCompleted);
	}

	function deletePhoto() {
		if (confirm(`确定要删除照片 "${photo.name}" 吗？`)) {
			archiveStore.deletePhotos([photo.id]);
			showDetail.set(false);
		}
	}

	function startEdit() {
		editForm.set({
			date: photo.date,
			floor: photo.floor,
			process: photo.process,
			remark: photo.remark
		});
		editErrors.set([]);
		isEditing.set(true);
	}

	function cancelEdit() {
		isEditing.set(false);
		editErrors.set([]);
	}

	function saveEdit() {
		const form = $editForm;
		const validation = validatePhotoData(form);
		if (!validation.valid) {
			editErrors.set(validation.errors);
			return;
		}

		archiveStore.updatePhoto(photo.id, {
			date: form.date,
			floor: normalizeFloor(form.floor),
			process: form.process,
			remark: form.remark
		});

		isEditing.set(false);
		editErrors.set([]);
	}

	$: safeRemark = escapeHtml(photo.remark);
</script>

<div
	class="photo-card relative group cursor-pointer transition-all duration-200
		{isSelected ? 'ring-2 ring-construction-orange ring-offset-2' : ''}"
	on:click={() => showDetail.set(true)}
>
	<div
		class="absolute top-2 left-2 z-10 w-6 h-6 rounded border-2 flex items-center justify-center transition-all
			{isSelected
				? 'bg-construction-orange border-construction-orange'
				: 'bg-white border-gray-300 opacity-0 group-hover:opacity-100'}"
		on:click|stopPropagation={toggleSelect}
	>
		{#if isSelected}
			<Check class="w-4 h-4 text-white" />
		{/if}
	</div>

	<div
		class="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"
		on:click|stopPropagation
	>
		<button
			on:click={toggleCompleted}
			class="p-1.5 bg-white rounded shadow hover:bg-gray-50 transition-colors"
			title={photo.isCompleted ? '标记为待确认' : '标记为已完成'}
		>
			{#if photo.isCompleted}
				<CheckCircle class="w-4 h-4 text-green-500" />
			{:else}
				<Clock class="w-4 h-4 text-yellow-500" />
			{/if}
		</button>
		<button
			on:click={deletePhoto}
			class="p-1.5 bg-white rounded shadow hover:bg-red-50 transition-colors"
			title="删除"
		>
			<Trash2 class="w-4 h-4 text-red-500" />
		</button>
	</div>

	<div class="process-tag process-{photo.process} absolute bottom-2 left-2 z-10">
		{photo.process}
	</div>

	<div class="aspect-[4/3] overflow-hidden bg-gray-100">
		<img
			src={photo.thumbnailUrl || photo.dataUrl}
			alt={photo.name}
			class="w-full h-full object-cover transition-transform group-hover:scale-105"
			loading="lazy"
		/>
	</div>

	<div class="p-3">
		<div class="flex items-center justify-between mb-1">
			<span class="text-sm font-medium text-construction-gray-dark truncate flex-1">
				{photo.floor}
			</span>
			<span
				class="text-xs px-2 py-0.5 rounded
					{photo.isCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}"
			>
				{photo.isCompleted ? '已完成' : '待确认'}
			</span>
		</div>
		<p class="text-xs text-construction-gray truncate">{photo.name}</p>
		{#if photo.remark}
			<p class="text-xs text-construction-gray mt-1 line-clamp-2">{@html safeRemark}</p>
		{/if}
	</div>
</div>

<Modal show={$showDetail} title="照片详情" on:close={() => showDetail.set(false)}>
	<div class="space-y-4">
		<div class="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
			<img src={photo.dataUrl} alt={photo.name} class="w-full h-full object-contain" />
		</div>

		{#if $isEditing}
			<div class="space-y-4">
				{#if $editErrors.length > 0}
					<div class="p-3 bg-red-50 border border-red-200 rounded-lg">
						{#each $editErrors as error}
							<p class="text-sm text-red-600">{error}</p>
						{/each}
					</div>
				{/if}

				<div>
					<label class="label">拍摄日期</label>
					<input
						type="date"
						bind:value={$editForm.date}
						class="input"
					/>
				</div>

				<div>
					<label class="label">楼层</label>
					<input
						type="text"
						bind:value={$editForm.floor}
						class="input"
						placeholder="如：18层 或 十八层"
					/>
				</div>

				<div>
					<label class="label">工序</label>
					<select bind:value={$editForm.process} class="input">
						{#each ['砌筑', '钢筋', '模板', '混凝土', '防水', '抹灰', '其他'] as p}
							<option value={p}>{p}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="label">备注</label>
					<textarea
						bind:value={$editForm.remark}
						class="input min-h-[80px]"
						placeholder="添加照片备注..."
					/>
				</div>

				<div class="flex gap-2">
					<button on:click={saveEdit} class="btn btn-primary flex-1">
						<Check class="w-4 h-4" />
						保存
					</button>
					<button on:click={cancelEdit} class="btn btn-secondary flex-1">
						<X class="w-4 h-4" />
						取消
					</button>
				</div>
			</div>
		{:else}
			<div class="space-y-3">
				<div class="flex justify-between py-2 border-b border-gray-100">
					<span class="text-construction-gray">文件名</span>
					<span class="text-construction-gray-dark font-medium">{photo.name}</span>
				</div>
				<div class="flex justify-between py-2 border-b border-gray-100">
					<span class="text-construction-gray">拍摄日期</span>
					<span class="text-construction-gray-dark font-medium">{formatDateChinese(photo.date)}</span>
				</div>
				<div class="flex justify-between py-2 border-b border-gray-100">
					<span class="text-construction-gray">楼层</span>
					<span class="text-construction-gray-dark font-medium">{photo.floor}</span>
				</div>
				<div class="flex justify-between py-2 border-b border-gray-100">
					<span class="text-construction-gray">工序</span>
					<span class="badge process-{photo.process}">{photo.process}</span>
				</div>
				<div class="flex justify-between py-2 border-b border-gray-100">
					<span class="text-construction-gray">状态</span>
					<span
						class="text-sm px-2 py-0.5 rounded
							{photo.isCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}"
					>
						{photo.isCompleted ? '已完成' : '待确认'}
					</span>
				</div>
				<div class="py-2">
					<span class="text-construction-gray block mb-1">备注</span>
					<p class="text-construction-gray-dark">{@html safeRemark}</p>
				</div>

				<div class="flex gap-2">
					<button on:click={startEdit} class="btn btn-secondary flex-1">
						<Edit3 class="w-4 h-4" />
						编辑
					</button>
					<button on:click={deletePhoto} class="btn btn-danger flex-1">
						<Trash2 class="w-4 h-4" />
						删除
					</button>
				</div>
			</div>
		{/if}
	</div>
</Modal>
