export const WeighingCsvExportButton = () => import('../../components/weighing/CsvExportButton.vue' /* webpackChunkName: "components/weighing-csv-export-button" */).then(c => wrapFunctional(c.default || c))
export const WeighingDeviationGauge = () => import('../../components/weighing/DeviationGauge.vue' /* webpackChunkName: "components/weighing-deviation-gauge" */).then(c => wrapFunctional(c.default || c))
export const WeighingDualComparePanel = () => import('../../components/weighing/DualComparePanel.vue' /* webpackChunkName: "components/weighing-dual-compare-panel" */).then(c => wrapFunctional(c.default || c))
export const WeighingHumidityTrendChart = () => import('../../components/weighing/HumidityTrendChart.vue' /* webpackChunkName: "components/weighing-humidity-trend-chart" */).then(c => wrapFunctional(c.default || c))
export const WeighingPhotoCapture = () => import('../../components/weighing/PhotoCapture.vue' /* webpackChunkName: "components/weighing-photo-capture" */).then(c => wrapFunctional(c.default || c))
export const WeighingProbeStatusCard = () => import('../../components/weighing/ProbeStatusCard.vue' /* webpackChunkName: "components/weighing-probe-status-card" */).then(c => wrapFunctional(c.default || c))
export const WeighingCard = () => import('../../components/weighing/WeighingCard.vue' /* webpackChunkName: "components/weighing-card" */).then(c => wrapFunctional(c.default || c))
export const WeighingTrendChart = () => import('../../components/weighing/WeighingTrendChart.vue' /* webpackChunkName: "components/weighing-trend-chart" */).then(c => wrapFunctional(c.default || c))
export const WeighingWheelNumberPicker = () => import('../../components/weighing/WheelNumberPicker.vue' /* webpackChunkName: "components/weighing-wheel-number-picker" */).then(c => wrapFunctional(c.default || c))

// nuxt/nuxt.js#8607
function wrapFunctional(options) {
  if (!options || !options.functional) {
    return options
  }

  const propKeys = Array.isArray(options.props) ? options.props : Object.keys(options.props || {})

  return {
    render(h) {
      const attrs = {}
      const props = {}

      for (const key in this.$attrs) {
        if (propKeys.includes(key)) {
          props[key] = this.$attrs[key]
        } else {
          attrs[key] = this.$attrs[key]
        }
      }

      return h(options, {
        on: this.$listeners,
        attrs,
        props,
        scopedSlots: this.$scopedSlots,
      }, this.$slots.default)
    }
  }
}
