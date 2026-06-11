export { default as WeighingCsvExportButton } from '../../components/weighing/CsvExportButton.vue'
export { default as WeighingDeviationGauge } from '../../components/weighing/DeviationGauge.vue'
export { default as WeighingDualComparePanel } from '../../components/weighing/DualComparePanel.vue'
export { default as WeighingHumidityTrendChart } from '../../components/weighing/HumidityTrendChart.vue'
export { default as WeighingPhotoCapture } from '../../components/weighing/PhotoCapture.vue'
export { default as WeighingProbeStatusCard } from '../../components/weighing/ProbeStatusCard.vue'
export { default as WeighingCard } from '../../components/weighing/WeighingCard.vue'
export { default as WeighingTrendChart } from '../../components/weighing/WeighingTrendChart.vue'
export { default as WeighingWheelNumberPicker } from '../../components/weighing/WheelNumberPicker.vue'

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
