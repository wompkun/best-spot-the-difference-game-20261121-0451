// Keyboard and mouse input for Twin Tales.
// The module owns the listeners and keeps a small queue of clicks plus the live
// keyboard cursor, so the game loop can poll it once per frame without ever
// touching the DOM event system itself.
export function createInput(canvas) {
  const input = {
    // Logical (1280x800) mouse position, or null before the mouse has moved.
    mouse: { x: 640, y: 400, inside: false },
    // Keyboard cursor: arrows move it, Enter checks the spot under it.
    cursor: { x: 640, y: 400, visible: false },
    clicks: [],
    keys: new Set(),
    pressed: new Set(),
  };

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 800,
    };
  }

  canvas.addEventListener('pointermove', (event) => {
    const point = toLogical(event);
    input.mouse.x = point.x;
    input.mouse.y = point.y;
    input.mouse.inside = true;
    input.cursor.visible = false;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const point = toLogical(event);
    input.mouse.x = point.x;
    input.mouse.y = point.y;
    input.mouse.inside = true;
    input.cursor.visible = false;
    input.clicks.push({ x: point.x, y: point.y, button: event.button });
  });

  canvas.addEventListener('pointerleave', () => {
    input.mouse.inside = false;
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    input.keys.add(event.key);
    input.pressed.add(event.key);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.key);
  });

  window.addEventListener('blur', () => {
    input.keys.clear();
  });

  return input;
}

/** Move the keyboard cursor by the held arrow keys; returns true when it moved. */
export function moveKeyboardCursor(input, deltaSeconds) {
  const speed = 520;
  let moved = false;
  let dx = 0;
  let dy = 0;
  if (input.keys.has('ArrowLeft')) dx -= 1;
  if (input.keys.has('ArrowRight')) dx += 1;
  if (input.keys.has('ArrowUp')) dy -= 1;
  if (input.keys.has('ArrowDown')) dy += 1;
  if (dx !== 0 || dy !== 0) {
    const length = Math.hypot(dx, dy);
    input.cursor.x = Math.max(0, Math.min(1280, input.cursor.x + (dx / length) * speed * deltaSeconds));
    input.cursor.y = Math.max(0, Math.min(800, input.cursor.y + (dy / length) * speed * deltaSeconds));
    input.cursor.visible = true;
    moved = true;
  }
  return moved;
}

/** Take and clear the keys pressed since the last frame. */
export function takePressed(input) {
  const pressed = new Set(input.pressed);
  input.pressed.clear();
  return pressed;
}

/** Take and clear the clicks since the last frame. */
export function takeClicks(input) {
  const clicks = input.clicks;
  input.clicks = [];
  return clicks;
}
