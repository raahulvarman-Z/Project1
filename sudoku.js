// ============================================================
//  SUDOKU — sudoku.js
// ============================================================

const DIFF = { easy: 46, medium: 36, hard: 26 }; // given cells

const SudokuAudioCtx = window.AudioContext || window.webkitAudioContext;
let sudokuAudioCtx = null;

function getSudokuAudioCtx() {
    if (!SudokuAudioCtx) return null;
    if (!sudokuAudioCtx) sudokuAudioCtx = new SudokuAudioCtx();
    return sudokuAudioCtx;
}

function unlockSudokuAudio() {
    const ctx = getSudokuAudioCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
}

function playSudokuTone(freq, duration, type, volume, endFreq = null) {
    const ctx = getSudokuAudioCtx();
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

function playSudokuUiSound() { playSudokuTone(520, 0.08, 'triangle', 0.025, 760); }
function playSudokuSelectSound() { playSudokuTone(650, 0.05, 'sine', 0.02, 560); }
function playSudokuNoteSound() { playSudokuTone(780, 0.05, 'triangle', 0.02, 900); }
function playSudokuPlaceSound() { playSudokuTone(460, 0.08, 'triangle', 0.028, 620); }
function playSudokuClearSound() { playSudokuTone(300, 0.06, 'sine', 0.02, 240); }
function playSudokuErrorSound() { playSudokuTone(250, 0.12, 'sawtooth', 0.045, 140); }
function playSudokuUndoSound() { playSudokuTone(400, 0.07, 'triangle', 0.024, 300); }
function playSudokuWinSound() {
    playSudokuTone(760, 0.1, 'triangle', 0.03, 980);
    setTimeout(() => playSudokuTone(980, 0.14, 'triangle', 0.03, 1240), 70);
}
function playSudokuLoseSound() {
    playSudokuTone(230, 0.18, 'sawtooth', 0.05, 110);
    setTimeout(() => playSudokuTone(170, 0.2, 'sine', 0.04, 70), 65);
}

// ── Puzzle generation ─────────────────────────────────────────
function generateSolved() {
    const grid = Array(9).fill(null).map(() => Array(9).fill(0));
    solve(grid);
    return grid;
}

function isValid(grid, row, col, num) {
    for (let i = 0; i < 9; i++) {
        if (grid[row][i] === num) return false;
        if (grid[i][col] === num) return false;
        const br = 3 * Math.floor(row / 3) + Math.floor(i / 3);
        const bc = 3 * Math.floor(col / 3) + (i % 3);
        if (grid[br][bc] === num) return false;
    }
    return true;
}

function solve(grid) {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (grid[r][c] !== 0) continue;
            const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            for (const n of nums) {
                if (isValid(grid, r, c, n)) {
                    grid[r][c] = n;
                    if (solve(grid)) return true;
                    grid[r][c] = 0;
                }
            }
            return false;
        }
    }
    return true;
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function generatePuzzle(difficulty) {
    const solved = generateSolved();
    const puzzle = solved.map(r => [...r]);
    const given = DIFF[difficulty];
    // Remove 81-given cells
    const cells = shuffle(Array.from({ length: 81 }, (_, i) => i));
    let removed = 0;
    for (const idx of cells) {
        if (removed >= 81 - given) break;
        const r = Math.floor(idx / 9), c = idx % 9;
        const backup = puzzle[r][c];
        puzzle[r][c] = 0;
        // Verify unique solution (quick check with counter)
        const count = { val: 0 };
        countSolutions(puzzle.map(row => [...row]), count);
        if (count.val !== 1) { puzzle[r][c] = backup; }
        else removed++;
    }
    return { puzzle, solved };
}

function countSolutions(grid, count) {
    if (count.val > 1) return;
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (grid[r][c] !== 0) continue;
            for (let n = 1; n <= 9; n++) {
                if (isValid(grid, r, c, n)) {
                    grid[r][c] = n;
                    countSolutions(grid, count);
                    grid[r][c] = 0;
                }
            }
            return;
        }
    }
    count.val++;
}

// ── State ─────────────────────────────────────────────────────
let puzzle = [];   // 0 = empty
let solution = [];
let userGrid = [];   // player's current grid
let given = [];   // true = given (immutable)
let notes = [];   // notes[r][c] = Set of numbers
let selected = null; // [r,c]
let notesMode = false;
let mistakes = 0;
let undoStack = [];
let difficulty = 'easy';
let timerSec = 0;
let timerInterval = null;
let gameWon = false;

bestKey = () => `sudoku_best_${difficulty}`;

// ── Grid render ───────────────────────────────────────────────
function buildGrid() {
    const el = document.getElementById('sudoku-grid');
    el.innerHTML = '';
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const cell = document.createElement('div');
            cell.className = 'sudoku-cell';
            cell.dataset.r = r; cell.dataset.c = c;
            cell.addEventListener('click', () => selectCell(r, c));
            el.appendChild(cell);
        }
    }
}

function renderGrid() {
    document.querySelectorAll('.sudoku-cell').forEach(cell => {
        const r = +cell.dataset.r, c = +cell.dataset.c;
        cell.dataset.row = r; cell.dataset.col = c;
        // Base class
        cell.className = 'sudoku-cell';

        const val = userGrid[r][c];
        const isGiven = given[r][c];
        const isError = !isGiven && val !== 0 && val !== solution[r][c];

        // State classes
        if (isGiven) cell.classList.add('given');
        else cell.classList.add('user-fill');
        if (isError) cell.classList.add('error');

        // Selection highlighting
        if (selected) {
            const [sr, sc] = selected;
            if (r === sr && c === sc) {
                cell.classList.add('selected');
            } else if (r === sr || c === sc || (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3))) {
                cell.classList.add('highlight');
            }
            // Same number highlight
            const sVal = userGrid[sr][sc];
            if (sVal !== 0 && val === sVal) cell.classList.add('same-num');
        }

        // Content
        const noteSet = notes[r][c];
        if (val !== 0) {
            cell.textContent = val;
        } else if (noteSet.size > 0) {
            cell.innerHTML = '';
            const ng = document.createElement('div');
            ng.className = 'notes-grid';
            for (let n = 1; n <= 9; n++) {
                const nd = document.createElement('div');
                nd.className = 'note-num';
                nd.textContent = noteSet.has(n) ? n : '';
                ng.appendChild(nd);
            }
            cell.appendChild(ng);
        } else {
            cell.textContent = '';
        }
    });
}

function selectCell(r, c) {
    unlockSudokuAudio();
    playSudokuSelectSound();
    selected = [r, c];
    renderGrid();
}

// ── Place number ──────────────────────────────────────────────
function placeNumber(num) {
    unlockSudokuAudio();
    if (!selected || gameWon) return;
    const [r, c] = selected;
    if (given[r][c]) {
        playSudokuErrorSound();
        return;
    }

    if (notesMode && num !== 0) {
        undoStack.push({ type: 'note', r, c, notesBefore: new Set(notes[r][c]) });
        if (notes[r][c].has(num)) notes[r][c].delete(num);
        else notes[r][c].add(num);
        playSudokuNoteSound();
        renderGrid();
        return;
    }

    const before = userGrid[r][c];
    undoStack.push({ type: 'fill', r, c, before, notesBefore: new Set(notes[r][c]) });
    userGrid[r][c] = num;
    if (num !== 0) notes[r][c].clear();

    if (num !== 0 && num !== solution[r][c]) {
        playSudokuErrorSound();
        mistakes++;
        document.getElementById('mistakes').textContent = mistakes;
        if (mistakes >= 3) endGame(false);
    } else if (num === 0) {
        playSudokuClearSound();
    } else {
        playSudokuPlaceSound();
    }

    renderGrid();
    if (num !== 0) checkWin();
}

function undo() {
    unlockSudokuAudio();
    if (!undoStack.length) return;
    const action = undoStack.pop();
    if (action.type === 'fill') {
        userGrid[action.r][action.c] = action.before;
        notes[action.r][action.c] = action.notesBefore;
    } else if (action.type === 'note') {
        notes[action.r][action.c] = action.notesBefore;
    }
    playSudokuUndoSound();
    renderGrid();
}

function checkWin() {
    for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
            if (userGrid[r][c] !== solution[r][c]) return;
    endGame(true);
}

function endGame(won) {
    gameWon = true;
    clearInterval(timerInterval);
    if (!won) {
        playSudokuLoseSound();
        document.getElementById('lose-overlay').classList.remove('hidden');
        return;
    }

    const timeStr = formatTime(timerSec);
    document.getElementById('win-time-val').textContent = timeStr;

    const bestRaw = localStorage.getItem(bestKey());
    const bestSec = bestRaw ? parseInt(bestRaw) : Infinity;
    let isNew = false;
    if (timerSec < bestSec) {
        localStorage.setItem(bestKey(), timerSec);
        document.getElementById('best-time').textContent = timeStr;
        isNew = true;
    }
    playSudokuWinSound();
    document.getElementById('win-best-badge').classList.toggle('hidden', !isNew);
    document.getElementById('win-overlay').classList.remove('hidden');
}

function formatTime(s) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function startTimer() {
    clearInterval(timerInterval);
    timerSec = 0;
    document.getElementById('timer').textContent = formatTime(0);
    timerInterval = setInterval(() => {
        timerSec++;
        document.getElementById('timer').textContent = formatTime(timerSec);
    }, 1000);
}

function newPuzzle() {
    gameWon = false; mistakes = 0; selected = null; notesMode = false;
    undoStack = [];
    document.getElementById('mistakes').textContent = '0';
    document.getElementById('win-overlay').classList.add('hidden');
    document.getElementById('lose-overlay').classList.add('hidden');
    document.getElementById('notes-btn').classList.remove('notes-active');

    // Load best
    const b = localStorage.getItem(bestKey());
    document.getElementById('best-time').textContent = b ? formatTime(parseInt(b)) : '--:--';

    const { puzzle: p, solved } = generatePuzzle(difficulty);
    puzzle = p;
    solution = solved;
    userGrid = p.map(r => [...r]);
    given = p.map(r => r.map(v => v !== 0));
    notes = Array(9).fill(null).map(() => Array(9).fill(null).map(() => new Set()));

    buildGrid();
    renderGrid();
    startTimer();
}

// ── Controls ──────────────────────────────────────────────────
document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        unlockSudokuAudio();
        playSudokuUiSound();
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        difficulty = btn.dataset.diff;
        newPuzzle();
    });
});

document.getElementById('new-puzzle-btn').addEventListener('click', () => {
    unlockSudokuAudio();
    playSudokuUiSound();
    newPuzzle();
});

document.getElementById('notes-btn').addEventListener('click', () => {
    unlockSudokuAudio();
    notesMode = !notesMode;
    document.getElementById('notes-btn').classList.toggle('notes-active', notesMode);
    playSudokuNoteSound();
});

document.getElementById('undo-btn').addEventListener('click', () => {
    unlockSudokuAudio();
    undo();
});

document.querySelectorAll('.num-key').forEach(btn => {
    btn.addEventListener('click', () => {
        unlockSudokuAudio();
        placeNumber(+btn.dataset.num);
    });
});

document.getElementById('win-new-btn').addEventListener('click', () => {
    unlockSudokuAudio();
    playSudokuUiSound();
    newPuzzle();
});
document.getElementById('lose-new-btn').addEventListener('click', () => {
    unlockSudokuAudio();
    playSudokuUiSound();
    newPuzzle();
});

// Keyboard input
document.addEventListener('keydown', e => {
    if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        unlockSudokuAudio();
        placeNumber(+e.key);
    }
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        unlockSudokuAudio();
        placeNumber(0);
    }
    if (e.key === 'n' || e.key === 'N') {
        unlockSudokuAudio();
        notesMode = !notesMode;
        document.getElementById('notes-btn').classList.toggle('notes-active', notesMode);
        playSudokuNoteSound();
    }
    if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) {
        unlockSudokuAudio();
        e.preventDefault();
        undo();
    }
    // Arrow key navigation
    if (selected && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        unlockSudokuAudio();
        e.preventDefault();
        let [r, c] = selected;
        if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
        if (e.key === 'ArrowDown') r = Math.min(8, r + 1);
        if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
        if (e.key === 'ArrowRight') c = Math.min(8, c + 1);
        selectCell(r, c);
    }
});

// ── Init ──────────────────────────────────────────────────────
newPuzzle();
