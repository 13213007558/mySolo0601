<script lang="ts">
	import { derived, writable } from 'svelte/store';
	import { Settings, Download, Upload, Database, Trash2, AlertTriangle, CheckCircle, FileJson, FileText, HardDrive } from 'lucide-svelte';
	import Toast from '$lib/components/Toast.svelte';
import type { ToastItem } from '$lib/types';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { archiveStore } from '$lib/stores/archiveStore';
	import { exportData, importData, formatFileSize, getStorageSize } from '$lib/utils/storage';
	import { getSampleData } from '$lib/utils/sampleData';
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

	const stats = archiveStore.stats;
	const storageSize = derived(archiveStore.photos, () => formatFileSize(getStorageSize()));
	const photoCount = derived(archiveStore.photos, ($p: any) => $p.length);
	const logCount = derived(archiveStore.logs, ($l: any) => $l.length);

	const hasData = derived(
		[photoCount, logCount],
		([$p, $l]: [any, any]) => $p > 0 || $l > 0
	);

	const showImportModal = writable(false);
	const importFile = writable<File | null>(null);
	const importError = writable<string | null>(null);

	const showClearModal = writable(false);
	const clearConfirmText = writable('');

	function handleLoadSampleData() {
		const sample = getSampleData();
		archiveStore.importData(sample.photos, sample.logs);
		showToast('success', '样例数据加载成功！共 6 张照片，3 条施工日志');
	}

	function handleExportData() {
		const json = exportData();
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `施工照片归档_${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		showToast('success', '数据导出成功');
	}

	function handleImportFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			importFile.set(file);
			importError.set(null);
		}
	}

	async function handleImport() {
		if (!$importFile) {
			importError.set('请选择要导入的文件');
			return;
		}

		try {
			const text = await $importFile.text();
			const data = importData(text);
			archiveStore.importData(data.photos, data.logs);
			showToast('success', `数据导入成功！共 ${data.photos.length} 张照片，${data.logs.length} 条日志`);
			showImportModal.set(false);
			importFile.set(null);
			importError.set(null);
		} catch (e) {
			importError.set(e instanceof Error ? e.message : '导入失败');
		}
	}

	function handleClearData() {
		if ($clearConfirmText !== '确定清空') {
			showToast('error', '请输入"确定清空"以确认操作');
			return;
		}

		archiveStore.clearAllData();
		showClearModal.set(false);
		clearConfirmText.set('');
		showToast('success', '所有数据已清空');
	}
</script>

<Toast toasts={$toasts} on:update={(e) => toasts.set(e.detail)} />

<div class="space-y-6">
	<div>
		<h2 class="text-2xl font-bold text-construction-gray-dark flex items-center gap-2">
			<Settings class="w-7 h-7 text-construction-orange" />
			数据管理
		</h2>
		<p class="text-construction-gray mt-1">
			管理您的施工照片数据，支持导入导出和样例数据加载
		</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="card flex items-center gap-4">
			<div class="w-12 h-12 rounded-lg bg-construction-orange bg-opacity-10 flex items-center justify-center">
				<Database class="w-6 h-6 text-construction-orange" />
			</div>
			<div>
				<p class="text-sm text-construction-gray">照片数</p>
				<p class="text-2xl font-bold text-construction-gray-dark">{$photoCount}</p>
			</div>
		</div>
		<div class="card flex items-center gap-4">
			<div class="w-12 h-12 rounded-lg bg-construction-blue bg-opacity-10 flex items-center justify-center">
				<FileText class="w-6 h-6 text-construction-blue" />
			</div>
			<div>
				<p class="text-sm text-construction-gray">日志数</p>
				<p class="text-2xl font-bold text-construction-gray-dark">{$logCount}</p>
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
			<div class="w-12 h-12 rounded-lg bg-construction-blue bg-opacity-10 flex items-center justify-center">
				<HardDrive class="w-6 h-6 text-construction-blue" />
			</div>
			<div>
				<p class="text-sm text-construction-gray">存储大小</p>
				<p class="text-2xl font-bold text-construction-blue">{$storageSize}</p>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<div class="card">
			<div class="flex items-start gap-4">
				<div class="w-12 h-12 rounded-lg bg-construction-orange bg-opacity-10 flex items-center justify-center flex-shrink-0">
					<Database class="w-6 h-6 text-construction-orange" />
				</div>
				<div class="flex-1">
					<h3 class="font-semibold text-construction-gray-dark mb-1">加载样例数据</h3>
					<p class="text-sm text-construction-gray mb-4">
						一键加载包含 6 张样例照片和 3 条施工日志的测试数据，包含中文大写楼层、特殊符号备注等异常测试场景。
					</p>
					<button on:click={handleLoadSampleData} class="btn btn-primary w-full">
						<Database class="w-4 h-4" />
						加载样例数据
					</button>
				</div>
			</div>
		</div>

		<div class="card">
			<div class="flex items-start gap-4">
				<div class="w-12 h-12 rounded-lg bg-construction-blue bg-opacity-10 flex items-center justify-center flex-shrink-0">
					<Download class="w-6 h-6 text-construction-blue" />
				</div>
				<div class="flex-1">
					<h3 class="font-semibold text-construction-gray-dark mb-1">导出数据</h3>
					<p class="text-sm text-construction-gray mb-4">
						将所有照片和日志导出为 JSON 文件，用于备份或迁移到其他浏览器。
					</p>
					<button on:click={handleExportData} class="btn btn-secondary w-full" disabled={!$hasData}>
						<Download class="w-4 h-4" />
						导出 JSON 文件
					</button>
				</div>
			</div>
		</div>

		<div class="card">
			<div class="flex items-start gap-4">
				<div class="w-12 h-12 rounded-lg bg-green-500 bg-opacity-10 flex items-center justify-center flex-shrink-0">
					<Upload class="w-6 h-6 text-green-500" />
				</div>
				<div class="flex-1">
					<h3 class="font-semibold text-construction-gray-dark mb-1">导入数据</h3>
					<p class="text-sm text-construction-gray mb-4">
						从之前导出的 JSON 文件恢复数据，会覆盖当前所有数据。
					</p>
					<button on:click={() => showImportModal.set(true)} class="btn btn-secondary w-full">
						<Upload class="w-4 h-4" />
						选择文件导入
					</button>
				</div>
			</div>
		</div>

		<div class="card border-red-200 bg-red-50">
			<div class="flex items-start gap-4">
				<div class="w-12 h-12 rounded-lg bg-red-500 bg-opacity-10 flex items-center justify-center flex-shrink-0">
					<Trash2 class="w-6 h-6 text-red-500" />
				</div>
				<div class="flex-1">
					<h3 class="font-semibold text-red-700 mb-1">危险操作</h3>
					<p class="text-sm text-red-600 mb-4">
						清空所有照片和日志数据，此操作不可恢复，请谨慎操作。
					</p>
					<button
						on:click={() => showClearModal.set(true)}
						class="btn btn-danger w-full"
						disabled={!$hasData}
					>
						<Trash2 class="w-4 h-4" />
						清空所有数据
					</button>
				</div>
			</div>
		</div>
	</div>

	<div class="card">
		<h3 class="font-semibold text-construction-gray-dark mb-4 flex items-center gap-2">
			<FileJson class="w-5 h-5 text-construction-orange" />
			使用说明
		</h3>
		<div class="space-y-4 text-sm text-construction-gray">
			<div>
				<h4 class="font-medium text-construction-gray-dark mb-1">快速开始</h4>
				<ol class="list-decimal list-inside space-y-1">
					<li>点击「加载样例数据」体验完整功能</li>
					<li>返回归档台主页查看照片列表</li>
					<li>使用日期轴和筛选面板快速定位照片</li>
					<li>批量选择照片并标记完成状态</li>
					<li>在「交接摘要」页生成并导出 Markdown 摘要</li>
				</ol>
			</div>
			<div>
				<h4 class="font-medium text-construction-gray-dark mb-1">异常处理测试</h4>
				<ul class="list-disc list-inside space-y-1">
					<li><strong>中文大写楼层</strong>：上传时填写「十八层」会自动转为「18层」</li>
					<li><strong>特殊符号备注</strong>：备注中包含 HTML 标签或脚本会被自动转义</li>
					<li><strong>重复上传</strong>：相同内容的照片会被检测并提示</li>
					<li><strong>缺日期</strong>：上传时未选日期会提示错误</li>
				</ul>
			</div>
			<div>
				<h4 class="font-medium text-construction-gray-dark mb-1">交接摘要导出</h4>
				<p>访问「交接摘要」页，设置筛选条件后点击「下载 .md 文件」，文件会保存到浏览器下载目录，文件名格式：<code class="bg-gray-100 px-1.5 py-0.5 rounded">交接摘要_YYYYMMDD_HHMMSS.md</code></p>
			</div>
			<div>
				<h4 class="font-medium text-construction-gray-dark mb-1">数据备份</h4>
				<p>所有数据仅存储在浏览器本地，建议定期使用「导出数据」功能备份到本地文件。更换浏览器或清理浏览器数据会导致数据丢失。</p>
			</div>
		</div>
	</div>
</div>

<Modal show={$showImportModal} title="导入数据" on:close={() => showImportModal.set(false)}>
	<div class="space-y-4">
		<p class="text-sm text-construction-gray">
			选择之前导出的 JSON 文件，导入后会覆盖当前所有数据。
		</p>

		{#if $importError}
			<div class="p-3 bg-red-50 border border-red-200 rounded-lg">
				<p class="text-sm text-red-600">{$importError}</p>
			</div>
		{/if}

		<div>
			<label class="label">选择文件</label>
			<input
				type="file"
				accept=".json"
				on:change={handleImportFileSelect}
				class="input"
			/>
		</div>

		{#if $importFile}
			<div class="p-3 bg-gray-50 rounded-lg">
				<p class="text-sm text-construction-gray-dark">
					已选择：<span class="font-medium">{$importFile.name}</span>
					({formatFileSize($importFile.size)})
				</p>
			</div>
		{/if}

		<div class="flex gap-2 pt-2">
			<button on:click={() => showImportModal.set(false)} class="btn btn-secondary flex-1">
				取消
			</button>
			<button on:click={handleImport} class="btn btn-primary flex-1" disabled={!$importFile}>
				<Upload class="w-4 h-4" />
				导入
			</button>
		</div>
	</div>
</Modal>

<Modal show={$showClearModal} title="确认清空数据" on:close={() => showClearModal.set(false)}>
	<div class="space-y-4">
		<div class="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
			<AlertTriangle class="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
			<div>
				<p class="font-medium text-red-800">此操作不可恢复</p>
				<p class="text-sm text-red-700 mt-1">
					清空后所有照片和日志数据将被永久删除，无法恢复。请确保已导出必要的备份。
				</p>
			</div>
		</div>

		<div>
			<label class="label">请输入「确定清空」以确认</label>
			<input
				type="text"
				bind:value={$clearConfirmText}
				class="input"
				placeholder="确定清空"
			/>
		</div>

		<div class="flex gap-2 pt-2">
			<button on:click={() => showClearModal.set(false)} class="btn btn-secondary flex-1">
				取消
			</button>
			<button
				on:click={handleClearData}
				class="btn btn-danger flex-1"
				disabled={$clearConfirmText !== '确定清空'}
			>
				<Trash2 class="w-4 h-4" />
				确认清空
			</button>
		</div>
	</div>
</Modal>
