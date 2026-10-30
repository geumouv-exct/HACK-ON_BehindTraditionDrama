// Lightweight buildless adaptations of React Bits Animated Content and Spotlight Card.
// https://reactbits.dev/animations/animated-content
// https://reactbits.dev/components/spotlight-card
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && 'IntersectionObserver' in window) {
    const targets = document.querySelectorAll('.home-hero-copy, .home-mode-card, .home-search, .home-hero-stage, .home-section-heading, .home-sample-card, .era-panel, .ai-intro, .ai-tabs, .section-heading, .explorer, .comparison-heading, .comparison-grid, .questions-copy, .questions-box, .sources-section > *, .story-chronology-heading, .story-carousel, .page-context');
    targets.forEach((element, index) => {
      element.classList.add('motion-reveal');
      element.style.setProperty('--reveal-delay', `${Math.min(index % 4, 2) * 80}ms`);
    });
    document.documentElement.classList.add('has-motion');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    targets.forEach((element) => observer.observe(element));
  }

  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced) {
    document.querySelectorAll('.home-hero-card, .home-mode-card, .home-sample-card, .era-panel-trigger, .ai-panel-work, .ai-result, .recommend-carousel-track .ai-recommend-card, .record-panel, .compare-card, .questions-box, .story-slide-visual, .story-slide-card, .story-poster-card-body').forEach((card) => {
      card.classList.add('spotlight-surface');
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
        card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
      });
    });
  }
})();
