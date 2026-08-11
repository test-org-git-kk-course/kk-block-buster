// ===== GAME STATE =====
const gameState = {
    currentLevel: 1,
    score: 0,
    highScore: localStorage.getItem('blockBusterHighScore') || 0,
    lives: 3,
    isPaused: false,
    isGameRunning: false,
    balls: [],
    particles: [],
    bullets: [],
    activePowerups: [],
    powerups: {
        multiBall: { active: false, activationTime: 0 },
        megaPaddle: { active: false, activationTime: 0 },
        bulletMode: { active: false, activationTime: 0 }
    },
    bulletFireCounter: 0
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let paddle = {
    width: 100,
    height: 15,
    x: (canvas.width - 100) / 2,
    y: canvas.height - 25,
    speed: 8,
    baseWidth: 100
};

let bricks = [];

let keyboard = {
    left: false,
    right: false
};

// ===== LEVEL CONFIGURATIONS =====
// SUPER SIMPLE - SAME SPEED FOR ALL LEVELS
const BALL_DX = 3;
const BALL_DY = 3;

const levelConfigs = {
    1: {
        cols: 8,
        rows: 5,
        brickWidth: 80,
        brickHeight: 20,
        colors: ['#00BD8D', '#fc6e22', '#c24cf6', '#00d4ff', '#87d20a']
    },
    2: {
        cols: 10,
        rows: 8,
        brickWidth: 60,
        brickHeight: 15,
        colors: ['#d23351', '#a9dd0e', '#84d4f1', '#ffffff', '#e8e4af', '#c4d7fa', '#3eeb70']
    }
};

// ===== RANDOM LEVEL GENERATION =====
function generateRandomLevel() {
    const patterns = [
        'grid',
        'pyramid',
        'circles',
        'corners',
        'checkerboard',
        'wave',
        'spiral',
        'random'
    ];

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    generateBricksPattern(pattern);
}

function generateBricksPattern(pattern) {
    bricks = [];
    const colors = ['#00BD8D', '#fc6e22', '#c24cf6', '#00d4ff', '#87d20a', '#ff6b6b', '#4ecdc4', '#ffd93d'];

    switch(pattern) {
        case 'grid':
            generateGrid(8, 5, colors);
            break;
        case 'pyramid':
            generatePyramid(colors);
            break;
        case 'circles':
            generateCircles(colors);
            break;
        case 'corners':
            generateCorners(colors);
            break;
        case 'checkerboard':
            generateCheckerboard(colors);
            break;
        case 'wave':
            generateWave(colors);
            break;
        case 'spiral':
            generateSpiral(colors);
            break;
        case 'random':
            generateRandom(colors);
            break;
    }
}

function generateGrid(cols, rows, colors) {
    const padding = 8;
    const offsetTop = 60;
    const brickWidth = Math.min(60, (canvas.width - 60) / cols);
    const brickHeight = 18;
    const offsetLeft = (canvas.width - (cols * brickWidth + (cols - 1) * padding)) / 2;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            bricks.push({
                x: col * (brickWidth + padding) + offsetLeft,
                y: row * (brickHeight + padding) + offsetTop,
                width: brickWidth,
                height: brickHeight,
                status: 1,
                color: colors[row % colors.length],
                shape: 'rect'
            });
        }
    }
}

function generatePyramid(colors) {
    const maxCols = 10;
    const padding = 5;
    const offsetTop = 80;
    const brickWidth = 50;
    const brickHeight = 15;

    let row = 0;
    for (let cols = maxCols; cols > 0; cols--) {
        const offsetLeft = (canvas.width - (cols * (brickWidth + padding))) / 2;
        for (let col = 0; col < cols; col++) {
            bricks.push({
                x: col * (brickWidth + padding) + offsetLeft,
                y: row * (brickHeight + padding) + offsetTop,
                width: brickWidth,
                height: brickHeight,
                status: 1,
                color: colors[row % colors.length],
                shape: 'rect'
            });
        }
        row++;
    }
}

function generateCircles(colors) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 3;
    const radius = 150;
    const brickCount = 16;
    const brickRadius = 20;

    for (let i = 0; i < brickCount; i++) {
        const angle = (i / brickCount) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius - brickRadius;
        const y = centerY + Math.sin(angle) * radius - brickRadius;

        bricks.push({
            x: x,
            y: y,
            width: brickRadius * 2,
            height: brickRadius * 2,
            status: 1,
            color: colors[i % colors.length],
            shape: 'circle',
            radius: brickRadius
        });
    }
}

function generateCorners(colors) {
    const brickWidth = 40;
    const brickHeight = 40;
    const padding = 5;

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            bricks.push({
                x: 30 + i * (brickWidth + padding),
                y: 60 + j * (brickHeight + padding),
                width: brickWidth,
                height: brickHeight,
                status: 1,
                color: colors[0],
                shape: 'rect'
            });
        }
    }

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            bricks.push({
                x: canvas.width - 30 - (i + 1) * (brickWidth + padding),
                y: 60 + j * (brickHeight + padding),
                width: brickWidth,
                height: brickHeight,
                status: 1,
                color: colors[1],
                shape: 'rect'
            });
        }
    }

    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 2; j++) {
            bricks.push({
                x: (canvas.width - 6 * (brickWidth + padding)) / 2 + i * (brickWidth + padding),
                y: canvas.height / 2 + j * (brickHeight + padding),
                width: brickWidth,
                height: brickHeight,
                status: 1,
                color: colors[2],
                shape: 'rect'
            });
        }
    }
}

function generateCheckerboard(colors) {
    const cols = 8;
    const rows = 5;
    const padding = 6;
    const brickWidth = 70;
    const brickHeight = 20;
    const offsetLeft = (canvas.width - (cols * brickWidth + (cols - 1) * padding)) / 2;
    const offsetTop = 60;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if ((row + col) % 2 === 0) {
                bricks.push({
                    x: col * (brickWidth + padding) + offsetLeft,
                    y: row * (brickHeight + padding) + offsetTop,
                    width: brickWidth,
                    height: brickHeight,
                    status: 1,
                    color: colors[row % colors.length],
                    shape: 'rect'
                });
            }
        }
    }
}

function generateWave(colors) {
    const cols = 10;
    const rows = 4;
    const padding = 5;
    const brickWidth = 60;
    const brickHeight = 15;
    const offsetLeft = (canvas.width - (cols * brickWidth + (cols - 1) * padding)) / 2;
    const offsetTop = 70;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const waveOffset = Math.sin(col * 0.5) * 30;
            bricks.push({
                x: col * (brickWidth + padding) + offsetLeft,
                y: row * (brickHeight + padding) + offsetTop + waveOffset,
                width: brickWidth,
                height: brickHeight,
                status: 1,
                color: colors[(row + col) % colors.length],
                shape: 'rect'
            });
        }
    }
}

function generateSpiral(colors) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2.5;
    const brickSize = 30;
    const brickCount = 40;

    for (let i = 0; i < brickCount; i++) {
        const angle = (i / brickCount) * Math.PI * 8;
        const radius = 30 + i * 5;
        const x = centerX + Math.cos(angle) * radius - brickSize / 2;
        const y = centerY + Math.sin(angle) * radius - brickSize / 2;

        if (x > 0 && x < canvas.width && y > 0 && y < canvas.height / 2) {
            bricks.push({
                x: x,
                y: y,
                width: brickSize,
                height: brickSize,
                status: 1,
                color: colors[i % colors.length],
                shape: 'rect'
            });
        }
    }
}

function generateRandom(colors) {
    const brickCount = 30 + Math.floor(Math.random() * 20);
    
    for (let i = 0; i < brickCount; i++) {
        const width = 40 + Math.random() * 40;
        const height = 15 + Math.random() * 20;
        const x = Math.random() * (canvas.width - width);
        const y = 60 + Math.random() * (canvas.height / 2);

        let overlaps = false;
        for (let brick of bricks) {
            if (!(x + width < brick.x || x > brick.x + brick.width ||
                  y + height < brick.y || y > brick.y + brick.height)) {
                overlaps = true;
                break;
            }
        }

        if (!overlaps) {
            bricks.push({
                x: x,
                y: y,
                width: width,
                height: height,
                status: 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: 'rect'
            });
        }
    }
}

// ===== POWER-UP SYSTEM - FIXED! =====
function createPowerUp(x, y) {
    const powerups = [
        { type: 'multiBall', probability: 0.3 },
        { type: 'megaPaddle', probability: 0.3 },
        { type: 'bulletMode', probability: 0.4 }
    ];

    const random = Math.random();
    let cumulative = 0;

    for (let powerup of powerups) {
        cumulative += powerup.probability;
        if (random < cumulative) {
            return {
                x: x,
                y: y,
                type: powerup.type,
                vx: 0,
                vy: 2,
                width: 25,
                height: 25,
                active: true
            };
        }
    }
}

function activatePowerUp(type) {
    const currentTime = Date.now();
    
    switch(type) {
        case 'multiBall':
            if (gameState.balls.length < 5) {
                gameState.balls.forEach(ball => {
                    gameState.balls.push({...ball});
                });
            }
            gameState.powerups.multiBall.active = true;
            gameState.powerups.multiBall.activationTime = currentTime;
            break;

        case 'megaPaddle':
            paddle.width = 200;
            gameState.powerups.megaPaddle.active = true;
            gameState.powerups.megaPaddle.activationTime = currentTime;
            break;

        case 'bulletMode':
            gameState.powerups.bulletMode.active = true;
            gameState.powerups.bulletMode.activationTime = currentTime;
            gameState.bulletFireCounter = 0;  // RESET COUNTER FOR IMMEDIATE FIRE!
            break;
    }
}

function updatePowerUpDurations() {
    const currentTime = Date.now();
    const POWER_UP_DURATION = 10000; // 10 seconds in milliseconds

    // Multi-Ball
    if (gameState.powerups.multiBall.active) {
        if (currentTime - gameState.powerups.multiBall.activationTime > POWER_UP_DURATION) {
            deactivatePowerUp('multiBall');
        }
    }

    // Mega Paddle
    if (gameState.powerups.megaPaddle.active) {
        if (currentTime - gameState.powerups.megaPaddle.activationTime > POWER_UP_DURATION) {
            deactivatePowerUp('megaPaddle');
        }
    }

    // Bullet Mode
    if (gameState.powerups.bulletMode.active) {
        if (currentTime - gameState.powerups.bulletMode.activationTime > POWER_UP_DURATION) {
            deactivatePowerUp('bulletMode');
        }
    }
}

function deactivatePowerUp(type) {
    gameState.powerups[type].active = false;
    gameState.powerups[type].activationTime = 0;

    if (type === 'megaPaddle') {
        paddle.width = paddle.baseWidth;
    }
}

function getRemainingPowerUpTime(type) {
    if (!gameState.powerups[type].active) return 0;
    
    const currentTime = Date.now();
    const elapsed = currentTime - gameState.powerups[type].activationTime;
    const remaining = Math.max(0, 10 - Math.floor(elapsed / 1000));
    return remaining;
}

// ===== POWER-UP DISPLAY VARIABLES =====
let lastPowerUpDisplay = '';
let lastLevelDisplay = '';

function drawPowerUpIndicators() {
    const container = document.getElementById('powerupsContainer');
    
    let html = '';
    const powerupNames = {
        'multiBall': '⚫ MULTI-BALL',
        'megaPaddle': '🛡️ MEGA PADDLE',
        'bulletMode': '🔫 BULLETS'
    };

    for (let key in gameState.powerups) {
        if (gameState.powerups[key].active) {
            const remaining = getRemainingPowerUpTime(key);
            html += `<div class="powerup-indicator active">
                <span class="powerup-icon">${key === 'multiBall' ? '⚫' : key === 'megaPaddle' ? '🛡️' : '🔫'}</span>
                <span>${powerupNames[key]}</span>
                <span class="powerup-timer">${remaining}s</span>
            </div>`;
        }
    }
    
    // Only update if content changed
    if (html !== lastPowerUpDisplay) {
        container.innerHTML = html;
        lastPowerUpDisplay = html;
    }
}

// ===== AUTO-FIRING BULLETS SYSTEM - FIXED! =====
function autoFireBullets() {
    if (gameState.powerups.bulletMode.active) {
        gameState.bulletFireCounter++;
        
        // Fire every 8 frames (more frequent - about 7 bullets per second at 60 FPS)
        if (gameState.bulletFireCounter >= 8) {
            gameState.bullets.push({
                x: paddle.x + paddle.width / 2,
                y: paddle.y - 5,
                width: 4,
                height: 15,
                vy: -12,
                active: true
            });
            gameState.bulletFireCounter = 0;
        }
    }
}

function updateBullets() {
    gameState.bullets = gameState.bullets.filter(bullet => {
        bullet.y += bullet.vy;
        return bullet.y > 0;
    });

    // Check bullet collisions
    gameState.bullets.forEach((bullet, bIdx) => {
        bricks.forEach((brick, brIdx) => {
            if (brick.status === 1) {
                if (bullet.x > brick.x && 
                    bullet.x < brick.x + brick.width &&
                    bullet.y > brick.y &&
                    bullet.y < brick.y + brick.height) {
                    
                    brick.status = 0;
                    gameState.bullets.splice(bIdx, 1);
                    gameState.score += 100;
                    createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);
                    updateUI();

                    if (bricks.every(b => b.status === 0)) {
                        endLevel(true);
                    }
                }
            }
        });
    });
}

function drawBullets() {
    gameState.bullets.forEach(bullet => {
        ctx.fillStyle = '#ffd93d';
        ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
        ctx.strokeStyle = '#ff8c00';
        ctx.lineWidth = 1;
        ctx.strokeRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
    });
}

// ===== INITIALIZATION =====
function init() {
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    gameState.balls = [{
        x: canvas.width / 2,
        y: canvas.height - 50,
        radius: 8,
        dx: BALL_DX * direction,
        dy: -BALL_DY
    }];

    paddle.x = (canvas.width - paddle.width) / 2;
    paddle.width = paddle.baseWidth;

    gameState.bullets = [];
    gameState.particles = [];
    gameState.activePowerups = [];

    gameState.powerups.multiBall.active = false;
    gameState.powerups.megaPaddle.active = false;
    gameState.powerups.bulletMode.active = false;

    generateRandomLevel();
    gameState.isPaused = false;
    gameState.isGameRunning = true;
    document.getElementById('pauseBtn').textContent = 'PAUSE';
}

// ===== RESET BALL WITHOUT RESETTING LEVEL =====
function resetBallOnly() {
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    gameState.balls = [{
        x: canvas.width / 2,
        y: canvas.height - 50,
        radius: 8,
        dx: BALL_DX * direction,
        dy: -BALL_DY
    }];
}

// ===== DRAWING FUNCTIONS =====
function drawBall(ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFBA00';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 186, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

function drawPaddle() {
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, '#00d4ff');
    gradient.addColorStop(1, '#667eea');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBricks() {
    bricks.forEach(brick => {
        if (brick.status === 1) {
            if (brick.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(brick.x + brick.radius, brick.y + brick.radius, brick.radius, 0, Math.PI * 2);
                ctx.fillStyle = brick.color;
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.stroke();
            } else {
                ctx.fillStyle = brick.color;
                ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
                
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
            }
        }
    });
}

function drawStats() {
    ctx.font = 'bold 16px Segoe UI';
    ctx.fillStyle = '#00d4ff';
    ctx.fillText(`Level: ${gameState.currentLevel}`, 15, 25);
    
    ctx.fillStyle = '#87d20a';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${gameState.score}`, canvas.width - 15, 25);
    ctx.textAlign = 'left';
}

function drawParticles() {
    gameState.particles = gameState.particles.filter(p => p.life > 0);
    
    gameState.particles.forEach(p => {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life--;
    });
    ctx.globalAlpha = 1;
}

function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        gameState.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            radius: Math.random() * 4 + 2,
            color: color,
            life: 30,
            maxLife: 30
        });
    }
}

// ===== COLLISION DETECTION =====
function collisionDetection() {
    gameState.balls.forEach(ball => {
        bricks.forEach(brick => {
            if (brick.status === 1) {
                let collision = false;

                if (brick.shape === 'circle') {
                    const dx = ball.x - (brick.x + brick.radius);
                    const dy = ball.y - (brick.y + brick.radius);
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < ball.radius + brick.radius) {
                        collision = true;
                        ball.dy = -ball.dy;
                    }
                } else {
                    if (ball.x > brick.x && 
                        ball.x < brick.x + brick.width &&
                        ball.y > brick.y &&
                        ball.y < brick.y + brick.height) {
                        collision = true;
                        ball.dy = -ball.dy;
                    }
                }

                if (collision) {
                    brick.status = 0;
                    gameState.score += 100;
                    createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);
                    updateUI();

                    // Random power-up drop
                    if (Math.random() < 0.15) {
                        const powerup = createPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
                        if (powerup) {
                            gameState.activePowerups.push(powerup);
                        }
                    }

                    if (bricks.every(b => b.status === 0)) {
                        endLevel(true);
                    }
                }
            }
        });
    });
}

function checkPaddleCollision(ball) {
    if (ball.y + ball.radius > paddle.y &&
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width) {
        
        ball.dy = -Math.abs(ball.dy);
        const hitPos = (ball.x - paddle.x) / paddle.width;
        ball.dx = (hitPos - 0.5) * 10;
    }
}

function update() {
    if (gameState.isPaused) return;

    gameState.balls.forEach(ball => {
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Wall collision
        if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
            ball.dx = -ball.dx;
            ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x));
        }

        if (ball.y - ball.radius < 0) {
            ball.dy = -ball.dy;
            ball.y = ball.radius;
        }

        // Bottom collision (lose life)
        if (ball.y - ball.radius > canvas.height) {
            gameState.balls = gameState.balls.filter(b => b !== ball);
            
            if (gameState.balls.length === 0) {
                gameState.lives--;
                updateUI();

                if (gameState.lives <= 0) {
                    endLevel(false);
                } else {
                    // CONTINUE LEVEL - DON'T RESET IT!
                    resetBallOnly();
                }
            }
        }

        collisionDetection();
        checkPaddleCollision(ball);
    });

    // Paddle movement
    if (keyboard.left && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }
    if (keyboard.right && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.speed;
    }

    // Mouse control
    document.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        if (mouseX > 0 && mouseX < canvas.width) {
            paddle.x = mouseX - paddle.width / 2;
            paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));
        }
    });

    // AUTO-FIRE BULLETS FIRST!
    autoFireBullets();
    
    // Then update bullets
    updateBullets();
    
    // Update power-ups
    updatePowerUpDurations();

    // Update active power-ups falling
    gameState.activePowerups.forEach(powerup => {
        powerup.y += powerup.vy;

        if (powerup.x > paddle.x && 
            powerup.x < paddle.x + paddle.width &&
            powerup.y > paddle.y &&
            powerup.y < paddle.y + paddle.height) {
            
            activatePowerUp(powerup.type);
            powerup.active = false;
        }
    });

    gameState.activePowerups = gameState.activePowerups.filter(p => p.active && p.y < canvas.height);
}

function draw() {
    ctx.fillStyle = 'rgba(15, 15, 30, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawBricks();
    gameState.balls.forEach(ball => drawBall(ball));
    drawBullets();
    drawPaddle();
    drawStats();
    drawParticles();

    // Draw power-ups
    gameState.activePowerups.forEach(powerup => {
        ctx.fillStyle = powerup.type === 'multiBall' ? '#ff6b6b' : 
                       powerup.type === 'megaPaddle' ? '#4ecdc4' : '#ffd93d';
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y, powerup.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icon = powerup.type === 'multiBall' ? '⚫' : 
                    powerup.type === 'megaPaddle' ? '🛡️' : '🔫';
        ctx.fillText(icon, powerup.x, powerup.y);
    });

    update();
    requestAnimationFrame(draw);
}

function endLevel(completed) {
    gameState.isGameRunning = false;

    if (completed) {
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('blockBusterHighScore', gameState.highScore);
        }
        showGameOver(true);
    } else {
        showGameOver(false);
    }
}

// ===== UI FUNCTIONS =====
function updateUI() {
    document.getElementById('scoreDisplay').textContent = gameState.score;
    document.getElementById('highScoreDisplay').textContent = gameState.highScore;
    document.getElementById('livesDisplay').textContent = gameState.lives;
    document.getElementById('bricksDisplay').textContent = bricks.filter(b => b.status === 0).length;
    document.getElementById('ballsDisplay').textContent = gameState.balls.length;
    
    // Update level badge only if level changed
    const currentLevelText = `LEVEL ${gameState.currentLevel}`;
    if (currentLevelText !== lastLevelDisplay) {
        document.getElementById('levelBadge').textContent = currentLevelText;
        lastLevelDisplay = currentLevelText;
    }
    
    drawPowerUpIndicators();
}

function showGameOver(levelCompleted) {
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('gameOverScreen').classList.add('active');

    const titleEl = document.getElementById('levelCompleteTitle');
    const nextBtn = document.getElementById('nextBtn');

    if (levelCompleted) {
        titleEl.textContent = '✨ Level Complete! ✨';
        nextBtn.style.display = 'inline-block';
    } else {
        titleEl.textContent = '💀 Level Failed';
        nextBtn.style.display = 'none';
    }

    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalLevel').textContent = gameState.currentLevel;
    document.getElementById('finalHighScore').textContent = gameState.highScore;
}

function startGame() {
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.activePowerups = [];
    gameState.highScore = localStorage.getItem('blockBusterHighScore') || 0;

    document.getElementById('welcomeScreen').classList.remove('active');
    document.getElementById('gameOverScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');

    document.getElementById('levelBadge').textContent = 'LEVEL 1';
    updateUI();
    init();
    draw();
}

function nextLevel() {
    gameState.currentLevel++;
    gameState.lives = 3;
    gameState.activePowerups = [];

    document.getElementById('gameOverScreen').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');

    document.getElementById('levelBadge').textContent = `LEVEL ${gameState.currentLevel}`;
    updateUI();
    init();
    draw();
}

function goToMenu() {
    gameState.isGameRunning = false;
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('gameOverScreen').classList.remove('active');
    document.getElementById('welcomeScreen').classList.add('active');

    document.getElementById('welcomeHighScore').textContent = gameState.highScore;
}

function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    document.getElementById('pauseBtn').textContent = gameState.isPaused ? 'RESUME' : 'PAUSE';
}

function resetHighScore() {
    if (confirm('Are you sure you want to reset the high score?')) {
        gameState.highScore = 0;
        localStorage.removeItem('blockBusterHighScore');
        document.getElementById('welcomeHighScore').textContent = '0';
    }
}

// ===== KEYBOARD CONTROLS =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keyboard.left = true;
    if (e.key === 'ArrowRight') keyboard.right = true;
    if (e.key === ' ') {
        e.preventDefault();
        togglePause();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keyboard.left = false;
    if (e.key === 'ArrowRight') keyboard.right = false;
});

// ===== INITIAL SETUP =====
document.getElementById('welcomeHighScore').textContent = gameState.highScore;
