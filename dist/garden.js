(() => {
  'use strict';
  const garden = document.querySelector('.footer-garden');
  if (!garden) return;
  const character = garden.querySelector('.garden-character');
  const canvas = garden.querySelector('.garden-mascot');
  const shadow = garden.querySelector('.garden-shadow');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const atlas = new Image();
  const parts = [];
  let width = garden.clientWidth;
  let x = width * .6;
  let target = x;
  let velocity = 0;
  let phase = 0;
  let facing = 1; // The original artwork faces left.
  let faceScale = 1;
  let frame = 0;
  let previousTime = 0;
  let visible = false;
  let ready = false;
  let running = 0;
  let bodyScale = width < 620 ? .87 : 1;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const approach = (value, goal, amount) => value + clamp(goal - value, -amount, amount);
  const limitX = (value) => clamp(value, 38 * bodyScale, width - 38 * bodyScale);

  // Trim each isolated atlas cell once, preserving the supplied artwork.
  function readParts() {
    const scratch = document.createElement('canvas');
    scratch.width = atlas.naturalWidth;
    scratch.height = atlas.naturalHeight;
    const read = scratch.getContext('2d', { willReadFrequently: true });
    read.drawImage(atlas, 0, 0);
    const pixels = read.getImageData(0, 0, scratch.width, scratch.height).data;
    for (const [col, row] of [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1]]) {
      const left = Math.floor(col * scratch.width / 3);
      const top = Math.floor(row * scratch.height / 2);
      const right = Math.floor((col + 1) * scratch.width / 3);
      const bottom = Math.floor((row + 1) * scratch.height / 2);
      let minX = right, minY = bottom, maxX = left, maxY = top;
      for (let py = top; py < bottom; py++) {
        for (let px = left; px < right; px++) {
          if (pixels[(py * scratch.width + px) * 4 + 3] > 24) {
            minX = Math.min(minX, px); maxX = Math.max(maxX, px);
            minY = Math.min(minY, py); maxY = Math.max(maxY, py);
          }
        }
      }
      if (maxX <= minX || maxY <= minY) throw new Error('Missing garden character part');
      parts.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
    }
  }

  function drawPart(index, left, top, partWidth, partHeight) {
    const p = parts[index];
    ctx.drawImage(atlas, p.x, p.y, p.w, p.h, left, top, partWidth, partHeight);
  }

  // Half a cycle plants each foot; the other half lifts it back to the front.
  function footPose(offset) {
    const p = (phase + offset) % 1;
    const stride = 25 * running;
    if (p < .5) return { x: -stride / 2 + stride * p * 2, y: 0 };
    const swing = (p - .5) * 2;
    return { x: stride / 2 - stride * swing, y: -Math.sin(swing * Math.PI) * 9 * running };
  }

  function drawLeg(index, hipX, hipY, foot, restX) {
    const footX = foot.x + restX;
    const dx = footX - hipX, dy = foot.y - hipY;
    ctx.save();
    ctx.translate(hipX, hipY);
    ctx.rotate(-Math.atan2(dx, dy));
    drawPart(index, -3, -3, 6, Math.hypot(dx, dy) + 4);
    ctx.restore();
  }

  function paint(time) {
    const speed = Math.abs(velocity);
    const bounce = running * (1.1 + 1.1 * Math.sin(phase * Math.PI * 4));
    const baseX = -speed / 140;
    const baseY = -12 - bounce;
    const tilt = -.055 * running;
    const bodyHeight = 50;
    const bodyWidth = bodyHeight * parts[0].w / parts[0].h;
    const hip = (localX) => ({
      x: baseX + localX * Math.cos(tilt),
      y: baseY + localX * Math.sin(tilt) - 1
    });
    const rearHip = hip(6), frontHip = hip(-6);
    const rearFoot = footPose(.5), frontFoot = footPose(0);
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, 128, 128);
    ctx.save();
    ctx.translate(64, 110);
    ctx.scale(bodyScale * faceScale, bodyScale);
    drawLeg(4, rearHip.x, rearHip.y, rearFoot, 6);
    drawLeg(3, frontHip.x, frontHip.y, frontFoot, -6);
    // The body and both shoulder pivots share one transform, so arms stay attached.
    ctx.save();
    ctx.translate(baseX, baseY);
    ctx.rotate(tilt);
    // At rest both arms hang vertically. Running blends in an opposite swing.
    ctx.save();
    ctx.translate(-bodyWidth * .34, -bodyHeight * .41);
    ctx.rotate((.15 - Math.sin(phase * Math.PI * 2) * .5) * running);
    drawPart(2, -3.5, -3, 7, 14);
    ctx.restore();
    drawPart(0, -bodyWidth / 2, -bodyHeight, bodyWidth, bodyHeight);
    // The body artwork contains the dark eye shapes. Small moving catchlights give
    // them a quiet, coordinated glance while every other body part stays still.
    if (speed < 2 && running < .04 && !reducedMotion.matches) {
      const gazeX = (Math.sin(time / 920) + Math.sin(time / 2270)) * .28;
      const gazeY = Math.sin(time / 1330 + .8) * .22;
      ctx.save();
      ctx.fillStyle = 'rgba(220, 246, 210, .82)';
      ctx.beginPath();
      ctx.ellipse(-18.55 + gazeX * .55, -28.35 + gazeY * .55, .42, .7, 0, 0, Math.PI * 2);
      ctx.ellipse(-11.75 + gazeX, -28.75 + gazeY, .68, 1.02, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    ctx.translate(bodyWidth * .31, -bodyHeight * .49);
    ctx.rotate((-.18 + Math.sin(phase * Math.PI * 2) * .55) * running);
    drawPart(1, -3.5, -4, 7, 16);
    ctx.restore();
    ctx.restore();
    ctx.restore();
    character.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    const lift = bounce;
    shadow.style.transform = `translateX(2px) scale(${(bodyScale * (1 + lift * .025)).toFixed(3)},${bodyScale})`;
    shadow.style.opacity = (.94 - lift * .055).toFixed(3);
    shadow.style.filter = `blur(${(1 + lift * .13).toFixed(2)}px)`;
  }

  function tick(now) {
    frame = 0;
    if (!ready || !visible || document.hidden || reducedMotion.matches) return;
    const dt = Math.min((now - (previousTime || now)) / 1000, .035);
    previousTime = now;
    const distance = target - x;
    const desired = clamp(distance * 4, -140 * bodyScale, 140 * bodyScale);
    velocity = approach(velocity, desired, 480 * bodyScale * dt);
    const oldX = x;
    x = limitX(x + velocity * dt);
    if (Math.abs(target - x) < .65 && Math.abs(velocity) < 5) { x = target; velocity = 0; }
    if ((x <= 38 * bodyScale && velocity < 0) || (x >= width - 38 * bodyScale && velocity > 0)) velocity = 0;
    if (Math.abs(velocity) > 12) facing = velocity < 0 ? 1 : -1;
    faceScale = approach(faceScale, facing, dt * 15);
    running = approach(running, Math.min(1, Math.abs(velocity) / 65), dt * 9);
    phase = (phase + Math.abs(x - oldX) / (50 * bodyScale)) % 1;
    paint(now);
    frame = requestAnimationFrame(tick);
  }

  function schedule() {
    garden.classList.toggle('is-active', visible && !document.hidden && !reducedMotion.matches);
    if (!ready) return;
    if (reducedMotion.matches) { velocity = 0; running = 0; paint(0); return; }
    if (visible && !document.hidden && !frame) { previousTime = 0; frame = requestAnimationFrame(tick); }
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    garden.classList.remove('is-active');
  }

  function aim(localX) {
    target = limitX(localX);
    if (reducedMotion.matches) return;
    schedule();
  }

  window.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    const paper = garden.closest('.page').getBoundingClientRect();
    if (event.clientX < paper.left || event.clientX > paper.right || event.clientY < paper.top || event.clientY > paper.bottom) return;
    aim(event.clientX - garden.getBoundingClientRect().left);
  }, { passive: true });
  garden.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    aim(event.clientX - garden.getBoundingClientRect().left);
  }, { passive: true });
  garden.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') aim(0);
    else if (event.key === 'End') aim(width);
    else aim(target + (event.key === 'ArrowLeft' ? -65 : 65));
    if (reducedMotion.matches) { x = target; if (ready) paint(0); }
  });

  new ResizeObserver(() => {
    const oldWidth = width;
    width = garden.clientWidth;
    bodyScale = width < 620 ? .87 : 1;
    x = limitX(x / (oldWidth || width) * width);
    target = limitX(target / (oldWidth || width) * width);
    if (ready) paint(performance.now());
  }).observe(garden);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) schedule(); else stop();
  }, { threshold: .01 }).observe(garden);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : schedule());
  reducedMotion.addEventListener('change', () => { stop(); schedule(); });
  atlas.onload = () => {
    try {
      readParts();
      ready = true;
      paint(0);
      garden.classList.add('is-ready');
      schedule();
    } catch (error) { console.error('Garden artwork could not be prepared.', error); }
  };
  atlas.src = 'garden-mascot.png';
})();
