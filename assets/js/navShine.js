/*
 * Brilho deslizante na navegação (painel e site).
 *
 * Arquivo aditivo: cria um único `<li class="nav-shine">` dentro da nav e o
 * move entre os itens. Não altera links, classes de estado, IDs, eventos nem
 * a lógica de páginas.
 *
 * Ao trocar de página, lembra onde estava na sessão e faz o brilho viajar do
 * item anterior até o ativo. Se não houver memória, ele entra pela esquerda.
 */
(function navShine() {
    "use strict";

    const nav = document.querySelector("body .header-menu .navigation");
    if (!nav) return;

    const items = Array.from(nav.querySelectorAll(".item"));
    if (!items.length) return;

    const activeLink = nav.querySelector(".link.active");
    const activeItem = activeLink ? activeLink.closest(".item") : items[0];
    if (!activeItem) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const storageKey = document.body.classList.contains("site") ? "siteNavAtivo" : "adminNavAtivo";

    const shine = document.createElement("li");
    shine.className = "nav-shine";
    shine.setAttribute("aria-hidden", "true");
    nav.appendChild(shine);

    let currentItem = activeItem;

    function place(item, instant) {
        currentItem = item;

        if (instant || reduce) shine.classList.add("is-instant");

        shine.style.width = item.offsetWidth + "px";
        shine.style.transform = "translateX(" + item.offsetLeft + "px)";

        if (instant || reduce) {
            void shine.offsetWidth; // força surgir no lugar certo, sem transição
            shine.classList.remove("is-instant");
        }
    }

    function show() {
        shine.classList.add("is-visible");
    }

    function remember(item) {
        try {
            window.sessionStorage.setItem(storageKey, item.textContent.trim());
        } catch (error) {
            /* storage bloqueado não é problema: só perde a animação de origem */
        }
    }

    let origin = null;
    try {
        const remembered = window.sessionStorage.getItem(storageKey);
        if (remembered) {
            origin = items.find(function (item) {
                return item.textContent.trim() === remembered;
            });
        }
    } catch (error) {
        origin = null;
    }

    if (origin && origin !== activeItem) {
        place(origin, true);
    } else {
        shine.style.width = "0px";
        shine.style.transform = "translateX(0px)";
    }

    items.forEach(function (item) {
        const link = item.querySelector(".link, .call-to-action");
        if (!link) return;

        function enter() {
            place(item);
            show();
        }

        item.addEventListener("mouseenter", enter);
        item.addEventListener("focusin", enter);

        link.addEventListener("click", function () {
            remember(item);
            place(item);
        });
    });

    nav.addEventListener("mouseleave", function () {
        place(activeItem);
    });

    window.addEventListener("resize", function () {
        place(currentItem, true);
    });

    // Dois frames garantem que a posição inicial seja pintada antes da transição.
    window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
            show();
            place(activeItem);
        });
    });
})();
