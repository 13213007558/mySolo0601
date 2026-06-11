<template>
  <div class="weighing-trend-chart">
    <div class="chart-header">
      <span class="chart-title">
        <i class="el-icon-data-line"></i>
        {{ title }}
      </span>
      <span class="chart-range">近7日趋势</span>
    </div>
    <div class="chart-body">
      <canvas ref="chartCanvas" :height="height"></canvas>
    </div>
    <div class="chart-legend" v-if="showLegend">
      <div class="legend-item">
        <span class="legend-color" style="background: $color-primary;"></span>
        <span class="legend-text">称重中值 (g)</span>
      </div>
      <div class="legend-item" v-if="thresholdLine">
        <span class="legend-color threshold"></span>
        <span class="legend-text">阈值 {{ threshold }}g</span>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js'
import { getLast7Days } from '~/utils/dayjs'

export default {
  name: 'WeighingTrendChart',
  props: {
    title: {
      type: String,
      default: '称重趋势'
    },
    data: {
      type: Array,
      default: function() { return [] }
    },
    labels: {
      type: Array,
      default: null
    },
    height: {
      type: Number,
      default: 120
    },
    threshold: {
      type: Number,
      default: 0.3
    },
    thresholdLine: {
      type: Boolean,
      default: true
    },
    showLegend: {
      type: Boolean,
      default: true
    }
  },
  data: function() {
    return {
      chart: null
    }
  },
  computed: {
    chartLabels: function() {
      return this.labels || getLast7Days()
    },
    chartData: function() {
      return this.data.length > 0 ? this.data : this.generateMockData()
    }
  },
  watch: {
    data: {
      handler: function() {
        this.updateChart()
      },
      deep: true
    }
  },
  mounted: function() {
    this.initChart()
  },
  beforeDestroy: function() {
    if (this.chart) {
      this.chart.destroy()
      this.chart = null
    }
  },
  methods: {
    generateMockData: function() {
      var data = []
      for (var i = 0; i < 7; i++) {
        var base = 1.234 + Math.sin(i / 2) * 0.1
        data.push(Math.round(base * 1000) / 1000)
      }
      return data
    },
    initChart: function() {
      if (!this.$refs.chartCanvas) return

      var ctx = this.$refs.chartCanvas.getContext('2d')
      var chartHeight = isNaN(this.height) || !this.height ? 120 : this.height
      var self = this

      var gradient = ctx.createLinearGradient(0, 0, 0, chartHeight)
      gradient.addColorStop(0, 'rgba(74, 55, 40, 0.2)')
      gradient.addColorStop(1, 'rgba(74, 55, 40, 0)')

      var datasets = [{
        label: '称重中值',
        data: this.chartData,
        borderColor: '#4A3728',
        backgroundColor: gradient,
        borderWidth: 2,
        pointBackgroundColor: '#4A3728',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
        spanGaps: true
      }]

      if (this.thresholdLine) {
        datasets.push({
          label: '阈值',
          data: Array(7).fill(this.threshold),
          borderColor: '#B33A3A',
          borderWidth: 1,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          tension: 0
        })
      }

      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.formatLabels(this.chartLabels),
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          legend: {
            display: false
          },
          tooltips: {
            backgroundColor: 'rgba(74, 55, 40, 0.9)',
            titleFontSize: 12,
            bodyFontSize: 12,
            callbacks: {
              label: function(item) {
                if (item.datasetIndex === 0) {
                  return '重量: ' + item.yLabel.toFixed(3) + ' g'
                }
                return '阈值: ' + item.yLabel.toFixed(3) + ' g'
              }
            }
          },
          scales: {
            xAxes: [{
              gridLines: {
                display: false
              },
              ticks: {
                fontSize: 10,
                fontColor: '#999',
                maxRotation: 0
              }
            }],
            yAxes: [{
              gridLines: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                fontSize: 10,
                fontColor: '#999',
                callback: function(value) {
                  return value.toFixed(2)
                }
              }
            }]
          },
          plugins: {
            filler: {
              propagate: false
            }
          }
        }
      })
    },
    formatLabels: function(labels) {
      return labels.map(function(l) {
        if (l.indexOf('-') > -1) {
          var parts = l.split('-')
          return parts[1] + '/' + parts[2]
        }
        return l
      })
    },
    updateChart: function() {
      if (!this.chart) return

      this.chart.data.labels = this.formatLabels(this.chartLabels)
      this.chart.data.datasets[0].data = this.chartData

      if (this.thresholdLine && this.chart.data.datasets[1]) {
        this.chart.data.datasets[1].data = Array(7).fill(this.threshold)
      }

      this.chart.update()
    }
  }
}
</script>

<style lang="scss" scoped>
.weighing-trend-chart {
  @include card;
  padding: $space-lg;
}

.chart-header {
  @include flex-between;
  margin-bottom: $space-md;

  .chart-title {
    display: flex;
    align-items: center;
    gap: $space-xs;
    font-family: $font-family-display;
    font-size: $font-size-md;
    font-weight: 600;
    color: $color-primary;

    i {
      font-size: $font-size-lg;
    }
  }

  .chart-range {
    font-size: $font-size-xs;
    color: $color-text-muted;
    background: $color-bg;
    padding: 2px $space-sm;
    border-radius: $radius-sm;
  }
}

.chart-body {
  position: relative;
  margin-bottom: $space-sm;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: $space-lg;
  padding-top: $space-sm;
  border-top: 1px solid $color-bg-dark;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: $space-xs;

  .legend-color {
    width: 12px;
    height: 3px;
    border-radius: 2px;

    &.threshold {
      background: $color-danger;
      border-style: dashed;
    }
  }

  .legend-text {
    font-size: $font-size-xs;
    color: $color-text-secondary;
  }
}

@include mobile {
  .chart-legend {
    flex-direction: column;
    gap: $space-xs;
    align-items: flex-start;
  }
}
</style>
