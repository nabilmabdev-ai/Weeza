/**
 * Robust marquee with CSS animation + JS fallback.
 * - Waits for fonts (document.fonts.ready) then initializes
 * - Injects keyframes; if CSS animation not applied, uses requestAnimationFrame fallback
 * - Logs helpful debug info to console
 */

(() => {
  const SCROLL_SPEED_PX_PER_SEC_DEFAULT = 80;
  const STYLE_ID = 'dynamic-marquee-styles';
  const KEYFRAMES_NAME = 'dynamic-marquee-scroll';
  const MAX_CLONES = 800;

  // debug helper
  const debug = (...args) => {
    if (window.location.search.includes('marqueeDebug')) console.log('[marquee]', ...args);
  };

  // clean previous style
  const removeOldStyle = () => {
    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();
  };

  const injectKeyframes = (distance) => {
    removeOldStyle();
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.innerHTML = `
      @keyframes ${KEYFRAMES_NAME} {
        from { transform: translateX(0); }
        to { transform: translateX(-${distance}px); }
      }
    `;
    document.head.appendChild(style);
  };

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // JS fallback animator using requestAnimationFrame
  function createJsAnimator(el, distance, speedPxPerSec) {
    let start = null;
    let paused = false;
    let currentOffset = 0;

    const step = (ts) => {
      if (paused) { start = ts; requestAnimationFrame(step); return; }
      if (!start) start = ts;
      const delta = (ts - start) / 1000; // seconds
      start = ts;
      currentOffset += speedPxPerSec * delta;
      if (currentOffset >= distance) {
        // reset by exact amount to avoid drifting
        currentOffset -= distance;
      }
      el.style.transform = `translateX(${-currentOffset}px)`;
      requestAnimationFrame(step);
    };

    const api = {
      start() { paused = false; requestAnimationFrame(step); },
      pause() { paused = true; },
      stop() { paused = true; el.style.transform = 'none'; },
    };
    return api;
  }

  const setupDynamicMarquee = () => {
    const ticker = document.querySelector('.ticker');
    if (!ticker) { console.warn('Ticker element not found.'); return; }
    const marqueeInner = ticker.querySelector('.marquee-inner');
    if (!marqueeInner) { console.warn('marquee-inner not found.'); return; }

    // gather original children
    const originalItems = Array.from(marqueeInner.children).map(n => n.cloneNode(true));
    if (originalItems.length === 0) { console.warn('No original items inside marquee-inner'); return; }

    // read optional speed from data attribute
    const attrSpeed = parseFloat(ticker.dataset.scrollSpeed || ticker.getAttribute('data-scroll-speed')) || SCROLL_SPEED_PX_PER_SEC_DEFAULT;

    // initialize / re-initialize function
    let jsAnimator = null;
    function initialize() {
      // stop CSS animation & JS animator
      marqueeInner.style.animation = 'none';
      marqueeInner.style.transform = 'none';

      // Force LTR flow inside for consistent scroll measurement (page may be RTL)
      marqueeInner.style.direction = 'ltr';

      // reset content to a single set
      marqueeInner.innerHTML = '';
      originalItems.forEach(n => marqueeInner.appendChild(n.cloneNode(true)));

      // measure
      const containerWidth = Math.max(0, ticker.getBoundingClientRect().width);
      const singleSetWidth = Math.max(0, marqueeInner.scrollWidth);
      debug('measured containerWidth, singleSetWidth', containerWidth, singleSetWidth);

      if (singleSetWidth <= 0 || containerWidth <= 0) {
        console.warn('Marquee measurements invalid (width 0). Will retry after short delay.');
        // try again shortly (fonts/images might still be loading)
        setTimeout(initialize, 120);
        return;
      }

      // duplicate until total width >= 2 * containerWidth (robust)
      const requiredWidth = Math.max(containerWidth * 2, singleSetWidth * 2);
      let safety = 0;
      while (marqueeInner.scrollWidth < requiredWidth && safety < MAX_CLONES) {
        originalItems.forEach(n => marqueeInner.appendChild(n.cloneNode(true)));
        safety++;
      }
      if (safety >= MAX_CLONES) console.warn('Reached clone safety limit.');

      // scroll distance should be width of ONE original set
      const scrollDistance = singleSetWidth;

      // respect reduced motion
      if (prefersReducedMotion) {
        marqueeInner.style.animation = 'none';
        marqueeInner.style.transform = 'none';
        console.log('prefers-reduced-motion active — marquee animation disabled.');
        return;
      }

      // Prepare CSS animation
      const duration = Math.max(0.5, scrollDistance / attrSpeed); // seconds
      injectKeyframes(scrollDistance);
      marqueeInner.style.animation = `${KEYFRAMES_NAME} ${duration}s linear infinite`;
      marqueeInner.style.animationPlayState = 'running';

      // small timeout to let browser register animation; then check if it actually runs
      setTimeout(() => {
        const cs = getComputedStyle(marqueeInner);
        debug('computed animationName, playState:', cs.animationName, cs.animationPlayState);
        const animName = cs.animationName || '';
        if (!animName || animName === 'none' || cs.animationPlayState === 'paused') {
          // CSS animation didn't take — fallback to JS animator
          debug('CSS animation not active — using JS fallback animator.');
          if (jsAnimator) jsAnimator.stop && jsAnimator.stop();
          jsAnimator = createJsAnimator(marqueeInner, scrollDistance, attrSpeed);
          jsAnimator.start();
          // keep a handle so outside controller can pause/resume
          ticker._marqueeJsAnimator = jsAnimator;
        } else {
          // CSS animation is active — ensure no JS transform interfering
          if (jsAnimator) { jsAnimator.stop && jsAnimator.stop(); jsAnimator = null; }
          ticker._marqueeJsAnimator = null;
        }
      }, 50);
    }

    // initial run and setup resize observer
    initialize();

    // debounce helper
    let rt;
    const scheduleInit = () => {
      clearTimeout(rt);
      rt = setTimeout(initialize, 140);
    };

    // observe resize on ticker
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(scheduleInit);
      ro.observe(ticker);
      // store for potential cleanup
      ticker._marqueeResizeObserver = ro;
    } else {
      window.addEventListener('resize', scheduleInit);
      ticker._marqueeResizeObserver = null;
    }

    // IntersectionObserver to pause when out of view
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          const node = e.target;
          const inner = node.querySelector('.marquee-inner');
          if (!inner) return;
          if (e.isIntersecting) {
            // resume JS animator or CSS animation
            if (ticker._marqueeJsAnimator) ticker._marqueeJsAnimator.start();
            inner.style.animationPlayState = 'running';
          } else {
            if (ticker._marqueeJsAnimator) ticker._marqueeJsAnimator.pause();
            inner.style.animationPlayState = 'paused';
          }
        });
      }, { threshold: 0.05 });
      io.observe(ticker);
      ticker._marqueeIntersectionObserver = io;
    }

    // expose API
    ticker._marquee = {
      refresh: initialize,
      destroy: () => {
        if (ticker._marqueeResizeObserver) ticker._marqueeResizeObserver.disconnect();
        if (ticker._marqueeIntersectionObserver) ticker._marqueeIntersectionObserver.disconnect();
        if (ticker._marqueeJsAnimator) ticker._marqueeJsAnimator.stop && ticker._marqueeJsAnimator.stop();
        removeOldStyle();
      }
    };
  };

  // Wait for fonts if available, else wait for window load
  const startWhenReady = () => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        setTimeout(setupDynamicMarquee, 20);
      }).catch(() => {
        window.addEventListener('load', () => setTimeout(setupDynamicMarquee, 20));
      });
    } else {
      window.addEventListener('load', () => setTimeout(setupDynamicMarquee, 20));
    }
  };

  startWhenReady();

  // Small convenience: allow manual init from console: window._marqueeRefresh()
  window._marqueeRefresh = () => {
    const ticker = document.querySelector('.ticker');
    if (ticker && ticker._marquee && typeof ticker._marquee.refresh === 'function') {
      ticker._marquee.refresh();
      console.log('[marquee] manual refresh triggered');
    } else {
      console.warn('[marquee] no marquee to refresh');
    }
  };

})();
