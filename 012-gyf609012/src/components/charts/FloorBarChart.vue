<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { FLOOR_OPTIONS } from '@/types'

const props = defineProps<{
  data: Record<string, number>
  title?: string
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

function initChart() {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

function updateChart() {
  if (!chartInstance) return

  const floors = [...FLOOR_OPTIONS].reverse()
  const values = floors.map((floor) => props.data[floor] || 0)

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: '{b}: {c} 条',
    },
    grid: {
      left: 40,
      right: 20,
      top: 20,
      bottom: 30,
    },
    xAxis: {
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
    yAxis: {
      type: 'category',
      data: floors,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        fontSize: 12,
        color: '#475569',
      },
    },
    series: [
      {
        type: 'bar',
        data: values,
        barWidth: 16,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#60a5fa' },
            { offset: 1, color: '#2563eb' },
          ]),
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#1d4ed8' },
            ]),
          },
        },
        label: {
          show: true,
          position: 'right',
          fontSize: 11,
          color: '#475569',
        },
      },
    ],
    animationDuration: 800,
    animationEasing: 'cubicOut',
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
      {{ title || '楼层分布' }}
    </h3>
    <div ref="chartRef" class="w-full h-56"></div>
  </div>
</template>
