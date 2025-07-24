const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let score = 0;
let round = 1;
let isZoomed = false;
let timer = 60;
let gameOver = false;
let mouseX = 0;
let mouseY = 0;

// Image assets
const zombieImage = new Image();
zombieImage.src = 'assets/zombie.png'; // Placeholder path

const gunImage = new Image();
gunImage.src = 'assets/gun.png'; // Placeholder path

let target = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    dx: (Math.random() - 0.5) * 4,
    dy: (Math.random() - 0.5) * 4
};

function updateTarget() {
    target.x += target.dx;
    target.y += target.dy;

    // Wall collision
    if (target.x + target.radius > canvas.width || target.x - target.radius < 0) {
        target.dx *= -1;
    }
    if (target.y + target.radius > canvas.height || target.y - target.radius < 0) {
        target.dy *= -1;
    }
}

function drawTarget() {
    const size = target.radius * 2;
    ctx.drawImage(zombieImage, target.x - target.radius, target.y - target.radius, size, size);
}

function drawGun() {
    const gunWidth = 200;
    const gunHeight = 150;
    // Gun position follows mouse slightly, but stays at the bottom right
    const gunX = canvas.width - gunWidth + (mouseX / canvas.width) * 20;
    const gunY = canvas.height - gunHeight + (mouseY / canvas.height) * 20;
    ctx.drawImage(gunImage, gunX, gunY, gunWidth, gunHeight);
}

function drawCrosshair() {
    if (!isZoomed) return;
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mouseX - 10, mouseY);
    ctx.lineTo(mouseX + 10, mouseY);
    ctx.moveTo(mouseX, mouseY - 10);
    ctx.lineTo(mouseX, mouseY + 10);
    ctx.stroke();
}

function showGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 100);

    ctx.font = '30px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);

    // This is a placeholder for the leaderboard
    ctx.font = '20px Arial';
    ctx.fillText('Leaderboard:', canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillText('1. Player1 - 1000', canvas.width / 2, canvas.height / 2 + 80);
    ctx.fillText('2. Player2 - 800', canvas.width / 2, canvas.height / 2 + 110);
}


function gameLoop(timestamp) {
    if (gameOver) {
        showGameOver();
        return;
    }

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isZoomed) {
        const zoomLevel = 2;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(zoomLevel, zoomLevel);
        ctx.translate(-mouseX, -mouseY);
    }

    updateTarget();
    drawTarget();
    ctx.restore();

    drawUI();
    drawGun();
    drawCrosshair();

    requestAnimationFrame(gameLoop);
}

function drawUI() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Time: ${Math.max(0, timer).toFixed(2)}`, 10, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`Round: ${round}`, canvas.width - 20, 30);
    ctx.fillText(`Score: ${score}`, canvas.width - 20, 60);
    ctx.textAlign = 'left'; // Reset alignment
}

// Timer logic
let lastTime = 0;
function updateTimer(timestamp) {
    if (!lastTime) {
        lastTime = timestamp;
    }
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (timer > 0) {
        timer -= deltaTime;
    } else if (!gameOver) {
        gameOver = true;
    }
    requestAnimationFrame(updateTimer);
}


// Mouse event listeners
canvas.addEventListener('mousemove', (e) => {
    mouseX = e.offsetX;
    mouseY = e.offsetY;
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (!gameOver) {
        isZoomed = !isZoomed;
    }
});

function resetTarget() {
    target.x = Math.random() * (canvas.width - target.radius * 2) + target.radius;
    target.y = Math.random() * (canvas.height - target.radius * 2) + target.radius;
    target.radius = Math.max(5, 20 - round); // Decrease size with round, with a minimum size
    target.dx = (Math.random() - 0.5) * (4 + round * 0.5); // Increase speed with round
    target.dy = (Math.random() - 0.5) * (4 + round * 0.5);
}

canvas.addEventListener('mousedown', (e) => {
    if (gameOver) return;
    if (e.button === 0) { // Left click
        let fireX = e.offsetX;
        let fireY = e.offsetY;

        // Transform click coordinates to zoomed world coordinates
        if (isZoomed) {
            fireX = (fireX - canvas.width / 2) / 2 + mouseX;
            fireY = (fireY - canvas.height / 2) / 2 + mouseY;
        }

        const dist = Math.hypot(fireX - target.x, fireY - target.y);
        const hit = isZoomed ? dist < target.radius : dist < target.radius * 1.5 && Math.random() < 0.3;


        if (hit) {
            score += isZoomed ? 10 : 5; // More points for zoomed shots
            if (Math.floor(score / 100) + 1 > round && round < 10) {
                round = Math.floor(score / 100) + 1;
            }
            resetTarget();
        } else if (!isZoomed) {
            score = Math.max(0, score - 2); // Penalty for missing without zoom
        }


        if (isZoomed) {
            isZoomed = false;
        }
    }
});

// Start the game loop
requestAnimationFrame(gameLoop);
requestAnimationFrame(updateTimer);
