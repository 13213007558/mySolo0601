<script lang="ts">
  import { getStore } from '$lib/store.svelte';
  import { formatDateTime, normalizeOpeningCode, getRecordStatusLabel, getBatchStatusLabel } from '$lib/utils';
  import { Plus, Trash2, PackagePlus } from '@lucide/svelte';
  import type { RecordStatus, BatchStatus } from '$lib/types';

  const store = getStore();

  let formData = $state({
    batchId: '',
    openingCode: '',
    buildingNo: '',
    unitNo: '',
    floorNo: '',
    roomNo: '',
    spec: '',
    glassType: '',
    hardwareList: '',
    status: 'pending' as RecordStatus
  });

  let batchFormData = $state({
    batchNo: '',
    supplier: '',
    deliveryDate: '',
    status: 'in_transit' as BatchStatus
  });

  let duplicateWarning = $state(false);
  let deleteConfirmId = $state('');
  let deleteBatchConfirmId = $state('');

  let normalizedPreview = $derived(normalizeOpeningCode(formData.openingCode));

  const sortedRecords = $derived([...store.records].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

  function handleSubmit() {
    if (!formData.batchId || !formData.openingCode) return;

    const normalized = normalizeOpeningCode(formData.openingCode);
    const isDuplicate = store.records.some(r => r.batchId === formData.batchId && r.openingCodeNormalized === normalized);

    if (isDuplicate) {
      duplicateWarning = true;
      setTimeout(() => { duplicateWarning = false; }, 4000);
    }

    store.addRecord({
      batchId: formData.batchId,
      openingCode: formData.openingCode,
      buildingNo: formData.buildingNo,
      unitNo: formData.unitNo,
      floorNo: formData.floorNo,
      roomNo: formData.roomNo,
      spec: formData.spec,
      glassType: formData.glassType,
      hardwareList: formData.hardwareList,
      status: formData.status
    });

    formData = {
      batchId: '',
      openingCode: '',
      buildingNo: '',
      unitNo: '',
      floorNo: '',
      roomNo: '',
      spec: '',
      glassType: '',
      hardwareList: '',
      status: 'pending' as RecordStatus
    };
  }

  function handleBatchSubmit() {
    if (!batchFormData.batchNo || !batchFormData.supplier) return;

    store.addBatch({
      batchNo: batchFormData.batchNo,
      supplier: batchFormData.supplier,
      deliveryDate: batchFormData.deliveryDate,
      status: batchFormData.status
    });

    batchFormData = {
      batchNo: '',
      supplier: '',
      deliveryDate: '',
      status: 'in_transit' as BatchStatus
    };
  }

  function confirmDeleteRecord(id: string) {
    store.deleteRecord(id);
    deleteConfirmId = '';
  }

  function confirmDeleteBatch(id: string) {
    store.deleteBatch(id);
    deleteBatchConfirmId = '';
  }

  function getStatusColor(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-amber-light text-amber-warn',
      accepted: 'bg-green-light text-green-ok',
      rejected: 'bg-red-light text-red-danger'
    };
    return map[status] || 'bg-slate-100 text-slate-muted';
  }

  function getBatchStatusColor(status: string): string {
    const map: Record<string, string> = {
      in_transit: 'bg-amber-light text-amber-warn',
      delivered: 'bg-blue-50 text-blue-600',
      accepted: 'bg-green-light text-green-ok',
      partial_accepted: 'bg-amber-light text-amber-warn'
    };
    return map[status] || 'bg-slate-100 text-slate-muted';
  }

  function getRecordCount(batchId: string): number {
    return store.records.filter(r => r.batchId === batchId).length;
  }

  function hasPendingRecords(batchId: string): boolean {
    return store.records.some(r => r.batchId === batchId && r.status === 'pending');
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-slate-text">进场登记</h1>
    <p class="text-slate-muted mt-1">录入门窗进场记录，管理到货批次</p>
  </div>

  <div class="grid grid-cols-3 gap-6">
    <div class="col-span-2 space-y-6">
      {#if duplicateWarning}
        <div class="bg-red-light border border-red-danger/30 text-red-danger rounded-lg px-4 py-3 text-sm">
          ⚠ 检测到重复到货：该批次已存在相同洞口编号的记录
        </div>
      {/if}

      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-semibold text-slate-text mb-4 flex items-center gap-2">
          <Plus size={20} class="text-steel" />
          新增门窗记录
        </h2>

        <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-text mb-1">批次</label>
              <select bind:value={formData.batchId} class="w-full border border-slate-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-steel/30">
                <option value="">请选择批次</option>
                {#each store.batches as batch}
                  <option value={batch.id}>{batch.batchNo} - {batch.supplier}</option>
                {/each}
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-text mb-1">洞口编码</label>
              <input type="text" bind:value={formData.openingCode} placeholder="如 1-1-3-0501-W1" class="w-full border border-slate-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-steel/30" />
              {#if formData.openingCode}
                <p class="text-xs text-slate-muted mt-1">标准化: {normalizedPreview}</p>
              {/if}
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-text mb-1">楼栋号</label>
              <input type="text" bind:value={formData.buildingNo} placeholder="楼栋号" class="w-full border border-slate-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-steel/30" />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-text mb-1">单元号</label>
              <input type="text" bind:value={formData.unitNo} placeholder="单元号" class="w-full border border-slate-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-steel/30" />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-text mb-1">楼层</label>
              <input type="text" bind:value={formData.floorNo} placeholder="楼层" class="w-full border border-slate-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-steel/30" />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-text mb-1">房间号</label>
              <input type="text" bind:value={formData.roomNo} placeholder="房间号" class="w-full border border-slate-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-steel/30" />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-text mb-1">规格</label>
              <input type="text" bind:value={formData.spec} placeholder="如 1500x1800铝合金推拉窗" class="w-full border border-slate-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-steel/30" />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-text mb-1">玻璃类型</label>
              <input type="text" bind:value={formData.glassType} placeholder="如 5+12A+5中空钢化" class="w-full border border-slate-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-steel/30" />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-text mb-1">五金清单</label>
              <input type="text" bind:value={formData.hardwareList} placeholder="如 风撑,拉手,滑轮" class="w-full border border-slate-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-steel/30" />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-text mb-1">状态</label>
              <select bind:value={formData.status} class="w-full border border-slate-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-steel/30">
                <option value="pending">待验收</option>
                <option value="accepted">已验收</option>
                <option value="rejected">已退回</option>
              </select>
            </div>
          </div>

          <div class="mt-4">
            <button type="submit" class="bg-steel text-white px-6 py-2.5 rounded-lg hover:bg-steel-light transition-colors">
              添加记录
            </button>
          </div>
        </form>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-semibold text-slate-text mb-4">门窗记录列表</h2>

        {#if sortedRecords.length === 0}
          <p class="text-slate-muted text-sm text-center py-8">暂无记录</p>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-border text-slate-muted text-left">
                  <th class="pb-3 pr-4 font-medium">洞口编码</th>
                  <th class="pb-3 pr-4 font-medium">楼栋/单元/楼层/房间</th>
                  <th class="pb-3 pr-4 font-medium">规格</th>
                  <th class="pb-3 pr-4 font-medium">玻璃</th>
                  <th class="pb-3 pr-4 font-medium">批次</th>
                  <th class="pb-3 pr-4 font-medium">状态</th>
                  <th class="pb-3 pr-4 font-medium">重复</th>
                  <th class="pb-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {#each sortedRecords as record}
                  <tr class="border-b border-slate-border/50 hover:bg-slate-50">
                    <td class="py-3 pr-4 font-mono text-xs">{record.openingCode}</td>
                    <td class="py-3 pr-4">{record.buildingNo}/{record.unitNo}/{record.floorNo}/{record.roomNo}</td>
                    <td class="py-3 pr-4 max-w-[120px] truncate">{record.spec}</td>
                    <td class="py-3 pr-4 max-w-[100px] truncate">{record.glassType}</td>
                    <td class="py-3 pr-4 text-xs">
                      {store.batches.find(b => b.id === record.batchId)?.batchNo ?? '-'}
                    </td>
                    <td class="py-3 pr-4">
                      <span class="inline-block px-2 py-0.5 rounded text-xs font-medium {getStatusColor(record.status)}">
                        {getRecordStatusLabel(record.status)}
                      </span>
                    </td>
                    <td class="py-3 pr-4">
                      {#if record.isDuplicate}
                        <span class="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-light text-red-danger">重复</span>
                      {/if}
                    </td>
                    <td class="py-3">
                      {#if deleteConfirmId === record.id}
                        <span class="flex items-center gap-2">
                          <button onclick={() => confirmDeleteRecord(record.id)} class="text-red-danger text-xs hover:underline">确认</button>
                          <button onclick={() => { deleteConfirmId = ''; }} class="text-slate-muted text-xs hover:underline">取消</button>
                        </span>
                      {:else}
                        <button onclick={() => { deleteConfirmId = record.id; }} class="text-slate-muted hover:text-red-danger transition-colors">
                          <Trash2 size={16} />
                        </button>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    </div>

    <div class="col-span-1 space-y-6">
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-semibold text-slate-text mb-4 flex items-center gap-2">
          <PackagePlus size={20} class="text-steel" />
          新建批次
        </h2>

        <form onsubmit={(e) => { e.preventDefault(); handleBatchSubmit(); }} class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-slate-text mb-1">批次号</label>
            <input type="text" bind:value={batchFormData.batchNo} placeholder="如 PC-2025-001" class="w-full border border-slate-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-steel/30" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-text mb-1">供应商</label>
            <input type="text" bind:value={batchFormData.supplier} placeholder="供应商名称" class="w-full border border-slate-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-steel/30" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-text mb-1">到货日期</label>
            <input type="date" bind:value={batchFormData.deliveryDate} class="w-full border border-slate-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-steel/30" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-text mb-1">状态</label>
            <select bind:value={batchFormData.status} class="w-full border border-slate-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-steel/30">
              <option value="in_transit">在途</option>
              <option value="delivered">已到货</option>
              <option value="accepted">已验收</option>
              <option value="partial_accepted">部分验收</option>
            </select>
          </div>

          <button type="submit" class="bg-steel text-white px-4 py-2 rounded-lg hover:bg-steel-light transition-colors w-full">
            创建批次
          </button>
        </form>
      </div>

      <div class="space-y-3">
        <h2 class="text-lg font-semibold text-slate-text">批次列表</h2>

        {#each store.batches as batch}
          <div class="bg-white rounded-lg shadow-sm p-4">
            <div class="flex items-start justify-between">
              <div>
                <p class="font-semibold text-slate-text">{batch.batchNo}</p>
                <p class="text-sm text-slate-muted">{batch.supplier}</p>
                <p class="text-xs text-slate-muted mt-1">{formatDateTime(batch.deliveryDate || batch.createdAt)}</p>
              </div>
              <span class="inline-block px-2 py-0.5 rounded text-xs font-medium {getBatchStatusColor(batch.status)}">
                {getBatchStatusLabel(batch.status)}
              </span>
            </div>

            <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-border/50">
              <span class="text-xs text-slate-muted">记录数: {getRecordCount(batch.id)}</span>

              <div class="flex items-center gap-2">
                {#if hasPendingRecords(batch.id)}
                  <button onclick={() => store.acceptBatch(batch.id)} class="bg-green-ok text-white px-3 py-1.5 rounded text-sm hover:opacity-90 transition-opacity">
                    一键验收
                  </button>
                {/if}

                {#if deleteBatchConfirmId === batch.id}
                  <span class="flex items-center gap-1">
                    <button onclick={() => confirmDeleteBatch(batch.id)} class="text-red-danger text-xs hover:underline">确认</button>
                    <button onclick={() => { deleteBatchConfirmId = ''; }} class="text-slate-muted text-xs hover:underline">取消</button>
                  </span>
                {:else}
                  <button onclick={() => { deleteBatchConfirmId = batch.id; }} class="text-slate-muted hover:text-red-danger transition-colors">
                    <Trash2 size={16} />
                  </button>
                {/if}
              </div>
            </div>
          </div>
        {/each}

        {#if store.batches.length === 0}
          <p class="text-slate-muted text-sm text-center py-6">暂无批次</p>
        {/if}
      </div>
    </div>
  </div>
</div>
