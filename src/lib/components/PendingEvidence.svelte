<script lang="ts">
	import { writable } from 'svelte/store';
	import { AlertTriangle, ChevronDown, ChevronUp, Calendar, MapPin, Layers } from 'lucide-svelte';
	import type { PendingEvidence } from '$lib/types';
	import { filterStore } from '$lib/stores/filterStore';
	import { formatDateChinese } from '$lib/utils/date';
	import EmptyState from './EmptyState.svelte';

	export let pendingEvidence: PendingEvidence[] = [];

	const isExpanded = writable(true);

	function toggleExpand() {
		isExpanded.update((v) => !v);
	}

	function goToDate(date: string) {
		filterStore.setSelectedDate(date);
	}
</script>

<div class="card">
	<div class="flex items-center justify-between mb-4 cursor-pointer" on:click={toggleExpand}>
		<div class="flex items-center gap-2">
			<AlertTriangle class="w-5 h-5 text-yellow-500" />
			<h3 class="font-semibold text-construction-gray-dark">待补证据区</h3>
			{#if pendingEvidence.length > 0}
				<span class="badge badge-orange">{pendingEvidence.length}</span>
			{/if}
		</div>
		<button class="p-1 hover:bg-gray-100 rounded transition-colors">
			{#if $isExpanded}
				<ChevronUp class="w-5 h-5 text-construction-gray" />
			{:else}
				<ChevronDown class="w-5 h-5 text-construction-gray" />
			{/if}
		</button>
	</div>

	{#if $isExpanded}
		{#if pendingEvidence.length === 0}
			<EmptyState
				type="all-done"
				title="太棒了！"
				description="所有日志都有照片证据"
			/>
		{:else}
			<div class="space-y-3 max-h-64 overflow-y-auto">
				{#each pendingEvidence as item (item.id)}
					<div
						class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
						on:click={() => goToDate(item.date)}
					>
						<div class="flex items-center justify-between mb-2">
							<div class="flex items-center gap-2">
								<Calendar class="w-4 h-4 text-yellow-600" />
								<span class="text-sm font-medium text-yellow-800">
									{formatDateChinese(item.date)}
								</span>
							</div>
							<span class="badge process-{item.process}">{item.process}</span>
						</div>
						<div class="flex items-center gap-2 text-sm text-yellow-700">
							<MapPin class="w-3 h-3" />
							<span>{item.floor}</span>
						</div>
						<p class="text-xs text-yellow-600 mt-1">{item.missingReason}</p>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
