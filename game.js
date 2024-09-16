const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameButton = document.getElementById('game-button');

let player;
let circles = [];
let bullets = [];
let gameLoop;
let gameOver = false;
let lastShotTime = 0;
let lastSpecialShotTime = 0;
let score = 0;

const shootCooldown = 2500; // 2.5 seconds in milliseconds
const specialShootCooldown = 120000; // 120 seconds in milliseconds

class Player {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.closePath();
    }
}

class Circle {
    constructor(x, y, radius, speed) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = speed;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.closePath();
    }

    move() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
    }
}

class Bullet {
    constructor(x, y, target, isSpecial = false) {
        this.x = x;
        this.y = y;
        this.radius = isSpecial ? 20 : 5;
        this.speed = isSpecial ? 8 : 5;
        this.target = target;
        this.isSpecial = isSpecial;
        this.hitCount = 0;  // New property to track hit count
        this.maxHits = isSpecial ? 5 : 1;  // Special bullets can hit up to 5 enemies
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isSpecial ? 'purple' : 'yellow';
        ctx.fill();
        ctx.closePath();
    }

    move() {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
    }

    isOutOfBounds() {
        return this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height;
    }

    drawTrail() {
        if (this.isSpecial) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            const trailLength = 30;
            const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            ctx.lineTo(
                this.x - Math.cos(angle) * trailLength,
                this.y - Math.sin(angle) * trailLength
            );
            ctx.strokeStyle = 'rgba(128, 0, 128, 0.5)';  // Semi-transparent purple
            ctx.lineWidth = this.radius * 2;
            ctx.stroke();
            ctx.closePath();
        }
    }
}

function init() {
    canvas.style.display = 'block';
    gameButton.style.display = 'none';
    gameOver = false;
    player = new Player(canvas.width / 2, canvas.height / 2, 20);
    circles = [];
    bullets = [];
    score = 0;
    lastShotTime = 0;
    lastSpecialShotTime = 0;
    for (let i = 0; i < 5; i++) {
        spawnCircle();
    }
    gameLoop = setInterval(update, 1000 / 60); // 60 FPS
}

function spawnCircle() {
    const radius = 10;
    let x, y;
    do {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
    } while (Math.sqrt((x - player.x) ** 2 + (y - player.y) ** 2) < 100);
    circles.push(new Circle(x, y, radius, 2));
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    player.draw();

    circles.forEach((circle, index) => {
        circle.move();
        circle.draw();
        const dx = player.x - circle.x;
        const dy = player.y - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < player.radius + circle.radius) {
            gameOver = true;
            clearInterval(gameLoop);
            showGameOver();
        }
    });

    bullets = bullets.filter(bullet => {
        bullet.move();
        bullet.drawTrail();  // Draw the trail before the bullet
        bullet.draw();
        let hitEnemy = false;

        circles = circles.filter(circle => {
            const dx = bullet.x - circle.x;
            const dy = bullet.y - circle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < bullet.radius + circle.radius) {
                hitEnemy = true;
                score += 10;
                bullet.hitCount++;

                // Only remove the bullet if it's not special or if it has reached its max hits
                if (!bullet.isSpecial || bullet.hitCount >= bullet.maxHits) {
                    return false;
                }
            }
            return true;
        });

        // Remove the bullet if it's out of bounds or has reached its max hits
        return (!hitEnemy || (bullet.isSpecial && bullet.hitCount < bullet.maxHits)) && !bullet.isOutOfBounds();
    });

    if (Math.random() < 0.02) {
        spawnCircle();
    }

    drawCooldownIndicator(10, 10, shootCooldown, lastShotTime, 'yellow');
    drawCooldownIndicator(10, 50, specialShootCooldown, lastSpecialShotTime, 'purple');

    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 100);
}

function drawCooldownIndicator(x, y, cooldown, lastTime, color) {
    const currentTime = Date.now();
    const elapsedTime = currentTime - lastTime;
    const remainingTime = Math.max(0, cooldown - elapsedTime);
    const progress = 1 - (remainingTime / cooldown);

    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'gray';
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, 20, -Math.PI / 2, -Math.PI / 2 + (2 * Math.PI * progress));
    ctx.lineTo(x, y);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}

function showGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = '48px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 100);

    ctx.font = '36px Arial';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = '24px Arial';
    ctx.fillText('Click to Restart', canvas.width / 2, canvas.height / 2 + 50);
}

function shoot(isSpecial = false) {
    const currentTime = Date.now();
    const cooldown = isSpecial ? specialShootCooldown : shootCooldown;
    const lastTime = isSpecial ? lastSpecialShotTime : lastShotTime;

    if (currentTime - lastTime >= cooldown) {
        let closestCircle = null;
        let closestDistance = Infinity;

        circles.forEach(circle => {
            const dx = circle.x - player.x;
            const dy = circle.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestCircle = circle;
            }
        });

        if (closestCircle) {
            bullets.push(new Bullet(player.x, player.y, closestCircle, isSpecial));
            if (isSpecial) {
                lastSpecialShotTime = currentTime;
            } else {
                lastShotTime = currentTime;
            }
        }
    }
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
    player.y = e.clientY - rect.top;
});

canvas.addEventListener('click', () => {
    if (gameOver) {
        init();
    } else {
        shoot();
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
        shoot(true);
    }
});

gameButton.addEventListener('click', init);
