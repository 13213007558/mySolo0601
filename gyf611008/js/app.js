import { SliderController } from './modules/slider.js';
import { StandardController } from './modules/standard.js';
import { DefectController } from './modules/defect.js';
import { SampleManager } from './modules/sample.js';
import { MatrixView } from './modules/matrix.js';
import { BlindModeController } from './modules/blind.js';
import { CSVExporter } from './modules/export.js';
import { ValidationController } from './modules/validation.js';

class CuppingApp {
  constructor() {
    this.slider = new SliderController();
    this.standard = new StandardController();
    this.defect = new DefectController();
    this.samples = new SampleManager();
    this.matrix = null;
    this.blind = new BlindModeController();
    this.exporter = null;
    this.validation = null;
    this._suppressSampleSync = false;
  }

  init() {
    this.slider.init();
    this.standard.init();
    this.defect.init();
    this.blind.init();
    
    this.validation = new ValidationController(this.slider, this.blind);
    
    this._bindSampleEvents();
    this._bindSliderEvents();
    this._bindDefectEvents();
    this._bindButtonEvents();
    this._bindRoastProfileEvents();
    
    this.samples.init();
    this.validation.init();
    
    this.matrix = new MatrixView(this.samples, this.standard, this.defect);
    this.matrix.init();
    
    this.exporter = new CSVExporter(this.samples, this.standard, this.defect);
    this.exporter.init();
    
    this._updateDeviationDisplay();
    this._updateFinalScore();
  }

  _bindSampleEvents() {
    this.samples.on('select', ({ sample, index }) => {
      this._loadSampleToUI(sample);
      this._updateCupHeader(sample);
    });
  }

  _bindSliderEvents() {
    this.slider.on('input', ({ axis, value }) => {
      if (this._suppressSampleSync) return;
      
      const sample = this.samples.getCurrentSample();
      if (sample) {
        const newScores = { ...sample.scores, [axis]: value };
        const distance = Math.abs(value - sample.initialScores[axis]);
        const newDistances = { ...sample.dragDistances, [axis]: distance };
        
        this.samples.updateCurrentSample({
          scores: newScores,
          dragDistances: newDistances
        });
      }
      
      this._updateDeviationDisplay();
      this._updateFinalScore();
    });
  }

  _bindDefectEvents() {
    this.defect.on('change', ({ defect, deduction }) => {
      if (this._suppressSampleSync) return;
      
      const sample = this.samples.getCurrentSample();
      if (sample) {
        this.samples.updateCurrentSample({ defect });
      }
      
      this._updateFinalScore();
    });
  }

  _bindButtonEvents() {
    const submitBtn = document.getElementById('submitBtn');
    const resetBtn = document.getElementById('resetBtn');
    const addCupBtn = document.getElementById('addCupBtn');
    
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this._handleSubmit());
    }
    
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this._handleReset());
    }
    
    if (addCupBtn) {
      addCupBtn.addEventListener('click', () => this._handleAddCup());
    }
  }

  _bindRoastProfileEvents() {
    const roastInput = document.getElementById('roastProfileId');
    if (roastInput) {
      roastInput.addEventListener('input', (e) => {
        const sample = this.samples.getCurrentSample();
        if (sample) {
          this.samples.updateCurrentSample({
            roastProfileId: e.target.value
          });
        }
      });
    }
  }

  _loadSampleToUI(sample) {
    this._suppressSampleSync = true;
    
    this.slider.setInitialValues(sample.initialScores, true);
    this.slider.setValues(sample.scores, true);
    
    Object.keys(sample.scores).forEach(axis => {
      const distance = Math.abs(sample.scores[axis] - sample.initialScores[axis]);
      this.slider.dragDistances[axis] = distance;
    });
    
    this.defect.setDefect(sample.defect);
    
    const roastInput = document.getElementById('roastProfileId');
    if (roastInput) {
      roastInput.value = sample.roastProfileId || '';
    }
    
    this._updateOriginInfo(sample);
    this._updateDeviationDisplay();
    this._updateFinalScore();
    
    this.validation.validate();
    
    this._suppressSampleSync = false;
  }

  _updateCupHeader(sample) {
    const cupNumEl = document.getElementById('currentCupNum');
    if (cupNumEl) {
      cupNumEl.textContent = `#${sample.cupNumber}`;
    }
  }

  _updateOriginInfo(sample) {
    const originName = document.getElementById('originName');
    const processMethod = document.getElementById('processMethod');
    
    if (originName) originName.textContent = sample.origin || '-';
    if (processMethod) processMethod.textContent = sample.process || '-';
  }

  _updateDeviationDisplay() {
    const values = this.slider.getValues();
    const deviations = this.standard.calculateDeviations(values);
    
    const totalDevEl = document.getElementById('totalDeviation');
    if (totalDevEl) {
      totalDevEl.textContent = `±${deviations.average.toFixed(2)}`;
      totalDevEl.className = `deviation-value ${this.standard.getDeviationLevel(deviations.average)}`;
    }
    
    const overallEl = document.getElementById('overallScore');
    if (overallEl) {
      overallEl.textContent = this.slider.getOverallScore().toFixed(2);
    }
  }

  _updateFinalScore() {
    const baseScore = this.slider.getOverallScore();
    const finalScore = this.defect.calculateFinalScore(baseScore);
    
    const finalScoreEl = document.getElementById('finalScore');
    const gradeEl = document.getElementById('scoreGrade');
    
    if (finalScoreEl) {
      finalScoreEl.textContent = finalScore.toFixed(2);
    }
    
    if (gradeEl) {
      gradeEl.textContent = this.defect.getGrade(finalScore);
    }
  }

  _handleSubmit() {
    if (!this.validation.canSubmit()) {
      return;
    }
    
    const sample = this.samples.getCurrentSample();
    if (!sample) return;
    
    this.samples.submitCurrentSample();
    
    const nextIndex = this.samples.getCurrentIndex() + 1;
    if (nextIndex < this.samples.getSampleCount()) {
      this.samples.selectSample(nextIndex);
    }
    
    this._showToast('杯测记录已提交');
  }

  _handleReset() {
    this.slider.reset();
    this.defect.reset();
    
    const sample = this.samples.getCurrentSample();
    if (sample) {
      const initialScores = sample.initialScores;
      const distances = {
        acidity: 0,
        sweetness: 0,
        body: 0,
        aftertaste: 0
      };
      this.samples.updateCurrentSample({
        scores: { ...initialScores },
        dragDistances: distances,
        defect: null
      });
    }
    
    this._updateDeviationDisplay();
    this._updateFinalScore();
    this.validation.validate();
  }

  _handleAddCup() {
    this.samples.addSample();
    const newIndex = this.samples.getSampleCount() - 1;
    this.samples.selectSample(newIndex);
    
    const tableContainer = document.querySelector('.matrix-table-container');
    if (tableContainer) {
      tableContainer.scrollTop = tableContainer.scrollHeight;
    }
  }

  _showToast(message) {
    const existing = document.querySelector('.toast-message');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--success);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 2000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: toastIn 0.3s ease;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes toastIn {
        from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes toastOut {
        from { opacity: 1; transform: translateX(-50%) translateY(0); }
        to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => {
        toast.remove();
        style.remove();
      }, 300);
    }, 2000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new CuppingApp();
  app.init();
  window.__cuppingApp = app;
});
