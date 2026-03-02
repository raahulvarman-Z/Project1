// ============================================================
//  FLAPPY BIRD — game.js  (with theme system)
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;   // 400
const H = canvas.height;  // 600

// ── DOM refs ─────────────────────────────────────────────────
const startScreen = document.getElementById('start-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const hud = document.getElementById('hud');
const scoreDisplay = document.getElementById('score-display');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const changeThemeBtn = document.getElementById('change-theme-btn');
const finalScore = document.getElementById('final-score');
const finalBest = document.getElementById('final-best');
const newBestBadge = document.getElementById('new-best-badge');
const bestScoreStart = document.getElementById('best-score-start');
const themeGrid = document.getElementById('theme-grid');

// ── Constants ────────────────────────────────────────────────
const GRAVITY = 0.38;
const FLAP_STRENGTH = -7.5;
const PIPE_SPEED = 2.6;
const PIPE_GAP = 155;
const PIPE_INTERVAL = 1700;
const GROUND_H = 80;
const PIPE_W = 60;

// ── THEMES ───────────────────────────────────────────────────
const THEMES = {
    night: {
        name: 'Night Sky',
        // Sky gradient stops [offset, color]
        sky: [
            [0, '#0c1445'],
            [0.4, '#1a237e'],
            [1, '#283593'],
        ],
        // Celestial body: 'moon' or 'sun'
        celestial: 'moon',
        moonColor: '#fffde7',
        moonGlow: '#fffde7',
        moonShadow: '#1a237e',
        // Stars
        showStars: true,
        starColor: '#ffffff',
        // Mountains
        mountain1: { color: '#283593', alpha: 0.35 },
        mountain2: { color: '#1565C0', alpha: 0.25 },
        // Ground
        ground: ['#4caf50', '#388e3c', '#1b5e20'],
        groundTop: '#66bb6a',
        // Pipe
        pipe: ['#43a047', '#81c784', '#2e7d32'],
        pipeCap: ['#388e3c', '#a5d6a7', '#1b5e20'],
        // Bird body gradient
        birdBody: ['#fff176', '#ffd600', '#f57f17'],
        birdWing: '#ff8f00',
        birdBeak: '#ff6f00',
        // Particle hue range [min, range]
        particleHue: [30, 40],
    },

    tropical: {
        name: 'Tropical Day',
        sky: [
            [0, '#0277bd'],
            [0.5, '#29b6f6'],
            [1, '#81d4fa'],
        ],
        celestial: 'sun',
        sunColor: '#fff9c4',
        sunGlow: '#fff176',
        // Stars
        showStars: false,
        starColor: '#fff',
        // Clouds instead of stars rendered separately
        showClouds: true,
        // Mountains (green hills)
        mountain1: { color: '#2e7d32', alpha: 0.5 },
        mountain2: { color: '#43a047', alpha: 0.4 },
        // Ground
        ground: ['#66bb6a', '#43a047', '#2e7d32'],
        groundTop: '#a5d6a7',
        // Pipe  (bamboo-ish golden-green)
        pipe: ['#558b2f', '#9ccc65', '#33691e'],
        pipeCap: ['#558b2f', '#dce775', '#33691e'],
        // Bird  red parrot
        birdBody: ['#ff5252', '#f44336', '#b71c1c'],
        birdWing: '#ff8f00',
        birdBeak: '#ffd600',
        particleHue: [100, 60],  // greens
    },

    sunset: {
        name: 'Desert Sunset',
        sky: [
            [0, '#4a0f00'],
            [0.3, '#c62828'],
            [0.6, '#ef5350'],
            [0.85, '#ff8f00'],
            [1, '#d4a04a'],
        ],
        celestial: 'sun',
        sunColor: '#ffcc02',
        sunGlow: '#ff6d00',
        showStars: false,
        starColor: '#fff',
        // Mountains (sand dunes silhouette)
        mountain1: { color: '#bf360c', alpha: 0.5 },
        mountain2: { color: '#e64a19', alpha: 0.35 },
        // Ground (sandy)
        ground: ['#c8a04a', '#a1793a', '#6d4c1f'],
        groundTop: '#e8c06a',
        // Pipe (stone/terracotta)
        pipe: ['#8d6e63', '#bcaaa4', '#4e342e'],
        pipeCap: ['#795548', '#d7ccc8', '#3e2723'],
        // Bird  white dove
        birdBody: ['#ffffff', '#e0e0e0', '#9e9e9e'],
        birdWing: '#bdbdbd',
        birdBeak: '#ff8f00',
        particleHue: [30, 30],   // oranges
    },

    neon: {
        name: 'Neon City',
        sky: [
            [0, '#0a0015'],
            [0.5, '#12002b'],
            [1, '#0d001a'],
        ],
        celestial: 'moon',
        moonColor: '#b388ff',
        moonGlow: '#7c4dff',
        moonShadow: '#12002b',
        showStars: true,
        starColor: '#b388ff',
        showBuildings: true,
        // Mountains (city skyline handled separately)
        mountain1: { color: '#1a0030', alpha: 0.9 },
        mountain2: { color: '#0d001a', alpha: 0.8 },
        // Ground (dark road + neon strip)
        ground: ['#1a1a2e', '#0f0f1c', '#050510'],
        groundTop: '#00e5ff',
        // Pipe  neon cyan
        pipe: ['#006064', '#00e5ff', '#002f30'],
        pipeCap: ['#00acc1', '#84ffff', '#006064'],
        pipeGlow: true,
        // Bird  cyan / electric
        birdBody: ['#84ffff', '#00e5ff', '#00838f'],
        birdWing: '#e040fb',
        birdBeak: '#ffea00',
        particleHue: [170, 80],  // cyans/purples
    },
};

// ── Active theme ──────────────────────────────────────────────
let currentThemeKey = localStorage.getItem('flappy_theme') || 'night';
let T = THEMES[currentThemeKey];

// ── State ─────────────────────────────────────────────────────
let state = 'start';
let score = 0;
let bestScore = parseInt(localStorage.getItem('flappy_best') || '0');
let animId = null;
let lastTime = 0;
let pipeTimer = 0;

// Bird
const bird = {
    x: 90, y: H / 2 - 20,
    vy: 0,
    w: 38, h: 28,
    rotation: 0,
    flapAnim: 0,
    flapDir: 1,
};

let pipes = [];
let groundX = 0;
let particles = [];

// Stars
const stars = Array.from({ length: 70 }, () => ({
    x: Math.random() * W,
    y: Math.random() * (H - GROUND_H - 60),
    r: Math.random() * 1.5 + 0.3,
    alpha: Math.random() * 0.6 + 0.2,
    speed: Math.random() * 0.3 + 0.05,
}));

// Clouds (tropical theme)
const clouds = Array.from({ length: 5 }, (_, i) => ({
    x: (i / 5) * W + Math.random() * 60,
    y: Math.random() * 140 + 30,
    w: Math.random() * 80 + 50,
    speed: Math.random() * 0.4 + 0.15,
    alpha: Math.random() * 0.3 + 0.5,
}));

// City buildings (neon theme)
const buildings = Array.from({ length: 10 }, (_, i) => ({
    x: i * 45 - 20,
    w: Math.random() * 30 + 25,
    h: Math.random() * 120 + 80,
    hue: Math.random() > 0.5 ? 270 : 175,
}));

// ── Theme switching ───────────────────────────────────────────
function selectTheme(key) {
    currentThemeKey = key;
    T = THEMES[key];
    localStorage.setItem('flappy_theme', key);

    // Update active button
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === key);
    });
}

// Attach theme button listeners
document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => selectTheme(btn.dataset.theme));
});

// Set initial active via saved preference
selectTheme(currentThemeKey);

// ── Helpers ───────────────────────────────────────────────────
function resetGame() {
    bird.x = 90; bird.y = H / 2 - 20;
    bird.vy = 0; bird.rotation = 0; bird.flapAnim = 0;
    pipes = []; particles = [];
    score = 0; pipeTimer = 0; groundX = 0;
    scoreDisplay.textContent = '0';
}

function flap() {
    if (state === 'dead') return;
    if (state === 'start') { startGame(); return; }
    bird.vy = FLAP_STRENGTH;
    bird.rotation = -0.4;
    spawnParticles(bird.x + bird.w / 2, bird.y + bird.h / 2);
}

function spawnParticles(x, y) {
    const [hueBase, hueRange] = T.particleHue;
    for (let i = 0; i < 7; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.5 + 0.5;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            decay: Math.random() * 0.04 + 0.03,
            r: Math.random() * 4 + 2,
            hue: hueBase + Math.random() * hueRange,
        });
    }
}

function spawnPipe() {
    const minY = 70, maxY = H - GROUND_H - PIPE_GAP - 70;
    const topH = Math.random() * (maxY - minY) + minY;
    pipes.push({ x: W + 10, topH, scored: false });
}

function checkCollision() {
    const bx = bird.x + 5, by = bird.y + 5;
    const bw = bird.w - 10, bh = bird.h - 10;
    if (bird.y + bird.h >= H - GROUND_H || bird.y <= 0) return true;
    for (const p of pipes) {
        const inX = bx < p.x + PIPE_W && bx + bw > p.x;
        const inTopY = by < p.topH;
        const inBotY = by + bh > p.topH + PIPE_GAP;
        if (inX && (inTopY || inBotY)) return true;
    }
    return false;
}

// ── Game States ───────────────────────────────────────────────
function startGame() {
    state = 'playing';
    startScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    resetGame();
    bestScoreStart.textContent = bestScore;
    if (animId) cancelAnimationFrame(animId);
    lastTime = performance.now();
    animId = requestAnimationFrame(loop);
}

function gameOver() {
    state = 'dead';
    let isNew = false;
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('flappy_best', bestScore);
        isNew = true;
    }
    finalScore.textContent = score;
    finalBest.textContent = bestScore;
    bestScoreStart.textContent = bestScore;
    newBestBadge.classList.toggle('hidden', !isNew);
    hud.classList.add('hidden');
    setTimeout(() => gameoverScreen.classList.remove('hidden'), 600);
}

// ── Update ────────────────────────────────────────────────────
function update(dt) {
    groundX = (groundX - PIPE_SPEED * (dt / 16)) % 40;

    // Stars (scroll slightly)
    for (const s of stars) {
        s.x -= s.speed * (dt / 16);
        if (s.x < 0) { s.x = W; s.y = Math.random() * (H - GROUND_H - 60); }
    }

    // Clouds
    for (const c of clouds) {
        c.x -= c.speed * (dt / 16);
        if (c.x + c.w < 0) c.x = W + 10;
    }

    if (state !== 'playing') return;

    bird.vy += GRAVITY * (dt / 16);
    bird.y += bird.vy * (dt / 16);
    bird.rotation += (bird.vy * 0.06 - bird.rotation) * 0.15;
    bird.flapAnim += bird.flapDir * 0.15;
    if (bird.flapAnim >= 1 || bird.flapAnim <= 0) bird.flapDir *= -1;

    pipeTimer += dt;
    if (pipeTimer >= PIPE_INTERVAL) { spawnPipe(); pipeTimer = 0; }

    for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= PIPE_SPEED * (dt / 16);
        if (!p.scored && p.x + PIPE_W < bird.x) {
            p.scored = true; score++;
            scoreDisplay.textContent = score;
        }
        if (p.x + PIPE_W < -20) pipes.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.1;
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
    }

    if (checkCollision()) gameOver();
}

// ── Draw helpers ──────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ── Background ────────────────────────────────────────────────
function drawBackground() {
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, H - GROUND_H);
    T.sky.forEach(([stop, color]) => sky.addColorStop(stop, color));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H - GROUND_H);

    // Theme-specific decorations
    if (T.showStars) drawStars();
    if (T.showClouds) drawClouds();
    if (T.showBuildings) drawBuildings();

    // Celestial body
    if (T.celestial === 'moon') drawMoon();
    else drawSun();

    // Mountains / hills
    drawMountains();
}

function drawStars() {
    for (const s of stars) {
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = T.starColor;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawClouds() {
    for (const c of clouds) {
        ctx.save();
        ctx.globalAlpha = c.alpha;
        ctx.fillStyle = '#fff';
        // Simple cloud: 3 overlapping circles
        ctx.beginPath();
        ctx.arc(c.x + c.w * 0.25, c.y + 10, c.w * 0.18, 0, Math.PI * 2);
        ctx.arc(c.x + c.w * 0.5, c.y, c.w * 0.25, 0, Math.PI * 2);
        ctx.arc(c.x + c.w * 0.75, c.y + 8, c.w * 0.18, 0, Math.PI * 2);
        ctx.arc(c.x + c.w * 0.5, c.y + 14, c.w * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawBuildings() {
    // Draw neon city silhouette
    for (const b of buildings) {
        const by = H - GROUND_H - b.h;
        ctx.save();
        ctx.fillStyle = `hsl(${b.hue}, 60%, 8%)`;
        ctx.fillRect(b.x, by, b.w, b.h);

        // Neon windows
        ctx.globalAlpha = 0.7;
        for (let row = 0; row < Math.floor(b.h / 14); row++) {
            for (let col = 0; col < Math.floor(b.w / 8); col++) {
                if (Math.random() > 0.45) {
                    ctx.fillStyle = `hsl(${b.hue}, 100%, 70%)`;
                    ctx.fillRect(b.x + 3 + col * 8, by + 5 + row * 14, 4, 6);
                }
            }
        }

        // Roof glow
        ctx.globalAlpha = 0.5;
        ctx.shadowColor = `hsl(${b.hue}, 100%, 70%)`;
        ctx.shadowBlur = 8;
        ctx.fillStyle = `hsl(${b.hue}, 100%, 70%)`;
        ctx.fillRect(b.x, by, b.w, 2);

        ctx.restore();
    }
}

function drawMoon() {
    ctx.save();
    ctx.fillStyle = T.moonColor;
    ctx.shadowColor = T.moonGlow;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(340, 55, 28, 0, Math.PI * 2);
    ctx.fill();
    // Crescent cut
    ctx.fillStyle = T.moonShadow;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(350, 50, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawSun() {
    ctx.save();
    // Glow layers
    const glow = ctx.createRadialGradient(340, 55, 10, 340, 55, 55);
    glow.addColorStop(0, T.sunGlow + 'cc');
    glow.addColorStop(0.5, T.sunGlow + '44');
    glow.addColorStop(1, T.sunGlow + '00');
    ctx.fillStyle = glow;
    ctx.fillRect(285, 0, 110, 120);

    ctx.shadowColor = T.sunGlow;
    ctx.shadowBlur = 25;
    ctx.fillStyle = T.sunColor;
    ctx.beginPath();
    ctx.arc(340, 55, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawMountains() {
    const m1 = T.mountain1, m2 = T.mountain2;

    ctx.save();
    ctx.globalAlpha = m1.alpha;
    ctx.fillStyle = m1.color;
    ctx.beginPath();
    ctx.moveTo(0, H - GROUND_H);
    ctx.lineTo(0, 320);
    ctx.lineTo(60, 240);
    ctx.lineTo(130, 310);
    ctx.lineTo(200, 200);
    ctx.lineTo(280, 290);
    ctx.lineTo(340, 220);
    ctx.lineTo(400, 280);
    ctx.lineTo(400, H - GROUND_H);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = m2.alpha;
    ctx.fillStyle = m2.color;
    ctx.beginPath();
    ctx.moveTo(0, H - GROUND_H);
    ctx.lineTo(0, 370);
    ctx.lineTo(80, 300);
    ctx.lineTo(160, 360);
    ctx.lineTo(240, 280);
    ctx.lineTo(320, 340);
    ctx.lineTo(400, 300);
    ctx.lineTo(400, H - GROUND_H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// ── Ground ────────────────────────────────────────────────────
function drawGround() {
    const [c0, c1, c2] = T.ground;
    const gGrad = ctx.createLinearGradient(0, H - GROUND_H, 0, H);
    gGrad.addColorStop(0, c0);
    gGrad.addColorStop(0.15, c1);
    gGrad.addColorStop(1, c2);
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, H - GROUND_H, W, GROUND_H);

    // Stripe
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 14; i++) {
        const xBase = ((groundX + i * 40) % (W + 40)) - 40;
        ctx.fillRect(xBase, H - GROUND_H, 20, GROUND_H);
    }
    ctx.restore();

    // Top edge
    ctx.fillStyle = T.groundTop;
    if (currentThemeKey === 'neon') {
        ctx.save();
        ctx.shadowColor = T.groundTop;
        ctx.shadowBlur = 10;
        ctx.fillStyle = T.groundTop;
        ctx.fillRect(0, H - GROUND_H, W, 3);
        ctx.restore();
    } else {
        ctx.fillRect(0, H - GROUND_H, W, 8);
    }
}

// ── Pipe ──────────────────────────────────────────────────────
function drawPipe(p) {
    const capH = 22, capPad = 5;
    const botY = p.topH + PIPE_GAP;
    const botH = H - GROUND_H - botY;

    const [pa, pb, pc] = T.pipe;
    const [ca, cb, cc] = T.pipeCap;

    function makePipeGrad(x) {
        const g = ctx.createLinearGradient(x, 0, x + PIPE_W, 0);
        g.addColorStop(0, pa); g.addColorStop(0.35, pb); g.addColorStop(1, pc);
        return g;
    }
    function makeCapGrad(x) {
        const g = ctx.createLinearGradient(x - capPad, 0, x + PIPE_W + capPad, 0);
        g.addColorStop(0, ca); g.addColorStop(0.35, cb); g.addColorStop(1, cc);
        return g;
    }

    if (T.pipeGlow) {
        ctx.save();
        ctx.shadowColor = cb;
        ctx.shadowBlur = 12;
    }

    // Top body
    ctx.fillStyle = makePipeGrad(p.x);
    ctx.fillRect(p.x, 0, PIPE_W, p.topH);
    // Top cap
    ctx.fillStyle = makeCapGrad(p.x);
    roundRect(ctx, p.x - capPad, p.topH - capH, PIPE_W + capPad * 2, capH, 6);
    ctx.fill();

    // Bottom body
    ctx.fillStyle = makePipeGrad(p.x);
    ctx.fillRect(p.x, botY, PIPE_W, botH);
    // Bottom cap
    ctx.fillStyle = makeCapGrad(p.x);
    roundRect(ctx, p.x - capPad, botY, PIPE_W + capPad * 2, capH, 6);
    ctx.fill();

    if (T.pipeGlow) ctx.restore();

    // Shine
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#fff';
    ctx.fillRect(p.x + 8, 0, 8, p.topH);
    ctx.fillRect(p.x + 8, botY + capH, 8, botH - capH);
    ctx.restore();
}

// ── Bird ──────────────────────────────────────────────────────
function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.w / 2, bird.y + bird.h / 2);
    ctx.rotate(Math.max(-0.5, Math.min(1.2, bird.rotation)));

    const bw = bird.w, bh = bird.h;
    const [bc0, bc1, bc2] = T.birdBody;

    // Body
    const bodyGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, bw / 1.6);
    bodyGrad.addColorStop(0, bc0);
    bodyGrad.addColorStop(0.5, bc1);
    bodyGrad.addColorStop(1, bc2);

    // Neon bird glow
    if (currentThemeKey === 'neon') {
        ctx.shadowColor = bc1;
        ctx.shadowBlur = 14;
    }

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, bw / 2, bh / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    if (currentThemeKey === 'neon') ctx.shadowBlur = 0;

    // Wing
    const wingY = bh * 0.1;
    const wFlap = bird.flapAnim * bh * 0.25;
    ctx.fillStyle = T.birdWing;
    ctx.beginPath();
    ctx.ellipse(-bw * 0.05, wingY + wFlap, bw * 0.26, bh * 0.35, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(bw * 0.22, -bh * 0.12, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(bw * 0.24, -bh * 0.11, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(bw * 0.26, -bh * 0.15, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = T.birdBeak;
    ctx.beginPath();
    ctx.moveTo(bw * 0.42, -bh * 0.04);
    ctx.lineTo(bw * 0.6, -bh * 0.02);
    ctx.lineTo(bw * 0.42, bh * 0.1);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// ── Particles ─────────────────────────────────────────────────
function drawParticles() {
    for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.life * 0.8;
        ctx.fillStyle = `hsl(${p.hue}, 100%, 65%)`;
        ctx.shadowColor = `hsl(${p.hue}, 100%, 65%)`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Idle floating bird on start screen
let idleT = 0;
function drawIdleBird() {
    idleT += 0.04;
    bird.y = H / 2 - 20 + Math.sin(idleT) * 8;
    bird.rotation = Math.sin(idleT * 0.8) * 0.12;
    bird.flapAnim += 0.12;
    if (bird.flapAnim > 1) bird.flapAnim = 0;
    drawBird();
}

// ── Main Loop ─────────────────────────────────────────────────
function loop(ts) {
    const dt = Math.min(ts - lastTime, 50);
    lastTime = ts;
    update(dt);
    render();
    animId = requestAnimationFrame(loop);
}

function render() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    for (const p of pipes) drawPipe(p);
    drawGround();
    drawParticles();
    if (state === 'start') drawIdleBird();
    else drawBird();
}

// ── Input ─────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap(); }
});
canvas.addEventListener('pointerdown', e => { e.preventDefault(); flap(); });

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => {
    gameoverScreen.classList.add('hidden');
    startGame();
});
changeThemeBtn.addEventListener('click', () => {
    gameoverScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
});

// ── Init ──────────────────────────────────────────────────────
bestScoreStart.textContent = bestScore;
lastTime = performance.now();
animId = requestAnimationFrame(loop);
