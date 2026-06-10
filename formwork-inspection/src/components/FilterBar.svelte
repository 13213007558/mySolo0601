<script lang="ts">
  import { store, operatorNameStore, globalFilterStore } from '@/store'
  import { Search, User } from 'lucide-svelte'

  let editingOperator = false
  let operatorInput = ''

  function startEditOperator() {
    operatorInput = $operatorNameStore
    editingOperator = true
  }

  function saveOperator() {
    if (operatorInput.trim()) {
      $operatorNameStore = operatorInput.trim()
    }
    editingOperator = false
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      saveOperator()
    }
  }
</script>

<div class="flex items-center justify-between flex-wrap gap-3">
  <div class="flex items-center gap-3 flex-1">
    <div class="relative flex-1 max-w-md">
      <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        bind:value={$globalFilterStore.keyword}
        placeholder="搜索点位编号、区域、位置、责任人..."
        class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-form-400 focus:border-form-400"
      />
    </div>
  </div>

  <div class="flex items-center gap-3">
    <div class="flex items-center gap-2 text-sm">
      <User class="w-4 h-4 text-gray-400" />
      <span class="text-gray-500">当前操作员：</span>
      {#if editingOperator}
        <input
          bind:value={operatorInput}
          on:keydown={handleKeydown}
          class="px-2 py-1 border border-form-300 rounded text-sm w-24"
          autofocus
        />
        <button on:click={saveOperator} class="text-form-600 text-xs">确定</button>
      {:else}
        <span class="font-medium text-gray-700 cursor-pointer hover:text-form-600" on:click={startEditOperator}>
          {$operatorNameStore}
        </span>
      {/if}
    </div>

    <button
      on:click={() => {
        if (confirm('确定加载样例数据吗？现有数据将被替换。')) {
          store.loadMock()
        }
      }}
      class="px-3 py-2 text-sm border border-form-300 text-form-600 rounded-lg hover:bg-form-50 transition-colors"
    >
      加载样例
    </button>
    <button
      on:click={() => {
        if (confirm('确定清空所有数据吗？')) {
          store.clearAll()
        }
      }}
      class="px-3 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
    >
      清空数据
    </button>
  </div>
</div>
