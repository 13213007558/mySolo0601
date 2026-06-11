import { DEFECT_RULES } from './defect.js';

const CSV_HEADERS = [
  '杯号',
  '烘焙曲线编号',
  '产地',
  '处理法',
  '酸质',
  '甜感',
  '醇厚度',
  '余韵',
  '综合分',
  '缺陷类型',
  '缺陷扣分',
  '最终得分',
  '等级',
  '状态',
  '提交时间',
  '偏差均值',
  '偏差是否在允许范围内'
];

export class CSVExporter {
  constructor(sampleManager, standardController, defectController) {
    this.sampleManager = sampleManager;
    this.standardController = standardController;
    this.defectController = defectController;
  }

  init() {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.export());
    }
  }

  export() {
    const samples = this.sampleManager.getAllSamples();
    const rows = [];
    
    rows.push(CSV_HEADERS.join(','));
    
    samples.forEach(sample => {
      const row = this._sampleToRow(sample);
      rows.push(row.map(cell => this._escapeCSV(cell)).join(','));
    });
    
    const csvContent = '\ufeff' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `杯测记录_${this._getDateString()}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  _sampleToRow(sample) {
    const scores = sample.scores;
    const baseScore = Object.values(scores).reduce((a, b) => a + b, 0) / 4;
    const defectDeduction = sample.defect ? (DEFECT_RULES[sample.defect]?.deduction || 0) : 0;
    const finalScore = Math.max(0, baseScore - defectDeduction);
    const deviations = this.standardController.calculateDeviations(scores);
    const grade = this.defectController.getGrade(finalScore);
    const defectName = sample.defect ? (DEFECT_RULES[sample.defect]?.name || sample.defect) : '无';
    const statusText = sample.status === 'submitted' ? '已提交' : '草稿';
    
    return [
      sample.cupNumber,
      sample.roastProfileId || '',
      sample.origin || '',
      sample.process || '',
      scores.acidity.toFixed(2),
      scores.sweetness.toFixed(2),
      scores.body.toFixed(2),
      scores.aftertaste.toFixed(2),
      baseScore.toFixed(2),
      defectName,
      defectDeduction.toFixed(2),
      finalScore.toFixed(2),
      grade,
      statusText,
      sample.submittedAt ? new Date(sample.submittedAt).toLocaleString('zh-CN') : '',
      deviations.average.toFixed(2),
      deviations.withinTolerance ? '是' : '否'
    ];
  }

  _escapeCSV(value) {
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  _getDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}_${hour}${minute}`;
  }

  exportSubmittedOnly() {
    const submittedSamples = this.sampleManager.getAllSamples().filter(s => s.status === 'submitted');
    const rows = [];
    
    rows.push(CSV_HEADERS.join(','));
    
    submittedSamples.forEach(sample => {
      const row = this._sampleToRow(sample);
      rows.push(row.map(cell => this._escapeCSV(cell)).join(','));
    });
    
    const csvContent = '\ufeff' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `杯测记录_已提交_${this._getDateString()}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  getCSVHeaders() {
    return [...CSV_HEADERS];
  }
}

export { CSV_HEADERS };
