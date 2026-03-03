const canvas = document.getElementById('runner-canvas');
const ctx = canvas.getContext('2d');

const overlay = document.getElementById('game-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const overlayBtn = document.getElementById('overlay-btn');
const startBtn = document.getElementById('start-btn');

const heroEl = document.getElementById('hud-hero');
const coinsEl = document.getElementById('hud-coins');
const livesEl = document.getElementById('hud-lives');
const distEl = document.getElementById('hud-distance');
const scoreEl = document.getElementById('hud-score');

const CHARACTERS = {
    blaze: { name: 'Blaze', skin: '#ffd8a8', suit: '#f97316', cap: '#ef4444', trim: '#fde68a' },
    nova: { name: 'Nova', skin: '#fcd7b6', suit: '#0284c7', cap: '#0ea5e9', trim: '#e0f2fe' },
    mint: { name: 'Mint', skin: '#f7d6b3', suit: '#16a34a', cap: '#22c55e', trim: '#dcfce7' },
};

const WORLD_WIDTH = 6200;
const GRAVITY = 1820;
const MOVE_ACCEL = 1700;
const AIR_ACCEL = 980;
const FRICTION = 2100;
const MAX_SPEED_X = 290;
const JUMP_SPEED = 700;

const input = {
    left: false,
    right: false,
    jumpHeld: false,
    jumpPressed: false,
};

let selectedChar = 'blaze';
let player = null;
let world = null;
let cameraX = 0;
let checkpointX = 80;
let score = 0;
let coins = 0;
let lives = 3;
let distance = 0;
let state = 'ready';
let runTime = 0;
let lastTs = 0;

const clouds = [
    { x: 180, y: 90, w: 90, h: 30, speed: 10 },
    { x: 440, y: 65, w: 110, h: 34, speed: 14 },
    { x: 880, y: 120, w: 120, h: 36, speed: 12 },
    { x: 1260, y: 80, w: 100, h: 30, speed: 8 },
];

function buildWorld() {
    const solids = [
        { x: 0, y: 500, w: WORLD_WIDTH, h: 60, kind: 'ground' },
        { x: 420, y: 420, w: 150, h: 20, kind: 'block' },
        { x: 700, y: 370, w: 130, h: 20, kind: 'block' },
        { x: 1060, y: 420, w: 180, h: 20, kind: 'block' },
        { x: 1420, y: 350, w: 140, h: 20, kind: 'block' },
        { x: 1860, y: 400, w: 200, h: 20, kind: 'block' },
        { x: 2350, y: 330, w: 160, h: 20, kind: 'block' },
        { x: 2810, y: 390, w: 130, h: 20, kind: 'block' },
        { x: 3220, y: 350, w: 160, h: 20, kind: 'block' },
        { x: 3670, y: 420, w: 180, h: 20, kind: 'block' },
        { x: 4050, y: 340, w: 140, h: 20, kind: 'block' },
        { x: 4460, y: 390, w: 190, h: 20, kind: 'block' },
        { x: 4910, y: 350, w: 160, h: 20, kind: 'block' },
        { x: 5380, y: 410, w: 180, h: 20, kind: 'block' },
    ];

    const coinsList = [];
    const addCoinsLine = (startX, y, count, gap) => {
        for (let i = 0; i < count; i++) coinsList.push({ x: startX + i * gap, y, taken: false });
    };
    addCoinsLine(300, 450, 10, 58);
    addCoinsLine(700, 320, 4, 42);
    addCoinsLine(1040, 370, 7, 42);
    addCoinsLine(1830, 350, 5, 44);
    addCoinsLine(2320, 280, 5, 42);
    addCoinsLine(3200, 300, 5, 42);
    addCoinsLine(4420, 340, 6, 42);
    addCoinsLine(5360, 360, 5, 44);

    const enemies = [
        { x: 760, y: 466, w: 34, h: 34, minX: 700, maxX: 980, speed: 52, dir: 1, dead: false },
        { x: 1560, y: 466, w: 34, h: 34, minX: 1460, maxX: 1750, speed: 58, dir: -1, dead: false },
        { x: 2580, y: 466, w: 34, h: 34, minX: 2480, maxX: 2800, speed: 62, dir: 1, dead: false },
        { x: 3560, y: 466, w: 34, h: 34, minX: 3420, maxX: 3780, speed: 66, dir: 1, dead: false },
        { x: 4740, y: 466, w: 34, h: 34, minX: 4640, maxX: 4960, speed: 62, dir: -1, dead: false },
    ];

    return {
        solids,
        coins: coinsList,
        enemies,
        goalX: WORLD_WIDTH - 190,
    };
}

function startRun() {
    world = buildWorld();
    player = {
        x: 80,
        y: 420,
        w: 34,
        h: 46,
        vx: 0,
        vy: 0,
        onGround: false,
        face: 1,
        invuln: 0,
        char: selectedChar,
    };
    state = 'playing';
    cameraX = 0;
    checkpointX = 80;
    score = 0;
    coins = 0;
    lives = 3;
    distance = 0;
    runTime = 0;
    updateHud();
    setOverlay(false);
    startBtn.textContent = 'Restart';
}

function setOverlay(show, title = '', text = '', btnLabel = 'Start Run') {
    overlay.classList.toggle('hidden', !show);
    if (!show) return;
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlayBtn.textContent = btnLabel;
}

function updateHud() {
    heroEl.textContent = CHARACTERS[selectedChar].name;
    coinsEl.textContent = String(coins);
    livesEl.textContent = String(lives);
    distEl.textContent = `${distance}m`;
    scoreEl.textContent = String(score);
}

function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function hitPlayer() {
    if (player.invuln > 0 || state !== 'playing') return;
    lives -= 1;
    if (lives <= 0) {
        state = 'lost';
        setOverlay(true, 'Run Over', 'You ran out of lives. Start again and reach the flag.', 'Play Again');
        updateHud();
        return;
    }

    player.invuln = 1.5;
    player.x = checkpointX;
    player.y = 420;
    player.vx = 0;
    player.vy = 0;
    cameraX = Math.max(0, checkpointX - 180);
    updateHud();
}

function updatePlayer(dt) {
    const accel = player.onGround ? MOVE_ACCEL : AIR_ACCEL;
    if (input.left && !input.right) {
        player.vx -= accel * dt;
        player.face = -1;
    } else if (input.right && !input.left) {
        player.vx += accel * dt;
        player.face = 1;
    } else if (player.onGround) {
        if (player.vx > 0) player.vx = Math.max(0, player.vx - FRICTION * dt);
        if (player.vx < 0) player.vx = Math.min(0, player.vx + FRICTION * dt);
    }

    player.vx = Math.max(-MAX_SPEED_X, Math.min(MAX_SPEED_X, player.vx));

    if (input.jumpPressed && player.onGround) {
        player.vy = -JUMP_SPEED;
        player.onGround = false;
    }
    input.jumpPressed = false;

    player.vy += GRAVITY * dt;
    if (player.vy > 1100) player.vy = 1100;

    player.x += player.vx * dt;
    for (const solid of world.solids) {
        if (!rectsOverlap(player, solid)) continue;
        if (player.vx > 0) player.x = solid.x - player.w;
        if (player.vx < 0) player.x = solid.x + solid.w;
        player.vx = 0;
    }

    player.y += player.vy * dt;
    player.onGround = false;
    for (const solid of world.solids) {
        if (!rectsOverlap(player, solid)) continue;
        if (player.vy > 0) {
            player.y = solid.y - player.h;
            player.vy = 0;
            player.onGround = true;
        } else if (player.vy < 0) {
            player.y = solid.y + solid.h;
            player.vy = 0;
        }
    }

    if (player.y > canvas.height + 220) hitPlayer();
    if (player.x < 0) player.x = 0;
}

function updateCoinsAndEnemies(dt) {
    for (const coin of world.coins) {
        if (coin.taken) continue;
        const pad = 7;
        const box = { x: coin.x - pad, y: coin.y - pad, w: pad * 2, h: pad * 2 };
        if (rectsOverlap(player, box)) {
            coin.taken = true;
            coins += 1;
            score += 50;
        }
    }

    for (const enemy of world.enemies) {
        if (enemy.dead) continue;
        enemy.x += enemy.dir * enemy.speed * dt;
        if (enemy.x <= enemy.minX) { enemy.x = enemy.minX; enemy.dir = 1; }
        if (enemy.x >= enemy.maxX) { enemy.x = enemy.maxX; enemy.dir = -1; }

        if (!rectsOverlap(player, enemy)) continue;
        const stomp = player.vy > 140 && player.y + player.h - 8 < enemy.y + enemy.h * 0.55;
        if (stomp) {
            enemy.dead = true;
            player.vy = -470;
            score += 120;
        } else {
            hitPlayer();
        }
    }
}

function updateGame(dt) {
    runTime += dt;
    if (player.invuln > 0) player.invuln -= dt;

    updatePlayer(dt);
    updateCoinsAndEnemies(dt);

    if (player.x - checkpointX > 950) checkpointX = player.x - 140;
    distance = Math.max(distance, Math.floor(Math.max(0, player.x - 80) / 6));
    score = Math.max(score, distance + coins * 50);

    if (player.x + player.w >= world.goalX + 18) {
        state = 'won';
        setOverlay(true, 'You Win', `Great run, ${CHARACTERS[selectedChar].name}! Final score: ${score}.`, 'Play Again');
    }

    cameraX = player.x - canvas.width * 0.34;
    cameraX = Math.max(0, Math.min(cameraX, WORLD_WIDTH - canvas.width));
    updateHud();
}

function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#7dd3fc');
    sky.addColorStop(0.55, '#60a5fa');
    sky.addColorStop(1, '#2563eb');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 6; i++) {
        const hx = ((i * 360) - (cameraX * 0.2)) % (canvas.width + 260) - 130;
        const hy = 290 + ((i % 2) * 22);
        ctx.beginPath();
        ctx.ellipse(hx, hy, 170, 70, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    for (const c of clouds) {
        const sx = (c.x - cameraX * (c.speed / 100) + runTime * c.speed) % (canvas.width + 320) - 140;
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.ellipse(sx, c.y, c.w * 0.35, c.h * 0.5, 0, 0, Math.PI * 2);
        ctx.ellipse(sx + c.w * 0.2, c.y - 7, c.w * 0.26, c.h * 0.42, 0, 0, Math.PI * 2);
        ctx.ellipse(sx + c.w * 0.44, c.y, c.w * 0.3, c.h * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawWorld() {
    for (const s of world.solids) {
        const x = s.x - cameraX;
        if (x + s.w < -20 || x > canvas.width + 20) continue;

        if (s.kind === 'ground') {
            ctx.fillStyle = '#7c3f1d';
            ctx.fillRect(x, s.y, s.w, s.h);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(x, s.y - 10, s.w, 10);
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            for (let i = 0; i < s.w; i += 36) ctx.fillRect(x + i, s.y + 12, 16, 4);
        } else {
            ctx.fillStyle = '#c47b3f';
            ctx.fillRect(x, s.y, s.w, s.h);
            ctx.fillStyle = '#9a5b2f';
            ctx.fillRect(x, s.y + s.h - 5, s.w, 5);
            ctx.strokeStyle = 'rgba(80, 42, 20, 0.5)';
            ctx.lineWidth = 2;
            for (let i = 0; i <= s.w; i += 22) {
                ctx.beginPath();
                ctx.moveTo(x + i, s.y);
                ctx.lineTo(x + i, s.y + s.h);
                ctx.stroke();
            }
        }
    }

    for (const coin of world.coins) {
        if (coin.taken) continue;
        const x = coin.x - cameraX;
        if (x < -30 || x > canvas.width + 30) continue;
        const pulse = Math.sin((runTime * 7) + coin.x * 0.02) * 1.2;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(x, coin.y, 8 + pulse * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(x - 1, coin.y - 4, 2, 8);
    }

    for (const e of world.enemies) {
        if (e.dead) continue;
        const x = e.x - cameraX;
        if (x + e.w < -20 || x > canvas.width + 20) continue;
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(x, e.y + 8, e.w, e.h - 8);
        ctx.fillStyle = '#a16207';
        ctx.fillRect(x + 4, e.y, e.w - 8, 12);
        ctx.fillStyle = '#111827';
        ctx.fillRect(x + 8, e.y + 13, 4, 4);
        ctx.fillRect(x + e.w - 12, e.y + 13, 4, 4);
    }

    const poleX = world.goalX - cameraX;
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(poleX, 210, 8, 290);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(poleX + 8, 220, 52, 30);
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(poleX + 4, 206, 8, 0, Math.PI * 2);
    ctx.fill();
}

function drawPlayer() {
    const p = player;
    const c = CHARACTERS[p.char];
    if (p.invuln > 0 && Math.floor(runTime * 18) % 2 === 0) return;

    const x = Math.round(p.x - cameraX);
    const y = Math.round(p.y);
    const flip = p.face < 0 ? -1 : 1;

    ctx.save();
    ctx.translate(x + p.w / 2, y);
    ctx.scale(flip, 1);
    ctx.translate(-p.w / 2, 0);

    ctx.fillStyle = c.suit;
    ctx.fillRect(5, 18, p.w - 10, 22);

    ctx.fillStyle = c.trim;
    ctx.fillRect(8, 20, p.w - 16, 5);

    ctx.fillStyle = c.cap;
    ctx.fillRect(4, 4, p.w - 8, 10);
    ctx.fillRect(2, 10, p.w - 4, 4);

    ctx.fillStyle = c.skin;
    ctx.fillRect(8, 12, p.w - 16, 12);

    ctx.fillStyle = '#111827';
    ctx.fillRect(12, 16, 3, 3);
    ctx.fillRect(p.w - 15, 16, 3, 3);

    ctx.fillStyle = '#1f2937';
    ctx.fillRect(7, 40, 8, 6);
    ctx.fillRect(p.w - 15, 40, 8, 6);

    ctx.restore();
}

function render() {
    if (!world || !player) return;
    drawBackground();
    drawWorld();
    drawPlayer();
}

function tick(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.033, (ts - lastTs) / 1000);
    lastTs = ts;

    if (state === 'playing') updateGame(dt);
    render();
    requestAnimationFrame(tick);
}

function setCharacter(charKey) {
    if (!CHARACTERS[charKey]) return;
    selectedChar = charKey;
    document.querySelectorAll('.char-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.char === charKey);
    });
    if (player) player.char = charKey;
    updateHud();
}

function bindInput() {
    document.addEventListener('keydown', e => {
        const k = e.key.toLowerCase();
        if (k === 'arrowleft' || k === 'a') input.left = true;
        if (k === 'arrowright' || k === 'd') input.right = true;
        if ((k === 'arrowup' || k === 'w' || k === ' ') && !e.repeat) {
            input.jumpHeld = true;
            input.jumpPressed = true;
        }
    });

    document.addEventListener('keyup', e => {
        const k = e.key.toLowerCase();
        if (k === 'arrowleft' || k === 'a') input.left = false;
        if (k === 'arrowright' || k === 'd') input.right = false;
        if (k === 'arrowup' || k === 'w' || k === ' ') input.jumpHeld = false;
    });

    document.querySelectorAll('.touch-btn').forEach(btn => {
        const action = btn.dataset.action;
        const press = ev => {
            ev.preventDefault();
            if (action === 'left') input.left = true;
            if (action === 'right') input.right = true;
            if (action === 'jump') input.jumpPressed = true;
        };
        const release = ev => {
            ev.preventDefault();
            if (action === 'left') input.left = false;
            if (action === 'right') input.right = false;
        };
        btn.addEventListener('pointerdown', press);
        btn.addEventListener('pointerup', release);
        btn.addEventListener('pointercancel', release);
        btn.addEventListener('pointerleave', release);
    });
}

document.querySelectorAll('.char-option').forEach(btn => {
    btn.addEventListener('click', () => setCharacter(btn.dataset.char));
});

startBtn.addEventListener('click', startRun);
overlayBtn.addEventListener('click', startRun);

bindInput();
world = buildWorld();
player = {
    x: 80,
    y: 420,
    w: 34,
    h: 46,
    vx: 0,
    vy: 0,
    onGround: false,
    face: 1,
    invuln: 0,
    char: selectedChar,
};
updateHud();
setOverlay(true, 'Sky Sprint', 'Select your hero and start. Reach the flag while collecting coins and avoiding enemies.', 'Start Run');
requestAnimationFrame(tick);
