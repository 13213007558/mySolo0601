<script lang="ts">
  import { totalStats } from '@/store'
  import { CheckCircle, XCircle, Clock, Camera, AlertTriangle, Target } from 'lucide-svelte'
</script>

<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
  <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
    <div class="flex items-center gap-2 text-gray-500 text-sm mb-1">
      <Target class="w-4 h-4" />
      <span>总点位</span>
    </div>
    <div class="text-2xl font-bold text-gray-800">{$totalStats.total}</div>
  </div>

  <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
    <div class="flex items-center gap-2 text-emerald-600 text-sm mb-1">
      <CheckCircle class="w-4 h-4" />
      <span>已通过</span>
    </div>
    <div class="text-2xl font-bold text-emerald-600">{$totalStats.passed}</div>
    <div class="text-xs text-gray-500 mt-0.5">合格率 {$totalStats.passRate}%</div>
  </div>

  <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
    <div class="flex items-center gap-2 text-red-500 text-sm mb-1">
      <XCircle class="w-4 h-4" />
      <span>不合格</span>
    </div>
    <div class="text-2xl font-bold text-red-600">{$totalStats.failed}</div>
  </div>

  <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
    <div class="flex items-center gap-2 text-gray-500 text-sm mb-1">
      <Clock class="w-4 h-4" />
      <span>待检</span>
    </div>
    <div class="text-2xl font-bold text-gray-600">{$totalStats.pending}</div>
  </div>

  <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
    <div class="flex items-center gap-2 text-amber-500 text-sm mb-1">
      <Camera class="w-4 h-4" />
      <span>缺照片</span>
    </div>
    <div class="text-2xl font-bold text-amber-600">{$totalStats.noPhoto}</div>
  </div>

  <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
    <div class="flex items-center gap-2 text-orange-500 text-sm mb-1">
      <AlertTriangle class="w-4 h-4" />
      <span>超阈值</span>
    </div>
    <div class="text-2xl font-bold text-orange-600">{$totalStats.outOfThreshold}</div>
  </div>
</div>
