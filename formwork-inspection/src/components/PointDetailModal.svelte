<script lang="ts">
  import { store, selectedPoint, operatorNameStore, showDetailStore } from '@/store'
  import {
    parseMeasuredValue,
    toDisplayValue,
    checkThreshold,
    validatePoint,
    formatDateTime,
    type ParsedMeasure,
    type WarningInfo
  } from '@/utils/validators'
  import { fileToDataURL, compressDataUrl } from '@/utils/storage'
  import { STATUS_LABELS, STATUS_BG, STATUS_COLORS } from '@/types'
  import type { PointStatus, UnitType } from '@/types'
  import {
    X,
    Camera,
    Upload,
    Trash2,
    Clock,
    User,
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    Edit3,
    Save,
    Ruler,
    History,
    Image as ImageIcon
  } from 'lucide-svelte'

  $: point = $selectedPoint
  $: operator = $operatorNameStore

  let measuredInput = ''
  let parsed: ParsedMeasure = { numeric: null, unit: null, display: '' }
  let editingResponsible = false
  let responsibleInput = ''
  let statusNoteInput = ''
  let photoCaption = ''
  let uploadingPhoto = false
  let activeTab: 'info' | 'photos' | 'history' = 'info'

  function setActiveTab(key: string) {
    if (key === 'info' || key === 'photos' || key === 'history') {
      activeTab = key
    }
  }

  $: if (point) {
    measuredInput = point.measuredValue || ''
    parsed = parseMeasuredValue(point.measuredValue, point.requiredUnit)
  }

  $: if (point) {
    warnings = validatePoint(point)
    thresholdCheck = point.measuredNumeric !== undefined && point.measuredNumeric !== null
      ? checkThreshold(point.measuredNumeric, point.threshold)
      : null
  }

  let warnings: WarningInfo[] = []
  let thresholdCheck: ReturnType<typeof checkThreshold> | null = null

  function onMeasuredInput(e: Event) {
    const target = e.target as HTMLInputElement
    measuredInput = target.value
    parsed = parseMeasuredValue(measuredInput, point?.requiredUnit || 'mm')
  }

  function saveMeasured() {
    if (!point) return
    store.setMeasuredValue(point.id, measuredInput, parsed.numeric, parsed.unit, $operatorNameStore)
  }

  function setStatus(status: PointStatus) {
    if (!point) return
    store.setStatus(point.id, status, statusNoteInput, $operatorNameStore)
    statusNoteInput = ''
  }

  function startEditResponsible() {
    if (!point) return
    responsibleInput = point.responsible
    editingResponsible = true
  }

  function saveResponsible() {
    if (!point) return
    store.changeResponsible(point.id, responsibleInput, $operatorNameStore)
    editingResponsible = false
  }

  async function onPhotoUpload(e: Event) {
    if (!point) return
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    uploadingPhoto = true
    try {
      const dataUrl = await fileToDataURL(file)
      const compressed = await compressDataUrl(dataUrl, 1024, 0.75)
      const caption = photoCaption || `现场照片 ${new Date().toLocaleString()}`
      store.addPhoto(point.id, compressed, caption, $operatorNameStore, false)
      photoCaption = ''
    } catch (err) {
      console.error('photo upload error:', err)
    } finally {
      uploadingPhoto = false
      input.value = ''
    }
  }

  function removePhoto(photoId: string) {
    if (!point) return
    if (confirm('确定删除这张照片吗？')) {
      store.removePhoto(point.id, photoId)
    }
  }

  function close() {
    store.closeDetail()
    activeTab = 'info'
    editingResponsible = false
  }
</script>

{#if point && $showDetailStore}
  <div class="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 px-4 overflow-y-auto" on:click|self={close}>
    <div class="fixed inset-0 bg-black/40" on:click={close}></div>

    <div class="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl z-10 max-h-full overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-form-50 flex items-center justify-center">
            <Ruler class="w-5 h-5 text-form-600" />
          </div>
          <div>
            <div class="font-semibold text-gray-800 text-lg">{point.typeLabel}</div>
            <div class="text-sm text-gray-500">
              {point.code} · {point.area} · {point.subArea}
            </div>
          </div>
        </div>
        <button on:click={close} class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <X class="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <!-- Status badge row -->
      <div class="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border {STATUS_BG[point.status]}">
            {STATUS_LABELS[point.status]}
          </span>
          <span class="text-sm text-gray-500">
            责任人：
            {#if editingResponsible}
              <input
                bind:value={responsibleInput}
                class="px-2 py-0.5 border border-form-300 rounded text-sm w-24"
                placeholder="责任人姓名"
              />
              <button on:click={saveResponsible} class="ml-1 text-form-600 hover:text-form-700">
                <Save class="w-4 h-4 inline" />
              </button>
            {:else}
              <span class="text-gray-700">{point.responsible || '未指定'}</span>
              <button on:click={startEditResponsible} class="ml-1 text-gray-400 hover:text-form-600">
                <Edit3 class="w-3.5 h-3.5 inline" />
              </button>
            {/if}
          </span>
        </div>
        <div class="text-xs text-gray-400">
          更新于 {formatDateTime(point.updatedAt)}
        </div>
      </div>

      <!-- Warnings -->
      {#if warnings.length > 0}
        <div class="mx-6 mt-4 space-y-2">
          {#each warnings as w (w.message)}
            <div class="flex items-start gap-2 px-3 py-2 rounded-lg text-sm {w.level === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : w.level === 'warning'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'}">
              {#if w.level === 'error'}
                <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" />
              {:else}
                <AlertTriangle class="w-4 h-4 mt-0.5 flex-shrink-0" />
              {/if}
              <span>{w.message}</span>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Tabs -->
      <div class="px-6 pt-4 border-b border-gray-100 flex gap-1">
        {#each [['info', '点位信息'], ['photos', `照片 (${point.photos.length})`], ['history', '整改历史']] as [key, label]}
          <button
            class="px-4 py-2 text-sm font-medium transition-colors relative {activeTab === key
              ? 'text-form-600'
              : 'text-gray-500 hover:text-gray-700'}"
            on:click={() => setActiveTab(key)}
          >
            {label}
            {#if activeTab === key}
              <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-form-500 rounded-t"></div>
            {/if}
          </button>
        {/each}
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        {#if activeTab === 'info'}
          <div class="space-y-5">
            <!-- 要求值 -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="text-xs text-gray-500 mb-1">要求值</div>
                <div class="text-lg font-semibold text-gray-800">{point.requiredValue}</div>
                <div class="text-xs text-gray-400 mt-1">阈值：{point.threshold.description}</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="text-xs text-gray-500 mb-1">位置说明</div>
                <div class="text-sm text-gray-700">{point.positionNote || '—'}</div>
              </div>
            </div>

            <!-- 实测值输入 -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span>实测值</span>
                <span class="text-xs text-gray-400 font-normal">（支持 mm / cm / m / N·m 等单位，自动换算）</span>
              </label>
              <div class="flex gap-2">
                <input
                  value={measuredInput}
                  on:input={onMeasuredInput}
                  placeholder="例如：1150 或 1.15m 或 45 N·m"
                  class="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-form-400 focus:border-form-400"
                />
                <button
                  on:click={saveMeasured}
                  class="px-4 py-2.5 bg-form-600 text-white text-sm rounded-lg hover:bg-form-700 transition-colors"
                >
                  保存
                </button>
              </div>

              {#if measuredInput && parsed.warning}
                <div class="text-xs {parsed.warning === 'invalid' ? 'text-red-600' : parsed.warning === 'mixed' ? 'text-amber-600' : 'text-gray-500'}">
                  {#if parsed.warning === 'invalid'}
                    <AlertCircle class="w-3.5 h-3.5 inline mr-1" />
                    无法识别的数值格式
                  {:else if parsed.warning === 'mixed'}
                    <AlertTriangle class="w-3.5 h-3.5 inline mr-1" />
                    检测到单位混用（{parsed.unit}），已自动换算为 {parsed.numeric} mm
                  {:else if parsed.warning === 'unit_mismatch'}
                    <AlertTriangle class="w-3.5 h-3.5 inline mr-1" />
                    单位与要求不匹配
                  {/if}
                </div>
              {/if}

              {#if parsed.numeric !== null && thresholdCheck}
                <div class="text-xs {thresholdCheck.isOk ? 'text-emerald-600' : 'text-red-600'}">
                  {#if thresholdCheck.isOk}
                    <CheckCircle class="w-3.5 h-3.5 inline mr-1" />
                    实测值在允许范围内
                  {:else}
                    <AlertCircle class="w-3.5 h-3.5 inline mr-1" />
                    {thresholdCheck.reason}
                  {/if}
                </div>
              {/if}
            </div>

            <!-- 备注 -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">备注</label>
              <textarea
                value={point.note || ''}
                disabled
                class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-50 resize-none"
                rows="2"
              />
            </div>

            <!-- 状态操作 -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-gray-700">状态操作</label>
              <div class="flex flex-wrap gap-2">
                <button
                  on:click={() => setStatus('passed')}
                  class="px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircle class="w-4 h-4 inline mr-1" />
                  标记通过
                </button>
                <button
                  on:click={() => setStatus('failed')}
                  class="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  <AlertCircle class="w-4 h-4 inline mr-1" />
                  标记不合格
                </button>
                <button
                  on:click={() => setStatus('rectified')}
                  class="px-3 py-2 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  <CheckCircle class="w-4 h-4 inline mr-1" />
                  整改通过
                </button>
                <button
                  on:click={() => setStatus('pending')}
                  class="px-3 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Clock class="w-4 h-4 inline mr-1" />
                  重置待检
                </button>
              </div>
              <input
                bind:value={statusNoteInput}
                placeholder="状态变更备注（可选）"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-form-400"
              />
            </div>

            <!-- 基本信息 -->
            <div class="text-xs text-gray-400 space-y-1 pt-2 border-t border-gray-100">
              <div>创建时间：{formatDateTime(point.createdAt)}</div>
              <div>实测人：{point.measuredBy || '—'}</div>
              <div>实测时间：{point.measuredAt ? formatDateTime(point.measuredAt) : '—'}</div>
            </div>
          </div>

        {:else if activeTab === 'photos'}
          <div class="space-y-4">
            <!-- 上传 -->
            <div class="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
              <input
                type="file"
                accept="image/*"
                on:change={onPhotoUpload}
                class="hidden"
                id="photo-upload"
                disabled={uploadingPhoto}
              />
              <label for="photo-upload" class="cursor-pointer">
                <Upload class="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <div class="text-sm text-gray-600">
                  {uploadingPhoto ? '上传中...' : '点击上传验收照片'}
                </div>
                <div class="text-xs text-gray-400 mt-1">照片自动压缩，存本地浏览器</div>
              </label>
              <input
                bind:value={photoCaption}
                placeholder="照片说明（可选）"
                class="mt-3 w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm text-left"
              />
            </div>

            <!-- 照片列表 -->
            {#if point.photos.length > 0}
              <div class="grid grid-cols-3 gap-3">
                {#each point.photos as photo (photo.id)}
                  <div class="relative group">
                    <img
                      src={photo.dataUrl}
                      alt={photo.caption}
                      class="w-full aspect-square object-cover rounded-lg border border-gray-200"
                    />
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <button
                        on:click={() => window.open(photo.dataUrl, '_blank')}
                        class="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                      >
                        <ImageIcon class="w-4 h-4" />
                      </button>
                      <button
                        on:click={() => removePhoto(photo.id)}
                        class="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                    <div class="mt-1 text-xs text-gray-500 truncate">{photo.caption}</div>
                    <div class="text-[10px] text-gray-400">
                      {photo.uploadedBy} · {formatDateTime(photo.uploadedAt)}
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text-center py-8 text-gray-400">
                <Camera class="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <div class="text-sm">暂无照片</div>
              </div>
            {/if}
          </div>

        {:else if activeTab === 'history'}
          <div class="space-y-3">
            {#if point.rectificationHistory.length > 0}
              {#each point.rectificationHistory as record (record.id)}
                <div class="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-l-0 last:pb-0">
                  <div class="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-form-500 border-2 border-white"></div>
                  <div class="bg-gray-50 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-1">
                      <div class="text-sm font-medium text-gray-700">{record.note}</div>
                    </div>
                    <div class="flex items-center gap-3 text-xs text-gray-500">
                      <span class="flex items-center gap-1">
                        <User class="w-3 h-3" />
                        {record.operator}
                      </span>
                      <span class="flex items-center gap-1">
                        <Clock class="w-3 h-3" />
                        {formatDateTime(record.timestamp)}
                      </span>
                      <span class="px-2 py-0.5 rounded text-xs border {STATUS_BG[record.newStatus]}">
                        {STATUS_LABELS[record.oldStatus]} → {STATUS_LABELS[record.newStatus]}
                      </span>
                    </div>
                    {#if record.oldValue || record.newValue}
                      <div class="mt-2 text-xs text-gray-500 font-mono">
                        {record.oldValue || '(空)'} → {record.newValue || '(空)'}
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            {:else}
              <div class="text-center py-8 text-gray-400">
                <History class="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <div class="text-sm">暂无整改记录</div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
