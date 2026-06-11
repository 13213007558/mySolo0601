export interface BandConfig {
  targetRange: [number, number];
  minTemp: number;
  maxTemp: number;
  chartWidth: number;
  chartHeight: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
}

export interface BandResult {
  x: number;
  y: number;
  width: number;
  height: number;
  yStart: number;
  yEnd: number;
}

export function calculateTargetRangeBand(config: BandConfig): BandResult {
  const {
    targetRange,
    minTemp,
    maxTemp,
    chartWidth,
    chartHeight,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
  } = config;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const tempRange = maxTemp - minTemp;

  const [rangeMin, rangeMax] = targetRange;

  const yStart = paddingTop + innerHeight * (1 - (rangeMax - minTemp) / tempRange);
  const yEnd = paddingTop + innerHeight * (1 - (rangeMin - minTemp) / tempRange);

  return {
    x: paddingLeft,
    y: yStart,
    width: innerWidth,
    height: yEnd - yStart,
    yStart,
    yEnd,
  };
}

export function renderTargetRangeBand(config: BandConfig): string {
  const band = calculateTargetRangeBand(config);
  return `
    <rect
      x="${band.x}"
      y="${band.y}"
      width="${band.width}"
      height="${band.height}"
      fill="#2E7D32"
      fill-opacity="0.12"
      stroke="#2E7D32"
      stroke-width="1"
      stroke-dasharray="4 4"
      stroke-opacity="0.5"
    />
  `;
}
