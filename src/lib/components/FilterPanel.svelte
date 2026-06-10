<script lang="ts">
	import { derived } from 'svelte/store';
	import { Filter, X, Search, Building2, Layers, CheckSquare, Clock } from 'lucide-svelte';
	import { PROCESSES } from '$lib/types';
	import type { Photo } from '$lib/types';
	import { filterStore } from '$lib/stores/filterStore';
	import { extractFloorNumber } from '$lib/utils/validator';

	export let photos: Photo[] = [];

	const filterState = filterStore.state;

	const availableFloors = derived([filterState], ([$filter]) => {
		const floorSet = new Set<string>();
		for (const photo of photos) {
			if (photo.floor) {
				floorSet.add(photo.floor);
			}
		}
		return Array.from(floorSet).sort((a, b) => {
			const numA = extractFloorNumber(a);
			const numB = extractFloorNumber(b);
			if (numA !== null && numB !== null) return numA - numB;
			return a.localeCompare(b);
		});
	});

	const activeFilterCount = derived(filterStore.availableFilters, ($filters) => $filters.length);

	function clearAll() {
		filterStore.reset();
	}

	function handleKeywordInput(e: Event) {
		const target = e.target as HTMLInputElement;
		filterStore.setKeyword(target.value);
	}
</script>

<div class="card">
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center gap-2">
			<Filter class="w-5 h-5 text-construction-orange" />
			<h3 class="font-semibold text-construction-gray-dark">筛选</h3>
			{#if $activeFilterCount > 0}
				<span class="badge badge-orange">{$activeFilterCount}</span>
			{/if}
		</div>
		{#if $activeFilterCount > 0}
			<button
				on:click={clearAll}
				class="text-xs text-construction-gray hover:text-construction-orange transition-colors flex items-center gap-1"
			>
				<X class="w-3 h-3" />
				清除全部
			</button>
		{/if}
	</div>

	<div class="space-y-4">
		<div>
			<label class="label flex items-center gap-2">
				<Search class="w-4 h-4" />
				关键词
			</label>
			<input
				type="text"
				value={$filterState.keyword}
				on:input={handleKeywordInput}
				class="input"
				placeholder="搜索文件名、备注..."
			/>
		</div>

		<div>
			<label class="label flex items-center gap-2">
				<Building2 class="w-4 h-4" />
				楼层
			</label>
			<div class="flex flex-wrap gap-2">
				{#each $availableFloors as floor}
					<button
						on:click={() => filterStore.toggleFloor(floor)}
						class="badge cursor-pointer transition-colors
							{$filterState.floors.includes(floor)
								? 'badge-orange'
								: 'badge-gray hover:bg-construction-orange hover:bg-opacity-20'}"
					>
						{floor}
					</button>
				{/each}
				{#if $availableFloors.length === 0}
					<span class="text-sm text-construction-gray">暂无楼层数据</span>
				{/if}
			</div>
		</div>

		<div>
			<label class="label flex items-center gap-2">
				<Layers class="w-4 h-4" />
				工序
			</label>
			<div class="flex flex-wrap gap-2">
				{#each PROCESSES as process}
					<button
						on:click={() => filterStore.toggleProcess(process)}
						class="badge cursor-pointer transition-colors
							{$filterState.processes.includes(process)
								? 'badge-orange'
								: 'badge-gray hover:bg-construction-orange hover:bg-opacity-20'}"
					>
						{process}
					</button>
				{/each}
			</div>
		</div>

		<div>
			<label class="label flex items-center gap-2">
				<CheckSquare class="w-4 h-4" />
				完成状态
			</label>
			<div class="flex gap-2">
				<button
					on:click={() => filterStore.setOnlyCompleted(null)}
					class="badge cursor-pointer transition-colors
						{$filterState.onlyCompleted === null ? 'badge-orange' : 'badge-gray hover:bg-construction-orange hover:bg-opacity-20'}"
				>
					全部
				</button>
				<button
					on:click={() => filterStore.setOnlyCompleted(true)}
					class="badge cursor-pointer transition-colors
						{$filterState.onlyCompleted === true ? 'badge-orange' : 'badge-gray hover:bg-construction-orange hover:bg-opacity-20'}"
				>
					已完成
				</button>
				<button
					on:click={() => filterStore.setOnlyCompleted(false)}
					class="badge cursor-pointer transition-colors
						{$filterState.onlyCompleted === false ? 'badge-orange' : 'badge-gray hover:bg-construction-orange hover:bg-opacity-20'}"
				>
					待确认
				</button>
			</div>
		</div>
	</div>
</div>
