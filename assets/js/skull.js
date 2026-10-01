/**
 * skull.js — Interactive Pixel Art Skull Mascot
 * Monochrome purple pixel skull with subtle animations
 * airseen1 Portfolio
 */

'use strict';

(function () {
  const PURPLE = '#9b6dff';
  const TRANSPARENT = 'transparent';

  // 16x16 pixel skull design — original mascot
  // 0 = transparent, 1 = filled
  const SKULL_MAP = [
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,1,1,0,0,1,1,1,0,0,1,1,1,0,0],
    [0,0,1,1,0,0,1,1,1,0,0,1,1,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,0,1,1,1,1,1,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,0,1,1,1,0,1,0,0,0,0,0],
    [0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ];

  // Blink frame — eyes closed
  const SKULL_BLINK = [
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,1,1,0,0,1,1,1,0,0,1,1,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,0,1,1,1,1,1,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,0,1,1,1,0,1,0,0,0,0,0],
    [0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ];

  // Particles
  const MAX_PARTICLES = 8;
  let particles = [];
  
  // State
  let isBlinking = false;
  let floatOffset = 0;
  let tiltX = 0;
  let tiltY = 0;
  let targetTiltX = 0;
  let targetTiltY = 0;
  let mouseX = 0;
  let mouseY = 0;
  let isHovering = false;
  let animFrame = null;

  class Particle {
    constructor(canvasW, canvasH) {
      this.reset(canvasW, canvasH);
    }

    reset(canvasW, canvasH) {
      const centerX = canvasW / 2;
      const centerY = canvasH / 2;
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 25;
      this.x = centerX + Math.cos(angle) * dist;
      this.y = centerY + Math.sin(angle) * dist;
      this.size = 1 + Math.random() * 1.5;
      this.life = 0;
      this.maxLife = 60 + Math.random() * 80;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = -0.2 - Math.random() * 0.4;
      this.alive = true;
    }

    update() {
      this.life++;
      this.x += this.vx;
      this.y += this.vy;
      if (this.life >= this.maxLife) {
        this.alive = false;
      }
    }

    getAlpha() {
      const progress = this.life / this.maxLife;
      if (progress < 0.2) return progress * 5;
      if (progress > 0.7) return (1 - progress) / 0.3;
      return 1;
    }
  }

  function initSkull() {
    const canvas = document.getElementById('skull-canvas');
    if (!canvas) return;
    
    const container = document.getElementById('skull-container');
    if (!container) return;

    const ctx = canvas.getContext('2d');
    
    // Get actual display size from CSS
    function updateCanvasSize() {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Initialize particles
    function initParticles() {
      const rect = container.getBoundingClientRect();
      particles = [];
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = new Particle(rect.width, rect.height);
        p.life = Math.random() * p.maxLife; // Stagger initial life
        particles.push(p);
      }
    }

    initParticles();

    // Blink logic — random intervals
    function scheduleBlink() {
      const delay = 2500 + Math.random() * 4000;
      setTimeout(() => {
        isBlinking = true;
        setTimeout(() => {
          isBlinking = false;
          scheduleBlink();
        }, 120 + Math.random() * 80);
      }, delay);
    }
    scheduleBlink();

    // Cursor tracking for tilt
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Hover detection
    container.addEventListener('mouseenter', () => { isHovering = true; });
    container.addEventListener('mouseleave', () => { isHovering = false; });

    // Touch support
    container.addEventListener('touchstart', (e) => {
      isHovering = true;
      if (e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
      }
    }, { passive: true });

    container.addEventListener('touchend', () => {
      isHovering = false;
    }, { passive: true });

    // Main render loop
    let time = 0;

    function render() {
      time++;
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Float animation
      floatOffset = Math.sin(time * 0.025) * 3;

      // Calculate tilt based on mouse position relative to skull
      const skullCenterX = rect.left + w / 2;
      const skullCenterY = rect.top + h / 2;
      const dx = mouseX - skullCenterX;
      const dy = mouseY - skullCenterY;
      const maxTilt = isHovering ? 4 : 2;
      targetTiltX = Math.max(-maxTilt, Math.min(maxTilt, dx * 0.008));
      targetTiltY = Math.max(-maxTilt, Math.min(maxTilt, dy * 0.008));

      // Smooth lerp
      tiltX += (targetTiltX - tiltX) * 0.06;
      tiltY += (targetTiltY - tiltY) * 0.06;

      // Draw skull
      const currentMap = isBlinking ? SKULL_BLINK : SKULL_MAP;
      const gridSize = 16;
      const pixelSize = Math.floor(Math.min(w, h) * 0.65 / gridSize);
      const totalW = gridSize * pixelSize;
      const totalH = gridSize * pixelSize;
      const startX = (w - totalW) / 2 + tiltX;
      const startY = (h - totalH) / 2 + floatOffset + tiltY;

      // Skull glow (subtle)
      if (isHovering) {
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.shadowColor = PURPLE;
        ctx.shadowBlur = 30;
        ctx.fillStyle = PURPLE;
        ctx.beginPath();
        ctx.arc(w / 2 + tiltX, h / 2 + floatOffset + tiltY, totalW * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw pixels
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          if (currentMap[row] && currentMap[row][col] === 1) {
            const x = startX + col * pixelSize;
            const y = startY + row * pixelSize;
            
            ctx.fillStyle = PURPLE;
            // Slight alpha variation for texture — very subtle
            const alphaVariation = 0.85 + Math.sin(time * 0.01 + row * 0.5 + col * 0.3) * 0.15;
            ctx.globalAlpha = alphaVariation;
            ctx.fillRect(
              Math.round(x),
              Math.round(y),
              pixelSize,
              pixelSize
            );
          }
        }
      }

      ctx.globalAlpha = 1;

      // Draw particles
      particles.forEach(p => {
        p.update();
        if (!p.alive) {
          p.reset(w, h);
        }

        const alpha = p.getAlpha() * 0.35;
        ctx.fillStyle = PURPLE;
        ctx.globalAlpha = alpha;
        
        // Pixel-perfect square particles
        const pSize = Math.round(p.size);
        ctx.fillRect(
          Math.round(p.x + tiltX * 0.5),
          Math.round(p.y + floatOffset * 0.5 + tiltY * 0.5),
          pSize,
          pSize
        );
      });

      ctx.globalAlpha = 1;

      animFrame = requestAnimationFrame(render);
    }

    render();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    });
  }

  // Init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSkull);
  } else {
    initSkull();
  }
})();
