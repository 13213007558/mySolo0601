import CryptoJS from 'crypto-js';

const SECRET_KEY = 'energy_alarm_wall_2026_secure';

export const secureStorage = {
  set(key: string, value: any): void {
    try {
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(value),
        SECRET_KEY
      ).toString();
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Secure storage set error:', error);
    }
  },

  get<T>(key: string): T | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      const decrypted = CryptoJS.AES.decrypt(
        encrypted,
        SECRET_KEY
      ).toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) return null;
      
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error('Secure storage get error:', error);
      return null;
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Secure storage remove error:', error);
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Secure storage clear error:', error);
    }
  }
};

export const sessionSecureStorage = {
  set(key: string, value: any): void {
    try {
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(value),
        SECRET_KEY
      ).toString();
      sessionStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Session secure storage set error:', error);
    }
  },

  get<T>(key: string): T | null {
    try {
      const encrypted = sessionStorage.getItem(key);
      if (!encrypted) return null;
      
      const decrypted = CryptoJS.AES.decrypt(
        encrypted,
        SECRET_KEY
      ).toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) return null;
      
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error('Session secure storage get error:', error);
      return null;
    }
  },

  remove(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Session secure storage remove error:', error);
    }
  },

  clear(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('Session secure storage clear error:', error);
    }
  }
};
