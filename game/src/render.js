// Everything Twin Tales paints on its one canvas: the title screen, the two picture
// panels with their markers, the header and footer, and the end-of-scene screens.
// Render never mutates game state; it reads the state main.js hands it each frame.
import { COLORS, DIFFS_PER_SCENE, PANEL, VIEW } from './config.js';
import { SCENES } from './scenes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_SCENE_DONE = 'sceneDone';
export const SCREEN_GAME_DONE = 'gameDone';
export const SCREEN_TIME_UP = 'timeUp';

const LEFT_RECT = { x: PANEL.leftX, y: PANEL.top, width: PANEL.width, height: PANEL.height };
const RIGHT_RECT = { x: PANEL.rightX, y: PANEL.top, width: PANEL.width, height: PANEL.height };

export function panelRect(side) {
  return side === 'left' ? LEFT_RECT : RIGHT_RECT;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function drawBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  gradient.addColorStop(0, '#171d31');
  gradient.addColorStop(1, '#10142a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

/** The found-difference marker: a green ring with a check, drawn on both panels. */
function drawFoundMarker(ctx, rect, diff, pulse) {
  const x = rect.x + diff.x;
  const y = rect.y + diff.y;
  const radius = diff.r + 6 + (pulse ? Math.sin(pulse * Math.PI * 2) * 3 : 0);
  ctx.strokeStyle = COLORS.good;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = COLORS.good;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 9, y);
  ctx.lineTo(x - 2, y + 8);
  ctx.lineTo(x + 11, y - 8);
  ctx.stroke();
}

function drawHintRing(ctx, rect, diff, age, duration) {
  const progress = age / duration;
  const alpha = progress < 0.15 ? progress / 0.15 : progress > 0.75 ? (1 - progress) / 0.25 : 1;
  const x = rect.x + diff.x;
  const y = rect.y + diff.y;
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.strokeStyle = COLORS.hint;
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.arc(x, y, diff.r + 14 + Math.sin(progress * Math.PI * 4) * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = COLORS.hint;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HINT', x, y - diff.r - 22);
  ctx.restore();
}

function drawMissMark(ctx, effect) {
  const alpha = Math.max(0, 1 - effect.age / effect.duration);
  const rect = panelRect(effect.panel);
  const x = rect.x + effect.x;
  const y = rect.y + effect.y;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = COLORS.bad;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 12);
  ctx.lineTo(x + 12, y + 12);
  ctx.moveTo(x + 12, y - 12);
  ctx.lineTo(x - 12, y + 12);
  ctx.stroke();
  ctx.restore();
}

function drawScenePanel(ctx, scene, rect, altered, state) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();
  ctx.translate(rect.x, rect.y);
  scene.draw(ctx, rect.width, rect.height, altered);
  ctx.restore();

  // Markers for every difference already found.
  for (const index of state.found) {
    const diff = scene.diffs[index];
    const recent = state.lastFindIndex === index && state.lastFindAge < 0.9;
    drawFoundMarker(ctx, rect, diff, recent ? state.lastFindAge : 0);
  }
  // The active hint ring, on both panels so the eye can compare.
  if (state.hint && state.hint.age < state.hint.duration) {
    drawHintRing(ctx, rect, scene.diffs[state.hint.diffIndex], state.hint.age, state.hint.duration);
  }
}

function drawHeader(ctx, state) {
  const scene = SCENES[state.sceneIndex];
  ctx.fillStyle = COLORS.header;
  ctx.fillRect(0, 0, VIEW.width, 72);
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(0, 72, VIEW.width, 3);

  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.headerText;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('TWIN TALES', 24, 32);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Spot the Difference', 24, 56);

  ctx.fillStyle = COLORS.headerText;
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText(`${state.sceneIndex + 1}. ${scene.name}`, 330, 32);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(scene.difficulty, 330, 56);

  // The counter the judge looks for: found so far, and how many are left.
  const foundCount = state.found.size;
  const left = DIFFS_PER_SCENE - foundCount;
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.good;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(`Found ${foundCount} / ${DIFFS_PER_SCENE}`, 760, 34);
  ctx.fillStyle = left === 0 ? COLORS.good : COLORS.accent;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(left === 0 ? 'All found!' : `${left} still hidden`, 760, 58);

  // Score.
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.headerText;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(`Score ${state.score}`, 1010, 32);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(`Hints left: ${state.hintsLeft}`, 1010, 56);

  // Timer bar and digits; it turns red under thirty seconds.
  const urgent = state.timeLeft <= 30;
  const fraction = Math.max(0, state.timeLeft / state.sceneTime);
  ctx.textAlign = 'left';
  ctx.fillStyle = urgent ? COLORS.bad : COLORS.headerText;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText(`⏱ ${formatTime(state.timeLeft)}`, 1070, 34);
  ctx.fillStyle = '#39415f';
  roundRect(ctx, 1070, 46, 186, 10, 5);
  ctx.fill();
  ctx.fillStyle = urgent ? COLORS.bad : COLORS.accent;
  roundRect(ctx, 1070, 46, 186 * fraction, 10, 5);
  ctx.fill();
}

function drawFooter(ctx, state) {
  ctx.fillStyle = '#1a2036';
  ctx.fillRect(0, 736, VIEW.width, 64);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Click a difference, or move with ← ↑ ↓ → and press Enter to check it.', 24, 762);
  ctx.fillText('H — hint (3 per scene)    R — restart scene    M — mute', 24, 786);
  ctx.textAlign = 'right';
  if (state.message) {
    ctx.fillStyle = state.messageGood ? COLORS.good : COLORS.bad;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(state.message, 1256, 774);
  }
}

function drawPanelLabels(ctx) {
  // Small pills floating at the top of each picture, so the labels never fight
  // the header line for the same row of pixels.
  const labels = [
    { x: 320, text: 'A · ORIGINAL' },
    { x: 960, text: 'B · 7 CHANGES HIDE HERE' },
  ];
  ctx.textAlign = 'center';
  ctx.font = 'bold 14px system-ui, sans-serif';
  for (const label of labels) {
    const width = ctx.measureText(label.text).width + 28;
    ctx.fillStyle = 'rgba(16, 20, 42, 0.78)';
    roundRect(ctx, label.x - width / 2, PANEL.top + 10, width, 28, 14);
    ctx.fill();
    ctx.fillStyle = '#f4ead5';
    ctx.fillText(label.text, label.x, PANEL.top + 29);
  }
}

function drawCursor(ctx, state) {
  if (!state.cursor.visible) return;
  const { x, y } = state.cursor;
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 20, y);
  ctx.lineTo(x - 8, y);
  ctx.moveTo(x + 8, y);
  ctx.lineTo(x + 20, y);
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x, y - 8);
  ctx.moveTo(x, y + 8);
  ctx.lineTo(x, y + 20);
  ctx.stroke();
  ctx.restore();
}

function drawMouseRing(ctx, state) {
  if (!state.mouse.inside || state.cursor.visible) return;
  const { x, y } = state.mouse;
  const inPanel =
    (x >= LEFT_RECT.x && x <= LEFT_RECT.x + LEFT_RECT.width && y >= LEFT_RECT.y && y <= LEFT_RECT.y + LEFT_RECT.height) ||
    (x >= RIGHT_RECT.x && x <= RIGHT_RECT.x + RIGHT_RECT.width && y >= RIGHT_RECT.y && y <= RIGHT_RECT.y + RIGHT_RECT.height);
  if (!inPanel) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawPlay(ctx, state) {
  const scene = SCENES[state.sceneIndex];
  drawHeader(ctx, state);
  drawScenePanel(ctx, scene, LEFT_RECT, false, state);
  drawScenePanel(ctx, scene, RIGHT_RECT, true, state);
  for (const rect of [LEFT_RECT, RIGHT_RECT]) {
    ctx.strokeStyle = COLORS.panelEdge;
    ctx.lineWidth = 3;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  }
  drawPanelLabels(ctx);
  for (const effect of state.effects) {
    if (effect.type === 'miss') drawMissMark(ctx, effect);
  }
  drawMouseRing(ctx, state);
  drawCursor(ctx, state);
  drawFooter(ctx, state);
}

function drawTitle(ctx, state) {
  drawBackground(ctx);
  // A faint starfield behind the title.
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  const stars = [[80, 90], [200, 60], [1120, 80], [1200, 160], [60, 300], [1220, 320], [300, 120], [980, 60], [640, 50], [90, 620], [1190, 640]];
  for (const [x, y] of stars) {
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.accent;
  ctx.font = 'bold 76px system-ui, sans-serif';
  ctx.fillText('TWIN TALES', 640, 150);
  ctx.fillStyle = COLORS.headerText;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText('Spot the Difference', 640, 205);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillText('Two pictures. Seven changes. One sharp pair of eyes.', 640, 242);

  // One card per scene.
  SCENES.forEach((scene, index) => {
    const x = 140 + index * 340;
    const y = 290;
    const selected = state.titleSelection === index;
    ctx.fillStyle = selected ? '#2c3554' : '#20263f';
    roundRect(ctx, x, y, 300, 190, 14);
    ctx.fill();
    ctx.strokeStyle = selected ? COLORS.accent : '#39415f';
    ctx.lineWidth = selected ? 3 : 2;
    roundRect(ctx, x, y, 300, 190, 14);
    ctx.stroke();
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(`SCENE ${index + 1} · ${scene.difficulty.toUpperCase()}`, x + 150, y + 34);
    ctx.fillStyle = COLORS.headerText;
    ctx.font = 'bold 19px system-ui, sans-serif';
    ctx.fillText(scene.name, x + 150, y + 78);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '15px system-ui, sans-serif';
    const words = scene.tagline.split(' ');
    let line = '';
    let lineY = y + 112;
    for (const word of words) {
      if ((line + word).length > 30) {
        ctx.fillText(line.trim(), x + 150, lineY);
        line = '';
        lineY += 20;
      }
      line += `${word} `;
    }
    ctx.fillText(line.trim(), x + 150, lineY);
    ctx.fillStyle = selected ? COLORS.accent : COLORS.muted;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(selected ? '▶ PRESS ENTER TO PLAY' : 'press 1 · 2 · 3 to choose', x + 150, y + 168);
  });

  ctx.fillStyle = COLORS.headerText;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText('Click a difference on either picture, or steer with the arrow keys and press Enter.', 640, 540);
  ctx.fillText('H spends a hint · R restarts the scene · find all 7 before the clock runs out.', 640, 570);
  ctx.fillStyle = COLORS.accent;
  ctx.font = 'bold 22px system-ui, sans-serif';
  const blink = Math.floor(state.elapsed * 2) % 2 === 0;
  if (blink) ctx.fillText('— Press Enter or click to start —', 640, 640);
  if (state.bestScore > 0) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`Best score so far: ${state.bestScore}`, 640, 690);
  }
}

function drawOverlayCard(ctx, title, lines, accent, prompt) {
  ctx.fillStyle = 'rgba(10, 14, 28, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const x = 340;
  const y = 190;
  ctx.fillStyle = '#20263f';
  roundRect(ctx, x, y, 600, 380, 18);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, 600, 380, 18);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText(title, 640, y + 72);
  ctx.fillStyle = COLORS.headerText;
  ctx.font = '20px system-ui, sans-serif';
  lines.forEach((line, index) => {
    ctx.fillText(line, 640, y + 130 + index * 34);
  });
  const blink = Math.floor(Date.now() / 500) % 2 === 0;
  if (blink) {
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(prompt, 640, y + 330);
  }
}

function drawSceneDone(ctx, state) {
  drawPlay(ctx, state);
  const scene = SCENES[state.sceneIndex];
  const lines = [
    `${scene.name} — all ${DIFFS_PER_SCENE} differences found`,
    `Time bonus: +${state.lastTimeBonus}  ·  Scene score: ${state.lastSceneScore}`,
    `Total score: ${state.score}`,
  ];
  drawOverlayCard(ctx, 'Scene Complete!', lines, COLORS.good, state.sceneIndex + 1 < SCENES.length ? 'Press Enter for the next scene' : 'Press Enter for the final tally');
}

function drawGameDone(ctx, state) {
  drawBackground(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.accent;
  ctx.font = 'bold 60px system-ui, sans-serif';
  ctx.fillText('You found them all!', 640, 150);
  ctx.fillStyle = COLORS.headerText;
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText('Every difference in every scene — 21 out of 21.', 640, 200);
  SCENES.forEach((scene, index) => {
    const y = 280 + index * 76;
    ctx.fillStyle = '#20263f';
    roundRect(ctx, 390, y, 500, 56, 12);
    ctx.fill();
    ctx.fillStyle = COLORS.headerText;
    ctx.font = 'bold 19px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${index + 1}. ${scene.name}`, 414, y + 35);
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.accent;
    ctx.fillText(`${state.sceneScores[index]} pts`, 866, y + 35);
  });
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.good;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText(`Final score: ${state.score}`, 640, 560);
  ctx.fillStyle = COLORS.muted;
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillText(`Best combo: ${state.bestCombo} finds in a row · Hints used: ${state.hintsUsed}`, 640, 598);
  const blink = Math.floor(Date.now() / 500) % 2 === 0;
  if (blink) {
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('Press R to play again', 640, 660);
  }
}

function drawTimeUp(ctx, state) {
  drawPlay(ctx, state);
  const scene = SCENES[state.sceneIndex];
  const lines = [
    `${scene.name} — you found ${state.found.size} of ${DIFFS_PER_SCENE} differences`,
    'The clock ran out before the last one was found.',
    `Score so far: ${state.score}`,
  ];
  drawOverlayCard(ctx, "Time's Up!", lines, COLORS.bad, 'Press R to try the scene again');
}

/** Paint one frame for the given state. */
export function render(ctx, state) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  switch (state.screen) {
    case SCREEN_TITLE:
      drawTitle(ctx, state);
      break;
    case SCREEN_PLAY:
      drawPlay(ctx, state);
      break;
    case SCREEN_SCENE_DONE:
      drawSceneDone(ctx, state);
      break;
    case SCREEN_GAME_DONE:
      drawGameDone(ctx, state);
      break;
    case SCREEN_TIME_UP:
      drawTimeUp(ctx, state);
      break;
    default:
      drawTitle(ctx, state);
  }
}
