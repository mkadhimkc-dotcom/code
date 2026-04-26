/*
 * main.js — Sprint 2 & 3C
 * ─────────────────────────────────────────────────────────────────
 * Main application logic for Claire Workout App
 * Includes: Calendar with clickable dates, workout completion tracking
 * ─────────────────────────────────────────────────────────────────
 */

(function () {
  let workoutData = null;
  let workoutLogsCache = [];

  // ── DONE CHECKBOX MAP ───────────────────────────────────────────
  // Maps "Done!" checkbox IDs to workout types for logging
  const DONE_CHECKBOX_MAP = {
    'A-Cardio': 'glutes',
    'B-Cardio': 'back',
    'C-Cardio': 'core',
    'D-Activity': 'cardio'
  };

  // ── LOAD WORKOUT DATA ───────────────────────────────────────────
  async function loadWorkoutData() {
    try {
      const response = await fetch('/data/workouts.json');
      workoutData = await response.json();
      renderWorkouts();
    } catch (err) {
      console.error('Failed to load workout data:', err);
    }
  }

  // ── RENDER WORKOUTS ─────────────────────────────────────────────
  function renderWorkouts() {
    if (!workoutData) return;

    workoutData.sections.forEach(section => {
      const grid = document.querySelector(`[data-workout-grid="${section.id}"]`);
      if (!grid) return;

      grid.innerHTML = '';

      section.exercises.forEach(exercise => {
        const card = createCard(exercise);
        grid.appendChild(card);
      });
    });
  }

/* ══════════════════════════════════════════════════════════════
   CARD REDESIGN — US-6.1 / US-6.2
   ══════════════════════════════════════════════════════════════ */

.card-body {
  padding: var(--space-3) var(--space-1) var(--space-1);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  flex: 1;
}

.image-container {
  aspect-ratio: 16 / 9;
  height: auto;
  min-height: 160px;
}

.image-container.no-media {
  background: var(--clr-primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.image-container.no-media::after {
  content: '💪';
  font-size: 3rem;
  opacity: 0.4;
}

/* Stat pills */
.stat-pills {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-start;
}

.stat-pill {
  background: var(--clr-primary-soft);
  border: 1.5px solid var(--clr-border-strong);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  text-align: center;
  min-width: 64px;
}

.stat-pill-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-black);
  color: var(--clr-primary);
  line-height: 1;
}

.stat-pill-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--clr-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}

/* Badge variants */
.badge-muscle {
  background: var(--clr-primary-soft);
  color: var(--clr-primary-dark);
  border-color: var(--clr-border-strong);
}

.badge-difficulty {
  background: var(--clr-gray-100);
  color: var(--clr-gray-700);
  border-color: var(--clr-gray-300);
}

.badge-beginner { background: #e8f5e9; color: #2e7d32; border-color: #a5d6a7; }
.badge-intermediate { background: #fff8e1; color: #e65100; border-color: #ffe082; }
.badge-advanced { background: #fce4ec; color: #c2185b; border-color: #f48fb1; }

/* Rest timer button */
.rest-timer-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-top: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--clr-primary);
  color: var(--clr-white);
  border: 2px solid var(--clr-black);
  border-radius: var(--radius-full);
  font-family: var(--font-main);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 2px 2px 0px var(--clr-black);
}

.rest-timer-btn:hover {
  transform: translateY(-1px);
  box-shadow: 3px 3px 0px var(--clr-black);
}

.rest-timer-btn i { font-size: 1rem; }
  // ── SETUP TABS ──────────────────────────────────────────────────
  function setupTabs() {
    const nav = document.querySelector('.workout-nav');
    const pages = document.querySelectorAll('.workout-page');

    if (!nav) return;

    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-btn');
      if (!btn) return;

      const targetPage = btn.dataset.page;

      // Update active button
      nav.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update active page
      pages.forEach(page => {
        page.classList.toggle('active', page.id === targetPage);
      });
    });
  }

  // ── SETUP HERO SCROLL ───────────────────────────────────────────
  function setupHeroScroll() {
    const heroBtn = document.querySelector('.hero-cta');
    if (!heroBtn) return;

    heroBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const callout = document.querySelector('.callout');
      if (callout) {
        callout.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // ── SETUP RESET BUTTON ──────────────────────────────────────────
  function setupResetButton() {
    const resetBtn = document.getElementById('reset-diary');
    if (!resetBtn) return;

    resetBtn.addEventListener('click', async () => {
	window.appMain.showConfirm('Reset all checkboxes? This cannot be undone! 🎀', async () => {
      const profileId = localStorage.getItem('profile_id');
      if (!profileId) {
        alert('Please save your profile first! 🌸');
        return;
      }

      // Clear from database
      await window.supabaseHelper.clearCheckboxStates(profileId);

      // Uncheck all checkboxes
      document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
      });

     showToast('Diary reset! Starting fresh 💖');
      });
    });
  }

  // ── ATTACH CHECKBOX LISTENERS ───────────────────────────────────
  function attachCheckboxListeners() {
    document.addEventListener('change', async (e) => {
      if (e.target.type !== 'checkbox') return;

      const checkboxId = e.target.dataset.id;
      if (!checkboxId) return;

      const profileId = localStorage.getItem('profile_id');
      if (!profileId) {
        showToast('Please save your profile first! 🌸');
        e.target.checked = false;
        return;
      }

      // Save checkbox state
      await window.supabaseHelper.saveCheckboxState(
        profileId,
        checkboxId,
        e.target.checked
      );

      // Check if this is a "Done!" checkbox
      if (DONE_CHECKBOX_MAP[checkboxId] && e.target.checked) {
        const workoutType = DONE_CHECKBOX_MAP[checkboxId];
        await saveWorkoutLog(profileId, workoutType);
      }
    });
  }

  // ── SAVE WORKOUT LOG ────────────────────────────────────────────
  async function saveWorkoutLog(profileId, workoutType) {
    const log = {
      profile_id: profileId,
      workout_type: workoutType,
      created_at: new Date().toISOString()
    };

    await window.supabaseHelper.saveWorkoutLog(log);
    
    // Refresh calendar to show new workout
    await setupCalendar();

    showToast(`${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} workout logged! 💪`);
  }

  // ── RESTORE CHECKBOX STATES ─────────────────────────────────────
  async function restoreCheckboxStates(profileId) {
    const states = await window.supabaseHelper.getCheckboxStates(profileId);

    Object.entries(states).forEach(([checkboxId, checked]) => {
      const checkbox = document.querySelector(`input[data-id="${checkboxId}"]`);
      if (checkbox) {
        checkbox.checked = checked;
      }
    });
  }

  // ── SETUP CALENDAR ──────────────────────────────────────────────
  async function setupCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    const streakEl = document.getElementById('streak-counter');
    if (!calendarGrid) return;

    const profileId = localStorage.getItem('profile_id');
    const startDate = localStorage.getItem('profile_startDate');

    if (!profileId || !startDate) {
      calendarGrid.innerHTML = '<p style="text-align:center;color:#999;grid-column: 1 / -1;">Save your profile to see your calendar! 🌸</p>';
      if (streakEl) streakEl.textContent = '';
      return;
    }

    // Show loading state
    calendarGrid.innerHTML = '<p style="text-align:center;color:#999;grid-column: 1 / -1;">Loading your calendar… 🌸</p>';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logs = await window.supabaseHelper.getWorkoutLogs(profileId);
    workoutLogsCache = logs; // Cache for modal

    // Build workout map
    const workoutMap = {};
    logs.forEach(log => {
      const date = new Date(log.created_at);
      const dateKey = date.toISOString().split('T')[0];
      if (!workoutMap[dateKey]) workoutMap[dateKey] = [];
      workoutMap[dateKey].push(log.workout_type);
    });

    // Calculate streak
    const streak = calculateStreak(workoutMap, today);
    if (streakEl) {
      streakEl.textContent = streak > 0 ? `🔥 ${streak}-day streak!` : '';
    }

    // Render calendar - show current month
    calendarGrid.innerHTML = '';
    
    // Add weekday headers
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
      const header = document.createElement('div');
      header.style.cssText = 'text-align: center; font-size: 0.75rem; font-weight: 900; color: var(--kitty-pink); padding: 4px;';
      header.textContent = day;
      calendarGrid.appendChild(header);
    });
    
    // Get first and last day of current month
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Get day of week for first day (0 = Sunday)
    const startDayOfWeek = firstDay.getDay();
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-day';
      emptyCell.style.visibility = 'hidden';
      calendarGrid.appendChild(emptyCell);
    }
    
    // Add actual days of the month
    let current = new Date(firstDay);
    while (current <= lastDay) {
      const dateKey = current.toISOString().split('T')[0];
      const workouts = workoutMap[dateKey] || [];

      const cell = document.createElement('div');
      cell.className = 'calendar-day';
      if (workouts.length > 0) {
        cell.classList.add('has-workouts');
      }
      
      // Highlight today
      if (current.toDateString() === today.toDateString()) {
        cell.style.borderColor = 'var(--kitty-pink)';
        cell.style.background = 'var(--kitty-pastel)';
        cell.style.fontWeight = '900';
      }
      
      // Make clickable (all dates, past and present)
      if (current <= today) {
        cell.dataset.date = dateKey;
        cell.style.cursor = 'pointer';
        cell.addEventListener('click', () => {
          openCalendarModal(dateKey);
        });
      } else {
        // Future dates - make them look disabled
        cell.style.opacity = '0.3';
        cell.style.cursor = 'default';
      }

      const dateNum = document.createElement('div');
      dateNum.className = 'day-number';
      dateNum.textContent = current.getDate();
      cell.appendChild(dateNum);

      if (workouts.length > 0) {
        const dots = document.createElement('div');
        dots.className = 'workout-dots';
        const emojiMap = { glutes: '🍑', back: '🎀', core: '💪', cardio: '💦' };
        workouts.forEach(type => {
          const dot = document.createElement('span');
          dot.textContent = emojiMap[type] || '✨';
          dots.appendChild(dot);
        });
        cell.appendChild(dots);
      }

      calendarGrid.appendChild(cell);
      current.setDate(current.getDate() + 1);
    }
  }

  // ── OPEN CALENDAR MODAL ─────────────────────────────────────────
  function openCalendarModal(dateKey) {
    const modal = document.getElementById('calendar-modal');
    const dateTitle = document.getElementById('calendar-modal-date');
    const workoutsBody = document.getElementById('calendar-modal-workouts');

    // Format date
    const date = new Date(dateKey + 'T00:00:00');
    const formatted = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    dateTitle.textContent = formatted;

    // Filter workouts for this date
    const dayWorkouts = workoutLogsCache.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate.toISOString().split('T')[0] === dateKey;
    });

    // Render workouts
    workoutsBody.innerHTML = '';
    
    if (dayWorkouts.length === 0) {
      workoutsBody.innerHTML = '<div class="calendar-modal-empty">No workouts logged this day 🌸</div>';
    } else {
      const emojiMap = { glutes: '🍑', back: '🎀', core: '💪', cardio: '💦' };
      const nameMap = { glutes: 'Glutes', back: 'Back', core: 'Core', cardio: 'Cardio' };
      
      dayWorkouts.forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'workout-entry';
        
        const time = new Date(log.created_at);
        const timeStr = time.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        });
        
const entryType = document.createElement('div');
        entryType.className = 'workout-entry-type';
        entryType.textContent = `${emojiMap[log.workout_type] || '✨'} ${nameMap[log.workout_type] || log.workout_type}`;
        
        const entryTime = document.createElement('div');
        entryTime.className = 'workout-entry-time';
        entryTime.textContent = timeStr;
        
        entry.appendChild(entryType);
        entry.appendChild(entryTime);
        
        workoutsBody.appendChild(entry);
      });
    }

    modal.classList.add('visible');

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeCalendarModal();
      }
    });
  }

  // ── CLOSE CALENDAR MODAL ────────────────────────────────────────
  function closeCalendarModal() {
    const modal = document.getElementById('calendar-modal');
    modal.classList.remove('visible');
  }

  // ── CALCULATE STREAK ────────────────────────────────────────────
  function calculateStreak(workoutMap, today) {
    let streak = 0;
    let current = new Date(today);

    while (true) {
      const dateKey = current.toISOString().split('T')[0];
      if (workoutMap[dateKey] && workoutMap[dateKey].length > 0) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  // ── SHOW TOAST ──────────────────────────────────────────────────
  function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

// ── SHOW CONFIRM MODAL ──────────────────────────────────────────
  function showConfirm(message, onConfirm) {
    const existing = document.querySelector('.confirm-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem;';

    const box = document.createElement('div');
    box.style.cssText = 'background:white;border:4px solid #1a1a1a;border-radius:20px;padding:2rem;max-width:360px;width:100%;text-align:center;box-shadow:6px 6px 0 #ff52a3;';

    const msg = document.createElement('p');
    msg.style.cssText = 'font-weight:700;font-size:1rem;margin-bottom:1.5rem;color:#1a1a1a;';
    msg.textContent = message;

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:12px;justify-content:center;';

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Yes, do it!';
    confirmBtn.style.cssText = 'padding:10px 20px;background:#ff52a3;color:white;border:3px solid #1a1a1a;border-radius:12px;font-weight:900;cursor:pointer;box-shadow:3px 3px 0 #1a1a1a;';
    confirmBtn.onclick = () => { modal.remove(); onConfirm(); };

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'padding:10px 20px;background:white;color:#1a1a1a;border:3px solid #1a1a1a;border-radius:12px;font-weight:900;cursor:pointer;box-shadow:3px 3px 0 #1a1a1a;';
    cancelBtn.onclick = () => modal.remove();

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);
    box.appendChild(msg);
    box.appendChild(btnRow);
    modal.appendChild(box);
    document.body.appendChild(modal);
  }

  // ── EXPOSE ──────────────────────────────────────────────────────
  window.appMain = {
    setupCalendar,
    restoreCheckboxStates,
    showToast,
    showConfirm,
    closeCalendarModal
  };

  // ── INITIALIZE ──────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', async () => {
    await loadWorkoutData();
    setupTabs();
    setupHeroScroll();
    setupResetButton();
    attachCheckboxListeners();
    window.customWorkouts.initialize();
  });
})();
