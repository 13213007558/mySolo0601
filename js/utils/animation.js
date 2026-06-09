/**
 * 动画工具函数
 */

// 数字滚动动画
export function animateNumber(element, target, duration = 1000, decimals = 0) {
  if (!element) return;
  
  const start = parseFloat(element.dataset.value || '0');
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // 缓动函数
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = start + (target - start) * easeOutQuart;
    
    element.textContent = current.toFixed(decimals);
    element.dataset.value = target;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

// 淡入动画
export function fadeIn(element, duration = 300) {
  if (!element) return;
  
  element.style.opacity = '0';
  element.style.transform = 'translateY(10px)';
  element.style.transition = `all ${duration}ms ease-out`;
  
  requestAnimationFrame(() => {
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
  });
}

// 淡出动画
export function fadeOut(element, duration = 300, callback) {
  if (!element) return;
  
  element.style.transition = `all ${duration}ms ease-out`;
  element.style.opacity = '0';
  element.style.transform = 'translateY(-10px)';
  
  setTimeout(() => {
    if (callback) callback();
  }, duration);
}

// 滑入动画
export function slideIn(element, direction = 'right', duration = 300) {
  if (!element) return;
  
  const transforms = {
    right: 'translateX(100%)',
    left: 'translateX(-100%)',
    top: 'translateY(-100%)',
    bottom: 'translateY(100%)'
  };
  
  element.style.transform = transforms[direction] || transforms.right;
  element.style.transition = `transform ${duration}ms ease-out`;
  
  requestAnimationFrame(() => {
    element.style.transform = 'translateX(0) translateY(0)';
  });
}

// 状态变化闪烁
export function flashState(element, color = 'rgba(14, 165, 233, 0.3)', duration = 1000) {
  if (!element) return;
  
  element.style.backgroundColor = color;
  element.style.transition = `background-color ${duration}ms ease-out`;
  
  setTimeout(() => {
    element.style.backgroundColor = 'transparent';
  }, 100);
}

// 脉冲动画
export function pulse(element, times = 3, duration = 500) {
  if (!element) return;
  
  let count = 0;
  const interval = setInterval(() => {
    element.style.opacity = element.style.opacity === '0.5' ? '1' : '0.5';
    count++;
    if (count >= times * 2) {
      clearInterval(interval);
      element.style.opacity = '1';
    }
  }, duration / 2);
}

// 进度条动画
export function animateProgress(element, targetPercent, duration = 500) {
  if (!element) return;
  
  const start = parseFloat(element.style.width || '0');
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const current = start + (targetPercent - start) * progress;
    element.style.width = `${current}%`;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

// 滚动到视图
export function scrollIntoView(element, behavior = 'smooth') {
  if (!element) return;
  element.scrollIntoView({ behavior, block: 'center' });
}

// 添加状态变化类
export function addStateChangeClass(element) {
  if (!element) return;
  
  element.classList.remove('state-change');
  void element.offsetWidth; // 触发重绘
  element.classList.add('state-change');
}

// 随机延迟执行（用于模拟真实感）
export function randomDelay(callback, min = 500, max = 2000) {
  const delay = Math.floor(Math.random() * (max - min)) + min;
  return setTimeout(callback, delay);
}

// 节流函数
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 防抖函数
export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
