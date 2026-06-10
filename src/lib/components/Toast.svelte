<script lang="ts">
	import { onDestroy } from 'svelte';
	import { createEventDispatcher } from 'svelte';
	import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-svelte';
	import type { ToastType, ToastItem } from '$lib/types';

	export let toasts: ToastItem[] = [];

	const dispatch = createEventDispatcher<{ update: ToastItem[] }>();

	const icons: Record<ToastType, typeof CheckCircle> = {
		success: CheckCircle,
		error: XCircle,
		warning: AlertTriangle,
		info: Info
	};

	function removeToast(id: string) {
		toasts = toasts.filter((t) => t.id !== id);
		dispatch('update', toasts);
	}

	function autoRemove(node: HTMLElement, toast: ToastItem) {
		if (toast.duration !== 0) {
			const timeout = setTimeout(() => {
				removeToast(toast.id);
			}, toast.duration || 3000);
			return {
				destroy() {
					clearTimeout(timeout);
				}
			};
		}
		return { destroy() {} };
	}
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
	{#each toasts as toast (toast.id)}
		<div
			class="toast toast-{toast.type} animate-slide-up"
			role="alert"
			use:autoRemove={toast}
		>
			<svelte:component this={icons[toast.type]} class="w-5 h-5 flex-shrink-0" />
			<p class="flex-1 text-sm">{toast.message}</p>
			<button
				on:click={() => removeToast(toast.id)}
				class="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
				aria-label="关闭"
			>
				<X class="w-4 h-4" />
			</button>
		</div>
	{/each}
</div>
