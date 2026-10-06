// Initialize Lenis Smooth Scrolling
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
})

// Synchronize Lenis with GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update)

gsap.ticker.add((time)=>{
  lenis.raf(time * 1000)
})

gsap.ticker.lagSmoothing(0)

// Also fix nav color on scroll
const nav = document.querySelector('.navigation');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    nav.style.backgroundColor = 'rgba(248, 248, 248, 0.9)';
    nav.style.color = '#111';
    nav.style.backdropFilter = 'blur(10px)';
  } else {
    nav.style.backgroundColor = 'transparent';
    nav.style.color = 'white'; // Due to mix-blend-mode: difference this acts uniquely
    nav.style.backdropFilter = 'none';
  }
});
