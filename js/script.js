(() => {
    'use strict';

    const DATA_URL = 'data/projects.json';
    const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const STATUS_LABEL = {
        ativo: 'Ativo',
        descontinuado: 'Descontinuado'
    };

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

    const escapeHTML = (value) =>
        String(value ?? '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));

    function initNav() {
        const toggle = $('.nav-toggle');
        const menu = $('#nav-menu');
        const links = $$('.nav-menu a[data-section]');

        const setOpen = (open) => {
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
            menu.classList.toggle('is-open', open);
        };

        toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
        links.forEach((link) => link.addEventListener('click', () => setOpen(false)));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

        if (!('IntersectionObserver' in window)) return;

        const mark = (id) =>
            links.forEach((link) => link.classList.toggle('is-active', link.dataset.section === id));

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) mark(entry.target.id);
            });
        }, { rootMargin: '-45% 0px -50% 0px' });

        links
            .map((link) => document.getElementById(link.dataset.section))
            .filter(Boolean)
            .forEach((section) => observer.observe(section));

        const hero = $('#home');
        if (hero) {
            new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) mark(null);
            }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);
        }
    }

    let revealObserver = null;

    function observeReveal(root = document) {
        $$('.reveal', root).forEach((el) => {
            if (revealObserver) revealObserver.observe(el);
            else el.classList.add('is-in');
        });
    }

    function initReveal() {
        if ('IntersectionObserver' in window && !REDUCED_MOTION) {
            revealObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-in');
                    revealObserver.unobserve(entry.target);
                });
            }, { threshold: 0.12 });
        }
        observeReveal();
    }

    let toastTimer;

    function showToast(message) {
        const toast = $('#toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
    }

    function hostName(url) {
        try {
            return new URL(url).hostname.replace(/^www\./, '');
        } catch {
            return 'o link';
        }
    }

    function applyTheme(card, tema = {}) {
        const vars = {
            '--p-bg': tema.fundo,
            '--p-ink': tema.texto,
            '--p-soft': tema.suave,
            '--p-accent': tema.destaque,
            '--p-accent2': tema.secundaria,
            '--p-title': tema.fonteTitulo ? `"${tema.fonteTitulo}"` : null
        };
        Object.entries(vars).forEach(([name, value]) => {
            if (value) card.style.setProperty(name, value);
        });
        if (tema.detalhe) card.dataset.detalhe = tema.detalhe;
    }

    function projectCard(project, index) {
        const status = String(project.status || '').toLowerCase();
        const statusText = STATUS_LABEL[status] || project.status;

        const tags = (project.tecnologias || [])
            .map((tech) => `<li>${escapeHTML(tech)}</li>`)
            .join('');

        const links = (project.links || []).length
            ? project.links
                .map((l) => `
                    <a class="link-btn" href="${escapeHTML(l.url)}" target="_blank" rel="noopener noreferrer"
                       data-host="${escapeHTML(hostName(l.url))}">
                        ${escapeHTML(l.rotulo)} <span aria-hidden="true">↗</span>
                    </a>`)
                .join('')
            : '<span class="none">Sem links disponíveis no momento.</span>';

        const card = document.createElement('article');
        card.className = 'project reveal';
        card.style.setProperty('--d', `${index * 80}ms`);
        applyTheme(card, project.tema);

        card.innerHTML = `
            <div class="project-banner">
                <img src="${escapeHTML(project.banner)}" alt="" loading="lazy" decoding="async">
                <span class="project-status ${escapeHTML(status)}">${escapeHTML(statusText)}</span>
            </div>
            <img class="project-logo" src="${escapeHTML(project.logo)}"
                 alt="${escapeHTML(project.logoAlt || project.titulo)}" loading="lazy" decoding="async">
            <div class="project-body">
                <div>
                    ${project.subtitulo ? `<p class="project-kicker">${escapeHTML(project.subtitulo)}</p>` : ''}
                    <h3>${escapeHTML(project.titulo)}</h3>
                    <p class="project-desc">${escapeHTML(project.descricao)}</p>
                </div>
                <div class="project-meta">
                    <div>
                        <h4>Status</h4>
                        <p class="meta-status">${escapeHTML(statusText)}</p>
                    </div>
                    <div>
                        <h4>Tecnologias</h4>
                        <ul class="tags">${tags}</ul>
                    </div>
                    <div>
                        <h4>Links</h4>
                        <div class="links">${links}</div>
                    </div>
                </div>
            </div>`;
        return card;
    }

    async function initProjects() {
        const container = $('#projects-container');
        const count = $('#projects-count');
        if (!container) return;

        try {
            const response = await fetch(DATA_URL);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const projects = await response.json();

            container.innerHTML = '';
            projects.forEach((project, i) => container.appendChild(projectCard(project, i)));
            if (count) count.textContent = `${String(projects.length).padStart(2, '0')} ${projects.length === 1 ? 'projeto' : 'projetos'}`;

            observeReveal(container);
            initParallax();

            container.addEventListener('click', (e) => {
                const link = e.target.closest('a[data-host]');
                if (link) showToast(`Abrindo ${link.dataset.host}…`);
            });
        } catch (error) {
            console.error('Erro ao carregar projetos:', error);
            container.innerHTML =
                '<p class="state-msg">Não foi possível carregar os projetos. ' +
                'Se você abriu o arquivo direto do computador, use um servidor local ou o GitHub Pages.</p>';
        }
    }

    function initParallax() {
        if (REDUCED_MOTION) return;

        const banners = $$('.project-banner');
        if (!banners.length) return;

        let ticking = false;

        const update = () => {
            const vh = window.innerHeight;
            banners.forEach((banner) => {
                const rect = banner.getBoundingClientRect();
                if (rect.bottom < 0 || rect.top > vh) return;
                const progress = (vh - rect.top) / (vh + rect.height);
                const img = banner.firstElementChild;
                img.style.transform = `translateY(${(-progress * 13).toFixed(2)}%)`;
            });
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        update();
    }

    document.addEventListener('DOMContentLoaded', () => {
        const year = $('#year');
        if (year) year.textContent = new Date().getFullYear();

        initNav();
        initReveal();
        initProjects();
    });
})();
