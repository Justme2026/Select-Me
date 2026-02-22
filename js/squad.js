/* ============================================================
   SQUAD — Squad Builder mode logic
   Depends on: state.js, ui.js, history.js
   ============================================================ */

const SquadState = {
  groups:      [],    // Array of arrays of member labels (strings)
  isRunning:   false,
  inputMode:   'number', // 'number' | 'names'
};

/* ---- Helpers ---- */

function setSquadStatus(msg, active = false) {
  const el = document.getElementById('squad-status');
  el.textContent = msg;
  el.classList.toggle('active', active);
}

function setSquadResetEnabled(enabled) {
  document.getElementById('btn-squad-reset').classList.toggle('enabled', enabled);
}

function setSquadRunning(running) {
  SquadState.isRunning = running;
  document.getElementById('btn-squad-generate').classList.toggle('disabled', running);
}

/* ---- Names count live update ---- */

function updateNamesCount() {
  const raw   = document.getElementById('squad-names-input').value;
  const names = parseNames(raw);
  const el    = document.getElementById('names-count');
  if (names.length === 0) {
    el.textContent = '—';
    el.classList.remove('has-names');
  } else {
    el.textContent = `${names.length} NAME${names.length > 1 ? 'S' : ''} DETECTED`;
    el.classList.add('has-names');
  }
}

/* ---- Input mode toggle ---- */

function setSquadInputMode(mode) {
  SquadState.inputMode = mode;

  const numberPanel = document.getElementById('squad-number-inputs');
  const namesPanel  = document.getElementById('squad-names-inputs');
  const btnNum      = document.getElementById('squad-toggle-number');
  const btnNames    = document.getElementById('squad-toggle-names');

  numberPanel.style.display = mode === 'number' ? 'flex' : 'none';
  namesPanel.style.display  = mode === 'names'  ? 'flex' : 'none';

  btnNum.classList.toggle('active',   mode === 'number');
  btnNames.classList.toggle('active', mode === 'names');
}

/* ---- Parse names from textarea ---- */

function parseNames(raw) {
  // Split by newline first, fallback comma detection
  let lines = raw.split('\n').map(s => s.trim()).filter(Boolean);
  if (lines.length <= 1 && raw.includes(',')) {
    lines = raw.split(',').map(s => s.trim()).filter(Boolean);
  }
  return lines;
}

/* ---- Render squads (shared by both modes) ---- */

function renderSquads(numGroups, totalMembers, perGroupMin, perGroupMax) {
  const area = document.getElementById('groups-area');
  area.innerHTML = '';
  document.getElementById('squad-summary').classList.remove('show');
  setSquadResetEnabled(false);
  setSquadRunning(true);
  setSquadStatus('ASSEMBLING SQUADS...', true);

  let cardDelay = 0;
  let allDone   = 0;

  SquadState.groups.forEach((members, gIdx) => {
    const card = document.createElement('div');
    card.className = 'group-card';
    card.style.animationDelay = `${cardDelay}ms`;

    const title = document.createElement('div');
    title.className = 'group-card-title';
    title.textContent = `Squad ${gIdx + 1}`;

    const list = document.createElement('ul');
    list.className = 'member-list';

    card.appendChild(title);
    card.appendChild(list);
    area.appendChild(card);

    // Stagger members flying in
    members.forEach((label, mIdx) => {
      const delay = cardDelay + 300 + mIdx * 120;
      setTimeout(() => {
        const chip = document.createElement('li');
        chip.className = 'member-chip';
        chip.innerHTML = `
          <span class="member-chip-dot"></span>
          <span class="member-chip-label">${label}</span>
        `;
        list.appendChild(chip);
      }, delay);
    });

    // Detect when this card is fully populated
    const lastDelay = cardDelay + 300 + (members.length - 1) * 120 + 350;
    setTimeout(() => {
      allDone++;
      if (allDone === SquadState.groups.length) {
        const sizeNote = perGroupMin === perGroupMax
          ? `${perGroupMin} per squad`
          : `${perGroupMin}–${perGroupMax} per squad`;

        const summary = document.getElementById('squad-summary');
        summary.textContent = `${numGroups} squads · ${totalMembers} members · ${sizeNote}`;
        summary.classList.add('show');

        setSquadStatus(`${numGroups} SQUADS ASSEMBLED — ${totalMembers} MEMBERS TOTAL`, true);
        logHistory(
          SquadState.groups.map((g, i) => `S${i+1}:[${g.join(', ')}]`).join('  '),
          totalMembers
        );
        setSquadRunning(false);
        setSquadResetEnabled(true);
      }
    }, lastDelay);

    cardDelay += 180;
  });
}

/* ---- Generate — Number mode ---- */

function generateByNumbers() {
  const groupsInput  = document.getElementById('squad-groups');
  const membersInput = document.getElementById('squad-members');
  const numGroups = parseInt(groupsInput.value);
  const perGroup  = parseInt(membersInput.value);

  if (!numGroups || numGroups < 2) {
    shakeInput(groupsInput);
    setSquadStatus('NEED AT LEAST 2 SQUADS');
    return false;
  }
  if (!perGroup || perGroup < 1) {
    shakeInput(membersInput);
    setSquadStatus('NEED AT LEAST 1 MEMBER PER SQUAD');
    return false;
  }

  const totalMembers = numGroups * perGroup;
  const pool = fisherYates(Array.from({ length: totalMembers }, (_, i) => `No. ${i + 1}`));

  SquadState.groups = [];
  for (let g = 0; g < numGroups; g++) {
    const slice = pool.slice(g * perGroup, g * perGroup + perGroup);
    if (slice.length > 0) SquadState.groups.push(slice);
  }

  renderSquads(numGroups, totalMembers, perGroup, perGroup);
  return true;
}

/* ---- Generate — Names mode ---- */

function generateByNames() {
  const groupsInput = document.getElementById('squad-groups-names');
  const textarea    = document.getElementById('squad-names-input');
  const numGroups   = parseInt(groupsInput.value);
  const names       = parseNames(textarea.value);

  if (!numGroups || numGroups < 2) {
    shakeInput(groupsInput);
    setSquadStatus('NEED AT LEAST 2 SQUADS');
    return false;
  }
  if (names.length < 2) {
    textarea.classList.remove('error');
    void textarea.offsetWidth;
    textarea.classList.add('error');
    setTimeout(() => textarea.classList.remove('error'), 500);
    setSquadStatus('ENTER AT LEAST 2 NAMES');
    return false;
  }
  if (names.length < numGroups) {
    shakeInput(groupsInput);
    setSquadStatus(`NOT ENOUGH NAMES FOR ${numGroups} SQUADS`);
    return false;
  }

  const shuffled   = fisherYates([...names]);
  const totalMembers = shuffled.length;
  const baseSize   = Math.floor(totalMembers / numGroups);
  const remainder  = totalMembers % numGroups;

  SquadState.groups = [];
  let cursor = 0;
  for (let g = 0; g < numGroups; g++) {
    // First `remainder` groups get one extra — last gets fewer
    const size = g < (numGroups - 1) ? baseSize + (g < remainder ? 1 : 0) : baseSize + (remainder > 0 && g < remainder ? 1 : 0);
    const correctedSize = totalMembers - cursor < baseSize ? totalMembers - cursor : (g < remainder ? baseSize + 1 : baseSize);
    const slice = shuffled.slice(cursor, cursor + correctedSize);
    if (slice.length > 0) SquadState.groups.push(slice);
    cursor += correctedSize;
  }

  const sizes = SquadState.groups.map(g => g.length);
  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);

  renderSquads(numGroups, totalMembers, minSize, maxSize);
  return true;
}

/* ---- Main entry point ---- */

function generateSquads() {
  if (SquadState.isRunning) return;

  if (SquadState.inputMode === 'names') {
    generateByNames();
  } else {
    generateByNumbers();
  }
}

/* ---- Reset ---- */

function resetSquads() {
  SquadState.groups    = [];
  SquadState.isRunning = false;

  document.getElementById('groups-area').innerHTML = '';
  document.getElementById('squad-summary').classList.remove('show');
  setSquadResetEnabled(false);
  setSquadRunning(false);
  setSquadStatus('AWAITING INPUT');
}