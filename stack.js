// ============================================================
//  STACK SIX — stack.js
//  Classic sliding-block stacking game
// ============================================================

const canvas = document.getElementById('stackCanvas');
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
const finalScore = document.getElementById('final-score');
const finalBest = document.getElementById('final-best');
const newBestBadge = document.getElementById('new-best-badge');
const bestScoreStart = document.getElementById('best-score-start');

// ── Config ───────────────────────────────────────────────────
const BLOCK_H = 24;       // height of each block
const BASE_W = 220;      // starting block width
const BASE_SPEED = 2.4;      // initial slider speed
const SPEED_INC = 0.06;     // speed added per stack
const VISIBLE_ROWS = 16;       // rows visible on screen
const COLORS = [
    '#ef5350', '#ec407a', '#ab47bc', '#7e57c2',
    '#42a5f5', '#26c6da', '#26a69a', '#66bb6a',
    '#d4e157', '#ffca28', '#ffa726', '#ff7043',
];

// ── State ─────────────────────────────────────────────────────
let state = 'start';
let score = 0;
let bestScore = parseInt(localStorage.getItem('stack_best') || '0');
let blocks = [];    // placed blocks: {x, w, colorIdx}
let mover = null;  // {x, w, dir, speed, colorIdx}
let cameraY = 0;     // vertical scroll (in pixels, grows up)
let targetCamY = 0;
let animId = null;
let lastTime = 0;

// Falling chip particles
let chips = [];

// ── Helpers ───────────────────────────────────────────────────
function blockColor(idx) { return COLORS[idx % COLORS.length]; }

function resetGame() {
    score = 0;
    cameraY = 0;
    targetCamY = 0;
    chips = [];
    scoreDisplay.textContent = '0';

    // Seed first 3 base blocks (immovable ground)
    blocks = [];
    const baseX = (W - BASE_W) / 2;
    for (let i = 0; i < 3; i++) {
        blocks.push({ x: baseX, w: BASE_W, colorIdx: 0 });
    }

    spawnMover();
}

function spawnMover() {
    const prev = blocks[blocks.length - 1];
    const speed = Math.min(BASE_SPEED + score * SPEED_INC, 10);
    const dir = (blocks.length % 2 === 0) ? 1 : -1;
    const startX = dir > 0 ? -prev.w : W;

    mover = {
        x: startX,
        w: prev.w,
        dir,
        speed,
        colorIdx: blocks.length,
    };
}

function stackBlock() {
    if (state !== 'playing' || !mover) return;

    const prev = blocks[blocks.length - 1];
    const overlapL = Math.max(mover.x, prev.x);
    const overlapR = Math.min(mover.x + mover.w, prev.x + prev.w);
    const overlapW = overlapR - overlapL;

    if (overlapW <= 0) {
        // Completely missed — game over
        doGameOver();
        return;
    }

    // Compute chip (overhanging piece)
    if (overlapW < mover.w) {
        const chipX = mover.x < prev.x ? mover.x : overlapR;
        const chipW = mover.w - overlapW;
        chips.push({
            x: chipX, y: blockY(blocks.length), w: chipW, h: BLOCK_H,
            vy: -1.5, vx: mover.dir * 1.2,
            colorIdx: mover.colorIdx,
            alpha: 1,
        });
    }

    // Perfect stack bonus (within 4px)
    const isPerfect = Math.abs(overlapW - prev.w) < 4;
    const placedW = isPerfect ? prev.w : overlapW;
    const placedX = isPerfect ? prev.x : overlapL;

    // Push placed block
    blocks.push({ x: placedX, w: placedW, colorIdx: mover.colorIdx });
    score++;
    scoreDisplay.textContent = score;

    // Perfect flash
    if (isPerfect) flashPerfect(placedX, blockY(blocks.length - 1), placedW);

    // Update camera to follow the stack rising
    if (blocks.length > VISIBLE_ROWS - 2) {
        targetCamY = (blocks.length - (VISIBLE_ROWS - 2)) * (BLOCK_H + 2);
    }

    spawnMover();
}

function blockY(index) {
    // y from bottom; index 0 is ground level
    return H - (index + 1) * (BLOCK_H + 2) + cameraY;
}

// ── Perfect Flash ─────────────────────────────────────────────
let perfectFlash = null;
function flashPerfect(x, y, w) {
    perfectFlash = { x, y, w, h: BLOCK_H, alpha: 1.0 };
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

function doGameOver() {
    state = 'dead';
    let isNew = false;
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('stack_best', bestScore);
        isNew = true;
    }
    finalScore.textContent = score;
    finalBest.textContent = bestScore;
    bestScoreStart.textContent = bestScore;
    newBestBadge.classList.toggle('hidden', !isNew);
    hud.classList.add('hidden');

    // Crumble effect then show screen
    crumbleAnimation().then(() => {
        gameoverScreen.classList.remove('hidden');
    });
}

async function crumbleAnimation() {
    // Blow existing blocks into chips
    for (let i = blocks.length - 1; i >= 0; i--) {
        const by = blockY(i);
        chips.push({
            x: blocks[i].x, y: by, w: blocks[i].w, h: BLOCK_H,
            vy: -(Math.random() * 3 + 1), vx: (Math.random() - 0.5) * 6,
            colorIdx: blocks[i].colorIdx, alpha: 1,
        });
    }
    blocks = [];
    if (mover) {
        chips.push({
            x: mover.x, y: blockY(blocks.length), w: mover.w, h: BLOCK_H,
            vy: -4, vx: mover.dir * 3, colorIdx: mover.colorIdx, alpha: 1,
        });
        mover = null;
    }
    await new Promise(r => setTimeout(r, 800));
}

// ── Update ────────────────────────────────────────────────────
function update(dt) {
    // Camera smooth follow
    cameraY += (targetCamY - cameraY) * 0.1 * (dt / 16);

    if (state === 'playing' && mover) {
        // Move slider
        mover.x += mover.dir * mover.speed * (dt / 16);
        // Bounce off walls
        if (mover.x < -mover.w * 0.8) { mover.dir = 1; }
        if (mover.x + mover.w > W + mover.w * 0.8) { mover.dir = -1; }
    }

    // Chips fall
    for (let i = chips.length - 1; i >= 0; i--) {
        const c = chips[i];
        c.vy += 0.3 * (dt / 16);
        c.y += c.vy * (dt / 16);
        c.x += c.vx * (dt / 16);
        c.alpha -= 0.012 * (dt / 16);
        if (c.alpha <= 0 || c.y > H + 40) chips.splice(i, 1);
    }

    // Perfect flash fade
    if (perfectFlash) {
        perfectFlash.alpha -= 0.05 * (dt / 16);
        if (perfectFlash.alpha <= 0) perfectFlash = null;
    }
}

// ── Draw ──────────────────────────────────────────────────────
function drawBackground() {
    // Deep dark gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0a0015');
    bg.addColorStop(0.5, '#1a0030');
    bg.addColorStop(1, '#0d001a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid lines (subtle depth)
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 1;
    const spacing = 40;
    for (let x = 0; x < W; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = (cameraY % spacing); y < H; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();

    // Side glow strips
    const leftGlow = ctx.createLinearGradient(0, 0, 60, 0);
    leftGlow.addColorStop(0, 'rgba(167,139,250,0.08)');
    leftGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = leftGlow;
    ctx.fillRect(0, 0, 60, H);

    const rightGlow = ctx.createLinearGradient(W, 0, W - 60, 0);
    rightGlow.addColorStop(0, 'rgba(56,189,248,0.06)');
    rightGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = rightGlow;
    ctx.fillRect(W - 60, 0, 60, H);
}

function draw3DBlock(x, y, w, h, color, glowAlpha = 0.5) {
    const depth = 6;

    // Side face (darker)
    ctx.fillStyle = shadeColor(color, -40);
    ctx.beginPath();
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w + depth, y - depth);
    ctx.lineTo(x + w + depth, y + h - depth);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();

    // Bottom face
    ctx.fillStyle = shadeColor(color, -60);
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w + depth, y + h - depth);
    ctx.lineTo(x + depth, y + h - depth);
    ctx.closePath();
    ctx.fill();

    // Top face (main)
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, lightenColor(color, 20));
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Top-edge highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x, y, w, 3);

    // Glow
    if (glowAlpha > 0) {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 12 * glowAlpha;
        ctx.globalAlpha = 0.6 * glowAlpha;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        ctx.restore();
    }
}

function drawBlocks() {
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const y = blockY(i);
        if (y > H + 30 || y < -BLOCK_H - 30) continue;

        const isTop = i === blocks.length - 1;
        const glow = isTop ? 0.7 : Math.max(0, 0.25 - (blocks.length - 1 - i) * 0.04);
        draw3DBlock(b.x, y, b.w, BLOCK_H, blockColor(b.colorIdx), glow);
    }
}

function drawMover() {
    if (!mover) return;
    const y = blockY(blocks.length);
    // Pulse effect
    const pulse = 0.6 + Math.sin(performance.now() * 0.006) * 0.3;
    draw3DBlock(mover.x, y, mover.w, BLOCK_H, blockColor(mover.colorIdx), pulse);

    // Direction arrows
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    const arrowX = mover.dir > 0 ? mover.x + mover.w + 16 : mover.x - 16;
    ctx.fillText(mover.dir > 0 ? '→' : '←', arrowX, y + BLOCK_H / 2 + 4);
    ctx.restore();
}

function drawChips() {
    for (const c of chips) {
        ctx.save();
        ctx.globalAlpha = c.alpha;
        ctx.shadowColor = blockColor(c.colorIdx);
        ctx.shadowBlur = 8;
        ctx.fillStyle = blockColor(c.colorIdx);
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.restore();
    }
}

function drawPerfectFlash() {
    if (!perfectFlash) return;
    const pf = perfectFlash;
    ctx.save();
    ctx.globalAlpha = pf.alpha * 0.7;
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 20;
    ctx.fillRect(pf.x, pf.y, pf.w, pf.h);

    // "PERFECT!" text
    if (pf.alpha > 0.3) {
        ctx.globalAlpha = Math.min(1, pf.alpha * 2);
        ctx.shadowBlur = 0;
        ctx.font = 'bold 600 18px "Fredoka One", cursive';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('PERFECT!', pf.x + pf.w / 2, pf.y - 8);
    }
    ctx.restore();
}

function drawShadowGuide() {
    // Show a faint shadow below the mover aligned to the previous block
    if (!mover || state !== 'playing') return;
    const prev = blocks[blocks.length - 1];
    const y = blockY(blocks.length);
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#fff';
    ctx.fillRect(prev.x, y, prev.w, BLOCK_H);
    ctx.restore();
}

// ── Colour utils ──────────────────────────────────────────────
function shadeColor(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
    const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
    return `rgb(${r},${g},${b})`;
}

function lightenColor(hex, amount) { return shadeColor(hex, amount); }

// ── Score ring overlay ────────────────────────────────────────
function drawScoreRing() {
    // Decorative score circle at top right
    ctx.save();
    ctx.font = '700 11px Nunito, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.textAlign = 'right';
    ctx.fillText(`LVL ${Math.floor(score / 5) + 1}`, W - 14, 70);
    ctx.restore();
}

// ── Main loop ─────────────────────────────────────────────────
function loop(ts) {
    const dt = Math.min(ts - lastTime, 50);
    lastTime = ts;

    update(dt);

    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawShadowGuide();
    drawBlocks();
    drawMover();
    drawChips();
    drawPerfectFlash();
    if (state === 'playing') drawScoreRing();

    animId = requestAnimationFrame(loop);
}

// ── Input ─────────────────────────────────────────────────────
function onTap() {
    if (state === 'start') { startGame(); return; }
    if (state === 'playing') stackBlock();
}

document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'Enter') {
        e.preventDefault();
        onTap();
    }
});
canvas.addEventListener('pointerdown', e => { e.preventDefault(); onTap(); });

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => {
    gameoverScreen.classList.add('hidden');
    startGame();
});

// ── Init ──────────────────────────────────────────────────────
bestScoreStart.textContent = bestScore;
lastTime = performance.now();

// Idle loop (start screen)
function idleRender(ts) {
    update(ts - lastTime < 50 ? ts - lastTime : 16);
    lastTime = ts;
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    // Draw sample stack (static)
    const sampleColors = [4, 6, 2, 10, 8, 1];
    const bw = 180;
    const bx = (W - bw) / 2;
    for (let i = 0; i < 6; i++) {
        const offset = [0, 10, 6, -8, 12, 4][i];
        draw3DBlock(bx + offset, H - (i + 1) * (BLOCK_H + 2), bw - i * 8, BLOCK_H, blockColor(sampleColors[i]), 0.3);
    }
    if (state === 'start') requestAnimationFrame(idleRender);
}

lastTime = performance.now();
animId = requestAnimationFrame(idleRender);
