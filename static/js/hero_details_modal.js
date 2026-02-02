
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
    let globalBuffs = [];   // GLOBAL_DPS_MULT
    let otherBuffs = [];    // CRIT_CHANCE, etc

    if (heroUps) {
        heroUps.forEach(upg => {
            if (gameState.upgrades.includes(upg.id)) {
                if (upg.type === 'SELF_DPS_MULT') {
                    damageWithBuffs *= upg.value;
                    personalBuffs.push(`Multiplica dano por ${upg.value}x`);
                } else if (upg.type === 'GLOBAL_DPS_MULT') {
                    const percentBonus = ((upg.value - 1) * 100).toFixed(0);
                    globalBuffs.push(`DPS de todos os heróis +${percentBonus}%`);
                } else if (upg.type === 'CRIT_CHANCE') {
                    const percentBonus = (upg.value * 100).toFixed(1);
                    otherBuffs.push(`Chance de crítico +${percentBonus}%`);
                }
            }
        });
    }

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

    // Skill 3 do Naruto: Rasengan - Efeitos elementais
    if (hero.id === 1 && gameState.missions.naruto_skill3?.completed) {
        specialConditions.push('Bosses recebem +35% de dano de Vento');
        specialConditions.push('Naruto ganha +10% de dano adicional contra inimigos de Raio');
    }

    // Skill 4 do Naruto: Chakra da Kyuubi
    if (hero.id === 1 && gameState.missions.naruto_skill4?.completed) {
        specialConditions.push('+50% de dano contra bosses com menos de 30% de HP');
    }

    // Montar HTML
    let html = `
        <div class="hero-details-header">
            <img src="${hero.fullBodyImg}" class="hero-details-portrait" alt="${hero.name}">
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
