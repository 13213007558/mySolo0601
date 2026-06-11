let cupCounter = 0;

const SAMPLE_PRESETS = [
  { origin: '埃塞俄比亚 · 耶加雪菲', process: '水洗', roastProfile: 'RP-2024-001' },
  { origin: '哥伦比亚 · 慧兰', process: '蜜处理', roastProfile: 'RP-2024-002' },
  { origin: '肯尼亚 · 涅里', process: '水洗', roastProfile: 'RP-2024-003' },
  { origin: '危地马拉 · 安提瓜', process: '水洗', roastProfile: 'RP-2024-004' },
  { origin: '巴拿马 · 瑰夏', process: '日晒', roastProfile: 'RP-2024-005' }
];

export class SampleManager {
  constructor() {
    this.samples = [];
    this.currentIndex = -1;
    this.listeners = [];
  }

  init() {
    this.addSample();
    this.addSample();
    this.addSample();
    this.selectSample(0);
  }

  createSample(overrides = {}) {
    cupCounter++;
    const presetIndex = (cupCounter - 1) % SAMPLE_PRESETS.length;
    const preset = SAMPLE_PRESETS[presetIndex];
    
    return {
      id: `cup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cupNumber: cupCounter,
      roastProfileId: preset.roastProfile,
      origin: preset.origin,
      process: preset.process,
      scores: {
        acidity: 7.50,
        sweetness: 7.50,
        body: 7.50,
        aftertaste: 7.50
      },
      initialScores: {
        acidity: 7.50,
        sweetness: 7.50,
        body: 7.50,
        aftertaste: 7.50
      },
      dragDistances: {
        acidity: 0,
        sweetness: 0,
        body: 0,
        aftertaste: 0
      },
      defect: null,
      status: 'draft',
      submittedAt: null,
      ...overrides
    };
  }

  addSample(overrides = {}) {
    const sample = this.createSample(overrides);
    this.samples.push(sample);
    this._notifyListeners('add', { sample, index: this.samples.length - 1 });
    return sample;
  }

  selectSample(index) {
    if (index >= 0 && index < this.samples.length) {
      this.currentIndex = index;
      this._notifyListeners('select', { sample: this.samples[index], index });
      return this.samples[index];
    }
    return null;
  }

  getCurrentSample() {
    if (this.currentIndex >= 0 && this.currentIndex < this.samples.length) {
      return this.samples[this.currentIndex];
    }
    return null;
  }

  getSample(index) {
    return this.samples[index] || null;
  }

  getAllSamples() {
    return [...this.samples];
  }

  updateCurrentSample(updates) {
    if (this.currentIndex < 0) return null;
    return this.updateSample(this.currentIndex, updates);
  }

  updateSample(index, updates) {
    if (index < 0 || index >= this.samples.length) return null;
    
    this.samples[index] = {
      ...this.samples[index],
      ...updates
    };
    
    this._notifyListeners('update', { sample: this.samples[index], index });
    return this.samples[index];
  }

  submitCurrentSample() {
    if (this.currentIndex < 0) return false;
    return this.submitSample(this.currentIndex);
  }

  submitSample(index) {
    if (index < 0 || index >= this.samples.length) return false;
    
    this.samples[index].status = 'submitted';
    this.samples[index].submittedAt = new Date().toISOString();
    
    this._notifyListeners('submit', { sample: this.samples[index], index });
    return true;
  }

  getSubmittedCount() {
    return this.samples.filter(s => s.status === 'submitted').length;
  }

  getSampleCount() {
    return this.samples.length;
  }

  getCurrentIndex() {
    return this.currentIndex;
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

  resetCupCounter() {
    cupCounter = 0;
  }
}

export { SAMPLE_PRESETS };
