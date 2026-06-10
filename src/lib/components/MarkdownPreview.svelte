<script lang="ts">
	import { onMount } from 'svelte';
	import { marked } from 'marked';

	export let markdown = '';

	let renderedHtml = '';

	onMount(() => {
		marked.setOptions({
			breaks: true,
			gfm: true
		});
	});

	$: {
		if (markdown) {
			renderedHtml = marked.parse(markdown) as string;
		} else {
			renderedHtml = '';
		}
	}
</script>

<div class="markdown-preview">
	{#if renderedHtml}
		<div class="prose prose-sm max-w-none">{@html renderedHtml}</div>
	{:else}
		<div class="text-center py-12 text-construction-gray">
			暂无内容
		</div>
	{/if}
</div>
