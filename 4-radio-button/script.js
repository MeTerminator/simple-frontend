/*
 * Each cel contains measured SVG contours, not a bitmap or a video frame.
 * The reference changes direction every 72 frames (1.2 s at 60 fps).
 * Native radio inputs provide pointer, touch, keyboard and form behavior.
 */
const NS = 'http://www.w3.org/2000/svg';
const motion = REFERENCE_MOTION;
const media = matchMedia('(prefers-reduced-motion: reduce)');
const frameParameter = new URLSearchParams(location.search).get('frame');
const inspectionFrame = frameParameter === null ? null : Math.max(0, Math.min(143, Number(frameParameter) || 0));
const groups = new Map();
let autoplay = inspectionFrame === null && !media.matches;
let epoch;
let request;

for (const name of Object.keys(motion.frames)) {
  const art = document.getElementById(`${name}-art`);
  const fieldset = document.querySelector(`.radio-group.${name}`);
  const [x, y, width, height] = motion.boxes[name];
  art.setAttribute('transform', `translate(${x + .25} ${y + .25}) scale(.5)`);
  const backdrop = document.createElementNS(NS, 'rect');
  backdrop.setAttribute('width', width * 2);
  backdrop.setAttribute('height', height * 2);
  backdrop.setAttribute('fill', '#fdfdfd');
  art.append(backdrop);
  const layers = Array.from({ length: 8 }, () => {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('fill-rule', 'evenodd');
    path.setAttribute('stroke-width', '1');
    path.setAttribute('stroke-linejoin', 'round');
    art.append(path);
    return path;
  });
  const state = { name, fieldset, layers, frame: -1, transition: null, value: 'a' };
  groups.set(name, state);
  render(state, inspectionFrame ?? (media.matches ? 143 : 0));
  if (inspectionFrame !== null) setValue(state, inspectionFrame < 12 || inspectionFrame >= 84 ? 'a' : 'b');

  fieldset.addEventListener('pointerdown', stopAutoplay);
  fieldset.addEventListener('keydown', stopAutoplay);
  fieldset.querySelectorAll('label').forEach(label => {
    label.addEventListener('click', event => {
      event.preventDefault();
      select(state, document.getElementById(label.htmlFor).value);
    });
  });
  fieldset.addEventListener('change', event => select(state, event.target.value));
}

function render(state, frame) {
  frame = Math.max(0, Math.min(143, Math.floor(frame)));
  if (state.frame === frame) return;
  state.frame = frame;
  const cel = motion.frames[state.name][frame];
  state.layers.forEach((path, index) => {
    const layer = cel[index];
    if (!layer) { path.setAttribute('d', ''); return; }
    const [gray, d] = layer;
    path.setAttribute('fill', `rgb(${gray} ${gray} ${gray})`);
    path.setAttribute('stroke', `rgb(${gray} ${gray} ${gray})`);
    path.setAttribute('d', motion.paths[d]);
  });
}

function setValue(state, value) {
  state.value = value;
  state.fieldset.querySelector(`input[value="${value}"]`).checked = true;
}

function stopAutoplay() {
  if (!autoplay) return;
  autoplay = false;
  // Finish the current motion for the other three groups when one is used.
  groups.forEach(state => {
    const forward = state.frame < 72;
    state.transition = { from: state.frame, to: forward ? 71 : 143, start: performance.now() };
    setValue(state, forward ? 'b' : 'a');
  });
}

function select(state, value) {
  stopAutoplay();
  const forward = value === 'b';
  const end = forward ? 71 : 143;
  if (media.matches) {
    render(state, end);
    state.transition = null;
  } else {
    // Continue a motion already heading to the selected side; otherwise use
    // the measured motion from that side's resting state.
    const sameDirection = forward ? state.frame < 72 : state.frame >= 72;
    const from = sameDirection ? state.frame : forward ? 0 : 72;
    state.transition = { from, to: end, start: performance.now() };
  }
  setValue(state, value);
  schedule();
}

function schedule() {
  if (!request) request = requestAnimationFrame(tick);
}

function tick(now) {
  request = null;
  if (epoch === undefined) epoch = now;
  if (autoplay) {
    const frame = Math.floor((now - epoch) * motion.fps / 1000) % motion.length;
    groups.forEach(state => {
      render(state, frame);
      setValue(state, frame < 12 || frame >= 84 ? 'a' : 'b');
    });
  } else {
    groups.forEach(state => {
      const transition = state.transition;
      if (!transition) return;
      const frame = Math.min(transition.to, transition.from + Math.floor((now - transition.start) * motion.fps / 1000));
      render(state, frame);
      if (frame === transition.to) state.transition = null;
    });
  }
  if (autoplay || [...groups.values()].some(state => state.transition)) schedule();
}

// Hidden tabs stop consuming animation work. Resume from the same video time.
let hiddenAt;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    hiddenAt = performance.now();
    cancelAnimationFrame(request);
    request = null;
  } else {
    const elapsed = hiddenAt === undefined ? 0 : performance.now() - hiddenAt;
    if (epoch !== undefined) epoch += elapsed;
    groups.forEach(state => { if (state.transition) state.transition.start += elapsed; });
    if (autoplay || [...groups.values()].some(state => state.transition)) schedule();
  }
});
media.addEventListener('change', () => {
  autoplay = false;
  groups.forEach(state => {
    state.transition = null;
    render(state, state.value === 'a' ? 143 : 71);
  });
});
if (autoplay) schedule();
