/*
 * render.js
 *
 * Loads workout definitions from data/workouts.json and renders the
 * exercise cards into the matching page grids.
 */

(function () {
  const DEFAULT_DATA_URL = 'data/workouts.json';

  function appendTextElement(parent, tag, className, text) {
    if (!text) return null;
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function createImageContent(images) {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'image-container';

    if (!Array.isArray(images) || images.length === 0) {
      imageContainer.classList.add('image-container-empty');
      return imageContainer;
    }

    if (images.length === 1) {
      const img = document.createElement('img');
      img.src = images[0].src;
      img.alt = images[0].alt || '';
      imageContainer.appendChild(img);
      return imageContainer;
    }

    const slider = document.createElement('div');
    slider.className = 'slider-container';

    const prevButton = document.createElement('button');
    prevButton.className = 'prev';
    prevButton.type = 'button';
    prevButton.setAttribute('aria-label', 'Previous slide');
    prevButton.textContent = '<';
    slider.appendChild(prevButton);

    images.forEach((image, index) => {
      const img = document.createElement('img');
      img.className = index === 0 ? 'slide active' : 'slide';
      img.src = image.src;
      img.alt = image.alt || '';
      slider.appendChild(img);
    });

    const nextButton = document.createElement('button');
    nextButton.className = 'next';
    nextButton.type = 'button';
    nextButton.setAttribute('aria-label', 'Next slide');
    nextButton.textContent = '>';
    slider.appendChild(nextButton);

    imageContainer.appendChild(slider);
    return imageContainer;
  }

  function createBadges(badges) {
    if (!Array.isArray(badges) || badges.length === 0) return null;

    const badgesEl = document.createElement('div');
    badgesEl.className = 'badges';

    badges.forEach((badge) => {
      const badgeEl = document.createElement('span');
      badgeEl.className = badge.type ? `badge ${badge.type}` : 'badge';
      badgeEl.textContent = badge.label;
      badgesEl.appendChild(badgeEl);
    });

    return badgesEl;
  }

  function createSetTracker(sets) {
    const tracker = document.createElement('div');
    tracker.className = 'sets-tracker';

    (sets || []).forEach((set) => {
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

    return tracker;
  }

  function createCard(exercise) {
    const card = document.createElement('div');
    card.className = exercise.fullWidth ? 'card full-width' : 'card';

    card.appendChild(createImageContent(exercise.images));
    appendTextElement(card, 'div', 'card-title', exercise.title);
    appendTextElement(card, 'div', 'card-meta', exercise.meta);

    const badges = createBadges(exercise.badges);
    if (badges) card.appendChild(badges);

    appendTextElement(card, 'div', 'cue', exercise.cue);
    card.appendChild(createSetTracker(exercise.sets));

    return card;
  }

  function renderWorkouts(data) {
    const sections = data && Array.isArray(data.sections) ? data.sections : [];

    sections.forEach((section) => {
      const grid = document.querySelector(`[data-workout-grid="${section.id}"]`);
      if (!grid) return;

      grid.textContent = '';
      (section.exercises || []).forEach((exercise) => {
        grid.appendChild(createCard(exercise));
      });
    });
  }

  function showRenderError(error) {
    console.error('Could not render workouts:', error);
    document.querySelectorAll('[data-workout-grid]').forEach((grid) => {
      grid.textContent = '';
      appendTextElement(
        grid,
        'p',
        'calendar-empty',
        'Workout data could not load. Try opening the app from a local server instead of the file directly.'
      );
    });
  }

  async function loadAndRenderWorkouts(url = DEFAULT_DATA_URL) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Workout data request failed: ${response.status}`);
      }

      const data = await response.json();
      renderWorkouts(data);
      return data;
    } catch (error) {
      showRenderError(error);
      return null;
    }
  }

  window.renderWorkouts = {
    loadAndRenderWorkouts,
    renderWorkouts
  };
})();
