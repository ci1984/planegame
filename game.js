// 游戏主文件
class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;

        // 游戏状态
        this.gameState = 'START'; // START, PLAYING, PAUSED, GAMEOVER
        this.score = 0;
        this.lives = 3;
        this.highScore = localStorage.getItem('planeHighScore') || 0;

        // 游戏对象
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.particles = [];

        // 游戏配置
        this.enemySpawnTimer = 0;
        this.enemySpawnInterval = 120; // 帧数

        // 初始化
        this.init();
    }

    init() {
        // 设置Canvas
        this.setupCanvas();

        // 设置事件监听
        this.setupEventListeners();

        // 更新UI
        this.updateUI();

        // 开始游戏循环
        this.gameLoop();
    }

    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // 设置Canvas尺寸
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        // 计算合适的游戏尺寸
        const maxWidth = window.innerWidth - 40;
        const maxHeight = window.innerHeight - 100;

        // 设置标准游戏比例
        const aspectRatio = 9 / 16;
        let gameWidth = Math.min(maxWidth, 400);
        let gameHeight = gameWidth / aspectRatio;

        // 确保不超过屏幕高度
        if (gameHeight > maxHeight) {
            gameHeight = maxHeight;
            gameWidth = gameHeight * aspectRatio;
        }

        this.width = gameWidth;
        this.height = gameHeight;

        // 设置Canvas实际尺寸
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
    }

    setupEventListeners() {
        // 开始按钮
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        // 重新开始按钮
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.resetGame();
            this.startGame();
        });

        // 暂停按钮
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });

        // ESC键暂停
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.gameState === 'PLAYING') {
                this.togglePause();
            }
        });
    }

    startGame() {
        this.gameState = 'PLAYING';
        this.hideAllScreens();
        document.getElementById('pauseBtn').classList.remove('hidden');

        // 初始化玩家
        this.player = new Player(this.width / 2, this.height - 100);

        // 清空游戏对象
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
    }

    resetGame() {
        this.score = 0;
        this.lives = 3;
        this.enemySpawnTimer = 0;
        this.updateUI();
    }

    togglePause() {
        if (this.gameState === 'PLAYING') {
            this.gameState = 'PAUSED';
            this.showScreen('pauseScreen');
        } else if (this.gameState === 'PAUSED') {
            this.gameState = 'PLAYING';
            this.hideAllScreens();
        }
    }

    gameLoop() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 绘制背景
        this.drawBackground();

        if (this.gameState === 'PLAYING') {
            // 更新游戏逻辑
            this.update();
        }

        // 绘制游戏对象
        this.draw();

        // 继续游戏循环
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        if (!this.player) return;

        // 更新玩家
        this.player.update(this.width, this.height);

        // 玩家射击
        if (window.inputController.isFirePressed()) {
            const bullet = this.player.shoot();
            if (bullet) {
                this.bullets.push(bullet);
            }
        }

        // 更新子弹
        this.bullets = this.bullets.filter(bullet => {
            bullet.update();
            return bullet.y > -10;
        });

        // 生成敌机
        this.enemySpawnTimer++;
        if (this.enemySpawnTimer >= this.enemySpawnInterval) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;

            // 随着游戏进行加快生成速度
            this.enemySpawnInterval = Math.max(30, 120 - Math.floor(this.score / 100) * 10);
        }

        // 更新敌机
        this.enemies = this.enemies.filter(enemy => {
            enemy.update();

            // 检查敌机是否飞出屏幕
            if (enemy.y > this.height + 50) {
                this.lives--;
                this.updateUI();
                if (this.lives <= 0) {
                    this.gameOver();
                }
                return false;
            }

            return true;
        });

        // 更新粒子效果
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.life > 0;
        });

        // 碰撞检测
        this.checkCollisions();
    }

    draw() {
        if (this.gameState !== 'START' && this.gameState !== 'GAMEOVER') {
            // 绘制游戏对象
            if (this.player) {
                this.player.draw(this.ctx);
            }

            this.bullets.forEach(bullet => bullet.draw(this.ctx));
            this.enemies.forEach(enemy => enemy.draw(this.ctx));
            this.particles.forEach(particle => particle.draw(this.ctx));
        }
    }

    drawBackground() {
        // 绘制渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#0a0a2a');
        gradient.addColorStop(1, '#1a1a4a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 绘制星星背景
        this.drawStars();
    }

    drawStars() {
        // 简单的星星效果
        this.ctx.fillStyle = 'white';
        for (let i = 0; i < 30; i++) {
            const x = (i * 73 + Date.now() * 0.01) % this.width;
            const y = (i * 37 + Date.now() * 0.02) % this.height;
            const size = (i % 3) + 1;

            this.ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
            this.ctx.fillRect(x, y, size, size);
        }
        this.ctx.globalAlpha = 1;
    }

    spawnEnemy() {
        const x = Math.random() * (this.width - 40) + 20;
        const enemy = new Enemy(x, -50);
        this.enemies.push(enemy);
    }

    checkCollisions() {
        // 子弹与敌机碰撞
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];

                if (this.checkCollision(bullet, enemy)) {
                    // 创建爆炸效果
                    this.createExplosion(enemy.x, enemy.y);

                    // 移除子弹和敌机
                    this.bullets.splice(i, 1);
                    this.enemies.splice(j, 1);

                    // 增加分数
                    this.score += 10;
                    this.updateUI();

                    break;
                }
            }
        }

        // 玩家与敌机碰撞
        if (this.player) {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];

                if (this.checkCollision(this.player, enemy)) {
                    // 创建爆炸效果
                    this.createExplosion(enemy.x, enemy.y);
                    this.createExplosion(this.player.x, this.player.y);

                    // 移除敌机
                    this.enemies.splice(i, 1);

                    // 减少生命值
                    this.lives--;
                    this.updateUI();

                    if (this.lives <= 0) {
                        this.gameOver();
                    }

                    break;
                }
            }
        }
    }

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    createExplosion(x, y) {
        // 创建爆炸粒子效果
        for (let i = 0; i < 15; i++) {
            const particle = new Particle(x, y);
            this.particles.push(particle);
        }
    }

    gameOver() {
        this.gameState = 'GAMEOVER';

        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('planeHighScore', this.highScore);
        }

        // 显示游戏结束界面
        document.getElementById('finalScore').textContent = `最终得分: ${this.score}`;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        document.getElementById('pauseBtn').classList.add('hidden');

        this.updateUI();
    }

    updateUI() {
        document.getElementById('score').textContent = `得分: ${this.score}`;
        document.getElementById('lives').textContent = `生命: ${this.lives}`;
        document.getElementById('highScore').textContent = `最高分: ${this.highScore}`;
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
    }

    showScreen(screenId) {
        this.hideAllScreens();
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.remove('hidden');
        }
    }
}

// 玩家飞机类
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 5;
        this.shootCooldown = 0;
        this.shootInterval = 8;
    }

    update(canvasWidth, canvasHeight) {
        // 获取输入方向
        const direction = window.inputController.getMovementDirection();

        // 更新位置
        this.x += direction.x * this.speed;
        this.y += direction.y * this.speed;

        // 边界检测
        this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));

        // 更新射击冷却
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
    }

    shoot() {
        if (this.shootCooldown <= 0) {
            this.shootCooldown = this.shootInterval;
            return new Bullet(this.x + this.width / 2 - 2, this.y);
        }
        return null;
    }

    draw(ctx) {
        // 绘制飞机（简单的三角形）
        ctx.fillStyle = '#00d4ff';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // 绘制飞机细节
        ctx.fillStyle = '#0099cc';
        ctx.fillRect(this.x + this.width / 2 - 3, this.y + 10, 6, 15);

        // 绘制引擎火焰效果
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(this.x + 5, this.y + this.height - 5, 8, 8);
        ctx.fillRect(this.x + this.width - 13, this.y + this.height - 5, 8, 8);
    }
}

// 子弹类
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 12;
        this.speed = 10;
    }

    update() {
        this.y -= this.speed;
    }

    draw(ctx) {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 添加发光效果
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 5;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

// 敌机类
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 35;
        this.height = 35;
        this.speed = 2 + Math.random() * 2;
        this.horizontalSpeed = (Math.random() - 0.5) * 2;
    }

    update() {
        this.y += this.speed;
        this.x += this.horizontalSpeed;

        // 简单的边界反弹
        if (this.x <= 0 || this.x >= game.width - this.width) {
            this.horizontalSpeed = -this.horizontalSpeed;
        }
    }

    draw(ctx) {
        // 绘制敌机（倒三角形）
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + this.height);
        ctx.lineTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.closePath();
        ctx.fill();

        // 绘制敌机细节
        ctx.fillStyle = '#cc4444';
        ctx.fillRect(this.x + this.width / 2 - 2, this.y + 8, 4, 10);
    }
}

// 粒子效果类
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 30;
        this.maxLife = 30;
        this.size = Math.random() * 4 + 2;
        this.color = `hsl(${Math.random() * 60 + 10}, 100%, 50%)`;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life--;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// 启动游戏
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});