/*
 * ScrambleText no título da home — adaptado do demo oficial do GSAP.
 *
 * Arquivo aditivo: não altera motion.js, theme.js, home.js nem qualquer outro
 * script. Se o CDN falhar, o plugin não existir ou o usuário pedir menos
 * movimento, o título permanece exatamente como está no HTML.
 */
(function scrambleTitle() {
    "use strict";

    const first = document.getElementById("scramble-text-1");
    const second = document.getElementById("scramble-text-2");
    const caret = document.querySelector(".scramble-caret");

    if (!first || !second) return;
    if (typeof gsap === "undefined" || typeof ScrambleTextPlugin === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrambleTextPlugin);

    // Conjunto customizado: maiúsculas, minúsculas, números e símbolos.
    // (sem <, > ou & para não interferir no innerHTML usado pelo plugin)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%*+=?/|[]()-";

    gsap.timeline({ defaults: { ease: "none" }, delay: 0.05 })
        .to(first, {
            duration: 0.35,
            scrambleText: { text: "Onde sua turma", chars, speed: 2.6 }
        })
        .to(second, {
            duration: 0.65,
            scrambleText: { text: "encontra o próximo evento", chars, speed: 2.4 }
        })
        .call(function () {
            if (caret) caret.classList.add("is-done");
        });
})();
