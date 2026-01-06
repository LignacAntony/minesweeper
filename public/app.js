// Minesweeper Farcaster Mini App

import { sdk } from "https://esm.sh/@farcaster/frame-sdk";

// Game Configuration
const DIFFICULTIES = {
    easy: { rows: 8, cols: 8, mines: 10 },
    medium: { rows: 12, cols: 12, mines: 30 },
    hard: { rows: 16, cols: 16, mines: 60 }
};

// Game State
let gameState = {
    board: [],
    revealed: [],
    flagged: [],
    mines: [],
    rows: 8,
    cols: 8,
    mineCount: 10,
    flagCount: 0,
    isGameOver: false,
    isWin: false,
    isFirstClick: true,
    timer: 0,
    timerInterval: null,
    difficulty: 'easy',
    userFid: null,
    username: null
};

// DOM Elements
const boardEl = document.getElementById('game-board');
const minesCountEl = document.getElementById('mines-count');
const timerEl = document.getElementById('timer');
const resetBtn = document.getElementById('reset-btn');
const messageEl = document.getElementById('game-message');
const leaderboardEl = document.getElementById('leaderboard');

// Long press handling
let longPressTimer = null;
let isLongPress = false;
const LONG_PRESS_DURATION = 500;

// Initialize Farcaster SDK
async function initFarcaster() {
    try {
        const context = await sdk.context;
        
        if (context?.user) {
            gameState.userFid = context.user.fid;
            gameState.username = context.user.username || `User ${context.user.fid}`;
        }
        
        // Signal ready to Farcaster
        sdk.actions.ready();
    } catch (error) {
        console.log('Running outside Farcaster context');
        // Demo mode
        gameState.userFid = Math.floor(Math.random() * 10000);
        gameState.username = 'Demo User';
    }
}

// Initialize the game
function initGame() {
    const config = DIFFICULTIES[gameState.difficulty];
    gameState.rows = config.rows;
    gameState.cols = config.cols;
    gameState.mineCount = config.mines;
    
    // Reset state
    gameState.board = [];
    gameState.revealed = [];
    gameState.flagged = [];
    gameState.mines = [];
    gameState.flagCount = 0;
    gameState.isGameOver = false;
    gameState.isWin = false;
    gameState.isFirstClick = true;
    gameState.timer = 0;
    
    // Stop timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    // Update UI
    updateMinesCount();
    updateTimer();
    resetBtn.textContent = '😊';
    messageEl.classList.add('hidden');
    
    // Create empty board
    for (let r = 0; r < gameState.rows; r++) {
        gameState.board[r] = [];
        gameState.revealed[r] = [];
        gameState.flagged[r] = [];
        for (let c = 0; c < gameState.cols; c++) {
            gameState.board[r][c] = 0;
            gameState.revealed[r][c] = false;
            gameState.flagged[r][c] = false;
        }
    }
    
    renderBoard();
}

// Place mines (avoiding first click area)
function placeMines(firstRow, firstCol) {
    gameState.mines = [];
    let minesPlaced = 0;
    
    while (minesPlaced < gameState.mineCount) {
        const r = Math.floor(Math.random() * gameState.rows);
        const c = Math.floor(Math.random() * gameState.cols);
        
        // Avoid first click and adjacent cells
        const isNearFirst = Math.abs(r - firstRow) <= 1 && Math.abs(c - firstCol) <= 1;
        
        if (!gameState.mines.some(m => m.r === r && m.c === c) && !isNearFirst) {
            gameState.mines.push({ r, c });
            gameState.board[r][c] = -1; // -1 = mine
            minesPlaced++;
        }
    }
    
    // Calculate numbers
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (gameState.board[r][c] !== -1) {
                gameState.board[r][c] = countAdjacentMines(r, c);
            }
        }
    }
}

// Count adjacent mines
function countAdjacentMines(row, col) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < gameState.rows && c >= 0 && c < gameState.cols) {
                if (gameState.board[r][c] === -1) {
                    count++;
                }
            }
        }
    }
    return count;
}

// Render the game board
function renderBoard() {
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${gameState.cols}, 1fr)`;
    
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            // Touch events for mobile
            cell.addEventListener('touchstart', handleTouchStart);
            cell.addEventListener('touchend', handleTouchEnd);
            cell.addEventListener('touchmove', handleTouchMove);
            
            // Mouse events for desktop
            cell.addEventListener('click', handleClick);
            cell.addEventListener('contextmenu', handleRightClick);
            
            boardEl.appendChild(cell);
        }
    }
}

// Update cell display
function updateCell(row, col) {
    const cell = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    
    cell.className = 'cell';
    cell.textContent = '';
    cell.removeAttribute('data-number');
    
    if (gameState.flagged[row][col]) {
        cell.classList.add('flagged');
        cell.textContent = '🚩';
    } else if (gameState.revealed[row][col]) {
        cell.classList.add('revealed');
        const value = gameState.board[row][col];
        
        if (value === -1) {
            cell.classList.add('mine');
            cell.textContent = '💣';
        } else if (value > 0) {
            cell.textContent = value;
            cell.dataset.number = value;
        }
    }
}

// Handle touch start (for long press detection)
function handleTouchStart(e) {
    if (gameState.isGameOver) return;
    
    isLongPress = false;
    longPressTimer = setTimeout(() => {
        isLongPress = true;
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        toggleFlag(row, col);
        
        // Vibrate for feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }, LONG_PRESS_DURATION);
}

// Handle touch end
function handleTouchEnd(e) {
    if (gameState.isGameOver) return;
    
    clearTimeout(longPressTimer);
    
    if (!isLongPress) {
        e.preventDefault();
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        revealCell(row, col);
    }
    
    isLongPress = false;
}

// Handle touch move (cancel long press)
function handleTouchMove() {
    clearTimeout(longPressTimer);
    isLongPress = false;
}

// Handle click
function handleClick(e) {
    if (gameState.isGameOver) return;
    
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    revealCell(row, col);
}

// Handle right click (flag)
function handleRightClick(e) {
    e.preventDefault();
    if (gameState.isGameOver) return;
    
    const row = parseInt(e.target.dataset.row);
    const col = parseInt(e.target.dataset.col);
    toggleFlag(row, col);
}

// Reveal a cell
function revealCell(row, col) {
    if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) return;
    if (gameState.revealed[row][col] || gameState.flagged[row][col]) return;
    
    // First click - place mines
    if (gameState.isFirstClick) {
        gameState.isFirstClick = false;
        placeMines(row, col);
        startTimer();
    }
    
    gameState.revealed[row][col] = true;
    
    // Hit a mine
    if (gameState.board[row][col] === -1) {
        gameOver(false, row, col);
        return;
    }
    
    updateCell(row, col);
    
    // Auto-reveal adjacent cells if empty
    if (gameState.board[row][col] === 0) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                revealCell(row + dr, col + dc);
            }
        }
    }
    
    // Check win
    checkWin();
}

// Toggle flag on a cell
function toggleFlag(row, col) {
    if (gameState.revealed[row][col]) return;
    
    gameState.flagged[row][col] = !gameState.flagged[row][col];
    gameState.flagCount += gameState.flagged[row][col] ? 1 : -1;
    
    updateCell(row, col);
    updateMinesCount();
}

// Check for win condition
function checkWin() {
    let revealedCount = 0;
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (gameState.revealed[r][c]) {
                revealedCount++;
            }
        }
    }
    
    const totalCells = gameState.rows * gameState.cols;
    if (revealedCount === totalCells - gameState.mineCount) {
        gameOver(true);
    }
}

// Game over
async function gameOver(win, hitRow = -1, hitCol = -1) {
    gameState.isGameOver = true;
    gameState.isWin = win;
    
    // Stop timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    // Reveal all mines
    for (const mine of gameState.mines) {
        gameState.revealed[mine.r][mine.c] = true;
        updateCell(mine.r, mine.c);
        
        if (!win && mine.r === hitRow && mine.c === hitCol) {
            const cell = boardEl.querySelector(`[data-row="${mine.r}"][data-col="${mine.c}"]`);
            if (cell) {
                cell.classList.add('mine-hit');
            }
        }
    }
    
    // Update reset button
    resetBtn.textContent = win ? '😎' : '😵';
    
    // Show message
    messageEl.classList.remove('hidden', 'win', 'lose');
    messageEl.classList.add(win ? 'win' : 'lose');
    messageEl.textContent = win 
        ? `🎉 You won in ${gameState.timer}s!`
        : '💥 Boom! Game over';
    
    // Save score if won
    if (win && gameState.userFid) {
        await saveScore();
    }
    
    // Refresh leaderboard
    loadLeaderboard();
}

// Timer functions
function startTimer() {
    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        updateTimer();
    }, 1000);
}

function updateTimer() {
    timerEl.textContent = String(gameState.timer).padStart(3, '0');
}

function updateMinesCount() {
    const remaining = gameState.mineCount - gameState.flagCount;
    minesCountEl.textContent = remaining;
}

// Save score to server
async function saveScore() {
    try {
        const response = await fetch('/api/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userFid: gameState.userFid,
                username: gameState.username,
                difficulty: gameState.difficulty,
                time: gameState.timer
            })
        });
        
        if (!response.ok) {
            console.error('Failed to save score');
        }
    } catch (error) {
        console.error('Error saving score:', error);
    }
}

// Load leaderboard
async function loadLeaderboard(difficulty = null) {
    const diff = difficulty || gameState.difficulty;
    
    try {
        const response = await fetch(`/api/scores/${diff}`);
        const scores = await response.json();
        
        if (scores.length === 0) {
            leaderboardEl.innerHTML = '<p class="empty">No scores yet</p>';
            return;
        }
        
        leaderboardEl.innerHTML = scores.map((score, index) => {
            const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`;
            
            return `
                <div class="leaderboard-entry">
                    <span class="rank ${rankClass}">${rankEmoji}</span>
                    <div class="player">
                        <div class="player-name">${escapeHtml(score.username)}</div>
                        <div class="player-fid">FID: ${score.user_fid}</div>
                    </div>
                    <span class="time">${score.time}s</span>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        leaderboardEl.innerHTML = '<p class="empty">Loading error</p>';
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Tip configuration - REPLACE WITH YOUR ADDRESS
const TIP_CONFIG = {
    recipientAddress: '0x93dc5cF29207F38c5c245A94d756Bbd25beF0334',
    chainId: 8453 // Base mainnet
};

// Send tip via Farcaster SDK
async function sendTip(amountEth) {
    try {
        const amountWei = BigInt(Math.floor(amountEth * 1e18)).toString(16);
        
        const result = await sdk.actions.sendTransaction({
            chainId: `eip155:${TIP_CONFIG.chainId}`,
            method: 'eth_sendTransaction',
            params: {
                to: TIP_CONFIG.recipientAddress,
                value: `0x${amountWei}`,
            }
        });
        
        if (result?.transactionHash) {
            alert(`🎉 Thank you for your tip! Tx: ${result.transactionHash.slice(0, 10)}...`);
            return true;
        }
    } catch (error) {
        console.error('Tip error:', error);
        if (error.message?.includes('rejected')) {
            alert('Transaction cancelled');
        } else {
            alert('Could not send tip. Make sure you have ETH on Base network.');
        }
    }
    return false;
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    await initFarcaster();
    initGame();
    loadLeaderboard();
    
    // Reset button
    resetBtn.addEventListener('click', () => {
        initGame();
    });
    
    // Difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameState.difficulty = btn.dataset.difficulty;
            initGame();
            loadLeaderboard();
        });
    });
    
    // Leaderboard tabs
    document.querySelectorAll('.lb-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadLeaderboard(tab.dataset.difficulty);
        });
    });
    
    // Tip buttons
    document.querySelectorAll('.tip-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const amount = parseFloat(btn.dataset.amount);
            btn.classList.add('loading');
            btn.textContent = 'Sending...';
            
            await sendTip(amount);
            
            btn.classList.remove('loading');
            // Restore original text
            if (amount === 0.001) btn.textContent = '☕ 0.001 ETH';
            else if (amount === 0.005) btn.textContent = '🍕 0.005 ETH';
            else if (amount === 0.01) btn.textContent = '🎮 0.01 ETH';
        });
    });
});

// Prevent context menu on game board
boardEl.addEventListener('contextmenu', e => e.preventDefault());
