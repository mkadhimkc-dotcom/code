/*
 * theme.js — Theme Toggle System
 * ─────────────────────────────────────────────────────────────────
 * Switches between Classic Sanrio and Modern 2026 themes.
 * ─────────────────────────────────────────────────────────────────
 */

(function() {
  const THEME_KEY = 'claire_workout_theme';
  
  // ── INITIALIZE THEME ────────────────────────────────────────────
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'classic';
    
    if (savedTheme === 'modern') {
      document.body.classList.add('modern-theme');
      updateIcon('🎀');
    } else {
      updateIcon('✨');
    }
  }
  
  // ── TOGGLE THEME ────────────────────────────────────────────────
  function toggleTheme() {
    const isModern = document.body.classList.toggle('modern-theme');
    
    if (isModern) {
      localStorage.setItem(THEME_KEY, 'modern');
      updateIcon('🎀');
      showThemeToast('Switched to Modern Theme! 💫');
    } else {
      localStorage.setItem(THEME_KEY, 'classic');
      updateIcon('✨');
      showThemeToast('Switched to Classic Theme! 🎀');
    }
  }
  
  // ── UPDATE ICON ─────────────────────────────────────────────────
  function updateIcon(emoji) {
    const icon = document.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = emoji;
    }
  }
  
  // ── SHOW TOAST ──────────────────────────────────────────────────
  function showThemeToast(message) {
    // Use existing toast system if available
    if (window.appMain && window.appMain.showToast) {
      window.appMain.showToast(message);
    } else {
      // Fallback toast
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      document.body.appendChild(toast);
      
      setTimeout(() => toast.classList.add('visible'), 10);
      setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    }
  }
  
  // ── SETUP EVENT LISTENER ────────────────────────────────────────
  function setupToggle() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleTheme);
    }
  }
  
  // ── INITIALIZE ON DOM READY ─────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupToggle();
  });
  
  // ── EXPOSE ──────────────────────────────────────────────────────
  window.themeToggle = {
    toggle: toggleTheme,
    init: initTheme
  };
})();
