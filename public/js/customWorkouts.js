/*
 * customWorkouts.js — Sprint 3B
 * ─────────────────────────────────────────────────────────────────
 * Handles custom workout assignment from library to workout pages
 * ─────────────────────────────────────────────────────────────────
 */

(function () {
  let allExercises = [];
  let currentPage = null;
  let customWorkouts = [];

  // ── INITIALIZE ──────────────────────────────────────────────────
  async function initialize() {
    const response = await fetch('/data/workouts.json');
    const data = await response.json();
    
    data.sections.forEach(section => {
      section.exercises.forEach(exercise => {
        allExercises.push({ ...exercise, section: section.id });
      });
    });

    addCustomizeButtons();
    createModal();
    
    const profileId = localStorage.getItem('profile_id');
    if (profileId) {
      await loadCustomWorkouts(profileId);
    }
  }

  // ── ADD CUSTOMIZE BUTTONS ───────────────────────────────────────
  function addCustomizeButtons() {
    const pages = ['glutes', 'back', 'core', 'cardio'];
    pages.forEach(pageId => {
      const grid = document.querySelector(`[data-workout-grid="${pageId}"]`);
      if (!grid) return;
      const btn = document.createElement('button');
      btn.className = 'btn-customize';
      btn.textContent = '➕ Add Exercise from Library';
      btn.onclick = () => openLibraryPicker(pageId);
      grid.parentElement.insertBefore(btn, grid);
    });
  }

  // ── CREATE MODAL ────────────────────────────────────────────────
  function createModal() {
    const modal = document.createElement('div');
    modal.id = 'library-modal';
    modal.className = 'library-modal';
    modal.innerHTML = `
      <div class="library-modal-content">
        <div class="library-modal-header">
          <h3>📚 Choose an Exercise</h3>
          <button class="library-modal-close" onclick="window.customWorkouts.closeModal()">✕</button>
        </div>
        <div class="library-modal-body" id="library-modal-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // ── OPEN LIBRARY PICKER ─────────────────────────────────────────
  function openLibraryPicker(pageId) {
    currentPage = pageId;
    const modal = document.getElementById('library-modal');
    const body = document.getElementById('library-modal-body');
    body.innerHTML = '';

    allExercises.forEach(exercise => {
      const card = document.createElement('div');
      card.className = 'library-card';

      if (exercise.images && exercise.images[0]) {
        const imgEl = document.createElement('img');
        imgEl.src = exercise.images[0].src;
        imgEl.alt = exercise.title;
        card.appendChild(imgEl);
      }

      const info = document.createElement('div');
      info.className = 'library-card-info';

      const cardTitle = document.createElement('div');
      cardTitle.className = 'library-card-title';
      cardTitle.textContent = exercise.title;

      const cardMeta = document.createElement('div');
      cardMeta.className = 'library-card-meta';
      cardMeta.textContent = exercise.meta || '';

      info.appendChild(cardTitle);
      info.appendChild(cardMeta);
      card.appendChild(info);

      const addBtn = document.createElement('button');
      addBtn.className = 'library-card-add';
      addBtn.textContent = 'Add';
      addBtn.addEventListener('click', () => addExerciseToPage(exercise.exercise_id));
      card.appendChild(addBtn);

      body.appendChild(card);
    });

    modal.classList.add('visible');
  }

  // ── CLOSE MODAL ─────────────────────────────────────────────────
  function closeModal() {
    document.getElementById('library-modal').classList.remove('visible');
  }

  // ── ADD EXERCISE TO PAGE ────────────────────────────────────────
  async function addExerciseToPage(exerciseId) {
    const profileId = localStorage.getItem('profile_id');
    if (!profileId) {
      window.appMain.showToast('Please save your profile first! 🎀');
      return;
    }

    // Check local array first (fast)
    const localDuplicate = customWorkouts.some(w => w.page === currentPage && w.exercise_id === exerciseId);
    if (localDuplicate) {
      window.appMain.showToast('Already in this section! 🎀');
      return;
    }

    // Double-check with DB (accurate)
    const existing = await window.supabaseHelper.getCustomWorkouts(profileId);
    const isDuplicate = existing.some(w => w.page === currentPage && w.exercise_id === exerciseId);
    if (isDuplicate) {
      window.appMain.showToast('Already in this section! 🎀');
      return;
    }

    const sortOrder = existing.filter(w => w.page === currentPage).length;

    const assignment = {
      profile_id: profileId,
      page: currentPage,
      exercise_id: exerciseId,
      sort_order: sortOrder
    };

    const saved = await window.supabaseHelper.addCustomWorkout(assignment);

    if (saved) {
      customWorkouts.push(saved);
      renderCustomWorkouts();
      closeModal();
      window.appMain.showToast('Exercise added! 💖');
    } else {
      window.appMain.showToast('Could not add exercise. Please try again! 🌸');
    }
  }

  // ── LOAD CUSTOM WORKOUTS ────────────────────────────────────────
  async function loadCustomWorkouts(profileId) {
    customWorkouts = await window.supabaseHelper.getCustomWorkouts(profileId);
    renderCustomWorkouts();
  }

  // ── RENDER CUSTOM WORKOUTS ──────────────────────────────────────
  function renderCustomWorkouts() {
    const pages = ['glutes', 'back', 'core', 'cardio'];
    pages.forEach(pageId => {
      const existingSection = document.getElementById(`custom-${pageId}`);
      if (existingSection) existingSection.remove();

      const pageWorkouts = customWorkouts.filter(w => w.page === pageId);
      if (pageWorkouts.length === 0) return;

      const grid = document.querySelector(`[data-workout-grid="${pageId}"]`);
      if (!grid) return;

      const section = document.createElement('div');
      section.id = `custom-${pageId}`;
      section.className = 'custom-workouts-section';
      section.innerHTML = '<h3 class="custom-section-title">✨ Your Custom Exercises</h3>';

      const customGrid = document.createElement('div');
      customGrid.className = 'exercise-grid';

      pageWorkouts.forEach(workout => {
        const exercise = allExercises.find(e => e.exercise_id === workout.exercise_id);
        if (!exercise) return;
        customGrid.appendChild(createCustomCard(exercise, workout.id));
      });

      section.appendChild(customGrid);
      grid.parentElement.insertBefore(section, grid.nextSibling);
    });
  }

  // ── CREATE CUSTOM CARD ──────────────────────────────────────────
  function createCustomCard(exercise, assignmentId) {
    const card = document.createElement('div');
    card.className = 'card';

    if (exercise.images && exercise.images.length > 0) {
      const imgContainer = document.createElement('div');
      imgContainer.className = 'image-container';
      const img = document.createElement('img');
      img.src = exercise.images[0].src;
      img.alt = exercise.title;
      imgContainer.appendChild(img);
      card.appendChild(imgContainer);
    }

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = exercise.title;
    card.appendChild(title);

    if (exercise.meta) {
      const meta = document.createElement('div');
      meta.className = 'card-meta';
      meta.textContent = exercise.meta;
      card.appendChild(meta);
    }

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

    if (exercise.cue) {
      const cue = document.createElement('div');
      cue.className = 'cue';
      cue.textContent = exercise.cue;
      card.appendChild(cue);
    }

    if (exercise.sets) {
      const tracker = document.createElement('div');
      tracker.className = 'sets-tracker';
      exercise.sets.forEach(set => {
        const label = document.createElement('label');
        label.className = 'set-checkbox';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.dataset.id = `custom-${assignmentId}-${set.id}`;
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

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove-custom';
    removeBtn.textContent = '🗑️ Remove';
    removeBtn.onclick = () => removeExercise(assignmentId);
    card.appendChild(removeBtn);

    return card;
  }

  // ── REMOVE EXERCISE ─────────────────────────────────────────────
  async function removeExercise(assignmentId) {
	window.appMain.showConfirm('Remove this exercise from your workout? 🎀', async () => {
      await window.supabaseHelper.removeCustomWorkout(assignmentId);
      customWorkouts = customWorkouts.filter(w => w.id !== assignmentId);
      renderCustomWorkouts();
      window.appMain.showToast('Exercise removed! 💖');
    });
  }

  // ── EXPOSE ──────────────────────────────────────────────────────
  async function waitForSupabase() {
    while (!window.supabaseHelper) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  window.customWorkouts = {
    initialize: async function() {
      await waitForSupabase();
      return initialize();
    },
    closeModal,
    loadCustomWorkouts
  };
})();