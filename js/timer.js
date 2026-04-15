/*
 * timer.js
 *
 * Adds rest timer functionality to each workout card based on the rest
 * duration specified in the card’s metadata. A small button is appended
 * alongside the rest time text that, when clicked, counts down from the
 * configured number of seconds. The remaining time is displayed on the
 * button itself, and a friendly message appears once the timer expires.
 *
 * The timer uses `setInterval` to update once per second and clears the
 * interval when the countdown finishes, ensuring resources aren’t wasted.
 * See the JS timing documentation for details on `setInterval` and
 * `clearInterval`【319188086104034†L58-L64】.
 */

// Immediately invoked function expression to encapsulate local variables
(function() {
  /**
   * Initialise timers on all cards. Finds every element with the class
   * `card-meta`, extracts the rest time and appends a timer button. If
   * no rest time is found, the card is ignored.
   */
  function setupTimers() {
    // Iterate all metadata spans to find rest durations
    const metaElements = document.querySelectorAll('.card-meta');
    metaElements.forEach(meta => {
      // Skip if a timer button already exists (prevents duplicate buttons)
      if (meta.querySelector('.rest-btn')) return;
      const text = meta.textContent;
      // Match patterns like "Rest: 90s" or "Rest: 75–90s" (with en dash or hyphen)
      const match = text.match(/Rest\s*:?\s*([\d]+)(?:[–-]([\d]+))?\s*s/i);
      if (!match) return;
      // Use the second number if present (range), otherwise the first
      const upper = match[2] || match[1];
      const seconds = parseInt(upper, 10);
      if (isNaN(seconds)) return;
      // Create the button element
      const btn = document.createElement('button');
      btn.className = 'rest-btn';
      btn.setAttribute('data-seconds', seconds);
      btn.textContent = `Start ${seconds}s`;
      // Attach click handler
      btn.addEventListener('click', () => startTimer(btn));
      // Insert a small separator before the button for spacing
      const spacer = document.createTextNode(' ');
      meta.appendChild(spacer);
      meta.appendChild(btn);
    });
  }

  /**
   * Start a rest timer on the given button. Updates the button’s text
   * every second to show remaining time and disables it until the
   * countdown completes. When finished, the button displays "Rest over!"
   * and becomes clickable again.
   * @param {HTMLButtonElement} btn – the button that triggered the timer
   */
  function startTimer(btn) {
    const duration = parseInt(btn.getAttribute('data-seconds'), 10);
    if (isNaN(duration)) return;
    let remaining = duration;
    // Clear any existing timer on this button
    if (btn._intervalId) {
      clearInterval(btn._intervalId);
    }
    // Disable the button while counting down
    btn.disabled = true;
    btn.textContent = `${remaining}s`;
    btn.classList.add('active-timer');
    btn._intervalId = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        btn.textContent = `${remaining}s`;
      } else {
        clearInterval(btn._intervalId);
        btn.textContent = 'Rest over!';
        btn.disabled = false;
        btn.classList.remove('active-timer');
      }
    }, 1000);
  }

  // Expose public API on global window
  window.timer = {
    setupTimers
  };
})();