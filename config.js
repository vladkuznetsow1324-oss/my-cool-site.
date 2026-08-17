// --- [НАСТРОЙКИ И СОСТОЯНИЕ ИГРЫ] ---

const CONFIG = {
    playerSpeed: 7, 
    jumpPower: -16, 
    gravity: 0.8, 
    hpMax: 3, 
    shopPrice: 10
};

let state = {
    distance: 0, 
    coins: 0, 
    hp: CONFIG.hpMax,
    highScore: localStorage.getItem('highScore') || 0,
    invulnerable: 0, 
    cameraX: 0, 
    gameActive: false,
    coinAnimTimer: 0 
};

const playerImg = new Image();
playerImg.src = 'Photo1.jpg'; 

const player = { x: 50, y: 100, width: 55, height: 55, dx: 0, dy: 0, grounded: false };

let platforms = [];
let coins = [];
let meteors = [];
let stars = [];
const keys = {};

// Генерируем звезды один раз при загрузке
for(let i = 0; i < 120; i++) {
    stars.push({
        x: Math.random() * 2000, 
        y: Math.random() * 1000, 
        s: Math.random() * 2.5
    });
}
