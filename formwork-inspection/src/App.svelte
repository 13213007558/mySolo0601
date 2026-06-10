<script lang="ts">
  import { store, totalStats, pointsStore, selectedAreaStore } from '@/store'
  import { detectDuplicatePoints, filterPoints } from '@/utils/validators'
  import StatsCards from '@/components/StatsCards.svelte'
  import AreaNav from '@/components/AreaNav.svelte'
  import PointGrid from '@/components/PointGrid.svelte'
  import PointDetailModal from '@/components/PointDetailModal.svelte'
  import BatchActionBar from '@/components/BatchActionBar.svelte'
  import WarningBanner from '@/components/WarningBanner.svelte'
  import FilterBar from '@/components/FilterBar.svelte'
  import { Building2 } from 'lucide-svelte'

  $: points = $pointsStore
  $: selectedArea = $selectedAreaStore
  $: duplicates = detectDuplicatePoints(points)
  $: filtered = filterPoints(points, { area: selectedArea })

  $: hasData = points.length > 0
</script>

<div class="min-h-screen bg-slate-50">
  <!-- Header -->
  <header class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
    <div class="max-w-[1400px] mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-form-600 flex items-center justify-center">
            <Building2 class="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 class="text-lg font-bold text-gray-800">模板支撑验收打点页</h1>
            <p class="text-xs text-gray-500">立杆间距 · 扫地杆 · 扣件扭矩 · 整改照片 · 逐点闭环</p>
          </div>
        </div>
        <div class="text-xs text-gray-400">
          本地存储 · 数据保留在浏览器
        </div>
      </div>
    </div>
  </header>

  <main class="max-w-[1400px] mx-auto px-6 py-6 space-y-5">
    <!-- 统计卡片 -->
    <StatsCards />

    <!-- 筛选栏 -->
    <FilterBar />

    <!-- 批量操作栏 -->
    <BatchActionBar />

    <!-- 警告横幅 -->
    {#if hasData}
      <WarningBanner {points} />
    {/if}

    <!-- 主体 -->
    {#if hasData}
      <div class="flex gap-5">
        <!-- 左侧区域导航 -->
        <aside class="w-64 flex-shrink-0">
          <AreaNav />
        </aside>

        <!-- 右侧点位网格 -->
        <div class="flex-1 min-w-0">
          <PointGrid area={selectedArea} {duplicates} />
        </div>
      </div>
    {:else}
      <div class="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center">
        <Building2 class="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 class="text-lg font-medium text-gray-600 mb-2">暂无检查点位</h2>
        <p class="text-sm text-gray-400 mb-6">点击「加载样例」体验完整功能，或开始添加你的第一个检查点</p>
        <button
          on:click={() => store.loadMock()}
          class="px-6 py-2.5 bg-form-600 text-white rounded-lg font-medium hover:bg-form-700 transition-colors"
        >
          加载样例数据
        </button>
      </div>
    {/if}

    <!-- 使用说明 -->
    {#if hasData}
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="text-sm font-medium text-gray-700 mb-2">使用提示</div>
        <ul class="text-xs text-gray-500 space-y-1.5">
          <li>• 点击左侧区域筛选，点击任意点位卡片查看详情</li>
          <li>• 实测值支持 mm / cm / m / N·m 多种单位输入，自动换算并提示混用</li>
          <li>• 批量复核会自动跳过缺照片、超阈值、空点位和不合格项</li>
          <li>• 所有数据保存在浏览器本地存储，刷新后仍然保留</li>
          <li>• 可导出 CSV 清单用于记录存档</li>
        </ul>
      </div>
    {/if}
  </main>
</div>

<!-- 详情弹层 -->
<PointDetailModal />
