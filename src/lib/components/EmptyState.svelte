<script lang="ts">
	import { ImagePlus, Search, CheckCircle, Upload } from 'lucide-svelte';

	export let type: 'default' | 'no-results' | 'all-done' | 'upload' = 'default';
	export let title: string = '';
	export let description: string = '';

	const configs = {
		default: {
			icon: ImagePlus,
			title: '暂无照片',
			description: '点击上传按钮或拖拽照片到此处开始归档',
			bgColor: 'bg-construction-orange'
		},
		'no-results': {
			icon: Search,
			title: '没有找到匹配的照片',
			description: '尝试调整筛选条件或关键词',
			bgColor: 'bg-construction-gray'
		},
		'all-done': {
			icon: CheckCircle,
			title: '太棒了！',
			description: '所有日志都有照片证据',
			bgColor: 'bg-green-500'
		},
		upload: {
			icon: Upload,
			title: '拖拽照片到此处',
			description: '或点击选择文件',
			bgColor: 'bg-construction-blue'
		}
	};

	const config = configs[type];
</script>

<div class="flex flex-col items-center justify-center py-12 px-6 text-center">
	<div class="w-20 h-20 rounded-full {config.bgColor} bg-opacity-10 flex items-center justify-center mb-4">
		<svelte:component this={config.icon} class="w-10 h-10 text-construction-orange" />
	</div>
	<h3 class="text-xl font-semibold text-construction-gray-dark mb-2">
		{title || config.title}
	</h3>
	<p class="text-construction-gray max-w-md">
		{description || config.description}
	</p>
</div>
