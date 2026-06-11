const AXES = ['acidity', 'sweetness', 'body', 'aftertaste'];
const MIN_DRAG_DISTANCE = 0.3;

export class SliderController {
  constructor() {
    this.values = {};
    this.initialValues = {};
    this.dragDistances = {};
    this.listeners = [];
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    AXES.forEach(axis => {
      const slider = document.getElementById(`slider-${axis}`);
      if (!slider) return;
      
      const initialValue = parseFloat(slider.value);
      this.values[axis] = initialValue;
      this.initialValues[axis] = initialValue;
      this.dragDistances[axis] = 0;
      
      slider.addEventListener('input', (e) => this._onInput(axis, e));
      slider.addEventListener('change', (e) => this._onChange(axis, e));
    });
    
    this.initialized = true;
  }

  _onInput(axis, event) {
    const value = parseFloat(event.target.value);
    this.values[axis] = value;
    
    const distance = Math.abs(value - this.initialValues[axis]);
    this.dragDistances[axis] = distance;
    
    this._updateValueDisplay(axis, value);
    this._notifyListeners('input', { axis, value, distance });
  }

  _onChange(axis, event) {
    const value = parseFloat(event.target.value);
    const distance = this.dragDistances[axis];
    this._notifyListeners('change', { axis, value, distance });
  }

  _updateValueDisplay(axis, value) {
    const display = document.getElementById(`value-${axis}`);
    if (display) {
      display.textContent = value.toFixed(2);
    }
  }

  getValue(axis) {
    return this.values[axis] || 0;
  }

  getValues() {
    return { ...this.values };
  }

  getInitialValue(axis) {
    return this.initialValues[axis] || 0;
  }

  getDragDistance(axis) {
    return this.dragDistances[axis] || 0;
  }

  getDragDistances() {
    return { ...this.dragDistances };
  }

  setValue(axis, value, silent = false) {
    const slider = document.getElementById(`slider-${axis}`);
    if (!slider) return;
    
    const numValue = parseFloat(value);
    slider.value = numValue;
    this.values[axis] = numValue;
    
    const distance = Math.abs(numValue - this.initialValues[axis]);
    this.dragDistances[axis] = distance;
    
    this._updateValueDisplay(axis, numValue);
    
    if (!silent) {
      this._notifyListeners('input', { axis, value: numValue, distance });
    }
  }

  setValues(values, silent = false) {
    Object.keys(values).forEach(axis => {
      if (AXES.includes(axis)) {
        this.setValue(axis, values[axis], silent);
      }
    });
  }

  reset() {
    AXES.forEach(axis => {
      const initial = this.initialValues[axis];
      this.setValue(axis, initial, false);
    });
  }

  setInitialValues(values) {
    AXES.forEach(axis => {
      if (values[axis] !== undefined) {
        this.initialValues[axis] = parseFloat(values[axis]);
        const distance = Math.abs(this.values[axis] - this.initialValues[axis]);
        this.dragDistances[axis] = distance;
      }
    });
  }

  allAxesMeetMinDistance() {
    return AXES.every(axis => this.dragDistances[axis] >= MIN_DRAG_DISTANCE);
  }

  getAxesNotMeetingMinDistance() {
    return AXES.filter(axis => this.dragDistances[axis] < MIN_DRAG_DISTANCE);
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

  getMinDragDistance() {
    return MIN_DRAG_DISTANCE;
  }

  getAxes() {
    return [...AXES];
  }

  getOverallScore() {
    const values = Object.values(this.values);
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }
}

export const AXIS_LABELS = {
  acidity: '酸质',
  sweetness: '甜感',
  body: '醇厚度',
  aftertaste: '余韵'
};

export { MIN_DRAG_DISTANCE, AXES };
