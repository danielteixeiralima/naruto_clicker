
// ===== MODAL DE DETALHES DO HERÓI =====
function openHeroDetailsModal(heroId) {
    const hero = gameState.heroes.find(h => h.id === heroId);
    if (!hero) return;

    const modal = document.getElementById('hero-details-modal');
    const content = document.getElementById('hero-details-content');
    const title = document.getElementById('hero-details-title');

    // Definir título
    title.textContent = hero.name;

    // Calcular dano base com buffs
    let baseDamage = hero.currentDps;
    let damageWithBuffs = baseDamage;
    const heroUps = heroUpgrades[hero.id];

    // Coletar buffs por categoria
    let personalBuffs = []; // SELF_DPS_MULT
    let globalBuffsMap = {}; // Para concatenar buffs duplicados
    let otherBuffs = [];    // CRIT_CHANCE, etc

    // Variáveis para acumular buffs similares
    let clickMultiplier = 1;
    let dpsMultiplier = 1;
    let bossWindDamageBonus = 0; // Acumular % de dano de vento contra bosses

    if (heroUps) {
        heroUps.forEach(upg => {
            if (gameState.upgrades.includes(upg.id)) {
                if (upg.type === 'SELF_DPS_MULT') {
                    damageWithBuffs *= upg.value;
                    dpsMultiplier *= upg.value;
                } else if (upg.type === 'GLOBAL_DPS_MULT') {
                    const percentBonus = ((upg.value - 1) * 100);
                    const key = "DPS de todos os heróis";
                    globalBuffsMap[key] = (globalBuffsMap[key] || 0) + percentBonus;
                } else if (upg.type === 'CRIT_CHANCE') {
                    const percentBonus = (upg.value * 100).toFixed(1);
                    otherBuffs.push(`Chance de crítico +${percentBonus}%`);
                }
            }
        });
    }

    // Processar buffs das skills do Naruto
    if (hero.id === 1) {
        // Skill 1: Kage Bunshin no Jutsu (x2 Click)
        if (gameState.missions.naruto_skill1?.completed) {
            clickMultiplier *= 2;
        }

        // Skill 2: Tajuu Kage Bunshin (x2 Click)
        if (gameState.missions.naruto_skill2?.completed) {
            clickMultiplier *= 2;
        }

        // Skill 3: Rasengan (+35% dano de Vento contra bosses)
        if (gameState.missions.naruto_skill3?.completed) {
            bossWindDamageBonus += 35;
        }

        // Skill 4: Chakra da Kyuubi (x2.5 Click APENAS, +40% dano de Vento contra bosses)
        // NÃO dá DPS próprio, apenas Click Damage
        if (gameState.missions.naruto_skill4?.completed) {
            clickMultiplier *= 2.5;
            bossWindDamageBonus += 40;

            // Buff de dano crítico dinâmico: +5% a cada 20 níveis
            const critDamageFromLevel = Math.floor(hero.level / 20) * 5;
            if (critDamageFromLevel > 0) {
                personalBuffs.push(`Dano crítico +${critDamageFromLevel}%`);
            }
        }

        // Aplicar multiplicador de DPS ao damageWithBuffs
        damageWithBuffs *= dpsMultiplier;

        // Para o Naruto, aplicar também o multiplicador de clique ao dano
        damageWithBuffs *= clickMultiplier;

        // Adicionar multiplicadores aos buffs pessoais
        if (clickMultiplier > 1) {
            personalBuffs.push(`Dano de Clique: x${clickMultiplier.toFixed(0)}`);
        }

        // Adicionar buff global da Skill 2 (+1% DPS global a cada 10 níveis)
        if (gameState.missions.naruto_skill2?.completed) {
            const dpsPercentBonus = Math.floor(hero.level / 10);
            if (dpsPercentBonus > 0) {
                const key = "DPS de todos os heróis";
                globalBuffsMap[key] = (globalBuffsMap[key] || 0) + dpsPercentBonus;
            }
        }

        // Adicionar buff global da Skill 4
        if (gameState.missions.naruto_skill4?.completed) {
            const key = "DPS de todos os heróis";
            globalBuffsMap[key] = (globalBuffsMap[key] || 0) + 15;
        }
    }

    // Converter globalBuffsMap para array
    let globalBuffs = Object.entries(globalBuffsMap).map(([key, value]) =>
        `${key} +${value.toFixed(0)}%`
    );

    // Calcular dano elemental
    let elementalDamage = 0;
    let elementalCount = 0;
    let elementalColor = '#00ff00'; // Verde para vento
    let elementalName = 'Vento';
    let elementalIcon = '💨';

    if (hero.id === 1) { // Naruto
        if (gameState.missions.naruto_skill1?.completed) elementalCount++;
        if (gameState.missions.naruto_skill2?.completed) elementalCount++;
        if (gameState.missions.naruto_skill3?.completed) elementalCount++;
        if (gameState.missions.naruto_skill4?.completed) elementalCount++;

        if (elementalCount > 0) {
            elementalDamage = damageWithBuffs * (0.15 * elementalCount);
        }
    }

    // Condições especiais - apenas efeitos, sem origem
    let specialConditions = [];

    // Skill 3 do Naruto: Rasengan - Efeito contra inimigos de Raio
    if (hero.id === 1 && gameState.missions.naruto_skill3?.completed) {
        specialConditions.push('Naruto ganha +10% de dano adicional contra inimigos de Raio');
    }

    // Concatenar buff de dano de Vento contra bosses (Skill 3 + Skill 4)
    if (hero.id === 1 && bossWindDamageBonus > 0) {
        specialConditions.push(`Bosses recebem +${bossWindDamageBonus}% de dano de Vento`);
    }

    // Skill 4 do Naruto: Chakra da Kyuubi - Surto
    if (hero.id === 1 && gameState.missions.naruto_skill4?.completed) {
        specialConditions.push('+50% de dano contra bosses com menos de 30% de HP');
    }

    // Montar HTML
    let html = `
        <div class="hero-details-header">
            <img src="${hero.img}" class="hero-details-portrait" alt="${hero.name}">
            <div class="hero-details-name">
                <h3>${hero.name}</h3>
                <p>Nível ${hero.level}</p>
            </div>
        </div>

        <!-- Seção de Dano -->
        <div class="hero-details-section">
            <h4>⚔️ Atributos de Dano</h4>
            <div class="hero-details-stat">
                <span class="hero-details-stat-label">Dano Base:</span>
                <span class="hero-details-stat-value">${formatNumber(baseDamage)}</span>
            </div>
            <div class="hero-details-stat">
                <span class="hero-details-stat-label">Dano com Buffs:</span>
                <span class="hero-details-stat-value">${formatNumber(damageWithBuffs)}</span>
            </div>
            ${elementalDamage > 0 ? `
            <div class="hero-details-stat">
                <span class="hero-details-stat-label">${elementalIcon} Dano Elemental (${elementalName}):</span>
                <span class="hero-details-stat-value elemental-wind">+${formatNumber(elementalDamage)} (+${elementalCount * 15}%)</span>
            </div>
            ` : ''}
            <div class="hero-details-stat">
                <span class="hero-details-stat-label">💥 Dano Total:</span>
                <span class="hero-details-stat-value" style="color: #ffd700; font-size: 1.2em;">${formatNumber(damageWithBuffs + elementalDamage)}</span>
            </div>
        </div>

        <!-- Seção de Buffs Pessoais -->
        ${personalBuffs.length > 0 ? `
        <div class="hero-details-section">
            <h4>✨ Buffs Pessoais</h4>
            <p style="color: #aaa; font-size: 0.85em; margin: 0 0 10px 0;">Afetam apenas ${hero.name}</p>
            ${personalBuffs.map(buff => `
                <div class="hero-details-buff-item personal">
                    • ${buff}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Seção de Buffs Globais -->
        ${globalBuffs.length > 0 ? `
        <div class="hero-details-section">
            <h4>🌟 Buffs Globais</h4>
            <p style="color: #aaa; font-size: 0.85em; margin: 0 0 10px 0;">Afetam todos os heróis</p>
            ${globalBuffs.map(buff => `
                <div class="hero-details-buff-item global">
                    • ${buff}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Seção de Outros Buffs -->
        ${otherBuffs.length > 0 ? `
        <div class="hero-details-section">
            <h4>⚡ Outros Buffs</h4>
            ${otherBuffs.map(buff => `
                <div class="hero-details-buff-item other">
                    • ${buff}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Seção de Condições Especiais -->
        ${specialConditions.length > 0 ? `
        <div class="hero-details-section">
            <h4>🎯 Condições Especiais</h4>
            <p style="color: #aaa; font-size: 0.85em; margin: 0 0 10px 0;">Efeitos situacionais e bônus elementais</p>
            ${specialConditions.map(condition => `
                <div class="hero-details-condition-item">
                    • ${condition}
                </div>
            `).join('')}
        </div>
        ` : ''}
    `;

    content.innerHTML = html;
    modal.style.display = 'flex';
}

// Event listeners para o modal de detalhes do herói
function setupHeroDetailsEventListeners() {
    const modal = document.getElementById('hero-details-modal');
    const closeBtn = document.getElementById('close-hero-details');

    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }

    // Fechar ao clicar fora do modal
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Adicionar aos event listeners principais
document.addEventListener('DOMContentLoaded', () => {
    setupHeroDetailsEventListeners();
});
