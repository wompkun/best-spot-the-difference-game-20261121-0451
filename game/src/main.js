// Twin Tales: Spot the Difference — game state, rules and the main loop.
// Owns the screens (title, play, scene complete, game complete, time up), the
// clock, the score and combo, hints, and the click/keyboard checks. Rendering
// lives in render.js, the pictures in scenes.js, sound in audio.js.
import {
  DIFFS_PER_SCENE,
  HINTS_PER_SCENE,
  HINT_SECONDS,
  MISS_MARK_SECONDS,
  PANEL,
  POINTS,
  SCENE_TIME_SECONDS,
  VIEW,
} from './config.js';
import { SCENES } from './scenes.js';
import {
  SCREEN_GAME_DONE,
  SCREEN_PLAY,
  SCREEN_SCENE_DONE,
  SCREEN_TIME_UP,
  SCREEN_TITLE,
  panelRect,
  render,
} from './render.js';
import { createInput, moveKeyboardCursor, takeClicks, takePressed } from './input.js';
import {
  playClick,
  playFind,
  playGameWin,
  playHint,
  playMiss,
  playSceneClear,
  playTick,
  toggleMute,
  unlockAudio,
} from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const game = {
  screen: SCREEN_TITLE,
  sceneIndex: 0,
  found: new Set(),
  score: 0,
  sceneScore: 0,
  sceneScores: [0, 0, 0],
  combo: 0,
  bestCombo: 0,
  timeLeft: SCENE_TIME_SECONDS[0],
  sceneTime: SCENE_TIME_SECONDS[0],
  hintsLeft: HINTS_PER_SCENE,
  hintsUsed: 0,
  effects: [],
  lastFindIndex: -1,
  lastFindAge: 99,
  hint: null,
  message: null,
  messageGood: true,
  mouse: { x: 640, y: 400, inside: false },
  cursor: { x: 640, y: 400, visible: false },
  elapsed: 0,
  bestScore: 0,
  titleSelection: 0,
  lastTimeBonus: 0,
  lastSceneScore: 0,
  frozen: false,
  lastTickSecond: -1,
};

const input = createInput(canvas);
game.mouse = input.mouse;
game.cursor = input.cursor;

// Exposed for play-testing from the console or an automation harness.
window.__twinTales = game;

function startScene(index) {
  game.sceneIndex = index;
  game.found = new Set();
  game.sceneScore = 0;
  game.combo = 0;
  game.timeLeft = SCENE_TIME_SECONDS[index];
  game.sceneTime = SCENE_TIME_SECONDS[index];
  game.hintsLeft = HINTS_PER_SCENE;
  game.effects = [];
  game.hint = null;
  game.lastFindIndex = -1;
  game.lastFindAge = 99;
  game.message = null;
  game.screen = SCREEN_PLAY;
  game.lastTickSecond = -1;
}

game.startScene = startScene;

function resetToTitle() {
  game.screen = SCREEN_TITLE;
  game.score = 0;
  game.sceneScores = [0, 0, 0];
  game.bestCombo = 0;
  game.hintsUsed = 0;
  game.titleSelection = 0;
  game.message = null;
}

/** Turn a view-space point into a panel-local one, or null when outside both panels. */
function pointInPanels(x, y) {
  for (const side of ['left', 'right']) {
    const rect = panelRect(side);
    if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
      return { side, x: x - rect.x, y: y - rect.y };
    }
  }
  return null;
}

function checkPoint(viewX, viewY) {
  const point = pointInPanels(viewX, viewY);
  if (!point) return;
  const scene = SCENES[game.sceneIndex];
  for (let index = 0; index < scene.diffs.length; index += 1) {
    if (game.found.has(index)) continue;
    const diff = scene.diffs[index];
    const distance = Math.hypot(point.x - diff.x, point.y - diff.y);
    if (distance <= diff.r + 12) {
      game.found.add(index);
      game.lastFindIndex = index;
      game.lastFindAge = 0;
      const gained = POINTS.find + game.combo * POINTS.comboStep;
      game.score += gained;
      game.sceneScore += gained;
      game.combo += 1;
      game.bestCombo = Math.max(game.bestCombo, game.combo);
      game.message = `Nice eye! +${gained}  ·  ${DIFFS_PER_SCENE - game.found.size} still hidden — ${diff.label}`;
      game.messageGood = true;
      playFind();
      if (game.found.size === DIFFS_PER_SCENE) {
        const timeBonus = Math.ceil(game.timeLeft) * POINTS.timeBonusPerSecond + POINTS.sceneClearBonus;
        game.score += timeBonus;
        game.sceneScore += timeBonus;
        game.lastTimeBonus = timeBonus;
        game.lastSceneScore = game.sceneScore;
        game.sceneScores[game.sceneIndex] = game.sceneScore;
        game.bestScore = Math.max(game.bestScore, game.score);
        game.screen = SCREEN_SCENE_DONE;
        playSceneClear();
      }
      return;
    }
  }
  // Nothing there: a miss costs points and breaks the combo.
  game.score = Math.max(0, game.score + POINTS.miss);
  game.combo = 0;
  game.effects.push({ type: 'miss', panel: point.side, x: point.x, y: point.y, age: 0, duration: MISS_MARK_SECONDS });
  game.message = 'Not quite — −25 points. Look closer.';
  game.messageGood = false;
  playMiss();
}

function useHint() {
  if (game.hintsLeft <= 0 || game.screen !== SCREEN_PLAY) return;
  const scene = SCENES[game.sceneIndex];
  const remaining = scene.diffs.map((diff, index) => index).filter((index) => !game.found.has(index));
  if (remaining.length === 0) return;
  const pick = remaining[Math.floor(Math.random() * remaining.length)];
  game.hintsLeft -= 1;
  game.hintsUsed += 1;
  game.hint = { diffIndex: pick, age: 0, duration: HINT_SECONDS };
  game.message = `Hint spent — look near the ${scene.diffs[pick].label.toLowerCase()}`;
  game.messageGood = true;
  playHint();
}

function advanceScene() {
  if (game.sceneIndex + 1 < SCENES.length) {
    startScene(game.sceneIndex + 1);
  } else {
    game.screen = SCREEN_GAME_DONE;
    playGameWin();
  }
}

function handleKeys(pressed) {
  if (pressed.has('m') || pressed.has('M')) {
    const muted = toggleMute();
    game.message = muted ? 'Sound off' : 'Sound on';
    game.messageGood = true;
  }
  switch (game.screen) {
    case SCREEN_TITLE: {
      if (pressed.has('ArrowLeft')) {
        game.titleSelection = (game.titleSelection + SCENES.length - 1) % SCENES.length;
        playClick();
      }
      if (pressed.has('ArrowRight')) {
        game.titleSelection = (game.titleSelection + 1) % SCENES.length;
        playClick();
      }
      if (pressed.has('1') || pressed.has('2') || pressed.has('3')) {
        game.titleSelection = Number(pressed.has('1') ? 1 : pressed.has('2') ? 2 : 3) - 1;
        playClick();
      }
      if (pressed.has('Enter') || pressed.has(' ')) {
        unlockAudio();
        playClick();
        startScene(game.titleSelection);
      }
      break;
    }
    case SCREEN_PLAY: {
      if (pressed.has('h') || pressed.has('H')) useHint();
      if (pressed.has('r') || pressed.has('R')) {
        playClick();
        startScene(game.sceneIndex);
      }
      if (pressed.has('Enter')) {
        unlockAudio();
        checkPoint(game.cursor.x, game.cursor.y);
      }
      break;
    }
    case SCREEN_SCENE_DONE: {
      if (pressed.has('Enter') || pressed.has(' ')) advanceScene();
      if (pressed.has('r') || pressed.has('R')) startScene(game.sceneIndex);
      break;
    }
    case SCREEN_GAME_DONE: {
      if (pressed.has('r') || pressed.has('R')) resetToTitle();
      break;
    }
    case SCREEN_TIME_UP: {
      if (pressed.has('r') || pressed.has('R')) startScene(game.sceneIndex);
      break;
    }
    default:
      break;
  }
}

function handleClicks(clicks) {
  for (const click of clicks) {
    unlockAudio();
    if (game.screen === SCREEN_TITLE) {
      playClick();
      startScene(game.titleSelection);
    } else if (game.screen === SCREEN_PLAY) {
      checkPoint(click.x, click.y);
    } else if (game.screen === SCREEN_SCENE_DONE) {
      advanceScene();
    } else if (game.screen === SCREEN_TIME_UP) {
      startScene(game.sceneIndex);
    }
  }
}

function update(deltaSeconds) {
  game.elapsed += deltaSeconds;
  if (game.lastFindAge < 99) game.lastFindAge += deltaSeconds;
  if (game.hint) {
    game.hint.age += deltaSeconds;
    if (game.hint.age >= game.hint.duration) game.hint = null;
  }
  game.effects = game.effects.filter((effect) => {
    effect.age += deltaSeconds;
    return effect.age < effect.duration;
  });

  if (game.frozen || game.screen !== SCREEN_PLAY) return;

  game.timeLeft -= deltaSeconds;
  const wholeSecond = Math.ceil(game.timeLeft);
  if (game.timeLeft <= 10 && wholeSecond !== game.lastTickSecond) {
    game.lastTickSecond = wholeSecond;
    playTick();
  }
  if (game.timeLeft <= 0) {
    game.timeLeft = 0;
    game.screen = SCREEN_TIME_UP;
    game.combo = 0;
    playMiss();
  }
}

let lastTime = performance.now();

function frame(now) {
  const deltaSeconds = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  const pressed = takePressed(input);
  const clicks = takeClicks(input);
  if (game.screen === SCREEN_PLAY) moveKeyboardCursor(input, deltaSeconds);
  handleKeys(pressed);
  handleClicks(clicks);
  update(deltaSeconds);
  render(ctx, game);

  requestAnimationFrame(frame);
}

// A ?shot= URL stages a frozen, deterministic frame for screenshots.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(shot, game);
  // In shot mode the title screen still needs its elapsed blink to be stable.
  game.elapsed = 0.4;
}

requestAnimationFrame(frame);
