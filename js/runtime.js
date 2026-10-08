/* Use the browser's animation cadence; never add a second scroll RAF loop. */
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let lenis;
  const tick = time => lenis?.raf(time * 1000);

  function syncScroll() {
    if (!window.gsap || !window.Lenis || !window.ScrollTrigger) return;
    gsap.ticker.remove(tick);
    if (reducedMotion.matches) {
      lenis?.destroy();
      lenis = null;
      return;
    }
    if (!lenis) {
      lenis = new Lenis({ autoRaf: false, syncTouch: false });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.lagSmoothing(0);
    }
    if (!document.hidden) gsap.ticker.add(tick);
  }
  reducedMotion.addEventListener('change', syncScroll);
  document.addEventListener('visibilitychange', syncScroll);
  syncScroll();

  const background = document.querySelector('.background[data-us-project]');
  if (!background) return;
  let scene;
  let loading = false;
  let failed = false;
  // Mobile Safari ignores the SVG plum filter on canvas, so touch devices keep
  // the static plum CSS gradient instead of the (blue) animated scene.
  const touch = matchMedia('(pointer: coarse)').matches;

  function syncBackground() {
    if (scene) {
      scene.paused = document.hidden || reducedMotion.matches;
      return;
    }
    if (touch || loading || failed || document.hidden || reducedMotion.matches) return;
    loading = true;
    background.id ||= 'ambient-background';

    const initialize = () => {
      // The existing v1.5.3 SDK supports explicit fps, scale, dpi and pause.
      // Lower pixel count keeps the soft gradient affordable at high refresh rates.
      UnicornStudio.addScene({
        elementId: background.id,
        projectId: background.dataset.usProject,
        fps: 120,
        dpi: 1,
        scale: 0.75,
        fixed: true,
        interactivity: { mouse: { disableMobile: true } }
      }).then(result => {
        scene = result;
        loading = false;
        syncBackground();
      }).catch(() => { loading = false; failed = true; });
    };

    if (window.UnicornStudio?.addScene) return initialize();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.5.3/dist/unicornStudio.umd.js';
    script.async = true;
    script.onload = initialize;
    // The plum CSS gradient remains visible if the external scene cannot load.
    script.onerror = () => { loading = false; failed = true; };
    document.head.appendChild(script);
  }
  document.addEventListener('visibilitychange', syncBackground);
  reducedMotion.addEventListener('change', syncBackground);
  const startBackground = () => {
    if ('requestIdleCallback' in window) requestIdleCallback(syncBackground, { timeout: 1500 });
    else setTimeout(syncBackground, 0);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startBackground, { once: true });
  else startBackground();
})();
