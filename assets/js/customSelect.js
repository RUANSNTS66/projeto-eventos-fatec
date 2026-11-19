/*
 * Seletor customizado dos campos de seleção do site e do painel.
 *
 * O <select> nativo PERMANECE no DOM: continua dentro do <form>, com o mesmo
 * id, name, options e disparando os mesmos eventos `change`. Por cima dele
 * existe apenas uma interface visual (trigger + menu).
 *
 * Nenhum controlador foi alterado: os scripts continuam usando `.value`,
 * `.innerHTML` e `addEventListener("change", ...)` normalmente.
 */
(function customSelect() {
    "use strict";

    const TARGETS = [
        // Busca da home (visual integrado ao painel de busca)
        { id: "filtro-periodo", label: "Período", scope: ".search-field", variant: "search" },
        { id: "filtro-categoria", label: "Categoria", scope: ".search-field", variant: "search" },

        // Painel administrativo (visual de campo de formulário)
        { id: "filtro-evento", label: "Evento", scope: ".admin-filter", variant: "field" },
        { id: "campo-categoria", label: "Categoria", scope: ".form-field", variant: "field" },
        { id: "campo-papel-usuario", label: "Papel", scope: ".form-field", variant: "field" },
        { id: "campo-status-usuario", label: "Status", scope: ".form-field", variant: "field" }
    ];

    const CHEVRON = '<svg class="fancy-select__chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    const CHECK = '<svg class="fancy-select__check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
    const HEX = /--accent\s*:\s*(#[0-9a-f]{3,8})/i;

    let openInstance = null;

    function build(select, config) {
        const field = select.closest(config.scope);
        if (!field) return null;

        const wrap = document.createElement("div");
        wrap.className = config.variant === "field"
            ? "fancy-select fancy-select--field"
            : "fancy-select";

        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "fancy-select__trigger";
        trigger.setAttribute("aria-haspopup", "listbox");
        trigger.setAttribute("aria-expanded", "false");
        trigger.setAttribute("aria-label", config.label);
        trigger.innerHTML = '<span class="fancy-select__value"></span>' + CHEVRON;

        const menu = document.createElement("div");
        menu.className = "fancy-select__menu";
        menu.setAttribute("role", "listbox");
        menu.id = `fancy-menu-${select.id}`;
        menu.hidden = true;
        trigger.setAttribute("aria-controls", menu.id);

        select.classList.add("native-select");
        select.setAttribute("aria-hidden", "true");
        select.tabIndex = -1;

        // Inserimos no pai real do select (pode estar em .search-text, .form-field...)
        const parent = select.parentNode;
        parent.insertBefore(wrap, select);
        wrap.appendChild(select);
        wrap.appendChild(trigger);
        wrap.appendChild(menu);

        const valueEl = trigger.querySelector(".fancy-select__value");
        let activeIndex = 0;

        function options() {
            return [...menu.querySelectorAll(".fancy-select__option")];
        }

        function sync() {
            const selected = select.options[select.selectedIndex];
            valueEl.textContent = selected ? selected.textContent.trim() : "";

            options().forEach((option) => {
                const isSelected = option.dataset.value === select.value;
                option.classList.toggle("is-selected", isSelected);
                option.setAttribute("aria-selected", String(isSelected));
            });
        }

        function rebuild() {
            menu.replaceChildren();

            [...select.options].forEach((option) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "fancy-select__option";
                button.setAttribute("role", "option");
                button.dataset.value = option.value;

                const style = option.getAttribute("style") ?? "";
                const accent = style.match(HEX);

                if (accent) {
                    const dot = document.createElement("span");
                    dot.className = "fancy-select__dot";
                    dot.style.setProperty("--dot", accent[1]);
                    button.appendChild(dot);
                }

                const text = document.createElement("span");
                text.className = "fancy-select__option-text";
                text.textContent = option.textContent.trim();
                button.appendChild(text);
                button.insertAdjacentHTML("beforeend", CHECK);

                button.addEventListener("click", () => choose(option.value));
                menu.appendChild(button);
            });

            sync();
        }

        function setActive(index) {
            const list = options();
            if (!list.length) return;
            activeIndex = Math.max(0, Math.min(index, list.length - 1));
            list[activeIndex].focus({ preventScroll: true });
        }

        function open() {
            if (openInstance && openInstance !== api) openInstance.close();

            menu.hidden = false;
            trigger.setAttribute("aria-expanded", "true");
            wrap.classList.add("is-open");
            openInstance = api;
            document.addEventListener("pointerdown", onOutside, true);

            const selectedIndex = options().findIndex((option) => option.classList.contains("is-selected"));
            setActive(selectedIndex < 0 ? 0 : selectedIndex);
        }

        function close() {
            if (menu.hidden) return;
            menu.hidden = true;
            trigger.setAttribute("aria-expanded", "false");
            wrap.classList.remove("is-open");
            if (openInstance === api) openInstance = null;
            document.removeEventListener("pointerdown", onOutside, true);
        }

        function toggle() {
            if (menu.hidden) open();
            else close();
        }

        function choose(value) {
            select.value = value;       // setter interceptado → atualiza a UI
            select.dispatchEvent(new Event("change", { bubbles: true }));
            close();
            trigger.focus({ preventScroll: true });
        }

        function onOutside(event) {
            if (!wrap.contains(event.target)) close();
        }

        trigger.addEventListener("click", toggle);

        // Evita que um <label> repasse cliques dentro do menu para o trigger.
        menu.addEventListener("click", (event) => event.stopPropagation());

        // Clicar no rótulo textual abre o seletor (search-label ou <label for>).
        const label = field.querySelector(".search-label, label");
        label?.addEventListener("click", (event) => {
            event.preventDefault();
            open();
        });

        // Na busca, clicar no corpo do campo também abre.
        if (config.variant === "search") {
            field.addEventListener("click", (event) => {
                if (event.target === field) {
                    event.preventDefault();
                    open();
                }
            });
        }

        trigger.addEventListener("keydown", (event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                open();
            } else if (event.key === "Escape") {
                close();
            }
        });

        menu.addEventListener("keydown", (event) => {
            const list = options();
            if (!list.length) return;

            if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive(activeIndex + 1);
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive(activeIndex - 1);
            } else if (event.key === "Home") {
                event.preventDefault();
                setActive(0);
            } else if (event.key === "End") {
                event.preventDefault();
                setActive(list.length - 1);
            } else if (event.key === "Escape") {
                event.preventDefault();
                close();
                trigger.focus({ preventScroll: true });
            } else if (event.key === "Tab") {
                close();
            }
        });

        // Os controladores trocam opções com innerHTML; refletimos no menu.
        new MutationObserver(rebuild).observe(select, { childList: true });

        // Validação do painel marca aria-invalid no select: espelhamos no trigger.
        function syncInvalid() {
            const invalid = select.hasAttribute("aria-invalid");
            wrap.classList.toggle("is-invalid", invalid);
            trigger.setAttribute("aria-invalid", String(invalid));
        }

        new MutationObserver(syncInvalid).observe(select, {
            attributes: true,
            attributeFilter: ["aria-invalid"]
        });
        syncInvalid();

        // Mudanças vindas do próprio select também refletem na interface.
        select.addEventListener("change", sync);

        // Intercepta apenas atribuições a `.value` neste elemento. O setter
        // nativo continua sendo chamado; só disparamos a sincronização visual.
        const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
        if (descriptor && descriptor.get && descriptor.set) {
            Object.defineProperty(select, "value", {
                configurable: true,
                get() {
                    return descriptor.get.call(this);
                },
                set(value) {
                    descriptor.set.call(this, value);
                    sync();
                }
            });
        }

        const api = Object.freeze({ close, rebuild });
        rebuild();
        return api;
    }

    const instances = TARGETS
        .map((config) => ({ element: document.getElementById(config.id), config }))
        .filter((item) => item.element instanceof HTMLSelectElement)
        .map((item) => build(item.element, item.config))
        .filter(Boolean);

    if (instances.length) {
        window.customSelects = instances;
    }
})();
