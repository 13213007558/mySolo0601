<script lang="ts">
	import { derived, writable } from 'svelte/store';
	import { FileText, Copy, Download, Filter, RefreshCw } from 'lucide-svelte';
	import Toast from '$lib/components/Toast.svelte';
import type { ToastItem } from '$lib/types';
	import MarkdownPreview from '$lib/components/MarkdownPreview.svelte';
	import { archiveStore } from '$lib/stores/archiveStore';
	import { PROCESSES } from '$lib/types';
	import { generateHandoverSummary, copyToClipboard, downloadMarkdown } from '$lib/utils/markdown';
	import { generateId } from '$lib/utils/hash';
	import { extractFloorNumber } from '$lib/utils/validator';
	import type { FilterState } from '$lib/types';

	const toasts = writable<ToastItem[]>([]);

	function showToast(type: ToastItem['type'], message: string) {
		const toast: ToastItem = {
			id: generateId(),
			type,
			message
		};
		toasts.update(($t) => [...$t, toast]);
	}

	const summaryFilters = writable<{
		startDate: string;
		endDate: string;
		floors: string[];
		processes: string[];
		onlyCompleted: boolean;
	}>({
		startDate: '',
		endDate: '',
		floors: [],
		processes: [],
		onlyCompleted: false
	});

	const availableFloors = derived(archiveStore.photos, ($photos: any) => {
		const floorSet = new Set<string>();
		for (const photo of $photos) {
			if (photo.floor) {
				floorSet.add(photo.floor);
			}
		}
		return Array.from(floorSet).sort((a: string, b: string) => {
			const numA = extractFloorNumber(a);
			const numB = extractFloorNumber(b);
			if (numA !== null && numB !== null) return numA - numB;
			return a.localeCompare(b);
		});
	});

	const filteredPhotos = derived(
		[archiveStore.photos, summaryFilters],
		([$photos, $filters]: [any, any]) => {
			return $photos.filter((photo: any) => {
				if ($filters.startDate && photo.date < $filters.startDate) return false;
				if ($filters.endDate && photo.date > $filters.endDate) return false;
				if ($filters.floors.length > 0 && !$filters.floors.includes(photo.floor)) return false;
				if ($filters.processes.length > 0 && !$filters.processes.includes(photo.process)) return false;
				if ($filters.onlyCompleted && !photo.isCompleted) return false;
				return true;
			});
		}
	);

	const summaryMarkdown = derived(filteredPhotos, ($photos: any) => {
		const filterState: FilterState = {
			dateRange:
				$summaryFilters.startDate && $summaryFilters.endDate
					? [$summaryFilters.startDate, $summaryFilters.endDate]
					: null,
			selectedDate: null,
			floors: $summaryFilters.floors,
			processes: $summaryFilters.processes,
			keyword: '',
			onlyPending: false,
			onlyCompleted: $summaryFilters.onlyCompleted ? true : null
		};
		return generateHandoverSummary($photos, filterState);
	});

	const hasPhotos = derived(archiveStore.photos, ($photos: any) => $photos.length > 0);

	function toggleFloor(floor: string) {
		summaryFilters.update(($f) => ({
			...$f,
			floors: $f.floors.includes(floor)
				? $f.floors.filter((f: string) => f !== floor)
				: [...$f.floors, floor]
		}));
	}

	function toggleProcess(process: string) {
		summaryFilters.update(($f) => ({
			...$f,
			processes: $f.processes.includes(process)
				? $f.processes.filter((p: string) => p !== process)
				: [...$f.processes, process]
		}));
	}

	function clearFilters() {
		summaryFilters.set({
			startDate: '',
			endDate: '',
			floors: [],
			processes: [],
			onlyCompleted: false
		});
	}

	async function handleCopy() {
		const success = await copyToClipboard($summaryMarkdown);
		if (success) {
			showToast('success', 'Markdown 已复制到剪贴板');
		} else {
			showToast('error', '复制失败，请手动复制');
		}
	}

	function handleDownload() {
		downloadMarkdown($summaryMarkdown);
		showToast('success', '交接摘要已下载');
	}
</script>

<Toast toasts={$toasts} on:update={(e) => toasts.set(e.detail)} />

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<h2 class="text-2xl font-bold text-construction-gray-dark flex items-center gap-2">
				<FileText class="w-7 h-7 text-construction-orange" />
				交接摘要
			</h2>
			<p class="text-construction-gray mt-1">
				共 {$filteredPhotos.length} 张照片符合筛选条件
			</p>
		</div>
		<div class="flex gap-2">
			<button on:click={handleCopy} class="btn btn-secondary">
				<Copy class="w-4 h-4" />
				复制 Markdown
			</button>
			<button on:click={handleDownload} class="btn btn-primary">
				<Download class="w-4 h-4" />
				下载 .md 文件
			</button>
		</div>
	</div>

	{#if !$hasPhotos}
		<div class="card text-center py-12">
			<FileText class="w-16 h-16 mx-auto text-construction-gray mb-4" />
			<p class="text-construction-gray-dark font-medium mb-2">暂无照片数据</p>
			<p class="text-construction-gray text-sm">请先在归档台上上传照片</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
			<div class="lg:col-span-1">
				<div class="card sticky top-32">
					<div class="flex items-center justify-between mb-4">
						<div class="flex items-center gap-2">
							<Filter class="w-5 h-5 text-construction-orange" />
							<h3 class="font-semibold text-construction-gray-dark">筛选条件</h3>
						</div>
						<button
							on:click={clearFilters}
							class="text-xs text-construction-gray hover:text-construction-orange transition-colors flex items-center gap-1"
						>
							<RefreshCw class="w-3 h-3" />
							重置
						</button>
					</div>

					<div class="space-y-4">
						<div>
							<label class="label">开始日期</label>
							<input
								type="date"
								bind:value={$summaryFilters.startDate}
								class="input"
							/>
						</div>
						<div>
							<label class="label">结束日期</label>
							<input
								type="date"
								bind:value={$summaryFilters.endDate}
								class="input"
							/>
						</div>

						<div>
							<div class="flex items-center justify-between mb-2">
								<label class="label mb-0">楼层</label>
								<button
									on:click={() => summaryFilters.update(($f) => ({ ...$f, floors: [] }))}
									class="text-xs text-construction-gray hover:text-construction-orange"
								>
									清空
								</button>
							</div>
							<div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
								{#each $availableFloors as floor}
									<button
										on:click={() => toggleFloor(floor)}
										class="badge cursor-pointer transition-colors
											{$summaryFilters.floors.includes(floor)
												? 'badge-orange'
												: 'badge-gray hover:bg-construction-orange hover:bg-opacity-20'}"
									>
										{floor}
									</button>
								{/each}
							</div>
						</div>

						<div>
							<div class="flex items-center justify-between mb-2">
								<label class="label mb-0">工序</label>
								<button
									on:click={() => summaryFilters.update(($f) => ({ ...$f, processes: [] }))}
									class="text-xs text-construction-gray hover:text-construction-orange"
								>
									清空
								</button>
							</div>
							<div class="flex flex-wrap gap-2">
								{#each PROCESSES as process}
									<button
										on:click={() => toggleProcess(process)}
										class="badge cursor-pointer transition-colors
											{$summaryFilters.processes.includes(process)
												? 'badge-orange'
												: 'badge-gray hover:bg-construction-orange hover:bg-opacity-20'}"
									>
										{process}
									</button>
								{/each}
							</div>
						</div>

						<div class="flex items-center gap-2">
							<input
								type="checkbox"
								id="only-completed"
								bind:checked={$summaryFilters.onlyCompleted}
								class="w-4 h-4 text-construction-orange rounded"
							/>
							<label for="only-completed" class="text-sm text-construction-gray-dark">
								仅显示已完成
							</label>
						</div>
					</div>
				</div>
			</div>

			<div class="lg:col-span-3">
				<div class="card">
					<MarkdownPreview markdown={$summaryMarkdown} />
				</div>
			</div>
		</div>
	{/if}
</div>
