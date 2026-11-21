// The three original scenes of Twin Tales, each drawn procedurally with canvas 2D
// vector shapes. No images are loaded: drawScene paints the same picture twice,
// once plain (left panel) and once with its seven differences applied (right panel),
// so the two panels can only ever differ where a difference says so.
//
// Every scene is deterministic: a seeded generator drives its stars, bulbs and
// bubbles, so the left and right panels match exactly outside the differences.
// Coordinates are in panel space: 560 wide, 640 tall.

function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** A four-point sparkle star, the kind used for bright stars and glints. */
function sparkle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

function skyGradient(ctx, height, top, bottom) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 560, height);
}

function starField(ctx, rand, count, maxY, colors) {
  for (let i = 0; i < count; i += 1) {
    const x = rand() * 560;
    const y = rand() * maxY;
    const r = 0.8 + rand() * 1.8;
    ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
    ctx.globalAlpha = 0.5 + rand() * 0.5;
    circle(ctx, x, y, r);
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Scene 1 — Lantern Row Night Market
// ---------------------------------------------------------------------------
function drawNightMarket(ctx, W, H, altered) {
  const rand = mulberry32(20261121);
  skyGradient(ctx, 400, '#2b2350', '#e07b39');
  starField(ctx, rand, 42, 220, ['#fff6d8', '#ffd166', '#ffffff']);

  // Moon, high on the right. Altered: a crescent instead of a full moon.
  ctx.fillStyle = '#ffeec2';
  circle(ctx, 452, 82, 34);
  ctx.fillStyle = '#f7d774';
  circle(ctx, 442, 74, 6);
  circle(ctx, 462, 92, 4);
  if (altered) {
    // Bite the crescent out of the moon with the same sky gradient, so no
    // flat disc edge shows against the dusk sky.
    const sky = ctx.createLinearGradient(0, 0, 0, 400);
    sky.addColorStop(0, '#2b2350');
    sky.addColorStop(1, '#e07b39');
    ctx.fillStyle = sky;
    circle(ctx, 466, 74, 30);
  }

  // Rooftop silhouettes behind the stalls.
  ctx.fillStyle = '#241d42';
  ctx.beginPath();
  ctx.moveTo(0, 400);
  ctx.lineTo(0, 330);
  ctx.lineTo(90, 300);
  ctx.lineTo(150, 340);
  ctx.lineTo(240, 305);
  ctx.lineTo(330, 345);
  ctx.lineTo(420, 300);
  ctx.lineTo(500, 340);
  ctx.lineTo(560, 315);
  ctx.lineTo(560, 400);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  const windows = [[60, 340], [180, 330], [300, 335], [440, 330], [520, 345]];
  for (const [x, y] of windows) ctx.fillRect(x, y, 12, 16);

  // String lights sagging across the top. Altered: one bulb is missing.
  const bulbs = [];
  for (let i = 0; i <= 10; i += 1) {
    const x = 20 + i * 52;
    const y = 96 + Math.sin((i / 10) * Math.PI) * 34;
    bulbs.push([x, y]);
  }
  ctx.strokeStyle = '#1a1430';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bulbs[0][0], bulbs[0][1]);
  for (let i = 1; i < bulbs.length; i += 1) ctx.lineTo(bulbs[i][0], bulbs[i][1]);
  ctx.stroke();
  const bulbColors = ['#ffd166', '#ff6b6b', '#7bd389', '#7fb5ff'];
  bulbs.forEach(([x, y], i) => {
    if (altered && i === 3) return; // the missing bulb
    ctx.fillStyle = bulbColors[i % bulbColors.length];
    circle(ctx, x, y + 8, 7);
    ctx.fillStyle = 'rgba(255, 209, 102, 0.25)';
    circle(ctx, x, y + 8, 13);
  });

  // Cobblestone ground.
  ctx.fillStyle = '#4a3b52';
  ctx.fillRect(0, 400, 560, 240);
  ctx.fillStyle = '#5d4a68';
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      ctx.beginPath();
      ctx.ellipse(35 + col * 62 + (row % 2) * 28, 430 + row * 52, 26, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawMarketStall(ctx, 30, 400, '#c94f4f', '#f7ead7', 'A');
  drawMarketStall(ctx, 205, 400, '#2e8b8b', '#f7ead7', 'B');
  drawMarketStall(ctx, 380, 400, '#d99a2b', '#f7ead7', 'C');

  // Stall A: fruit oranges on the counter. Altered: one orange fewer.
  const oranges = [[70, 505], [95, 498], [120, 505], [82, 522], [108, 522]];
  oranges.forEach(([x, y], i) => {
    if (altered && i === 4) return;
    ctx.fillStyle = '#ff8c42';
    circle(ctx, x, y, 13);
    ctx.fillStyle = '#7bd389';
    ctx.fillRect(x + 4, y - 18, 3, 8);
  });

  // Stall A: hanging sign with three dots. Altered: only two dots.
  ctx.fillStyle = '#f7ead7';
  ctx.fillRect(78, 330, 64, 34);
  ctx.strokeStyle = '#2b3350';
  ctx.lineWidth = 3;
  ctx.strokeRect(78, 330, 64, 34);
  ctx.fillStyle = '#c94f4f';
  circle(ctx, 94, 347, 6);
  circle(ctx, 110, 347, 6);
  if (!altered) circle(ctx, 126, 347, 6);

  // Stall B: steamer baskets of dumplings.
  ctx.fillStyle = '#b98a4e';
  ctx.fillRect(238, 492, 74, 14);
  ctx.fillRect(242, 478, 66, 14);
  ctx.fillStyle = '#f7ead7';
  circle(ctx, 258, 474, 9);
  circle(ctx, 275, 474, 9);
  circle(ctx, 292, 474, 9);

  // Stall B: a paper lantern. Altered: green instead of red.
  ctx.fillStyle = altered ? '#2fbf71' : '#e5484d';
  ellipse(ctx, 330, 250, 22, 28);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(322, 218, 16, 6);
  ctx.fillRect(322, 274, 16, 6);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(312, 238);
  ctx.lineTo(348, 238);
  ctx.moveTo(310, 250);
  ctx.lineTo(350, 250);
  ctx.moveTo(312, 262);
  ctx.lineTo(348, 262);
  ctx.stroke();

  // The cat asleep on stall B's roof. Altered: its tail hangs down instead of up.
  ctx.fillStyle = '#3a3348';
  ellipse(ctx, 280, 392, 26, 14);
  circle(ctx, 300, 382, 11);
  ctx.beginPath();
  ctx.moveTo(292, 374);
  ctx.lineTo(296, 362);
  ctx.lineTo(300, 374);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(302, 372);
  ctx.lineTo(306, 360);
  ctx.lineTo(310, 372);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3a3348';
  ctx.lineWidth = 5;
  ctx.beginPath();
  if (altered) {
    ctx.moveTo(256, 396);
    ctx.quadraticCurveTo(244, 408, 250, 420);
  } else {
    ctx.moveTo(256, 394);
    ctx.quadraticCurveTo(238, 384, 244, 366);
  }
  ctx.stroke();

  // Stall C: the vendor. Altered: a red cap instead of a straw hat.
  ctx.fillStyle = '#7a5a3a';
  ctx.beginPath();
  ctx.arc(452, 470, 26, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2c9a0';
  circle(ctx, 452, 470, 20);
  if (altered) {
    ctx.fillStyle = '#e5484d';
    ctx.beginPath();
    ctx.arc(452, 462, 20, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(468, 458, 14, 5);
  } else {
    ctx.fillStyle = '#e8c96a';
    ellipse(ctx, 452, 452, 30, 8);
    ctx.beginPath();
    ctx.arc(452, 452, 15, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#3f6fb5';
  ctx.fillRect(428, 492, 48, 60);

  // Stall C: the food cart's wheels and a pot.
  ctx.fillStyle = '#2b3350';
  circle(ctx, 408, 560, 14);
  circle(ctx, 500, 560, 14);
  ctx.fillStyle = '#8a93ad';
  circle(ctx, 408, 560, 5);
  circle(ctx, 500, 560, 5);
  ctx.fillStyle = '#5d4a68';
  ellipse(ctx, 452, 520, 26, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ellipse(ctx, 444, 514, 6, 3);
  ellipse(ctx, 458, 517, 4, 2);
}

function drawMarketStall(ctx, x, groundY, awning, cloth, label) {
  // Striped awning.
  for (let i = 0; i < 6; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? awning : cloth;
    ctx.fillRect(x + i * 25, 400, 25, 26);
  }
  ctx.fillStyle = awning;
  ctx.beginPath();
  ctx.moveTo(x, 400);
  ctx.lineTo(x + 150, 400);
  ctx.lineTo(x + 138, 372);
  ctx.lineTo(x + 12, 372);
  ctx.closePath();
  ctx.fill();
  // Posts and counter.
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(x + 4, 426, 8, 110);
  ctx.fillRect(x + 138, 426, 8, 110);
  ctx.fillStyle = '#8a5a34';
  ctx.fillRect(x, 500, 150, 16);
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(x + 6, 516, 138, 58);
  ctx.fillStyle = '#f7ead7';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + 75, 556);
}

// ---------------------------------------------------------------------------
// Scene 2 — Coral Reef at Blue Hour
// ---------------------------------------------------------------------------
function drawCoralReef(ctx, W, H, altered) {
  const rand = mulberry32(771337);
  skyGradient(ctx, 640, '#0b4a75', '#072a4a');

  // Light rays from the surface.
  ctx.fillStyle = 'rgba(140, 210, 255, 0.10)';
  for (let i = 0; i < 5; i += 1) {
    const x = 60 + i * 110;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 50, 0);
    ctx.lineTo(x + 150, 520);
    ctx.lineTo(x + 60, 520);
    ctx.closePath();
    ctx.fill();
  }

  // Sandy floor.
  ctx.fillStyle = '#d9c08a';
  ctx.beginPath();
  ctx.moveTo(0, 560);
  ctx.quadraticCurveTo(140, 520, 280, 556);
  ctx.quadraticCurveTo(420, 590, 560, 548);
  ctx.lineTo(560, 640);
  ctx.lineTo(0, 640);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c4a76a';
  for (let i = 0; i < 14; i += 1) {
    ellipse(ctx, rand() * 560, 560 + rand() * 70, 12 + rand() * 14, 4, 0);
  }

  // Seaweed. Altered: the tall strand in the middle is short.
  drawSeaweed(ctx, 60, 560, 120, '#2f8f5b');
  drawSeaweed(ctx, 300, 556, altered ? 55 : 150, '#2f8f5b');
  drawSeaweed(ctx, 520, 560, 110, '#3aa76d');

  // Corals. Altered: the pink coral loses its top branch.
  drawCoral(ctx, 90, 545, '#ff7f9e', altered);
  drawCoral(ctx, 210, 552, '#ff9e5e', false);
  drawCoral(ctx, 470, 548, '#b78cff', false);

  // Rocks.
  ctx.fillStyle = '#6b7a8c';
  ellipse(ctx, 170, 566, 46, 20);
  ellipse(ctx, 360, 572, 56, 22);
  ctx.fillStyle = '#7f8ea0';
  ellipse(ctx, 168, 560, 30, 12);
  ellipse(ctx, 356, 566, 34, 12);

  // Fish. Altered: the yellow fish at upper left turns blue.
  drawFish(ctx, 200, 180, altered ? '#5ea8ff' : '#ffd166', -1);
  drawFish(ctx, 350, 250, '#ff8c42', 1);
  drawFish(ctx, 150, 320, '#ff6b9e', 1);
  drawFish(ctx, 420, 150, '#7bd389', -1);

  // The turtle. Altered: the pale spot on its shell is gone.
  ctx.fillStyle = '#4e9e6b';
  ellipse(ctx, 400, 420, 52, 30);
  ctx.fillStyle = '#7cc79b';
  ellipse(ctx, 400, 420, 40, 20);
  ctx.fillStyle = '#4e9e6b';
  circle(ctx, 458, 414, 14);
  ctx.fillStyle = '#2b3350';
  circle(ctx, 462, 410, 3);
  ctx.strokeStyle = '#4e9e6b';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(352, 410);
  ctx.lineTo(330, 396);
  ctx.moveTo(352, 430);
  ctx.lineTo(330, 444);
  ctx.moveTo(392, 448);
  ctx.lineTo(382, 466);
  ctx.moveTo(414, 448);
  ctx.lineTo(424, 466);
  ctx.stroke();
  if (!altered) {
    ctx.fillStyle = '#e8f7ee';
    circle(ctx, 392, 412, 7);
    circle(ctx, 414, 426, 5);
  }

  // Bubbles rising by the chest. Altered: one bubble fewer.
  ctx.strokeStyle = 'rgba(220, 240, 255, 0.85)';
  ctx.lineWidth = 2;
  const bubbles = [[470, 500, 7], [488, 472, 5], [456, 448, 6]];
  bubbles.forEach(([x, y, r], i) => {
    if (altered && i === 2) return;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Treasure chest on the sand. Altered: closed instead of open, no gold glow.
  ctx.fillStyle = '#6b4a2f';
  ctx.fillRect(436, 540, 72, 34);
  ctx.fillStyle = '#8a5a34';
  ctx.fillRect(436, 540, 72, 8);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(466, 552, 12, 14);
  if (!altered) {
    ctx.fillStyle = 'rgba(255, 209, 102, 0.35)';
    ctx.beginPath();
    ctx.moveTo(440, 540);
    ctx.lineTo(504, 540);
    ctx.lineTo(520, 470);
    ctx.lineTo(424, 470);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    circle(ctx, 452, 528, 6);
    circle(ctx, 470, 522, 7);
    circle(ctx, 488, 530, 5);
    ctx.fillStyle = '#6b4a2f';
    ctx.save();
    ctx.translate(436, 540);
    ctx.rotate(-0.7);
    ctx.fillRect(0, -26, 72, 26);
    ctx.restore();
  } else {
    ctx.fillStyle = '#6b4a2f';
    ctx.fillRect(436, 514, 72, 26);
    ctx.fillStyle = '#8a5a34';
    ctx.fillRect(436, 514, 72, 8);
  }

  // Starfish on the sand. Altered: four arms instead of five.
  drawStarfish(ctx, 120, 585, altered ? 4 : 5);
}

function drawSeaweed(ctx, x, baseY, height, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.bezierCurveTo(x - 18, baseY - height * 0.35, x + 18, baseY - height * 0.65, x - 6, baseY - height);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 16, baseY);
  ctx.bezierCurveTo(x + 30, baseY - height * 0.3, x + 4, baseY - height * 0.6, x + 14, baseY - height * 0.8);
  ctx.stroke();
}

function drawCoral(ctx, x, baseY, color, missingTopBranch) {
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.quadraticCurveTo(x - 10, baseY - 60, x - 26, baseY - 96);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, baseY - 30);
  ctx.quadraticCurveTo(x + 22, baseY - 70, x + 34, baseY - 104);
  ctx.stroke();
  if (!missingTopBranch) {
    ctx.beginPath();
    ctx.moveTo(x - 6, baseY - 55);
    ctx.quadraticCurveTo(x - 30, baseY - 96, x - 44, baseY - 128);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x + 8, baseY - 18);
  ctx.quadraticCurveTo(x + 30, baseY - 44, x + 44, baseY - 60);
  ctx.stroke();
  ctx.fillStyle = color;
  circle(ctx, x - 26, baseY - 96, 7);
  circle(ctx, x + 34, baseY - 104, 7);
  if (!missingTopBranch) circle(ctx, x - 44, baseY - 128, 7);
  circle(ctx, x + 44, baseY - 60, 6);
}

function drawFish(ctx, x, y, color, direction) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(direction, 1);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-24, 0);
  ctx.quadraticCurveTo(0, -16, 26, 0);
  ctx.quadraticCurveTo(0, 16, -24, 0);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-22, 0);
  ctx.lineTo(-34, -10);
  ctx.lineTo(-34, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1c2438';
  circle(ctx, 14, -3, 3);
  ctx.restore();
}

function drawStarfish(ctx, x, y, arms) {
  ctx.fillStyle = '#ff9e5e';
  ctx.beginPath();
  for (let i = 0; i < arms; i += 1) {
    const angle = (i / arms) * Math.PI * 2 - Math.PI / 2;
    const tipX = x + Math.cos(angle) * 22;
    const tipY = y + Math.sin(angle) * 22;
    const baseAngle = angle + Math.PI / arms;
    const baseX = x + Math.cos(baseAngle) * 8;
    const baseY = y + Math.sin(baseAngle) * 8;
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(baseX, baseY);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e07b39';
  circle(ctx, x, y, 4);
}

// ---------------------------------------------------------------------------
// Scene 3 — Observatory on Mount Auralis
// ---------------------------------------------------------------------------
function drawObservatory(ctx, W, H, altered) {
  const rand = mulberry32(515019);
  skyGradient(ctx, 640, '#0a1030', '#2a3f6e');
  starField(ctx, rand, 70, 300, ['#ffffff', '#cfe0ff', '#ffe9a8']);

  // Aurora. Altered: violet instead of green.
  const aurora = altered ? 'rgba(178, 132, 255, 0.55)' : 'rgba(110, 231, 160, 0.55)';
  ctx.fillStyle = aurora;
  ctx.beginPath();
  ctx.moveTo(40, 60);
  ctx.bezierCurveTo(160, 20, 260, 110, 380, 60);
  ctx.bezierCurveTo(460, 30, 520, 70, 540, 50);
  ctx.lineTo(540, 96);
  ctx.bezierCurveTo(440, 130, 300, 60, 180, 110);
  ctx.bezierCurveTo(100, 140, 50, 110, 40, 100);
  ctx.closePath();
  ctx.fill();

  // Comet. Altered: no comet at all.
  if (!altered) {
    const tail = ctx.createLinearGradient(120, 90, 190, 130);
    tail.addColorStop(0, 'rgba(255, 240, 200, 0.9)');
    tail.addColorStop(1, 'rgba(255, 240, 200, 0)');
    ctx.strokeStyle = tail;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(120, 90);
    ctx.lineTo(196, 132);
    ctx.stroke();
    ctx.fillStyle = '#fff3c9';
    circle(ctx, 118, 88, 7);
    sparkle(ctx, 118, 88, 14, '#fff3c9');
  }

  // Mountains.
  ctx.fillStyle = '#1a2340';
  ctx.beginPath();
  ctx.moveTo(0, 460);
  ctx.lineTo(120, 330);
  ctx.lineTo(240, 460);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f4ead5';
  ctx.beginPath();
  ctx.moveTo(120, 330);
  ctx.lineTo(96, 368);
  ctx.lineTo(118, 372);
  ctx.lineTo(138, 352);
  ctx.lineTo(150, 372);
  ctx.lineTo(144, 330);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#141b33';
  ctx.beginPath();
  ctx.moveTo(300, 460);
  ctx.lineTo(440, 350);
  ctx.lineTo(560, 460);
  ctx.closePath();
  ctx.fill();

  // Pine trees. Altered: the left foreground pine is gone.
  drawPine(ctx, 60, 520, 90);
  if (!altered) drawPine(ctx, 96, 560, 120);
  drawPine(ctx, 510, 540, 100);

  // Hill and observatory dome.
  ctx.fillStyle = '#232c47';
  ctx.beginPath();
  ctx.moveTo(180, 640);
  ctx.quadraticCurveTo(280, 430, 420, 470);
  ctx.quadraticCurveTo(500, 500, 560, 640);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8e2d2';
  ctx.beginPath();
  ctx.arc(380, 420, 74, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d5cdb8';
  ctx.fillRect(306, 420, 148, 60);
  // Dome slit and telescope. Altered: the telescope points level, not up.
  ctx.fillStyle = '#2b3350';
  ctx.fillRect(372, 352, 16, 68);
  ctx.strokeStyle = '#8a93ad';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (altered) {
    ctx.moveTo(380, 372);
    ctx.lineTo(452, 372);
  } else {
    ctx.moveTo(380, 372);
    ctx.lineTo(436, 316);
  }
  ctx.stroke();
  ctx.fillStyle = '#ffd166';
  circle(ctx, altered ? 452 : 436, altered ? 372 : 316, 7);
  // Dome window. Altered: dark instead of lit.
  ctx.fillStyle = altered ? '#2b3350' : '#ffd166';
  ctx.beginPath();
  ctx.arc(330, 448, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = altered ? '#2b3350' : '#ffd166';
  ctx.fillRect(418, 436, 18, 24);

  // Lamp posts along the path. Altered: the near lamp is off.
  drawLamp(ctx, 250, 560, true);
  drawLamp(ctx, 300, 590, !altered);

  // Bright star cluster. Altered: one bright star is missing.
  sparkle(ctx, 480, 120, 10, '#ffffff');
  sparkle(ctx, 505, 138, 8, '#ffe9a8');
  if (!altered) sparkle(ctx, 492, 100, 9, '#ffffff');
  sparkle(ctx, 520, 108, 6, '#cfe0ff');
}

function drawPine(ctx, x, baseY, height) {
  ctx.fillStyle = '#5d3a24';
  ctx.fillRect(x - 5, baseY - 14, 10, 14);
  ctx.fillStyle = '#1f5c38';
  const tiers = 3;
  for (let i = 0; i < tiers; i += 1) {
    const tierY = baseY - 14 - (i * height) / tiers;
    const tierW = 34 - i * 9;
    ctx.beginPath();
    ctx.moveTo(x - tierW, tierY);
    ctx.lineTo(x, tierY - height / tiers - 8);
    ctx.lineTo(x + tierW, tierY);
    ctx.closePath();
    ctx.fill();
  }
}

function drawLamp(ctx, x, baseY, lit) {
  ctx.fillStyle = '#1c2438';
  ctx.fillRect(x - 2, baseY - 44, 4, 44);
  ctx.fillStyle = lit ? '#ffd166' : '#3a415c';
  circle(ctx, x, baseY - 50, 9);
  if (lit) {
    ctx.fillStyle = 'rgba(255, 209, 102, 0.22)';
    circle(ctx, x, baseY - 50, 22);
  }
}

// ---------------------------------------------------------------------------
// Scene catalogue
// ---------------------------------------------------------------------------
export const SCENES = [
  {
    id: 'lantern-row',
    name: 'Lantern Row Night Market',
    tagline: 'Seven changes hide among the stalls, the lanterns and the cat.',
    difficulty: 'Warm-up',
    draw: drawNightMarket,
    diffs: [
      { x: 452, y: 82, r: 40, label: 'The moon turned crescent' },
      { x: 330, y: 250, r: 26, label: 'The paper lantern turned green' },
      { x: 280, y: 392, r: 30, label: 'The cat lowered its tail' },
      { x: 110, y: 347, r: 24, label: 'A dot vanished from the sign' },
      { x: 176, y: 122, r: 16, label: 'A string-light bulb went out' },
      { x: 95, y: 510, r: 30, label: 'An orange went missing' },
      { x: 452, y: 462, r: 30, label: 'The vendor swapped hats' },
    ],
  },
  {
    id: 'coral-reef',
    name: 'Coral Reef at Blue Hour',
    tagline: 'Seven changes drift through the reef, the turtle and the chest.',
    difficulty: 'Trickier',
    draw: drawCoralReef,
    diffs: [
      { x: 200, y: 180, r: 30, label: 'The yellow fish turned blue' },
      { x: 400, y: 420, r: 34, label: 'The spot left the turtle shell' },
      { x: 60, y: 430, r: 30, label: 'A coral branch snapped off' },
      { x: 456, y: 448, r: 26, label: 'A bubble never rose' },
      { x: 472, y: 540, r: 36, label: 'The treasure chest closed' },
      { x: 120, y: 585, r: 30, label: 'The starfish lost an arm' },
      { x: 300, y: 500, r: 30, label: 'The tall seaweed shrank' },
    ],
  },
  {
    id: 'mount-auralis',
    name: 'Observatory on Mount Auralis',
    tagline: 'Seven changes hide under the aurora, the dome and the pines.',
    difficulty: 'Sharp-eyed',
    draw: drawObservatory,
    diffs: [
      { x: 290, y: 75, r: 40, label: 'The aurora turned violet' },
      { x: 330, y: 448, r: 24, label: 'The dome window went dark' },
      { x: 420, y: 340, r: 30, label: 'The telescope levelled out' },
      { x: 130, y: 100, r: 30, label: 'The comet never came' },
      { x: 96, y: 520, r: 34, label: 'A pine tree vanished' },
      { x: 300, y: 545, r: 24, label: 'The path lamp went out' },
      { x: 492, y: 100, r: 18, label: 'A bright star blinked out' },
    ],
  },
];
