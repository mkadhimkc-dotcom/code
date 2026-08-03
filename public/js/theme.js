/*
 * theme.js — Clulee Theme System
 * ─────────────────────────────────────────────────────────────────
 * Applies Her/Him theme from profile (Supabase) or localStorage.
 * Toggle button switches between light/dark within current theme.
 * ─────────────────────────────────────────────────────────────────
 */
(function() {
  const THEME_KEY = 'clulee_theme';

  // ── APPLY THEME CLASS TO BODY ──────────────────────────────────
  function applyTheme(theme) {
    document.body.classList.remove('theme-her', 'theme-him');
    document.body.classList.add(theme === 'him' ? 'theme-him' : 'theme-her');
    localStorage.setItem(THEME_KEY, theme);
    updateIcon(theme);
  }

  // ── UPDATE PHOSPHOR ICON ───────────────────────────────────────
  function updateIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    icon.className = theme === 'him' ? 'ph ph-moon' : 'ph ph-sun';
  }

  // ── TOGGLE BETWEEN HER AND HIM ─────────────────────────────────
  function toggleTheme() {
    const current = localStorage.getItem(THEME_KEY) || 'her';
    const next = current === 'her' ? 'him' : 'her';
    applyTheme(next);

    if (window.appMain && window.appMain.showToast) {
      window.appMain.showToast(next === 'him' ? 'Switched to Him theme' : 'Switched to Her theme');
    }
  }

  // ── INIT: apply from localStorage immediately (no flash) ───────
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'her';
    applyTheme(saved);
  }

  // ── SETUP TOGGLE BUTTON ────────────────────────────────────────
  function setupToggle() {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggleTheme);
  }

  // ── APPLY THEME FROM SUPABASE PROFILE ─────────────────────────
  // Called by profile.js after profile loads
  function applyProfileTheme(theme) {
    if (theme && (theme === 'her' || theme === 'him')) {
      applyTheme(theme);
    }
  }

  // Apply immediately before DOM ready to prevent flash
  initTheme();

  document.addEventListener('DOMContentLoaded', setupToggle);

  window.themeManager = {
    apply: applyTheme,
    applyFromProfile: applyProfileTheme,
    toggle: toggleTheme
  };
})();