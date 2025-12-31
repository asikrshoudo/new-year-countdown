// Elements
const countdownEl = document.getElementById('countdown');
const staticPartEl = document.getElementById('staticPart');
const digitBox = document.getElementById('digitBox');
const oldDigitEl = document.getElementById('oldDigit');
const newDigitEl = document.getElementById('newDigit');
const messageEl = document.getElementById('wishMessage');
const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');
const easterEgg = document.getElementById('easterEgg');

// Canvas sizing
let cw = window.innerWidth;
let ch = window.innerHeight;
canvas.width = cw;
canvas.height = ch;

// Scene state
let isCelebrating = false;
let particles = [];    // fireworks particles
let sparks = [];       // line sparks for nicer fireworks
let snow = [];
let tiltX = 0, tiltY = 0;
let swapTriggered = false; // ensure swap/celebration triggers only once per new-year moment

// --- Year / Countdown logic ---
// show current device year initially (e.g., 2025)
let now = new Date();
let displayYear = now.getFullYear(); // e.g., 2025
// static part = all but last digit
function staticPartOf(y) { return String(y).slice(0, -1); }
function lastDigitOf(y) { return String(y).slice(-1); }

// initialize year UI
staticPartEl.textContent = staticPartOf(displayYear);
oldDigitEl.textContent = lastDigitOf(displayYear);

// target is Jan 1 of next year (local device time)
function nextNewYearDate(baseYear) {
  return new Date(`January 1, ${baseYear + 1} 00:00:00`);
}
let targetDate = nextNewYearDate(displayYear);

// update countdown every second, using device local time
function updateCountdown() {
  const now = new Date();
  const diff = targetDate - now;

  // Trigger only if we are within the 60-second window after the exact new-year moment
  if (diff <= 0 && (now - targetDate) < 60 * 1000) {
    if (!swapTriggered) {
      swapTriggered = true;
      triggerYearSwapAndCelebrate();
    }
    countdownEl.textContent = "00:00:00";
    return;
  }

  // If we're already past the 60s celebration window, prepare for next year
  if ((now - targetDate) >= 60 * 1000) {
    // ensure displayYear is up to date (in case page stayed open across years)
    if (displayYear < now.getFullYear()) {
      displayYear = now.getFullYear();
      staticPartEl.textContent = staticPartOf(displayYear);
      oldDigitEl.textContent = lastDigitOf(displayYear);
      targetDate = nextNewYearDate(displayYear);
      swapTriggered = false;
    }
  }

  const hrs = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
  const mins = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
  const secs = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
  countdownEl.textContent = `${hrs}:${mins}:${secs}`;
}
setInterval(updateCountdown, 1000);
updateCountdown();

// --- Year swap animation + celebration ---
// Fireworks will run only when the real Jan 1 moment occurs, and for exactly 60 seconds.
function triggerYearSwapAndCelebrate() {
  isCelebrating = true;

  const nextYear = displayYear + 1;
  const nextStatic = staticPartOf(nextYear);
  const nextLast = lastDigitOf(nextYear);

  newDigitEl.textContent = nextLast;
  digitBox.classList.add('swap-now');

  setTimeout(() => {
    if (staticPartEl.textContent !== nextStatic) {
      staticPartEl.textContent = nextStatic;
    }
    oldDigitEl.textContent = nextLast;
    digitBox.classList.remove('swap-now');

    messageEl.classList.add('show-message');
    startFireworks();

    // update displayYear and next target
    displayYear = nextYear;
    targetDate = nextNewYearDate(displayYear);

    // Fireworks run exactly 60 seconds from the real new-year moment
    setTimeout(() => {
      stopFireworksImmediately();
      messageEl.classList.remove('show-message');
      isCelebrating = false;
      // allow next year's trigger when its moment arrives
      swapTriggered = false;
    }, 60 * 1000);

  }, 900); // match CSS transition timing
}

// --- Fireworks implementation (improved visuals) ---
function startFireworks() {
  // spawn a few initial explosions
  for (let i = 0; i < 6; i++) createFireworkBurst();
  // keep spawning while celebrating
  fireworksInterval = setInterval(() => {
    if (isCelebrating) {
      if (Math.random() < 0.85) createFireworkBurst();
    }
  }, 600);
}
let fireworksInterval = null;
function stopFireworksImmediately() {
  clearInterval(fireworksInterval);
  fireworksInterval = null;
  // leave existing particles to fade naturally
}

function createFireworkBurst() {
  const cx = Math.random() * cw * 0.9 + cw * 0.05;
  const cy = Math.random() * ch * 0.45 + ch * 0.05;
  const hue = Math.floor(Math.random() * 360);
  const count = 40 + Math.floor(Math.random() * 40);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2) * (i / count) + (Math.random() - 0.5) * 0.4;
    const speed = 2 + Math.random() * 5;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.01 + Math.random() * 0.02,
      color: `hsl(${hue + (Math.random()*40-20)}, 90%, ${50 + Math.random()*10}%)`,
      size: 1 + Math.random() * 2
    });
  }
  // add some long sparks
  for (let s = 0; s < 8; s++) {
    sparks.push({
      x: cx,
      y: cy,
      vx: (Math.random()-0.5)*6,
      vy: (Math.random()-0.5)*6,
      life: 1,
      decay: 0.02 + Math.random()*0.03,
      color: `hsl(${hue + (Math.random()*60-30)}, 100%, 60%)`,
      len: 8 + Math.random()*18
    });
  }
}

// --- Snow (lighter, smaller, prettier) ---
function createSnow(count = 80) {
  snow = [];
  for (let i = 0; i < count; i++) {
    snow.push({
      x: Math.random() * cw,
      y: Math.random() * ch,
      r: 0.5 + Math.random() * 0.9,      // smaller radius
      speed: 0.15 + Math.random() * 0.6, // gentle fall
      drift: (Math.random() - 0.5) * 0.3,
      alpha: 0.25 + Math.random() * 0.45
    });
  }
}
createSnow(80);

// --- Device tilt (mobile) ---
window.addEventListener('deviceorientation', (ev) => {
  tiltX = ev.gamma || 0;
  tiltY = ev.beta || 0;
}, { passive: true });

// --- Animation loop ---
function clearCanvas() {
  // subtle trail for fireworks
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, 0, cw, ch);
}

function drawSnow() {
  for (let s of snow) {
    // apply tilt influence gently
    s.x += s.drift + (tiltX || 0) * 0.002;
    s.y += s.speed + (tiltY || 0) * 0.002;

    if (s.y > ch + 5) {
      s.y = -5;
      s.x = Math.random() * cw;
    }
    if (s.x > cw + 5) s.x = -5;
    if (s.x < -5) s.x = cw + 5;

    ctx.beginPath();
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    // physics
    p.vx *= 0.995;
    p.vy *= 0.995;
    p.vy += 0.02; // gravity
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    // glow
    ctx.beginPath();
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12 + p.size*2);
    g.addColorStop(0, p.color);
    g.addColorStop(0.4, p.color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.globalAlpha = Math.max(0.12, p.life);
    ctx.fillRect(p.x - 12, p.y - 12, 24, 24);

    // core dot
    ctx.beginPath();
    ctx.globalAlpha = Math.max(0.6, p.life);
    ctx.fillStyle = p.color;
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawSparks() {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.vx *= 0.98;
    s.vy *= 0.98;
    s.vy += 0.01;
    s.x += s.vx;
    s.y += s.vy;
    s.life -= s.decay;

    if (s.life <= 0) {
      sparks.splice(i, 1);
      continue;
    }

    ctx.beginPath();
    ctx.globalAlpha = Math.max(0.2, s.life);
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 1.2;
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx * s.len, s.y - s.vy * s.len);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function animate() {
  requestAnimationFrame(animate);
  clearCanvas();
  drawSnow();
  drawParticles();
  drawSparks();
}
animate();

// --- Resize handling ---
window.addEventListener('resize', () => {
  cw = window.innerWidth;
  ch = window.innerHeight;
  canvas.width = cw;
  canvas.height = ch;
  createSnow(80);
});

// --- Easter egg: reveal footer with Ctrl+Shift+D ---
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
    easterEgg.style.display = easterEgg.style.display === 'block' ? 'none' : 'block';
  }
});