<script lang="ts">
	import { derived } from 'svelte/store';
	import { archiveStore } from '$lib/stores/archiveStore';
	import { formatFileSize, getStorageSize } from '$lib/utils/storage';
	import { Images, CheckCircle, Clock, HardDrive } from 'lucide-svelte';

	const stats = archiveStore.stats;
	const storageSize = derived(archiveStore.photos, () => formatFileSize(getStorageSize()));
</script>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
	<div class="card flex items-center gap-4">
		<div class="w-12 h-12 rounded-lg bg-construction-orange bg-opacity-10 flex items-center justify-center">
			<Images class="w-6 h-6 text-construction-orange" />
		</div>
		<div>
			<p class="text-sm text-construction-gray">照片总数</p>
			<p class="text-2xl font-bold text-construction-gray-dark">{$stats.total}</p>
		</div>
	</div>

	<div class="card flex items-center gap-4">
		<div class="w-12 h-12 rounded-lg bg-green-500 bg-opacity-10 flex items-center justify-center">
			<CheckCircle class="w-6 h-6 text-green-500" />
		</div>
		<div>
			<p class="text-sm text-construction-gray">已完成</p>
			<p class="text-2xl font-bold text-green-600">{$stats.completed}</p>
		</div>
	</div>

	<div class="card flex items-center gap-4">
		<div class="w-12 h-12 rounded-lg bg-yellow-500 bg-opacity-10 flex items-center justify-center">
			<Clock class="w-6 h-6 text-yellow-500" />
		</div>
		<div>
			<p class="text-sm text-construction-gray">待确认</p>
			<p class="text-2xl font-bold text-yellow-600">{$stats.pending}</p>
		</div>
	</div>

	<div class="card flex items-center gap-4">
		<div class="w-12 h-12 rounded-lg bg-construction-blue bg-opacity-10 flex items-center justify-center">
			<HardDrive class="w-6 h-6 text-construction-blue" />
		</div>
		<div>
			<p class="text-sm text-construction-gray">存储大小</p>
			<p class="text-2xl font-bold text-construction-blue">{$storageSize}</p>
		</div>
	</div>
</div>
