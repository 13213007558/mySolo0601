<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { X } from 'lucide-svelte';

	export let show = false;
	export let title = '';
	export let closeOnOverlay = true;
	export let closeOnEsc = true;

	function handleOverlayClick(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (closeOnOverlay && target.classList.contains('modal-overlay')) {
			show = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (closeOnEsc && e.key === 'Escape') {
			show = false;
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeyDown);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeyDown);
	});
</script>

{#if show}
	<div
		class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
		on:click={handleOverlayClick}
	>
		<div class="modal-content bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-fade-in">
			{#if title}
				<div class="flex items-center justify-between p-4 border-b border-gray-200">
					<h3 class="text-lg font-semibold text-construction-gray-dark">{title}</h3>
					<button
						on:click={() => (show = false)}
						class="p-1 hover:bg-gray-100 rounded transition-colors"
						aria-label="关闭"
					>
						<X class="w-5 h-5 text-construction-gray" />
					</button>
				</div>
			{/if}
			<div class="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
				<slot />
			</div>
		</div>
	</div>
{/if}
