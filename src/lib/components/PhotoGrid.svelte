<script lang="ts">
	import { derived, writable } from 'svelte/store';
	import { CheckSquare, Square, ArrowUpDown } from 'lucide-svelte';
	import type { Photo } from '$lib/types';
	import { archiveStore } from '$lib/stores/archiveStore';
	import { sortPhotos } from '$lib/stores/filterStore';
	import { formatDateChinese } from '$lib/utils/date';
	import PhotoCard from './PhotoCard.svelte';
	import EmptyState from './EmptyState.svelte';

	export let photos: Photo[] = [];

	const selectedPhotoIds = archiveStore.selectedPhotoIds;

	type SortOption = 'date' | 'floor' | 'process' | 'uploadTime';
	const sortBy = writable<SortOption>('date');
	const sortAsc = writable(false);

	const allPhotoIds = derived([sortBy, sortAsc], ([$sortBy, $sortAsc]) => {
		const sorted = sortPhotos(photos, $sortBy, $sortAsc);
		return sorted.map((p) => p.id);
	});

	const sortedPhotos = derived([sortBy, sortAsc], ([$sortBy, $sortAsc]) => {
		return sortPhotos(photos, $sortBy, $sortAsc);
	});

	const groupedByDate = derived(sortedPhotos, ($photos) => {
		const groups: Record<string, Photo[]> = {};
		for (const photo of $photos) {
			if (!groups[photo.date]) {
				groups[photo.date] = [];
			}
			groups[photo.date].push(photo);
		}
		return groups;
	});

	const isAllSelected = derived(
		[selectedPhotoIds, allPhotoIds],
		([$selected, $allIds]) => {
			if ($allIds.length === 0) return false;
			return $allIds.every((id) => $selected.includes(id));
		}
	);

	const selectedCount = derived(selectedPhotoIds, ($ids) => $ids.length);

	function toggleSelectAll() {
		if ($isAllSelected) {
			archiveStore.clearSelection();
		} else {
			archiveStore.selectAll($allPhotoIds);
		}
	}

	function toggleSort(option: SortOption) {
		if ($sortBy === option) {
			sortAsc.update((v) => !v);
		} else {
			sortBy.set(option);
			sortAsc.set(false);
		}
	}

	const sortOptions: { value: SortOption; label: string }[] = [
		{ value: 'date', label: '日期' },
		{ value: 'floor', label: '楼层' },
		{ value: 'process', label: '工序' },
		{ value: 'uploadTime', label: '上传时间' }
	];
</script>

{#if photos.length === 0}
	<EmptyState type="no-results" />
{:else}
	<div class="space-y-6">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="flex items-center gap-4">
				<button
					on:click={toggleSelectAll}
					class="flex items-center gap-2 text-sm text-construction-gray hover:text-construction-orange transition-colors"
				>
					{#if $isAllSelected}
						<CheckSquare class="w-5 h-5 text-construction-orange" />
						<span>取消全选</span>
					{:else}
						<Square class="w-5 h-5" />
						<span>全选</span>
					{/if}
				</button>
				{#if $selectedCount > 0}
					<span class="text-sm text-construction-gray">
						已选择 <span class="font-semibold text-construction-orange">{$selectedCount}</span> 张
					</span>
				{/if}
			</div>

			<div class="flex items-center gap-2">
				<ArrowUpDown class="w-4 h-4 text-construction-gray" />
				{#each sortOptions as option}
					<button
						on:click={() => toggleSort(option.value)}
						class="text-sm px-3 py-1 rounded transition-colors
							{$sortBy === option.value
								? 'bg-construction-orange text-white'
								: 'text-construction-gray hover:bg-gray-100'}"
					>
						{option.label}
						{#if $sortBy === option.value}
							{$sortAsc ? '↑' : '↓'}
						{/if}
					</button>
				{/each}
			</div>
		</div>

		{#each Object.keys($groupedByDate).sort() as date}
			<div class="space-y-3">
				<h3 class="text-lg font-semibold text-construction-gray-dark flex items-center gap-2">
					<span class="w-1 h-6 bg-construction-orange rounded-full" />
					{formatDateChinese(date)}
					<span class="text-sm font-normal text-construction-gray">
						({$groupedByDate[date].length} 张)
					</span>
				</h3>
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					{#each $groupedByDate[date] as photo (photo.id)}
						<PhotoCard
							photo={photo}
							isSelected={$selectedPhotoIds.includes(photo.id)}
						/>
					{/each}
				</div>
			</div>
		{/each}
	</div>
{/if}
