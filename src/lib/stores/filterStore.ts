import { writable, derived } from 'svelte/store';
import type { FilterState, Photo } from '$lib/types';
import { isDateInRange, extractFloorNumber } from '$lib/utils/validator';

function createFilterStore() {
	const state = writable<FilterState>({
		dateRange: null,
		selectedDate: null,
		floors: [],
		processes: [],
		keyword: '',
		onlyPending: false,
		onlyCompleted: null
	});

	function setDateRange(range: [string, string] | null): void {
		state.update(($state) => ({ ...$state, dateRange: range, selectedDate: null }));
	}

	function setSelectedDate(date: string | null): void {
		state.update(($state) => ({ ...$state, selectedDate: date, dateRange: null }));
	}

	function toggleFloor(floor: string): void {
		state.update(($state) => ({
			...$state,
			floors: $state.floors.includes(floor)
				? $state.floors.filter((f) => f !== floor)
				: [...$state.floors, floor]
		}));
	}

	function setFloors(floors: string[]): void {
		state.update(($state) => ({ ...$state, floors }));
	}

	function toggleProcess(process: string): void {
		state.update(($state) => ({
			...$state,
			processes: $state.processes.includes(process)
				? $state.processes.filter((p) => p !== process)
				: [...$state.processes, process]
		}));
	}

	function setProcesses(processes: string[]): void {
		state.update(($state) => ({ ...$state, processes }));
	}

	function setKeyword(keyword: string): void {
		state.update(($state) => ({ ...$state, keyword }));
	}

	function setOnlyPending(value: boolean): void {
		state.update(($state) => ({ ...$state, onlyPending: value }));
	}

	function setOnlyCompleted(value: boolean | null): void {
		state.update(($state) => ({ ...$state, onlyCompleted: value }));
	}

	function reset(): void {
		state.set({
			dateRange: null,
			selectedDate: null,
			floors: [],
			processes: [],
			keyword: '',
			onlyPending: false,
			onlyCompleted: null
		});
	}

	function filterPhotos(photos: Photo[], filterState: FilterState): Photo[] {
		return photos.filter((photo) => {
			if (filterState.selectedDate && photo.date !== filterState.selectedDate) {
				return false;
			}

			if (
				filterState.dateRange &&
				!isDateInRange(photo.date, filterState.dateRange[0], filterState.dateRange[1])
			) {
				return false;
			}

			if (filterState.floors.length > 0 && !filterState.floors.includes(photo.floor)) {
				return false;
			}

			if (filterState.processes.length > 0 && !filterState.processes.includes(photo.process)) {
				return false;
			}

			if (filterState.keyword) {
				const keyword = filterState.keyword.toLowerCase();
				const matches =
					photo.name.toLowerCase().includes(keyword) ||
					photo.remark.toLowerCase().includes(keyword) ||
					photo.floor.toLowerCase().includes(keyword) ||
					photo.process.toLowerCase().includes(keyword);
				if (!matches) return false;
			}

			if (filterState.onlyPending && photo.isCompleted) {
				return false;
			}

			if (filterState.onlyCompleted === true && !photo.isCompleted) {
				return false;
			}

			if (filterState.onlyCompleted === false && photo.isCompleted) {
				return false;
			}

			return true;
		});
	}

	const availableFilters = derived(state, ($state) => {
		const active: string[] = [];
		if ($state.selectedDate) active.push('date');
		if ($state.dateRange) active.push('dateRange');
		if ($state.floors.length > 0) active.push('floors');
		if ($state.processes.length > 0) active.push('processes');
		if ($state.keyword) active.push('keyword');
		if ($state.onlyPending) active.push('onlyPending');
		if ($state.onlyCompleted !== null) active.push('onlyCompleted');
		return active;
	});

	const hasActiveFilters = derived(availableFilters, ($filters) => $filters.length > 0);

	return {
		state,
		availableFilters,
		hasActiveFilters,
		setDateRange,
		setSelectedDate,
		toggleFloor,
		setFloors,
		toggleProcess,
		setProcesses,
		setKeyword,
		setOnlyPending,
		setOnlyCompleted,
		reset,
		filterPhotos
	};
}

export const filterStore = createFilterStore();

export function sortPhotos(
	photos: Photo[],
	sortBy: 'date' | 'floor' | 'process' | 'uploadTime',
	asc = false
): Photo[] {
	return [...photos].sort((a, b) => {
		let comparison = 0;
		switch (sortBy) {
			case 'date':
				comparison = a.date.localeCompare(b.date);
				break;
			case 'floor': {
				const floorA = extractFloorNumber(a.floor);
				const floorB = extractFloorNumber(b.floor);
				if (floorA !== null && floorB !== null) {
					comparison = floorA - floorB;
				} else {
					comparison = a.floor.localeCompare(b.floor);
				}
				break;
			}
			case 'process':
				comparison = a.process.localeCompare(b.process);
				break;
			case 'uploadTime':
				comparison = a.uploadTime.localeCompare(b.uploadTime);
				break;
		}
		return asc ? comparison : -comparison;
	});
}
