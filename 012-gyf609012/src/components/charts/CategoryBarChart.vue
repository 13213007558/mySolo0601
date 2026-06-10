<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { CATEGORY_LABELS } from '@/types'

const props = defineProps<{
  data: Record<string, number>
  title?: string
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const categoryColors: Record<string, string> = {
  beam: '#dc2626',
  duct: '#2563eb',
  light_slot: '#f59e0b',
  pipe: '#7c3aed',
  other: '#64748b',
}

function initChart() {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

function updateChart() {
  if (!chartInstance) return

  const entries = Object.entries(props.data).sort((a, b) => b[1] - a[1])
  const categories = entries.map(([key]) => CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS] || key)
  const values = entries.map(([key, value]) => ({
    value,
    itemStyle: {
      color: categoryColors[key] || '#64748b',
    },
  }))

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: '{b}: {c} 条',
    },
    grid: {
      left: 60,
      right: 20,
      top: 20,
      bottom: 30,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: {
        lineStyle: {
          color: '#e2e8f0',
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        fontSize: 11,
        color: '#475569',
        interval: 0,
        rotate: 0,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        fontSize: 11,
        color: '#64748b',
      },
      splitLine: {
        lineStyle: {
          color: '#e2e8f0',
          type: 'dashed',
        },
      },
    },
    series: [
      {
        type: 'bar',
        data: values,
        barWidth: 24,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
          },
        },
        label: {
          show: true,
          position: 'top',
          fontSize: 12,
          fontWeight: 'bold',
          color: '#334155',
        },
      },
    ],
    animationDuration: 800,
    animationEasing: 'elasticOut',
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
      {{ title || '碰撞类型分布' }}
    </h3>
    <div ref="chartRef" class="w-full h-56"></div>
  </div>
</template>
