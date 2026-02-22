/* ============================================================
   COUNTDOWN — 3 → 2 → 1 → GO overlay before scan starts
   ============================================================ */

const COUNTDOWN_STEP_MS = 900; // duration per number
const COUNTDOWN_EXIT_MS = 700; // pause after GO before hiding

/**
 * Show a fullscreen countdown overlay (3, 2, 1, GO),
 * then call `callback` when it finishes.
 *
 * @param {Function} callback - Called after GO disappears
 */
function runCountdown(callback) {
  const overlay = document.getElementById('countdown-overlay');
  const numEl   = document.getElementById('countdown-number');
  const steps   = ['3', '2', '1', 'GO'];
  let i = 0;

  overlay.classList.add('visible');

  function showStep() {
    const isGo = steps[i] === 'GO';
    numEl.classList.toggle('go', isGo);
    numEl.textContent = steps[i];

    // Force animation restart on each step
    numEl.style.animation = 'none';
    void numEl.offsetWidth;
    numEl.style.animation = '';

    i++;

    if (i < steps.length) {
      setTimeout(showStep, COUNTDOWN_STEP_MS);
    } else {
      // After GO, hide overlay and fire callback
      setTimeout(() => {
        overlay.classList.remove('visible');
        callback();
      }, COUNTDOWN_EXIT_MS);
    }
  }

  showStep();
}
