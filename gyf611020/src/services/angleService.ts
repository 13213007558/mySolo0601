export const angleService = {
  snapTo15(angle: number): number {
    const normalized = ((angle % 360) + 360) % 360;
    return Math.round(normalized / 15) * 15;
  },

  computeDeviation(actual: number, target: number): number {
    const diff = Math.abs(actual - target);
    return Math.min(diff, 360 - diff);
  },

  needsRetake(deviation: number, threshold = 2): boolean {
    return deviation > threshold;
  },

  formatAngle(angle: number): string {
    const normalized = Math.round(((angle % 360) + 360) % 360);
    return normalized.toString().padStart(3, '0') + '°';
  },

  toRadians(deg: number): number {
    return (deg * Math.PI) / 180;
  },

  fromRadians(rad: number): number {
    return (rad * 180) / Math.PI;
  },

  vectorToAngle(dx: number, dy: number): number {
    const rad = Math.atan2(dy, dx);
    const deg = this.fromRadians(rad);
    return ((deg % 360) + 360) % 360;
  },
};
