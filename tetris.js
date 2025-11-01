// Constantes del juego
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    '#0038A8',  // Azul Allianz
    '#00BCF2',  // Azul claro Allianz
    '#5F6A72',  // Gris Allianz
    '#003875',  // Azul oscuro
    '#0066CC',  // Azul medio
    '#FFFFFF',  // Blanco
    '#B0B7BC'   // Gris claro
];

// Piezas de Tetris
const PIECES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1]], // T
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]], // Z
    [[1, 0, 0], [1, 1, 1]], // L
    [[0, 0, 1], [1, 1, 1]]  // J
];

// Variables del juego
let canvas = document.getElementById('game-canvas');
let ctx = canvas.getContext('2d');
let nextCanvas = document.getElementById('next-canvas');
let nextCtx = nextCanvas.getContext('2d');

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
let score = 0;
let level = 1;
let lines = 0;
let gameOver = false;
let isPaused = false;
let dropInterval = 1000;
let lastDropTime = 0;

let currentPiece = null;
let nextPiece = null;

// Clase para las piezas
class Piece {
    constructor(shape, color) {
        this.shape = shape;
        this.color = color;
        this.x = Math.floor(COLS / 2) - Math.floor(shape[0].length / 2);
        this.y = 0;
    }

    draw(context, offsetX = 0, offsetY = 0) {
        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const drawX = (this.x + x + offsetX) * BLOCK_SIZE;
                    const drawY = (this.y + y + offsetY) * BLOCK_SIZE;
                    
                    context.fillStyle = this.color;
                    context.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
                    
                    context.strokeStyle = '#ffffff';
                    context.lineWidth = 2;
                    context.strokeRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
                    
                    // Efecto de brillo
                    context.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    context.fillRect(drawX, drawY, BLOCK_SIZE / 2, BLOCK_SIZE / 2);
                }
            });
        });
    }

    rotate() {
        const newShape = this.shape[0].map((_, i) =>
            this.shape.map(row => row[i]).reverse()
        );
        
        const previousShape = this.shape;
        this.shape = newShape;
        
        if (this.collides()) {
            this.shape = previousShape;
        }
    }

    move(dir) {
        this.x += dir;
        if (this.collides()) {
            this.x -= dir;
            return false;
        }
        return true;
    }

    drop() {
        this.y++;
        if (this.collides()) {
            this.y--;
            return false;
        }
        return true;
    }

    hardDrop() {
        while (this.drop()) {}
    }

    collides() {
        return this.shape.some((row, dy) =>
            row.some((value, dx) => {
                if (value) {
                    const newX = this.x + dx;
                    const newY = this.y + dy;
                    return (
                        newX < 0 ||
                        newX >= COLS ||
                        newY >= ROWS ||
                        (newY >= 0 && board[newY][newX])
                    );
                }
                return false;
            })
        );
    }
}

// Crear nueva pieza aleatoria
function createPiece() {
    const pieceIndex = Math.floor(Math.random() * PIECES.length);
    const colorIndex = Math.floor(Math.random() * COLORS.length);
    return new Piece(PIECES[pieceIndex], COLORS[colorIndex]);
}

// Dibujar el tablero
function drawBoard() {
    ctx.fillStyle = '#001a4d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                ctx.fillStyle = value;
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                
                // Efecto de brillo
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE / 2, BLOCK_SIZE / 2);
            }
        });
    });
    
    // Dibujar líneas de cuadrícula
    ctx.strokeStyle = 'rgba(0, 188, 242, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(canvas.width, i * BLOCK_SIZE);
        ctx.stroke();
    }
}

// Dibujar la siguiente pieza
function drawNextPiece() {
    nextCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (nextPiece) {
        const offsetX = (4 - nextPiece.shape[0].length) / 2;
        const offsetY = (4 - nextPiece.shape.length) / 2;
        
        nextPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const drawX = (x + offsetX) * BLOCK_SIZE;
                    const drawY = (y + offsetY) * BLOCK_SIZE;
                    
                    nextCtx.fillStyle = nextPiece.color;
                    nextCtx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
                    
                    nextCtx.strokeStyle = '#ffffff';
                    nextCtx.lineWidth = 2;
                    nextCtx.strokeRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
                    
                    nextCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    nextCtx.fillRect(drawX, drawY, BLOCK_SIZE / 2, BLOCK_SIZE / 2);
                }
            });
        });
    }
}

// Fijar la pieza en el tablero
function lockPiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                const boardY = currentPiece.y + y;
                const boardX = currentPiece.x + x;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.color;
                }
            }
        });
    });
    
    clearLines();
    currentPiece = nextPiece;
    nextPiece = createPiece();
    
    if (currentPiece.collides()) {
        endGame();
    }
}

// Limpiar líneas completas
function clearLines() {
    let linesCleared = 0;
    
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++;
        }
    }
    
    if (linesCleared > 0) {
        lines += linesCleared;
        score += linesCleared * 100 * level;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        updateScore();
    }
}

// Actualizar puntuación
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

// Finalizar juego
function endGame() {
    gameOver = true;
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.remove('hidden');
}

// Reiniciar juego
function restartGame() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0;
    level = 1;
    lines = 0;
    gameOver = false;
    isPaused = false;
    dropInterval = 1000;
    currentPiece = createPiece();
    nextPiece = createPiece();
    document.getElementById('game-over').classList.add('hidden');
    updateScore();
    lastDropTime = Date.now();
    gameLoop();
}

// Bucle principal del juego
function gameLoop() {
    if (gameOver) return;
    
    if (!isPaused) {
        const now = Date.now();
        const deltaTime = now - lastDropTime;
        
        if (deltaTime > dropInterval) {
            if (!currentPiece.drop()) {
                lockPiece();
            }
            lastDropTime = now;
        }
        
        drawBoard();
        if (currentPiece) {
            currentPiece.draw(ctx);
        }
        drawNextPiece();
    }
    
    requestAnimationFrame(gameLoop);
}

// Controles del teclado
document.addEventListener('keydown', (e) => {
    if (gameOver) return;
    
    if (e.key === 'p' || e.key === 'P') {
        isPaused = !isPaused;
        if (!isPaused) {
            lastDropTime = Date.now();
        }
        return;
    }
    
    if (isPaused) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            currentPiece.move(-1);
            break;
        case 'ArrowRight':
            currentPiece.move(1);
            break;
        case 'ArrowDown':
            if (!currentPiece.drop()) {
                lockPiece();
            }
            lastDropTime = Date.now();
            break;
        case 'ArrowUp':
            currentPiece.rotate();
            break;
        case ' ':
            currentPiece.hardDrop();
            lockPiece();
            break;
    }
});

// Botón de reinicio
document.getElementById('restart-btn').addEventListener('click', restartGame);

// Iniciar el juego
currentPiece = createPiece();
nextPiece = createPiece();
updateScore();
lastDropTime = Date.now();
gameLoop();