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

  // ── CREATE CARD ─────────────────────────────────────────────────
  function createCard(exercise) {
    const card = document.createElement('div');
    card.className = 'card';

    // Image
    if (exercise.images && exercise.images.length > 0) {
      const imgContainer = document.createElement('div');
      imgContainer.className = 'image-container';
      const img = document.createElement('img');
      img.src = exercise.images[0].src;
      img.alt = exercise.title;
      img.onerror = function() {
        this.style.display = 'none';
      };
      imgContainer.appendChild(img);
      card.appendChild(imgContainer);
    }

    // Title
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = exercise.title;
    card.appendChild(title);

    // Meta
    if (exercise.meta) {
      const meta = document.createElement('div');
      meta.className = 'card-meta';
      meta.textContent = exercise.meta;
      card.appendChild(meta);
    }

    // Badges
    if (exercise.badges) {
      const badgesDiv = document.createElement('div');
      badgesDiv.className = 'badges';
      exercise.badges.forEach(badge => {
        const span = document.createElement('span');
        span.className = badge.type ? `badge ${badge.type}` : 'badge';
        span.textContent = badge.label;
        badgesDiv.appendChild(span);
      });
      card.appendChild(badgesDiv);
    }

    // Cue
    if (exercise.cue) {
      const cue = document.createElement('div');
      cue.className = 'cue';
      cue.textContent = exercise.cue;
      card.appendChild(cue);
    }

    // Sets tracker
    if (exercise.sets) {
      const tracker = document.createElement('div');
      tracker.className = 'sets-tracker';
      exercise.sets.forEach(set => {
        const label = document.createElement('label');
        label.className = 'set-checkbox';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.dataset.id = set.id;

        const indicator = document.createElement('span');
        indicator.className = 'heart-indicator';

        const number = document.createElement('span');
        number.className = 'set-number';
        number.textContent = set.label;

        label.append(input, indicator, number);
        tracker.appendChild(label);
      });
      card.appendChild(tracker);
    }

    return card;
  }

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
      if (!confirm('Reset all checkboxes? This cannot be undone! 🎀')) return;

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
  }

  // ── ATTACH CHECKBOX LISTENERS ───────────────────────────────────
  function attachCheckboxListeners() {
    document.addEventListener('change', async (e) => {
      if (e.target.type !== 'checkbox') return;

      const checkboxId = e.target.dataset.id;
      if (!checkboxId) return;

      const profileId = localStorage.getItem('profile_id');
      if (!profileId) {
        alert('Please save your profile first! 🌸');
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
        
        entry.innerHTML = `
          <div class="workout-entry-type">${emojiMap[log.workout_type] || '✨'} ${nameMap[log.workout_type] || log.workout_type}</div>
          <div class="workout-entry-time">${timeStr}</div>
        `;
        
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

  // ── EXPOSE ──────────────────────────────────────────────────────
  window.appMain = {
    setupCalendar,
    restoreCheckboxStates,
    showToast,
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
