/* Shared animation helpers. Keep layout reads out of pointer/scroll hot paths. */
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function frameTask(callback) {
    let frame = 0;
    let latestArgs;
    return (...args) => {
      latestArgs = args;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        callback(...latestArgs);
      });
    };
  }

  function createNavColors({ nav, navLinks, whiteSections, footer, btnBlocks, logoSvgs, arrowSvgs, ignoreWhite = false }) {
    const visibleSections = new Set();
    let footerVisible = false;
    let previousState;
    let sectionObserver;

    function apply() {
      if (nav.classList.contains('menu-open')) return;
      const onWhite = !ignoreWhite && visibleSections.size > 0 && !footerVisible;
      if (onWhite === previousState) return;
      previousState = onWhite;
      nav.classList.toggle('is-on-white', onWhite);
      const color = onWhite ? '#000' : '#fff';
      const tween = { duration: reducedMotion.matches ? 0 : 0.25, ease: 'power2.out', overwrite: 'auto' };
      gsap.to(navLinks, { ...tween, color });
      gsap.to(logoSvgs, { ...tween, fill: color });
      gsap.to(arrowSvgs, { ...tween, fill: color });
      gsap.to(btnBlocks, { ...tween, backgroundColor: onWhite ? 'rgba(204, 229, 255, 0.35)' : 'rgba(255, 255, 255, 0.1)' });
    }

    function observeSections() {
      sectionObserver?.disconnect();
      visibleSections.clear();
      const height = Math.min(nav.offsetHeight, innerHeight);
      // All measurements precede animation writes, and run only on setup/resize.
      whiteSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= height && rect.bottom >= 0) visibleSections.add(section);
      });
      const footerRect = footer?.getBoundingClientRect();
      footerVisible = !!footerRect && footerRect.top <= innerHeight && footerRect.bottom >= 0;
      sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) visibleSections.add(entry.target);
          else visibleSections.delete(entry.target);
        });
        apply();
      }, { rootMargin: `0px 0px -${Math.max(0, innerHeight - height)}px 0px` });
      if (!ignoreWhite) whiteSections.forEach(section => sectionObserver.observe(section));
      apply();
    }

    if (footer) {
      const footerObserver = new IntersectionObserver(entries => {
        footerVisible = entries[0].isIntersecting;
        apply();
      });
      footerObserver.observe(footer);
    }
    const refresh = frameTask(observeSections);
    window.addEventListener('resize', refresh, { passive: true });
    document.fonts?.ready.then(refresh);
    observeSections();
    return apply;
  }

  function initExpertiseCards() {
    const cards = Array.from(document.querySelectorAll('.about__expertise-container'), card => ({
      card,
      mask: card.querySelector('.about__expertise-mask'),
      paths: Array.from(card.querySelectorAll('.about-expertise__svg svg path, .about-expertise__svg svg line, .about-expertise__svg svg polyline, .about-expertise__svg svg polygon, .about-expertise__svg svg circle, .about-expertise__svg svg rect'), path => ({ path, length: path.getTotalLength() })),
      progress: -1,
      clip: -1
    }));
    if (!cards.length) return;
    cards.forEach(({ paths }) => paths.forEach(({ path, length }) => {
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = reducedMotion.matches ? 0 : length;
    }));
    const clamp = (value, max = 1) => Math.min(max, Math.max(0, value));
    const update = frameTask(() => {
      // Read every card before changing any clip paths or SVG styles.
      const rects = cards.map(({ card }) => card.getBoundingClientRect());
      const offset = innerWidth * 0.042;
      const halfHeight = Math.max(1, innerHeight * 0.5);
      cards.forEach((entry, i) => {
        if (i && cards[i - 1].mask) {
          const previous = cards[i - 1];
          const clip = clamp(rects[i - 1].bottom - rects[i].top - offset, rects[i - 1].height);
          if (clip !== previous.clip) {
            previous.mask.style.clipPath = `inset(0px 0px ${clip}px 0px)`;
            previous.clip = clip;
          }
        }
        const progress = reducedMotion.matches ? 1 : clamp((innerHeight - rects[i].top) / halfHeight);
        if (progress === entry.progress) return;
        entry.progress = progress;
        entry.paths.forEach(({ path, length }) => { path.style.strokeDashoffset = length * (1 - progress); });
      });
    });
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('load', update);
    reducedMotion.addEventListener('change', update);
    update();
  }

  function initHeroCursor() {
    const root = document.querySelector('.button-big');
    const hero = document.querySelector('.home-hero');
    const nav = document.querySelector('.navigation');
    if (!root || !hero) return;
    gsap.set(root, { scale: 0, pointerEvents: 'none' });
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches || reducedMotion.matches) return;
    const setX = gsap.quickTo(root, 'x', { duration: 0.3, ease: 'power3.out' });
    const setY = gsap.quickTo(root, 'y', { duration: 0.3, ease: 'power3.out' });
    let visible = false;
    let overNav = false;
    let active = false;
    let ready = false;
    setTimeout(() => { ready = true; }, 1000);
    const eligible = () => ready && visible && !overNav && !document.hidden && !reducedMotion.matches;
    function setActive(next) {
      if (active === next) return;
      active = next;
      hero.classList.toggle('cursor-replaced', next);
      gsap.to(root, { scale: next ? 1 : 0, duration: next ? 0.5 : 0.4, ease: 'quart.out', overwrite: 'auto' });
    }
    new IntersectionObserver(entries => {
      visible = entries[0].intersectionRatio >= 0.5;
      if (!eligible()) setActive(false);
    }, { threshold: [0, 0.5] }).observe(hero);
    const move = frameTask(event => {
      if (!eligible()) return setActive(false);
      setX(event.clientX);
      setY(event.clientY);
      setActive(true);
    });
    window.addEventListener('pointermove', event => {
      if (eligible()) move(event);
      else setActive(false);
    }, { passive: true });
    nav?.addEventListener('mouseenter', () => { overNav = true; setActive(false); });
    nav?.addEventListener('mouseleave', () => { overNav = false; });
    document.addEventListener('mouseleave', () => setActive(false));
    document.addEventListener('visibilitychange', () => { if (document.hidden) setActive(false); });
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) setActive(false); });
    const href = root.getAttribute('href') || root.dataset.href;
    if (href) hero.addEventListener('click', event => {
      if (eligible() && !event.target.closest('a, button, input, textarea, select, label')) window.location.href = href;
    });
  }

  window.SiteMotion = { frameTask, createNavColors, initExpertiseCards, initHeroCursor };
})();
