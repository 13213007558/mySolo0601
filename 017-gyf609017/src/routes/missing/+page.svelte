<script lang="ts">
  import { getStore } from '$lib/store.svelte';
  import { formatDateTime, getMissingStatusLabel } from '$lib/utils';
  import { AlertTriangle, Upload, PackagePlus, X, Trash2 } from '@lucide/svelte';
  import type { MissingStatus } from '$lib/types';

  const store = getStore();

  let formData = $state({
    recordId: '',
    partName: '',
    quantity: 1,
    photoUrl: ''
  });

  let activeFilter = $state<'all' | MissingStatus>('all');
  let expandedRowId = $state('');
  let replenishQty = $state(1);
  let replenishNote = $state('');
  let deleteConfirmId = $state('');

  const filteredParts = $derived(
    activeFilter === 'all'
      ? store.missingParts
      : store.missingParts.filter(m => m.status === activeFilter)
  );

  function handleSubmit() {
    if (!formData.recordId || !formData.partName) return;
    store.addMissingPart({
      recordId: formData.recordId,
      partName: formData.partName,
      quantity: formData.quantity,
      photoUrl: formData.photoUrl,
      status: 'missing'
    });
    formData = { recordId: '', partName: '', quantity: 1, photoUrl: '' };
  }

  function handlePhotoChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      formData.photoUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  function openReplenish(id: string) {
    if (expandedRowId === id) {
      expandedRowId = '';
    } else {
      expandedRowId = id;
      replenishQty = 1;
      replenishNote = '';
    }
  }

  function handleReplenish() {
    if (!expandedRowId || replenishQty < 1) return;
    store.replenish(expandedRowId, replenishQty, replenishNote);
    expandedRowId = '';
    replenishQty = 1;
    replenishNote = '';
  }

  function confirmDelete(id: string) {
    store.deleteMissingPart(id);
    deleteConfirmId = '';
  }

  function getStatusBadge(status: MissingStatus): string {
    const map: Record<MissingStatus, string> = {
      missing: 'bg-red-light text-red-danger',
      partial: 'bg-amber-light text-amber-warn',
      resolved: 'bg-green-light text-green-ok'
    };
    return map[status];
  }

  function getRecordLabel(recordId: string): string {
    const r = store.records.find(rec => rec.id === recordId);
    if (!r) return '-';
    return `${r.openingCode} - ${r.buildingNo}栋${r.unitNo}单元${r.floorNo}层${r.roomNo}室`;
  }

  const filters: { key: 'all' | MissingStatus; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'missing', label: '缺件' },
    { key: 'partial', label: '部分补货' },
    { key: 'resolved', label: '已补齐' }
  ];
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold text-slate-text">缺件管理</h1>
    <p class="text-slate-muted mt-1">登记五金缺件，跟踪补货状态</p>
  </div>

  <div class="bg-white rounded-xl shadow-sm p-6">
    <h2 class="text-lg font-semibold text-slate-text mb-4 flex items-center gap-2">
      <AlertTriangle size={20} class="text-red-danger" />
      登记缺件
    </h2>

    <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-muted mb-1">门窗记录</label>
          <select
            bind:value={formData.recordId}
            class="w-full border border-slate-border rounded-lg px-3 py-2 text-sm text-slate-text focus:outline-none focus:ring-2 focus:ring-steel/30"
          >
            <option value="">请选择门窗记录</option>
            {#each store.records as record}
              <option value={record.id}>{getRecordLabel(record.id)}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-muted mb-1">缺件名称</label>
          <input
            type="text"
            bind:value={formData.partName}
            placeholder="如 风撑、合页、锁具"
            class="w-full border border-slate-border rounded-lg px-3 py-2 text-sm text-slate-text focus:outline-none focus:ring-2 focus:ring-steel/30"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-muted mb-1">缺件数量</label>
          <input
            type="number"
            bind:value={formData.quantity}
            min="1"
            placeholder="缺件数量"
            class="w-full border border-slate-border rounded-lg px-3 py-2 text-sm text-slate-text focus:outline-none focus:ring-2 focus:ring-steel/30"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-muted mb-1">拍照记录</label>
          <div class="flex items-center gap-3">
            <label class="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-border rounded-lg text-sm text-slate-muted cursor-pointer hover:bg-slate-50 transition-colors">
              <Upload size={14} />
              选择图片
              <input type="file" accept="image/*" onchange={handlePhotoChange} class="hidden" />
            </label>
            {#if formData.photoUrl}
              <img src={formData.photoUrl} alt="预览" class="w-10 h-10 rounded object-cover border border-slate-border" />
            {/if}
          </div>
        </div>

        <div class="flex items-end">
          <button
            type="submit"
            class="bg-red-danger text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            登记缺件
          </button>
        </div>
      </div>
    </form>
  </div>

  <div class="flex items-center gap-2">
    {#each filters as f}
      <button
        onclick={() => { activeFilter = f.key; }}
        class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors {activeFilter === f.key ? 'bg-steel text-white' : 'bg-white text-slate-muted border border-slate-border hover:bg-slate-50'}"
      >
        {f.label}
      </button>
    {/each}
  </div>

  <div class="bg-white rounded-xl shadow-sm overflow-hidden">
    {#if filteredParts.length === 0}
      <div class="p-8 text-center text-slate-muted">暂无缺件记录</div>
    {:else}
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-border bg-slate-50">
            <th class="text-left px-4 py-3 font-medium text-slate-muted">洞口编码</th>
            <th class="text-left px-4 py-3 font-medium text-slate-muted">缺件名称</th>
            <th class="text-left px-4 py-3 font-medium text-slate-muted">缺件数量</th>
            <th class="text-left px-4 py-3 font-medium text-slate-muted">状态</th>
            <th class="text-left px-4 py-3 font-medium text-slate-muted">登记时间</th>
            <th class="text-left px-4 py-3 font-medium text-slate-muted">操作</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredParts as part (part.id)}
            {@const record = store.records.find(r => r.id === part.recordId)}
            <tr class="border-b border-slate-border hover:bg-slate-50/50">
              <td class="px-4 py-3 text-slate-text">{record?.openingCode ?? '-'}</td>
              <td class="px-4 py-3 text-slate-text">{part.partName}</td>
              <td class="px-4 py-3 text-slate-text">{part.quantity}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {getStatusBadge(part.status)}">
                  {getMissingStatusLabel(part.status)}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-muted">{formatDateTime(part.createdAt)}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  {#if part.status !== 'resolved'}
                    <button
                      onclick={() => openReplenish(part.id)}
                      class="text-steel hover:text-steel-light text-xs font-medium"
                    >
                      补货
                    </button>
                  {/if}
                  {#if deleteConfirmId === part.id}
                    <span class="flex items-center gap-1">
                      <button onclick={() => confirmDelete(part.id)} class="text-red-danger text-xs font-medium">确认</button>
                      <button onclick={() => { deleteConfirmId = ''; }} class="text-slate-muted text-xs">取消</button>
                    </span>
                  {:else}
                    <button
                      onclick={() => { deleteConfirmId = part.id; }}
                      class="text-slate-muted hover:text-red-danger transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  {/if}
                </div>
              </td>
            </tr>
            {#if expandedRowId === part.id}
              <tr>
                <td colspan="6" class="px-4 py-3 bg-slate-50">
                  <div class="flex items-center gap-3">
                    <input
                      type="number"
                      bind:value={replenishQty}
                      min="1"
                      placeholder="补货数量"
                      class="w-28 border border-slate-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-steel/30"
                    />
                    <input
                      type="text"
                      bind:value={replenishNote}
                      placeholder="备注"
                      class="w-48 border border-slate-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-steel/30"
                    />
                    <button
                      onclick={handleReplenish}
                      class="bg-steel text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-steel-light transition-colors flex items-center gap-1"
                    >
                      <PackagePlus size={14} />
                      确认补货
                    </button>
                    <button
                      onclick={() => { expandedRowId = ''; }}
                      class="text-slate-muted hover:text-slate-text text-sm transition-colors flex items-center gap-1"
                    >
                      <X size={14} />
                      取消
                    </button>
                  </div>
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
