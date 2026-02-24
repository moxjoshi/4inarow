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
    window.location.href = "mailto:mokshjoshi377@gmail.com"; // Placeholder
});

function initGame() {
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    currentPlayer = PLAYER_BLUE;
    isAnimating = false;
    gameActive = true;
    // updateStatus(); // Removed
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

    // We render column by column or row by row?
    // Grid matches array structure: Row 0 is top.

    // Actually, to handle clicks on columns easily, let's just generate cells.
    // We can map linear index to (row, col) or just use data attributes.

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', () => handleColumnClick(c));

            // Add piece if exists (for re-renders without full reset, though we usually append)
            // But for animation, we want to append fresh. 
            // The logic: board state holds truth. DOM reflects it.
            // If we re-render whole board, we lose running animations.
            // Better: Init creates grid. Click updates grid.

            boardElement.appendChild(cell);
        }
    }
}

// Initial Render just to set up grid
function setupBoardGrid() {
    boardElement.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.dataset.occupied = 'false';

            // Hover effects handled by handling mouseover on column logic if needed
            // For now simple click
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
    if (vsAI && !isAi && currentPlayer !== PLAYER_BLUE) return; // Block input during AI turn

    // Find first empty row from bottom
    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][col] === 0) {
            targetRow = r;
            break;
        }
    }

    if (targetRow === -1) {
        // Column full
        if (isAi && aiDifficulty !== 'easy') {
            // In medium/hard, if best move is full (fallback to random handles this, but recursive call?), retry?
            // Actually makeAIMove ensures col is valid? 
            // getRandomMove ensures valid. getBestMove ensures valid.
            // But race condition if user clicks immediately? (but locked by isAi check).
            // Just return.
        }
        return;
    }

    // Place piece
    isAnimating = true;
    animatePieceDrop(targetRow, col, currentPlayer, () => {
        board[targetRow][col] = currentPlayer;

        const winningCells = checkWin(targetRow, col);
        if (winningCells) {
            drawWinningLine(winningCells);
            gameActive = false;
            isAnimating = false;

            // Show Win Modal
            const winnerName = currentPlayer === PLAYER_BLUE ? 'Blue' : 'Red';
            winText.textContent = `${winnerName} Wins!`;

            // Simultaneous show with line
            winModal.style.display = 'flex';
            void winModal.offsetWidth; // Force reflow
            winModal.classList.add('show');

            setTimeout(() => {
                winModal.classList.remove('show');
                setTimeout(() => {
                    winModal.style.display = 'none';
                    exitGame();
                }, 300);
            }, 3000); // 3 seconds viewing time
            return;
        }

        if (checkDraw()) {
            winText.textContent = "It's a Draw!";
            winModal.style.display = 'flex';
            void winModal.offsetWidth; // Force reflow
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

    // Safety check if best move returns undefined (full board handled elsewhere but good to be safe)
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
    // 1. Check for winning move
    for (let c = 0; c < COLS; c++) {
        if (board[0][c] !== 0) continue; // Full
        // Simulate move
        let r = -1;
        for (let row = ROWS - 1; row >= 0; row--) {
            if (board[row][c] === 0) { r = row; break; }
        }
        if (r !== -1) {
            board[r][c] = PLAYER_RED; // AI is RED
            if (checkWin(r, c)) {
                board[r][c] = 0; // Undo
                return c;
            }
            board[r][c] = 0; // Undo
        }
    }

    // 2. Check for blocking move
    for (let c = 0; c < COLS; c++) {
        if (board[0][c] !== 0) continue; // Full
        // Simulate opponent move
        let r = -1;
        for (let row = ROWS - 1; row >= 0; row--) {
            if (board[row][c] === 0) { r = row; break; }
        }
        if (r !== -1) {
            board[r][c] = PLAYER_BLUE; // Opponent is BLUE
            if (checkWin(r, c)) {
                board[r][c] = 0; // Undo
                return c;
            }
            board[r][c] = 0; // Undo
        }
    }

    // 3. Strategic Preference (Center)
    const centerOrder = [3, 2, 4, 1, 5, 0, 6];
    for (let c of centerOrder) {
        if (board[0][c] === 0) return c;
    }

    return getRandomMove();
}

function drawWinningLine(cells) {
    // Sort cells to find start and end (points are somewhat scrambled from checkWin center expansion)
    // We want the most distant pair.
    // Or just find min R/C and max R/C?
    // Actually, sorting by column then row (or vice versa) works for line drawing.

    // Sort primarily by col, then by row.
    cells.sort((a, b) => a[1] - b[1] || a[0] - b[0]);

    const startCell = getCell(cells[0][0], cells[0][1]);
    const endCell = getCell(cells[cells.length - 1][0], cells[cells.length - 1][1]);

    const startRect = startCell.getBoundingClientRect();
    const endRect = endCell.getBoundingClientRect();
    const boardRect = boardElement.getBoundingClientRect();

    // Calculate centers relative to board
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
    line.style.transform = `translateY(-50%) rotate(${angle}deg)`; // Center vertically on start point

    boardElement.appendChild(line);
}

function animatePieceDrop(row, col, player, callback) {
    const cell = getCell(row, col);
    const piece = document.createElement('div');
    piece.classList.add('piece');
    piece.classList.add(player === PLAYER_BLUE ? 'blue' : 'red');
    piece.classList.add('falling');

    // Adjust drop distance based on row
    // The CSS animation is fixed duration/distance for simplicity, 
    // but to make it perfect, we can manipulate the keyframe or start position.
    // However, since we are inside `overflow: hidden` cell, the piece appears only when inside the cell?
    // User wants "proper falling".
    // If the cell has overflow: hidden, we won't see it falling FROM THE TOP of the board through other cells.
    // Fix: We shouldn't use overflow:hidden on cells if we want to see it pass through.
    // BETTER APPROACH: 
    // The piece shouldn't be inside the cell DIV until it lands.
    // OR: We simulate the fall by having a separate "animation layer" on top.

    // Let's try a simpler robust approach for visually pleasing fall:
    // We add the piece to the target cell, but visual start position is high up.
    // Since `cell` is relative, `top: -X px` works.
    // Distance = (row index * cell size) + padding?

    // BUT, if we put it in the cell (row 5), and translate Y -500px, it goes up 500px relative to that cell.
    // That means it will pass through cells 0,1,2,3,4 visually.
    // `overflow: hidden` on cell would CLIP it.
    // So update style.css to REMOVE overflow:hidden from .cell

    // Calculate distance
    // approximate distance. Each row is roughly 70px (60 + 10 gap).
    // row 0: falls ~ 100px? (from header)
    // row 5: falls ~ 6*70 = 420px.

    // Actually, let's just use a fixed large negative value that clears the board.
    // The board height is ~6 * 70 = 420px. -500px is safe.

    cell.appendChild(piece);

    // Wait for animation frame
    piece.addEventListener('animationend', () => {
        piece.classList.remove('falling');
        callback();
    }, { once: true });
}

function checkWin(r, c) {
    const player = board[r][c];
    const directions = [
        [0, 1],  // Horizontal
        [1, 0],  // Vertical
        [1, 1],  // Diagonal \
        [1, -1]  // Diagonal /
    ];

    for (let [dr, dc] of directions) {
        let winningCells = [[r, c]];

        // Check positive direction
        for (let i = 1; i < 4; i++) {
            const nr = r + dr * i;
            const nc = c + dc * i;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) {
                winningCells.push([nr, nc]);
            } else {
                break;
            }
        }

        // Check negative direction
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

// Prevent context menu on exit button
exitBtn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

function startExitTimer(e) {
    if (e.type === 'touchstart') e.preventDefault(); // Prevent scroll/zoom
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
    // Reset game and go to start screen
    cancelExitTimer(); // Cleanup
    gameWrapper.style.display = 'none';
    startScreen.style.display = 'flex';
    // Optional: Reset game state entirely?
    // User said "exit the game on the main menu".
    // We can leave the board as is or clear it. Let's clear it for a fresh start next time.
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.innerHTML = '';
        cell.dataset.occupied = 'false';
    });
    // Remove winning lines
    const lines = document.querySelectorAll('.winning-line');
    lines.forEach(line => line.remove());
    // Don't restart initGame here, wait for "Vs Friend" click again.
}

exitBtn.addEventListener('mousedown', startExitTimer);
exitBtn.addEventListener('touchstart', startExitTimer);

exitBtn.addEventListener('mouseup', cancelExitTimer);
exitBtn.addEventListener('mouseleave', cancelExitTimer);
exitBtn.addEventListener('touchend', cancelExitTimer);
exitBtn.addEventListener('touchcancel', cancelExitTimer);

/* Previous restartBtn logic removed */
/*
restartBtn.addEventListener('click', () => {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.innerHTML = '';
        cell.dataset.occupied = 'false';
    });
    initGame();
});
*/

// Initialize
// Initialize
// setupBoardGrid(); // Removed, handled in initGame -> renderBoard
// initGame(); // Removed, handled by start button
