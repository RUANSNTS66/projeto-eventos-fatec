/*
 * Brilho rosa que segue o mouse — home e dashboard administrativo.
 *
 * Arquivo aditivo: não altera motion.js, theme.js, home.js, scrambleTitle.js
 * nem qualquer outro script. Reaproveita o `.hero-aurora` já presente na home
 * (aria-hidden="true") e, no painel, escreve as variáveis no `<main class="admin">`.
 *
 * O movimento é propositalmente lento e com arrasto: uma camada segue o cursor
 * e outra vai atrás, como um líquido gosmento. Se o usuário preferir menos
 * movimento, o arquivo não faz nada e o CSS mantém um brilho estático.
 */
(function heroGlow() {
    "use strict";

    const publicHero = document.querySelector("body.site .hero");
    const adminMain = document.querySelector("body:not(.site) .admin");
    const hero = publicHero && publicHero.querySelector(".hero-aurora") ? publicHero : adminMain;
    if (!hero) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof window.requestAnimationFrame !== "function") return;

    let rect = null;
    let pointer = null;
    let targetX = 50;
    let targetY = 42;
    let currentX = targetX;
    let currentY = targetY;
    let trailX = targetX;
    let trailY = targetY;
    let raf = 0;

    const clamp = function (value, min, max) {
        return Math.min(max, Math.max(min, value));
    };

    function measure() {
        rect = hero.getBoundingClientRect();
    }

    function updateTarget() {
        if (!pointer || !rect || !rect.width || !rect.height) {
            targetX = 50;
            targetY = 42;
            return;
        }

        targetX = clamp(((pointer.x - rect.left) / rect.width) * 100, 0, 100);
        targetY = clamp(((pointer.y - rect.top) / rect.height) * 100, 0, 100);
    }

    function paint(stretch, angle) {
        hero.style.setProperty("--glow-x", currentX.toFixed(2) + "%");
        hero.style.setProperty("--glow-y", currentY.toFixed(2) + "%");
        hero.style.setProperty("--glow-trail-x", trailX.toFixed(2) + "%");
        hero.style.setProperty("--glow-trail-y", trailY.toFixed(2) + "%");
        hero.style.setProperty("--glow-stretch", stretch.toFixed(3));
        hero.style.setProperty("--glow-angle", angle.toFixed(1) + "deg");
    }

    function tick() {
        raf = 0;

        const previousX = currentX;
        const previousY = currentY;

        // Interpolação baixa = movimento arrastado, não um salto até o cursor.
        currentX += (targetX - currentX) * 0.045;
        currentY += (targetY - currentY) * 0.045;

        // O halo vai atrás do núcleo com ainda mais inércia.
        trailX += (currentX - trailX) * 0.022;
        trailY += (currentY - trailY) * 0.022;

        // Estica a gota na direção em que ela está se movendo.
        const width = rect && rect.width ? rect.width : 1;
        const height = rect && rect.height ? rect.height : 1;
        const velocityX = ((currentX - previousX) / 100) * width;
        const velocityY = ((currentY - previousY) / 100) * height;
        const speed = Math.min(Math.sqrt(velocityX * velocityX + velocityY * velocityY) / 45, 1);
        const angle = Math.atan2(velocityY, velocityX) * 180 / Math.PI;

        const settled =
            Math.abs(targetX - currentX) < 0.05 &&
            Math.abs(targetY - currentY) < 0.05 &&
            Math.abs(currentX - trailX) < 0.05 &&
            Math.abs(currentY - trailY) < 0.05;

        if (settled) {
            currentX = targetX;
            currentY = targetY;
            trailX = targetX;
            trailY = targetY;
            paint(1, angle);
            return;
        }

        paint(1 + speed * 0.3, angle);
        raf = window.requestAnimationFrame(tick);
    }

    function schedule() {
        if (!raf) raf = window.requestAnimationFrame(tick);
    }

    hero.addEventListener("pointermove", function (event) {
        pointer = { x: event.clientX, y: event.clientY };
        measure();
        updateTarget();
        schedule();
    }, { passive: true });

    // Ao sair do hero, a gota volta suavemente para o centro.
    hero.addEventListener("pointerleave", function () {
        pointer = null;
        targetX = 50;
        targetY = 42;
        schedule();
    }, { passive: true });

    window.addEventListener("scroll", function () {
        if (!pointer) return;
        measure();
        updateTarget();
        schedule();
    }, { passive: true });

    window.addEventListener("resize", function () {
        measure();
        updateTarget();
        schedule();
    }, { passive: true });

    paint(1, 0);
})();
