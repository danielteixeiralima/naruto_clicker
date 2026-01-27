console.log('🎮 Game v3.js carregado - VERSÃO 5 - Boss Timer');
// Estado Global do Jogo
const gameState = {
    gold: 0,
    totalDps: 0,
    clickDamage: 1,
    critChance: 0, // Inicia em 0%
    clickCritMultiplier: 2,
    currentZone: 1,
    monstersKilledInZone: 0,
    heroes: [],
    upgrades: [], // IDs dos upgrades comprados
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
    },
    lastEnemyIndex: -1, // Para evitar repetição consecutiva
    inventory: [], // Mochila de itens
    bossTimer: 30, // Cronômetro de boss (30 segundos)
    bossTimerInterval: null // Referência ao intervalo do cronômetro
};

// Configurações
const TICKS_PER_SECOND = 10;
let autoSaveInterval;

// Inicialização
function initGame() {
    loadGame();
    setupHeroes();
    spawnMonster();
    renderArenas();
    updateUI();
    startGameLoop();
    setupEventListeners();

    // Auto-save a cada 30s
    autoSaveInterval = setInterval(saveGame, 30000);
}

// Configura lista de heróis baseada no game_data.js
function setupHeroes() {
    gameState.heroes = heroesData.map(heroData => {
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
    let dps = 0;
    let clickCtx = 1;
    let globalMulti = 1;
    let critChanceAcc = 0;

    // Processar Global Upgrades & Crit
    gameState.upgrades.forEach(uId => {
        // Encontrar info do upgrade
        for (const hid in heroUpgrades) {
            const upg = heroUpgrades[hid].find(u => u.id === uId);
            if (upg) {
                if (upg.type === 'GLOBAL_DPS_MULT') globalMulti *= upg.value;
                if (upg.type === 'CRIT_CHANCE') critChanceAcc += upg.value;
            }
        }
    });

    gameState.critChance = critChanceAcc;

    // Calcular DPS Individual com Multiplicadores Self
    gameState.heroes.forEach(hero => {
        let heroDps = hero.baseDps * hero.level;

        // Self Multipliers
        const heroUps = heroUpgrades[hero.id];
        if (heroUps) {
            heroUps.forEach(upg => {
                if (gameState.upgrades.includes(upg.id) && upg.type === 'SELF_DPS_MULT') {
                    heroDps *= upg.value;
                }
            });
        }

        hero.currentDps = heroDps;

        if (hero.id === 1) {
            clickCtx += hero.currentDps;
        } else {
            dps += hero.currentDps;
        }
    });

    gameState.totalDps = dps * globalMulti;
    gameState.clickDamage = clickCtx * globalMulti;
}

// Renderização da Lista de Heróis (Split Layout: Left Name/Img, Right Info)
function renderHeroesList() {
    const listContainer = document.getElementById('heroes-list');
    listContainer.innerHTML = '';

    for (let i = 0; i < gameState.heroes.length; i++) {
        const hero = gameState.heroes[i];
        let status = 'hidden';

        if (i === 0) status = 'revealed';
        else {
            const prevHero = gameState.heroes[i - 1];
            if (prevHero.level > 0) status = 'revealed';
            else {
                if (i === 1) status = 'mystery';
                else {
                    const prevPrevHero = gameState.heroes[i - 2];
                    if (prevPrevHero && prevPrevHero.level > 0) status = 'mystery';
                }
            }
        }

        if (status === 'hidden') break;

        const item = document.createElement('div');
        item.className = 'hero-card-split'; // Usando nova classe de layout
        if (status === 'mystery') item.classList.add('mystery-hero');
        item.id = `hero-${hero.id}`;

        const isLocked = status === 'mystery';

        let displayName = isLocked ? "???" : hero.name;
        // Se estiver bloqueado mostra placeholder, se não mostra a imagem definida (agora full body pro naruto)
        let displayImg = isLocked ? "https://placehold.co/100x100/000000/ffffff?text=?" : hero.img;
        let displayCost = formatNumber(hero.currentCost);
        let dpsVal = hero.currentDps;

        // HTML Structure

        // --- NAME OUTSIDE (Side-by-Side) ---
        // Se estiver bloqueado mostra ???
        // Se disponivel, mostra Nome + Sobrenome (ou apenas nome completo estilizado)
        // O usuario pediu "nome e sobrenome um ao lado do outro".
        // displayName já é "Naruto Uzumaki".

        let elementImg = "";
        if (!isLocked && hero.element) {
            elementImg = `<img src="./static/img/elements/${hero.element}.png" class="hero-element-icon" title="Elemento: ${hero.element}">`;
        }

        let nameTitleHTML = `
            <div class="hero-title-header">
                ${displayName} ${elementImg}
            </div>
        `;

        // --- COLUNA ESQUERDA: APENAS IMAGEM ---
        // Remover nome daqui de dentro
        // Aplicando foco dinâmico (inteligente) se definido, senão padrão topo
        let focusStyle = hero.focus ? `style="object-position: ${hero.focus}"` : '';

        let leftColHTML = `
            <div class="card-left-col">
                <div class="hero-image-wrapper">
                    <img src="${displayImg}" class="hero-full-body-img" alt="${displayName}" ${focusStyle}>
                </div>
            </div>
        `;

        // --- COLUNA DIREITA: NIVEL -> STATUS -> SKILLS -> BOTAO ---

        // 1. Nível
        let levelHTML = isLocked ? `<div class="hero-level-display">???</div>` : `<div class="hero-level-display" id="hero-level-text-${hero.id}">Nível ${hero.level}</div>`;

        // 2. Status (Dano/DPS) agora vai para o OVERLAY
        let statsHTML = "";
        if (isLocked) {
            statsHTML = `<div class="hero-stats-text">???</div>`;
        } else {
            // Calcular o incremento de DPS do próximo nível
            const nextLevelDps = hero.baseDps * Math.pow(1.07, hero.level + 1);
            const dpsIncrement = Math.abs(nextLevelDps - dpsVal);

            if (hero.id === 1) {
                statsHTML = `<div class="stat-line"><strong>Dano de Clique:</strong> <span id="hero-stat-val-${hero.id}">${formatNumber(dpsVal)}</span> <span class="dps-increment">+${formatNumber(dpsIncrement)}</span></div>`;
            } else {
                statsHTML = `<div class="stat-line"><strong>Dano por Segundo:</strong> <span id="hero-stat-val-${hero.id}">${formatNumber(dpsVal)}</span> <span class="dps-increment">+${formatNumber(dpsIncrement)}</span></div>`;
            }
        }

        // 4. Botão de Compra
        let buyButtonHTML = "";
        if (!isLocked) {
            buyButtonHTML = `
                <div class="hero-buy-btn" onclick="buyHero(${hero.id})">
                    <span class="buy-label">UPGRADE</span>
                    <span class="buy-value">💰 <span id="hero-cost-text-${hero.id}">${displayCost}</span></span>
                </div>
            `;
        } else {
            buyButtonHTML = `
                <div class="hero-buy-btn locked">
                    <span>BLOQUEADO</span>
                </div>
            `;
        }

        // 3. Skills (NOW BELOW UPGRADE)
        let skillsHTML = '<div class="hero-skills-row">';
        if (!isLocked) {
            const upgrades = heroUpgrades[hero.id];
            if (upgrades) {
                upgrades.forEach(upg => {
                    const isBought = gameState.upgrades.includes(upg.id);
                    const isUnlocked = hero.level >= upg.reqLevel;

                    let upgClass = 'skill-box';
                    if (isBought) upgClass += ' bought';
                    else if (isUnlocked) upgClass += ' available';
                    else upgClass += ' locked';

                    const upgCost = hero.baseCost * upg.costMultiplier;

                    // Handle Image Icons
                    const isImageIcon = upg.icon.startsWith('./') || upg.icon.startsWith('http');
                    const iconContent = isImageIcon ? `<img src="${upg.icon}" class="skill-img-icon">` : upg.icon;

                    skillsHTML += `
                        <div class="${upgClass}" 
                             id="upg-${upg.id}"
                             onclick="buyUpgrade('${upg.id}', ${upgCost}, ${hero.id})">
                             <div class="skill-icon">${iconContent}</div>
                             ${isBought ? '<div class="skill-check">✔</div>' : ''}
                             <div class="tooltip">
                                <strong>${upg.name}</strong><br>
                                ${upg.desc}<br>
                                Custo: ${formatNumber(upgCost)}
                             </div>
                        </div>
                    `;
                });
            }
        }
        skillsHTML += '</div>';

        let rightColHTML = `
            <div class="card-right-col">
                ${levelHTML}
                ${skillsHTML}
                ${buyButtonHTML}
            </div>
        `;

        let overlayHTML = `
            <div class="hero-stats-overlay">
                ${statsHTML}
            </div>
        `;

        item.innerHTML = nameTitleHTML + `
            <div class="hero-card-inner-split">
                ${leftColHTML}
                ${rightColHTML}
                ${overlayHTML}
            </div>
        `;

        if (isLocked) {
            item.classList.add('locked-mystery');
        }

        listContainer.appendChild(item);
    }
}

function updateHeroUI(heroId) {
    const hero = gameState.heroes.find(h => h.id === heroId);
    if (!hero) return;

    // Atualizar Nível
    const levelEl = document.getElementById(`hero-level-text-${hero.id}`);
    if (levelEl) levelEl.textContent = `Nível ${hero.level}`;

    // Atualizar Custo
    const costEl = document.getElementById(`hero-cost-text-${hero.id}`);
    if (costEl) costEl.textContent = formatNumber(hero.currentCost);

    // Atualizar Valor de Dano no Overlay
    const statEl = document.getElementById(`hero-stat-val-${hero.id}`);
    if (statEl) statEl.textContent = formatNumber(hero.currentDps);

    // Verificar se desbloqueou algum slot de upgrade (20, 40, 60, 80)
    // Se sim, precisamos re-renderizar para mostrar o quadradinho
    const upgradeThresholds = [20, 40, 60, 80];
    if (upgradeThresholds.includes(hero.level)) {
        renderHeroesList();
    }
}

// Mecânica de Compra de Heroi
function buyHero(heroId) {
    // Note: click event is handled via HTML onclick, arguments passed directly
    const hero = gameState.heroes.find(h => h.id === heroId);

    if (hero && gameState.gold >= hero.currentCost) {
        gameState.gold -= hero.currentCost;
        const oldLevel = hero.level;
        hero.level++;
        hero.currentCost = calculateCost(hero.baseCost, hero.level);
        hero.currentDps = hero.baseDps * hero.level;

        recalculateTotalDps();
        updateUI();

        if (oldLevel === 0) {
            renderHeroesList(); // Desbloqueia próximo
        } else {
            updateHeroUI(heroId);
        }
    }
}

// Mecânica de Compra de Upgrade
function buyUpgrade(upgId, cost, heroId) {
    event.stopPropagation(); // Impede borbulhar para compra de heroi
    if (gameState.upgrades.includes(upgId)) return;

    const hero = gameState.heroes.find(h => h.id === heroId);
    if (!hero) return;

    // Verificar requisitos
    const upg = heroUpgrades[heroId].find(u => u.id === upgId);
    if (!upg || hero.level < upg.reqLevel) return;

    if (gameState.gold >= cost) {
        gameState.gold -= cost;
        gameState.upgrades.push(upgId);
        recalculateTotalDps();
        updateUI();
        renderHeroesList();
    }
}

// Arena / Zoning Logic
function changeZone(direction) {
    if (direction === 'next') {
        if (gameState.currentZone < gameState.statistics.maxZone) {
            gameState.currentZone++;
            gameState.monstersKilledInZone = 0;
            spawnMonster();
            renderArenas();
            updateUI();
        }
    } else if (direction === 'prev') {
        if (gameState.currentZone > 1) {
            gameState.currentZone--;
            gameState.monstersKilledInZone = 0;
            spawnMonster();
            renderArenas();
            updateUI();
        }
    }
}

function renderArenas() {
    const container = document.getElementById('arenas-display');
    if (!container) return; // Safety
    container.innerHTML = '';

    let startZone = Math.max(1, gameState.currentZone - 2);
    let endZone = Math.max(gameState.currentZone + 2, gameState.statistics.maxZone + 1);

    if (endZone - startZone < 4) {
        endZone = startZone + 4;
    }

    for (let z = startZone; z <= endZone; z++) {
        if (z > gameState.statistics.maxZone + 1 && z > 1) continue;

        const box = document.createElement('div');
        box.className = 'arena-box';
        box.textContent = z;

        if (z === gameState.currentZone) {
            box.classList.add('active');
        }

        if (z > gameState.statistics.maxZone) {
            box.classList.add('locked');
        } else {
            box.onclick = () => {
                if (z !== gameState.currentZone) {
                    gameState.currentZone = z;
                    gameState.monstersKilledInZone = 0;
                    spawnMonster();
                    renderArenas();
                    updateUI();
                }
            };
        }
        container.appendChild(box);
    }
}


// Spawning de Monstros
function spawnMonster() {
    if (!gameState.currentMonster) return;

    // Verifica se é uma fase de boss (múltiplo de 5)
    const isBossZone = gameState.currentZone % 5 === 0;

    // Calcular HP baseado na progressão SEM contar fases de boss
    // Fases de boss não contam para a progressão
    // Exemplo: Fase 1, 2, 3, 4, 6, 7, 8, 9, 11, 12...
    // A fase 5 (boss) não conta, então fase 6 = progressão 5
    // A fase 10 (boss) não conta, então fase 11 = progressão 9

    let effectiveZone;
    if (isBossZone) {
        // Boss: usar a zona anterior (que não é boss)
        effectiveZone = gameState.currentZone - 1;
    } else {
        // Inimigo normal: calcular quantas fases de boss já passaram
        const bossPhasesPassed = Math.floor((gameState.currentZone - 1) / 5);
        effectiveZone = gameState.currentZone - bossPhasesPassed;
    }

    // Calcular HP do inimigo normal baseado na zona efetiva
    const zoneMultiplier = Math.pow(zoneData.hpMultiplier, effectiveZone - 1);
    const normalEnemyHp = Math.floor(zoneData.baseHp * zoneMultiplier);

    if (isBossZone) {
        // Boss tem multiplicador progressivo baseado na fórmula:
        // BossMultiplier(n) = 8 + (n × 0.1)
        // Com limite máximo de 20x
        let bossMultiplier = 8 + (gameState.currentZone * 0.1);
        bossMultiplier = Math.min(bossMultiplier, 20); // Limitar a 20x

        gameState.currentMonster.maxHp = Math.floor(normalEnemyHp * bossMultiplier);
    } else {
        // Inimigo normal
        gameState.currentMonster.maxHp = normalEnemyHp;
    }

    gameState.currentMonster.hp = gameState.currentMonster.maxHp;

    const randomName = monsterNames[Math.floor(Math.random() * monsterNames.length)];
    gameState.currentMonster.name = `${randomName} (Lv. ${gameState.currentZone})`;

    const nameEl = document.getElementById('monster-name');
    if (nameEl) nameEl.textContent = gameState.currentMonster.name;

    const imgEl = document.getElementById('monster-img');
    if (imgEl) {
        if (isBossZone) {
            // Boss: usa imagem especial
            imgEl.src = bossImage;

            // Iniciar cronômetro de boss
            startBossTimer();

            // Esconder contador de monstros e mostrar cronômetro
            const monstersKilledEl = document.querySelector('.zone-progress-info');
            if (monstersKilledEl) monstersKilledEl.style.display = 'none';

            const bossTimerEl = document.getElementById('boss-timer');
            if (bossTimerEl) bossTimerEl.style.display = 'block';
        } else {
            // Inimigo normal: lógica para evitar repetir o mesmo monstro em seguida
            let newIdx;
            do {
                newIdx = Math.floor(Math.random() * monsterImages.length);
            } while (newIdx === gameState.lastEnemyIndex && monsterImages.length > 1);

            gameState.lastEnemyIndex = newIdx;
            imgEl.src = monsterImages[newIdx];

            // Parar cronômetro se estiver rodando
            stopBossTimer();

            // Mostrar contador de monstros e esconder cronômetro
            const monstersKilledEl = document.querySelector('.zone-progress-info');
            if (monstersKilledEl) monstersKilledEl.style.display = 'block';

            const bossTimerEl = document.getElementById('boss-timer');
            if (bossTimerEl) bossTimerEl.style.display = 'none';
        }

        // Escalamento: a cada 5 fases aumenta 2% (1.02) para inimigos normais
        // Boss é sempre 120% do tamanho do inimigo anterior
        let sizeMultiplier;
        if (isBossZone) {
            // Boss = tamanho base da zona anterior * 1.2
            const previousZoneMultiplier = Math.pow(1.02, Math.floor((gameState.currentZone - 1) / 5));
            sizeMultiplier = previousZoneMultiplier * 1.2;
        } else {
            sizeMultiplier = Math.pow(1.02, Math.floor(gameState.currentZone / 5));
        }

        imgEl.style.transform = `scale(${sizeMultiplier})`;
    }

    updateMonsterUI();
}

function damageMonster(amount, isClick = false) {
    let finalDmg = amount;
    let isCrit = false;

    if (isClick && gameState.critChance > 0) {
        if (Math.random() < gameState.critChance) {
            finalDmg *= gameState.clickCritMultiplier;
            isCrit = true;
        }
    }

    gameState.currentMonster.hp -= finalDmg;
    if (gameState.currentMonster.hp < 0) gameState.currentMonster.hp = 0;

    if (isClick) {
        createDamageNumber(finalDmg, isCrit);
        animateMonsterShake();
        animateMonsterHitScale(); // Nova animação de aumento
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
    const goldDrop = Math.ceil(Math.random() * 3 * zoneMultiplier);

    gameState.gold += goldDrop;
    gameState.statistics.totalKills++;

    // Animação de moedas caindo
    createGoldCoins(goldDrop);

    // Verificar se é boss
    const isBoss = gameState.currentZone % 5 === 0;

    if (isBoss) {
        // Boss morto: parar cronômetro e avançar para próxima zona
        stopBossTimer();

        // Desbloquear próxima zona se for a zona máxima
        if (gameState.currentZone === gameState.statistics.maxZone) {
            gameState.statistics.maxZone++;
            renderArenas();
        }

        // Resetar contador de monstros mortos
        gameState.monstersKilledInZone = 0;
    } else {
        // Inimigo normal: incrementar contador
        gameState.monstersKilledInZone++;

        // Sistema de Drop de Itens
        // Apenas inimigos comuns (não bosses) nas arenas 10-15 com 2% de chance
        const isInDropZone = gameState.currentZone >= 10 && gameState.currentZone <= 15;
        const dropChance = 0.02; // 2%

        if (isInDropZone && Math.random() < dropChance) {
            // Item dropado: Veneno
            const droppedItem = {
                icon: './static/img/items/poison.png',
                name: 'Frasco de Veneno',
                description: 'Um veneno mortal usado por ninjas',
                count: 1,
                isImage: true
            };

            // Adicionar ao inventário
            if (addItemToInventory(droppedItem)) {
                // Mostrar notificação visual
                showItemDropNotification(droppedItem);
            }
        }

        // Desbloqueia próxima zona se matar o necessário na zona MAXIMA atual
        if (gameState.monstersKilledInZone >= zoneData.monstersPerZone) {
            if (gameState.currentZone === gameState.statistics.maxZone) {
                gameState.statistics.maxZone++;
                renderArenas();
                gameState.monstersKilledInZone = 0;
            } else {
                gameState.monstersKilledInZone = 0;
            }
        }
    }

    spawnMonster();
    updateUI();
}

// ===== SISTEMA DE CRONÔMETRO DE BOSS =====
function startBossTimer() {
    // Parar qualquer cronômetro anterior
    stopBossTimer();

    // Resetar para 30 segundos
    gameState.bossTimer = 30;
    updateBossTimerDisplay();

    // Iniciar intervalo de 1 segundo
    gameState.bossTimerInterval = setInterval(() => {
        gameState.bossTimer--;
        updateBossTimerDisplay();

        // Adicionar classe de aviso quando restarem 10 segundos ou menos
        const bossTimerEl = document.getElementById('boss-timer');
        if (gameState.bossTimer <= 10) {
            if (bossTimerEl) bossTimerEl.classList.add('warning');
        } else {
            if (bossTimerEl) bossTimerEl.classList.remove('warning');
        }

        // Quando chegar a 0, resetar vida do boss
        if (gameState.bossTimer <= 0) {
            resetBossHealth();
        }
    }, 1000);
}

function stopBossTimer() {
    if (gameState.bossTimerInterval) {
        clearInterval(gameState.bossTimerInterval);
        gameState.bossTimerInterval = null;
    }

    // Remover classe de aviso
    const bossTimerEl = document.getElementById('boss-timer');
    if (bossTimerEl) bossTimerEl.classList.remove('warning');
}

function updateBossTimerDisplay() {
    const bossTimerValueEl = document.getElementById('boss-timer-value');
    if (bossTimerValueEl) {
        bossTimerValueEl.textContent = gameState.bossTimer;
    }
}

function resetBossHealth() {
    // Resetar vida do boss para o máximo
    gameState.currentMonster.hp = gameState.currentMonster.maxHp;
    updateMonsterUI();

    // Reiniciar cronômetro
    startBossTimer();

    console.log('⏱️ Tempo esgotado! Vida do boss resetada.');
}

// Loop Principal
function startGameLoop() {
    setInterval(() => {
        if (gameState.totalDps > 0) {
            const dpsTick = gameState.totalDps / TICKS_PER_SECOND;
            if (dpsTick > 0 && gameState.currentMonster.hp > 0) {
                damageMonster(dpsTick, false);
            }
        }
        checkBuyButtons();
    }, 1000 / TICKS_PER_SECOND);
}

function checkBuyButtons() {
    // Apenas verifica se tem dinheiro para remover classe disabled nos herois?
    // Visualmente apenas. A logica é checada no clique.
    // Como agora usamos renderHeroesList com frequencia, pode ser redundante se nao otimizado.
    // Mas vamos manter simples:
    gameState.heroes.forEach(hero => {
        const item = document.getElementById(`hero-${hero.id}`);
        if (item) {
            const btn = item.querySelector('.hero-buy-btn');
            if (btn && !btn.classList.contains('locked')) { // locked class is for mystery
                if (gameState.gold >= hero.currentCost) {
                    btn.classList.remove('disabled');
                } else {
                    btn.classList.add('disabled');
                }
            }
        }
    });

    // Upgrades
    gameState.heroes.forEach(hero => {
        const ups = heroUpgrades[hero.id];
        if (ups) {
            ups.forEach(u => {
                const el = document.getElementById(`upg-${u.id}`);
                const cost = hero.baseCost * u.costMultiplier;
                if (el) {
                    if (gameState.gold >= cost) {
                        el.style.borderColor = "#00ff00"; // Highlight available?
                        // ou usar classe .available se level permitir.
                        // renderHeroesList ja define .available baseado em level.
                    } else {
                        // el.style.borderColor = "";
                    }
                }
            });
        }
    });
}

// Event Listeners
function setupEventListeners() {
    const clickTarget = document.getElementById('click-target');
    if (clickTarget) {
        clickTarget.addEventListener('mousedown', (e) => {
            e.preventDefault();
            damageMonster(gameState.clickDamage, true);
            const vis = clickTarget.querySelector('.monster-visual');
            if (vis) vis.style.transform = "scale(0.9)";
        });

        clickTarget.addEventListener('mouseup', () => {
            const vis = clickTarget.querySelector('.monster-visual');
            if (vis) vis.style.transform = "scale(1)";
        });
    }

    const prevBtn = document.getElementById('prev-zone');
    if (prevBtn) prevBtn.onclick = () => changeZone('prev');
    const nextBtn = document.getElementById('next-zone');
    if (nextBtn) nextBtn.onclick = () => changeZone('next');

    // Configurar eventos da mochila
    setupBackpackEventListeners();
}

// UI Helpers
function updateUI() {
    const goldEl = document.getElementById('player-gold');
    if (goldEl) goldEl.textContent = formatNumber(Math.floor(gameState.gold));

    const dpsEl = document.getElementById('total-dps');
    if (dpsEl) dpsEl.textContent = formatNumber(Math.floor(gameState.totalDps));

    const clickValEl = document.getElementById('click-damage-val');
    if (clickValEl) clickValEl.textContent = formatNumber(Math.floor(gameState.clickDamage));

    const mkEl = document.getElementById('monsters-killed');
    if (mkEl) mkEl.textContent = gameState.monstersKilledInZone;

    // Stats footer/header
    const skEl = document.getElementById('stat-killed');
    if (skEl) skEl.textContent = formatNumber(gameState.statistics.totalKills);
    const scEl = document.getElementById('stat-clicks');
    if (scEl) scEl.textContent = formatNumber(gameState.statistics.totalClicks);
    const smzEl = document.getElementById('stat-max-zone');
    if (smzEl) smzEl.textContent = gameState.statistics.maxZone;
}

function updateMonsterUI() {
    if (!gameState.currentMonster) return;
    const pct = (gameState.currentMonster.hp / gameState.currentMonster.maxHp) * 100;
    const fill = document.getElementById('hp-fill');
    if (fill) fill.style.width = `${pct}%`;

    const curHp = document.getElementById('current-hp');
    if (curHp) curHp.textContent = formatNumber(Math.ceil(gameState.currentMonster.hp));
}

function createDamageNumber(amount, isCrit) {
    const container = document.getElementById('damage-numbers-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = 'damage-number';
    if (isCrit) {
        el.classList.add('damage-crit');
    }
    el.textContent = formatNumber(Math.floor(amount));

    const x = 50 + (Math.random() * 20 - 10);
    const y = 50 + (Math.random() * 20 - 10);

    el.style.left = `${x}%`;
    el.style.top = `${y}%`;

    container.appendChild(el);

    setTimeout(() => el.remove(), 1000);
}

function animateMonsterShake() {
    const visual = document.querySelector('.monster-visual');
    if (visual) {
        visual.classList.remove('shake');
        void visual.offsetWidth;
        visual.classList.add('shake');
    }
}

function animateMonsterHitScale() {
    const visual = document.querySelector('.monster-visual');
    if (visual) {
        visual.classList.remove('hit-scale');
        void visual.offsetWidth; // Reflow
        visual.classList.add('hit-scale');
    }
}

function createGoldCoins(amount) {
    const container = document.getElementById('damage-numbers-container');
    if (!container) return;

    // Criar entre 3 e 8 moedas dependendo da quantidade de ouro
    const numCoins = Math.min(Math.max(3, Math.floor(amount / 10)), 8);

    for (let i = 0; i < numCoins; i++) {
        const coin = document.createElement('div');
        coin.className = 'gold-coin';
        coin.textContent = '💰';

        // Posição inicial aleatória ao redor do centro do monstro
        const x = 45 + (Math.random() * 10 - 5); // 40-50%
        const y = 40 + (Math.random() * 20 - 10); // 30-50%

        coin.style.left = `${x}%`;
        coin.style.top = `${y}%`;

        // Pequeno delay para cada moeda criar efeito cascata
        coin.style.animationDelay = `${i * 0.1}s`;

        container.appendChild(coin);

        // Remover após a animação
        setTimeout(() => coin.remove(), 1500 + (i * 100));
    }
}

function showItemDropNotification(item) {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = 'item-drop-notification';

    // Criar conteúdo
    const iconHTML = item.isImage
        ? `<img src="${item.icon}" alt="${item.name}">`
        : `<div style="font-size: 2.5em;">${item.icon}</div>`;

    notification.innerHTML = `
        ${iconHTML}
        <div class="drop-content">
            <div class="drop-text">ITEM ENCONTRADO!</div>
            <div class="item-name">${item.name}</div>
        </div>
    `;

    // Adicionar ao body
    document.body.appendChild(notification);

    // Remover após 3 segundos
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function formatNumber(num) {
    if (num >= 1000000000000) return (num / 1000000000000).toFixed(2) + 'T';
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return Math.floor(num).toString();
}

// Persistence
function saveGame() {
    const saveObj = {
        gold: gameState.gold,
        currentZone: gameState.currentZone,
        savedHeroes: gameState.heroes.map(h => ({ id: h.id, level: h.level })),
        upgrades: gameState.upgrades,
        statistics: gameState.statistics,
        inventory: gameState.inventory
    };
    localStorage.setItem('narutoClickerSave', JSON.stringify(saveObj));
}

function loadGame() {
    const saveStr = localStorage.getItem('narutoClickerSave');
    if (saveStr) {
        try {
            const saved = JSON.parse(saveStr);
            gameState.gold = saved.gold || 0;
            gameState.currentZone = saved.currentZone || 1;
            gameState.savedHeroes = saved.savedHeroes || [];
            gameState.upgrades = saved.upgrades || [];
            gameState.statistics = { ...gameState.statistics, ...saved.statistics };
            gameState.inventory = saved.inventory || [];
            if (!gameState.statistics.maxZone) gameState.statistics.maxZone = 1;
        } catch (e) {
            console.error("Erro save", e);
        }
    }
}

function resetGame() {
    if (confirm("TEM CERTEZA? Isso apagará todo o seu progresso para sempre!")) {
        localStorage.removeItem('narutoClickerSave');
        location.reload();
    }
}

// ===== SISTEMA DE MOCHILA =====
function setupBackpackEventListeners() {
    console.log('🎒 Configurando eventos da mochila...');
    const openBackpackBtn = document.getElementById('open-backpack');
    const closeBackpackBtn = document.getElementById('close-backpack');
    const backpackModal = document.getElementById('backpack-modal');

    if (!openBackpackBtn || !closeBackpackBtn || !backpackModal) {
        console.warn('⚠️ Elementos da mochila não encontrados');
        return;
    }
    console.log('✅ Elementos da mochila encontrados, configurando listeners...');

    // Abrir modal
    openBackpackBtn.addEventListener('click', () => {
        console.log('🎒 Abrindo mochila...');
        backpackModal.classList.add('active');
        console.log('Classes do modal:', backpackModal.className);
        renderInventory();
    });

    // Fechar modal
    closeBackpackBtn.addEventListener('click', () => {
        console.log('❌ Fechando mochila (botão X)...');
        backpackModal.classList.remove('active');
    });

    // Fechar ao clicar fora do modal (no backdrop)
    backpackModal.addEventListener('click', (e) => {
        if (e.target === backpackModal) {
            console.log('❌ Fechando mochila (clique fora)...');
            backpackModal.classList.remove('active');
        }
    });

    // Inicializar grid de inventário
    initializeInventory();

    // Inicializar painel admin
    setupAdminPanel();
}

function initializeInventory() {
    const inventoryGrid = document.getElementById('inventory-grid');
    const totalSlots = 40;

    for (let i = 0; i < totalSlots; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot empty';
        slot.dataset.slotIndex = i;
        inventoryGrid.appendChild(slot);
    }
}

function addItemToInventory(newItem) {
    // Verificar se o item já existe no inventário (mesmo nome)
    const existingItem = gameState.inventory.find(item => item && item.name === newItem.name);

    if (existingItem) {
        // Se já existe, aumentar a contagem
        existingItem.count += newItem.count;
    } else {
        // Se não existe, adicionar em um slot vazio
        const emptySlotIndex = gameState.inventory.findIndex(item => !item);

        if (emptySlotIndex !== -1) {
            // Tem slot vazio, adicionar lá
            gameState.inventory[emptySlotIndex] = newItem;
        } else if (gameState.inventory.length < 40) {
            // Não tem slot vazio mas ainda tem espaço
            gameState.inventory.push(newItem);
        } else {
            // Inventário cheio
            console.warn('⚠️ Inventário cheio! Não foi possível adicionar o item.');
            return false;
        }
    }

    // Salvar o jogo após adicionar item
    saveGame();
    return true;
}

function renderInventory() {
    const slots = document.querySelectorAll('.inventory-slot');

    slots.forEach((slot, index) => {
        const item = gameState.inventory[index];

        if (item) {
            slot.className = 'inventory-slot has-item';

            // Verificar se o ícone é uma imagem ou emoji
            const iconHTML = item.isImage
                ? `<img src="${item.icon}" class="item-icon-img" alt="${item.name}">`
                : `<span class="item-icon">${item.icon}</span>`;

            slot.innerHTML = `
                ${iconHTML}
                ${item.count > 1 ? `<span class="item-count">x${item.count}</span>` : ''}
            `;
            slot.title = `${item.name}\n${item.description}`;
        } else {
            slot.className = 'inventory-slot empty';
            slot.innerHTML = '';
            slot.title = 'Slot vazio';
        }
    });
}

// ===== ADMIN PANEL =====
function setupAdminPanel() {
    const adminTrigger = document.getElementById('admin-trigger');
    const adminModal = document.getElementById('admin-modal');
    const closeAdminBtn = document.getElementById('close-admin');
    const addGoldBtn = document.getElementById('add-gold-btn');
    const goldInput = document.getElementById('gold-input');

    // Abrir modal admin
    adminTrigger.addEventListener('click', () => {
        adminModal.style.display = 'flex';
        goldInput.value = '';
        goldInput.focus();
    });

    // Fechar modal admin
    closeAdminBtn.addEventListener('click', () => {
        adminModal.style.display = 'none';
    });

    // Fechar ao clicar fora
    adminModal.addEventListener('click', (e) => {
        if (e.target === adminModal) {
            adminModal.style.display = 'none';
        }
    });

    // Adicionar ouro
    addGoldBtn.addEventListener('click', () => {
        const amount = parseFloat(goldInput.value);
        if (amount && amount > 0) {
            gameState.gold += amount;
            updateUI();
            saveGame();
            goldInput.value = '';
            console.log(`✅ Admin: Adicionado ${formatNumber(amount)} de ouro`);
        }
    });

    // Enter para adicionar
    goldInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addGoldBtn.click();
        }
    });
}

window.onload = initGame;

