/*
 * main.js — Clulee Phase 2
 * ─────────────────────────────────────────────────────────────────
 * Main application logic for Clulee
 * Includes: Calendar, workout tracking, card redesign, rest timer
 * ─────────────────────────────────────────────────────────────────
 */

(function () {
  let workoutData = null;
  let workoutLogsCache = [];

  // ── DONE CHECKBOX MAP ───────────────────────────────────────────
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

    // ── MEDIA (full width, top) ──
    const imgContainer = document.createElement('div');
    imgContainer.className = 'image-container';

    if (exercise.images && exercise.images.length > 0) {
      const img = document.createElement('img');
      img.src = exercise.images[0].src;
      img.alt = exercise.title;
      img.loading = 'lazy';
      img.onerror = function() {
        this.parentElement.classList.add('no-media');
        this.remove();
      };
      imgContainer.appendChild(img);
    } else {
      imgContainer.classList.add('no-media');
    }
    card.appendChild(imgContainer);

    // ── CARD BODY ──
    const body = document.createElement('div');
    body.className = 'card-body';

    // Title
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = exercise.title;
    body.appendChild(title);

    // Tags row (muscle group + difficulty + badges)
    const tagsRow = document.createElement('div');
    tagsRow.className = 'badges';

    if (exercise.muscleGroup) {
      const muscle = document.createElement('span');
      muscle.className = 'badge badge-muscle';
      muscle.textContent = exercise.muscleGroup;
      tagsRow.appendChild(muscle);
    }

    if (exercise.difficulty) {
      const diff = document.createElement('span');
      diff.className = `badge badge-difficulty badge-${exercise.difficulty.toLowerCase()}`;
      diff.textContent = exercise.difficulty;
      tagsRow.appendChild(diff);
    }

    if (exercise.badges) {
      exercise.badges.forEach(badge => {
        const span = document.createElement('span');
        span.className = badge.type ? `badge ${badge.type}` : 'badge';
        span.textContent = badge.label;
        tagsRow.appendChild(span);
      });
    }

    if (tagsRow.children.length > 0) body.appendChild(tagsRow);

    // ── STAT PILLS (sets / reps / rest) ──
    if (exercise.meta) {
      const pills = document.createElement('div');
      pills.className = 'stat-pills';

      // Parse "4 Sets x 8-10 Reps | Rest: 90s" format
      const pipeParts = exercise.meta.split('|').map(s => s.trim());
      let parts = [];
      let labels = [];

      if (pipeParts.length >= 2) {
        const setsReps = pipeParts[0];
        const rest = pipeParts[1].replace('Rest:', '').trim();
        const xParts = setsReps.split('x').map(s => s.trim());
        parts = [xParts[0] || setsReps, xParts[1] || '', rest];
        labels = ['Sets', 'Reps', 'Rest'];
      } else {
        parts = [exercise.meta];
        labels = [''];
      }

      parts.forEach((part, i) => {
        const pill = document.createElement('div');
        pill.className = 'stat-pill';

        const val = document.createElement('div');
        val.className = 'stat-pill-value';
        val.textContent = part;

        const lbl = document.createElement('div');
        lbl.className = 'stat-pill-label';
        lbl.textContent = labels[i] || '';

        pill.appendChild(val);
        pill.appendChild(lbl);
        pills.appendChild(pill);
      });

      body.appendChild(pills);
    }

    // Coaching cue
    if (exercise.cue) {
      const cue = document.createElement('div');
      cue.className = 'cue';
      cue.textContent = exercise.cue;
      body.appendChild(cue);
    }

    // ── SETS TRACKER ──
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

      // ── REST TIMER BUTTON ──
      const restBtn = document.createElement('button');
      restBtn.className = 'rest-timer-btn';
      restBtn.innerHTML = '<i class="ph ph-timer"></i> Start Rest';
      restBtn.style.display = 'none';
      restBtn.addEventListener('click', () => startRestTimer(restBtn, exercise));

      // Show rest button when any set is checked
      tracker.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
          const anyChecked = [...tracker.querySelectorAll('input[type="checkbox"]')].some(cb => cb.checked);
          restBtn.style.display = anyChecked ? 'inline-flex' : 'none';
        }
      });

      tracker.appendChild(restBtn);
      body.appendChild(tracker);
    }

    card.appendChild(body);
    return card;
  }

  // ── REST TIMER ──────────────────────────────────────────────────
  function startRestTimer(btn, exercise) {
    const duration = parseInt((exercise.rest || '60').replace(/\D/g, '')) || 60;
    let remaining = duration;
    btn.disabled = true;
    btn.innerHTML = `<i class="ph ph-timer"></i> ${remaining}s`;

    const interval = setInterval(() => {
      remaining--;
      btn.innerHTML = `<i class="ph ph-timer"></i> ${remaining}s`;
      if (remaining <= 0) {
        clearInterval(interval);
        btn.disabled = false;
        btn.innerHTML = '<i class="ph ph-timer"></i> Start Rest';
        showToast('Rest complete! Time for your next set 💪');
      }
    }, 1000);
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
      nav.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
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
      if (callout) callout.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // ── SETUP RESET BUTTON ──────────────────────────────────────────
  function setupResetButton() {
    const resetBtn = document.getElementById('reset-diary');
    if (!resetBtn) return;

    resetBtn.addEventListener('click', async () => {
      window.appMain.showConfirm('Reset all checkboxes? This cannot be undone!', async () => {
        const profileId = localStorage.getItem('profile_id');
        if (!profileId) {
          showToast('Please save your profile first!');
          return;
        }
        await window.supabaseHelper.clearCheckboxStates(profileId);
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
        showToast('Please save your profile first!');
        e.target.checked = false;
        return;
      }

      await window.supabaseHelper.saveCheckboxState(profileId, checkboxId, e.target.checked);

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
    await setupCalendar();
    showToast(`${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} workout logged! 💪`);
  }

  // ── RESTORE CHECKBOX STATES ─────────────────────────────────────
  async function restoreCheckboxStates(profileId) {
    const states = await window.supabaseHelper.getCheckboxStates(profileId);
    Object.entries(states).forEach(([checkboxId, checked]) => {
      const checkbox = document.querySelector(`input[data-id="${checkboxId}"]`);
      if (checkbox) checkbox.checked = checked;
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
      calendarGrid.innerHTML = '<p style="text-align:center;color:#999;grid-column:1/-1;">Save your profile to see your calendar!</p>';
      if (streakEl) streakEl.textContent = '';
      return;
    }

    calendarGrid.innerHTML = '<p style="text-align:center;color:#999;grid-column:1/-1;">Loading your calendar…</p>';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logs = await window.supabaseHelper.getWorkoutLogs(profileId);
    workoutLogsCache = logs;

    const workoutMap = {};
    logs.forEach(log => {
      const date = new Date(log.created_at);
      const dateKey = date.toISOString().split('T')[0];
      if (!workoutMap[dateKey]) workoutMap[dateKey] = [];
      workoutMap[dateKey].push(log.workout_type);
    });

    const streak = calculateStreak(workoutMap, today);
    if (streakEl) {
      streakEl.textContent = streak > 0 ? `🔥 ${streak}-day streak!` : '';
    }

    calendarGrid.innerHTML = '';

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
      const header = document.createElement('div');
      header.style.cssText = 'text-align:center;font-size:0.75rem;font-weight:900;color:var(--clr-primary);padding:4px;';
      header.textContent = day;
      calendarGrid.appendChild(header);
    });

    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startDayOfWeek = firstDay.getDay();

    for (let i = 0; i < startDayOfWeek; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-day';
      emptyCell.style.visibility = 'hidden';
      calendarGrid.appendChild(emptyCell);
    }

    let current = new Date(firstDay);
    while (current <= lastDay) {
      const dateKey = current.toISOString().split('T')[0];
      const workouts = workoutMap[dateKey] || [];

      const cell = document.createElement('div');
      cell.className = 'calendar-day';
      if (workouts.length > 0) cell.classList.add('has-workouts');

      if (current.toDateString() === today.toDateString()) {
        cell.style.borderColor = 'var(--clr-primary)';
        cell.style.background = 'var(--clr-primary-soft)';
        cell.style.fontWeight = '900';
      }

      if (current <= today) {
        cell.dataset.date = dateKey;
        cell.style.cursor = 'pointer';
        cell.addEventListener('click', () => openCalendarModal(dateKey));
      } else {
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
        workouts.forEach(type => {
          const dot = document.createElement('span');
          dot.textContent = '●';
          dot.style.color = 'var(--clr-primary)';
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

    const date = new Date(dateKey + 'T00:00:00');
    dateTitle.textContent = date.toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric', year: 'numeric'
    });

    const dayWorkouts = workoutLogsCache.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate.toISOString().split('T')[0] === dateKey;
    });

    workoutsBody.innerHTML = '';

    if (dayWorkouts.length === 0) {
      workoutsBody.innerHTML = '<div class="calendar-modal-empty">No workouts logged this day</div>';
    } else {
      const nameMap = { glutes: 'Glutes', back: 'Back', core: 'Core', cardio: 'Cardio' };
      dayWorkouts.forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'workout-entry';

        const time = new Date(log.created_at);
        const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        const entryType = document.createElement('div');
        entryType.className = 'workout-entry-type';
        entryType.textContent = nameMap[log.workout_type] || log.workout_type;

        const entryTime = document.createElement('div');
        entryTime.className = 'workout-entry-time';
        entryTime.textContent = timeStr;

        entry.appendChild(entryType);
        entry.appendChild(entryTime);
        workoutsBody.appendChild(entry);
      });
    }

    modal.classList.add('visible');
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCalendarModal();
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
    box.style.cssText = 'background:white;border:3px solid #1a1a1a;border-radius:20px;padding:2rem;max-width:360px;width:100%;text-align:center;box-shadow:5px 5px 0 var(--clr-primary);';

    const msg = document.createElement('p');
    msg.style.cssText = 'font-weight:700;font-size:1rem;margin-bottom:1.5rem;color:#1a1a1a;';
    msg.textContent = message;

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:12px;justify-content:center;';

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Yes, do it!';
    confirmBtn.style.cssText = 'padding:10px 20px;background:var(--clr-primary);color:white;border:2px solid #1a1a1a;border-radius:12px;font-weight:900;cursor:pointer;box-shadow:3px 3px 0 #1a1a1a;font-family:var(--font-main);';
    confirmBtn.onclick = () => { modal.remove(); onConfirm(); };

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'padding:10px 20px;background:white;color:#1a1a1a;border:2px solid #1a1a1a;border-radius:12px;font-weight:900;cursor:pointer;box-shadow:3px 3px 0 #1a1a1a;font-family:var(--font-main);';
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
