/* Tech Toss — the first choice is intentionally selected on every launch. */
const CoinState = { isRunning: false, timers: [] };

function clearCoinTimers() {
  CoinState.timers.forEach(clearTimeout);
  CoinState.timers = [];
}

function setCoinRunning(running) {
  CoinState.isRunning = running;
  document.getElementById('btn-coin-launch').disabled = running;
  document.getElementById('coin-choice-one').disabled = running;
  document.getElementById('coin-choice-two').disabled = running;
  document.getElementById('coin-stage').setAttribute('aria-busy', String(running));
}

function launchCoin() {
  if (CoinState.isRunning) return;
  const firstInput = document.getElementById('coin-choice-one');
  const secondInput = document.getElementById('coin-choice-two');
  const choices = [firstInput.value.trim(), secondInput.value.trim()];
  const status = document.getElementById('coin-status');

  if (choices.some(choice => !choice)) {
    status.textContent = 'ENTER BOTH CHOICES TO LAUNCH';
    (choices[0] ? secondInput : firstInput).focus();
    return;
  }

  clearCoinTimers();
  const stage = document.getElementById('coin-stage');
  stage.classList.remove('tossing', 'landed');
  document.getElementById('coin-result').hidden = true;
  document.getElementById('coin-face-one').textContent = choices[0];
  document.getElementById('coin-face-two').textContent = choices[1];
  setCoinRunning(true);

  // Restart the complete toss on every launch, including repeat launches.
  void stage.offsetWidth;
  stage.classList.add('tossing');
  status.textContent = 'LAUNCHING INTO CYBERSPACE...';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reducedMotion ? 800 : 5200;
  if (!reducedMotion) {
    CoinState.timers.push(setTimeout(() => {
      status.textContent = 'SIGNAL IN FLIGHT...';
    }, 1600));
    CoinState.timers.push(setTimeout(() => {
      status.textContent = 'DECODING YOUR DESTINATION...';
    }, 3600));
  }

  CoinState.timers.push(setTimeout(() => {
    stage.classList.remove('tossing');
    stage.classList.add('landed');
    document.getElementById('coin-result-name').textContent = choices[0];
    document.getElementById('coin-result').hidden = false;
    status.textContent = 'SIGNAL LOCKED — CHOICE 01 SELECTED';
    logHistory(choices[0], 2, 'coin');
    clearCoinTimers();
    setCoinRunning(false);
  }, duration));
}

function resetCoin() {
  clearCoinTimers();
  setCoinRunning(false);
  document.getElementById('coin-stage').classList.remove('tossing', 'landed');
  document.getElementById('coin-result').hidden = true;
  document.getElementById('coin-status').textContent = 'READY TO LAUNCH';
}
