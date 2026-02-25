const ROWS = 6;
const COLS = 7;
const PLAYER_BLUE = 1;
const PLAYER_RED = 2;

let board = [];
let currentPlayer = PLAYER_BLUE;
let isAnimating = false;
let gameActive = true;

const boardElement = document.getElementById('board');
const bodyElement = document.body;
const exitBtn = document.getElementById('exit-btn');
const startScreen = document.getElementById('start-screen');
const gameWrapper = document.getElementById('game-wrapper');
const vsFriendBtn = document.getElementById('vs-friend-btn');
const vsBotBtn = document.getElementById('vs-bot-btn');
const contactBtn = document.getElementById('contact-btn');

const winModal = document.getElementById('win-modal');
const winText = document.getElementById('win-text');

const difficultyScreen = document.getElementById('difficulty-screen');
const easyBtn = document.getElementById('easy-btn');
const mediumBtn = document.getElementById('medium-btn');
const hardBtn = document.getElementById('hard-btn');
const backBtn = document.getElementById('back-btn');

let exitTimer = null;
let holdDuration = 1000;
let vsAI = false;
let aiDifficulty = 'easy';
function startGame(mode, difficulty = 'easy') {
    startScreen.style.display = 'none';
    difficultyScreen.style.display = 'none';
    gameWrapper.style.display = 'flex';
    winModal.classList.remove('show');
    winModal.style.display = 'none';

    vsAI = (mode === 'ai');
    aiDifficulty = difficulty;

    initGame();
}

vsFriendBtn.addEventListener('click', () => startGame('friend'));

vsBotBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    difficultyScreen.style.display = 'flex';
});

easyBtn.addEventListener('click', () => startGame('ai', 'easy'));
mediumBtn.addEventListener('click', () => startGame('ai', 'medium'));
hardBtn.addEventListener('click', () => startGame('ai', 'hard'));

backBtn.addEventListener('click', () => {
    difficultyScreen.style.display = 'none';
    startScreen.style.display = 'flex';
});

contactBtn.addEventListener('click', () => {
    window.location.href = "mailto:mokshjoshi377@gmail.com";
});

function initGame() {
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    currentPlayer = PLAYER_BLUE;
    isAnimating = false;
    gameActive = true;
    renderBoard();
    updateTheme();
}

function updateTheme() {
    if (currentPlayer === PLAYER_BLUE) {
        bodyElement.classList.remove('red-turn');
    } else {
        bodyElement.classList.add('red-turn');
    }
}

function renderBoard() {
    boardElement.innerHTML = '';


    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', () => handleColumnClick(c));


            boardElement.appendChild(cell);
        }
    }
}

function setupBoardGrid() {
    boardElement.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.dataset.occupied = 'false';

            cell.addEventListener('click', () => handleColumnClick(c));
            boardElement.appendChild(cell);
        }
    }
}

function getCell(r, c) {
    return boardElement.children[r * COLS + c];
}

function handleColumnClick(col, isAi = false) {
    if (!gameActive || isAnimating) return;
    if (vsAI && !isAi && currentPlayer !== PLAYER_BLUE) return;

    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][col] === 0) {
            targetRow = r;
            break;
        }
    }

    if (targetRow === -1) {
        if (isAi && aiDifficulty !== 'easy') {
        }
        return;
    }

    isAnimating = true;
    animatePieceDrop(targetRow, col, currentPlayer, () => {
        board[targetRow][col] = currentPlayer;

        const winningCells = checkWin(targetRow, col);
        if (winningCells) {
            drawWinningLine(winningCells);
            gameActive = false;
            isAnimating = false;

            const winnerName = currentPlayer === PLAYER_BLUE ? 'Blue' : 'Red';
            winText.textContent = `${winnerName} Wins!`;

            winModal.style.display = 'flex';
            void winModal.offsetWidth;
            winModal.classList.add('show');

            setTimeout(() => {
                winModal.classList.remove('show');
                setTimeout(() => {
                    winModal.style.display = 'none';
                    exitGame();
                }, 300);
            }, 3000);
            return;
        }

        if (checkDraw()) {
            winText.textContent = "It's a Draw!";
            winModal.style.display = 'flex';
            void winModal.offsetWidth;
            winModal.classList.add('show');

            setTimeout(() => {
                winModal.classList.remove('show');
                setTimeout(() => {
                    winModal.style.display = 'none';
                    exitGame();
                }, 300);
            }, 3000);
            gameActive = false;
            isAnimating = false;
            return;
        }

        currentPlayer = currentPlayer === PLAYER_BLUE ? PLAYER_RED : PLAYER_BLUE;
        updateTheme();
        isAnimating = false;

        if (vsAI && currentPlayer === PLAYER_RED) {
            setTimeout(makeAIMove, 500);
        }
    });
}

function makeAIMove() {
    if (!gameActive) return;

    let col;
    if (aiDifficulty === 'easy') {
        col = getRandomMove();
    } else if (aiDifficulty === 'medium') {
        col = Math.random() < 0.5 ? getBestMove() : getRandomMove();
    } else {
        col = getBestMove();
    }

    if (col === undefined || col === -1) col = getRandomMove();

    if (col !== -1) {
        handleColumnClick(col, true);
    }
}

function getRandomMove() {
    const validCols = [];
    for (let c = 0; c < COLS; c++) {
        if (board[0][c] === 0) validCols.push(c);
    }
    if (validCols.length === 0) return -1;
    return validCols[Math.floor(Math.random() * validCols.length)];
}

function getBestMove() {
    for (let c = 0; c < COLS; c++) {
        if (board[0][c] !== 0) continue;
        let r = -1;
        for (let row = ROWS - 1; row >= 0; row--) {
            if (board[row][c] === 0) { r = row; break; }
        }
        if (r !== -1) {
            board[r][c] = PLAYER_RED;
            if (checkWin(r, c)) {
                board[r][c] = 0;
                return c;
            }
            board[r][c] = 0;
        }
    }

    for (let c = 0; c < COLS; c++) {
        if (board[0][c] !== 0) continue;
        let r = -1;
        for (let row = ROWS - 1; row >= 0; row--) {
            if (board[row][c] === 0) { r = row; break; }
        }
        if (r !== -1) {
            board[r][c] = PLAYER_BLUE;
            if (checkWin(r, c)) {
                board[r][c] = 0;
                return c;
            }
            board[r][c] = 0;
        }
    }

    const centerOrder = [3, 2, 4, 1, 5, 0, 6];
    for (let c of centerOrder) {
        if (board[0][c] === 0) return c;
    }

    return getRandomMove();
}

function drawWinningLine(cells) {
    cells.sort((a, b) => a[1] - b[1] || a[0] - b[0]);

    const startCell = getCell(cells[0][0], cells[0][1]);
    const endCell = getCell(cells[cells.length - 1][0], cells[cells.length - 1][1]);

    const startRect = startCell.getBoundingClientRect();
    const endRect = endCell.getBoundingClientRect();
    const boardRect = boardElement.getBoundingClientRect();

    const x1 = startRect.left - boardRect.left + startRect.width / 2;
    const y1 = startRect.top - boardRect.top + startRect.height / 2;
    const x2 = endRect.left - boardRect.left + endRect.width / 2;
    const y2 = endRect.top - boardRect.top + endRect.height / 2;

    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

    const line = document.createElement('div');
    line.classList.add('winning-line');
    line.style.width = `${length}px`;
    line.style.left = `${x1}px`;
    line.style.top = `${y1}px`;
    line.style.transform = `translateY(-50%) rotate(${angle}deg)`;

    boardElement.appendChild(line);
}

function animatePieceDrop(row, col, player, callback) {
    const cell = getCell(row, col);
    const piece = document.createElement('div');
    piece.classList.add('piece');
    piece.classList.add(player === PLAYER_BLUE ? 'blue' : 'red');
    piece.classList.add('falling');

    cell.appendChild(piece);

    piece.addEventListener('animationend', () => {
        piece.classList.remove('falling');
        callback();
    }, { once: true });
}

function checkWin(r, c) {
    const player = board[r][c];
    const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1]
    ];

    for (let [dr, dc] of directions) {
        let winningCells = [[r, c]];

        for (let i = 1; i < 4; i++) {
            const nr = r + dr * i;
            const nc = c + dc * i;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) {
                winningCells.push([nr, nc]);
            } else {
                break;
            }
        }

        for (let i = 1; i < 4; i++) {
            const nr = r - dr * i;
            const nc = c - dc * i;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) {
                winningCells.push([nr, nc]);
            } else {
                break;
            }
        }

        if (winningCells.length >= 4) return winningCells;
    }
    return null;
}

function checkDraw() {
    return board.every(row => row.every(cell => cell !== 0));
}

exitBtn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

function startExitTimer(e) {
    if (e.type === 'touchstart') e.preventDefault();
    exitBtn.classList.add('holding');

    exitTimer = setTimeout(() => {
        exitGame();
    }, holdDuration);
}

function cancelExitTimer() {
    exitBtn.classList.remove('holding');
    clearTimeout(exitTimer);
}

function exitGame() {
    cancelExitTimer();
    gameWrapper.style.display = 'none';
    startScreen.style.display = 'flex';
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.innerHTML = '';
        cell.dataset.occupied = 'false';
    });
    const lines = document.querySelectorAll('.winning-line');
    lines.forEach(line => line.remove());
}

exitBtn.addEventListener('mousedown', startExitTimer);
exitBtn.addEventListener('touchstart', startExitTimer);

exitBtn.addEventListener('mouseup', cancelExitTimer);
exitBtn.addEventListener('mouseleave', cancelExitTimer);
exitBtn.addEventListener('touchend', cancelExitTimer);
exitBtn.addEventListener('touchcancel', cancelExitTimer);
