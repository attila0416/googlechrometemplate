function initializeStarParticles() {
  const RANDOM = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
  const particles = document.querySelectorAll('.star');
  particles.forEach(star => {
    star.setAttribute('style', `
      --angle: ${RANDOM(0, 360)};
      --duration: ${RANDOM(6, 20)};
      --delay: ${RANDOM(1, 10)};
      --alpha: ${RANDOM(40, 90) / 100};
      --size: ${RANDOM(2, 6)};
      --distance: ${RANDOM(300, 500)};
    `);
  });
}
