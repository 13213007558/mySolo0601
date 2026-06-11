<template>
  <div class="humidity-trend-chart">
    <div class="chart-header">
      <span class="chart-title">
        <i class="el-icon-odometer"></i>
        {{ title }}
      </span>
      <span class="chart-range">近7日趋势</span>
    </div>
    <div class="chart-body">
      <canvas ref="chartCanvas" :height="height"></canvas>
    </div>
    <div class="chart-legend">
      <div class="legend-item">
        <span class="legend-color" style="background: #C78B2A;"></span>
        <span class="legend-text">温度 (°C)</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #409EFF;"></span>
        <span class="legend-text">湿度 (%RH)</span>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js'
import { getLast7Days } from '~/utils/dayjs'

export default {
  name: 'HumidityTrendChart',
  props: {
    title: {
      type: String,
      default: '温湿度趋势'
    },
    temperatureData: {
      type: Array,
      default: function() { return [] }
    },
    humidityData: {
      type: Array,
      default: function() { return [] }
    },
    labels: {
      type: Array,
      default: null
    },
    height: {
      type: Number,
      default: 140
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
    }
  },
  watch: {
    temperatureData: {
      handler: function() {
        this.updateChart()
      },
      deep: true
    },
    humidityData: {
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
    initChart: function() {
      if (!this.$refs.chartCanvas) return

      var ctx = this.$refs.chartCanvas.getContext('2d')

      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.formatLabels(this.chartLabels),
          datasets: [
            {
              label: '温度',
              data: this.temperatureData,
              borderColor: '#C78B2A',
              backgroundColor: 'rgba(199, 139, 42, 0.1)',
              borderWidth: 2,
              pointBackgroundColor: '#C78B2A',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 5,
              fill: false,
              tension: 0.4,
              spanGaps: true,
              yAxisID: 'temp-axis'
            },
            {
              label: '湿度',
              data: this.humidityData,
              borderColor: '#409EFF',
              backgroundColor: 'rgba(64, 158, 255, 0.1)',
              borderWidth: 2,
              pointBackgroundColor: '#409EFF',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 5,
              fill: false,
              tension: 0.4,
              spanGaps: true,
              yAxisID: 'hum-axis'
            }
          ]
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
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(item) {
                if (item.datasetIndex === 0) {
                  return '温度: ' + item.yLabel.toFixed(1) + ' °C'
                }
                return '湿度: ' + item.yLabel.toFixed(1) + ' %RH'
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
            yAxes: [
              {
                id: 'temp-axis',
                position: 'left',
                gridLines: {
                  color: 'rgba(0, 0, 0, 0.03)'
                },
                ticks: {
                  fontSize: 10,
                  fontColor: '#C78B2A',
                  callback: function(value) {
                    return value.toFixed(1) + '°'
                  }
                }
              },
              {
                id: 'hum-axis',
                position: 'right',
                gridLines: {
                  display: false
                },
                ticks: {
                  fontSize: 10,
                  fontColor: '#409EFF',
                  callback: function(value) {
                    return value.toFixed(0) + '%'
                  },
                  min: 30,
                  max: 70
                }
              }
            ]
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
      this.chart.data.datasets[0].data = this.temperatureData
      this.chart.data.datasets[1].data = this.humidityData
      this.chart.update()
    }
  }
}
</script>

<style lang="scss" scoped>
.humidity-trend-chart {
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
