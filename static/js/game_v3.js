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
    bossTimerInterval: null, // Referência ao intervalo do cronômetro
    currentEnemyName: "", // Nome do inimigo atual para sistema de drop
    diamonds: 0, // Contador de diamantes
    zoneProgress: {}, // Rastreia quantos monstros foram mortos em cada zona (ex: {1: 10, 2: 5, 3: 10})
    missions: {
        naruto_skill1: {
            id: "naruto_skill1",
            purchased: false,
            completed: false,
            progress: 0,
            target: 150,
            cost: 5
        },
        naruto_skill2: {
            id: "naruto_skill2",
            purchased: false,
            completed: false,
            progress: 0,
            target: 30,
            cost: 15
        },
        naruto_skill3: {
            id: "naruto_skill3",
            purchased: false,
            completed: false,
            progress: 0,
            target: 80,
            cost: 40
        },
        naruto_skill4: {
            id: "naruto_skill4",
            purchased: false,
            completed: false,
            cost: 120,
            // Parte 1: Selos Quebrados
            part1: {
                completed: false,
                progress: 0,
                target: 100 // 100 Fragmentos de Selo Enfraquecido
            },
            // Parte 2: O Chakra Vermelho Responde ao Ódio
            part2: {
                completed: false,
                progress: 0,
                target: 8 // 8 Resíduos de Chakra da Kyūbi
            },
            // Parte 3: Controle Instável
            part3: {
                completed: false,
                goldOffered: false // 15.000.000 Gold entregue
            }
        }
    }
};

// Configurações
const TICKS_PER_SECOND = 10;
let autoSaveInterval;
let lastUpdateTime = Date.now(); // Rastrear última atualização para progresso offline

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
                <div class="hero-image-wrapper" ${!isLocked ? `onclick="openHeroDetailsModal(${hero.id})" style="cursor: pointer;"` : ''}>
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
                // Calcular dano bruto com buffs das skills
                let clickDamageWithBuffs = dpsVal;
                const heroUps = heroUpgrades[hero.id];
                if (heroUps) {
                    heroUps.forEach(upg => {
                        if (gameState.upgrades.includes(upg.id) && upg.type === 'SELF_DPS_MULT') {
                            clickDamageWithBuffs *= upg.value;
                        }
                    });
                }

                // Calcular dano elemental (Vento = +15% por skill completada)
                let elementalDamage = 0;
                let elementalCount = 0;
                if (gameState.missions.naruto_skill1?.completed) elementalCount++;
                if (gameState.missions.naruto_skill2?.completed) elementalCount++;
                if (gameState.missions.naruto_skill3?.completed) elementalCount++;
                if (gameState.missions.naruto_skill4?.completed) elementalCount++;

                if (elementalCount > 0) {
                    elementalDamage = clickDamageWithBuffs * (0.15 * elementalCount);
                }

                const nextLevelClickDamage = hero.baseDps * Math.pow(1.07, hero.level + 1);
                const clickIncrement = Math.abs(nextLevelClickDamage - dpsVal);

                statsHTML = `
                    <div class="stat-line">
                        <strong>Dano de Clique:</strong> 
                        <span id="hero-stat-val-${hero.id}">${formatNumber(clickDamageWithBuffs)}</span> 
                        <span class="dps-increment">+${formatNumber(clickIncrement)}</span>
                    </div>
                    ${elementalDamage > 0 ? `<div class="stat-line elemental-wind">
                        <strong>💨 Dano Elemental (Vento):</strong> 
                        <span style="color: #00ff00;">+${formatNumber(elementalDamage)}</span>
                    </div>` : ''}
                `;
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

                    // Lógica especial para Kage Bunshin (h1_u1) - Sistema de Missão
                    let isUnlocked;
                    let tooltipExtra = '';
                    let clickHandler = `buyUpgrade('${upg.id}', ${hero.baseCost * upg.costMultiplier}, ${hero.id})`;

                    if (upg.id === 'h1_u1') {
                        const mission = gameState.missions.naruto_skill1;
                        isUnlocked = mission.completed;

                        if (!mission.purchased && !mission.completed) {
                            // Missão não comprada - mostrar custo em diamantes
                            clickHandler = `openMissionModal('naruto_skill1')`;
                            tooltipExtra = `<br><br><div style="background: rgba(0,100,200,0.2); padding: 8px; border-radius: 5px; margin-top: 5px;">
                                <strong>🎯 Missão: "Treino dos Clones na Floresta"</strong><br>
                                <span style="color: #00d4ff;">💎 Custo: ${mission.cost} Diamantes</span><br><br>
                                <strong>📋 Objetivo:</strong><br>
                                Derrotar 150 inimigos normais<br>
                                nas fases 1-10 usando apenas clique<br><br>
                                <strong>💥 Bônus Elemental (Vento):</strong><br>
                                +15% de dano adicional
                            </div>`;
                        } else if (mission.purchased && !mission.completed) {
                            // Missão comprada mas não completada - mostrar progresso
                            clickHandler = `openMissionModal('naruto_skill1')`;
                            const progressPercent = Math.floor((mission.progress / mission.target) * 100);
                            tooltipExtra = `<br><br><div style="background: rgba(0,150,0,0.2); padding: 8px; border-radius: 5px; margin-top: 5px;">
                                <strong>🎯 Missão em Andamento</strong><br>
                                <div style="background: rgba(0,0,0,0.3); border-radius: 5px; height: 20px; margin: 5px 0; position: relative;">
                                    <div style="background: linear-gradient(90deg, #00ff00, #00aa00); width: ${progressPercent}%; height: 100%; border-radius: 5px;"></div>
                                    <span style="position: absolute; top: 2px; left: 50%; transform: translateX(-50%); font-weight: bold; text-shadow: 1px 1px 2px #000;">
                                        ${mission.progress}/${mission.target}
                                    </span>
                                </div>
                                <small>Derrote inimigos nas fases 1-10 usando apenas clique!</small>
                            </div>`;
                        } else if (mission.completed) {
                            // Missão completada - pode comprar normalmente
                            clickHandler = `openMissionModal('naruto_skill1')`;
                            tooltipExtra = `<br><br><span style="color: #00ff00;">✅ Missão Completada!</span>`;
                        }
                    } else if (upg.id === 'h1_u2') {
                        // Lógica especial para Tajuu Kage Bunshin (h1_u2) - Sistema de Missão
                        const mission = gameState.missions.naruto_skill2;
                        isUnlocked = mission.completed;

                        if (!mission.purchased && !mission.completed) {
                            // Missão não comprada - mostrar custo em diamantes
                            clickHandler = `openMissionModal('naruto_skill2')`;
                            tooltipExtra = `<br><br><div style="background: rgba(0,100,200,0.2); padding: 8px; border-radius: 5px; margin-top: 5px;">
                                <strong>🎯 Missão: "Exército de Clones"</strong><br>
                                <span style="color: #00d4ff;">💎 Custo: ${mission.cost} Diamantes</span><br><br>
                                <strong>📋 Objetivo:</strong><br>
                                Coletar 30 Pergaminhos Rasgados de Clone<br>
                                nas fases 20-40 (8% de chance)<br><br>
                                <strong>💥 Bônus Elemental (Vento):</strong><br>
                                +15% de dano adicional
                            </div>`;
                        } else if (mission.purchased && !mission.completed) {
                            // Missão comprada mas não completada - mostrar progresso
                            clickHandler = `openMissionModal('naruto_skill2')`;
                            const progressPercent = Math.floor((mission.progress / mission.target) * 100);
                            tooltipExtra = `<br><br><div style="background: rgba(0,150,0,0.2); padding: 8px; border-radius: 5px; margin-top: 5px;">
                                <strong>🎯 Missão em Andamento</strong><br>
                                <div style="background: rgba(0,0,0,0.3); border-radius: 5px; height: 20px; margin: 5px 0; position: relative;">
                                    <div style="background: linear-gradient(90deg, #00ff00, #00aa00); width: ${progressPercent}%; height: 100%; border-radius: 5px;"></div>
                                    <span style="position: absolute; top: 2px; left: 50%; transform: translateX(-50%); font-weight: bold; text-shadow: 1px 1px 2px #000;">
                                        ${mission.progress}/${mission.target}
                                    </span>
                                </div>
                                <small>Colete Pergaminhos nas fases 20-40!</small>
                            </div>`;
                        } else if (mission.completed) {
                            // Missão completada - pode comprar normalmente
                            clickHandler = `openMissionModal('naruto_skill2')`;
                            tooltipExtra = `<br><br><span style="color: #00ff00;">✅ Missão Completada!</span>`;
                        }
                    } else if (upg.id === 'h1_u3') {
                        // Lógica especial para Rasengan (h1_u3) - Sistema de Missão
                        let mission = gameState.missions.naruto_skill3;

                        // Verificação de segurança: se a missão não existe no save, criar
                        if (!mission) {
                            gameState.missions.naruto_skill3 = {
                                id: "naruto_skill3",
                                purchased: false,
                                completed: false,
                                progress: 0,
                                target: 80,
                                cost: 40
                            };
                            mission = gameState.missions.naruto_skill3; // Reatribuir após criar
                        }

                        isUnlocked = mission.completed;

                        if (!mission.purchased && !mission.completed) {
                            // Missão não comprada - mostrar custo em diamantes
                            clickHandler = `openMissionModal('naruto_skill3')`;
                            tooltipExtra = `<br><br><div style="background: rgba(0,100,200,0.2); padding: 8px; border-radius: 5px; margin-top: 5px;">
                                <strong>🎯 Missão: "Dominar a Rotação do Chakra"</strong><br>
                                <span style="color: #00d4ff;">💎 Custo: ${mission.cost} Diamantes</span><br><br>
                                <strong>📋 Objetivo:</strong><br>
                                Coletar 80 Núcleos de Chakra Espiral<br>
                                nas fases 50-80 (6% de chance)<br><br>
                                <strong>💥 Efeito:</strong><br>
                                DPS de todos os heróis +15%<br>
                                Bosses recebem +35% dano de Vento<br>
                                Naruto ganha +10% dano adicional contra inimigos de Raio
                            </div>`;
                        } else if (mission.purchased && !mission.completed) {
                            // Missão comprada mas não completada - mostrar progresso
                            clickHandler = `openMissionModal('naruto_skill3')`;
                            const progressPercent = Math.floor((mission.progress / mission.target) * 100);
                            tooltipExtra = `<br><br><div style="background: rgba(0,150,0,0.2); padding: 8px; border-radius: 5px; margin-top: 5px;">
                                <strong>🎯 Missão em Andamento</strong><br>
                                <div style="background: rgba(0,0,0,0.3); border-radius: 5px; height: 20px; margin: 5px 0; position: relative;">
                                    <div style="background: linear-gradient(90deg, #00ff00, #00aa00); width: ${progressPercent}%; height: 100%; border-radius: 5px;"></div>
                                    <span style="position: absolute; top: 2px; left: 50%; transform: translateX(-50%); font-weight: bold; text-shadow: 1px 1px 2px #000;">
                                        ${mission.progress}/${mission.target}
                                    </span>
                                </div>
                                <small>Colete Núcleos de Chakra Espiral nas fases 50-80!</small>
                            </div>`;
                        } else if (mission.completed) {
                            // Missão completada - pode comprar normalmente
                            clickHandler = `openMissionModal('naruto_skill3')`;
                            tooltipExtra = `<br><br><span style="color: #00ff00;">✅ Missão Completada!</span>`;
                        }
                    } else if (upg.id === 'h1_u4') {
                        // Lógica especial para Modo Sábio (h1_u4) - Missão Lendária com 3 Partes
                        let mission = gameState.missions.naruto_skill4;

                        // Verificação de segurança: se a missão não existe no save, criar
                        if (!mission) {
                            gameState.missions.naruto_skill4 = {
                                id: "naruto_skill4",
                                purchased: false,
                                completed: false,
                                cost: 120,
                                part1: { completed: false, progress: 0, target: 100 },
                                part2: { completed: false, bossDefeated: false },
                                part3: { completed: false, goldOffered: false }
                            };
                            mission = gameState.missions.naruto_skill4;
                        }

                        isUnlocked = mission.completed;

                        if (!mission.purchased && !mission.completed) {
                            // Missão não comprada - mostrar custo em diamantes
                            clickHandler = `openMissionModal('naruto_skill4')`;
                            tooltipExtra = `<br><br><div style="background: rgba(200,0,0,0.2); padding: 8px; border-radius: 5px; margin-top: 5px;">
                                <strong>🎯 Missão Lendária: "O Chakra Vermelho Começa a Vazar…"</strong><br>
                                <span style="color: #ff4444;">💎 Custo: ${mission.cost} Diamantes</span><br><br>
                                <strong>📋 Missão em 3 Partes:</strong><br>
                                Parte 1: Selos Quebrados<br>
                                Parte 2: O Chakra Vermelho Responde ao Ódio<br>
                                Parte 3: Controle Instável<br><br>
                                <strong>💥 Recompensa Final:</strong><br>
                                Chakra da Kyūbi ( 1 Cauda )
                            </div>`;
                        } else if (mission.purchased && !mission.completed) {
                            // Missão comprada mas não completada - mostrar progresso das partes
                            clickHandler = `openMissionModal('naruto_skill4')`;

                            let partsCompleted = 0;
                            if (mission.part1.completed) partsCompleted++;
                            if (mission.part2.completed) partsCompleted++;
                            if (mission.part3.completed) partsCompleted++;

                            tooltipExtra = `<br><br><div style="background: rgba(200,0,0,0.2); padding: 8px; border-radius: 5px; margin-top: 5px;">
                                <strong>🎯 Missão Lendária em Andamento</strong><br>
                                <strong>Progresso: ${partsCompleted}/3 Partes Completas</strong><br><br>
                                <small>Clique para ver detalhes</small>
                            </div>`;
                        } else if (mission.completed) {
                            // Missão completada - pode comprar normalmente
                            clickHandler = `openMissionModal('naruto_skill4')`;
                            tooltipExtra = `<br><br><span style="color: #ff4444;">✅ Missão Lendária Completada!</span>`;
                        }
                    } else {
                        isUnlocked = hero.level >= upg.reqLevel;
                    }

                    let upgClass = 'skill-box';

                    // Verificação especial para missões completadas
                    let missionCompleted = false;
                    if (upg.id === 'h1_u1' && gameState.missions.naruto_skill1?.completed) missionCompleted = true;
                    if (upg.id === 'h1_u2' && gameState.missions.naruto_skill2?.completed) missionCompleted = true;
                    if (upg.id === 'h1_u3' && gameState.missions.naruto_skill3?.completed) missionCompleted = true;
                    if (upg.id === 'h1_u4' && gameState.missions.naruto_skill4?.completed) missionCompleted = true;

                    // Verificação para missões compradas (em andamento)
                    let missionPurchased = false;
                    if (upg.id === 'h1_u1' && gameState.missions.naruto_skill1?.purchased && !gameState.missions.naruto_skill1?.completed) missionPurchased = true;
                    if (upg.id === 'h1_u2' && gameState.missions.naruto_skill2?.purchased && !gameState.missions.naruto_skill2?.completed) missionPurchased = true;
                    if (upg.id === 'h1_u3' && gameState.missions.naruto_skill3?.purchased && !gameState.missions.naruto_skill3?.completed) missionPurchased = true;
                    if (upg.id === 'h1_u4' && gameState.missions.naruto_skill4?.purchased && !gameState.missions.naruto_skill4?.completed) missionPurchased = true;

                    if (isBought || missionCompleted) upgClass += ' bought';
                    else if (missionPurchased) upgClass += ' available in-progress';
                    else if (isUnlocked) upgClass += ' available';
                    else {
                        upgClass += ' locked';
                        // Se for a skill 1 do Naruto e tiver diamantes suficientes, adicionar classe affordable
                        if (upg.id === 'h1_u1') {
                            const mission = gameState.missions.naruto_skill1;
                            if (!mission.purchased && !mission.completed && gameState.diamonds >= mission.cost) {
                                upgClass += ' affordable';
                            }
                        }
                        // Se for a skill 2 do Naruto e tiver diamantes suficientes, adicionar classe affordable
                        if (upg.id === 'h1_u2') {
                            const mission = gameState.missions.naruto_skill2;
                            if (!mission.purchased && !mission.completed && gameState.diamonds >= mission.cost) {
                                upgClass += ' affordable';
                            }
                        }
                        // Se for a skill 3 do Naruto e tiver diamantes suficientes, adicionar classe affordable
                        if (upg.id === 'h1_u3') {
                            const mission = gameState.missions.naruto_skill3;
                            if (mission && !mission.purchased && !mission.completed && gameState.diamonds >= mission.cost) {
                                upgClass += ' affordable';
                            }
                        }
                        // Se for a skill 4 do Naruto e tiver diamantes suficientes, adicionar classe affordable
                        if (upg.id === 'h1_u4') {
                            const mission = gameState.missions.naruto_skill4;
                            if (mission && !mission.purchased && !mission.completed && gameState.diamonds >= mission.cost) {
                                upgClass += ' affordable';
                            }
                        }
                    }

                    const upgCost = hero.baseCost * upg.costMultiplier;

                    // Handle Image Icons
                    const isImageIcon = upg.icon.startsWith('./') || upg.icon.startsWith('http');
                    const iconContent = isImageIcon ? `<img src="${upg.icon}" class="skill-img-icon">` : upg.icon;

                    // Todas as habilidades são clicáveis para abrir modal
                    const onclickAttr = `onclick="${clickHandler}"`;


                    // Adicionar atributos data para hover em missões completadas
                    let missionId = '';
                    let isCompleted = false;
                    if (upg.id === 'h1_u1') { missionId = 'naruto_skill1'; isCompleted = gameState.missions.naruto_skill1?.completed; }
                    if (upg.id === 'h1_u2') { missionId = 'naruto_skill2'; isCompleted = gameState.missions.naruto_skill2?.completed; }
                    if (upg.id === 'h1_u3') { missionId = 'naruto_skill3'; isCompleted = gameState.missions.naruto_skill3?.completed; }
                    if (upg.id === 'h1_u4') { missionId = 'naruto_skill4'; isCompleted = gameState.missions.naruto_skill4?.completed; }

                    const dataAttrs = missionId ? `data-mission-id="${missionId}" data-completed="${isCompleted}"` : '';

                    skillsHTML += `
                        <div class="${upgClass}" 
                             id="upg-${upg.id}"
                             ${onclickAttr}
                             ${dataAttrs}>
                             <div class="skill-icon">${iconContent}</div>
                             ${missionPurchased ? '<div class="skill-mission-active">📜</div>' : ''}
                             ${!isCompleted ? `<div class="tooltip">
                                <strong>${upg.name}</strong><br>
                                ${upg.desc}<br>
                                ${isUnlocked && !isBought ? 'Custo: ' + formatNumber(upgCost) : ''}${tooltipExtra}
                             </div>` : ''}
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
            // Carregar progresso da zona ou iniciar em 0
            gameState.monstersKilledInZone = gameState.zoneProgress[gameState.currentZone] || 0;
            spawnMonster();
            renderArenas();
            updateUI();
        }
    } else if (direction === 'prev') {
        if (gameState.currentZone > 1) {
            gameState.currentZone--;
            // Carregar progresso da zona ou iniciar em 0
            gameState.monstersKilledInZone = gameState.zoneProgress[gameState.currentZone] || 0;
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

    // Sempre mostrar 5 zonas: 2 antes, atual, 2 depois
    // Ajustar para as primeiras zonas (1 e 2)
    let startZone = Math.max(1, gameState.currentZone - 2);
    let endZone = startZone + 4; // Sempre 5 zonas no total

    // Se estamos nas primeiras zonas, ajustar para sempre ter 5 zonas
    if (startZone === 1) {
        endZone = 5;
    } else if (startZone === 2) {
        endZone = 6;
    }

    for (let z = startZone; z <= endZone; z++) {
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
        // Boss: calcular HP baseado na zona anterior (último inimigo normal)
        // Zona anterior considerando bosses já passados
        const previousZone = gameState.currentZone - 1;
        const bossPhasesPassed = Math.floor((previousZone - 1) / 5);
        effectiveZone = previousZone - bossPhasesPassed;
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

    // Para boss, usar nome genérico
    let enemyName = "Boss";
    let enemyIndex = -1;

    const nameEl = document.getElementById('monster-name');
    const levelEl = document.getElementById('monster-level');

    const imgEl = document.getElementById('monster-img');
    if (imgEl) {
        if (isBossZone) {
            // Boss: usa imagem especial
            imgEl.src = bossImage;
            enemyName = "Boss";

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
                newIdx = Math.floor(Math.random() * enemyData.length);
            } while (newIdx === gameState.lastEnemyIndex && enemyData.length > 1);

            gameState.lastEnemyIndex = newIdx;
            enemyIndex = newIdx;
            imgEl.src = enemyData[newIdx].img;
            enemyName = enemyData[newIdx].name;

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

    // Atualizar nome e nível do monstro
    gameState.currentMonster.name = enemyName;
    gameState.currentEnemyName = enemyName; // Salvar para sistema de drop
    if (nameEl) nameEl.textContent = enemyName;
    if (levelEl) levelEl.textContent = `Nível ${gameState.currentZone}`;

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

    // ========================================
    // PROGRESSO DA SKILL 1 - KAGE BUNSHIN NO JUTSU
    // ========================================
    // Contar qualquer morte de inimigo (não precisa ser por clique)
    const skill1Mission = gameState.missions.naruto_skill1;
    if (skill1Mission && skill1Mission.purchased && !skill1Mission.completed) {
        skill1Mission.progress++;

        // Verificar se completou a missão
        if (skill1Mission.progress >= skill1Mission.target) {
            skill1Mission.progress = skill1Mission.target;
            skill1Mission.completed = true;

            console.log('🎉 Missão Kage Bunshin no Jutsu completada!');

            // Desbloquear a habilidade automaticamente
            const upgradeId = 'h1_u1';
            if (!gameState.upgrades.includes(upgradeId)) {
                gameState.upgrades.push(upgradeId);
                console.log(`✅ Habilidade ${upgradeId} desbloqueada automaticamente!`);
            }

            // Mostrar modal de conclusão
            showMissionCompleteModal(
                'Kage Bunshin no Jutsu',
                '🌀',
                'Você completou a missão e desbloqueou o Kage Bunshin no Jutsu! A habilidade já está disponível para uso.'
            );

            renderHeroesList();
            saveGame();
        }
    }

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

        // Salvar progresso da zona
        gameState.zoneProgress[gameState.currentZone] = gameState.monstersKilledInZone;

        // Sistema de Drop de Itens (Veneno)
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

        // ========================================
        // SISTEMA DE DROP - PERGAMINHO RASGADO DE CLONE (SKILL 2 NARUTO)
        // ========================================
        // Apenas inimigos normais nas fases 20-40 com 8% de chance
        const mission2 = gameState.missions.naruto_skill2;
        if (mission2 && mission2.purchased && !mission2.completed) {
            const isInScrollDropZone = gameState.currentZone >= 20 && gameState.currentZone <= 40;
            const scrollDropChance = 0.08; // 8%

            if (isInScrollDropZone && Math.random() < scrollDropChance) {
                // Incrementar progresso da missão
                mission2.progress++;
                console.log(`🌀 Pergaminho Rasgado de Clone coletado! Progresso: ${mission2.progress}/${mission2.target}`);

                // Mostrar notificação visual
                const droppedItem = {
                    icon: '🌀',
                    name: 'Pergaminho Rasgado de Clone',
                    description: 'Um pergaminho antigo com técnicas de clones',
                    count: 1,
                    isImage: false
                };
                showItemDropNotification(droppedItem);

                // Verificar se completou a missão
                if (mission2.progress >= mission2.target) {
                    mission2.progress = mission2.target;
                    mission2.completed = true;
                    console.log('🎉 Missão Tajuu Kage Bunshin completada!');

                    // Desbloquear a habilidade automaticamente (comprar o upgrade)
                    const upgradeId = 'h1_u2'; // ID do upgrade Tajuu Kage Bunshin
                    if (!gameState.upgrades.includes(upgradeId)) {
                        gameState.upgrades.push(upgradeId);
                        console.log(`✅ Habilidade ${upgradeId} desbloqueada automaticamente!`);
                    }

                    // Mostrar modal de conclusão
                    showMissionCompleteModal(
                        'Tajuu Kage Bunshin',
                        '🌀',
                        'Você completou a missão e desbloqueou a habilidade Tajuu Kage Bunshin! A habilidade já está disponível para uso.'
                    );

                    renderHeroesList();
                    saveGame();
                }

                // Atualizar painel de missões se estiver visível
                renderActiveMissions();
            }
        }

        // ========================================
        // SISTEMA DE DROP - NÚCLEO DE CHAKRA ESPIRAL (SKILL 3 NARUTO - RASENGAN)
        // ========================================
        // Apenas inimigos normais nas fases 50-80 com 6% de chance
        const mission3 = gameState.missions.naruto_skill3;
        if (mission3 && mission3.purchased && !mission3.completed) {
            const isInCoreDropZone = gameState.currentZone >= 50 && gameState.currentZone <= 80;
            const coreDropChance = 0.06; // 6%

            if (isInCoreDropZone && Math.random() < coreDropChance) {
                // Incrementar progresso da missão
                mission3.progress++;
                console.log(`⚡ Núcleo de Chakra Espiral coletado! Progresso: ${mission3.progress}/${mission3.target}`);

                // Mostrar notificação visual
                const droppedItem = {
                    icon: '⚡',
                    name: 'Núcleo de Chakra Espiral',
                    description: 'Um núcleo pulsante de chakra em rotação',
                    count: 1,
                    isImage: false
                };
                showItemDropNotification(droppedItem);

                // Verificar se completou a missão
                if (mission3.progress >= mission3.target) {
                    mission3.progress = mission3.target;
                    mission3.completed = true;
                    console.log('🎉 Missão Rasengan completada!');

                    // Desbloquear a habilidade automaticamente (comprar o upgrade)
                    const upgradeId = 'h1_u3'; // ID do upgrade Rasengan
                    if (!gameState.upgrades.includes(upgradeId)) {
                        gameState.upgrades.push(upgradeId);
                        console.log(`✅ Habilidade ${upgradeId} desbloqueada automaticamente!`);
                    }

                    // Mostrar modal de conclusão
                    showMissionCompleteModal(
                        'Rasengan',
                        '⚡',
                        'Você completou a missão e desbloqueou o Rasengan! A habilidade já está disponível para uso.'
                    );

                    renderHeroesList();
                    saveGame();
                }

                // Atualizar painel de missões se estiver visível
                renderActiveMissions();
            }
        }

        // ========================================
        // SISTEMA DE DROP - SKILL 4 NARUTO (CHAKRA DA KYUUBI) - PARTE 1
        // ========================================
        const mission4 = gameState.missions.naruto_skill4;
        if (mission4 && mission4.purchased && !mission4.completed) {

            // PARTE 1: Fragmentos de Selo Enfraquecido (10% de chance em qualquer inimigo normal)
            // Apenas nas zonas 100-130
            const isInSealDropZone = gameState.currentZone >= 100 && gameState.currentZone <= 130;
            if (!mission4.part1.completed && isInSealDropZone && Math.random() < 0.10) {
                mission4.part1.progress++;
                console.log(`🩸 Fragmento de Selo Enfraquecido coletado! Progresso: ${mission4.part1.progress}/${mission4.part1.target}`);

                // Mostrar notificação visual
                const droppedItem = {
                    icon: '🩸',
                    name: 'Fragmento de Selo Enfraquecido',
                    description: 'Um fragmento do selo que contém a Kyuubi',
                    count: 1,
                    isImage: false
                };
                showItemDropNotification(droppedItem);

                // Verificar se completou a Parte 1
                if (mission4.part1.progress >= mission4.part1.target) {
                    mission4.part1.progress = mission4.part1.target;
                    mission4.part1.completed = true;
                    console.log('✅ Parte 1 Completa: Selos Quebrados!');

                    // Notificação de conclusão da parte
                    showMissionNotification('Chakra da Kyuubi', 'Parte 1 Completa: Selos Quebrados!');

                    renderHeroesList();
                    saveGame();
                }

                // Atualizar painel de missões
                renderActiveMissions();
            }
        }

        // Sistema de Drop de Diamantes (1% de chance para qualquer inimigo)
        if (Math.random() < 0.01) {
            const diamondsAmount = Math.floor(Math.random() * 3) + 1; // 1 a 3 diamantes
            gameState.diamonds += diamondsAmount;
            console.log(`💎 ${diamondsAmount} diamante(s) coletado(s)! Total: ${gameState.diamonds}`);

            // Criar animação de diamantes caindo
            createDiamondAnimation(diamondsAmount);
            updateUI();
        }

        // Desbloqueia próxima zona se matar o necessário na zona MAXIMA atual
        if (gameState.monstersKilledInZone >= zoneData.monstersPerZone) {
            // Limitar a 10 para não passar
            gameState.monstersKilledInZone = zoneData.monstersPerZone;
            gameState.zoneProgress[gameState.currentZone] = gameState.monstersKilledInZone;

            if (gameState.currentZone === gameState.statistics.maxZone) {
                gameState.statistics.maxZone++;
                renderArenas();
            }
        }
    }

    // ========================================
    // SISTEMA DE DROP - SKILL 4 NARUTO (CHAKRA DA KYUUBI) - PARTE 2
    // ========================================
    // PARTE 2: Resíduos de Chakra da Kyūbi (15% apenas em BOSSES nas zonas 100-200)
    // Esta lógica está FORA do if/else para que execute quando bosses forem derrotados
    const mission4 = gameState.missions.naruto_skill4;
    if (mission4 && mission4.purchased && !mission4.completed) {
        const isInKyuubiDropZone = gameState.currentZone >= 100 && gameState.currentZone <= 200;

        // Só pode progredir se a Parte 1 estiver completa E for um boss
        if (mission4.part1.completed && !mission4.part2.completed && isBoss && isInKyuubiDropZone) {
            console.log('🔍 DEBUG Skill 4 Parte 2:');
            console.log('  - Parte 1 completa?', mission4.part1.completed);
            console.log('  - Parte 2 completa?', mission4.part2.completed);
            console.log('  - Zona atual:', gameState.currentZone);
            console.log('  - É boss?', isBoss);
            console.log('  - Na zona de drop?', isInKyuubiDropZone);
            console.log('  - Part2 structure:', mission4.part2);

            // 15% de chance de drop
            if (Math.random() < 0.15) {
                mission4.part2.progress++;
                console.log(`🔴 Resíduo de Chakra da Kyūbi coletado! Progresso: ${mission4.part2.progress}/${mission4.part2.target}`);

                // Mostrar notificação visual
                const droppedItem = {
                    icon: '🔴',
                    name: 'Resíduo de Chakra da Kyūbi',
                    description: 'Chakra vermelho e denso da Raposa de Nove Caudas',
                    count: 1,
                    isImage: false
                };
                showItemDropNotification(droppedItem);

                // Verificar se completou a Parte 2
                if (mission4.part2.progress >= mission4.part2.target) {
                    mission4.part2.progress = mission4.part2.target;
                    mission4.part2.completed = true;
                    console.log('✅ Parte 2 Completa: O Chakra Vermelho Responde ao Ódio!');

                    // Notificação de conclusão da parte
                    showMissionNotification('Chakra da Kyuubi', 'Parte 2 Completa: Chakra Vermelho Liberado!');

                    renderHeroesList();
                    saveGame();
                }

                // Atualizar painel de missões
                renderActiveMissions();
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
        const now = Date.now();
        const deltaTime = now - lastUpdateTime;
        lastUpdateTime = now;

        // Se passou mais de 200ms desde a última atualização, processar tempo offline
        // (navegador throttle quando aba está inativa)
        if (deltaTime > 200 && gameState.totalDps > 0) {
            // Calcular quantos ticks aconteceram durante o tempo offline
            const offlineTicks = Math.floor(deltaTime / (1000 / TICKS_PER_SECOND));
            const ticksToProcess = Math.min(offlineTicks, 600); // Limitar a 60 segundos de progresso offline

            // Processar cada tick offline
            for (let i = 0; i < ticksToProcess; i++) {
                const dpsTick = gameState.totalDps / TICKS_PER_SECOND;
                if (dpsTick > 0 && gameState.currentMonster.hp > 0) {
                    damageMonster(dpsTick, false);
                }
            }
        } else {
            // Processamento normal
            if (gameState.totalDps > 0) {
                const dpsTick = gameState.totalDps / TICKS_PER_SECOND;
                if (dpsTick > 0 && gameState.currentMonster.hp > 0) {
                    damageMonster(dpsTick, false);
                }
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

    // Configurar eventos de missões
    setupMissionEventListeners();

    // Configurar eventos do modal de conclusão de missão
    setupMissionCompleteEventListeners();

    // Configurar eventos do painel admin
    setupAdminEventListeners();
}

// UI Helpers
function updateUI() {
    const goldEl = document.getElementById('player-gold');
    if (goldEl) goldEl.textContent = formatNumber(Math.floor(gameState.gold));

    const diamondsEl = document.getElementById('player-diamonds');
    if (diamondsEl) diamondsEl.textContent = formatNumber(gameState.diamonds);

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

    // Criar entre 1 e 3 moedas dependendo da quantidade de ouro
    const numCoins = Math.min(Math.max(1, Math.floor(amount / 30)), 3);

    for (let i = 0; i < numCoins; i++) {
        const coin = document.createElement('div');
        coin.className = 'gold-coin';
        coin.textContent = '💰';

        // Posição inicial aleatória ao redor do meio do monstro (mais para baixo)
        const x = 45 + (Math.random() * 10 - 5); // 40-50%
        const y = 50 + (Math.random() * 15 - 7.5); // 42.5-57.5% (meio do personagem)

        coin.style.left = `${x}%`;
        coin.style.top = `${y}%`;

        // Pequeno delay para cada moeda criar efeito cascata
        coin.style.animationDelay = `${i * 0.08}s`;

        container.appendChild(coin);

        // Remover após a animação (mais curto agora)
        setTimeout(() => coin.remove(), 800 + (i * 80));
    }
}

function createDiamondAnimation(amount) {
    const container = document.getElementById('damage-numbers-container');
    if (!container) return;

    // Criar diamantes baseado na quantidade dropada
    const numDiamonds = Math.min(amount, 5);

    for (let i = 0; i < numDiamonds; i++) {
        const diamond = document.createElement('div');
        diamond.className = 'diamond-drop';
        diamond.textContent = '💎';

        // Posição inicial aleatória ao redor do meio do monstro
        const x = 45 + (Math.random() * 10 - 5);
        const y = 50 + (Math.random() * 15 - 7.5);

        diamond.style.left = `${x}%`;
        diamond.style.top = `${y}%`;

        // Delay para efeito cascata
        diamond.style.animationDelay = `${i * 0.1}s`;

        container.appendChild(diamond);

        // Remover após a animação
        setTimeout(() => diamond.remove(), 1000 + (i * 100));
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

// Função para mostrar notificação de progresso de missão
function showMissionNotification(missionName, message) {
    const notification = document.createElement('div');
    notification.className = 'mission-notification';
    notification.innerHTML = `
        <div class="mission-notification-content">
            <div class="mission-notification-title">🔴 ${missionName}</div>
            <div class="mission-notification-message">${message}</div>
        </div>
    `;

    document.body.appendChild(notification);

    // Remover após 4 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 4000);
}


// Função para desbloquear o Rasengan do Naruto
function unlockNarutoRasengan() {
    console.log('🌀 Desbloqueando Rasengan!');

    // Adicionar a skill aos upgrades
    if (!gameState.upgrades.includes('h1_u3')) {
        gameState.upgrades.push('h1_u3');

        // Recalcular DPS com a nova skill
        recalculateTotalDps();
        updateUI();
        renderHeroesList();

        // Mostrar notificação especial
        const notification = document.createElement('div');
        notification.className = 'item-drop-notification rasengan-unlock';
        notification.innerHTML = `
            <div style="font-size: 3em;">🌀</div>
            <div class="drop-content">
                <div class="drop-text">SKILL DESBLOQUEADA!</div>
                <div class="item-name">Rasengan</div>
                <div style="font-size: 0.9em; margin-top: 5px;">DPS de Todos +15%</div>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);

        console.log('✅ Rasengan desbloqueado com sucesso!');
    }
}

function formatNumber(num) {
    // Números maiores que 1 trilhão usam notação científica
    if (num >= 1e15) {
        const exponent = Math.floor(Math.log10(num));
        const mantissa = num / Math.pow(10, exponent);
        return mantissa.toFixed(2) + '^' + exponent;
    }

    // Formatação padrão: k, M, B, T
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
        inventory: gameState.inventory,
        diamonds: gameState.diamonds, // Salvar diamantes
        missions: gameState.missions // Salvar missões
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
            gameState.diamonds = saved.diamonds || 0; // Carregar diamantes
            gameState.missions = saved.missions || gameState.missions; // Carregar missões

            // CORREÇÃO AUTOMÁTICA: Garantir estrutura correta da Skill 4
            if (gameState.missions.naruto_skill4) {
                // Corrigir part1
                if (!gameState.missions.naruto_skill4.part1) {
                    gameState.missions.naruto_skill4.part1 = { completed: false, progress: 0, target: 100 };
                }
                if (typeof gameState.missions.naruto_skill4.part1.progress === 'undefined') {
                    gameState.missions.naruto_skill4.part1.progress = 0;
                }
                if (typeof gameState.missions.naruto_skill4.part1.target === 'undefined') {
                    gameState.missions.naruto_skill4.part1.target = 100;
                }

                // Corrigir part2
                if (!gameState.missions.naruto_skill4.part2) {
                    gameState.missions.naruto_skill4.part2 = { completed: false, progress: 0, target: 8 };
                }
                if (typeof gameState.missions.naruto_skill4.part2.progress === 'undefined') {
                    console.log('🔧 [LOAD] Adicionando progress à part2');
                    gameState.missions.naruto_skill4.part2.progress = 0;
                }
                if (typeof gameState.missions.naruto_skill4.part2.target === 'undefined') {
                    console.log('🔧 [LOAD] Adicionando target à part2');
                    gameState.missions.naruto_skill4.part2.target = 8;
                }

                // Corrigir part3
                if (!gameState.missions.naruto_skill4.part3) {
                    gameState.missions.naruto_skill4.part3 = { completed: false, goldOffered: false };
                }
            }

            if (!gameState.statistics.maxZone) gameState.statistics.maxZone = 1;
        } catch (e) {
            console.error("Erro save", e);
        }
    }
}

function resetGame() {
    // Resetar sem confirmação
    localStorage.removeItem('narutoClickerSave');
    location.reload();
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


// ===== SISTEMA DE MISSÕES =====
function openMissionModal(missionId) {
    const modal = document.getElementById('mission-modal');
    const content = document.getElementById('mission-content');
    const titleText = document.getElementById('mission-title-text');
    const purchaseBtn = document.getElementById('purchase-mission-btn');

    if (missionId === 'naruto_skill1') {
        const mission = gameState.missions.naruto_skill1;

        titleText.textContent = '';

        // Se a missão estiver completada, mostrar apenas os buffs
        if (mission.completed) {
            content.innerHTML = `
                <div class="mission-details">
                    <h3>Kage Bunshin no Jutsu</h3>
                    <div style="text-align: center; color: #00ff00; margin-bottom: 15px;">
                        <strong>✅ Habilidade Desbloqueada!</strong>
                    </div>
                    
                    <div class="mission-section-effect">
                        <h4>📌 Efeito</h4>
                        <p><strong>Dano de Clique do Naruto x2</strong></p>
                    </div>
                    
                    <div class="mission-section bonus">
                        <h4>💥 Bônus Elemental (Vento)</h4>
                        <p><strong>Clique recebe +15% adicional</strong></p>
                    </div>
                </div>
            `;
            purchaseBtn.style.display = 'none';
        } else {
            // Missão não completada - mostrar requisitos e objetivos
            content.innerHTML = `
                <div class="mission-details">
                    <h3>Kage Bunshin no Jutsu</h3>
                    <div class="mission-section-effect">
                        <h4>📌 Efeito</h4>
                        <p><strong>Dano de Clique do Naruto x2</strong></p>
                    </div>
                    
                    <div class="mission-section bonus">
                        <h4>💥 Bônus Elemental (Vento)</h4>
                        <p><strong>Clique recebe +15% adicional</strong></p>
                    </div>
                    
                    <div class="mission-section objective">
                        <h4>📋 Objetivo da Missão</h4>
                        <p>Derrotar <strong>150 inimigos normais</strong><br>
                        entre as <strong>fases 1-10</strong><br>
                        usando <strong>apenas clique</strong> (sem DPS)</p>
                        ${mission.purchased ? `<br><div style="background: rgba(0,0,0,0.3); border-radius: 5px; height: 20px; margin: 5px 0; position: relative;">
                            <div style="background: linear-gradient(90deg, #00ff00, #00aa00); width: ${Math.floor((mission.progress / mission.target) * 100)}%; height: 100%; border-radius: 5px;"></div>
                            <span style="position: absolute; top: 2px; left: 50%; transform: translateX(-50%); font-weight: bold; text-shadow: 1px 1px 2px #000;">
                                ${mission.progress}/${mission.target}
                            </span>
                        </div>` : ''}
                    </div>
                    
                    ${!mission.purchased ? `
                    <div class="mission-cost">
                        <span class="cost-label">Custo da Missão:</span>
                        <span class="cost-value">💎 ${mission.cost} Diamantes</span>
                    </div>
                    
                    <div class="player-diamonds">
                        Seus Diamantes: <span class="${gameState.diamonds >= mission.cost ? 'enough' : 'not-enough'}">
                            💎 ${gameState.diamonds}
                        </span>
                    </div>
                    ` : ''}
                </div>
            `;

            // Configurar botão de compra
            if (!mission.purchased) {
                purchaseBtn.onclick = () => purchaseMission(missionId);
                purchaseBtn.disabled = gameState.diamonds < mission.cost;
                purchaseBtn.style.display = 'block';
            } else {
                purchaseBtn.style.display = 'none';
            }
        }
    } else if (missionId === 'naruto_skill2') {
        const mission = gameState.missions.naruto_skill2;

        titleText.textContent = '';

        // Se a missão estiver completada, mostrar apenas os buffs
        if (mission.completed) {
            content.innerHTML = `
                <div class="mission-details">
                    <h3>Tajuu Kage Bunshin</h3>
                    <div style="text-align: center; color: #00ff00; margin-bottom: 15px;">
                        <strong>✅ Habilidade Desbloqueada!</strong>
                    </div>
                    
                    <div class="mission-section-effect">
                        <h4>📌 Efeito</h4>
                        <p><strong>Dano de Clique x2</strong><br>
                        (stack com Skill 1 → total x4)<br><br>
                        Naruto ganha:<br>
                        <strong>+20% DPS próprio adicional</strong><br><br>
                        Cada 10 níveis do Naruto:<br>
                        <strong>+1% DPS global</strong></p>
                    </div>
                    
                    <div class="mission-section bonus">
                        <h4>💥 Bônus Elemental (Vento)</h4>
                        <p><strong>Clique recebe +15% adicional</strong></p>
                    </div>
                </div>
            `;
            purchaseBtn.style.display = 'none';
        } else {
            // Missão não completada - mostrar requisitos e objetivos
            content.innerHTML = `
                <div class="mission-details">
                    <h3>Tajuu Kage Bunshin</h3>
                    
                    <div class="mission-section-effect">
                        <h4>📌 Efeito</h4>
                        <p><strong>Dano de Clique x2 novamente</strong><br>
                        (stack com Skill 1 → total x4)<br><br>
                        Naruto ganha:<br>
                        <strong>+20% DPS próprio adicional</strong><br><br>
                        Cada 10 níveis do Naruto:<br>
                        <strong>+1% DPS global</strong></p>
                    </div>
                    
                    <div class="mission-section bonus">
                        <h4>💥 Bônus Elemental (Vento)</h4>
                        <p><strong>Clique recebe +15% adicional</strong></p>
                    </div>
                    
                    <div class="mission-section objective">
                        <h4>📋 Objetivo da Missão</h4>
                        <p>Dropar item de missão:<br>
                        <strong>🌀 Pergaminho Rasgado de Clone</strong><br><br>
                        Dropa apenas em <strong>fases 20–40</strong><br>
                        Chance: <strong>8% por inimigo morto</strong><br>
                        Precisa de: <strong>30 Pergaminhos</strong></p>
                        ${mission.purchased ? `<br><div style="background: rgba(0,0,0,0.3); border-radius: 5px; height: 20px; margin: 5px 0; position: relative;">
                            <div style="background: linear-gradient(90deg, #00ff00, #00aa00); width: ${Math.floor((mission.progress / mission.target) * 100)}%; height: 100%; border-radius: 5px;"></div>
                            <span style="position: absolute; top: 2px; left: 50%; transform: translateX(-50%); font-weight: bold; text-shadow: 1px 1px 2px #000;">
                                ${mission.progress}/${mission.target}
                            </span>
                        </div>` : ''}
                    </div>
                    
                    ${!mission.purchased ? `
                    <div class="mission-cost">
                        <span class="cost-label">Custo da Missão:</span>
                        <span class="cost-value">💎 ${mission.cost} Diamantes</span>
                    </div>
                    
                    <div class="player-diamonds">
                        Seus Diamantes: <span class="${gameState.diamonds >= mission.cost ? 'enough' : 'not-enough'}">
                            💎 ${gameState.diamonds}
                        </span>
                    </div>
                    ` : ''}
                </div>
            `;

            // Configurar botão de compra
            if (!mission.purchased) {
                purchaseBtn.onclick = () => purchaseMission(missionId);
                purchaseBtn.disabled = gameState.diamonds < mission.cost;
                purchaseBtn.style.display = 'block';
            } else {
                purchaseBtn.style.display = 'none';
            }
        }
    } else if (missionId === 'naruto_skill3') {
        // Verificação de segurança: se a missão não existe no save, criar
        if (!gameState.missions.naruto_skill3) {
            gameState.missions.naruto_skill3 = {
                id: "naruto_skill3",
                purchased: false,
                completed: false,
                progress: 0,
                target: 80,
                cost: 40
            };
        }

        const mission = gameState.missions.naruto_skill3;

        titleText.textContent = '';

        // Se a missão estiver completada, mostrar apenas os buffs
        if (mission.completed) {
            content.innerHTML = `
                <div class="mission-details">
                    <h3>Rasengan</h3>
                    <div style="text-align: center; color: #00ff00; margin-bottom: 15px;">
                        <strong>✅ Habilidade Desbloqueada!</strong>
                    </div>
                    
                    <div class="mission-section-effect">
                        <h4>📌 Efeito</h4>
                        <p><strong>Buff Global + Dano Elemental</strong><br><br>
                        DPS de todos os heróis: <strong>+15%</strong><br>
                        Bosses recebem: <strong>+35% dano de Vento</strong><br>
                        Naruto ganha: <strong>+10% dano adicional contra inimigos de Raio</strong></p>
                    </div>
                </div>
            `;
            purchaseBtn.style.display = 'none';
        } else {
            // Missão não completada - mostrar requisitos e objetivos
            content.innerHTML = `
                <div class="mission-details">
                    <h3>Rasengan</h3>
                    
                    <div class="mission-section-effect">
                        <h4>📌 Efeito</h4>
                        <p><strong>Buff Global + Dano Elemental</strong><br><br>
                        DPS de todos os heróis: <strong>+15%</strong><br>
                        Bosses recebem: <strong>+35% dano de Vento</strong><br>
                        Naruto ganha: <strong>+10% dano adicional contra inimigos de Raio</strong></p>
                    </div>
                    
                    <div class="mission-section objective">
                        <h4>📋 Objetivo da Missão</h4>
                        <p>Coletar item de missão:<br>
                        <strong>🌀 Núcleo de Chakra Espiral</strong><br><br>
                        Dropa apenas entre as <strong>fases 50–80</strong><br>
                        Chance: <strong>6% por inimigo</strong><br>
                        Precisa de: <strong>80 Núcleos</strong></p>
                        ${mission.purchased ? `<br><div style="background: rgba(0,0,0,0.3); border-radius: 5px; height: 20px; margin: 5px 0; position: relative;">
                            <div style="background: linear-gradient(90deg, #00ff00, #00aa00); width: ${Math.floor((mission.progress / mission.target) * 100)}%; height: 100%; border-radius: 5px;"></div>
                            <span style="position: absolute; top: 2px; left: 50%; transform: translateX(-50%); font-weight: bold; text-shadow: 1px 1px 2px #000;">
                                ${mission.progress}/${mission.target}
                            </span>
                        </div>` : ''}
                    </div>
                    
                    ${!mission.purchased ? `
                    <div class="mission-cost">
                        <span class="cost-label">Custo da Missão:</span>
                        <span class="cost-value">💎 ${mission.cost} Diamantes</span>
                    </div>
                    
                    <div class="player-diamonds">
                        Seus Diamantes: <span class="${gameState.diamonds >= mission.cost ? 'enough' : 'not-enough'}">
                            💎 ${gameState.diamonds}
                        </span>
                    </div>
                    ` : ''}
                </div>
            `;

            // Configurar botão de compra
            if (!mission.purchased) {
                purchaseBtn.onclick = () => purchaseMission(missionId);
                purchaseBtn.disabled = gameState.diamonds < mission.cost;
                purchaseBtn.style.display = 'block';
            } else {
                purchaseBtn.style.display = 'none';
            }
        }
    } else if (missionId === 'naruto_skill4') {
        // Verificação de segurança
        if (!gameState.missions.naruto_skill4) {
            gameState.missions.naruto_skill4 = {
                id: "naruto_skill4",
                purchased: false,
                completed: false,
                cost: 120,
                part1: { completed: false, progress: 0, target: 100 },
                part2: { completed: false, progress: 0, target: 8 },
                part3: { completed: false, goldOffered: false }
            };
        }

        // CORREÇÃO AUTOMÁTICA: Atualizar target da parte 1 de 12 para 100
        if (gameState.missions.naruto_skill4.part1 && gameState.missions.naruto_skill4.part1.target === 12) {
            console.log('🔧 Corrigindo target da skill 4 parte 1: 12 → 100');
            gameState.missions.naruto_skill4.part1.target = 100;
            saveGame();
        }

        // CORREÇÃO AUTOMÁTICA: Garantir que part2 tenha progress e target
        if (gameState.missions.naruto_skill4.part2) {
            if (typeof gameState.missions.naruto_skill4.part2.progress === 'undefined') {
                console.log('🔧 Adicionando progress à part2');
                gameState.missions.naruto_skill4.part2.progress = 0;
            }
            if (typeof gameState.missions.naruto_skill4.part2.target === 'undefined') {
                console.log('🔧 Adicionando target à part2');
                gameState.missions.naruto_skill4.part2.target = 8;
            }
            saveGame();
        }

        const mission = gameState.missions.naruto_skill4;
        titleText.textContent = '';

        // Se a missão estiver completada, mostrar apenas os buffs
        if (mission.completed) {
            content.innerHTML = `
                <div class="mission-details">
                    <h3 style="color: #ff4444;">🔴 Chakra da Kyūbi ( 1 Cauda )</h3>
                    <p style="text-align: center; color: #ff4444; font-style: italic;">Missão Lendária — Ultimate Skill</p>
                    <div style="text-align: center; color: #00ff00; margin-bottom: 15px;">
                        <strong>✅ Habilidade Desbloqueada!</strong>
                    </div>
                    
                    <div class="mission-section-effect">
                        <h4>📌 Efeito</h4>
                        <p><strong>Ultimate Skill — Burst de Emergência (Genin)</strong><br><br>
                        <strong>Durante Boss Fight:</strong><br>
                        Clique do Naruto: <strong>+150% dano (x2.5)</strong><br>
                        DPS global do time: <strong>+15%</strong><br>
                        Bosses recebem: <strong>+40% dano de Vento</strong><br>
                        Dano Crítico: <strong>+5% a cada 20 níveis do Naruto</strong><br><br>
                        <strong>🔥 Quando o boss está abaixo de 30% HP:</strong><br>
                        Naruto entra em "surto"<br>
                        Clique do Naruto recebe mais <strong>+50% dano</strong></p>
                    </div>
                </div>
            `;
            purchaseBtn.style.display = 'none';
        } else {
            // Missão não completada - mostrar requisitos e objetivos
            // Determinar quantas partes mostrar
            let showPart2 = mission.part1.completed;
            let showPart3 = mission.part1.completed && mission.part2.completed;

            // Estilos para partes completadas
            const completedStyle = 'text-decoration: line-through; color: #00ff00;';
            const completedClass = mission.part1.completed ? completedStyle : '';
            const completed2Class = mission.part2.completed ? completedStyle : '';
            const completed3Class = mission.part3.completed ? completedStyle : '';

            content.innerHTML = `
                <div class="mission-details">
                    <h3 style="color: #ff4444;">🔴 Chakra da Kyūbi ( 1 Cauda )</h3>
                    <p style="text-align: center; color: #ff4444; font-style: italic;">Missão Lendária — Ultimate Skill</p>
                    
                    <div class="mission-section-effect">
                        <h4>📌 Efeito</h4>
                        <p><strong>Ultimate Skill — Burst de Emergência (Genin)</strong><br><br>
                        <strong>Durante Boss Fight:</strong><br>
                        Clique do Naruto: <strong>+150% dano (x2.5)</strong><br>
                        DPS global do time: <strong>+15%</strong><br>
                        Bosses recebem: <strong>+40% dano de Vento</strong><br>
                        Dano Crítico: <strong>+5% a cada 20 níveis do Naruto</strong><br><br>
                        <strong>🔥 Quando o boss está abaixo de 30% HP:</strong><br>
                        Naruto entra em "surto"<br>
                        Clique do Naruto recebe mais <strong>+50% dano</strong></p>
                    </div>
                    
                    <div class="mission-section objective">
                        <h4>📋 Missão: "O Chakra Vermelho Começa a Vazar…"</h4>
                        
                        <!-- Parte 1 -->
                        <div style="margin-bottom: 15px;">
                            <p style="${completedClass}"><strong>Parte 1/3 — Selos Quebrados</strong></p>
                            ${mission.purchased && !mission.part1.completed ? `
                                <div style="background: rgba(0,0,0,0.3); border-radius: 5px; height: 20px; margin: 5px 0; position: relative;">
                                    <div style="background: linear-gradient(90deg, #ff4444, #cc0000); width: ${Math.floor(((mission.part1.progress || 0) / (mission.part1.target || 100)) * 100)}%; height: 100%; border-radius: 5px;"></div>
                                    <span style="position: absolute; top: 2px; left: 50%; transform: translateX(-50%); font-weight: bold; text-shadow: 1px 1px 2px #000; font-size: 0.9em;">
                                        ${mission.part1.progress || 0}/${mission.part1.target || 100}
                                    </span>
                                </div>
                            ` : ''}
                            <p style="${completedClass}; font-size: 0.9em;">
                            ${mission.purchased ? `<strong>${mission.part1.progress || 0}/${mission.part1.target || 100}</strong><br>` : ''}
                            Dropar: <strong>🩸 Fragmento de Selo Enfraquecido</strong><br>
                            Chance de drop: <strong style="color: #ffd700;">10% ao derrotar inimigos</strong><br>
                            Meta: <strong>100 Fragmentos</strong></p>
                        </div>
                        
                        ${showPart2 ? `
                        <!-- Parte 2 -->
                        <div style="margin-bottom: 15px;">
                            <p style="${completed2Class}"><strong>Parte 2/3 — O Chakra Vermelho Responde ao Ódio</strong></p>
                            ${mission.purchased && !mission.part2.completed ? `
                                <div style="background: rgba(0,0,0,0.3); border-radius: 5px; height: 20px; margin: 5px 0; position: relative;">
                                    <div style="background: linear-gradient(90deg, #ff4444, #cc0000); width: ${Math.floor(((mission.part2.progress || 0) / (mission.part2.target || 8)) * 100)}%; height: 100%; border-radius: 5px;"></div>
                                    <span style="position: absolute; top: 2px; left: 50%; transform: translateX(-50%); font-weight: bold; text-shadow: 1px 1px 2px #000; font-size: 0.9em;">
                                        ${mission.part2.progress || 0}/${mission.part2.target || 8}
                                    </span>
                                </div>
                            ` : ''}
                            <p style="${completed2Class}; font-size: 0.9em;">
                            ${mission.purchased && showPart2 ? `<strong>${mission.part2.progress || 0}/${mission.part2.target || 8}</strong><br>` : ''}
                            Dropar: <strong>🔴 Resíduo de Chakra da Kyūbi</strong><br>
                            <strong style="color: #ffd700;">15% de chance</strong> ao derrotar bosses<br>
                            <strong>Apenas nas zonas 100-200</strong><br>
                            Meta: <strong>8 Resíduos</strong></p>
                        </div>
                        ` : ''}
                        
                        ${showPart3 ? `
                        <!-- Parte 3 -->
                        <div style="margin-bottom: 15px;">
                            <p style="${completed3Class}"><strong>Parte 3/3 — Controle Instável</strong></p>
                            <p style="${completed3Class}; font-size: 0.9em;">
                            Entregar: <strong>💰 15.000.000 Gold</strong><br>
                            ${!mission.part3.completed && mission.purchased ? `
                                <button onclick="offerGoldForKyuubi()" 
                                        style="background: linear-gradient(135deg, #ff4444, #cc0000); 
                                               color: white; border: 2px solid #990000; 
                                               padding: 8px 16px; border-radius: 5px; 
                                               cursor: pointer; font-weight: bold; margin-top: 5px;"
                                        ${gameState.gold < 15000000 ? 'disabled' : ''}>
                                    ${gameState.gold >= 15000000 ? '✅ Entregar Gold' : '❌ Gold Insuficiente'}
                                </button>
                            ` : ''}</p>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${!mission.purchased ? `
                    <div class="mission-cost">
                        <span class="cost-label">Custo da Missão:</span>
                        <span class="cost-value">💎 ${mission.cost} Diamantes</span>
                    </div>
                    
                    <div class="player-diamonds">
                        Seus Diamantes: <span class="${gameState.diamonds >= mission.cost ? 'enough' : 'not-enough'}">
                            💎 ${gameState.diamonds}
                        </span>
                    </div>
                    ` : ''}
                </div>
            `;

            // Configurar botão de compra
            if (!mission.purchased) {
                purchaseBtn.onclick = () => purchaseMission(missionId);
                purchaseBtn.disabled = gameState.diamonds < mission.cost;
                purchaseBtn.style.display = 'block';
            } else {
                purchaseBtn.style.display = 'none';
            }
        }
    }

    modal.classList.add('active');
}

function purchaseMission(missionId) {
    if (missionId === 'naruto_skill1') {
        const mission = gameState.missions.naruto_skill1;

        if (gameState.diamonds >= mission.cost) {
            gameState.diamonds -= mission.cost;
            mission.purchased = true;

            console.log('✅ Missão comprada! Comece a derrotar inimigos nas fases 1-10 usando apenas clique!');

            updateUI();
            saveGame();
            renderHeroesList();
            closeMissionModal();


        }
    } else if (missionId === 'naruto_skill2') {
        const mission = gameState.missions.naruto_skill2;

        if (gameState.diamonds >= mission.cost) {
            gameState.diamonds -= mission.cost;
            mission.purchased = true;

            console.log('✅ Missão Skill 2 comprada! Comece a coletar Pergaminhos Rasgados de Clone nas fases 20-40!');

            updateUI();
            saveGame();
            renderHeroesList();
            closeMissionModal();


        }
    } else if (missionId === 'naruto_skill3') {
        // Verificação de segurança: se a missão não existe no save, criar
        if (!gameState.missions.naruto_skill3) {
            gameState.missions.naruto_skill3 = {
                id: "naruto_skill3",
                purchased: false,
                completed: false,
                progress: 0,
                target: 80,
                cost: 40
            };
        }

        const mission = gameState.missions.naruto_skill3;

        if (gameState.diamonds >= mission.cost) {
            gameState.diamonds -= mission.cost;
            mission.purchased = true;

            console.log('✅ Missão Rasengan comprada! Comece a coletar Núcleos de Chakra Espiral nas fases 80-120!');

            updateUI();
            saveGame();
            renderHeroesList();
            closeMissionModal();


        }
    } else if (missionId === 'naruto_skill4') {
        // Verificação de segurança
        if (!gameState.missions.naruto_skill4) {
            gameState.missions.naruto_skill4 = {
                id: "naruto_skill4",
                purchased: false,
                completed: false,
                cost: 120,
                part1: { completed: false, progress: 0, target: 100 },
                part2: { completed: false, progress: 0, target: 8 },
                part3: { completed: false, goldOffered: false }
            };
        }

        const mission = gameState.missions.naruto_skill4;

        if (gameState.diamonds >= mission.cost) {
            gameState.diamonds -= mission.cost;
            mission.purchased = true;

            console.log('✅ Missão Lendária Chakra da Kyūbi comprada! Comece a coletar Fragmentos de Selo Enfraquecido nas fases 100-130!');

            updateUI();
            saveGame();
            renderHeroesList();
            closeMissionModal();


        }
    }
}

// Função para entregar gold na Parte 3 da Skill 4
function offerGoldForKyuubi() {
    const mission = gameState.missions.naruto_skill4;

    if (!mission || !mission.purchased) {
        console.log('❌ Erro: Missão não está ativa!');
        return;
    }

    if (!mission.part1.completed || !mission.part2.completed) {
        console.log('❌ Você precisa completar as Partes 1 e 2 primeiro!');
        return;
    }

    if (gameState.gold < 15000000) {
        console.log('❌ Gold insuficiente! Você precisa de 15.000.000 Gold.');
        return;
    }

    if (mission.part3.completed) {
        console.log('✅ Você já completou esta parte!');
        return;
    }

    // Entregar gold automaticamente
    gameState.gold -= 15000000;
    mission.part3.completed = true;
    mission.part3.goldOffered = true;

    // Verificar se todas as partes estão completas
    if (mission.part1.completed && mission.part2.completed && mission.part3.completed) {
        mission.completed = true;

        // Desbloquear a habilidade automaticamente
        const upgradeId = 'h1_u4';
        if (!gameState.upgrades.includes(upgradeId)) {
            gameState.upgrades.push(upgradeId);
            console.log(`✅ Habilidade ${upgradeId} desbloqueada automaticamente!`);
        }

        // Mostrar modal de conclusão
        showMissionCompleteModal(
            'Chakra da Kyūbi (1 Cauda)',
            '🔴',
            'Você completou a missão lendária e desbloqueou o Chakra da Kyūbi! A habilidade definitiva já está disponível para uso.'
        );
    }

    updateUI();
    saveGame();
    renderHeroesList();
    openMissionModal('naruto_skill4'); // Reabrir modal para atualizar
}

function closeMissionModal() {
    const modal = document.getElementById('mission-modal');
    modal.classList.remove('active');
}

function setupMissionEventListeners() {
    const closeBtn = document.getElementById('close-mission');
    const modal = document.getElementById('mission-modal');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeMissionModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeMissionModal();
            }
        });
    }
}

// ===== MODAL DE CONCLUSÃO DE MISSÃO =====
function showMissionCompleteModal(skillName, skillIcon, description) {
    const modal = document.getElementById('mission-complete-modal');
    const skillNameEl = document.getElementById('mission-complete-skill-name');
    const skillIconEl = document.getElementById('mission-complete-skill-icon');
    const descriptionEl = document.getElementById('mission-complete-description');

    if (skillNameEl) skillNameEl.textContent = skillName;
    if (skillIconEl) skillIconEl.textContent = skillIcon;
    if (descriptionEl) descriptionEl.textContent = description;

    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeMissionCompleteModal() {
    const modal = document.getElementById('mission-complete-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function setupMissionCompleteEventListeners() {
    const closeBtn = document.getElementById('close-mission-complete');
    const modal = document.getElementById('mission-complete-modal');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeMissionCompleteModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeMissionCompleteModal();
            }
        });
    }
}

// ========================================
// ADMIN PANEL - Event Listeners
// ========================================

function setupAdminEventListeners() {
    // Abrir/Fechar modal
    const adminTrigger = document.getElementById('admin-trigger');
    const adminModal = document.getElementById('admin-modal');
    const closeAdmin = document.getElementById('close-admin');

    if (adminTrigger) {
        adminTrigger.addEventListener('click', () => {
            adminModal.style.display = 'flex';
        });
    }

    if (closeAdmin) {
        closeAdmin.addEventListener('click', () => {
            adminModal.style.display = 'none';
        });
    }

    if (adminModal) {
        adminModal.addEventListener('click', (e) => {
            if (e.target === adminModal) {
                adminModal.style.display = 'none';
            }
        });
    }

    // Adicionar Gold
    const addGoldBtn = document.getElementById('add-gold-btn');
    const goldInput = document.getElementById('gold-input');
    if (addGoldBtn && goldInput) {
        addGoldBtn.addEventListener('click', () => {
            const amount = parseInt(goldInput.value) || 0;
            if (amount > 0) {
                addGold(amount);
                goldInput.value = '';
            }
        });
    }

    // Adicionar Diamantes
    const addDiamondsBtn = document.getElementById('add-diamonds-btn');
    const diamondsInput = document.getElementById('diamonds-input');
    if (addDiamondsBtn && diamondsInput) {
        addDiamondsBtn.addEventListener('click', () => {
            const amount = parseInt(diamondsInput.value) || 0;
            if (amount > 0) {
                addDiamonds(amount);
                diamondsInput.value = '';
            }
        });
    }

    // Definir DPS
    const setDpsBtn = document.getElementById('set-dps-btn');
    const dpsInput = document.getElementById('dps-input');
    if (setDpsBtn && dpsInput) {
        setDpsBtn.addEventListener('click', () => {
            const amount = parseInt(dpsInput.value) || 0;
            if (amount >= 0) {
                setDPS(amount);
                dpsInput.value = '';
            }
        });
    }

    // Definir Dano de Clique
    const setClickDamageBtn = document.getElementById('set-click-damage-btn');
    const clickDamageInput = document.getElementById('click-damage-input');
    if (setClickDamageBtn && clickDamageInput) {
        setClickDamageBtn.addEventListener('click', () => {
            const amount = parseInt(clickDamageInput.value) || 0;
            if (amount >= 0) {
                setClickDamage(amount);
                clickDamageInput.value = '';
            }
        });
    }

    // Desbloquear Skills Individuais
    const unlockSkill1 = document.getElementById('unlock-skill-1');
    const unlockSkill2 = document.getElementById('unlock-skill-2');
    const unlockSkill3 = document.getElementById('unlock-skill-3');
    const unlockSkill4 = document.getElementById('unlock-skill-4');

    if (unlockSkill1) unlockSkill1.addEventListener('click', () => unlockSkill('h1_u1'));
    if (unlockSkill2) unlockSkill2.addEventListener('click', () => unlockSkill('h1_u2'));
    if (unlockSkill3) unlockSkill3.addEventListener('click', () => unlockSkill('h1_u3'));
    if (unlockSkill4) unlockSkill4.addEventListener('click', () => unlockSkill('h1_u4'));

    // Desbloquear Todas do Naruto
    const unlockAllNaruto = document.getElementById('unlock-all-naruto');
    if (unlockAllNaruto) {
        unlockAllNaruto.addEventListener('click', () => unlockAllSkills('h1'));
    }

    // Bloquear Skills Individuais
    const lockSkill1 = document.getElementById('lock-skill-1');
    const lockSkill2 = document.getElementById('lock-skill-2');
    const lockSkill3 = document.getElementById('lock-skill-3');
    const lockSkill4 = document.getElementById('lock-skill-4');

    if (lockSkill1) lockSkill1.addEventListener('click', () => lockSkill('h1_u1', 'naruto_skill1'));
    if (lockSkill2) lockSkill2.addEventListener('click', () => lockSkill('h1_u2', 'naruto_skill2'));
    if (lockSkill3) lockSkill3.addEventListener('click', () => lockSkill('h1_u3', 'naruto_skill3'));
    if (lockSkill4) lockSkill4.addEventListener('click', () => lockSkill('h1_u4', 'naruto_skill4'));

    // Bloquear Todas do Naruto
    const lockAllNaruto = document.getElementById('lock-all-naruto');
    if (lockAllNaruto) {
        lockAllNaruto.addEventListener('click', () => lockAllSkills('h1'));
    }

    // Ir para Zona
    const goToZoneBtn = document.getElementById('go-to-zone-btn');
    const zoneInput = document.getElementById('zone-input');
    if (goToZoneBtn && zoneInput) {
        goToZoneBtn.addEventListener('click', () => {
            const zone = parseInt(zoneInput.value) || 0;
            if (zone >= 1) {
                goToZone(zone);
                zoneInput.value = '';
            }
        });
    }
}

// ========================================
// MODO ADMIN - Funções de Desenvolvimento
// ========================================

// Adicionar Gold
window.addGold = function (amount) {
    gameState.gold += amount;
    updateUI();
    saveGame();
    console.log(`💰 ${formatNumber(amount)} gold adicionado! Total: ${formatNumber(gameState.gold)}`);
};

// Adicionar Diamantes
window.addDiamonds = function (amount) {
    gameState.diamonds += amount;
    updateUI();
    saveGame();
    console.log(`💎 ${amount} diamantes adicionados! Total: ${gameState.diamonds}`);
};

// Definir DPS customizado
window.setDPS = function (amount) {
    gameState.totalDps = amount;
    updateUI();
    saveGame();
    console.log(`⚡ DPS definido para: ${formatNumber(amount)}`);
};

// Definir Dano de Clique customizado
window.setClickDamage = function (amount) {
    gameState.clickDamage = amount;
    updateUI();
    saveGame();
    console.log(`👆 Dano de clique definido para: ${formatNumber(amount)}`);
};

// Desbloquear habilidade específica
window.unlockSkill = function (skillId) {
    if (!gameState.upgrades.includes(skillId)) {
        gameState.upgrades.push(skillId);
        renderHeroesList();
        updateUI();
        saveGame();
        console.log(`✅ Habilidade ${skillId} desbloqueada!`);
    } else {
        console.log(`⚠️ Habilidade ${skillId} já está desbloqueada!`);
    }
};

// Desbloquear todas as habilidades de um herói
window.unlockAllSkills = function (heroId) {
    const upgrades = heroUpgrades[heroId];
    if (upgrades) {
        upgrades.forEach(upg => {
            if (!gameState.upgrades.includes(upg.id)) {
                gameState.upgrades.push(upg.id);
            }
        });
        renderHeroesList();
        updateUI();
        saveGame();
        console.log(`✅ Todas as habilidades do herói ${heroId} desbloqueadas!`);
    } else {
        console.log(`⚠️ Herói ${heroId} não encontrado!`);
    }
};

// Bloquear habilidade específica e resetar missão
window.lockSkill = function (skillId, missionId) {
    // Remover habilidade dos upgrades
    const index = gameState.upgrades.indexOf(skillId);
    if (index > -1) {
        gameState.upgrades.splice(index, 1);
    }

    // Resetar missão correspondente
    if (missionId && gameState.missions[missionId]) {
        gameState.missions[missionId].purchased = false;
        gameState.missions[missionId].completed = false;
        gameState.missions[missionId].progress = 0;
    }

    renderHeroesList();
    renderActiveMissions();
    updateUI();
    saveGame();
    console.log(`🔒 Habilidade ${skillId} bloqueada e missão ${missionId} resetada!`);
};

// Bloquear todas as habilidades de um herói
window.lockAllSkills = function (heroId) {
    const upgrades = heroUpgrades[heroId];
    if (upgrades) {
        upgrades.forEach(upg => {
            const index = gameState.upgrades.indexOf(upg.id);
            if (index > -1) {
                gameState.upgrades.splice(index, 1);
            }
        });

        // Resetar todas as missões do Naruto
        if (heroId === 'h1') {
            const missions = ['naruto_skill1', 'naruto_skill2', 'naruto_skill3', 'naruto_skill4'];
            missions.forEach(missionId => {
                if (gameState.missions[missionId]) {
                    gameState.missions[missionId].purchased = false;
                    gameState.missions[missionId].completed = false;
                    gameState.missions[missionId].progress = 0;
                }
            });
        }

        renderHeroesList();
        renderActiveMissions();
        updateUI();
        saveGame();
        console.log(`🔒 Todas as habilidades do herói ${heroId} bloqueadas e missões resetadas!`);
    } else {
        console.log(`⚠️ Herói ${heroId} não encontrado!`);
    }
};

// Ir para uma zona específica
window.goToZone = function (zoneNumber) {
    if (zoneNumber >= 1) {
        gameState.currentZone = zoneNumber;
        if (zoneNumber > gameState.statistics.maxZone) {
            gameState.statistics.maxZone = zoneNumber;
        }
        gameState.monstersKilledInZone = gameState.zoneProgress[zoneNumber] || 0;
        spawnMonster();
        renderArenas();
        updateUI();
        saveGame();
        console.log(`🗺️ Você foi para a zona ${zoneNumber}!`);
    } else {
        console.log(`⚠️ Número de zona inválido!`);
    }
};

// Completar missão específica
window.completeMission = function (missionId) {
    const mission = gameState.missions[missionId];
    if (mission) {
        mission.purchased = true;
        mission.completed = true;
        mission.progress = mission.target;

        // Desbloquear habilidade correspondente
        const skillMap = {
            'naruto_skill1': 'h1_u1',
            'naruto_skill2': 'h1_u2',
            'naruto_skill3': 'h1_u3',
            'naruto_skill4': 'h1_u4'
        };

        const skillId = skillMap[missionId];
        if (skillId && !gameState.upgrades.includes(skillId)) {
            gameState.upgrades.push(skillId);
        }

        renderHeroesList();
        renderActiveMissions();
        updateUI();
        saveGame();
        console.log(`✅ Missão ${missionId} completada e habilidade desbloqueada!`);
    } else {
        console.log(`⚠️ Missão ${missionId} não encontrada!`);
    }
};

// Mostrar comandos disponíveis
window.adminHelp = function () {
    console.log(`
🎮 ========== COMANDOS ADMIN ========== 🎮

💰 addGold(amount)           - Adicionar gold
💎 addDiamonds(amount)        - Adicionar diamantes
⚡ setDPS(amount)             - Definir DPS total
👆 setClickDamage(amount)     - Definir dano de clique
✅ unlockSkill(skillId)       - Desbloquear habilidade específica
   Exemplos: 'h1_u1', 'h1_u2', 'h1_u3', 'h1_u4'
🌟 unlockAllSkills(heroId)    - Desbloquear todas as habilidades de um herói
   Exemplos: 'h1' (Naruto), 'h2' (Sasuke), etc.
🗺️  goToZone(number)          - Ir para zona específica
🎯 completeMission(missionId) - Completar missão
   Exemplos: 'naruto_skill1', 'naruto_skill2', etc.

📖 adminHelp()                - Mostrar esta ajuda

========================================
    `);
};

console.log('🔧 Modo Admin ativado! Digite adminHelp() para ver os comandos disponíveis.');

// Comando de teste para Skill 4
window.testSkill4Drop = function () {
    const mission4 = gameState.missions.naruto_skill4;
    console.log('🔍 ========== TESTE SKILL 4 ==========');
    console.log('Missão comprada?', mission4.purchased);
    console.log('Missão completa?', mission4.completed);
    console.log('Parte 1:', mission4.part1);
    console.log('Parte 2:', mission4.part2);
    console.log('Zona atual:', gameState.currentZone);
    console.log('Zona 100-200?', gameState.currentZone >= 100 && gameState.currentZone <= 200);
    console.log('');

    if (!mission4.purchased) {
        console.log('❌ Missão não comprada!');
        return;
    }

    if (!mission4.part1.completed) {
        console.log('❌ Parte 1 não está completa!');
        console.log('💡 Complete a Parte 1 primeiro');
        return;
    }

    if (mission4.part2.completed) {
        console.log('✅ Parte 2 já está completa!');
        return;
    }

    // Forçar um drop
    mission4.part2.progress++;
    console.log('✅ Drop forçado! Novo progresso:', mission4.part2.progress + '/' + mission4.part2.target);
    saveGame();
    renderActiveMissions();

    const droppedItem = {
        icon: '🔴',
        name: 'Resíduo de Chakra da Kyūbi',
        description: 'Chakra vermelho e denso da Raposa de Nove Caudas',
        count: 1,
        isImage: false
    };
    showItemDropNotification(droppedItem);
    console.log('========================================');
};

