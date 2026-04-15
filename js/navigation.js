/**
 * navigation.js
 *
 * Handles tab-based navigation for the workout application. Buttons
 * in the nav bar expose a `data-page` attribute indicating which
 * page section to show. When a button is clicked the corresponding
 * page is shown and all others are hidden. Active states are
 * applied to the clicked button and removed from the others. A
 * smooth scroll to the top is also triggered on every page change.
 */

(function() {
  /**
   * Show a page by id and highlight the given button as active.
   *
   * @param {string} pageId – the id of the page element to display
   * @param {HTMLElement} clickedButton – the nav button that triggered the change
   */
  function openPage(pageId, clickedButton) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });
    // Remove active class from all buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    // Show the requested page
    const target = document.getElementById(pageId);
    if (target) {
      target.classList.add('active');
    }
    // Highlight the clicked button
    if (clickedButton) {
      clickedButton.classList.add('active');
    }
    // Scroll smoothly back to the top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Attach click handlers to all navigation buttons. Each button
   * defines a `data-page` attribute matching the id of the page
   * container it controls. When clicked the `openPage` function is
   * invoked with the appropriate arguments.
   */
  function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      const page = btn.getAttribute('data-page');
      btn.addEventListener('click', () => {
        openPage(page, btn);
      });
    });
  }

  // Expose API on the window so other scripts can use it
  window.navigation = {
    openPage,
    setupNavigation
  };
})();