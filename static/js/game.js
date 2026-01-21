// Estado Global do Jogo
const gameState = {
    gold: 0,
    totalDps: 0,
    clickDamage: 1,
    currentZone: 1,
    monstersKilledInZone: 0,
    heroes: [], // { id, level, currentDps, cost }
    currentMonster: {
        hp: 10,
        maxHp: 10,
        name: "Bandido",
        img: ""
    },
    statistics: {
        totalClicks: 0,
        totalKills: 0,
        maxZone: 1
    }
};

// Configurações
const TICKS_PER_SECOND = 10;
let autoSaveInterval;

// Inicialização
function initGame() {
    loadGame();
    setupHeroes();
    spawnMonster();
    updateUI();
    startGameLoop();
    setupEventListeners();

    // Auto-save a cada 30s
    autoSaveInterval = setInterval(saveGame, 30000);
}

// Configura lista de heróis baseada no game_data.js
function setupHeroes() {
    gameState.heroes = heroesData.map(heroData => {
        // Tenta carregar estado salvo ou inicia do zero
        const savedHero = gameState.savedHeroes ? gameState.savedHeroes.find(h => h.id === heroData.id) : null;
        return {
            ...heroData,
            level: savedHero ? savedHero.level : 0,
            currentCost: savedHero ? calculateCost(heroData.baseCost, savedHero.level) : heroData.baseCost,
            currentDps: savedHero ? heroData.baseDps * savedHero.level : 0
        };
    });
    recalculateTotalDps();
    renderHeroesList();
}

function calculateCost(baseCost, currentLevel) {
    return Math.floor(baseCost * Math.pow(1.07, currentLevel));
}

function recalculateTotalDps() {
    gameState.totalDps = gameState.heroes.reduce((sum, hero) => sum + hero.currentDps, 0);
    // Dano de clique é 1 + 1% do DPS total (mínimo 1)
    gameState.clickDamage = 1 + Math.ceil(gameState.totalDps * 0.01);
}

// Renderização da Lista de Heróis
function renderHeroesList() {
    const listContainer = document.getElementById('heroes-list');
    listContainer.innerHTML = '';

    gameState.heroes.forEach(hero => {
        const item = document.createElement('div');
        item.className = 'hero-item';
        item.id = `hero-${hero.id}`;
        item.dataset.id = hero.id;
        item.onclick = () => buyHero(hero.id);

        item.innerHTML = `
            <div class="hero-img" style="background-image: url('static/img/${hero.img}'); background-size: cover;"></div>
            <div class="hero-info">
                <div class="hero-name">${hero.name} <span class="hero-level">Nv. ${hero.level}</span></div>
                <div class="hero-stats">DPS: ${formatNumber(hero.baseDps * (hero.level || 1))} | +${formatNumber(hero.baseDps)} DPS/Lv</div>
                <div class="hero-cost">Custo: ${formatNumber(hero.currentCost)} Ryo</div>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

function updateHeroUI(heroId) {
    const hero = gameState.heroes.find(h => h.id === heroId);
    if (!hero) return;

    const item = document.getElementById(`hero-${heroId}`);
    if (item) {
        item.querySelector('.hero-level').textContent = `Nv. ${hero.level}`;
        item.querySelector('.hero-cost').textContent = `Custo: ${formatNumber(hero.currentCost)} Ryo`;

        // Verifica se pode comprar visualmente
        if (gameState.gold >= hero.currentCost) {
            item.classList.remove('disabled');
        } else {
            item.classList.add('disabled');
        }
    }
}

// Mecânica de Compra
function buyHero(heroId) {
    const hero = gameState.heroes.find(h => h.id === heroId);
    if (hero && gameState.gold >= hero.currentCost) {
        gameState.gold -= hero.currentCost;
        hero.level++;
        hero.currentCost = calculateCost(hero.baseCost, hero.level);
        hero.currentDps = hero.baseDps * hero.level;

        recalculateTotalDps();
        updateUI();
        renderHeroesList(); // Re-render para atualizar tudo
        logMessage(`Você contratou/treinou ${hero.name}!`);
    }
}

// Spawning de Monstros
function spawnMonster() {
    const zoneMultiplier = Math.pow(zoneData.hpMultiplier, gameState.currentZone - 1);
    gameState.currentMonster.maxHp = Math.floor(zoneData.baseHp * zoneMultiplier);
    gameState.currentMonster.hp = gameState.currentMonster.maxHp;

    const randomName = monsterNames[Math.floor(Math.random() * monsterNames.length)];
    gameState.currentMonster.name = `${randomName} (Lv. ${gameState.currentZone})`;

    // Atualiza visual
    document.getElementById('monster-name').textContent = gameState.currentMonster.name;
    // URL placeholder aleatória para monstros, em um app real usaria assets locais
    const monsterId = Math.floor(Math.random() * 10) + 1;
    document.getElementById('monster-img').src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${monsterId}.png`; // Placeholder temporário

    updateMonsterUI();
}

function damageMonster(amount, isClick = false) {
    gameState.currentMonster.hp -= amount;
    if (gameState.currentMonster.hp < 0) gameState.currentMonster.hp = 0;

    if (isClick) {
        createDamageNumber(amount, true);
        animateMonsterShake();
        gameState.statistics.totalClicks++;
    }

    if (gameState.currentMonster.hp <= 0) {
        monterDeath();
    }

    updateMonsterUI();
}

function monterDeath() {
    // Recompensa
    const zoneMultiplier = Math.pow(zoneData.coinsMultiplier, gameState.currentZone - 1);
    const goldDrop = Math.ceil(Math.random() * 5 * zoneMultiplier); // Base 1-5 * multi

    gameState.gold += goldDrop;
    gameState.statistics.totalKills++;
    gameState.monstersKilledInZone++;

    logMessage(`Monstro derrotado! +${formatNumber(goldDrop)} Ryo`);

    // Progressão de Zona
    if (gameState.monstersKilledInZone >= zoneData.monstersPerZone) {
        gameState.currentZone++;
        gameState.monstersKilledInZone = 0;
        if (gameState.currentZone > gameState.statistics.maxZone) {
            gameState.statistics.maxZone = gameState.currentZone;
            logMessage(`AVANÇOU PARA ZONA ${gameState.currentZone}!`);
        }
    }

    spawnMonster();
    updateUI();
}

// Loop Principal
function startGameLoop() {
    setInterval(() => {
        // Dano automático (DPS) aplicado a cada décimo de segundo
        if (gameState.totalDps > 0) {
            const dpsTick = gameState.totalDps / TICKS_PER_SECOND;
            if (dpsTick > 0 && gameState.currentMonster.hp > 0) {
                damageMonster(dpsTick, false);
            }
        }

        // Verifica botões habilitados
        checkBuyButtons();

    }, 1000 / TICKS_PER_SECOND);
}

function checkBuyButtons() {
    gameState.heroes.forEach(hero => {
        const item = document.getElementById(`hero-${hero.id}`);
        if (item) {
            if (gameState.gold >= hero.currentCost) {
                item.classList.remove('disabled');
            } else {
                item.classList.add('disabled');
            }
        }
    });
}

// Event Listeners
function setupEventListeners() {
    const clickTarget = document.getElementById('click-target');
    clickTarget.addEventListener('mousedown', () => {
        damageMonster(gameState.clickDamage, true);
        clickTarget.querySelector('.monster-visual').style.transform = "scale(0.9)";
    });

    clickTarget.addEventListener('mouseup', () => {
        clickTarget.querySelector('.monster-visual').style.transform = "scale(1)";
    });
}

// UI Helpers
function updateUI() {
    document.getElementById('player-gold').textContent = formatNumber(Math.floor(gameState.gold));
    document.getElementById('total-dps').textContent = formatNumber(Math.floor(gameState.totalDps));
    document.getElementById('click-damage').textContent = formatNumber(Math.floor(gameState.clickDamage));

    document.getElementById('current-zone').textContent = gameState.currentZone;
    document.getElementById('monsters-killed').textContent = gameState.monstersKilledInZone;

    document.getElementById('stat-killed').textContent = formatNumber(gameState.statistics.totalKills);
    document.getElementById('stat-clicks').textContent = formatNumber(gameState.statistics.totalClicks);
    document.getElementById('stat-max-zone').textContent = gameState.statistics.maxZone;
}

function updateMonsterUI() {
    const pct = (gameState.currentMonster.hp / gameState.currentMonster.maxHp) * 100;
    document.getElementById('hp-fill').style.width = `${pct}%`;
    document.getElementById('current-hp').textContent = formatNumber(Math.ceil(gameState.currentMonster.hp));
}

function createDamageNumber(amount, isCrit) {
    const container = document.getElementById('damage-numbers-container');
    const el = document.createElement('div');
    el.className = 'damage-number';
    if (isCrit && Math.random() < 0.05) { // 5% chance crit visual
        el.classList.add('damage-crit');
        amount *= 2; // Crítico visual simples
    }
    el.textContent = formatNumber(Math.floor(amount));

    // Posição aleatória perto do centro
    const x = 50 + (Math.random() * 20 - 10);
    const y = 50 + (Math.random() * 20 - 10);

    el.style.left = `${x}%`;
    el.style.top = `${y}%`;

    container.appendChild(el);

    setTimeout(() => el.remove(), 1000);
}

function animateMonsterShake() {
    const visual = document.querySelector('.monster-visual');
    visual.classList.remove('shake');
    void visual.offsetWidth; // Trigger reflow
    visual.classList.add('shake');
}

function logMessage(msg) {
    const log = document.getElementById('battle-log');
    const p = document.createElement('p');
    p.textContent = msg;
    log.prepend(p);
    if (log.children.length > 20) log.lastChild.remove();
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return Math.floor(num).toString();
}

// Persistence
function saveGame() {
    const saveObj = {
        gold: gameState.gold,
        currentZone: gameState.currentZone,
        savedHeroes: gameState.heroes.map(h => ({ id: h.id, level: h.level })),
        statistics: gameState.statistics
    };
    localStorage.setItem('narutoClickerSave', JSON.stringify(saveObj));
    // console.log("Jogo Salvo");
}

function loadGame() {
    const saveStr = localStorage.getItem('narutoClickerSave');
    if (saveStr) {
        try {
            const saved = JSON.parse(saveStr);
            gameState.gold = saved.gold || 0;
            gameState.currentZone = saved.currentZone || 1;
            gameState.savedHeroes = saved.savedHeroes || [];
            gameState.statistics = { ...gameState.statistics, ...saved.statistics };
            logMessage("Progresso carregado!");
        } catch (e) {
            console.error("Erro ao carregar save", e);
        }
    }
}

// Start
window.onload = initGame;
