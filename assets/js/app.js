/**
 * app.js — Main Application & Bento Navigation Logic
 * Ibnu Hamdun (airseen1 / ibnuwu) Portfolio
 */

'use strict';

// --- Modal Controller (About & Skills Drawer) ---
function setupInfoModal() {
  const infoBtn = document.getElementById('nav-info-btn');
  const modal = document.getElementById('about-modal');
  const closeBtn = document.getElementById('about-close');

  if (!modal) return;

  const openModal = () => {
    modal.classList.remove('modal-hidden');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.add('modal-hidden');
    document.body.style.overflow = '';
  };

  if (infoBtn) {
    infoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal();
    });
  }

  // Click on backdrop overlay outside container to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('modal-hidden')) {
      closeModal();
    }
  });
}

// --- Smooth Navigation with Sticky Nav Offset ---
function setupSmoothNavigation() {
  const navLinks = document.querySelectorAll('a[href^="#"]');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const navOffset = 76; // Accommodate floating pill nav
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// --- Ambient Background Glow ---
function setupAmbientGlow() {
  // Only enable on fine pointer devices (desktop/mouse)
  if (window.matchMedia('(pointer: fine)').matches) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(155, 109, 255, 0.07) 0%, rgba(155, 109, 255, 0) 70%);
      pointer-events: none;
      z-index: 0;
      transform: translate3d(-200px, -200px, 0);
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(glow);

    let rafId = null;
    document.addEventListener('mousemove', (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        glow.style.transform = `translate3d(${e.clientX - 200}px, ${e.clientY - 200}px, 0)`;
      });
    }, { passive: true });
  }
}

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', () => {
  setupInfoModal();
  setupSmoothNavigation();
  setupAmbientGlow();
});
