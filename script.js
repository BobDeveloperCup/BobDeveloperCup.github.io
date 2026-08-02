document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('projects-container');
    const toast = document.getElementById('download-toast');

    fetch('projects.json')
        .then(response => response.json())
        .then(data => {
            renderProjects(data);
        })
        .catch(error => {
            console.error('Erro ao carregar projetos:', error);
        });

    function renderProjects(projects) {
        container.innerHTML = '';

        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';

            const statusTexto = project.status === 'ativo' ? 'Ativo' : 'Descontinuado';
            const statusClasse = project.status.toLowerCase();

            const tagsLinguagens = project.linguagens
                .map(lang => `<span class="lang-tag">${lang}</span>`)
                .join('');

            let botaoDownload = '';
            if (project.temDownload) {
                botaoDownload = `
                    <a href="${project.linkDownload}" target="_blank" class="btn-download-proj" data-project="${project.titulo}">
                        <i class="fa-solid fa-download"></i> Baixar Projeto
                    </a>
                `;
            } else {
                botaoDownload = `
                    <button class="btn-download-proj disabled" disabled>
                        <i class="fa-solid fa-ban"></i> Indisponível
                    </button>
                `;
            }

            card.innerHTML = `
                <div class="project-image">
                    <img src="${project.imagem}" alt="${project.titulo}">
                    <span class="status-badge ${statusClasse}">${statusTexto}</span>
                </div>
                <div class="project-info">
                    <div class="project-lang">
                        ${tagsLinguagens}
                    </div>
                    <h3>${project.titulo}</h3>
                    <p>${project.descricao}</p>
                    ${botaoDownload}
                </div>
            `;

            container.appendChild(card);
        });

        configurarEventosDownload();
    }

    function configurarEventosDownload() {
        const downloadButtons = document.querySelectorAll('.btn-download-proj:not(.disabled)');
        
        downloadButtons.forEach(button => {
            button.addEventListener('click', () => {
                const projectName = button.getAttribute('data-project');
                
                if (toast) {
                    toast.innerHTML = `<i class="fa-solid fa-external-link"></i> Redirecionando para o MediaFire...`;
                    toast.classList.remove('hidden');
                    toast.style.opacity = '1';

                    setTimeout(() => {
                        toast.style.opacity = '0';
                        setTimeout(() => toast.classList.add('hidden'), 300);
                    }, 3000);
                }
            });
        });
    }
});
