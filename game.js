// --- [ИГРОВАЯ ЛОГИКА И ОТРИСОВКА] ---

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('scoreBoard').style.display = 'block';
    document.getElementById('bgMusic').play().catch(() => console.log("Музыка не найдена"));
    
    state.gameActive = true;
    resetGame();
}

// Слушатели клавиатуры
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyB' && state.coins >= CONFIG.shopPrice) {
        state.coins -= CONFIG.shopPrice; 
        state.hp++;
    }
});
window.addEventListener('keyup', e => keys[e.code] = false);

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function generateWorld() {
    if (platforms.length === 0) {
        platforms.push({x: 0, y: canvas.height / 2 + 100, w: 400, h: 40, type: 'normal', isTouched: false, timer: 60});
        return;
    }

    const lastP = platforms[platforms.length - 1];
    if (player.x > lastP.x - 1200) {
        const maxGap = Math.min(220, 140 + (state.distance / 150));
        const newX = lastP.x + lastP.w + Math.random() * maxGap + 70;
        const newY = Math.max(150, Math.min(canvas.height - 150, lastP.y + (Math.random() * 260 - 130)));
        let type = Math.random() > 0.88 ? 'trap' : (Math.random() > 0.8 ? 'jump' : 'normal');
        
        platforms.push({x: newX, y: newY, w: Math.random()*150+90, h: 25, type, isTouched: false, timer: 60});
        
        if (Math.random() > 0.4 && type === 'normal') coins.push({x: newX + 50, y: newY - 45, collected: false});
        
        if (Math.random() > 0.6) {
            let meteorSpeed = 5 + (state.distance / 3000);
            meteors.push({x: player.x + canvas.width + 400, y: Math.random()*canvas.height, size: 20, speed: meteorSpeed});
        }
    }
    if (platforms.length > 30) platforms.shift();
}

function update() {
    if (!state.gameActive) { draw(); requestAnimationFrame(update); return; }

    if (keys['ArrowLeft']) player.dx = -CONFIG.playerSpeed;
    else if (keys['ArrowRight']) player.dx = CONFIG.playerSpeed;
    else player.dx *= 0.8;
    if (keys['ArrowUp'] && player.grounded) { player.dy = CONFIG.jumpPower; player.grounded = false; }

    player.dy += CONFIG.gravity;
    player.x += player.dx;
    player.y += player.dy;
    player.grounded = false;

    state.coinAnimTimer += 0.05;

    platforms.forEach((p, i) => {
        if (player.x < p.x + p.w && player.x + player.width > p.x && player.y + player.height > p.y && player.y + player.height < p.y + p.h + 20 && player.dy >= 0) {
            player.y = p.y - player.height;
            player.dy = p.type === 'jump' ? CONFIG.jumpPower * 1.5 : 0;
            player.grounded = true;
            if (p.type === 'trap') p.isTouched = true;
        }
        if (p.isTouched) { 
            p.timer--; 
            if (p.timer <= 0) platforms.splice(i, 1); 
        }
    });

    coins.forEach(c => {
        if (!c.collected && player.x < c.x + 25 && player.x + player.width > c.x - 25 && player.y < c.y + 25 && player.y + player.height > c.y - 25) {
            c.collected = true; state.coins++;
        }
    });

    if (state.invulnerable > 0) state.invulnerable--;
    meteors.forEach((m, i) => {
        m.x -= m.speed;
        let dist = Math.sqrt(Math.pow((player.x+25)-m.x, 2) + Math.pow((player.y+25)-m.y, 2));
        if (dist < m.size + 15 && state.invulnerable <= 0) {
            state.hp--; state.invulnerable = 60; meteors.splice(i, 1);
            if (state.hp <= 0) resetGame();
        }
    });

    if (player.y > canvas.height + 400) resetGame();
    
    state.distance = Math.max(state.distance, Math.floor(player.x));
    if (state.distance > state.highScore) {
        state.highScore = state.distance;
        localStorage.setItem('highScore', state.highScore);
    }
    state.cameraX = player.x - canvas.width / 4;
    
    document.getElementById('scoreBoard').innerHTML = 
        `HP: ${state.hp} | Монеты: ${state.coins} | Рекорд: ${state.highScore}<br>Дистанция: ${state.distance}<br>` +
        `<span style="color:#ff0">Жми 'B' - купить HP (10 монет)</span>`;

    generateWorld();
    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Звезды
    ctx.fillStyle = "#fff";
    stars.forEach(s => {
        let sx = (s.x - state.cameraX * 0.2) % canvas.width;
        if (sx < 0) sx += canvas.width;
        ctx.fillRect(sx, s.y, s.s, s.s);
    });

    ctx.save();
    ctx.translate(-state.cameraX, 0);

    // Платформы
    platforms.forEach(p => {
        ctx.shadowBlur = 15;
        if (p.type === 'trap') { 
            if (p.isTouched && p.timer % 10 < 5) {
                ctx.fillStyle = '#ff6666'; ctx.shadowColor = '#ff3333';
            } else {
                ctx.fillStyle = p.isTouched ? '#f33' : '#800'; ctx.shadowColor = '#f00'; 
            }
        }
        else if (p.type === 'jump') { ctx.fillStyle = '#0f0'; ctx.shadowColor = '#0f0'; }
        else { ctx.fillStyle = '#444'; ctx.shadowColor = '#0ff'; }
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fff'; ctx.strokeRect(p.x, p.y, p.w, p.h);
    });

    // Метеориты
    ctx.fillStyle = '#A0522D';
    meteors.forEach(m => { ctx.beginPath(); ctx.arc(m.x, m.y, m.size, 0, Math.PI*2); ctx.fill(); });

    // Монеты
    ctx.fillStyle = '#FFD700';
    coins.forEach(c => { 
        if(!c.collected) { 
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.scale(Math.abs(Math.sin(state.coinAnimTimer)), 1); 
            ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI*2); ctx.fill(); 
            ctx.strokeStyle = '#DAA520'; ctx.lineWidth = 2; ctx.stroke();
            ctx.restore();
        } 
    });

    // Игрок
    if (state.invulnerable % 10 < 5) {
        if (playerImg.complete && playerImg.width > 0) ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
        else { ctx.fillStyle = "red"; ctx.fillRect(player.x, player.y, player.width, player.height); }
    }
    ctx.restore();
}

function resetGame() {
    state.hp = CONFIG.hpMax; state.distance = 0; state.coins = 0; state.invulnerable = 0;
    player.x = 50; player.y = 100; player.dx = 0; player.dy = 0;
    platforms = []; coins = []; meteors = [];
    generateWorld(); 
}

// Запуск
update();
