const DEFECT_RULES = {
  sour_ferment: {
    name: '酸发酵味',
    deduction: 2.0,
    description: '存在明显酸败发酵气味，属于严重风味缺陷'
  },
  moldy: {
    name: '发霉味',
    deduction: 3.0,
    description: '咖啡豆受潮发霉，存在霉味或土腥味'
  },
  astringent: {
    name: '涩感',
    deduction: 1.5,
    description: '入口有明显涩感，口感不圆润'
  },
  flat: {
    name: '平淡',
    deduction: 1.0,
    description: '风味淡薄，缺乏层次和复杂度'
  },
  bitter: {
    name: '苦感过重',
    deduction: 2.0,
    description: '苦味突出且不愉悦，可能烘焙过度'
  },
  chemical: {
    name: '化学味',
    deduction: 4.0,
    description: '存在化学药品或溶剂气味，属重大缺陷'
  }
};

export class DefectController {
  constructor() {
    this.currentDefect = null;
    this.listeners = [];
    this.selectEl = null;
    this.deductionEl = null;
    this.descEl = null;
  }

  init() {
    this.selectEl = document.getElementById('defectSelect');
    this.deductionEl = document.getElementById('defectDeduction');
    this.descEl = document.getElementById('defectDesc');
    
    if (this.selectEl) {
      this.selectEl.addEventListener('change', (e) => {
        this.setDefect(e.target.value);
      });
    }
    
    this._updateDisplay();
  }

  setDefect(defectKey) {
    if (defectKey === '' || defectKey === null || defectKey === undefined) {
      this.currentDefect = null;
    } else if (DEFECT_RULES[defectKey]) {
      this.currentDefect = defectKey;
    }
    
    this._updateDisplay();
    this._notifyListeners('change', {
      defect: this.currentDefect,
      deduction: this.getDeduction()
    });
  }

  getDefect() {
    return this.currentDefect;
  }

  getDefectName() {
    if (!this.currentDefect) return '无缺陷';
    return DEFECT_RULES[this.currentDefect]?.name || this.currentDefect;
  }

  getDeduction() {
    if (!this.currentDefect) return 0;
    return DEFECT_RULES[this.currentDefect]?.deduction || 0;
  }

  getDescription() {
    if (!this.currentDefect) return '杯测样本无缺陷标记';
    return DEFECT_RULES[this.currentDefect]?.description || '';
  }

  calculateFinalScore(baseScore) {
    const deduction = this.getDeduction();
    const final = Math.max(0, baseScore - deduction);
    return parseFloat(final.toFixed(2));
  }

  getGrade(score) {
    if (score >= 8.5) return '卓越级';
    if (score >= 8.0) return '精品级';
    if (score >= 7.0) return '优良级';
    if (score >= 6.0) return '商品级';
    return '等外级';
  }

  getDefectRules() {
    return JSON.parse(JSON.stringify(DEFECT_RULES));
  }

  on(event, callback) {
    this.listeners.push({ event, callback });
    return () => {
      this.listeners = this.listeners.filter(l => l.callback !== callback);
    };
  }

  _notifyListeners(event, data) {
    this.listeners
      .filter(l => l.event === event)
      .forEach(l => l.callback(data));
  }

  _updateDisplay() {
    const deduction = this.getDeduction();
    
    if (this.deductionEl) {
      this.deductionEl.textContent = deduction > 0 ? `-${deduction.toFixed(2)}` : '-0.00';
      this.deductionEl.style.color = deduction > 0 ? 'var(--danger)' : 'var(--coffee-light)';
    }
    
    if (this.descEl) {
      this.descEl.textContent = this.getDescription();
    }
    
    if (this.selectEl && this.selectEl.value !== this.currentDefect) {
      this.selectEl.value = this.currentDefect || '';
    }
  }

  reset() {
    this.setDefect(null);
  }
}

export { DEFECT_RULES };
