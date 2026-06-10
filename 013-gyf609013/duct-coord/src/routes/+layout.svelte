<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>风管综合排布协同</title>
	<meta name="description" content="暖通工程师风管排布标高调整与协同让路记录系统" />
</svelte:head>

{@render children()}
