import { DEFECT_RULES } from './defect.js';

const AXIS_DISPLAY = {
  acidity: '酸质',
  sweetness: '甜感',
  body: '醇厚',
  aftertaste: '余韵'
};

export class MatrixView {
  constructor(sampleManager, standardController, defectController) {
    this.sampleManager = sampleManager;
    this.standardController = standardController;
    this.defectController = defectController;
    this.tbody = null;
  }

  init() {
    this.tbody = document.getElementById('matrixBody');
    this.render();
    
    this.sampleManager.on('add', () => this.render());
    this.sampleManager.on('update', () => this.render());
    this.sampleManager.on('submit', () => this.render());
    this.sampleManager.on('select', () => this._highlightSelected());
  }

  render() {
    if (!this.tbody) return;
    
    const samples = this.sampleManager.getAllSamples();
    
    this.tbody.innerHTML = '';
    
    samples.forEach((sample, index) => {
      const row = this._createRow(sample, index);
      this.tbody.appendChild(row);
    });
    
    this._highlightSelected();
  }

  _createRow(sample, index) {
    const tr = document.createElement('tr');
    tr.dataset.index = index;
    tr.dataset.sampleId = sample.id;
    
    const scores = sample.scores;
    const deviations = this.standardController.calculateDeviations(scores);
    const defectDeduction = sample.defect ? (DEFECT_RULES[sample.defect]?.deduction || 0) : 0;
    const baseScore = Object.values(scores).reduce((a, b) => a + b, 0) / 4;
    const finalScore = Math.max(0, baseScore - defectDeduction);
    
    const deviationClass = deviations.withinTolerance ? 'good' : 'danger';
    const statusClass = sample.status === 'submitted' ? 'status-submitted' : 'status-draft';
    const statusText = sample.status === 'submitted' ? '已提交' : '草稿';
    
    tr.innerHTML = `
      <td>#${sample.cupNumber}</td>
      <td>${sample.roastProfileId || '-'}</td>
      <td class="origin-col">${sample.origin}</td>
      <td>${scores.acidity.toFixed(2)}</td>
      <td>${scores.sweetness.toFixed(2)}</td>
      <td>${scores.body.toFixed(2)}</td>
      <td>${scores.aftertaste.toFixed(2)}</td>
      <td>${sample.defect ? DEFECT_RULES[sample.defect]?.name : '无'}</td>
      <td class="deviation-${deviationClass}">±${deviations.average.toFixed(2)}</td>
      <td><strong>${finalScore.toFixed(2)}</strong></td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>
        <span class="action-link" data-action="select">编辑</span>
      </td>
    `;
    
    tr.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'select' || e.target.closest('[data-action="select"]')) {
        this.sampleManager.selectSample(index);
      }
    });
    
    return tr;
  }

  _highlightSelected() {
    if (!this.tbody) return;
    
    const currentIndex = this.sampleManager.getCurrentIndex();
    const rows = this.tbody.querySelectorAll('tr');
    
    rows.forEach((row, index) => {
      if (index === currentIndex) {
        row.classList.add('selected');
      } else {
        row.classList.remove('selected');
      }
    });
  }
}
