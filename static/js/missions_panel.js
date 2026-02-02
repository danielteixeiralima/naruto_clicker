
// ========================================
// SISTEMA DE ABAS DO PAINEL DIREITO
// ========================================

function switchRightPanelTab(tabName) {
    // Remover classe active de todas as abas e conteúdos
    document.querySelectorAll('.tab-icon').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Adicionar classe active na aba e conteúdo selecionados
    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.getElementById(`${tabName}-tab-content`).classList.add('active');

    // Se for a aba de missões, renderizar a lista
    if (tabName === 'missions') {
        renderActiveMissions();
    }
}

// ========================================
// RENDERIZAR MISSÕES ATIVAS
// ========================================

function renderActiveMissions() {
    const container = document.getElementById('active-missions-list');
    if (!container) return;

    const missions = gameState.missions;
    const activeMissions = [];

    // Mapear missões para seus respectivos heróis e nomes
    const missionData = {
        naruto_skill1: { hero: 'Naruto', name: 'Kage Bunshin no Jutsu', icon: '🌀' },
        naruto_skill2: { hero: 'Naruto', name: 'Tajuu Kage Bunshin', icon: '🌀🌀' },
        naruto_skill3: { hero: 'Naruto', name: 'Rasengan', icon: '🌀' },
        naruto_skill4: { hero: 'Naruto', name: 'Chakra da Kyūbi ( 1 Cauda )', icon: '🔴' }
    };

    // Coletar missões ativas
    for (const [missionId, mission] of Object.entries(missions)) {
        if (mission.purchased && !mission.completed) {
            const data = missionData[missionId];
            if (data) {
                activeMissions.push({
                    id: missionId,
                    hero: data.hero,
                    name: data.name,
                    icon: data.icon,
                    mission: mission
                });
            }
        }
    }

    // Se não houver missões ativas
    if (activeMissions.length === 0) {
        container.innerHTML = `
            <div class="no-missions-message">
                Nenhuma missão ativa no momento.<br>
                <small>Compre habilidades especiais para desbloquear missões!</small>
            </div>
        `;
        return;
    }

    // Renderizar missões ativas
    let html = '';
    for (const item of activeMissions) {
        const mission = item.mission;

        // Para missões com múltiplas partes (skill 4)
        if (mission.part1) {
            let totalParts = 3;
            let completedParts = 0;
            if (mission.part1.completed) completedParts++;
            if (mission.part2 && mission.part2.completed) completedParts++;
            if (mission.part3 && mission.part3.completed) completedParts++;

            const progressPercent = Math.floor((completedParts / totalParts) * 100);

            html += `
                <div class="mission-item">
                    <div class="mission-item-header">
                        <span class="mission-item-icon">${item.icon}</span>
                        <div>
                            <div class="mission-item-title">${item.name}</div>
                            <div class="mission-item-hero">${item.hero}</div>
                        </div>
                    </div>
                    <div class="mission-progress-bar">
                        <div class="mission-progress-fill" style="width: ${progressPercent}%"></div>
                        <div class="mission-progress-text">${completedParts}/${totalParts} Partes</div>
                    </div>
                    <div class="mission-item-status">
                        ${!mission.part1.completed ? `Parte 1: ${mission.part1.progress}/${mission.part1.target}` :
                    !mission.part2.completed ? `Parte 2: ${mission.part2.progress || 0}/${mission.part2.target || 0}` :
                        !mission.part3.completed ? `Parte 3: Entregar Gold` : 'Completa!'}
                    </div>
                </div>
            `;
        } else {
            // Para missões simples (skills 1, 2, 3)
            const progressPercent = Math.floor((mission.progress / mission.target) * 100);

            html += `
                <div class="mission-item">
                    <div class="mission-item-header">
                        <span class="mission-item-icon">${item.icon}</span>
                        <div>
                            <div class="mission-item-title">${item.name}</div>
                            <div class="mission-item-hero">${item.hero}</div>
                        </div>
                    </div>
                    <div class="mission-progress-bar">
                        <div class="mission-progress-fill" style="width: ${progressPercent}%"></div>
                        <div class="mission-progress-text">${mission.progress}/${mission.target}</div>
                    </div>
                    <div class="mission-item-status">
                        ${progressPercent < 100 ? 'Em andamento...' : 'Pronta para completar!'}
                    </div>
                </div>
            `;
        }
    }

    container.innerHTML = html;
}
