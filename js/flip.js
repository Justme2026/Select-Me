/* ============================================================
   FLIP — Flip Your Fate mode logic
   Depends on: state.js, ui.js, history.js
   ============================================================ */

const FlipState = {
  cards:        [],   // Array of { el, number, flipped, isWinner }
  numbers:      [],   // Pre-assigned numbers (shuffled)
  winnersLeft:  0,    // How many picks the user still has
  totalWinners: 0,    // Total winners for this deal
  isDone:       false,
};

/* ---- Helpers ---- */

function setFlipStatus(msg, active = false) {
  const el = document.getElementById('flip-status');
  el.textContent = msg;
  el.classList.toggle('active', active);
}

function setFlipResetEnabled(enabled) {
  document.getElementById('btn-flip-reset').classList.toggle('enabled', enabled);
}

function updatePicksCounter() {
  const el = document.getElementById('flip-picks-counter');
  if (FlipState.winnersLeft <= 0) {
    el.classList.remove('show');
    return;
  }
  el.classList.add('show');
  el.textContent = `${FlipState.winnersLeft} PICK${FlipState.winnersLeft > 1 ? 'S' : ''} REMAINING`;
}

/* ---- Deal cards ---- */

function dealCards() {
  const countInput   = document.getElementById('flip-count');
  const winnersInput = document.getElementById('flip-winners');
  const count   = parseInt(countInput.value);
  const winners = parseInt(winnersInput.value) || 1;

  // Validate count
  if (!count || count < 1) {
    shakeInput(countInput);
    setFlipStatus('INVALID INPUT — ENTER A NUMBER ≥ 1');
    return;
  }

  // Validate winners vs count
  if (winners < 1) {
    shakeInput(winnersInput);
    setFlipStatus('WINNERS MUST BE AT LEAST 1');
    return;
  }

  if (winners > count) {
    shakeInput(winnersInput);
    setFlipStatus(`TOO MANY WINNERS — MAX ${count} FOR THIS DEAL`, true);
    return;
  }

  // Reset state
  FlipState.cards        = [];
  FlipState.isDone       = false;
  FlipState.totalWinners = winners;
  FlipState.winnersLeft  = winners;

  // Pre-assign shuffled numbers
  FlipState.numbers = Array.from({ length: count }, (_, i) => i + 1);
  for (let i = FlipState.numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [FlipState.numbers[i], FlipState.numbers[j]] = [FlipState.numbers[j], FlipState.numbers[i]];
  }

  // Clear previous
  const grid = document.getElementById('card-grid');
  grid.innerHTML = '';
  document.getElementById('flip-winner-banner').classList.remove('show');
  setFlipResetEnabled(false);

  // Build cards
  FlipState.numbers.forEach((num, i) => {
    const card = document.createElement('div');
    card.className = 'card deal';
    card.style.animationDelay = `${i * 50}ms`;
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-back">
          <span class="card-back-icon">🂠</span>
          <span class="card-back-label">Fate</span>
        </div>
        <div class="card-face card-front">
          <span class="card-front-number">${num}</span>
          <span class="card-front-label">No. ${num}</span>
        </div>
      </div>
    `;
    card.addEventListener('click', () => handleCardClick(i));
    grid.appendChild(card);
    FlipState.cards.push({ el: card, number: num, flipped: false, isWinner: false });
  });

  setFlipStatus(`DEAL COMPLETE — PICK ${winners} CARD${winners > 1 ? 'S' : ''}`, true);
  updatePicksCounter();
}

/* ---- Card click ---- */

function handleCardClick(i) {
  const card = FlipState.cards[i];

  // Ignore if already flipped, done, or disabled
  if (card.flipped || FlipState.isDone || FlipState.winnersLeft <= 0) return;

  // Flip it
  card.flipped   = true;
  card.isWinner  = true;
  card.el.classList.add('flipped', 'winner');
  FlipState.winnersLeft--;

  updatePicksCounter();

  // Update winner banner
  const pickedSoFar = FlipState.cards
    .filter(c => c.isWinner)
    .map(c => c.number)
    .join('  ·  ');

  const banner     = document.getElementById('flip-winner-banner');
  const labelEl    = document.getElementById('flip-winner-label');
  const numEl      = document.getElementById('flip-winner-num');
  const pickedCount = FlipState.totalWinners - FlipState.winnersLeft;

  labelEl.textContent = FlipState.winnersLeft === 0
    ? (FlipState.totalWinners > 1 ? 'Your Winners' : 'Your Pick')
    : `Pick ${pickedCount} of ${FlipState.totalWinners}`;

  numEl.textContent = pickedSoFar;
  banner.classList.add('show');

  // All picks used — reveal remaining cards
  if (FlipState.winnersLeft === 0) {
    FlipState.isDone = true;

    // Disable all unflipped cards first
    FlipState.cards.forEach(c => {
      if (!c.flipped) c.el.classList.add('disabled');
    });

    // Stagger-reveal remaining cards
    const unflipped = FlipState.cards.filter(c => !c.flipped);
    unflipped.forEach((c, idx) => {
      setTimeout(() => {
        c.flipped = true;
        c.el.classList.add('flipped', 'revealed');
      }, 300 + idx * 120);
    });

    // Log to shared history after all cards revealed
    setTimeout(() => {
      const winnerNums = FlipState.cards
        .filter(c => c.isWinner)
        .map(c => c.number)
        .join(' · ');
      setFlipStatus('FATE DECIDED', true);
      logHistory(winnerNums, FlipState.cards.length);
      setFlipResetEnabled(true);
    }, 300 + unflipped.length * 120 + 400);
  }
}

/* ---- Reset flip mode ---- */

function resetFlip() {
  FlipState.cards.forEach(c => {
    c.el.classList.remove('flipped', 'winner', 'revealed', 'disabled');
    c.flipped   = false;
    c.isWinner  = false;
  });

  FlipState.winnersLeft = FlipState.totalWinners;
  FlipState.isDone      = false;

  document.getElementById('flip-winner-banner').classList.remove('show');
  setFlipResetEnabled(false);
  setFlipStatus(`DEAL COMPLETE — PICK ${FlipState.totalWinners} CARD${FlipState.totalWinners > 1 ? 'S' : ''}`, true);
  updatePicksCounter();
}
