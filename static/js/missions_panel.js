
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

    // CORREÇÃO AUTOMÁTICA: Atualizar target da skill 4 parte 1 de 12 para 100
    if (missions.naruto_skill4 && missions.naruto_skill4.part1) {
        if (missions.naruto_skill4.part1.target === 12) {
            console.log('🔧 Corrigindo target da skill 4 parte 1: 12 → 100');
            missions.naruto_skill4.part1.target = 100;
            saveGame(); // Salvar a correção
        }
    }

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
            let currentPart = 1;
            let currentProgress = 0;
            let currentTarget = 0;

            if (mission.part1.completed) {
                completedParts++;
                currentPart = 2;
            } else {
                currentProgress = mission.part1.progress || 0;
                currentTarget = mission.part1.target || 0;
            }

            if (mission.part2 && mission.part2.completed) {
                completedParts++;
                currentPart = 3;
            } else if (mission.part1.completed && !mission.part2?.completed) {
                currentProgress = mission.part2?.progress || 0;
                currentTarget = mission.part2?.target || 0;
            }

            if (mission.part3 && mission.part3.completed) {
                completedParts++;
            } else if (mission.part1.completed && mission.part2?.completed && !mission.part3?.completed) {
                currentPart = 3;
                currentProgress = 0;
                currentTarget = 1; // Parte 3 é entrega de gold
            }

            // Calcular progresso da parte atual
            const partProgressPercent = currentTarget > 0 ? Math.floor((currentProgress / currentTarget) * 100) : 0;

            html += `
                <div class="mission-item">
                    <div class="mission-item-header">
                        <div>
                            <div class="mission-item-title">${item.name}</div>
                            <div class="mission-item-hero">${item.hero}</div>
                        </div>
                    </div>
                <div class="mission-progress-bar">
                    <div class="mission-progress-fill" style="width: ${partProgressPercent}%"></div>
                    <div class="mission-progress-text">${currentProgress}/${currentTarget}</div>
                </div>
                <div class="mission-item-status">
                    ${!mission.part1.completed ? `Parte 1/3` :
                    !mission.part2.completed ? `Parte 2/3` :
                        !mission.part3.completed ? `Parte 3/3` : 'Completa!'}
                </div>
            </div>
            `;
        } else {
            // Para missões simples (skills 1, 2, 3)
            const progressPercent = Math.floor((mission.progress / mission.target) * 100);

            html += `
                <div class="mission-item">
                    <div class="mission-item-header">
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
                    ${progressPercent < 100 ? `${mission.progress}/${mission.target}` : 'Pronta para completar!'}
                </div>
            </div>
            `;
        }
    }

    container.innerHTML = html;
}
