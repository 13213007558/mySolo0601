const UNLOCK_PASSWORD = 'cupping2024';
const STORAGE_KEY = 'cupping_blind_mode';

export class BlindModeController {
  constructor() {
    this.enabled = false;
    this.unlocked = false;
    this.listeners = [];
    this.toggleEl = null;
    this.overlayEl = null;
    this.passwordInput = null;
  }

  init() {
    this.toggleEl = document.getElementById('blindModeToggle');
    this.overlayEl = document.getElementById('blindOverlay');
    this.passwordInput = document.getElementById('blindPassword');
    
    const unlockBtn = document.getElementById('blindUnlockBtn');
    const cancelBtn = document.getElementById('blindCancelBtn');
    const originInfo = document.getElementById('originInfo');
    
    if (this.toggleEl) {
      this.toggleEl.addEventListener('change', (e) => {
        this.toggle(e.target.checked);
      });
    }
    
    if (unlockBtn) {
      unlockBtn.addEventListener('click', () => this._handleUnlock());
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this._hideOverlay());
    }
    
    if (this.passwordInput) {
      this.passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this._handleUnlock();
        }
      });
    }
    
    if (originInfo) {
      originInfo.addEventListener('click', () => {
        if (this.enabled && !this.unlocked) {
          this._showOverlay();
        }
      });
      originInfo.style.cursor = 'pointer';
    }
    
    this._applyBlindClass();
  }

  toggle(enable) {
    this.enabled = enable;
    this.unlocked = false;
    
    this._applyBlindClass();
    this._notifyListeners('toggle', { enabled: this.enabled, unlocked: this.unlocked });
  }

  enable() {
    this.toggle(true);
  }

  disable() {
    this.toggle(false);
  }

  isEnabled() {
    return this.enabled;
  }

  isUnlocked() {
    return this.unlocked;
  }

  canViewOrigin() {
    return !this.enabled || this.unlocked;
  }

  unlock(password) {
    if (password === UNLOCK_PASSWORD) {
      this.unlocked = true;
      this._applyBlindClass();
      this._hideOverlay();
      this._notifyListeners('unlock', { success: true });
      return true;
    }
    this._notifyListeners('unlock', { success: false });
    return false;
  }

  lock() {
    this.unlocked = false;
    this._applyBlindClass();
    this._notifyListeners('lock', {});
  }

  _handleUnlock() {
    if (this.passwordInput) {
      const password = this.passwordInput.value;
      const success = this.unlock(password);
      if (!success) {
        this.passwordInput.classList.add('error');
        this.passwordInput.value = '';
        this.passwordInput.placeholder = '密码错误，请重试';
        setTimeout(() => {
          this.passwordInput.classList.remove('error');
          this.passwordInput.placeholder = '解锁密码';
        }, 1500);
      }
    }
  }

  _showOverlay() {
    if (this.overlayEl) {
      this.overlayEl.classList.add('active');
      if (this.passwordInput) {
        this.passwordInput.value = '';
        this.passwordInput.focus();
      }
    }
  }

  _hideOverlay() {
    if (this.overlayEl) {
      this.overlayEl.classList.remove('active');
    }
  }

  _applyBlindClass() {
    const body = document.body;
    if (this.enabled && !this.unlocked) {
      body.classList.add('blind-mode');
    } else {
      body.classList.remove('blind-mode');
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

export { UNLOCK_PASSWORD };
