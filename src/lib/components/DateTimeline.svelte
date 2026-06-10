<script lang="ts">
	import { writable, derived } from 'svelte/store';
	import { ChevronLeft, ChevronRight, Calendar } from 'lucide-svelte';
	import type { Photo } from '$lib/types';
	import { filterStore } from '$lib/stores/filterStore';
	import { formatMonthChinese, getDaysInMonth, isSameMonthWrapper, isSameDayWrapper, addMonthsWrapper, subMonthsWrapper } from '$lib/utils/date';

	export let photos: Photo[] = [];

	const filterState = filterStore.state;
	const currentMonth = writable(new Date());

	const daysInMonth = derived(currentMonth, ($month) => getDaysInMonth($month));

	const datesWithPhotos = derived([currentMonth, filterState], ([$month, $filter]) => {
		const dates = new Set<string>();
		for (const photo of photos) {
			if (isSameMonthWrapper(new Date(photo.date), $month)) {
				dates.add(photo.date);
			}
		}
		return dates;
	});

	const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

	function prevMonth() {
		currentMonth.update(($m) => subMonthsWrapper($m, 1));
	}

	function nextMonth() {
		currentMonth.update(($m) => addMonthsWrapper($m, 1));
	}

	function selectDate(dateStr: string) {
		filterStore.setSelectedDate(dateStr);
	}
</script>

<div class="card">
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center gap-2">
			<Calendar class="w-5 h-5 text-construction-orange" />
			<h3 class="font-semibold text-construction-gray-dark">日期轴</h3>
		</div>
		<div class="flex items-center gap-2">
			<button
				on:click={prevMonth}
				class="p-1 hover:bg-gray-100 rounded transition-colors"
				aria-label="上个月"
			>
				<ChevronLeft class="w-5 h-5" />
			</button>
			<span class="text-sm font-medium text-construction-gray-dark">
				{formatMonthChinese($currentMonth)}
			</span>
			<button
				on:click={nextMonth}
				class="p-1 hover:bg-gray-100 rounded transition-colors"
				aria-label="下个月"
			>
				<ChevronRight class="w-5 h-5" />
			</button>
		</div>
	</div>

	<div class="grid grid-cols-7 gap-1 text-center">
		{#each weekDays as day}
			<div class="text-xs font-medium text-construction-gray py-2">{day}</div>
		{/each}

		{#each $daysInMonth as day}
			{@const dateStr = day.toISOString().split('T')[0]}
			{@const hasPhoto = $datesWithPhotos.has(dateStr)}
			{@const isSelected = $filterState.selectedDate === dateStr}
			{@const isCurrentMonth = isSameMonthWrapper(day, $currentMonth)}

			<button
				on:click={() => hasPhoto && selectDate(dateStr)}
				class="relative p-2 text-sm rounded transition-colors
					{isCurrentMonth ? '' : 'text-gray-300'}
					{isSelected ? 'bg-construction-orange text-white' : ''}
					{hasPhoto && !isSelected ? 'hover:bg-construction-orange hover:bg-opacity-10 cursor-pointer' : ''}
					{!hasPhoto ? 'cursor-default' : ''}
				"
				disabled={!hasPhoto}
			>
				{day.getDate()}
				{#if hasPhoto}
					<span
						class="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full
							{isSelected ? 'bg-white' : 'bg-construction-orange'}"
					/>
				{/if}
			</button>
		{/each}
	</div>
</div>
