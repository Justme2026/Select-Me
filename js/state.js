/* ============================================================
   STATE — Shared mutable state across all JS modules
   All other modules read/write these via the exported object.
   ============================================================ */

const State = {
  cells:       [],    // Array of cell DOM elements
  interval:    null,  // Active setTimeout handle
  pinnedCell:  null,  // Index of pinned cell, or null
  roundCount:  0,     // Cumulative completed rounds (for history log)
  isRunning:   false, // True while countdown or scan is active
  activeMode:  'scanner', // 'scanner' | 'flip'
};
