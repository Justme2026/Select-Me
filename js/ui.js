/* ============================================================
   UI — Helpers for status bar, buttons, speed config
   ============================================================ */

/**
 * Switch between scanner, flip, squad, and coin modes.
 * Moves the sliding indicator, updates tab states, swaps panels.
 * @param {string} mode - 'scanner' | 'flip' | 'squad' | 'coin'
 */
function switchMode(mode) {
  if (State.activeMode === mode) return;
  State.activeMode = mode;

  const indicator = document.getElementById('tab-indicator');
  const tabBtns   = document.querySelectorAll('.tab-btn');
  const panels    = document.querySelectorAll('.mode-panel');

  // Update tab active states
  tabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  // Percentage positioning stays aligned when the viewport changes.
  const idx = Array.from(tabBtns).findIndex(btn => btn.dataset.mode === mode);
  indicator.style.left = `calc(4px + (100% - 8px) * ${Math.max(0, idx)} / ${tabBtns.length})`;

  // Update indicator color class
  indicator.className = `tab-indicator mode-${mode}`;

  // Swap panels
  panels.forEach(panel => {
    panel.classList.toggle('active', panel.dataset.panel === mode);
  });
}

/**
 * Update the status bar text and active glow state.
 * @param {string}  msg    - Text to display
 * @param {boolean} active - Whether to show the bright "active" style
 */
function setStatus(msg, active = false) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.classList.toggle('active', active);
}

/**
 * Lock or unlock the UI for a running scan.
 * - Disables/enables the Initiate button
 * - Locks/unlocks the speed slider with a visual notice
 * - Sets State.isRunning
 *
 * @param {boolean} running
 */
function setRunning(running) {
  State.isRunning = running;

  const btnStart  = document.querySelector('.btn-start');
  const speedWrap = document.getElementById('speed-group');
  const slider    = document.getElementById('speed');
  const notice    = document.getElementById('speed-lock-notice');

  if (running) {
    btnStart.classList.add('disabled');
    btnStart.setAttribute('aria-disabled', 'true');
    slider.setAttribute('disabled', '');
    if (notice)    notice.style.display = 'block';
    if (speedWrap) speedWrap.classList.add('locked');
  } else {
    btnStart.classList.remove('disabled');
    btnStart.removeAttribute('aria-disabled');
    slider.removeAttribute('disabled');
    if (notice)    notice.style.display = 'none';
    if (speedWrap) speedWrap.classList.remove('locked');
  }
}

/**
 * Enable or disable the Reset button.
 * @param {boolean} enabled
 */
function setResetEnabled(enabled) {
  document.getElementById('btn-reset').classList.toggle('enabled', enabled);
}

/**
 * Sync the speed readout label to the current slider value.
 * Called via oninput on the range input.
 */
function updateSpeedLabel() {
  document.getElementById('speed-val').textContent =
    document.getElementById('speed').value;
}

/**
 * Convert the speed slider value (1–10) into timing config.
 * Speed 1  → slow  (minDelay 180ms, maxDelay 900ms)
 * Speed 10 → fast  (minDelay  36ms, maxDelay 522ms)
 *
 * @returns {{ minDelay: number, maxDelay: number }}
 */
function getSpeedConfig() {
  const s = parseInt(document.getElementById('speed').value);
  const minDelay = Math.round(180 - (s - 1) * 16);
  const maxDelay = Math.round(900 - (s - 1) * 42);
  return { minDelay, maxDelay };
}

/**
 * Shake an input element and flash its error border.
 * @param {HTMLElement} input
 */
function shakeInput(input) {
  input.classList.remove('error');
  void input.offsetWidth;
  input.classList.add('error');
  setTimeout(() => input.classList.remove('error'), 500);
}

/**
 * Validate the Winners input against the eligible pool size.
 * Shakes input and shows a specific status message if invalid.
 *
 * @param {number}   winnersInput - Parsed value from the winners input
 * @param {number[]} eligible     - Eligible cell indices
 * @returns {boolean} true if valid
 */
function validateWinnersInput(winnersInput, eligible) {
  const input = document.getElementById('winners');

  if (!winnersInput || winnersInput < 1) {
    shakeInput(input);
    setStatus('WINNERS MUST BE AT LEAST 1');
    return false;
  }

  if (winnersInput > eligible.length) {
    shakeInput(input);
    setStatus(`TOO MANY WINNERS — MAX ${eligible.length} FOR THIS GRID`, true);
    return false;
  }

  return true;
}
