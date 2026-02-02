// ===== ANTI-ZOOM SYSTEM =====
// Força o jogo a manter sempre o mesmo tamanho visual independente do zoom do navegador

(function () {
    'use strict';

    // Detectar zoom do navegador
    function getZoomLevel() {
        return window.devicePixelRatio || 1;
    }

    // Compensar zoom aplicando scale inverso
    function compensateZoom() {
        const browserZoom = getZoomLevel();
        const gameContainer = document.querySelector('.game-container');

        if (!gameContainer) return;

        // Zoom base desejado do jogo (85% = 0.85)
        const gameZoom = 0.85;

        // Calcular scale inverso para compensar o zoom do navegador
        const inverseScale = 1 / browserZoom;

        // Aplicar transform para compensar zoom do navegador
        gameContainer.style.transform = `scale(${inverseScale})`;
        gameContainer.style.transformOrigin = 'top left';

        // Ajustar tamanho do container para compensar
        // Container precisa ser maior proporcionalmente ao zoom do navegador
        const containerWidth = 117.65 * browserZoom;
        const containerHeight = 117.65 * browserZoom;

        gameContainer.style.width = `${containerWidth}vw`;
        gameContainer.style.height = `${containerHeight}vh`;

        console.log(`🎮 Zoom compensado - Navegador: ${Math.round(browserZoom * 100)}%, Scale: ${inverseScale.toFixed(3)}, Container: ${containerWidth.toFixed(2)}vw x ${containerHeight.toFixed(2)}vh`);
    }

    // Executar ao carregar
    window.addEventListener('load', () => {
        setTimeout(compensateZoom, 100);
    });

    // Executar quando zoom mudar
    window.addEventListener('resize', compensateZoom);

    // Monitorar mudanças de zoom (fallback)
    let lastZoom = getZoomLevel();
    setInterval(() => {
        const currentZoom = getZoomLevel();
        if (Math.abs(currentZoom - lastZoom) > 0.01) {
            lastZoom = currentZoom;
            compensateZoom();
        }
    }, 500);

})();
