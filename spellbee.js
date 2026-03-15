const SPELL_BEE_WORDS = [
    {
        word: 'honey',
        clue: 'A sweet food made by bees.',
        sentence: 'The toast tasted better with a layer of honey on top.',
        category: 'Nature'
    },
    {
        word: 'lantern',
        clue: 'A portable light with a protective case around it.',
        sentence: 'We carried a lantern while walking through the campsite.',
        category: 'Objects'
    },
    {
        word: 'journey',
        clue: 'Travel from one place to another.',
        sentence: 'Their journey across the hills took all afternoon.',
        category: 'Adventure'
    },
    {
        word: 'cushion',
        clue: 'A soft pillow used for comfort on a chair or sofa.',
        sentence: 'The cat curled up on the blue cushion by the window.',
        category: 'Home'
    },
    {
        word: 'whistle',
        clue: 'A clear, high sound made by the mouth or a small tool.',
        sentence: 'The referee blew the whistle to begin the match.',
        category: 'Sound'
    },
    {
        word: 'calendar',
        clue: 'A chart or book that shows days, weeks, and months.',
        sentence: 'She circled the holiday date on the kitchen calendar.',
        category: 'Daily Life'
    },
    {
        word: 'mountain',
        clue: 'A landform that rises steeply above the surrounding area.',
        sentence: 'Snow still covered the top of the mountain in spring.',
        category: 'Geography'
    },
    {
        word: 'brilliant',
        clue: 'Very bright or exceptionally clever.',
        sentence: 'The scientist had a brilliant idea during the meeting.',
        category: 'Vocabulary'
    },
    {
        word: 'orchard',
        clue: 'Land where fruit trees are grown.',
        sentence: 'We picked ripe apples in the orchard behind the barn.',
        category: 'Nature'
    },
    {
        word: 'gravity',
        clue: 'The force that pulls objects toward Earth.',
        sentence: 'Gravity kept the ball from floating into the sky.',
        category: 'Science'
    },
    {
        word: 'festival',
        clue: 'A time of celebration with events or performances.',
        sentence: 'The city festival filled the streets with music and lights.',
        category: 'Culture'
    },
    {
        word: 'capture',
        clue: 'To catch or take control of something.',
        sentence: 'She tried to capture the butterfly in a small jar.',
        category: 'Action'
    },
    {
        word: 'fragile',
        clue: 'Easily broken or damaged.',
        sentence: 'Please handle the fragile vase with both hands.',
        category: 'Vocabulary'
    },
    {
        word: 'compass',
        clue: 'A tool used to show direction.',
        sentence: 'The compass needle pointed north all afternoon.',
        category: 'Adventure'
    },
    {
        word: 'balance',
        clue: 'To remain steady without falling.',
        sentence: 'He used his arms to balance on the narrow beam.',
        category: 'Action'
    },
    {
        word: 'gallery',
        clue: 'A place where art is displayed.',
        sentence: 'The gallery featured paintings from local students.',
        category: 'Culture'
    },
    {
        word: 'delicate',
        clue: 'Fine, light, or easily damaged.',
        sentence: 'The baker placed the delicate pastry on a silver plate.',
        category: 'Vocabulary'
    },
    {
        word: 'horizon',
        clue: 'The line where the earth or sea seems to meet the sky.',
        sentence: 'The sun dipped below the horizon at the end of the day.',
        category: 'Geography'
    }
];

const TOTAL_ROUNDS = 10;
const STORAGE_KEY = 'spellBeeBestScore';

const scoreEl = document.getElementById('score-val');
const bestEl = document.getElementById('best-val');
const streakEl = document.getElementById('streak-val');
const roundEl = document.getElementById('round-val');
const livesEl = document.getElementById('lives-val');
const categoryEl = document.getElementById('category-val');
const clueEl = document.getElementById('clue-text');
const sentenceEl = document.getElementById('sentence-text');
const statusEl = document.getElementById('status-msg');
const answerInput = document.getElementById('answer-input');
const historyList = document.getElementById('history-list');
const endModal = document.getElementById('end-modal');
const endTitle = document.getElementById('end-title');
const endSummary = document.getElementById('end-summary');
const finalScoreEl = document.getElementById('final-score');
const finalBestEl = document.getElementById('final-best');

const answerForm = document.getElementById('answer-form');
const speakBtn = document.getElementById('speak-btn');
const sentenceBtn = document.getElementById('sentence-btn');
const skipBtn = document.getElementById('skip-btn');
const restartBtn = document.getElementById('restart-btn');
const playAgainBtn = document.getElementById('play-again-btn');

let bestScore = Number(localStorage.getItem(STORAGE_KEY) || 0);
let gameState = null;
let advanceTimer = null;

bestEl.textContent = String(bestScore);

function shuffle(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function speakWord(word) {
    if (!('speechSynthesis' in window)) {
        setStatus('Speech is not available in this browser. Use the clue and sentence.', 'error');
        return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.82;
    utterance.pitch = 1.02;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}

function setStatus(message, tone = '') {
    statusEl.textContent = message;
    statusEl.className = 'status-msg';
    if (tone) {
        statusEl.classList.add(tone);
    }
}

function renderHistory() {
    if (!gameState.history.length) {
        historyList.innerHTML = '<p class="history-empty">No words answered yet.</p>';
        return;
    }

    historyList.innerHTML = gameState.history
        .slice()
        .reverse()
        .map((entry) => {
            const stateClass = entry.correct ? 'correct' : 'wrong';
            const stateText = entry.correct ? 'Correct' : 'Missed';
            return `
                <div class="history-item">
                    <div>
                        <p class="history-word">${entry.word}</p>
                        <p>${entry.category}</p>
                    </div>
                    <span class="history-state ${stateClass}">${stateText}</span>
                </div>
            `;
        })
        .join('');
}

function updateHud() {
    scoreEl.textContent = String(gameState.score);
    bestEl.textContent = String(bestScore);
    streakEl.textContent = String(gameState.streak);
    roundEl.textContent = `${Math.min(gameState.index + 1, TOTAL_ROUNDS)} / ${TOTAL_ROUNDS}`;
    livesEl.textContent = String(gameState.lives);
}

function renderRound() {
    const current = gameState.words[gameState.index];
    categoryEl.textContent = current.category;
    clueEl.textContent = current.clue;
    sentenceEl.textContent = 'Sentence will appear here.';
    answerInput.value = '';
    answerInput.disabled = false;
    speakBtn.disabled = false;
    sentenceBtn.disabled = false;
    skipBtn.disabled = false;
    setStatus('Press Hear Word to listen, then type your spelling.');
    updateHud();
    renderHistory();
    answerInput.focus();
}

function saveBestScore() {
    if (gameState.score > bestScore) {
        bestScore = gameState.score;
        localStorage.setItem(STORAGE_KEY, String(bestScore));
    }
}

function finishGame(reason) {
    clearTimeout(advanceTimer);
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    answerInput.disabled = true;
    speakBtn.disabled = true;
    sentenceBtn.disabled = true;
    skipBtn.disabled = true;
    saveBestScore();
    bestEl.textContent = String(bestScore);
    finalScoreEl.textContent = String(gameState.score);
    finalBestEl.textContent = String(bestScore);

    if (reason === 'lives') {
        endTitle.textContent = 'Out of lives';
        endSummary.textContent = 'You can restart immediately and try to build a longer streak.';
    } else {
        endTitle.textContent = 'All rounds cleared';
        endSummary.textContent = 'You finished every word in the deck. Run it again for a higher score.';
    }

    endModal.classList.remove('hidden');
}

function nextRound() {
    clearTimeout(advanceTimer);
    gameState.index += 1;
    if (gameState.index >= TOTAL_ROUNDS) {
        finishGame('rounds');
        return;
    }
    renderRound();
}

function registerResult(correct, skipped = false) {
    const current = gameState.words[gameState.index];
    gameState.history.push({
        word: current.word,
        category: current.category,
        correct
    });

    if (correct) {
        gameState.streak += 1;
        gameState.score += 10 + (gameState.streak - 1) * 2;
        setStatus(`Correct. "${current.word}" keeps your streak alive.`, 'success');
    } else {
        gameState.lives -= 1;
        gameState.streak = 0;
        const prefix = skipped ? 'Skipped.' : 'Incorrect.';
        setStatus(`${prefix} The correct spelling was "${current.word}".`, 'error');
    }

    updateHud();
    renderHistory();
    answerInput.disabled = true;
    speakBtn.disabled = true;
    sentenceBtn.disabled = true;
    skipBtn.disabled = true;

    if (gameState.lives <= 0) {
        advanceTimer = setTimeout(() => finishGame('lives'), 1100);
        return;
    }

    advanceTimer = setTimeout(nextRound, 1200);
}

function startGame() {
    clearTimeout(advanceTimer);
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    endModal.classList.add('hidden');
    gameState = {
        words: shuffle(SPELL_BEE_WORDS).slice(0, TOTAL_ROUNDS),
        index: 0,
        score: 0,
        streak: 0,
        lives: 3,
        history: []
    };
    renderRound();
}

answerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!gameState) {
        return;
    }

    const guess = answerInput.value.trim().toLowerCase();
    if (!guess) {
        setStatus('Type your spelling before checking the answer.', 'error');
        return;
    }

    const current = gameState.words[gameState.index];
    registerResult(guess === current.word.toLowerCase());
});

speakBtn.addEventListener('click', () => {
    if (!gameState) {
        return;
    }
    const current = gameState.words[gameState.index];
    speakWord(current.word);
    setStatus('Pronunciation played. Type the word you heard.');
});

sentenceBtn.addEventListener('click', () => {
    if (!gameState) {
        return;
    }
    const current = gameState.words[gameState.index];
    sentenceEl.textContent = current.sentence;
    setStatus('Sentence revealed. Use it if the clue was not enough.');
});

skipBtn.addEventListener('click', () => {
    if (!gameState) {
        return;
    }
    registerResult(false, true);
});

restartBtn.addEventListener('click', startGame);
playAgainBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (event) => {
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    const isTypingTarget =
        document.activeElement === answerInput ||
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        document.activeElement?.isContentEditable;

    if (event.key.toLowerCase() === 'enter' && document.activeElement === answerInput) {
        return;
    }

    if (isTypingTarget) {
        return;
    }

    if (event.key.toLowerCase() === 'h' && gameState && !speakBtn.disabled) {
        event.preventDefault();
        speakBtn.click();
    }
});

startGame();
