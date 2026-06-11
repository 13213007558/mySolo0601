<script lang="ts">
  import '../app.css';
  import { loadSeedData } from '$lib/seed';
  import { getStore } from '$lib/store.svelte';
  import { page } from '$app/stores';
  import { LayoutDashboard, ClipboardList, AlertTriangle, PackageCheck, Download, UserCircle, Building2 } from '@lucide/svelte';

  let { children } = $props();
  const store = getStore();

  $effect(() => {
    loadSeedData();
  });

  const navItems = [
    { href: '/', label: '仪表盘', icon: LayoutDashboard },
    { href: '/register', label: '进场登记', icon: ClipboardList },
    { href: '/missing', label: '缺件管理', icon: AlertTriangle },
    { href: '/replenish', label: '补货记录', icon: PackageCheck },
    { href: '/export', label: '导出中心', icon: Download },
  ];

  function isActive(href: string, pathname: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }
</script>

<svelte:head>
  <title>门窗验收</title>
</svelte:head>

<div class="flex min-h-screen">
  <aside class="fixed left-0 top-0 w-60 h-screen flex flex-col" style="background: linear-gradient(to bottom, #1E293B, #0F172A);">
    <div class="flex items-center gap-3 px-5 py-5 border-b border-white/10">
      <Building2 size={24} class="text-white" />
      <span class="text-lg font-bold text-white">门窗验收</span>
    </div>

    <nav class="flex flex-col gap-1 px-3 py-4 flex-1">
      {#each navItems as item}
        <a
          href={item.href}
          data-sveltekit-preload-data="hover"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-white transition-colors {isActive(item.href, $page.url.pathname) ? 'bg-[#3B6A9C]' : 'hover:bg-[#334155]'}"
        >
          <item.icon size={18} />
          <span>{item.label}</span>
        </a>
      {/each}
    </nav>

    <div class="px-5 py-4 border-t border-white/10">
      <div class="flex items-center gap-3 text-slate-400">
        <UserCircle size={18} />
        <span class="text-sm truncate">{store.settings.currentResponsible || '未设置负责人'}</span>
      </div>
    </div>
  </aside>

  <main class="ml-60 min-h-screen bg-[#F1F5F9] p-6 flex-1">
    {@render children()}
  </main>
</div>
