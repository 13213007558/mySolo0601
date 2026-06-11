const DEFAULT_TOLERANCE = 0.5;

const DEFAULT_STANDARD = {
  name: '金标 · 耶加雪菲',
  tolerance: DEFAULT_TOLERANCE,
  scores: {
    acidity: 7.80,
    sweetness: 8.00,
    body: 7.20,
    aftertaste: 7.50
  }
};

export class StandardController {
  constructor(standard = DEFAULT_STANDARD) {
    this.standard = { ...standard, scores: { ...standard.scores } };
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.updateDisplay();
    this.initialized = true;
  }

  setStandard(standard) {
    this.standard = {
      ...standard,
      scores: { ...standard.scores }
    };
    this.updateDisplay();
  }

  getStandard() {
    return {
      ...this.standard,
      scores: { ...this.standard.scores }
    };
  }

  getScore(axis) {
    return this.standard.scores[axis] || 0;
  }

  getTolerance() {
    return this.standard.tolerance || DEFAULT_TOLERANCE;
  }

  getOverallScore() {
    const scores = Object.values(this.standard.scores);
    if (scores.length === 0) return 0;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  calculateDeviations(values) {
    const deviations = {};
    let totalAbsDeviation = 0;
    let count = 0;
    
    Object.keys(this.standard.scores).forEach(axis => {
      if (values[axis] !== undefined) {
        const std = this.standard.scores[axis];
        const actual = values[axis];
        const deviation = actual - std;
        deviations[axis] = deviation;
        totalAbsDeviation += Math.abs(deviation);
        count++;
      }
    });
    
    const avgDeviation = count > 0 ? totalAbsDeviation / count : 0;
    
    return {
      perAxis: deviations,
      average: avgDeviation,
      total: totalAbsDeviation,
      withinTolerance: this._isWithinTolerance(deviations)
    };
  }

  _isWithinTolerance(deviations) {
    const tolerance = this.standard.tolerance;
    return Object.values(deviations).every(dev => Math.abs(dev) <= tolerance);
  }

  getDeviationLevel(deviation) {
    const abs = Math.abs(deviation);
    const tolerance = this.standard.tolerance;
    
    if (abs <= tolerance * 0.5) {
      return 'good';
    } else if (abs <= tolerance) {
      return 'warning';
    } else {
      return 'danger';
    }
  }

  updateBands() {
    const axes = Object.keys(this.standard.scores);
    
    axes.forEach(axis => {
      const bandEl = document.getElementById(`band-${axis}`);
      const markerEl = document.getElementById(`marker-${axis}`);
      if (!bandEl || !markerEl) return;
      
      const std = this.standard.scores[axis];
      const tolerance = this.standard.tolerance;
      
      const leftPercent = ((std - tolerance) / 10) * 100;
      const widthPercent = (tolerance * 2 / 10) * 100;
      
      bandEl.style.left = `${leftPercent}%`;
      bandEl.style.width = `${widthPercent}%`;
      
      const markerPercent = (std / 10) * 100;
      markerEl.style.left = `${markerPercent}%`;
    });
  }

  updateDisplay() {
    const nameEl = document.getElementById('standardName');
    const overallEl = document.getElementById('std-overall');
    
    if (nameEl) nameEl.textContent = this.standard.name;
    if (overallEl) overallEl.textContent = this.getOverallScore().toFixed(2);
    
    Object.keys(this.standard.scores).forEach(axis => {
      const el = document.getElementById(`std-${axis}`);
      if (el) {
        el.textContent = this.standard.scores[axis].toFixed(2);
      }
    });
    
    this.updateBands();
  }

  formatDeviation(value) {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}`;
  }
}

export { DEFAULT_STANDARD, DEFAULT_TOLERANCE };
