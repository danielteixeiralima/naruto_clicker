# Sistema de Drop do Kenji - Rasengan

## Visão Geral

Sistema especial de desbloqueio da terceira skill do Naruto (Rasengan) através de drops do inimigo Kenji.

## Mecânica

### Drop do Fragmento
- **Inimigo:** Kenji (um dos 4 sprites de inimigos normais)
- **Chance de Drop:** 20% (0.20)
- **Item:** Fragmento de Chakra 🔮
- **Requisito:** Matar especificamente o inimigo Kenji

### Desbloqueio da Skill
- **Skill:** Rasengan (h1_u3)
- **Requisito:** Coletar 10 Fragmentos de Chakra
- **Efeito:** DPS de Todos +10%
- **Desbloqueio:** Automático ao coletar o 10º fragmento

## Implementação Técnica

### 1. GameState
```javascript
gameState.kenjiFragments = 0; // Contador de fragmentos
gameState.currentEnemyName = ""; // Nome do inimigo atual
```

### 2. Sistema de Drop (monterDeath)
```javascript
if (gameState.currentEnemyName === "Kenji" && Math.random() < 0.20) {
    // Drop do fragmento
    gameState.kenjiFragments++;
    
    // Verificar desbloqueio
    if (gameState.kenjiFragments >= 10 && !gameState.upgrades.includes('h1_u3')) {
        unlockNarutoRasengan();
    }
}
```

### 3. Renderização da Skill
- **Bloqueada:** Exibe progresso de fragmentos (X/10)
- **Disponível:** Quando kenjiFragments >= 10
- **Tooltip:** Mostra contador e instrução para matar Kenji

### 4. Verificação de Compra
```javascript
if (upgId === 'h1_u3') {
    if (gameState.kenjiFragments < 10) {
        return; // Bloqueia compra
    }
}
```

### 5. Persistência
- Fragmentos salvos em `localStorage`
- Carregados automaticamente ao iniciar o jogo

## Características

✅ **Drop Específico:** Apenas Kenji dropa fragmentos
✅ **Chance Balanceada:** 20% de chance por morte
✅ **Progresso Visível:** Tooltip mostra X/10 fragmentos
✅ **Desbloqueio Automático:** Skill liberada ao coletar 10
✅ **Notificação Especial:** Animação ao desbloquear Rasengan
✅ **Persistência:** Progresso salvo automaticamente

## Fluxo do Jogador

1. **Encontrar Kenji:** Jogar até spawnar o inimigo Kenji
2. **Matar Kenji:** 20% de chance de dropar fragmento
3. **Coletar Fragmentos:** Acumular até 10 fragmentos
4. **Desbloqueio:** Rasengan é automaticamente desbloqueado
5. **Compra:** Pode comprar a skill normalmente com ouro

## Diferenças das Outras Skills

| Aspecto | Skills Normais | Rasengan (h1_u3) |
|---------|---------------|------------------|
| Requisito | Nível do herói | 10 Fragmentos do Kenji |
| Desbloqueio | Ao atingir nível | Ao coletar fragmentos |
| Compra | Manual com ouro | Manual após desbloquear |
| Tooltip | Apenas custo | Custo + Progresso de fragmentos |

## Mensagens do Sistema

### Console
- `🔮 Fragmento de Chakra coletado! Total: X/10`
- `🌀 Desbloqueando Rasengan!`
- `✅ Rasengan desbloqueado com sucesso!`
- `❌ Você precisa de 10 Fragmentos de Chakra para desbloquear o Rasengan!`

### Notificações Visuais
1. **Drop de Fragmento:** Notificação padrão de item
2. **Desbloqueio:** Notificação especial com emoji 🌀 e duração de 5s

## Balanceamento

- **Chance de Kenji spawnar:** 1/4 (25%)
- **Chance de drop:** 20%
- **Chance efetiva por inimigo:** 5%
- **Média de inimigos para 10 fragmentos:** ~200 mortes
- **Tempo estimado:** Variável, depende do DPS do jogador
