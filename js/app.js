import { protegerPagina, logout } from './auth.js';
import { qs, qsa } from './util.js';

const paginasPublicas = ['login.html', 'index.html', ''];
const menusPorPerfil = {
  Administrador: [
    ['painel.html', 'Painel'],
    ['projetos.html', 'Projetos'],
    ['usuarios.html', 'Usuários'],
    ['professores.html', 'Professores'],
    ['alunos.html', 'Alunos'],
    ['areas.html', 'Áreas'],
    ['criterios.html', 'Critérios'],
    ['avaliacoes.html', 'Avaliações'],
    ['ranking.html', 'Ranking'],
    ['ficha-avaliacao.html', 'Ficha de Avaliação'],
  ],
  Professor: [
    ['painel.html', 'Painel'],
    ['projetos.html', 'Projetos'],
    ['avaliacoes.html', 'Avaliações'],
  ],
  Aluno: [
    ['cadastrar-projeto.html', 'Cadastrar Projeto'],
  ],
  Avaliador: [
    ['avaliacoes.html', 'Avaliações'],
  ],
};

const acessoPorPagina = {
  'avaliacoes.html': ['Avaliador', 'Administrador', 'Professor'],
  'boas-vindas.html': ['Avaliador'],
  'professor-boas-vindas.html': ['Professor'],
  'ranking.html': ['Administrador'],
  'ficha-avaliacao.html': ['Administrador'],
  'usuarios.html': ['Administrador'],
  'professores.html': ['Administrador'],
  'alunos.html': ['Administrador'],
  'areas.html': ['Administrador'],
  'criterios.html': ['Administrador'],
  'cadastrar-projeto.html': ['Administrador', 'Professor', 'Aluno'],
  'editar-projeto.html': ['Administrador', 'Professor'],
};

const paginaInicial = (perfil) => {
  if (perfil === 'Aluno') return 'cadastrar-projeto.html';
  if (perfil === 'Avaliador') return 'boas-vindas.html';
  if (perfil === 'Professor') return 'professor-boas-vindas.html';
  return 'painel.html';
};

const BOTTOMNAV_HTML = `
<nav class="bv-bottomnav">
  <a href="professor-boas-vindas.html" class="bv-bottomnav-item">
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 2 7.5V14a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5V7.5a.5.5 0 0 0-.146-.354l-6-6z"/>
      <path d="M3.146 8.354a.5.5 0 0 1 0-.708l5-5a.5.5 0 0 1 .708.708L4.707 7.5H12.5a.5.5 0 0 1 0 1H4.707l4.147 4.146a.5.5 0 0 1-.708.708l-5-5z"/>
    </svg>
    <span>Início</span>
  </a>
  <a href="projetos.html" class="bv-bottomnav-item">
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
      <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9zM2.5 3a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.5-.5H9c-.964 0-1.71-.605-2.264-1.264A.5.5 0 0 0 6.264 3H2.5z"/>
    </svg>
    <span>Projetos</span>
  </a>
  <a href="avaliacoes.html" class="bv-bottomnav-item">
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
      <path d="M2.5 0A2.5 2.5 0 0 0 0 2.5v11A2.5 2.5 0 0 0 2.5 16h11a2.5 2.5 0 0 0 2.5-2.5v-11A2.5 2.5 0 0 0 13.5 0h-11zm4.354 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L5.793 7.5 3.146 4.854a.5.5 0 1 1 .708-.708l3 3zM8 10a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5A.5.5 0 0 1 8 10z"/>
    </svg>
    <span>Avaliações</span>
  </a>
</nav>`;

const PAGINAS_BOTTOMNAV = ['projetos.html', 'avaliacoes.html'];

const HAMBURGER_HTML = `
<button id="btnToggleSidebar" class="btn btn-sm btn-outline-secondary me-2" type="button">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/></svg>
</button>`;

const aplicarMenu = (usuario, pagina) => {
  const itens = menusPorPerfil[usuario.tipo] || [];

  if (usuario.tipo === 'Administrador') {
    document.body.classList.add('user-admin');
    qsa('.sidebar .nav').forEach((nav) => {
      nav.innerHTML = itens.map(([href, texto]) => (
        `<a class="nav-link ${href === pagina ? 'active' : ''}" href="${href}">${texto}</a>`
      )).join('');
    });

    const navbar = qs('.navbar .container-fluid');
    if (navbar && !qs('#btnToggleSidebar')) {
      navbar.insertAdjacentHTML('afterbegin', HAMBURGER_HTML);
      qs('#btnToggleSidebar').addEventListener('click', () => {
        qs('.sidebar').classList.toggle('sidebar--hidden');
        document.body.classList.toggle('sidebar-open');
      });
      document.addEventListener('click', (e) => {
        if (document.body.classList.contains('sidebar-open') && e.target === document.body) {
          qs('.sidebar').classList.add('sidebar--hidden');
          document.body.classList.remove('sidebar-open');
        }
      });
    }
  } else {
    qsa('.sidebar').forEach((s) => s.classList.add('d-none'));
  }

  if (usuario.tipo === 'Professor' && PAGINAS_BOTTOMNAV.includes(pagina)) {
    document.body.classList.add('has-bottomnav');
    document.body.insertAdjacentHTML('beforeend', BOTTOMNAV_HTML);
    qsa('.bv-bottomnav-item').forEach((item) => {
      if (item.getAttribute('href') === pagina) item.classList.add('active');
    });
  }

   qsa('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
  
    if (!href || href.startsWith('http') || href === '#') return;
  
    // Se a página não possui restrição, mantém visível.
    if (!acessoPorPagina[href]) return;
  
    const perfisPermitidos = acessoPorPagina[href];
  
    if (!perfisPermitidos.includes(usuario.tipo)) {
      link.classList.add('d-none');
    }
  });
};

document.addEventListener('DOMContentLoaded', async () => {
  const pagina = location.pathname.split('/').pop();
  let usuario = null;
  if (!paginasPublicas.includes(pagina)) {
    usuario = await protegerPagina();
    if (!usuario) return;

    if (pagina === 'painel.html' && usuario.tipo === 'Avaliador') {
      location.href = 'boas-vindas.html';
      return;
    }

    if (pagina === 'painel.html' && usuario.tipo === 'Professor') {
      location.href = 'professor-boas-vindas.html';
      return;
    }

    if (pagina === 'painel.html' && usuario.tipo === 'Aluno') {
      location.href = 'cadastrar-projeto.html';
      return;
    }

    const perfisPermitidos = acessoPorPagina[pagina];
    if (perfisPermitidos && !perfisPermitidos.includes(usuario.tipo)) {
      location.href = paginaInicial(usuario.tipo);
      return;
    }

    aplicarMenu(usuario, pagina);
  }

  qs('#btnLogout')?.addEventListener('click', logout);
});
