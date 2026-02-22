/* ============================================================
   GRID — Build grid, reset, handle cell interactions
   Depends on: state.js, ui.js
   ============================================================ */

/**
 * Fisher-Yates shuffle of an array in place.
 * @param {Array} arr
 * @returns {Array}
 */
function fisherYates(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Flash all cells briefly and reassign shuffled numbers.
 * Returns a Promise that resolves after the flash completes.
 */
function shuffleNumbers() {
  const nums = fisherYates(State.cells.map(c => c.textContent));
  State.cells.forEach((c, i) => {
    c.classList.add('reshuffling');
    setTimeout(() => {
      c.textContent = nums[i];
      c.classList.remove('reshuffling');
    }, 120);
  });
  return new Promise(res => setTimeout(res, 260));
}

/**
 * Handle a single click on a cell:
 *  - Pinned cell  → unpin it
 *  - Normal cell  → pin it (previous pin removed first)
 */
function handleCellClick(i) {
  const c = State.cells[i];

  if (c.classList.contains('selected') || c.classList.contains('active')) return;

  const pinBtn = document.getElementById('btn-clear-pin');

  if (c.classList.contains('pinned')) {
    c.classList.remove('pinned');
    State.pinnedCell = null;
    pinBtn.style.display = 'none';
    setStatus(`${State.cells.length} CELLS INITIALIZED — READY`, true);
  } else {
    if (State.pinnedCell !== null) {
      State.cells[State.pinnedCell].classList.remove('pinned');
    }
    c.classList.add('pinned');
    State.pinnedCell = i;
    pinBtn.style.display = 'inline-flex';
    setStatus(`CELL ${i + 1} PINNED — WILL WIN`, true);
  }
}

/**
 * Build the grid from the current cell-count input value.
 * Numbers are shuffled immediately on creation.
 */
function createGrid() {
  clearTimeout(State.interval);
  clearInterval(State.interval);
  State.pinnedCell = null;

  const input = document.getElementById('count');
  const num   = parseInt(input.value);

  if (!num || num < 1) {
    shakeInput(input);
    setStatus('INVALID INPUT — ENTER A NUMBER ≥ 1');
    return;
  }

  document.getElementById('grid').innerHTML = '';
  document.getElementById('winner-banner').classList.remove('show');
  document.getElementById('cell-legend').style.display = 'flex';
  document.getElementById('btn-clear-pin').style.display = 'none';
  setRunning(false);
  setResetEnabled(false);
  State.cells = [];

  const cols = Math.ceil(Math.sqrt(num));
  const grid = document.getElementById('grid');
  grid.style.gridTemplateColumns = `repeat(${cols}, 90px)`;

  // Generate shuffled numbers up front
  const numbers = fisherYates(Array.from({ length: num }, (_, i) => i + 1));

  numbers.forEach((n, i) => {
    const div = document.createElement('div');
    div.className = 'cell reveal';
    div.style.animationDelay = `${i * 30}ms`;
    div.textContent = n;

    const idx = i;
    div.addEventListener('click', () => handleCellClick(idx));

    grid.appendChild(div);
    State.cells.push(div);
  });

  setStatus(`${State.cells.length} CELLS INITIALIZED — READY`, true);
}

/**
 * Clear the currently pinned cell.
 */
function clearPin() {
  if (State.pinnedCell === null) return;
  State.cells[State.pinnedCell].classList.remove('pinned');
  State.pinnedCell = null;
  document.getElementById('btn-clear-pin').style.display = 'none';
  setStatus(`${State.cells.length} CELLS INITIALIZED — READY`, true);
}

/**
 * Reset the grid to its ready state without rebuilding.
 */
function resetGrid() {
  clearTimeout(State.interval);
  clearInterval(State.interval);
  State.pinnedCell = null;

  State.cells.forEach(c =>
    c.classList.remove('selected', 'active', 'pinned', 'excluded')
  );

  document.getElementById('winner-banner').classList.remove('show');
  document.getElementById('btn-clear-pin').style.display = 'none';
  setRunning(false);
  setResetEnabled(false);
  setStatus(`${State.cells.length} CELLS INITIALIZED — READY`, true);
}
