const canvas = document.getElementById('rush-canvas');
const ctx = canvas.getContext('2d');

const overlay = document.getElementById('game-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const overlayBtn = document.getElementById('overlay-btn');
const startBtn = document.getElementById('start-btn');

const speedEl = document.getElementById('hud-speed');
const distanceEl = document.getElementById('hud-distance');
const scoreEl = document.getElementById('hud-score');
const levelEl = document.getElementById('hud-level');
const hpEl = document.getElementById('hud-hp');
const nitroEl = document.getElementById('hud-nitro');

const touchBoost = document.getElementById('touch-boost');
const joystickWrap = document.getElementById('joystick-wrap');
const joystickKnob = document.getElementById('joystick-knob');

const LANE_COUNT = 4;
const ROAD_WIDTH_LOGIC = 420;
const ROAD_CENTER = canvas.width * 0.5;
const ROAD_LEFT = ROAD_CENTER - ROAD_WIDTH_LOGIC * 0.5;
const ROAD_RIGHT = ROAD_CENTER + ROAD_WIDTH_LOGIC * 0.5;

const HORIZON_Y = 78;
const ROAD_TOP_HALF = 92;
const ROAD_BOTTOM_HALF = 286;
const TRACK_DEPTH = 3600;

const input = {
    left: false,
    right: false,
    boost: false,
    axisX: 0,
};

const joystick = {
    active: false,
    pointerId: null,
    centerX: 0,
    centerY: 0,
    radius: 34,
    nx: 0,
    ny: 0,
};

const state = {
    mode: 'ready',
    lastTs: 0,
    time: 0,
    distance: 0,
    score: 0,
    level: 1,
    hp: 100,
    nitro: 100,
    roadOffset: 0,
    spawnTimer: 0,
    pickupTimer: 0,
    sparkTimer: 0,
    flashTimer: 0,
    speed: 0,
};

const player = {
    lane: 1,
    targetLane: 1,
    x: 0,
    y: canvas.height - 110,
    w: 48,
    h: 92,
    lean: 0,
};

let rivals = [];
let pickups = [];
let sparks = [];

const stars = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * (HORIZON_Y - 10),
    size: 0.8 + Math.random() * 1.6,
    twinkle: Math.random() * Math.PI * 2,
}));

const skyline = [];
{
    let x = -30;
    while (x < canvas.width + 280) {
        const w = 34 + Math.random() * 52;
        const h = 45 + Math.random() * 120;
        skyline.push({
            x,
            w,
            h,
            tone: 18 + Math.floor(Math.random() * 24),
            windows: 2 + Math.floor(Math.random() * 3),
        });
        x += w + 8 + Math.random() * 16;
    }
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function laneX(laneIndex) {
    const laneWidth = ROAD_WIDTH_LOGIC / LANE_COUNT;
    return ROAD_LEFT + laneWidth * laneIndex + laneWidth * 0.5;
}

function laneNorm(laneIndex) {
    return ((laneIndex + 0.5) / LANE_COUNT) * 2 - 1;
}

function depthAtY(y) {
    return clamp((y - HORIZON_Y) / (canvas.height - HORIZON_Y), 0, 1);
}

function roadHalfAtDepth(depth) {
    return lerp(ROAD_TOP_HALF, ROAD_BOTTOM_HALF, Math.pow(depth, 0.9));
}

function roadXAtNorm(norm, y) {
    const depth = depthAtY(y);
    return ROAD_CENTER + norm * roadHalfAtDepth(depth);
}

function projectLaneX(laneIndex, y) {
    return roadXAtNorm(laneNorm(laneIndex), y);
}

function randomLane() {
    return Math.floor(Math.random() * LANE_COUNT);
}

function showOverlay(title, text, buttonText) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlayBtn.textContent = buttonText;
    overlay.classList.remove('hidden');
}

function hideOverlay() {
    overlay.classList.add('hidden');
}

function resetJoystick() {
    joystick.active = false;
    joystick.pointerId = null;
    joystick.nx = 0;
    joystick.ny = 0;
    input.axisX = 0;
    joystickKnob.style.transform = 'translate(-50%, -50%)';
}

function resetGame() {
    state.mode = 'playing';
    state.lastTs = 0;
    state.time = 0;
    state.distance = 0;
    state.score = 0;
    state.level = 1;
    state.hp = 100;
    state.nitro = 100;
    state.roadOffset = 0;
    state.spawnTimer = 0.48;
    state.pickupTimer = 2.3;
    state.sparkTimer = 0;
    state.flashTimer = 0;
    state.speed = 138;

    player.lane = 1;
    player.targetLane = 1;
    player.x = laneX(player.lane);
    player.y = canvas.height - 110;
    player.lean = 0;

    rivals = [];
    pickups = [];
    sparks = [];
    resetJoystick();
    hideOverlay();
    syncHud();
}

function endRun() {
    state.mode = 'over';
    const meters = Math.floor(state.distance);
    const finalScore = Math.floor(state.score);
    showOverlay(
        'Ride Over',
        `You covered ${meters}m with a score of ${finalScore}. Start again and push farther.`,
        'Restart Ride'
    );
}

function addRival() {
    const levelBoost = Math.min(3.5, (state.level - 1) * 0.14);
    const type = Math.random();
    const speedFactor = 0.72 + Math.random() * 0.78 + levelBoost * 0.2;
    const spawnY = -140;
    const minSpawnGap = 130;
    let bestLane = randomLane();
    let bestGap = -1;

    // Choose the lane with the most vertical space near spawn to avoid stacked rivals.
    for (let lane = 0; lane < LANE_COUNT; lane++) {
        let laneGap = Number.POSITIVE_INFINITY;
        for (let i = 0; i < rivals.length; i++) {
            const rival = rivals[i];
            if (rival.lane !== lane) continue;
            laneGap = Math.min(laneGap, Math.abs(rival.y - spawnY));
        }
        if (laneGap > bestGap) {
            bestGap = laneGap;
            bestLane = lane;
        }
    }

    const adjustedY = bestGap < minSpawnGap ? spawnY - (minSpawnGap - bestGap) : spawnY;
    const rival = {
        lane: bestLane,
        y: adjustedY,
        w: type < 0.2 ? 58 : 48,
        h: type < 0.2 ? 106 : 88,
        speedFactor,
        hue: Math.floor(360 * Math.random()),
    };
    rival.x = laneX(rival.lane);
    rivals.push(rival);
}

function addPickup() {
    pickups.push({
        lane: randomLane(),
        y: -90,
        w: 30,
        h: 30,
        spin: Math.random() * Math.PI * 2,
    });
}

function addSpark(x, y, color, spread = 1) {
    sparks.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 240 * spread,
        vy: 40 + Math.random() * 220 * spread,
        life: 0.2 + Math.random() * 0.3,
        size: 1.5 + Math.random() * 2.3,
        color,
    });
}

function intersects(a, b) {
    return !(
        a.x + a.w * 0.5 < b.x - b.w * 0.5 ||
        a.x - a.w * 0.5 > b.x + b.w * 0.5 ||
        a.y + a.h * 0.5 < b.y - b.h * 0.5 ||
        a.y - a.h * 0.5 > b.y + b.h * 0.5
    );
}

function separateRivalsByLane() {
    for (let lane = 0; lane < LANE_COUNT; lane++) {
        const laneRivals = rivals
            .filter(rival => rival.lane === lane)
            .sort((a, b) => a.y - b.y);

        for (let i = 1; i < laneRivals.length; i++) {
            const prev = laneRivals[i - 1];
            const cur = laneRivals[i];
            const minGap = (prev.h + cur.h) * 0.55 + 22;
            if (cur.y - prev.y < minGap) {
                cur.y = prev.y + minGap;
            }
        }
    }
}

function update(dt) {
    if (state.mode !== 'playing') return;

    state.time += dt;

    const keySteer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const steer = Math.abs(input.axisX) > 0.07 ? input.axisX : keySteer;
    if (steer !== 0) {
        player.targetLane += steer * dt * 6.9;
    }
    player.targetLane = clamp(player.targetLane, 0, LANE_COUNT - 1);
    player.lane += (player.targetLane - player.lane) * Math.min(1, dt * 11);
    player.x = laneX(player.lane);
    player.lean += (steer - player.lean) * Math.min(1, dt * 10);

    const baseSpeed = 138 + state.level * 8;
    let boost = 0;
    if (input.boost && state.nitro > 0) {
        boost = 170;
        state.nitro = Math.max(0, state.nitro - dt * 30);
        state.sparkTimer -= dt;
        if (state.sparkTimer <= 0) {
            const px = projectLaneX(player.lane, player.y + player.h * 0.2);
            addSpark(px + (Math.random() - 0.5) * 18, player.y + 24, '#fb7185', 0.7);
            addSpark(px + (Math.random() - 0.5) * 16, player.y + 28, '#f59e0b', 0.7);
            state.sparkTimer = 0.016;
        }
    } else {
        state.nitro = Math.min(100, state.nitro + dt * 11);
        state.sparkTimer = 0;
    }
    state.speed += ((baseSpeed + boost) - state.speed) * Math.min(1, dt * 3.6);

    state.distance += state.speed * dt * 0.45;
    state.score += state.speed * dt * 0.24;
    state.level = 1 + Math.floor(state.distance / 430);
    state.roadOffset = (state.roadOffset + state.speed * dt * 2.2) % TRACK_DEPTH;
    state.flashTimer = Math.max(0, state.flashTimer - dt * 3.4);

    state.spawnTimer -= dt;
    const spawnEvery = Math.max(0.16, 0.56 - state.level * 0.017);
    if (state.spawnTimer <= 0) {
        addRival();
        state.spawnTimer = spawnEvery;
    }

    state.pickupTimer -= dt;
    if (state.pickupTimer <= 0) {
        addPickup();
        state.pickupTimer = 2.25 + Math.random() * 1.4;
    }

    const playerBox = {
        x: player.x,
        y: player.y,
        w: player.w * 0.72,
        h: player.h * 0.84,
    };

    for (let i = 0; i < rivals.length; i++) {
        const rival = rivals[i];
        rival.y += state.speed * dt * rival.speedFactor;
        rival.x = laneX(rival.lane);
    }

    separateRivalsByLane();

    for (let i = rivals.length - 1; i >= 0; i--) {
        const rival = rivals[i];

        if (rival.y > canvas.height + 140) {
            rivals.splice(i, 1);
            state.score += 24;
            continue;
        }

        if (intersects(playerBox, {
            x: rival.x,
            y: rival.y,
            w: rival.w * 0.72,
            h: rival.h * 0.82,
        })) {
            const hitX = projectLaneX(rival.lane, Math.min(canvas.height - 20, rival.y));
            for (let k = 0; k < 16; k++) addSpark(hitX, player.y - 8, '#fca5a5', 1.6);
            rivals.splice(i, 1);
            state.hp = Math.max(0, state.hp - 16);
            state.flashTimer = 1;
            state.score = Math.max(0, state.score - 55);
        }
    }

    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        pickup.y += state.speed * dt * 0.92;
        pickup.x = laneX(pickup.lane);
        pickup.spin += dt * 6;
        if (pickup.y > canvas.height + 80) {
            pickups.splice(i, 1);
            continue;
        }
        if (intersects(playerBox, pickup)) {
            const px = projectLaneX(pickup.lane, pickup.y);
            for (let k = 0; k < 10; k++) addSpark(px, pickup.y, '#fde68a', 1.1);
            pickups.splice(i, 1);
            state.nitro = Math.min(100, state.nitro + 30);
            state.hp = Math.min(100, state.hp + 8);
            state.score += 40;
        }
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
        spark.vx *= 0.97;
        spark.vy *= 0.98;
        spark.life -= dt;
        if (spark.life <= 0) sparks.splice(i, 1);
    }

    if (state.hp <= 0) {
        endRun();
    }

    syncHud();
}

function drawBackdrop() {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#020617');
    sky.addColorStop(0.55, '#111827');
    sky.addColorStop(0.75, '#2b1b2f');
    sky.addColorStop(1, '#4b1d24');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const moonGlow = ctx.createRadialGradient(760, 64, 10, 760, 64, 90);
    moonGlow.addColorStop(0, 'rgba(248,250,252,0.4)');
    moonGlow.addColorStop(1, 'rgba(248,250,252,0)');
    ctx.fillStyle = moonGlow;
    ctx.fillRect(670, 0, 200, 170);
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(760, 64, 19, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const flicker = 0.45 + Math.sin(state.time * 2 + star.twinkle) * 0.4;
        ctx.fillStyle = `rgba(255,255,255,${clamp(flicker, 0.15, 0.92)})`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }

    const skylineShift = (state.distance * 0.12) % (canvas.width + 260);
    for (let i = 0; i < skyline.length; i++) {
        const b = skyline[i];
        for (let pass = 0; pass < 2; pass++) {
            const baseX = b.x - skylineShift + pass * (canvas.width + 260);
            const y = HORIZON_Y - b.h + 20;
            ctx.fillStyle = `hsl(225 18% ${b.tone}%)`;
            ctx.fillRect(baseX, y, b.w, b.h);

            const windowCols = b.windows;
            const gap = b.w / (windowCols + 1);
            for (let c = 1; c <= windowCols; c++) {
                for (let r = 0; r < 5; r++) {
                    if ((r + c + i) % 2 === 0) continue;
                    const wx = baseX + c * gap - 2;
                    const wy = y + 10 + r * 16;
                    ctx.fillStyle = 'rgba(253, 224, 71, 0.45)';
                    ctx.fillRect(wx, wy, 4, 7);
                }
            }
        }
    }

    const haze = ctx.createLinearGradient(0, HORIZON_Y - 10, 0, HORIZON_Y + 90);
    haze.addColorStop(0, 'rgba(244, 63, 94, 0.26)');
    haze.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, HORIZON_Y - 10, canvas.width, 110);
}

function drawRoad() {
    const side = ctx.createLinearGradient(0, HORIZON_Y, 0, canvas.height);
    side.addColorStop(0, '#0f172a');
    side.addColorStop(0.45, '#0b1220');
    side.addColorStop(1, '#020617');
    ctx.fillStyle = side;
    ctx.fillRect(0, HORIZON_Y, canvas.width, canvas.height - HORIZON_Y);

    const roadShape = new Path2D();
    roadShape.moveTo(roadXAtNorm(-1, HORIZON_Y), HORIZON_Y);
    roadShape.lineTo(roadXAtNorm(1, HORIZON_Y), HORIZON_Y);
    roadShape.lineTo(roadXAtNorm(1, canvas.height), canvas.height);
    roadShape.lineTo(roadXAtNorm(-1, canvas.height), canvas.height);
    roadShape.closePath();

    const roadFill = ctx.createLinearGradient(0, HORIZON_Y, 0, canvas.height);
    roadFill.addColorStop(0, '#2a3340');
    roadFill.addColorStop(0.52, '#1b2431');
    roadFill.addColorStop(1, '#0f1721');
    ctx.fillStyle = roadFill;
    ctx.fill(roadShape);

    ctx.save();
    ctx.clip(roadShape);
    const grainSpeed = state.roadOffset * 0.7;
    for (let i = -40; i < 80; i++) {
        const y = HORIZON_Y + ((i * 18 + grainSpeed) % (canvas.height - HORIZON_Y + 22));
        if (y < HORIZON_Y || y > canvas.height) continue;
        const depth = depthAtY(y);
        const lx = roadXAtNorm(-0.98, y);
        const rx = roadXAtNorm(0.98, y);
        const noiseW = (rx - lx) * (0.42 + Math.sin(i * 12.71) * 0.06);
        const nx = lx + ((i * 67.9) % Math.max(1, (rx - lx - noiseW)));
        const h = 1 + depth * 2.2;
        ctx.fillStyle = `rgba(255,255,255,${0.012 + depth * 0.045})`;
        ctx.fillRect(nx, y, noiseW, h);
        ctx.fillStyle = `rgba(2,6,23,${0.03 + depth * 0.06})`;
        ctx.fillRect(lx, y + h, rx - lx, h * 0.66);
    }

    const centerGlow = ctx.createLinearGradient(ROAD_CENTER, HORIZON_Y, ROAD_CENTER, canvas.height);
    centerGlow.addColorStop(0, 'rgba(148,163,184,0.02)');
    centerGlow.addColorStop(0.6, 'rgba(148,163,184,0.06)');
    centerGlow.addColorStop(1, 'rgba(148,163,184,0.12)');
    ctx.fillStyle = centerGlow;
    ctx.fillRect(ROAD_CENTER - 64, HORIZON_Y, 128, canvas.height - HORIZON_Y);
    ctx.restore();

    const steps = 40;
    const segLen = 96;
    const stripeLen = 46;
    const cameraOffset = state.roadOffset % segLen;
    const segmentShift = Math.floor(state.roadOffset / segLen);
    const boostOn = input.boost && state.nitro > 0 && state.mode === 'playing';
    for (let i = -1; i < steps; i++) {
        const d1 = i * segLen + cameraOffset;
        const d2 = d1 + stripeLen;
        if (d2 <= 0) continue;
        const z1 = clamp(d1 / TRACK_DEPTH, 0, 1);
        const z2 = clamp(d2 / TRACK_DEPTH, 0, 1);
        if (z1 >= 1) continue;
        const y1 = HORIZON_Y + Math.pow(z1, 1.32) * (canvas.height - HORIZON_Y + 40);
        const y2 = HORIZON_Y + Math.pow(z2, 1.32) * (canvas.height - HORIZON_Y + 40);
        if (y2 <= y1 || y1 > canvas.height) continue;

        const lx1 = roadXAtNorm(-1, y1);
        const lx2 = roadXAtNorm(-1, y2);
        const rx1 = roadXAtNorm(1, y1);
        const rx2 = roadXAtNorm(1, y2);
        const rumbleColor = (i + segmentShift) % 2 === 0 ? '#ef4444' : '#f8fafc';

        ctx.fillStyle = rumbleColor;
        ctx.beginPath();
        ctx.moveTo(lx1, y1);
        ctx.lineTo(lx1 - 8 - z1 * 14, y1);
        ctx.lineTo(lx2 - 8 - z2 * 14, y2);
        ctx.lineTo(lx2, y2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(rx1, y1);
        ctx.lineTo(rx1 + 8 + z1 * 14, y1);
        ctx.lineTo(rx2 + 8 + z2 * 14, y2);
        ctx.lineTo(rx2, y2);
        ctx.closePath();
        ctx.fill();

        if ((i + segmentShift) % 2 === 0) {
            for (let lane = 1; lane < LANE_COUNT; lane++) {
                const laneEdge = -1 + (2 * lane) / LANE_COUNT;
                const x1 = roadXAtNorm(laneEdge, y1);
                const x2 = roadXAtNorm(laneEdge, y2);
                const w1 = 0.8 + z1 * 3.8;
                const w2 = 1 + z2 * 3.8;
                ctx.fillStyle = boostOn ? 'rgba(253, 186, 116, 0.8)' : 'rgba(255,255,255,0.72)';
                ctx.beginPath();
                ctx.moveTo(x1 - w1, y1);
                ctx.lineTo(x1 + w1, y1);
                ctx.lineTo(x2 + w2, y2);
                ctx.lineTo(x2 - w2, y2);
                ctx.closePath();
                ctx.fill();
            }
        }

        if ((i + segmentShift) % 5 === 0) {
            const ly = y1;
            if (ly < HORIZON_Y + 8 || ly > canvas.height - 8) continue;
            const leftPoleX = roadXAtNorm(-1.16, ly);
            const rightPoleX = roadXAtNorm(1.16, ly);
            const poleH = 8 + z1 * 22;

            ctx.strokeStyle = 'rgba(148,163,184,0.85)';
            ctx.lineWidth = 1.2 + z1 * 1.4;
            ctx.beginPath();
            ctx.moveTo(leftPoleX, ly);
            ctx.lineTo(leftPoleX, ly - poleH);
            ctx.moveTo(rightPoleX, ly);
            ctx.lineTo(rightPoleX, ly - poleH);
            ctx.stroke();

            ctx.fillStyle = boostOn ? 'rgba(251,146,60,0.94)' : 'rgba(250,204,21,0.85)';
            ctx.beginPath();
            ctx.arc(leftPoleX, ly - poleH, 1.6 + z1 * 2.3, 0, Math.PI * 2);
            ctx.arc(rightPoleX, ly - poleH, 1.6 + z1 * 2.3, 0, Math.PI * 2);
            ctx.fill();

            if (z1 > 0.55) {
                ctx.strokeStyle = 'rgba(203,213,225,0.35)';
                ctx.lineWidth = 0.8 + z1;
                ctx.beginPath();
                ctx.moveTo(leftPoleX, ly - poleH * 0.5);
                ctx.lineTo(rightPoleX, ly - poleH * 0.5);
                ctx.stroke();
            }
        }
    }
}

function drawSpark(spark) {
    ctx.fillStyle = spark.color;
    ctx.globalAlpha = clamp(spark.life * 2.4, 0, 1);
    ctx.fillRect(spark.x, spark.y, spark.size, spark.size * 1.4);
    ctx.globalAlpha = 1;
}

function drawBike(laneIndex, y, w, h, color, lean, hasGlow) {
    const depth = depthAtY(y);
    const scale = 0.56 + depth * 1.08;
    const bx = projectLaneX(laneIndex, y);
    const bw = w * scale;
    const bh = h * scale;

    ctx.save();
    ctx.translate(bx, y);
    ctx.rotate(lean * 0.11);

    ctx.fillStyle = 'rgba(15,23,42,0.6)';
    ctx.beginPath();
    ctx.ellipse(0, bh * 0.46, bw * 0.46, bh * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();

    if (hasGlow) {
        const glow = ctx.createRadialGradient(0, bh * 0.32, 3, 0, bh * 0.32, bw * 0.65);
        glow.addColorStop(0, 'rgba(244,63,94,0.42)');
        glow.addColorStop(1, 'rgba(244,63,94,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(-bw, 0, bw * 2, bh * 0.9);
    }

    const wheelSpin = state.time * (2.8 + state.speed * 0.015);
    const drawWheel = (wx, wy, r) => {
        const tire = ctx.createRadialGradient(wx, wy, r * 0.25, wx, wy, r);
        tire.addColorStop(0, '#334155');
        tire.addColorStop(1, '#020617');
        ctx.fillStyle = tire;
        ctx.beginPath();
        ctx.arc(wx, wy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(226,232,240,0.8)';
        ctx.lineWidth = Math.max(1, r * 0.12);
        ctx.beginPath();
        ctx.arc(wx, wy, r * 0.58, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(148,163,184,0.7)';
        ctx.lineWidth = Math.max(0.8, r * 0.08);
        for (let i = 0; i < 6; i++) {
            const a = wheelSpin + (i * Math.PI) / 3;
            ctx.beginPath();
            ctx.moveTo(wx, wy);
            ctx.lineTo(wx + Math.cos(a) * r * 0.55, wy + Math.sin(a) * r * 0.55);
            ctx.stroke();
        }
    };

    const frontWheelY = -bh * 0.31;
    const rearWheelY = bh * 0.28;
    const wheelR = bw * 0.16;
    drawWheel(0, frontWheelY, wheelR);
    drawWheel(0, rearWheelY, wheelR * 0.95);

    ctx.strokeStyle = '#0b1220';
    ctx.lineWidth = Math.max(2, bw * 0.085);
    ctx.beginPath();
    ctx.moveTo(0, rearWheelY + wheelR * 0.2);
    ctx.lineTo(0, frontWheelY - wheelR * 0.2);
    ctx.stroke();

    const frame = ctx.createLinearGradient(-bw * 0.3, 0, bw * 0.3, 0);
    frame.addColorStop(0, '#111827');
    frame.addColorStop(0.5, color);
    frame.addColorStop(1, '#fb923c');
    ctx.fillStyle = frame;
    ctx.fillRect(-bw * 0.28, -bh * 0.21, bw * 0.56, bh * 0.46);

    const tank = ctx.createLinearGradient(-bw * 0.23, -bh * 0.2, bw * 0.23, -bh * 0.02);
    tank.addColorStop(0, '#fda4af');
    tank.addColorStop(1, '#fb7185');
    ctx.fillStyle = tank;
    ctx.fillRect(-bw * 0.2, -bh * 0.18, bw * 0.4, bh * 0.18);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-bw * 0.15, -bh * 0.01, bw * 0.3, bh * 0.1);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = Math.max(1.2, bw * 0.06);
    ctx.beginPath();
    ctx.moveTo(0, -bh * 0.32);
    ctx.lineTo(-bw * 0.18, -bh * 0.42);
    ctx.moveTo(0, -bh * 0.32);
    ctx.lineTo(bw * 0.18, -bh * 0.42);
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, -bh * 0.44, bw * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, -bh * 0.44, bw * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(-bw * 0.08, bh * 0.24, bw * 0.16, bh * 0.16);

    // Rider body
    const bob = Math.sin(state.time * 18) * bh * 0.012;
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.ellipse(0, -bh * 0.18 + bob, bw * 0.16, bh * 0.17, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.ellipse(0, -bh * 0.23 + bob, bw * 0.13, bh * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rider helmet + visor
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(0, -bh * 0.41 + bob, bw * 0.095, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-bw * 0.065, -bh * 0.43 + bob, bw * 0.13, bh * 0.04);

    // Arms to handlebars
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = Math.max(1.1, bw * 0.05);
    ctx.beginPath();
    ctx.moveTo(-bw * 0.06, -bh * 0.25 + bob);
    ctx.lineTo(-bw * 0.16, -bh * 0.39);
    ctx.moveTo(bw * 0.06, -bh * 0.25 + bob);
    ctx.lineTo(bw * 0.16, -bh * 0.39);
    ctx.stroke();

    // Legs to foot pegs
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = Math.max(1, bw * 0.045);
    ctx.beginPath();
    ctx.moveTo(-bw * 0.05, -bh * 0.12 + bob);
    ctx.lineTo(-bw * 0.1, bh * 0.12);
    ctx.moveTo(bw * 0.05, -bh * 0.12 + bob);
    ctx.lineTo(bw * 0.1, bh * 0.12);
    ctx.stroke();

    if (hasGlow) {
        const headX = 0;
        const headY = -bh * 0.56;
        const beam = ctx.createLinearGradient(headX, headY, headX, -bh * 1.24);
        beam.addColorStop(0, 'rgba(253,224,71,0.52)');
        beam.addColorStop(1, 'rgba(253,224,71,0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(headX - bw * 0.12, headY);
        ctx.lineTo(headX + bw * 0.12, headY);
        ctx.lineTo(headX + bw * 0.45, -bh * 1.24);
        ctx.lineTo(headX - bw * 0.45, -bh * 1.24);
        ctx.closePath();
        ctx.fill();
    }

    if (hasGlow && input.boost && state.nitro > 0) {
        ctx.fillStyle = 'rgba(251,146,60,0.9)';
        ctx.beginPath();
        ctx.moveTo(0, bh * 0.42);
        ctx.lineTo(-bw * 0.07, bh * 0.56 + Math.sin(state.time * 30) * 2);
        ctx.lineTo(bw * 0.07, bh * 0.56 + Math.cos(state.time * 26) * 2);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

function drawRival(rival) {
    const depth = depthAtY(rival.y);
    const scale = 0.44 + depth * 1.02;
    const x = projectLaneX(rival.lane, rival.y);
    const w = rival.w * scale;
    const h = rival.h * scale;
    const bodyColor = `hsl(${rival.hue} 82% 56%)`;

    ctx.save();
    ctx.translate(x, rival.y);

    ctx.fillStyle = 'rgba(2,6,23,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, h * 0.45, w * 0.32, h * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0b1220';
    ctx.fillRect(-w * 0.12, -h * 0.5, w * 0.24, h * 1.02);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-w * 0.26, -h * 0.32, w * 0.52, h * 0.54);
    ctx.fillStyle = '#bfdbfe';
    ctx.fillRect(-w * 0.2, -h * 0.38, w * 0.4, h * 0.1);
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(-w * 0.11, h * 0.19, w * 0.22, h * 0.12);

    ctx.restore();
}

function drawPickup(pickup) {
    const depth = depthAtY(pickup.y);
    const scale = 0.42 + depth * 0.9;
    const x = projectLaneX(pickup.lane, pickup.y);
    const r = pickup.w * 0.47 * scale;

    ctx.save();
    ctx.translate(x, pickup.y);
    ctx.rotate(pickup.spin);
    ctx.scale(1 + Math.sin(state.time * 8 + pickup.spin) * 0.06, 1 + Math.cos(state.time * 8 + pickup.spin) * 0.06);

    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 2.2);
    glow.addColorStop(0, 'rgba(250,204,21,0.7)');
    glow.addColorStop(1, 'rgba(250,204,21,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-r * 2.2, -r * 2.2, r * 4.4, r * 4.4);

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(-r * 0.62, -r * 0.2, r * 1.24, r * 0.4);
    ctx.fillRect(-r * 0.2, -r * 0.62, r * 0.4, r * 1.24);

    ctx.restore();
}

function drawBoostEffects() {
    if (!(input.boost && state.nitro > 0 && state.mode === 'playing')) return;

    const alpha = 0.08 + Math.sin(state.time * 22) * 0.04;
    ctx.fillStyle = `rgba(248, 113, 113, ${alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 12; i++) {
        const x = ((i * 83 + state.time * 420) % (canvas.width + 120)) - 60;
        const g = ctx.createLinearGradient(x, canvas.height, x + 36, HORIZON_Y);
        g.addColorStop(0, 'rgba(244,63,94,0.3)');
        g.addColorStop(1, 'rgba(244,63,94,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x, HORIZON_Y, 42, canvas.height - HORIZON_Y);
    }
    ctx.globalCompositeOperation = 'source-over';
}

function drawDamageFlash() {
    if (state.flashTimer <= 0) return;
    ctx.fillStyle = `rgba(239,68,68,${0.24 * state.flashTimer})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawVignette() {
    const v = ctx.createRadialGradient(
        canvas.width * 0.5,
        canvas.height * 0.58,
        canvas.height * 0.14,
        canvas.width * 0.5,
        canvas.height * 0.58,
        canvas.height * 0.75
    );
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.34)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function render() {
    drawBackdrop();
    drawRoad();

    for (let i = 0; i < pickups.length; i++) drawPickup(pickups[i]);
    for (let i = 0; i < rivals.length; i++) drawRival(rivals[i]);
    for (let i = 0; i < sparks.length; i++) drawSpark(sparks[i]);

    drawBike(player.lane, player.y, player.w, player.h, '#fb7185', player.lean, true);
    drawBoostEffects();
    drawDamageFlash();
    drawVignette();
}

function syncHud() {
    speedEl.textContent = Math.round(state.speed);
    distanceEl.textContent = Math.floor(state.distance);
    scoreEl.textContent = Math.floor(state.score);
    levelEl.textContent = state.level;
    hpEl.textContent = Math.max(0, Math.round(state.hp));
    nitroEl.textContent = Math.round(state.nitro);
}

function tick(ts) {
    if (!state.lastTs) state.lastTs = ts;
    const dt = Math.min(0.033, (ts - state.lastTs) / 1000);
    state.lastTs = ts;

    update(dt);
    render();
    requestAnimationFrame(tick);
}

function bindTouchButton(el, onDown, onUp) {
    if (!el) return;
    const start = (event) => {
        event.preventDefault();
        onDown();
    };
    const end = (event) => {
        event.preventDefault();
        onUp();
    };
    el.addEventListener('pointerdown', start);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', end);
}

function updateJoystick(event) {
    const dxRaw = event.clientX - joystick.centerX;
    const dyRaw = event.clientY - joystick.centerY;
    const dist = Math.hypot(dxRaw, dyRaw);
    const scale = dist > joystick.radius ? joystick.radius / dist : 1;
    const dx = dxRaw * scale;
    const dy = dyRaw * scale;
    joystick.nx = dx / joystick.radius;
    joystick.ny = dy / joystick.radius;
    input.axisX = joystick.nx;
    joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

function startJoystick(event) {
    event.preventDefault();
    joystick.active = true;
    joystick.pointerId = event.pointerId;
    const rect = joystickWrap.getBoundingClientRect();
    joystick.centerX = rect.left + rect.width * 0.5;
    joystick.centerY = rect.top + rect.height * 0.5;
    joystickWrap.setPointerCapture(event.pointerId);
    updateJoystick(event);
}

function moveJoystick(event) {
    if (!joystick.active || event.pointerId !== joystick.pointerId) return;
    event.preventDefault();
    updateJoystick(event);
}

function endJoystick(event) {
    if (!joystick.active || event.pointerId !== joystick.pointerId) return;
    event.preventDefault();
    resetJoystick();
}

document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') input.left = true;
    if (key === 'arrowright' || key === 'd') input.right = true;
    if (key === 'arrowup' || key === 'w' || key === 'shift') input.boost = true;
});

document.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') input.left = false;
    if (key === 'arrowright' || key === 'd') input.right = false;
    if (key === 'arrowup' || key === 'w' || key === 'shift') input.boost = false;
});

if (joystickWrap) {
    joystickWrap.addEventListener('pointerdown', startJoystick);
    window.addEventListener('pointermove', moveJoystick, { passive: false });
    window.addEventListener('pointerup', endJoystick, { passive: false });
    window.addEventListener('pointercancel', endJoystick, { passive: false });
}

bindTouchButton(
    touchBoost,
    () => {
        input.boost = true;
    },
    () => {
        input.boost = false;
    }
);

function startRide() {
    resetGame();
}

overlayBtn.addEventListener('click', startRide);
startBtn.addEventListener('click', startRide);

showOverlay(
    'Road Rush',
    'Dodge traffic, ride with nitro, and steer smoothly with the mobile joystick.',
    'Start Ride'
);
render();
requestAnimationFrame(tick);
