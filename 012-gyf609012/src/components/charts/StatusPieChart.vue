<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { STATUS_LABELS } from '@/types'

const props = defineProps<{
  data: Record<string, number>
  title?: string
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const statusColors: Record<string, string> = {
  draft: '#94a3b8',
  pending: '#f59e0b',
  replied: '#3b82f6',
  returned: '#ef4444',
  completed: '#22c55e',
  cancelled: '#64748b',
}

function initChart() {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

function updateChart() {
  if (!chartInstance) return

  const entries = Object.entries(props.data)
  const chartData = entries.map(([key, value]) => ({
    value,
    name: STATUS_LABELS[key as keyof typeof STATUS_LABELS] || key,
    itemStyle: {
      color: statusColors[key] || '#94a3b8',
    },
  }))

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: {
        fontSize: 12,
        color: '#475569',
      },
      itemWidth: 12,
      itemHeight: 12,
    },
    series: [
      {
        name: '问题状态',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
            formatter: '{b}\n{c}条',
          },
        },
        labelLine: {
          show: false,
        },
        data: chartData,
      },
    ],
    graphic: {
      type: 'text',
      left: '35%',
      top: '45%',
      style: {
        text: entries.reduce((sum, [, v]) => sum + v, 0) + '',
        fontSize: 20,
        fontWeight: 'bold',
        fill: '#1e293b',
        align: 'center',
      },
    },
  }

  chartInstance.setOption(option, true)
}

function handleResize() {
  chartInstance?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})

watch(
  () => props.data,
  () => {
    updateChart()
  },
  { deep: true }
)
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
    <h3 class="text-sm font-semibold text-slate-700 mb-3">
      {{ title || '状态分布' }}
    </h3>
    <div ref="chartRef" class="w-full h-56"></div>
  </div>
</template>
