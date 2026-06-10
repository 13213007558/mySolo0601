<script lang="ts">
	import { page } from '$app/stores';
	import { Image, FileText, Settings, Database } from 'lucide-svelte';

	const navItems = [
		{ path: '/', label: '归档台', icon: Image },
		{ path: '/summary', label: '交接摘要', icon: FileText },
		{ path: '/settings', label: '数据管理', icon: Settings }
	];
</script>

<div class="min-h-screen bg-gray-50 flex flex-col">
	<header class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
		<div class="container mx-auto px-4">
			<div class="flex items-center justify-between h-16">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-lg bg-construction-orange flex items-center justify-center">
						<Database class="w-6 h-6 text-white" />
					</div>
					<div>
						<h1 class="text-lg font-bold text-construction-gray-dark">施工日志照片归档台</h1>
						<p class="text-xs text-construction-gray">Construction Photo Archive</p>
					</div>
				</div>

				<nav class="hidden md:flex items-center gap-1">
					{#each navItems as item}
						<a
							href={item.path}
							class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
								{$page.url.pathname === item.path
									? 'bg-construction-orange text-white'
									: 'text-construction-gray hover:bg-gray-100'}"
						>
							<item.icon class="w-4 h-4" />
							{item.label}
						</a>
					{/each}
				</nav>
			</div>
		</div>
	</header>

	<nav class="md:hidden bg-white border-b border-gray-200 sticky top-16 z-20">
		<div class="container mx-auto px-4">
			<div class="flex items-center justify-around py-2">
				{#each navItems as item}
					<a
						href={item.path}
						class="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors
							{$page.url.pathname === item.path
								? 'text-construction-orange'
								: 'text-construction-gray'}"
					>
						<item.icon class="w-5 h-5" />
						<span class="text-xs font-medium">{item.label}</span>
					</a>
				{/each}
			</div>
		</div>
	</nav>

	<main class="flex-1 pb-20 md:pb-8">
		<div class="container mx-auto px-4 py-6">
			<slot />
		</div>
	</main>

	<footer class="bg-white border-t border-gray-200 py-4">
		<div class="container mx-auto px-4 text-center text-sm text-construction-gray">
			<p>施工日志照片归档台 · 数据存储在浏览器本地 · 请定期导出备份</p>
		</div>
	</footer>
</div>
