// ============================================================
//  CHESS — chess.js  (full rules + minimax AI depth-3)
// ============================================================

// ── Piece unicode ─────────────────────────────────────────────
const UNI = {
    wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
    bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
};

// ── Piece values (centipawns) ─────────────────────────────────
const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const ChessAudioCtx = window.AudioContext || window.webkitAudioContext;
let chessAudioCtx = null;

function getChessAudioCtx() {
    if (!ChessAudioCtx) return null;
    if (!chessAudioCtx) chessAudioCtx = new ChessAudioCtx();
    return chessAudioCtx;
}

function unlockChessAudio() {
    const ctx = getChessAudioCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
}

function playChessTone(freq, duration, type, volume, endFreq = null) {
    const ctx = getChessAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.03);
}

function playChessUiSound() { playChessTone(560, 0.07, 'triangle', 0.025, 760); }
function playChessSelectSound() { playChessTone(700, 0.05, 'sine', 0.02, 620); }
function playChessMoveSound() { playChessTone(440, 0.08, 'triangle', 0.03, 560); }
function playChessCaptureSound() { playChessTone(320, 0.11, 'sawtooth', 0.04, 190); }
function playChessCastleSound() {
    playChessTone(460, 0.07, 'triangle', 0.028, 600);
    setTimeout(() => playChessTone(620, 0.07, 'triangle', 0.022, 760), 50);
}
function playChessCheckSound() { playChessTone(980, 0.07, 'square', 0.03, 820); }
function playChessPromoteSound() { playChessTone(820, 0.1, 'triangle', 0.03, 1300); }
function playChessGameOverSound(result) {
    if (result === 'win') {
        playChessTone(720, 0.1, 'triangle', 0.03, 980);
        setTimeout(() => playChessTone(980, 0.12, 'triangle', 0.03, 1240), 70);
        return;
    }
    if (result === 'lose') {
        playChessTone(260, 0.16, 'sawtooth', 0.05, 120);
        setTimeout(() => playChessTone(180, 0.18, 'sine', 0.04, 80), 65);
        return;
    }
    playChessTone(420, 0.09, 'triangle', 0.025, 420);
    setTimeout(() => playChessTone(520, 0.09, 'triangle', 0.02, 520), 60);
}

// ── Piece-square tables (white perspective, row0=rank8) ───────
const PST = {
    p: [[0, 0, 0, 0, 0, 0, 0, 0], [50, 50, 50, 50, 50, 50, 50, 50], [10, 10, 20, 30, 30, 20, 10, 10], [5, 5, 10, 25, 25, 10, 5, 5], [0, 0, 0, 20, 20, 0, 0, 0], [5, -5, -10, 0, 0, -10, -5, 5], [5, 10, 10, -20, -20, 10, 10, 5], [0, 0, 0, 0, 0, 0, 0, 0]],
    n: [[-50, -40, -30, -30, -30, -30, -40, -50], [-40, -20, 0, 0, 0, 0, -20, -40], [-30, 0, 10, 15, 15, 10, 0, -30], [-30, 5, 15, 20, 20, 15, 5, -30], [-30, 0, 15, 20, 20, 15, 0, -30], [-30, 5, 10, 15, 15, 10, 5, -30], [-40, -20, 0, 5, 5, 0, -20, -40], [-50, -40, -30, -30, -30, -30, -40, -50]],
    b: [[-20, -10, -10, -10, -10, -10, -10, -20], [-10, 0, 0, 0, 0, 0, 0, -10], [-10, 0, 5, 10, 10, 5, 0, -10], [-10, 5, 5, 10, 10, 5, 5, -10], [-10, 0, 10, 10, 10, 10, 0, -10], [-10, 10, 10, 10, 10, 10, 10, -10], [-10, 5, 0, 0, 0, 0, 5, -10], [-20, -10, -10, -10, -10, -10, -10, -20]],
    r: [[0, 0, 0, 0, 0, 0, 0, 0], [5, 10, 10, 10, 10, 10, 10, 5], [-5, 0, 0, 0, 0, 0, 0, -5], [-5, 0, 0, 0, 0, 0, 0, -5], [-5, 0, 0, 0, 0, 0, 0, -5], [-5, 0, 0, 0, 0, 0, 0, -5], [-5, 0, 0, 0, 0, 0, 0, -5], [0, 0, 0, 5, 5, 0, 0, 0]],
    q: [[-20, -10, -10, -5, -5, -10, -10, -20], [-10, 0, 0, 0, 0, 0, 0, -10], [-10, 0, 5, 5, 5, 5, 0, -10], [-5, 0, 5, 5, 5, 5, 0, -5], [0, 0, 5, 5, 5, 5, 0, -5], [-10, 5, 5, 5, 5, 5, 0, -10], [-10, 0, 5, 0, 0, 0, 0, -10], [-20, -10, -10, -5, -5, -10, -10, -20]],
    k: [[-30, -40, -40, -50, -50, -40, -40, -30], [-30, -40, -40, -50, -50, -40, -40, -30], [-30, -40, -40, -50, -50, -40, -40, -30], [-30, -40, -40, -50, -50, -40, -40, -30], [-20, -30, -30, -40, -40, -30, -30, -20], [-10, -20, -20, -20, -20, -20, -20, -10], [20, 20, 0, 0, 0, 0, 20, 20], [20, 30, 10, 0, 0, 10, 30, 20]],
};

// ── Initial board ─────────────────────────────────────────────
function initBoard() {
    const b = Array(8).fill(null).map(() => Array(8).fill(null));
    const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let c = 0; c < 8; c++) {
        b[0][c] = { t: back[c], c: 'b' };
        b[1][c] = { t: 'p', c: 'b' };
        b[6][c] = { t: 'p', c: 'w' };
        b[7][c] = { t: back[c], c: 'w' };
    }
    return b;
}

function cloneBoard(b) { return b.map(r => r.map(p => p ? { ...p } : null)); }
function opp(c) { return c === 'w' ? 'b' : 'w'; }
function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

// ── Move generation ───────────────────────────────────────────
function pseudoMoves(board, r, c, castling, ep) {
    const p = board[r][c]; if (!p) return [];
    const moves = [];
    const add = (tr, tc, promo) => { if (inBounds(tr, tc)) moves.push({ fr: r, fc: c, tr, tc, promo: promo || false }); };

    if (p.t === 'p') {
        const dir = p.c === 'w' ? -1 : 1;
        const start = p.c === 'w' ? 6 : 1;
        if (!board[r + dir]?.[c]) {
            const promoRow = p.c === 'w' ? 0 : 7;
            if (r + dir === promoRow) { ['q', 'r', 'b', 'n'].forEach(pt => add(r + dir, c, pt)); }
            else { add(r + dir, c); }
            if (r === start && !board[r + 2 * dir]?.[c]) add(r + 2 * dir, c);
        }
        for (const dc of [-1, 1]) {
            if (!inBounds(r + dir, c + dc)) continue;
            const target = board[r + dir][c + dc];
            if (target && target.c === opp(p.c)) {
                const promoRow = p.c === 'w' ? 0 : 7;
                if (r + dir === promoRow) { ['q', 'r', 'b', 'n'].forEach(pt => add(r + dir, c + dc, pt)); }
                else add(r + dir, c + dc);
            }
            if (ep && ep[0] === r + dir && ep[1] === c + dc) add(r + dir, c + dc);
        }
        return moves;
    }

    if (p.t === 'n') {
        const ds = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        for (const [dr, dc] of ds) {
            const [tr, tc] = [r + dr, c + dc];
            if (inBounds(tr, tc) && board[tr][tc]?.c !== p.c) add(tr, tc);
        }
        return moves;
    }

    const slides = { b: [[-1, -1], [-1, 1], [1, -1], [1, 1]], r: [[-1, 0], [1, 0], [0, -1], [0, 1]], q: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]], k: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]] };
    if (['b', 'r', 'q'].includes(p.t)) {
        for (const [dr, dc] of slides[p.t]) {
            let [tr, tc] = [r + dr, c + dc];
            while (inBounds(tr, tc)) {
                if (board[tr][tc]) { if (board[tr][tc].c !== p.c) add(tr, tc); break; }
                add(tr, tc); tr += dr; tc += dc;
            }
        }
    }
    if (p.t === 'k') {
        for (const [dr, dc] of slides.k) {
            const [tr, tc] = [r + dr, c + dc];
            if (inBounds(tr, tc) && board[tr][tc]?.c !== p.c) add(tr, tc);
        }
        // Castling
        const backRank = p.c === 'w' ? 7 : 0;
        if (r === backRank && c === 4) {
            if (castling[p.c + 'k'] && !board[backRank][5] && !board[backRank][6])
                moves.push({ fr: r, fc: c, tr: backRank, tc: 6, castle: 'k' });
            if (castling[p.c + 'q'] && !board[backRank][3] && !board[backRank][2] && !board[backRank][1])
                moves.push({ fr: r, fc: c, tr: backRank, tc: 2, castle: 'q' });
        }
    }
    return moves;
}

function findKing(board, color) {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++)
        if (board[r][c]?.t === 'k' && board[r][c]?.c === color) return [r, c];
    return null;
}

function squareAttacked(board, r, c, byColor) {
    // Check if (r,c) is attacked by byColor
    for (let pr = 0; pr < 8; pr++) for (let pc = 0; pc < 8; pc++) {
        const p = board[pr][pc]; if (!p || p.c !== byColor) continue;
        const ms = pseudoMoves(board, pr, pc, { wk: false, wq: false, bk: false, bq: false }, null);
        if (ms.some(m => m.tr === r && m.tc === c)) return true;
    }
    return false;
}

function inCheck(board, color) {
    const kPos = findKing(board, color);
    if (!kPos) return false;
    return squareAttacked(board, kPos[0], kPos[1], opp(color));
}

function applyMove(board, move, castling, ep) {
    const nb = cloneBoard(board);
    const nc = { wk: castling.wk, wq: castling.wq, bk: castling.bk, bq: castling.bq };
    let nep = null;
    const piece = nb[move.fr][move.fc];

    nb[move.tr][move.tc] = move.promo ? { t: move.promo, c: piece.c } : { ...piece };
    nb[move.fr][move.fc] = null;

    // En passant capture
    if (piece.t === 'p' && ep && move.tr === ep[0] && move.tc === ep[1]) {
        nb[move.fr][move.tc] = null;
    }
    // En passant target
    if (piece.t === 'p' && Math.abs(move.tr - move.fr) === 2)
        nep = [(move.fr + move.tr) / 2, move.fc];

    // Castling rook move
    if (move.castle) {
        const rank = piece.c === 'w' ? 7 : 0;
        if (move.castle === 'k') { nb[rank][5] = nb[rank][7]; nb[rank][7] = null; }
        if (move.castle === 'q') { nb[rank][3] = nb[rank][0]; nb[rank][0] = null; }
    }

    // Update castling rights
    if (piece.t === 'k') { nc[piece.c + 'k'] = false; nc[piece.c + 'q'] = false; }
    if (piece.t === 'r') {
        if (move.fr === 7 && move.fc === 7) nc.wk = false;
        if (move.fr === 7 && move.fc === 0) nc.wq = false;
        if (move.fr === 0 && move.fc === 7) nc.bk = false;
        if (move.fr === 0 && move.fc === 0) nc.bq = false;
    }

    return { board: nb, castling: nc, ep: nep };
}

function getLegalMoves(board, r, c, castling, ep) {
    const p = board[r][c]; if (!p) return [];
    return pseudoMoves(board, r, c, castling, ep).filter(move => {
        // Castling: verify not in check, not moving through check
        if (move.castle) {
            const dir = move.castle === 'k' ? 1 : -1;
            if (inCheck(board, p.c)) return false;
            const nb1 = cloneBoard(board); nb1[move.fr][move.fc + dir] = { ...p }; nb1[move.fr][move.fc] = null;
            if (inCheck(nb1, p.c)) return false;
        }
        const { board: nb } = applyMove(board, move, castling, ep);
        return !inCheck(nb, p.c);
    });
}

function allLegalMoves(board, color, castling, ep) {
    const moves = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        if (board[r][c]?.c === color) moves.push(...getLegalMoves(board, r, c, castling, ep));
    }
    return moves;
}

// ── Evaluation ────────────────────────────────────────────────
function evaluateBoard(board) {
    let score = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const p = board[r][c]; if (!p) continue;
        const v = VAL[p.t];
        const row = p.c === 'w' ? r : 7 - r;
        const pst = PST[p.t][row][c];
        score += p.c === 'w' ? (v + pst) : -(v + pst);
    }
    return score;
}

// ── Minimax (Alpha-Beta, depth 3) ─────────────────────────────
const AI_LEVELS = {
    easy: { label: 'Easy', depth: 1, randomTopMoves: 6, randomChance: 0.75, thinkMs: [160, 340] },
    medium: { label: 'Medium', depth: 2, randomTopMoves: 3, randomChance: 0.18, thinkMs: [240, 520] },
    hard: { label: 'Hard', depth: 3, randomTopMoves: 1, randomChance: 0, thinkMs: [340, 760] },
};

function minimax(board, depth, alpha, beta, maximizing, castling, ep) {
    if (depth === 0) return { score: evaluateBoard(board) };
    const color = maximizing ? 'w' : 'b';
    const moves = allLegalMoves(board, color, castling, ep);
    if (moves.length === 0) {
        if (inCheck(board, color)) return { score: maximizing ? -50000 : 50000 };
        return { score: 0 }; // stalemate
    }
    // Sort moves: captures first (MVV-LVA simple)
    moves.sort((a, b) => {
        const va = board[a.tr][a.tc] ? VAL[board[a.tr][a.tc].t] : 0;
        const vb = board[b.tr][b.tc] ? VAL[board[b.tr][b.tc].t] : 0;
        return vb - va;
    });

    let best = null;
    if (maximizing) {
        let maxScore = -Infinity;
        for (const m of moves) {
            const { board: nb, castling: nc, ep: nep } = applyMove(board, m, castling, ep);
            const res = minimax(nb, depth - 1, alpha, beta, false, nc, nep);
            if (res.score > maxScore) { maxScore = res.score; best = m; }
            alpha = Math.max(alpha, maxScore);
            if (beta <= alpha) break;
        }
        return { score: maxScore, move: best };
    } else {
        let minScore = Infinity;
        for (const m of moves) {
            const { board: nb, castling: nc, ep: nep } = applyMove(board, m, castling, ep);
            const res = minimax(nb, depth - 1, alpha, beta, true, nc, nep);
            if (res.score < minScore) { minScore = res.score; best = m; }
            beta = Math.min(beta, minScore);
            if (beta <= alpha) break;
        }
        return { score: minScore, move: best };
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function scoreAndSortRootMoves(board, color, castling, ep, depth) {
    const maximizing = color === 'w';
    const moves = allLegalMoves(board, color, castling, ep);
    if (!moves.length) return [];

    moves.sort((a, b) => {
        const va = board[a.tr][a.tc] ? VAL[board[a.tr][a.tc].t] : 0;
        const vb = board[b.tr][b.tc] ? VAL[board[b.tr][b.tc].t] : 0;
        return vb - va;
    });

    const scored = moves.map(move => {
        if (depth <= 1) {
            const quick = board[move.tr][move.tc] ? VAL[board[move.tr][move.tc].t] : 0;
            return { move, score: maximizing ? quick : -quick };
        }
        const { board: nb, castling: nc, ep: nep } = applyMove(board, move, castling, ep);
        const res = minimax(nb, depth - 1, -Infinity, Infinity, !maximizing, nc, nep);
        return { move, score: res.score };
    });

    scored.sort((a, b) => maximizing ? b.score - a.score : a.score - b.score);
    return scored;
}

function getBestMove(board, color, castling, ep, levelKey) {
    const level = AI_LEVELS[levelKey] || AI_LEVELS.medium;
    const scored = scoreAndSortRootMoves(board, color, castling, ep, level.depth);
    if (!scored.length) return null;

    const topCount = Math.min(level.randomTopMoves, scored.length);
    if (topCount > 1 && Math.random() < level.randomChance) {
        return scored[randomInt(0, topCount - 1)].move;
    }
    return scored[0].move;
}

function getAiThinkDelay(levelKey) {
    const level = AI_LEVELS[levelKey] || AI_LEVELS.medium;
    return randomInt(level.thinkMs[0], level.thinkMs[1]);
}

// ─────────────────────────────────────────────────────────────
// UI
// ─────────────────────────────────────────────────────────────
let board, castling, ep, currentPlayer, selected, legalMoves;
let vsAI = true, flipped = false, gameOver = false;
let capturedW = [], capturedB = [];
let moveHistory_ = [];
let lastMove = null;
let pendingPromo = null;
let aiThinking = false;
let aiLevel = 'medium';
let aiTimeoutId = null;
let aiMoveToken = 0;

function clearPendingAiTurn() {
    aiMoveToken++;
    if (aiTimeoutId !== null) {
        clearTimeout(aiTimeoutId);
        aiTimeoutId = null;
    }
}

function syncDifficultyUI() {
    const wrap = document.getElementById('ai-level-wrap');
    const buttons = document.querySelectorAll('.difficulty-btn');
    const disabled = !vsAI || aiThinking;
    if (wrap) wrap.classList.toggle('disabled', disabled);
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.level === aiLevel);
        btn.disabled = disabled;
    });
}

function syncInteractionState() {
    const boardEl = document.getElementById('chess-board');
    if (boardEl) boardEl.classList.toggle('ai-thinking', aiThinking);
    syncDifficultyUI();
}

function setAiLevel(nextLevel) {
    if (!AI_LEVELS[nextLevel]) return;
    aiLevel = nextLevel;
    syncDifficultyUI();
    updateStatus();
}

function newGame() {
    clearPendingAiTurn();
    board = initBoard();
    castling = { wk: true, wq: true, bk: true, bq: true };
    ep = null;
    currentPlayer = 'w';
    selected = null; legalMoves = [];
    gameOver = false; aiThinking = false;
    capturedW = []; capturedB = [];
    moveHistory_ = []; lastMove = null; pendingPromo = null;
    hideGameOver();
    renderAll();
    updateStatus();
}

// ── Board render ──────────────────────────────────────────────
function buildBoardDOM() {
    const boardEl = document.getElementById('chess-board');
    boardEl.innerHTML = '';
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    // Rank labels
    const rl = document.getElementById('rank-labels');
    rl.innerHTML = '';
    (flipped ? [...ranks].reverse() : ranks).forEach(r => {
        const d = document.createElement('div'); d.textContent = r; rl.appendChild(d);
    });

    // File labels
    const fl = document.getElementById('file-labels');
    fl.innerHTML = '';
    (flipped ? [...files].reverse() : files).forEach(f => {
        const d = document.createElement('div'); d.textContent = f; fl.appendChild(d);
    });

    for (let ri = 0; ri < 8; ri++) {
        for (let ci = 0; ci < 8; ci++) {
            const r = flipped ? 7 - ri : ri;
            const c = flipped ? 7 - ci : ci;
            const cell = document.createElement('div');
            cell.className = 'cell ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
            cell.dataset.r = r; cell.dataset.c = c;
            cell.addEventListener('click', () => handleClick(+cell.dataset.r, +cell.dataset.c));
            boardEl.appendChild(cell);
        }
    }
}

function renderAll() {
    buildBoardDOM();
    updateCells();
    renderCaptured();
    renderMoveHistory();
    syncInteractionState();
}

function updateCells() {
    const cells = document.querySelectorAll('.cell');
    const lmSet = new Set(legalMoves.map(m => m.tr * 8 + m.tc));
    cells.forEach(cell => {
        const r = +cell.dataset.r, c = +cell.dataset.c;
        cell.className = 'cell ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
        // Highlights
        if (lastMove) {
            if (r === lastMove.fr && c === lastMove.fc) cell.classList.add('last-move-from');
            if (r === lastMove.tr && c === lastMove.tc) cell.classList.add('last-move-to');
        }
        if (selected && r === selected[0] && c === selected[1]) cell.classList.add('selected');
        // King in check
        if (!gameOver && inCheck(board, currentPlayer)) {
            const kp = findKing(board, currentPlayer);
            if (kp && r === kp[0] && c === kp[1]) cell.classList.add('in-check');
        }
        // Legal move dots
        if (lmSet.has(r * 8 + c)) {
            cell.classList.add(board[r][c] ? 'legal-capture' : 'legal-move');
        }
        // Piece
        const p = board[r][c];
        const key = p ? p.c + p.t : null;
        cell.innerHTML = p ? `<span class="piece">${UNI[key]}</span>` : '';
        if (p) cell.classList.add(p.c === 'w' ? 'white-piece' : 'black-piece');
    });
}

function handleClick(r, c) {
    unlockChessAudio();
    if (gameOver || aiThinking || pendingPromo) return;
    if (vsAI && currentPlayer === 'b') return;

    const piece = board[r][c];

    // If a square is already selected
    if (selected) {
        const move = legalMoves.find(m => m.tr === r && m.tc === c);
        if (move) {
            if (move.promo) {
                // Show promotion dialog
                pendingPromo = move;
                const moves = legalMoves.filter(m => m.tr === r && m.tc === c);
                showPromoDialog(moves, currentPlayer);
                return;
            }
            executeMove(move);
            return;
        }
        // Reselect own piece
        if (piece && piece.c === currentPlayer) {
            selected = [r, c];
            legalMoves = getLegalMoves(board, r, c, castling, ep);
            playChessSelectSound();
            updateCells();
            return;
        }
        selected = null; legalMoves = [];
        updateCells();
        return;
    }

    // Select piece
    if (piece && piece.c === currentPlayer) {
        selected = [r, c];
        legalMoves = getLegalMoves(board, r, c, castling, ep);
        playChessSelectSound();
        updateCells();
    }
}

function executeMove(move) {
    unlockChessAudio();
    const movingPiece = board[move.fr][move.fc];
    const captured = board[move.tr][move.tc];
    const isEnPassantCapture = movingPiece?.t === 'p' && ep && move.tr === ep[0] && move.tc === ep[1] && !captured;
    const isCaptureMove = !!captured || isEnPassantCapture;
    const isCastleMove = !!move.castle;
    const isPromotionMove = !!move.promo;
    // En passant capture
    if (movingPiece?.t === 'p' && ep && move.tr === ep[0] && move.tc === ep[1]) {
        const capRow = currentPlayer === 'w' ? move.tr + 1 : move.tr - 1;
        if (board[capRow][move.tc]) {
            if (currentPlayer === 'w') capturedW.push(board[capRow][move.tc]);
            else capturedB.push(board[capRow][move.tc]);
        }
    } else if (captured) {
        if (currentPlayer === 'w') capturedW.push(captured);
        else capturedB.push(captured);
    }

    const result = applyMove(board, move, castling, ep);
    board = result.board; castling = result.castling; ep = result.ep;
    lastMove = move;

    selected = null; legalMoves = [];
    currentPlayer = opp(currentPlayer);
    const moves = allLegalMoves(board, currentPlayer, castling, ep);
    const opponentInCheck = inCheck(board, currentPlayer);
    const isMate = opponentInCheck && moves.length === 0;
    const moveRecord = moveToNotation(move, movingPiece, {
        isCapture: isCaptureMove,
        isCheck: opponentInCheck,
        isMate
    });
    moveHistory_.push({ ...moveRecord, color: movingPiece.c });

    if (isCastleMove) playChessCastleSound();
    else if (isCaptureMove) playChessCaptureSound();
    else playChessMoveSound();
    if (isPromotionMove) setTimeout(playChessPromoteSound, 45);

    renderAll();
    updateStatus();

    // Check game over
    if (moves.length === 0) {
        gameOver = true;
        const icon = document.getElementById('status-icon');
        const text = document.getElementById('status-text');
        if (opponentInCheck) {
            const winner = currentPlayer === 'w' ? 'Black' : 'White';
            const humanWon = !vsAI || winner === 'White';
            const title = vsAI ? (humanWon ? 'You Win' : 'You Lose') : `${winner} Wins`;
            const msg = `Checkmate. ${winner} wins the game.`;
            icon.textContent = '!';
            text.textContent = msg;
            showGameOver(humanWon ? 'win' : 'lose', title, msg);
        } else {
            const title = 'Draw';
            const msg = 'Stalemate. No legal moves available.';
            icon.textContent = '=';
            text.textContent = msg;
            showGameOver('draw', title, msg);
        }
        return;
    }
    if (opponentInCheck) {
        const text = document.getElementById('status-text');
        text.textContent = (currentPlayer === 'w' ? 'White' : 'Black') + ' is in Check!';
        playChessCheckSound();
    }

    // AI move
    if (vsAI && currentPlayer === 'b') scheduleAI();
}

function scheduleAI() {
    if (gameOver || !vsAI || currentPlayer !== 'b') return;
    clearPendingAiTurn();
    aiThinking = true;
    syncInteractionState();
    updateStatus();
    const token = aiMoveToken;
    aiTimeoutId = setTimeout(() => {
        aiTimeoutId = null;
        if (token !== aiMoveToken || gameOver || !vsAI || currentPlayer !== 'b') {
            aiThinking = false;
            syncInteractionState();
            updateStatus();
            return;
        }
        aiThinking = false;
        syncInteractionState();
        const move = getBestMove(board, 'b', castling, ep, aiLevel);
        if (move) executeMove(move);
        else updateStatus();
    }, getAiThinkDelay(aiLevel));
}

function moveToNotation(move, piece, flags) {
    const files = 'abcdefgh';
    const ranks = '87654321';
    const fromSq = files[move.fc] + ranks[move.fr];
    const toSq = files[move.tc] + ranks[move.tr];
    const pieceType = piece?.t || 'p';
    const names = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
    const letters = { p: '', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K' };

    if (move.castle) {
        const san = move.castle === 'k' ? 'O-O' : 'O-O-O';
        const suffix = flags.isMate ? '#' : flags.isCheck ? '+' : '';
        const detail = move.castle === 'k' ? 'King castles king side' : 'King castles queen side';
        return { san: san + suffix, detail };
    }

    const captureToken = flags.isCapture ? 'x' : '';
    let san;
    if (pieceType === 'p') {
        const pawnPrefix = flags.isCapture ? files[move.fc] : '';
        san = `${pawnPrefix}${captureToken}${toSq}`;
    } else {
        san = `${letters[pieceType]}${captureToken}${toSq}`;
    }
    if (move.promo) san += `=${move.promo.toUpperCase()}`;
    if (flags.isMate) san += '#';
    else if (flags.isCheck) san += '+';

    const verb = flags.isCapture ? 'captures on' : 'to';
    const promoText = move.promo ? `, promotes to ${names[move.promo]}` : '';
    const detail = `${names[pieceType]} ${fromSq} ${verb} ${toSq}${promoText}`;
    return { san, detail };
}

// ── Promotion dialog ──────────────────────────────────────────
function showPromoDialog(moves, color) {
    const dialog = document.getElementById('promo-dialog');
    const choices = document.getElementById('promo-choices');
    choices.innerHTML = '';
    const types = ['q', 'r', 'b', 'n'];
    types.forEach(t => {
        const btn = document.createElement('button');
        btn.className = 'promo-piece-btn';
        btn.textContent = UNI[color + t];
        btn.addEventListener('click', () => {
            unlockChessAudio();
            playChessUiSound();
            const move = moves.find(m => m.promo === t);
            if (move) { dialog.classList.add('hidden'); pendingPromo = null; executeMove(move); }
        });
        choices.appendChild(btn);
    });
    dialog.classList.remove('hidden');
}

function showGameOver(result, title, msg) {
    unlockChessAudio();
    const overlay = document.getElementById('game-over-overlay');
    const box = document.getElementById('game-over-box');
    const badge = document.getElementById('game-over-badge');
    const titleEl = document.getElementById('game-over-title');
    const msgEl = document.getElementById('game-over-msg');

    box.classList.remove('win', 'lose', 'draw');
    box.classList.add(result);
    badge.textContent = result.toUpperCase();
    titleEl.textContent = title;
    msgEl.textContent = msg;
    overlay.classList.remove('hidden');
    playChessGameOverSound(result);
}

function hideGameOver() {
    document.getElementById('game-over-overlay').classList.add('hidden');
}

// ── Status update ─────────────────────────────────────────────
function updateStatus() {
    if (gameOver) return;
    const icon = document.getElementById('status-icon');
    const text = document.getElementById('status-text');
    if (aiThinking) {
        icon.textContent = 'AI';
        text.textContent = `AI (${AI_LEVELS[aiLevel].label}) is thinking...`;
        return;
    }
    if (currentPlayer === 'w') {
        icon.textContent = 'W';
        text.textContent = "White's Turn";
    } else {
        icon.textContent = vsAI ? 'AI' : 'B';
        text.textContent = vsAI ? `AI Turn (${AI_LEVELS[aiLevel].label})` : "Black's Turn";
    }
    return;
}

function renderCaptured() {
    const wEl = document.getElementById('captured-by-white');
    const bEl = document.getElementById('captured-by-black');
    wEl.innerHTML = capturedW.map(p => UNI[p.c + p.t]).join('') || '<span style="opacity:0.3;font-size:0.7rem">-</span>';
    bEl.innerHTML = capturedB.map(p => UNI[p.c + p.t]).join('') || '<span style="opacity:0.3;font-size:0.7rem">-</span>';
    return;
}

function createHistoryMoveCell(move, side) {
    const cell = document.createElement('div');
    cell.className = `history-move ${side}`;
    if (!move) {
        cell.classList.add('empty');
        cell.textContent = '-';
        return cell;
    }
    const san = document.createElement('div');
    san.className = 'history-san';
    san.textContent = move.san;
    const detail = document.createElement('div');
    detail.className = 'history-detail';
    detail.textContent = move.detail;
    cell.appendChild(san);
    cell.appendChild(detail);
    return cell;
}

function renderMoveHistory() {
    const el = document.getElementById('move-history');
    el.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'history-row history-head';
    header.innerHTML = '<div class="history-num">#</div><div class="history-head-cell">White</div><div class="history-head-cell">Black</div>';
    el.appendChild(header);

    if (!moveHistory_.length) {
        const empty = document.createElement('div');
        empty.className = 'move-history-empty';
        empty.textContent = 'Moves will appear here';
        el.appendChild(empty);
        return;
    }
    let moveNum = 1;
    for (let i = 0; i < moveHistory_.length; i += 2) {
        const wMove = moveHistory_[i];
        const bMove = moveHistory_[i + 1];
        const row = document.createElement('div');
        row.className = 'history-row';

        const numDiv = document.createElement('div');
        numDiv.className = 'history-num';
        numDiv.textContent = `${moveNum}.`;
        row.appendChild(numDiv);
        row.appendChild(createHistoryMoveCell(wMove, 'white'));
        row.appendChild(createHistoryMoveCell(bMove, 'black'));

        el.appendChild(row);
        moveNum++;
    }
    el.scrollTop = el.scrollHeight;
}

// ── Controls ──────────────────────────────────────────────────
document.getElementById('new-game-btn').addEventListener('click', () => {
    unlockChessAudio();
    playChessUiSound();
    gameOver = false;
    newGame();
});
document.getElementById('result-new-btn').addEventListener('click', () => {
    unlockChessAudio();
    playChessUiSound();
    gameOver = false;
    newGame();
});
document.getElementById('flip-btn').addEventListener('click', () => {
    unlockChessAudio();
    playChessUiSound();
    flipped = !flipped;
    renderAll();
});
document.getElementById('vs-ai-btn').addEventListener('click', () => {
    unlockChessAudio();
    playChessUiSound();
    vsAI = true;
    document.getElementById('vs-ai-btn').classList.add('active');
    document.getElementById('vs-human-btn').classList.remove('active');
    newGame();
});
document.getElementById('vs-human-btn').addEventListener('click', () => {
    unlockChessAudio();
    playChessUiSound();
    vsAI = false;
    document.getElementById('vs-human-btn').classList.add('active');
    document.getElementById('vs-ai-btn').classList.remove('active');
    newGame();
});
document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        unlockChessAudio();
        playChessUiSound();
        if (!vsAI || aiThinking) return;
        setAiLevel(btn.dataset.level);
    });
});

// Keyboard
document.addEventListener('keydown', e => {
    unlockChessAudio();
    if (e.key === 'Escape') {
        selected = null;
        legalMoves = [];
        playChessUiSound();
        updateCells();
    }
    if (e.code === 'KeyN') {
        playChessUiSound();
        newGame();
    }
    if (e.code === 'KeyF') {
        playChessUiSound();
        flipped = !flipped;
        renderAll();
    }
    if (e.code === 'Digit1' && vsAI && !aiThinking) {
        playChessUiSound();
        setAiLevel('easy');
    }
    if (e.code === 'Digit2' && vsAI && !aiThinking) {
        playChessUiSound();
        setAiLevel('medium');
    }
    if (e.code === 'Digit3' && vsAI && !aiThinking) {
        playChessUiSound();
        setAiLevel('hard');
    }
});

// ── Init ──────────────────────────────────────────────────────
newGame();
