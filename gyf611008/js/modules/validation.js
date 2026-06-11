import { MIN_DRAG_DISTANCE } from './slider.js';

export class ValidationController {
  constructor(sliderController, blindController) {
    this.sliderController = sliderController;
    this.blindController = blindController;
    this.validationState = {
      minDistance: false,
      blindOriginLocked: true,
      roastProfile: false
    };
    this.listeners = [];
  }

  init() {
    this.sliderController.on('input', () => this.validate());
    
    const roastInput = document.getElementById('roastProfileId');
    if (roastInput) {
      roastInput.addEventListener('input', () => this.validate());
    }
    
    this.validate();
  }

  validate() {
    const axesDistance = this.sliderController.allAxesMeetMinDistance();
    const axesNotMet = this.sliderController.getAxesNotMeetingMinDistance();
    
    const roastInput = document.getElementById('roastProfileId');
    const roastProfile = roastInput ? roastInput.value.trim() : '';
    const hasRoastProfile = roastProfile.length > 0;
    
    const blindLocked = this.blindController.isEnabled() && !this.blindController.isUnlocked();
    
    this.validationState = {
      minDistance: axesDistance,
      axesNotMet,
      roastProfile: hasRoastProfile,
      blindOriginLocked: blindLocked
    };
    
    const canSubmit = axesDistance && hasRoastProfile;
    
    this._updateSubmitButton(canSubmit);
    this._updateHint();
    this._notifyListeners('validate', {
      canSubmit,
      ...this.validationState
    });
    
    return canSubmit;
  }

  canSubmit() {
    return this.validationState.minDistance && this.validationState.roastProfile;
  }

  getValidationErrors() {
    const errors = [];
    
    if (!this.validationState.minDistance) {
      const axes = this.validationState.axesNotMet || [];
      const axisNames = axes.map(a => this._getAxisName(a)).join('、');
      errors.push(`${axisNames} 未达到最小拖动距离（${MIN_DRAG_DISTANCE}分）`);
    }
    
    if (!this.validationState.roastProfile) {
      errors.push('请填写烘焙曲线编号');
    }
    
    return errors;
  }

  _getAxisName(axis) {
    const names = {
      acidity: '酸质',
      sweetness: '甜感',
      body: '醇厚度',
      aftertaste: '余韵'
    };
    return names[axis] || axis;
  }

  _updateSubmitButton(canSubmit) {
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.disabled = !canSubmit;
    }
  }

  _updateHint() {
    const hintEl = document.getElementById('validationHint');
    const hintText = document.getElementById('hintText');
    
    if (!hintEl || !hintText) return;
    
    const errors = this.getValidationErrors();
    
    if (errors.length === 0) {
      hintText.textContent = '所有项已通过验证，可以提交';
      hintEl.className = 'validation-hint success';
    } else if (errors.length === 1 && errors[0].includes('未达到')) {
      hintText.textContent = errors[0];
      hintEl.className = 'validation-hint warning';
    } else {
      hintText.textContent = errors.join('；');
      hintEl.className = 'validation-hint error';
    }
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
}

export { MIN_DRAG_DISTANCE };
