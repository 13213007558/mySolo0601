<script lang="ts">
	import { getStore } from '$lib/store.svelte';
	import { formatDateTime, getRecordStatusLabel, getMissingStatusLabel, getBatchStatusLabel } from '$lib/utils';
	import { Package, Clock, AlertTriangle, CheckCircle } from '@lucide/svelte';

	const store = getStore();

	const batchCount = $derived(store.batches.length);
	const pendingCount = $derived(store.records.filter(r => r.status === 'pending').length);
	const missingCount = $derived(store.missingParts.filter(m => m.status !== 'resolved').length);
	const resolvedCount = $derived(store.missingParts.filter(m => m.status === 'resolved').length);

	const recentBatches = $derived(
		[...store.batches]
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.slice(0, 5)
	);

	const pendingMissingParts = $derived(
		store.missingParts.filter(m => m.status !== 'resolved')
	);

	function getBatchProgress(batchId: string): number {
		const recs = store.records.filter(r => r.batchId === batchId);
		if (recs.length === 0) return 0;
		const accepted = recs.filter(r => r.status === 'accepted').length;
		return Math.round((accepted / recs.length) * 100);
	}

	function getBatchAcceptedCount(batchId: string): number {
		return store.records.filter(r => r.batchId === batchId && r.status === 'accepted').length;
	}

	function getBatchTotalCount(batchId: string): number {
		return store.records.filter(r => r.batchId === batchId).length;
	}

	const batchStatusColor: Record<string, string> = {
		delivered: 'bg-amber-100 text-amber-700',
		accepted: 'bg-green-100 text-green-700',
		partial_accepted: 'bg-sky-100 text-sky-700',
		in_transit: 'bg-slate-100 text-slate-600'
	};

	const missingStatusColor: Record<string, string> = {
		missing: 'bg-red-100 text-red-700',
		partial: 'bg-amber-100 text-amber-700',
		resolved: 'bg-green-100 text-green-700'
	};
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-slate-900">仪表盘</h1>
		<p class="text-slate-500 mt-1">门窗进场验收数据概览</p>
	</div>

	<!-- Section 1: Statistics Cards -->
	<div class="grid grid-cols-4 gap-4">
		<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 rounded-full flex items-center justify-center" style="background-color: rgba(59,106,156,0.1);">
					<Package size={22} style="color: #3B6A9C;" />
				</div>
				<div>
					<div class="text-3xl font-bold text-slate-900">{batchCount}</div>
					<div class="text-sm text-slate-500">批次总数</div>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 rounded-full flex items-center justify-center" style="background-color: rgba(217,119,6,0.1);">
					<Clock size={22} style="color: #D97706;" />
				</div>
				<div>
					<div class="text-3xl font-bold text-slate-900">{pendingCount}</div>
					<div class="text-sm text-slate-500">待验收</div>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 rounded-full flex items-center justify-center" style="background-color: rgba(220,38,38,0.1);">
					<AlertTriangle size={22} style="color: #DC2626;" />
				</div>
				<div>
					<div class="text-3xl font-bold text-slate-900">{missingCount}</div>
					<div class="text-sm text-slate-500">缺件数</div>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
			<div class="flex items-center gap-4">
				<div class="w-12 h-12 rounded-full flex items-center justify-center" style="background-color: rgba(5,150,105,0.1);">
					<CheckCircle size={22} style="color: #059669;" />
				</div>
				<div>
					<div class="text-3xl font-bold text-slate-900">{resolvedCount}</div>
					<div class="text-sm text-slate-500">已补齐</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Section 2: Recent Batches -->
	<div class="bg-white rounded-xl shadow-sm overflow-hidden">
		<div class="px-5 py-4 border-b border-slate-200">
			<h2 class="text-base font-semibold text-slate-900">最近批次</h2>
		</div>
		{#if recentBatches.length === 0}
			<div class="px-5 py-8 text-center text-slate-400">暂无批次数据</div>
		{:else}
			<table class="w-full">
				<thead>
					<tr class="bg-slate-50">
						<th class="px-4 py-3 text-left text-xs uppercase text-slate-500 font-semibold">批次号</th>
						<th class="px-4 py-3 text-left text-xs uppercase text-slate-500 font-semibold">供应商</th>
						<th class="px-4 py-3 text-left text-xs uppercase text-slate-500 font-semibold">到货日期</th>
						<th class="px-4 py-3 text-left text-xs uppercase text-slate-500 font-semibold">状态</th>
						<th class="px-4 py-3 text-left text-xs uppercase text-slate-500 font-semibold">验收进度</th>
					</tr>
				</thead>
				<tbody>
					{#each recentBatches as batch}
						<tr class="border-t border-slate-100 hover:bg-slate-50">
							<td class="px-4 py-3 text-sm font-medium text-slate-900">{batch.batchNo}</td>
							<td class="px-4 py-3 text-sm text-slate-600">{batch.supplier}</td>
							<td class="px-4 py-3 text-sm text-slate-600">{formatDateTime(batch.deliveryDate)}</td>
							<td class="px-4 py-3">
								<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {batchStatusColor[batch.status] ?? 'bg-slate-100 text-slate-600'}">
									{getBatchStatusLabel(batch.status)}
								</span>
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center gap-2">
									<div class="flex-1 h-2 rounded-full bg-slate-200">
										<div
											class="h-2 rounded-full"
											style="width: {getBatchProgress(batch.id)}%; background-color: #3B6A9C;"
										></div>
									</div>
									<span class="text-xs text-slate-500 whitespace-nowrap">
										{getBatchAcceptedCount(batch.id)}/{getBatchTotalCount(batch.id)}
									</span>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>

	<!-- Section 3: Pending Missing Parts -->
	<div>
		<div class="flex items-center justify-between mb-3">
			<h2 class="text-base font-semibold text-slate-900">待处理缺件</h2>
			<a href="/missing" class="text-sm text-sky-600 hover:text-sky-700 hover:underline">查看全部</a>
		</div>
		{#if pendingMissingParts.length === 0}
			<div class="bg-white rounded-lg shadow-sm p-6 text-center text-slate-400">暂无待处理缺件</div>
		{:else}
			{#each pendingMissingParts as part}
				{@const record = store.records.find(r => r.id === part.recordId)}
				<div class="bg-white rounded-lg shadow-sm border-l-4 border-amber-500 p-4 mb-3 flex justify-between items-center">
					<div class="flex-1">
						<div class="text-sm font-medium text-slate-900">{part.partName}</div>
						<div class="text-xs text-slate-500 mt-0.5">
							{record?.openingCode ?? '-'} · 数量: {part.quantity}
						</div>
					</div>
					<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {missingStatusColor[part.status] ?? 'bg-slate-100 text-slate-600'}">
						{getMissingStatusLabel(part.status)}
					</span>
				</div>
			{/each}
		{/if}
	</div>
</div>
