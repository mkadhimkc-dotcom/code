// Simple slider for cards with multiple GIFs
// This script initialises a slider on any element with the class
// `slider-container`. Each direct child image with class `slide` will
// become a slide. Prev/next buttons with classes `.prev` and `.next`
// are used to cycle through the slides. Only one slide is shown at a
// time. The first slide is visible on load.

(() => {
  function setupSliders() {
    const sliders = document.querySelectorAll('.slider-container');
    sliders.forEach((container) => {
      if (container.dataset.sliderReady === 'true') return;

      const slides = container.querySelectorAll('.slide');
      if (!slides || slides.length === 0) return;
      container.dataset.sliderReady = 'true';

      let index = 0;
      // Show the first slide
      slides[index].classList.add('active');
      const prevBtn = container.querySelector('.prev');
      const nextBtn = container.querySelector('.next');
      const showSlide = (newIndex) => {
        slides[index].classList.remove('active');
        index = (newIndex + slides.length) % slides.length;
        slides[index].classList.add('active');
      };
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          showSlide(index - 1);
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          showSlide(index + 1);
        });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', setupSliders);

  window.slider = {
    setupSliders
  };
})();
