    /*
    VOIDBREAKER — BETA VERSION
    Stage 1: Enemy + Boss
    Stage 2: Survival 90s
    Status: Feature freeze for beta testing
    */
    
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const playerImage = new Image();
    playerImage.src = "assets/sprites/player.png";

    const enemyStage1Image = new Image();
    enemyStage1Image.src = "assets/sprites/enemy_stage1.png";

    const enemyStage2Image = new Image();
    enemyStage2Image.src = "assets/sprites/enemy_stage2.png";

    const bossImage = new Image();
    bossImage.src = "assets/sprites/boss_stage1.png";

    // =====================
    // CANVAS SETUP
    // =====================
    function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // =====================
    // INPUT EVENT LISTENER
    // =====================
    const keys = {};
    window.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

    // MOBILE TOUCH START
    canvas.addEventListener("touchstart", () => {
        if (gameState === "menu") {
            resetGame();
        }
    });

    let isTouching = false;
    let touchX = 0;
    let touchY = 0;

    canvas.addEventListener("touchstart", (e) => {
        if (gameState !== "playing") return;

        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();

        isTouching = true;
        touchX = touch.clientX - rect.left;
        touchY = touch.clientY - rect.top;

        // langsung tembak saat tap
        shoot();
    });

    canvas.addEventListener("touchmove", (e) => {
        if (!isTouching || gameState !== "playing") return;

        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();

        touchX = touch.clientX - rect.left;
        touchY = touch.clientY - rect.top;

        e.preventDefault(); 
    }, { passive: false });

    canvas.addEventListener("touchend", () => {
        isTouching = false;
    });


    // =====================
    // GAME STATE
    // =====================
    let gameOver = false;
    let score = 0;
    let highScore = localStorage.getItem("voidbreakerHighScore") || 0;
    let victory = false;
    let currentStage = 1;
    let stageTransition = false;
    let stageTimer = 0;
    let activeEnemyLaser = null;
    let gameState = "menu";

    let stage2Timer = 0;
    const STAGE2_SURVIVE_TIME = 90 * 60; // 90 detik @60fps

    let nebulaOffset = 0;

    // =====================
    // BOSS STATE
    // =====================
    let bossActive = false;
    let bossDefeated = false;
    let bossPhase = 1; // 1 atau 2
    let bossLaserActive = false;
    let bossLaserCharge = false;
    let bossLaserTimer = 0;

    // =====================
    // POWER UPS STATE
    // =====================
    let powerUps = [];

    let rapidFire = false;
    let doubleShot = false;
    let shield = false;

    let rapidFireTimer = 0;
    let doubleShotTimer = 0;

    // =====================
    // SHIELD BREAK PARTICLES
    // =====================
    let shieldParticles = [];

    // =====================
    // SHIELD PULSE STATE
    // =====================
    let shieldPulse = 0;

    // =====================
    // BOSS
    // =====================
    let boss = {
    x: canvas.width / 2 - 100,
    y: 60,
    width: 200,
    height: 80,
    hp: 300,
    maxHp: 300,
    speed: 3,
    dir: 1,
    shootTimer: 0
    };

    let bossBullets = [];

    // =====================
    // DIFFICULTY SYSTEM
    // =====================
    let difficultyLevel = 1;
    let difficultyTimer = 0;

    let enemyBaseSpeed = 2;
    let enemyBaseInterval = 60;

    // =====================
    // SCREEN SHAKE & FLASH
    // =====================
    let shakeTime = 0;
    let shakeIntensity = 0;

    let flashTime = 0;

    // =====================
    // SOUND FX
    // =====================
    const sfx = {
    laser: new Audio("assets/sound/laser.wav"),
    explosion: new Audio("assets/sound/explosion.mp3"),
    gameover: new Audio("assets/sound/gameover.wav")
    };

    // Biar bisa dipencet cepat tanpa delay
    sfx.laser.volume = 0.4;
    sfx.explosion.volume = 0.5;
    sfx.gameover.volume = 0.6;

    /*
    function playSound(sound) {
    sound.currentTime = 0;
    sound.play();
    } */

    // =====================
    // MUTE
    // =====================
    let muted = false;

    window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "m") {
        muted = !muted;
    }
    });

    function playSound(sound) {
    if (muted) return;
    sound.currentTime = 0;
    sound.play();
    }


    // =====================
    // STARFIELD
    // =====================
    const stars = [];
    const STAR_COUNT = 120;

    function initStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 1.5 + 0.5
        });
    }
    }
    initStars();

    // =====================
    // PLAYER
    // =====================
    const player = {
        x: canvas.width / 2,
        y: canvas.height - 120,
        width: 60,   
        height: 80,  
        speed: 6
    };

    let thrusterPulse = 0;

    // =====================
    // BULLETS
    // =====================
    let bullets = [];
    const bulletSpeed = 10;

    // =====================
    // ENEMIES
    // =====================
    let enemies = [];
    let enemySpeed = 2;
    let enemyTimer = 0;
    let enemyInterval = 60;

    // =====================
    // FUNCTIONS
    // =====================
    function shoot() {
    if (doubleShot) {
        bullets.push(
        { x: player.x + 8, y: player.y, width: 4, height: 10 },
        { x: player.x + player.width - 12, y: player.y, width: 4, height: 10 }
        );
    } else {
        bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 10
        });
    }

    playSound(sfx.laser);
    }

    function spawnEnemy() {
        const size = 50;

        enemies.push({
            x: Math.random() * (canvas.width - size),
            y: -size,
            width: size,
            height: size,
            sprite: enemyStage1Image
        });
    }


    function isColliding(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
    }

    function resetGame() {
        gameOver = false;
        victory = false;
        gameState = "playing";

        currentStage = 1;
        stageTransition = false;
        stageTimer = 0;

        bossPhase = 1;
        bossActive = false;
        bossDefeated = false;

        bossLaserActive = false;
        bossLaserCharge = false;
        bossLaserTimer = 0;

        bullets = [];
        enemies = [];
        bossBullets = [];
        powerUps = [];

        isTouching = false;

        enemyTimer = 0;
        score = 0;

        difficultyLevel = 1;
        difficultyTimer = 0;

        enemySpeed = enemyBaseSpeed;
        enemyInterval = enemyBaseInterval;

        rapidFire = false;
        doubleShot = false;
        shield = false;

        player.x = canvas.width / 2;
        player.y = canvas.height - 100;

        boss.hp = boss.maxHp;
    }

    function triggerShake(intensity = 5, duration = 10) {
    shakeIntensity = intensity;
    shakeTime = duration;
    }

    function triggerFlash(duration = 5) {
    flashTime = duration;
    }

    function drawFlash() {
    if (flashTime > 0) {
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        flashTime--;
    }
    }

    function spawnShieldBreak() {
        const cx = player.x + player.width / 2;
        const cy = player.y + player.height / 2;

        for (let i = 0; i < 14; i++) {
            shieldParticles.push({
            x: cx,
            y: cy,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 18 // frame
            });
        }

        // efek dramatis kecil
        triggerFlash(6);
        triggerShake(8, 12);
    }

    function checkBossSpawn() {
    if (victory || bossActive || bossDefeated) return;
    if (score >= 300) {
        bossActive = true;
        enemies = [];
        bossBullets = [];     
        boss.shootTimer = 0; 

        boss.x = canvas.width / 2 - boss.width / 2;
        triggerShake(15, 25);
        triggerFlash(12);
    }
    }


    // =====================
    // UPDATE
    // =====================
    function updateStars() {
        stars.forEach(star => {
            star.y += currentStage === 2 ? star.speed * 1.8 : star.speed;

            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
        });
    }

    function updatePlayer() {
        if (gameOver || gameState !== "playing") return;

        // =====================
        // KEYBOARD (DESKTOP)
        // =====================
        if (keys["a"] || keys["arrowleft"]) player.x -= player.speed;
        if (keys["d"] || keys["arrowright"]) player.x += player.speed;
        if (keys["w"] || keys["arrowup"]) player.y -= player.speed;
        if (keys["s"] || keys["arrowdown"]) player.y += player.speed;

        // =====================
        // TOUCH (MOBILE)
        // =====================
        if (isTouching) {
            player.x += (touchX - (player.x + player.width / 2)) * 0.15;
            player.y += (touchY - (player.y + player.height / 2)) * 0.15;
        }

        // =====================
        // BOUNDARY
        // =====================
        player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
        player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
    }


    function updateBullets() {
    if (gameOver) return;

    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bulletSpeed;
        if (bullets[i].y + bullets[i].height < 0) {
        bullets.splice(i, 1);
        }
    }
    }

    function updateEnemies() {
        if (gameOver || victory || bossActive || stageTransition) return;

        enemyTimer++;

        // =====================
        // STAGE 1 SPAWN
        // =====================
        if (currentStage === 1 && enemyTimer >= enemyInterval) {
            spawnEnemy();
            enemyTimer = 0;
        }

        // =====================
        // STAGE 2 SPAWN
        // =====================
        if (currentStage === 2 && enemyTimer >= enemyInterval) {
            spawnEnemyStage2();
            enemyTimer = 0;
        }

        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];

            // =====================
            // MOVEMENT
            // =====================
            if (currentStage === 2) {
            e.y += e.speed;
            e.x += e.vx;

            if (e.x <= 0 || e.x + e.width >= canvas.width) {
                e.vx *= -1;
            }

            e.laserTimer++;

            if (activeEnemyLaser === null && e.laserTimer > 120) {
                activeEnemyLaser = e;
                e.laserState = "warning";
            }

            if (activeEnemyLaser === e) {
                if (e.laserTimer > 150) e.laserState = "fire";
                if (e.laserTimer > 200) {
                    e.laserTimer = 0;
                    e.laserState = "idle";
                    activeEnemyLaser = null;
                }
            }
        } else {
                e.y += enemySpeed;
            }

            // =====================
            // PLAYER COLLISION
            // =====================
            if (isColliding(e, player)) {
                if (shield) {
                    shield = false;
                    spawnShieldBreak();
                    enemies.splice(i, 1);
                } else {
                    triggerGameOver();
                    return;
                }
            }

            // =====================
            // LASER HIT
            // =====================
            if (currentStage === 2 && e.laserState === "fire") {

                const laserY = e.y + e.height / 2;
                const laserHeight = 6;

                const laserX = e.x - 120;           // panjang laser kiri
                const laserWidth = e.width + 240;   // total panjang laser

                if (
                    player.x < laserX + laserWidth &&
                    player.x + player.width > laserX &&
                    player.y < laserY + laserHeight &&
                    player.y + player.height > laserY
                ) {
                    triggerGameOver();
                }
            }

            if (e.y > canvas.height) {
                enemies.splice(i, 1);
            }
        }
    }

   function checkBulletCollisions() {
    if (gameOver) return;

    // ===============================
    // PLAYER BULLET VS BOSS
    // ===============================
    if (bossActive) {
        for (let i = bullets.length - 1; i >= 0; i--) {
            if (isColliding(bullets[i], boss)) {
            bullets.splice(i, 1);
            boss.hp -= 10;

            // ===== PHASE 2 =====
            if (bossPhase === 1 && boss.hp <= boss.maxHp / 2) {
                bossPhase = 2;
                triggerShake(20, 30);
                triggerFlash(12);
            }

            // ===== PHASE 3 (LASER) =====
            if (bossPhase === 2 && boss.hp <= boss.maxHp * 0.25) {
                bossPhase = 3;
                bossLaserTimer = 0;
                bossLaserActive = false;
                bossLaserCharge = true;

                bossBullets = [];

                triggerShake(25, 35);
                triggerFlash(15);
            }

            // ===== BOSS MATI =====
            if (boss.hp <= 0) {
                boss.hp = 0;
                bossActive = false;
                bossDefeated = true;

                bossLaserActive = false;
                bossLaserCharge = false;
                bossLaserTimer = 0;

                stageTransition = true;
                stageTimer = 180; // 3 detik
            }


            break; 
            }
        }
    }


    // ===============================
    // PLAYER BULLET VS ENEMY BIASA
    // ===============================
    for (let i = enemies.length - 1; i >= 0; i--) {
        for (let j = bullets.length - 1; j >= 0; j--) {
        if (isColliding(enemies[i], bullets[j])) {
        // Hapus enemy & bullet
        const ex = enemies[i].x;
        const ey = enemies[i].y;

        enemies.splice(i, 1);
        bullets.splice(j, 1);
        score += 10;

        // ===============================
        // SPAWN POWER UP 
        // ===============================
        if (Math.random() < 0.15) { // 15% chance
            powerUps.push({
            x: ex,
            y: ey,
            width: 24,     
            height: 24,    
            speed: 2,
            type: ["rapid", "double", "shield"]
                  [Math.floor(Math.random() * 3)]
        });

        }

        triggerShake(5, 8);
        triggerFlash(2);
        playSound(sfx.explosion);

        break;
    }
        }
    }
    }

    function updateDifficulty() {
    if (gameOver) return;

    difficultyTimer++;

    // Naik difficulty tiap ~10 detik (600 frame @60fps)
    if (difficultyTimer >= 600) {
        difficultyLevel++;
        difficultyTimer = 0;

        // Scale difficulty
        enemySpeed += 0.5;
        enemyInterval = Math.max(20, enemyInterval - 5);

        console.log("Difficulty:", difficultyLevel);
    }
    }

    function updateBoss() {
        if (!bossActive || gameOver || victory) {
            boss.shootTimer = 0;
            return;
        }

        // movement
        const speed = bossPhase === 2 ? 5 : 3;
        boss.x += speed * boss.dir;

        if (boss.x <= 0 || boss.x + boss.width >= canvas.width) {
            boss.dir *= -1;
        }

        // =====================
        // PHASE 3 — LASER BEAM
        // =====================
        if (bossPhase === 3) {
            bossLaserTimer++;

            // CHARGE
            if (bossLaserTimer < 60) {
                bossLaserCharge = true;
                bossLaserActive = false;
            }
            // FIRE
            else if (bossLaserTimer < 150) {
                bossLaserCharge = false;
                bossLaserActive = true;
            }
            // COOLDOWN
            else {
                bossLaserCharge = false;
                bossLaserActive = false;
                bossLaserTimer = 0;
            }

            return; // STOP POLA TEMBAK LAIN
        }

        // =====================
        // PHASE 1 & 2 SHOOT
        // =====================
        boss.shootTimer++;
        const fireRate = bossPhase === 2 ? 25 : 40;

        if (boss.shootTimer >= fireRate) {
            if (bossPhase === 1) {
                bossBullets.push({
                    x: boss.x + boss.width / 2 - 4,
                    y: boss.y + boss.height,
                    width: 8,
                    height: 16,
                    speed: 6,
                    vx: 0
                });
            } else {
                const cx = boss.x + boss.width / 2;
                [-1, 0, 1].forEach(d => {
                    bossBullets.push({
                        x: cx - 4,
                        y: boss.y + boss.height,
                        width: 8,
                        height: 16,
                        speed: 6,
                        vx: d * 2
                    });
                });
            }
            boss.shootTimer = 0;
        }
    }



    function updateBossBullets() {
    if (victory || !bossActive) return;

    for (let i = bossBullets.length - 1; i >= 0; i--) {
        bossBullets[i].y += bossBullets[i].speed;
        
        if (bossBullets[i].vx !== undefined) {
            bossBullets[i].x += bossBullets[i].vx;
        }

        if (bossBullets[i].y > canvas.height) {
        bossBullets.splice(i, 1);
        }

       if (isColliding(bossBullets[i], player)) {

        // =====================
        // SHIELD CHECK 
        // =====================
        if (shield) {
            shield = false;               // shield habis
            bossBullets.splice(i, 1);     // peluru boss hilang
            triggerFlash(8);
            triggerShake(10, 15);
            playSound(sfx.explosion);
            continue;
        } else {
            triggerGameOver();
            return;
        }
    }

    }
    }

    function updatePowerUps() {
    if (gameOver || victory) return;

    for (let i = powerUps.length - 1; i >= 0; i--) {
            powerUps[i].y += powerUps[i].speed;

            // Ambil power up
            if (isColliding(powerUps[i], player)) {
            activatePowerUp(powerUps[i].type);
            powerUps.splice(i, 1);
            continue;
            }

            // Keluar layar
            if (powerUps[i].y > canvas.height) {
            powerUps.splice(i, 1);
            }
        }
    }

    function updateShieldParticles() {
        for (let i = shieldParticles.length - 1; i >= 0; i--) {
            const p = shieldParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            if (p.life <= 0) {
            shieldParticles.splice(i, 1);
            }
        }
    }

    function updateShieldPulse() {
        if (!shield) {
            shieldPulse = 0; // reset kalau shield mati
            return;
        }

        shieldPulse += 0.08; // kecepatan denyut
    }

    function activatePowerUp(type) {
    if (type === "rapid") {
        rapidFire = true;
        rapidFireTimer = 600; // 10 detik
    }

    if (type === "double") {
        doubleShot = true;
        doubleShotTimer = 600;
    }

    if (type === "shield") {
        shield = true;
    }
    }

    function updatePowerUpTimers() {
    if (rapidFire) {
        rapidFireTimer--;
        if (rapidFireTimer <= 0) rapidFire = false;
    }

    if (doubleShot) {
        doubleShotTimer--;
        if (doubleShotTimer <= 0) doubleShot = false;
    }
    }

    function triggerGameOver() {
        if (gameOver) return;

        gameOver = true;
        gameState = "gameover";

        if (score > highScore) {
            highScore = score;
            localStorage.setItem("voidbreakerHighScore", highScore);
        }

        // MATIKAN TOTAL SEMUA STATE AKTIF
        bossActive = false;
        bossDefeated = false;
        stageTransition = false;  
        stageTimer = 0;
        bossPhase = 1;             

        bossLaserActive = false;
        bossLaserCharge = false;
        bossLaserTimer = 0;

        bullets = [];
        bossBullets = [];
        enemies = [];
        powerUps = [];
        isTouching = false;

        keys["r"] = false;
        keys[" "] = false;

        shakeTime = 0;
        flashTime = 0;

        playSound(sfx.gameover);
    }

    function checkBossLaserHit() {
        if (
            !bossLaserActive ||
            gameOver ||
            !bossActive ||
            stageTransition       
        ) return;

        const laserX = boss.x + boss.width / 2 - 18;
        const laserY = boss.y + boss.height;
        const laserWidth = 36;
        const laserHeight = canvas.height - laserY;

        if (
            player.x < laserX + laserWidth &&
            player.x + player.width > laserX &&
            player.y < laserY + laserHeight &&
            player.y + player.height > laserY
        ) {
            triggerGameOver();
        }
    }

    function startStage2() {
        // reset gameplay
        enemies = [];
        bullets = [];
        bossBullets = [];
        powerUps = [];

        enemyTimer = 0;

        enemySpeed = 3.5;
        enemyInterval = 40;

        difficultyLevel = 1;
        difficultyTimer = 0;

        // player aman
        shield = true;

        // boss sudah mati
        bossActive = false;
        bossDefeated = true;

        stage2Timer = 0;
    }

    function spawnEnemyStage2() {
        const size = 36;

        enemies.push({
            x: Math.random() * (canvas.width - size),
            y: -size,
            width: size,
            height: size,

            speed: 1.5,
            vx: Math.random() < 0.5 ? -1.5 : 1.5,

            laserTimer: Math.floor(Math.random() * 120),
            laserState: "idle",

            sprite: enemyStage2Image
        });
    }

    function updateStageTransition() {
        if (!stageTransition) return;

        stageTimer--;

        if (stageTimer <= 0) {
            stageTransition = false;
            currentStage = 2;

            startStage2();
        }
    }

    function updateVictoryCondition() {
        if (
            gameOver ||
            victory ||
            currentStage !== 2 ||
            stageTransition
        ) return;

        stage2Timer++;

        if (stage2Timer >= STAGE2_SURVIVE_TIME) {
            triggerVictory();
        }
    }

    function triggerVictory() {
        if (victory) return;

        victory = true;
        gameState = "victory";

        bullets = [];
        enemies = [];
        bossBullets = [];
        powerUps = [];

        keys[" "] = false;
        keys["r"] = false;

        triggerFlash(20);
        triggerShake(20, 30);
    }

    function updateThruster() {
        thrusterPulse += 0.15;
    }

    function updateStage2Background() {
        nebulaOffset += 0.3;
    }

    // =====================
    // DRAW
    // =====================
    function drawStars() {
    ctx.fillStyle = "#ffffff";
    stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    }

    function drawPlayer() {
        ctx.drawImage(
            playerImage,
            player.x,
            player.y,
            player.width,
            player.height
        );
    }


    function drawBullets() {
    ctx.fillStyle = "#ffffff";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
    }

    function drawEnemies() {
        enemies.forEach(e => {
            if (e.sprite) {
                ctx.drawImage(
                    e.sprite,
                    e.x,
                    e.y,
                    e.width,
                    e.height
                );
            } else {
                // fallback kalau sprite gagal load
                ctx.fillStyle = "#ff3c3c";
                ctx.fillRect(e.x, e.y, e.width, e.height);
            }
        });
    }

    function drawScore() {
    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`High: ${highScore}`, 20, 55);
    ctx.fillText(`Level: ${difficultyLevel}`, 20, 80);
    }

    function drawPowerUpUI() {
        const startX = canvas.width - 180;
        let y = 30;

        ctx.font = "14px Arial";
        ctx.textAlign = "left";

        // =====================
        // RAPID FIRE
        // =====================
        if (rapidFire) {
            ctx.fillStyle = "#00ff00";
            ctx.fillText("⚡ RAPID", startX, y);

            ctx.fillStyle = "#333";
            ctx.fillRect(startX, y + 8, 120, 6);

            ctx.fillStyle = "#00ff00";
            ctx.fillRect(
            startX,
            y + 8,
            120 * (rapidFireTimer / 600),
            6
            );

            y += 25;
        }

        // =====================
        // DOUBLE SHOT
        // =====================
        if (doubleShot) {
            ctx.fillStyle = "#ffaa00";
            ctx.fillText("🔫 DOUBLE", startX, y);

            ctx.fillStyle = "#333";
            ctx.fillRect(startX, y + 8, 120, 6);

            ctx.fillStyle = "#ffaa00";
            ctx.fillRect(
            startX,
            y + 8,
            120 * (doubleShotTimer / 600),
            6
            );

            y += 25;
        }

        // =====================
        // SHIELD
        // =====================
        if (shield) {
            ctx.fillStyle = "#00ffff";
            ctx.fillText("🛡️ SHIELD", startX, y);
        }
    }

    function drawGameOver() {
    if (!gameOver) return;

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "48px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

    ctx.font = "20px Arial";
    ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 2 + 40);
    }

    function drawBoss() {
    if (!bossActive) return;

    ctx.save();

    // paksa normal blend
    ctx.globalCompositeOperation = "source-over";

    ctx.drawImage(
        bossImage,
        boss.x,
        boss.y,
        boss.width,
        boss.height
    );

    ctx.restore();
}

    function drawBossHP() {
    if (!bossActive) return;

    const barWidth = 300;
    const barHeight = 12;
    const x = canvas.width / 2 - barWidth / 2;
    const y = 20;

    ctx.fillStyle = "#333";
    ctx.fillRect(x, y, barWidth, barHeight);

    const hpRatio = boss.hp / boss.maxHp;
    ctx.fillStyle = "#ff3c3c";
    ctx.fillRect(x, y, barWidth * hpRatio, barHeight);
    }

    function drawBossBullets() {
    if (!bossActive) return; // 
    ctx.fillStyle = "#ff8800";
    bossBullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });
    }


    function drawVictory() {
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";

        ctx.font = "48px Arial";
        ctx.fillText("MISSION COMPLETE", canvas.width / 2, canvas.height / 2);

        ctx.font = "20px Arial";
        ctx.fillText(
            "You survived the Void",
            canvas.width / 2,
            canvas.height / 2 + 40
        );

        ctx.fillText(
            "Press R to Restart",
            canvas.width / 2,
            canvas.height / 2 + 80
        );
    }

    function drawPowerUps() {
    powerUps.forEach(p => {
        if (p.type === "rapid") ctx.fillStyle = "#00ff00";
        if (p.type === "double") ctx.fillStyle = "#ffaa00";
        if (p.type === "shield") ctx.fillStyle = "#00ffff";

        ctx.fillRect(p.x, p.y, p.width, p.height);
    });
    }

    function drawShield() {
        if (!shield) return;

        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;

        // radius berdenyut
        const baseRadius = player.width;
        const pulse = Math.sin(shieldPulse) * 4; // besar denyut
        const radius = baseRadius + pulse;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

        ctx.strokeStyle = "rgba(0, 255, 255, 0.9)";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "rgba(0, 255, 255, 0.15)";
        ctx.fill();
    }

    function drawShieldParticles() {
        ctx.fillStyle = "rgba(0, 255, 255, 0.8)";
        shieldParticles.forEach(p => {
            ctx.fillRect(p.x, p.y, 3, 3);
        });
    }

    function drawBossPhaseText() {
        if (!bossActive) return;

        ctx.textAlign = "center";
        ctx.font = "20px Arial";

        if (bossPhase === 2) {
            ctx.fillStyle = "#ff0066";
            ctx.fillText("BOSS RAGE MODE", canvas.width / 2, 70);
        }

        if (bossPhase === 3) {
            ctx.fillStyle = "#ff0000";
            ctx.fillText("LASER OVERDRIVE", canvas.width / 2, 70);
        }
    }

    function drawBossLaser() {
        if (
            !bossLaserActive ||
            !bossActive ||        
            stageTransition ||    
            currentStage !== 1    
        ) return;

        const x = boss.x + boss.width / 2 - 12;

        ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
        ctx.fillRect(
            x,
            boss.y + boss.height,
            24,
            canvas.height - (boss.y + boss.height)
        );
    }

    function drawStageText() {
        ctx.fillStyle = "#ffffff";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`STAGE ${currentStage}`, canvas.width / 2, 50);
    }

    function drawEnemyLasers() {
        if (currentStage !== 2) return;

        const laserLength = 320; // PANJANG LASER (TIDAK FULL SCREEN)

        enemies.forEach(e => {
            if (e.laserState === "warning") {
                ctx.strokeStyle = "rgba(255,255,0,0.5)";
                ctx.lineWidth = 2;
            } 
            else if (e.laserState === "fire") {
                ctx.strokeStyle = "rgba(255,0,0,0.9)";
                ctx.lineWidth = 4;
            } 
            else return;

            const y = e.y + e.height / 2;
            const centerX = e.x + e.width / 2;

            ctx.beginPath();
            ctx.moveTo(centerX - laserLength / 2, y);
            ctx.lineTo(centerX + laserLength / 2, y);
            ctx.stroke();
        });
    }

    function drawMainMenu() {
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";

        ctx.font = "64px Arial";
        ctx.fillText("VOIDBREAKER", canvas.width / 2, canvas.height / 2 - 80);

        ctx.font = "22px Arial";
        ctx.fillText("BETA VERSION", canvas.width / 2, canvas.height / 2 - 30);

        ctx.font = "20px Arial";
        ctx.fillText("PRESS SPACE OR TAP TO START", canvas.width / 2, canvas.height / 2 + 30);

        ctx.font = "14px Arial";
        ctx.fillText("v0.1", canvas.width / 2, canvas.height - 40);
    }

    function drawStage2Timer() {
        if (currentStage !== 2 || victory) return;

        const timeLeft = Math.ceil(
            (STAGE2_SURVIVE_TIME - stage2Timer) / 60
        );

        ctx.fillStyle = "#ffffff";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
            `SURVIVE: ${timeLeft}s`,
            canvas.width / 2,
            80
        );
    }

    function drawThruster() {
        const centerX = player.x + player.width / 2;
        const baseY = player.y + player.height;

        const pulse = Math.sin(thrusterPulse) * 6;
        const flameHeight = 25 + pulse;
        const flameWidth = 10 + pulse * 0.5;

        ctx.save();

        // core flame
        ctx.fillStyle = "rgba(255, 160, 0, 0.9)";
        ctx.beginPath();
        ctx.moveTo(centerX, baseY);
        ctx.lineTo(centerX - flameWidth, baseY + flameHeight);
        ctx.lineTo(centerX + flameWidth, baseY + flameHeight);
        ctx.closePath();
        ctx.fill();

        // outer glow
        ctx.fillStyle = "rgba(255, 80, 0, 0.5)";
        ctx.beginPath();
        ctx.moveTo(centerX, baseY);
        ctx.lineTo(centerX - flameWidth * 1.6, baseY + flameHeight * 1.3);
        ctx.lineTo(centerX + flameWidth * 1.6, baseY + flameHeight * 1.3);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    function drawStage2Background() {
        // === GRADIENT NEBULA ===
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, "#060018");
        grad.addColorStop(0.5, "#12002a");
        grad.addColorStop(1, "#02010a");

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // === NEBULA FOG ===
        ctx.fillStyle = "rgba(180, 80, 255, 0.05)";
        for (let i = 0; i < 6; i++) {
            const y = (i * 200 + nebulaOffset) % canvas.height;
            ctx.beginPath();
            ctx.ellipse(
                canvas.width / 2,
                y,
                canvas.width,
                140,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }

    // =====================
    // GAME LOOP
    // =====================
    let canShoot = true;

    function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // =========================
    // MAIN MENU STATE
    // =========================
    if (gameState === "menu") {
        drawStars();
        drawMainMenu();

        // START GAME
        if (keys[" "] || keys["enter"]) {
            keys[" "] = false;
            keys["enter"] = false;
            resetGame();
        }

        requestAnimationFrame(gameLoop);
        return;
    }

    // =========================
    // GAME OVER STATE
    // =========================
    if (gameState === "gameover") {
        drawStars();
        drawGameOver();
        drawFlash();

        if (keys["r"]) {
            keys["r"] = false;
            resetGame();
        }

        requestAnimationFrame(gameLoop);
        return;
    }

    // =========================
    // VICTORY STATE
    // =========================
    if (gameState === "victory") {
        drawStars();
        drawVictory();

        if (keys["r"]) {
            keys["r"] = false;
            resetGame();
        }

        requestAnimationFrame(gameLoop);
        return;
    }

    // =====================
    // UPDATE (NORMAL GAME)
    // =====================
    updateStars();
    if (currentStage === 2) {
        updateStage2Background();
    }
    updatePlayer();
    updateThruster();
    updateBullets();
    updateEnemies();
    checkBulletCollisions();
    updateDifficulty();
    checkBossSpawn();
    updateBoss();
    updateStageTransition();
    checkBossLaserHit();
    updateBossBullets();
    updatePowerUps();
    updatePowerUpTimers();
    updateShieldParticles();
    updateShieldPulse();
    updateVictoryCondition();

    // =====================
    // DRAW GAME WORLD
    // =====================
    ctx.save();

    if (shakeTime > 0) {
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
        shakeTime--;
    }

    if (currentStage === 2) {
        drawStage2Background();
    } else {
        drawStars();
    }
    drawStars();
    drawEnemies();
    drawEnemyLasers();
    drawThruster();
    drawPlayer();
    drawShield();
    drawShieldParticles();
    drawBullets();
    drawBoss();
    drawBossLaser();
    drawBossHP();
    drawBossBullets();
    drawPowerUps();
    drawStageText();
    drawStage2Timer();

    ctx.restore();

    // =====================
    // UI
    // =====================
    drawScore();
    drawPowerUpUI();
    drawBossPhaseText();
    drawFlash();

    // =====================
    // INPUT
    // =====================
    if (
        canShoot &&
        gameState === "playing" &&
        (
            keys[" "] ||     // DESKTOP (SPACE)
            isTouching       // MOBILE (TOUCH)
        )
    ) {
        shoot();
        canShoot = false;
        setTimeout(() => canShoot = true, rapidFire ? 80 : 200);
    }

    requestAnimationFrame(gameLoop);
}

    gameLoop();