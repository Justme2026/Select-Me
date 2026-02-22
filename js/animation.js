/* ============================================================
   ANIMATION — Scan engine: ramp-down, multi-winner rounds
   Depends on: state.js, ui.js, history.js, countdown.js
   ============================================================ */

/**
 * Entry point — validates state, runs countdown, then starts the scan.
 * Called by the "Initiate" button.
 */
function startAnimation() {
  // Block if already running
  if (State.isRunning) return;

  if (State.cells.length === 0) {
    setStatus('BUILD A GRID FIRST');
    return;
  }

  const winnersInput = parseInt(document.getElementById('winners').value) || 1;
  const eligible = State.cells
    .map((c, i) => i)
    .filter(i => !State.cells[i].classList.contains('excluded'));

  if (eligible.length === 0) {
    setStatus('ALL CELLS EXCLUDED — NOTHING TO SELECT');
    return;
  }

  if (!validateWinnersInput(winnersInput, eligible)) return;

  // Lock UI, reshuffle numbers, then start countdown
  setRunning(true);
  setStatus('RESHUFFLING...', true);

  shuffleNumbers().then(() => {
    runCountdown(() => doStart(winnersInput, eligible));
  });
}

/**
 * Core scan logic. Pre-selects all winners up front, then runs
 * one animated round per winner in sequence.
 *
 * @param {number}   winnersInput - How many winners to pick
 * @param {number[]} eligible     - Indices of non-excluded cells
 */
function doStart(winnersInput, eligible) {
  const numWinners = Math.min(winnersInput, eligible.length);

  // Clear any previous result
  document.getElementById('winner-banner').classList.remove('show');
  State.cells.forEach(c => c.classList.remove('selected', 'active'));
  clearInterval(State.interval);
  clearTimeout(State.interval);

  // ── Pre-select winners ─────────────────────────────────────
  // Pinned cell always wins first (if set); rest are random.
  const winners = [];
  let pool = [...eligible];

  if (State.pinnedCell !== null && pool.includes(State.pinnedCell)) {
    winners.push(State.pinnedCell);
    pool = pool.filter(i => i !== State.pinnedCell);
  }

  while (winners.length < numWinners && pool.length > 0) {
    const pick = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    winners.push(pick);
  }

  let round = 0;

  // ── Round runner ───────────────────────────────────────────
  function runRound() {
    if (round >= winners.length) return;

    const winnerIndex = winners[round];

    // Pool for this round = eligible cells not yet selected
    const roundPool = eligible.filter(
      i => !State.cells[i].classList.contains('selected')
    );

    // Steps: enough full cycles so the ramp-down lands on the winner
    const fullCycles  = Math.floor(Math.random() * 2) + 2;
    const totalSteps  = fullCycles * roundPool.length + roundPool.indexOf(winnerIndex) + 1;
    const rampSteps   = Math.min(roundPool.length * 2, Math.floor(totalSteps * 0.45));
    const rampStart   = totalSteps - rampSteps;

    // Speed: later rounds are slightly faster to maintain momentum
    const { minDelay, maxDelay: baseMax } = getSpeedConfig();
    const maxDelay = round === 0 ? baseMax : Math.round(baseMax * 0.75);

    let step = 0;
    const winnerPosInPool = roundPool.indexOf(winnerIndex);

    setStatus(`SCANNING — WINNER ${round + 1} OF ${numWinners}...`, true);

    // ── Tick ────────────────────────────────────────────────
    function tick() {
      // Work backwards: calculate which cell should be active
      // so the very last step lands exactly on winnerIndex
      const stepsLeft = totalSteps - step;
      const pos = ((winnerPosInPool - stepsLeft) % roundPool.length + roundPool.length) % roundPool.length;
      const currentIndex = roundPool[pos];

      // Update active cell (preserve already-selected cells)
      State.cells.forEach(c => {
        if (!c.classList.contains('selected')) c.classList.remove('active');
      });
      State.cells[currentIndex].classList.add('active');
      step++;

      // ── End of round ──────────────────────────────────────
      if (step >= totalSteps) {
        const endDelay = minDelay + (maxDelay - minDelay);

        setTimeout(() => {
          State.cells.forEach(c => {
            if (!c.classList.contains('selected')) c.classList.remove('active');
          });
          State.cells[winnerIndex].classList.add('selected');
          round++;

          // Update winner banner (accumulates numbers as rounds progress)
          const winNums = winners.slice(0, round)
            .map(i => State.cells[i].textContent)
            .join('  ·  ');

          document.getElementById('winner-label').textContent =
            round === numWinners ? 'Winners' : `Winner ${round} of ${numWinners}`;
          document.getElementById('winner-num').textContent = winNums;
          document.getElementById('winner-banner').classList.add('show');

          if (round < numWinners) {
            // Pause briefly then run next round
            setTimeout(runRound, 800);
          } else {
            // All done — unlock UI
            const finalNums = winners
              .map(i => State.cells[i].textContent)
              .join(' · ');
            setStatus(`${numWinners} WINNER${numWinners > 1 ? 'S' : ''} SELECTED`, true);
            logHistory(finalNums, State.cells.length);
            setRunning(false);
            setResetEnabled(true);
          }
        }, endDelay + 80);

        return;
      }

      // ── Speed ramp-down ───────────────────────────────────
      let delay = minDelay;

      if (step >= rampStart) {
        const t      = (step - rampStart) / rampSteps; // 0 → 1
        const eased  = t * t * t;                       // cubic ease-in
        delay = minDelay + (maxDelay - minDelay) * eased;

        if (t > 0.5) setStatus(`LOCKING IN WINNER ${round + 1}...`, true);
      }

      State.interval = setTimeout(tick, delay);
    }

    tick();
  }

  runRound();
}
