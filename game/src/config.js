// Shared constants for Twin Tales: Spot the Difference.
// One place for every number the rest of the game agrees on: the logical canvas size,
// the two picture panels, the per-scene clocks, the hint budget and the scoring table.
export const VIEW = { width: 1280, height: 800 };

export const PANEL = {
  width: 560,
  height: 640,
  top: 84,
  leftX: 40,
  rightX: 680,
  labelHeight: 30,
};

export const HEADER = { height: 72 };
export const FOOTER = { top: 736, height: 64 };

// Seconds on the clock for each scene, in scene order. The clock only ever counts down.
export const SCENE_TIME_SECONDS = [180, 150, 120];

export const HINTS_PER_SCENE = 3;
export const HINT_SECONDS = 2.5;

// How long a found-difference celebration and a wrong-click mark stay on screen.
export const FIND_CELEBRATION_SECONDS = 0.9;
export const MISS_MARK_SECONDS = 0.8;

export const POINTS = {
  find: 100,
  comboStep: 25,
  miss: -25,
  timeBonusPerSecond: 5,
  sceneClearBonus: 250,
};

export const DIFFS_PER_SCENE = 7;

// Colour palette for the frame, shared by every screen so the game reads as one game.
export const COLORS = {
  ink: '#1c2438',
  panel: '#f7f3e8',
  panelEdge: '#2b3350',
  accent: '#ffb347',
  accentDark: '#e07b39',
  good: '#2fbf71',
  bad: '#e5484d',
  hint: '#ffd166',
  header: '#232c47',
  headerText: '#f4ead5',
  muted: '#8a93ad',
};
