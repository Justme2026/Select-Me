/* ============================================================
   HISTORY — Session log panel (last 5 rounds)
   Depends on: state.js
   ============================================================ */

const MAX_HISTORY = 5;

/**
 * Append a round result to the session log panel.
 * Uses the active mode's panel (scanner or flip).
 *
 * @param {string} winnerNums - Formatted winner cell numbers, e.g. "3 · 7 · 12"
 * @param {number} cellTotal  - Total cells/cards in the round
 */
function logHistory(winnerNums, cellTotal, mode = State.activeMode) {
  State.roundCount++;

  const isFlip  = mode === 'flip';
  const isSquad = mode === 'squad';
  const isCoin  = mode === 'coin';

  const panelId = isCoin ? 'coin-history-panel' : isFlip ? 'flip-history-panel' : isSquad ? 'squad-history-panel' : 'history-panel';
  const listId  = isCoin ? 'coin-history-list' : isFlip ? 'flip-history-list' : isSquad ? 'squad-history-list' : 'history-list';
  const emptyId = isCoin ? 'coin-history-empty' : isFlip ? 'flip-history-empty' : isSquad ? 'squad-history-empty' : 'history-empty';

  const panel = document.getElementById(panelId);
  const list  = document.getElementById(listId);
  const empty = document.getElementById(emptyId);

  panel.style.display = 'block';
  empty.style.display = 'none';

  const existing = list.querySelectorAll('.history-item');
  if (existing.length >= MAX_HISTORY) {
    existing[existing.length - 1].remove();
  }

  const li   = document.createElement('li');
  li.className = 'history-item';

  const now  = new Date();
  const time = now.toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const unitLabel = isCoin ? 'choices' : isFlip ? 'cards' : isSquad ? 'members' : 'cells';

  li.innerHTML = `
    <span class="history-round">R${State.roundCount}</span>
    <span class="history-winners"></span>
    <span class="history-meta">${cellTotal} ${unitLabel} · ${time}</span>
  `;
  li.querySelector('.history-winners').textContent = winnerNums;

  list.prepend(li);
}
