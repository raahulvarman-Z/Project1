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
const formEl = document.getElementById('hud-form');
const distEl = document.getElementById('hud-distance');
const scoreEl = document.getElementById('hud-score');
const timeEl = document.getElementById('hud-time');
const joystickWrap = document.getElementById('joystick-wrap');
const joystickKnob = document.getElementById('joystick-knob');
const jumpBtn = document.getElementById('jump-btn');

const CHARACTERS = {
    blaze: { name: 'Blaze', skin: '#ffd8a8', suit: '#f97316', cap: '#ef4444', trim: '#fde68a' },
    nova: { name: 'Nova', skin: '#fcd7b6', suit: '#0284c7', cap: '#0ea5e9', trim: '#e0f2fe' },
    mint: { name: 'Mint', skin: '#f7d6b3', suit: '#16a34a', cap: '#22c55e', trim: '#dcfce7' },
};

const WORLD_WIDTH = 6400;
const GRAVITY = 1820;
const MOVE_ACCEL = 1700;
const AIR_ACCEL = 980;
const FRICTION = 2100;
const MAX_SPEED_X = 290;
const JUMP_SPEED = 700;
const RUN_TIME_LIMIT = 180;

const input = {
    left: false,
    right: false,
    jumpHeld: false,
    jumpPressed: false,
};

const moveInput = {
    keyLeft: false,
    keyRight: false,
    touchLeft: false,
    touchRight: false,
};

const joystick = {
    active: false,
    pointerId: null,
    centerX: 0,
    centerY: 0,
    radius: 40,
    nx: 0,
    ny: 0,
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
let timeLeft = RUN_TIME_LIMIT;
let lastTs = 0;

const clouds = [
    { x: 180, y: 90, w: 90, h: 30, speed: 10 },
    { x: 440, y: 65, w: 110, h: 34, speed: 14 },
    { x: 880, y: 120, w: 120, h: 36, speed: 12 },
    { x: 1260, y: 80, w: 100, h: 30, speed: 8 },
];

function buildWorld() {
    const solids = [
        { x: 0, y: 500, w: 1220, h: 60, kind: 'ground' },
        { x: 1350, y: 500, w: 980, h: 60, kind: 'ground' },
        { x: 2460, y: 500, w: 1280, h: 60, kind: 'ground' },
        { x: 3860, y: 500, w: 1150, h: 60, kind: 'ground' },
        { x: 5150, y: 500, w: 1250, h: 60, kind: 'ground' },

        { x: 580, y: 430, w: 64, h: 70, kind: 'pipe' },
        { x: 1690, y: 420, w: 66, h: 80, kind: 'pipe' },
        { x: 3070, y: 430, w: 64, h: 70, kind: 'pipe' },
        { x: 5480, y: 420, w: 66, h: 80, kind: 'pipe' },

        { x: 420, y: 390, w: 40, h: 40, kind: 'brick' },
        { x: 460, y: 390, w: 40, h: 40, kind: 'question', used: false, reward: 'coin' },
        { x: 500, y: 390, w: 40, h: 40, kind: 'brick' },
        { x: 760, y: 340, w: 40, h: 40, kind: 'question', used: false, reward: 'mushroom' },
        { x: 800, y: 340, w: 40, h: 40, kind: 'brick' },
        { x: 840, y: 340, w: 40, h: 40, kind: 'question', used: false, reward: 'coin' },

        { x: 940, y: 420, w: 180, h: 20, kind: 'block' },
        { x: 1460, y: 400, w: 140, h: 20, kind: 'block' },
        { x: 1830, y: 350, w: 40, h: 40, kind: 'question', used: false, reward: 'coin' },
        { x: 1870, y: 350, w: 40, h: 40, kind: 'brick' },
        { x: 1910, y: 350, w: 40, h: 40, kind: 'question', used: false, reward: 'coin' },
        { x: 2290, y: 390, w: 150, h: 20, kind: 'block' },
        { x: 2680, y: 330, w: 160, h: 20, kind: 'block' },
        { x: 3140, y: 380, w: 180, h: 20, kind: 'block' },
        { x: 3560, y: 340, w: 160, h: 20, kind: 'block' },
        { x: 4040, y: 390, w: 180, h: 20, kind: 'block' },
        { x: 4490, y: 350, w: 150, h: 20, kind: 'block' },
        { x: 4920, y: 400, w: 170, h: 20, kind: 'block' },
        { x: 5380, y: 340, w: 160, h: 20, kind: 'block' },
        { x: 5850, y: 390, w: 180, h: 20, kind: 'block' },

        { x: 6040, y: 460, w: 60, h: 40, kind: 'block' },
        { x: 6100, y: 420, w: 60, h: 80, kind: 'block' },
        { x: 6160, y: 380, w: 60, h: 120, kind: 'block' },
    ];

    const coinsList = [];
    const addCoinsLine = (startX, y, count, gap) => {
        for (let i = 0; i < count; i++) coinsList.push({ x: startX + i * gap, y, taken: false });
    };
    addCoinsLine(250, 450, 9, 62);
    addCoinsLine(940, 372, 4, 46);
    addCoinsLine(1460, 352, 3, 44);
    addCoinsLine(2280, 350, 4, 42);
    addCoinsLine(2690, 290, 3, 42);
    addCoinsLine(3150, 338, 4, 42);
    addCoinsLine(4040, 350, 4, 42);
    addCoinsLine(4910, 360, 4, 44);
    addCoinsLine(5370, 300, 4, 42);
    addCoinsLine(5880, 350, 4, 42);
    addCoinsLine(1220, 430, 3, 58);
    addCoinsLine(2325, 430, 2, 58);
    addCoinsLine(3740, 430, 3, 58);
    addCoinsLine(5000, 430, 3, 58);

    const enemies = [
        { x: 790, y: 466, w: 34, h: 34, minX: 680, maxX: 1120, speed: 56, dir: 1, dead: false },
        { x: 1860, y: 466, w: 34, h: 34, minX: 1460, maxX: 2180, speed: 62, dir: -1, dead: false },
        { x: 2750, y: 466, w: 34, h: 34, minX: 2520, maxX: 3350, speed: 66, dir: 1, dead: false },
        { x: 4300, y: 466, w: 34, h: 34, minX: 3920, maxX: 4920, speed: 66, dir: -1, dead: false },
        { x: 5620, y: 466, w: 34, h: 34, minX: 5280, maxX: 6200, speed: 62, dir: 1, dead: false },
    ];

    return {
        solids,
        coins: coinsList,
        enemies,
        items: [],
        goalX: WORLD_WIDTH - 220,
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
        power: 'small',
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
    timeLeft = RUN_TIME_LIMIT;
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
    if (formEl) formEl.textContent = player && player.power === 'super' ? 'Super' : 'Small';
    distEl.textContent = `${distance}m`;
    scoreEl.textContent = String(score);
    if (timeEl) timeEl.textContent = String(Math.max(0, Math.ceil(timeLeft)));
}

function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function canCollideWithSolid(solid) {
    return !solid.broken;
}

function spawnMushroom(block) {
    world.items.push({
        type: 'mushroom',
        x: block.x + block.w / 2 - 12,
        y: block.y - 24,
        w: 24,
        h: 24,
        vx: 84,
        vy: -120,
        active: true,
    });
}

function onHeadHitBlock(block) {
    if (block.kind === 'question' && !block.used) {
        block.used = true;
        if (block.reward === 'coin') {
            coins += 1;
            score += 100;
        } else if (block.reward === 'mushroom') {
            spawnMushroom(block);
            score += 60;
        }
        return;
    }

    if (block.kind === 'brick') {
        if (player.power === 'super') {
            block.broken = true;
            score += 80;
        } else {
            score += 10;
        }
    }
}

function getGroundCheckpointX(targetX) {
    const padding = 28;
    let fallback = 80;
    for (const solid of world.solids) {
        if (solid.kind !== 'ground') continue;
        if (solid.x + padding <= targetX && targetX <= solid.x + solid.w - padding) return targetX;
        if (solid.x + solid.w - padding < targetX) fallback = solid.x + solid.w - padding;
    }
    return Math.max(80, fallback);
}

function updateItems(dt) {
    for (const item of world.items) {
        if (!item.active) continue;

        item.vy += GRAVITY * dt * 0.72;
        if (item.vy > 900) item.vy = 900;

        item.x += item.vx * dt;
        for (const solid of world.solids) {
            if (!canCollideWithSolid(solid)) continue;
            if (!rectsOverlap(item, solid)) continue;
            if (item.vx > 0) item.x = solid.x - item.w;
            if (item.vx < 0) item.x = solid.x + solid.w;
            item.vx *= -1;
        }

        item.y += item.vy * dt;
        for (const solid of world.solids) {
            if (!canCollideWithSolid(solid)) continue;
            if (!rectsOverlap(item, solid)) continue;
            if (item.vy > 0) {
                item.y = solid.y - item.h;
                item.vy = 0;
            } else if (item.vy < 0) {
                item.y = solid.y + solid.h;
                item.vy = 0;
            }
        }

        if (rectsOverlap(player, item)) {
            item.active = false;
            if (item.type === 'mushroom' && player.power === 'small') {
                player.power = 'super';
                player.invuln = Math.max(player.invuln, 0.6);
                score += 400;
            } else {
                score += 150;
            }
        }

        if (item.y > canvas.height + 260) item.active = false;
    }
}

function hitPlayer() {
    if (player.invuln > 0 || state !== 'playing') return;

    if (player.power === 'super') {
        player.power = 'small';
        player.invuln = 1.2;
        player.vx = 0;
        player.vy = -280;
        updateHud();
        return;
    }

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
        if (!canCollideWithSolid(solid)) continue;
        if (!rectsOverlap(player, solid)) continue;
        if (player.vx > 0) player.x = solid.x - player.w;
        if (player.vx < 0) player.x = solid.x + solid.w;
        player.vx = 0;
    }

    player.y += player.vy * dt;
    player.onGround = false;
    for (const solid of world.solids) {
        if (!canCollideWithSolid(solid)) continue;
        if (!rectsOverlap(player, solid)) continue;
        if (player.vy > 0) {
            player.y = solid.y - player.h;
            player.vy = 0;
            player.onGround = true;
        } else if (player.vy < 0) {
            player.y = solid.y + solid.h;
            player.vy = 0;
            onHeadHitBlock(solid);
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
    timeLeft -= dt;
    if (player.invuln > 0) player.invuln -= dt;
    if (timeLeft <= 0) {
        timeLeft = 0;
        state = 'lost';
        setOverlay(true, 'Time Up', 'The timer hit zero. Try a faster run and grab power-ups early.', 'Play Again');
        updateHud();
        return;
    }

    updatePlayer(dt);
    updateCoinsAndEnemies(dt);
    updateItems(dt);

    if (player.onGround && player.x - checkpointX > 850) checkpointX = getGroundCheckpointX(player.x - 120);
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
        if (!canCollideWithSolid(s)) continue;
        const x = s.x - cameraX;
        if (x + s.w < -20 || x > canvas.width + 20) continue;

        if (s.kind === 'ground') {
            ctx.fillStyle = '#7c3f1d';
            ctx.fillRect(x, s.y, s.w, s.h);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(x, s.y - 10, s.w, 10);
            ctx.fillStyle = 'rgba(0,0,0,0.12)';
            for (let i = 0; i < s.w; i += 36) ctx.fillRect(x + i, s.y + 12, 16, 4);
        } else if (s.kind === 'pipe') {
            ctx.fillStyle = '#16a34a';
            ctx.fillRect(x, s.y, s.w, s.h);
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(x - 4, s.y - 10, s.w + 8, 12);
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(x + 6, s.y + 6, 8, s.h - 10);
        } else if (s.kind === 'brick') {
            ctx.fillStyle = '#b45309';
            ctx.fillRect(x, s.y, s.w, s.h);
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, s.y + 1, s.w - 2, s.h - 2);
            ctx.beginPath();
            ctx.moveTo(x, s.y + s.h * 0.5);
            ctx.lineTo(x + s.w, s.y + s.h * 0.5);
            ctx.moveTo(x + s.w * 0.5, s.y);
            ctx.lineTo(x + s.w * 0.5, s.y + s.h * 0.5);
            ctx.moveTo(x + s.w * 0.25, s.y + s.h * 0.5);
            ctx.lineTo(x + s.w * 0.25, s.y + s.h);
            ctx.moveTo(x + s.w * 0.75, s.y + s.h * 0.5);
            ctx.lineTo(x + s.w * 0.75, s.y + s.h);
            ctx.stroke();
        } else if (s.kind === 'question') {
            const pulse = s.used ? 0 : (Math.sin(runTime * 7 + s.x * 0.01) + 1) * 0.5;
            ctx.fillStyle = s.used ? '#a3a3a3' : `rgb(${232 + Math.floor(pulse * 18)}, ${170 + Math.floor(pulse * 22)}, 26)`;
            ctx.fillRect(x, s.y, s.w, s.h);
            ctx.strokeStyle = s.used ? '#6b7280' : '#92400e';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, s.y + 1, s.w - 2, s.h - 2);
            if (!s.used) {
                ctx.fillStyle = '#fff7ed';
                ctx.font = 'bold 22px Nunito';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('?', x + s.w * 0.5, s.y + s.h * 0.5 + 1);
            }
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

    for (const item of world.items) {
        if (!item.active) continue;
        const x = item.x - cameraX;
        if (x + item.w < -20 || x > canvas.width + 20) continue;
        if (item.type === 'mushroom') {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(x + item.w * 0.5, item.y + 10, 11, Math.PI, 0);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fee2e2';
            ctx.beginPath();
            ctx.arc(x + 8, item.y + 9, 2.3, 0, Math.PI * 2);
            ctx.arc(x + 16, item.y + 7, 2.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef3c7';
            ctx.fillRect(x + 4, item.y + 10, 16, 12);
            ctx.fillStyle = '#111827';
            ctx.fillRect(x + 7, item.y + 15, 3, 3);
            ctx.fillRect(x + 14, item.y + 15, 3, 3);
        }
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

    const castleX = poleX + 86;
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(castleX, 340, 90, 160);
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(castleX + 10, 320, 18, 30);
    ctx.fillRect(castleX + 36, 320, 18, 30);
    ctx.fillRect(castleX + 62, 320, 18, 30);
    ctx.fillStyle = '#111827';
    ctx.fillRect(castleX + 34, 430, 24, 70);
}

function drawPlayer() {
    const p = player;
    const c = CHARACTERS[p.char];
    if (p.invuln > 0 && Math.floor(runTime * 18) % 2 === 0) return;
    const superMode = p.power === 'super';
    const suitColor = superMode ? '#2563eb' : c.suit;
    const capColor = superMode ? '#dc2626' : c.cap;
    const trimColor = superMode ? '#fde68a' : c.trim;

    const x = Math.round(p.x - cameraX);
    const y = Math.round(p.y);
    const flip = p.face < 0 ? -1 : 1;

    ctx.save();
    ctx.translate(x + p.w / 2, y);
    ctx.scale(flip, 1);
    ctx.translate(-p.w / 2, 0);

    ctx.fillStyle = suitColor;
    ctx.fillRect(5, 18, p.w - 10, 22);

    ctx.fillStyle = trimColor;
    ctx.fillRect(8, 20, p.w - 16, 5);

    ctx.fillStyle = capColor;
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
    const syncHorizontalInput = () => {
        input.left = moveInput.keyLeft || moveInput.touchLeft;
        input.right = moveInput.keyRight || moveInput.touchRight;
    };

    document.addEventListener('keydown', e => {
        const k = e.key.toLowerCase();
        if (k === 'arrowleft' || k === 'a') {
            moveInput.keyLeft = true;
            syncHorizontalInput();
        }
        if (k === 'arrowright' || k === 'd') {
            moveInput.keyRight = true;
            syncHorizontalInput();
        }
        if ((k === 'arrowup' || k === 'w' || k === ' ') && !e.repeat) {
            input.jumpHeld = true;
            input.jumpPressed = true;
        }
    });

    document.addEventListener('keyup', e => {
        const k = e.key.toLowerCase();
        if (k === 'arrowleft' || k === 'a') {
            moveInput.keyLeft = false;
            syncHorizontalInput();
        }
        if (k === 'arrowright' || k === 'd') {
            moveInput.keyRight = false;
            syncHorizontalInput();
        }
        if (k === 'arrowup' || k === 'w' || k === ' ') input.jumpHeld = false;
    });

    const setJoystickVisual = (nx, ny) => {
        if (!joystickKnob) return;
        const max = joystick.radius;
        joystickKnob.style.transform = `translate(calc(-50% + ${nx * max}px), calc(-50% + ${ny * max}px))`;
    };

    const applyJoystickMove = (nx, ny) => {
        joystick.nx = nx;
        joystick.ny = ny;
        const deadZone = 0.2;
        moveInput.touchLeft = nx < -deadZone;
        moveInput.touchRight = nx > deadZone;
        syncHorizontalInput();
        setJoystickVisual(nx, ny);
    };

    const releaseJoystick = ev => {
        if (ev && joystick.pointerId !== null && ev.pointerId !== joystick.pointerId) return;
        if (ev && joystickWrap && joystickWrap.hasPointerCapture(ev.pointerId)) {
            joystickWrap.releasePointerCapture(ev.pointerId);
        }
        joystick.active = false;
        joystick.pointerId = null;
        applyJoystickMove(0, 0);
    };

    if (joystickWrap && joystickKnob) {
        const handleStickMove = ev => {
            if (!joystick.active || ev.pointerId !== joystick.pointerId) return;
            ev.preventDefault();
            const rawX = ev.clientX - joystick.centerX;
            const rawY = ev.clientY - joystick.centerY;
            const dist = Math.hypot(rawX, rawY);
            const scale = dist > joystick.radius ? joystick.radius / dist : 1;
            applyJoystickMove((rawX * scale) / joystick.radius, (rawY * scale) / joystick.radius);
        };

        joystickWrap.addEventListener('pointerdown', ev => {
            ev.preventDefault();
            const rect = joystickWrap.getBoundingClientRect();
            joystick.centerX = rect.left + rect.width / 2;
            joystick.centerY = rect.top + rect.height / 2;
            joystick.pointerId = ev.pointerId;
            joystick.active = true;
            joystickWrap.setPointerCapture(ev.pointerId);
            handleStickMove(ev);
        });

        joystickWrap.addEventListener('pointermove', handleStickMove);
        joystickWrap.addEventListener('pointerup', releaseJoystick);
        joystickWrap.addEventListener('pointercancel', releaseJoystick);
        joystickWrap.addEventListener('lostpointercapture', releaseJoystick);
    }

    if (jumpBtn) {
        const jumpPress = ev => {
            ev.preventDefault();
            input.jumpHeld = true;
            input.jumpPressed = true;
        };
        const jumpRelease = ev => {
            ev.preventDefault();
            input.jumpHeld = false;
        };
        jumpBtn.addEventListener('pointerdown', jumpPress);
        jumpBtn.addEventListener('pointerup', jumpRelease);
        jumpBtn.addEventListener('pointercancel', jumpRelease);
        jumpBtn.addEventListener('pointerleave', jumpRelease);
    }

    window.addEventListener('blur', () => {
        moveInput.keyLeft = false;
        moveInput.keyRight = false;
        moveInput.touchLeft = false;
        moveInput.touchRight = false;
        input.jumpHeld = false;
        syncHorizontalInput();
        setJoystickVisual(0, 0);
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
    power: 'small',
    char: selectedChar,
};
updateHud();
setOverlay(true, 'Sky Sprint', 'Reach the flag before time runs out. Hit ? blocks for coins and mushrooms, and stomp enemies.', 'Start Run');
requestAnimationFrame(tick);
