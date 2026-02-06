// Styles for the subtle beam/shine overlay and interactive hover behavior.
// Uses a hybrid approach: a subtle box-shadow + an animated beam overlay
// that extends slightly outside the card so the effect lights the border.
// Respects prefers-reduced-motion.
const _styles = `
/* interactive card baseline */
.interactive-card {
  position: relative; /* needed for overlay */
  transition: box-shadow 180ms ease, transform 180ms ease;
}

/* visual hover without changing box model to avoid layout shift */
.interactive-card:hover {
  box-shadow: 0 8px 22px rgba(0,0,0,0.08), 0 0 0 6px rgba(255,255,255,0.02) inset;
}

/* selected cards visual treatment uses box-shadow instead of border-width change */
.interactive-card.selected {
  box-shadow: 0 10px 26px rgba(0,124,255,0.08), 0 0 0 6px rgba(255,255,255,0.02) inset;
}

/* card-shine overlay: positioned to overflow slightly so it lights the border */
.card-shine { position: absolute; inset: -4px; border-radius: inherit; overflow: visible; pointer-events: none; z-index: 50; }
.card-shine .card-beam {
  position: absolute;
  top: -40%;
  left: -20%;
  width: 140%;
  height: 180%;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.14) 45%, rgba(255,255,255,0) 60%);
  transform: rotate(-12deg);
  opacity: 1;
  mix-blend-mode: screen;
  pointer-events: none;
  animation: card-beam-anim 3500ms linear infinite;
}

@keyframes card-beam-anim {
  0% { transform: translateX(-100%) rotate(-12deg); }
  50% { transform: translateX(0%) rotate(-12deg); }
  100% { transform: translateX(100%) rotate(-12deg); }
}

@media (prefers-reduced-motion: reduce) {
  .card-shine .card-beam { animation: none; opacity: 0.06; }
  .interactive-card:hover { box-shadow: none; }
}
/* blur overlay hover effect */
.card-with-blur:hover .blur-overlay {
  backdrop-filter: none;
  background: transparent;
}
/* When a card is flipped, ensure the front is fully hidden and only the back is visible */
.card-inner.is-flipped .card-front { visibility: hidden; opacity: 0; transform: rotateY(0deg); }
.card-inner.is-flipped .card-back { visibility: visible; opacity: 1; transform: rotateY(180deg); }
.card-front, .card-back { -webkit-backface-visibility: hidden; backface-visibility: hidden; }
.card-front { z-index: 2; }
.card-back { z-index: 1; }
`;

// Enhance: enforce fixed heights on grid children and ensure flip happens in-place
const _postFix = `
.day-grid > * { height: var(--common-card-height) !important; min-height: var(--common-card-height) !important; max-height: var(--common-card-height) !important; }
.day-grid > * .card-inner { height: 100% !important; width: 100% !important; display: flex !important; align-items: center !important; justify-content: center !important; }
.day-grid > * .card-front, .day-grid > * .card-back { position: absolute !important; inset: 0 !important; height: 100% !important; width: 100% !important; display:flex !important; align-items:center !important; justify-content:center !important; }
.day-grid > * .card-inner { transform-origin: center center !important; -webkit-transform-origin: center center !important; }
.card-inner.is-flipped .card-front { pointer-events: none; opacity: 0; }
.card-inner.is-flipped .card-back { pointer-events: auto; opacity: 1; }
`;

export function injectDaySidebarStyles() {
  if (typeof document !== 'undefined') {
    try {
      const id2 = 'day-sidebar-card-shine-styles-postfix';
      if (!document.getElementById(id2)) {
        const s2 = document.createElement('style');
        s2.id = id2;
        s2.innerHTML = _postFix;
        document.head.appendChild(s2);
      }
    } catch (e) {}
  }

  // Inject styles when module is imported (simple client-side injection)
  if (typeof document !== 'undefined') {
    try {
      const id = 'day-sidebar-card-shine-styles';
      if (!document.getElementById(id)) {
        const s = document.createElement('style');
        s.id = id;
        s.innerHTML = _styles;
        document.head.appendChild(s);
      }
    } catch (e) {}
  }
}