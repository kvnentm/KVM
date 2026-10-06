document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  // 1. Custom Cursor Logic
  const cursor = document.getElementById("custom-cursor");
  const heroArea = document.querySelector(".hero-cursor-area");

  if (cursor && heroArea && window.innerWidth > 992) {
    // QuickTo for smooth tracking
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.3, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.3, ease: "power3" });

    // Move cursor tracking
    window.addEventListener("mousemove", (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    });

    // Enter hero area -> scale up
    heroArea.addEventListener("mouseenter", () => {
      gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" });
    });

    // Leave hero area -> scale down
    heroArea.addEventListener("mouseleave", () => {
      gsap.to(cursor, { scale: 0, opacity: 0, duration: 0.3, ease: "power3.in" });
    });
  }

  // 2. Text Split Animations
  const splitElements = document.querySelectorAll('.split-text-anim');
  splitElements.forEach(el => {
    const text = new SplitType(el, { types: 'lines, words', lineClass: 'line' });
    gsap.from(text.words, {
      scrollTrigger: { trigger: el, start: 'top 85%' },
      y: '100%', opacity: 0, duration: 0.8, stagger: 0.02, ease: 'power3.out'
    });
  });

  // 3. Horizontal Scroll Section & SVG drawing
  const horizontalSection = document.querySelector('.horizontal-section');
  const track = document.querySelector('.track');
  
  if (horizontalSection && track) {
    const getScrollAmount = () => -(track.scrollWidth - window.innerWidth);
    
    const tween = gsap.to(track, {
      x: getScrollAmount,
      ease: "none"
    });

    ScrollTrigger.create({
      trigger: horizontalSection,
      start: "top top",
      end: () => `+=${getScrollAmount() * -1}`,
      pin: true,
      animation: tween,
      scrub: 1,
      invalidateOnRefresh: true
    });

    // SVG Drawing Animation inside Horizontal Scroll
    const svgPaths = document.querySelectorAll('.svg-draw path');
    svgPaths.forEach(path => {
      const length = path.getTotalLength() || 500;
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      
      gsap.to(path, {
        scrollTrigger: {
          trigger: path.closest('.h-slide'),
          containerAnimation: tween, // Ties this animation to the horizontal scroll!
          start: "left center",
          toggleActions: "play none none reverse"
        },
        strokeDashoffset: 0,
        duration: 1.5,
        ease: "power2.inOut"
      });
    });
  }

  // 4. Use Case Image Reveals
  const useCaseWrappers = document.querySelectorAll('.use-case-img-wrapper');
  useCaseWrappers.forEach(wrapper => {
    gsap.to(wrapper, {
      scrollTrigger: {
        trigger: wrapper,
        start: "top 90%",
        end: "top 40%",
        scrub: 1
      },
      clipPath: "inset(0% 0% 0% 0%)",
      ease: "none"
    });
  });

});
