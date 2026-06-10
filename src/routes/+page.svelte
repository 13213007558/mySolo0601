<script lang="ts">
	import { derived, writable } from 'svelte/store';
	import { Database } from 'lucide-svelte';
	import Toast from '$lib/components/Toast.svelte';
import type { ToastItem } from '$lib/types';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import DateTimeline from '$lib/components/DateTimeline.svelte';
	import FilterPanel from '$lib/components/FilterPanel.svelte';
	import PhotoGrid from '$lib/components/PhotoGrid.svelte';
	import UploadArea from '$lib/components/UploadArea.svelte';
	import PendingEvidence from '$lib/components/PendingEvidence.svelte';
	import BatchActionBar from '$lib/components/BatchActionBar.svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import { archiveStore } from '$lib/stores/archiveStore';
	import { filterStore } from '$lib/stores/filterStore';
	import { generateId } from '$lib/utils/hash';

	const toasts = writable<ToastItem[]>([]);

	function showToast(type: ToastItem['type'], message: string) {
		const toast: ToastItem = {
			id: generateId(),
			type,
			message
		};
		toasts.update(($t) => [...$t, toast]);
	}

	const archivePhotos = archiveStore.photos;
	const archivePendingEvidence = archiveStore.pendingEvidence;

	const filteredPhotos = derived(
		[archivePhotos, filterStore.state],
		([$photos, $filter]: [any, any]) => {
			return filterStore.filterPhotos($photos, $filter);
		}
	);

	const hasPhotos = derived(archivePhotos, ($photos: any) => $photos.length > 0);
	const hasFilteredPhotos = derived(filteredPhotos, ($photos: any) => $photos.length > 0);
	const hasActiveFilters = filterStore.hasActiveFilters;

	function loadSampleData() {
		window.location.href = '/settings';
	}
</script>

<Toast toasts={$toasts} on:update={(e) => toasts.set(e.detail)} />

<div class="space-y-6">
	<StatsCard />

	{#if !$hasPhotos}
		<div class="card">
			<EmptyState
				type="default"
				title="欢迎使用施工日志照片归档台"
				description="点击下方按钮加载样例数据，快速体验所有功能"
			/>
			<div class="flex justify-center mt-6">
				<button on:click={loadSampleData} class="btn btn-primary">
					<Database class="w-4 h-4" />
					加载样例数据
				</button>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
			<div class="lg:col-span-1 space-y-6">
				<DateTimeline photos={$archivePhotos} />
				<FilterPanel photos={$archivePhotos} />
				<PendingEvidence pendingEvidence={$archivePendingEvidence} />
			</div>

			<div class="lg:col-span-3 space-y-6">
				{#if $hasFilteredPhotos || $hasActiveFilters}
					<div class="card">
						<UploadArea {showToast} />
					</div>
					<PhotoGrid photos={$filteredPhotos} />
				{:else}
					<div class="card">
						<EmptyState
							type="no-results"
							title="没有找到匹配的照片"
							description="尝试调整筛选条件或上传新照片"
						/>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<BatchActionBar photos={$filteredPhotos} />
