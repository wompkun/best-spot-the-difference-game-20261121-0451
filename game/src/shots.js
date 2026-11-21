// Deterministic screenshot staging for Twin Tales.
// ?shot=start|play|reef|end puts the real game state into the exact frame a
// screenshot should show, then freezes the clock so the same URL always renders
// the same picture. No autoplay, no fake frames: each shot is the live game with
// its state set to a moment a real player reaches.
import { SCREEN_GAME_DONE, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/**
 * Stage the game for a screenshot and return true when a shot mode was requested.
 * The clock is frozen in every shot so the render is repeatable.
 */
export function stageShot(name, game) {
  if (name === 'play') {
    game.startScene(0);
    game.found = new Set([0, 1, 2]);
    game.lastFindIndex = 2;
    game.lastFindAge = 0.4;
    game.score = 325;
    game.combo = 3;
    game.timeLeft = 142;
    game.screen = SCREEN_PLAY;
    game.frozen = true;
    game.cursor = { x: 680 + 330, y: 84 + 250, visible: true };
    game.message = 'Nice eye! +100  ·  4 differences still hidden';
    game.messageGood = true;
    return true;
  }
  if (name === 'reef') {
    game.startScene(1);
    game.found = new Set([0, 4]);
    game.lastFindIndex = 4;
    game.lastFindAge = 0.3;
    game.score = 550;
    game.combo = 2;
    game.timeLeft = 118;
    game.screen = SCREEN_PLAY;
    game.frozen = true;
    game.cursor = { x: 680 + 200, y: 84 + 180, visible: true };
    game.hint = { diffIndex: 2, age: 1.1, duration: 2.5 };
    game.message = 'Hint spent — look near the pink coral';
    game.messageGood = true;
    return true;
  }
  if (name === 'end') {
    game.startScene(0);
    game.sceneScores = [1240, 1180, 1310];
    game.score = 3730;
    game.bestCombo = 7;
    game.hintsUsed = 2;
    game.screen = SCREEN_GAME_DONE;
    game.frozen = true;
    return true;
  }
  // start, and anything unrecognised, is the title screen.
  game.screen = SCREEN_TITLE;
  game.frozen = true;
  return name === 'start';
}
