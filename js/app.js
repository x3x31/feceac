import { protegerPagina, logout } from './auth.js';
import { qs, qsa } from './util.js';

const paginasPublicas = ['login.html', 'index.html', ''];
const menusPorPerfil = {
  Administrador: [
    ['painel.html', 'Painel'],
    ['projetos.html', 'Projetos'],
    ['usuarios.html', 'Usuários'],
    ['areas.html', 'Áreas'],
    ['criterios.html', 'Critérios'],    
    ['ranking.html', 'Ranking'],
  ],
  Professor: [
    ['painel.html', 'Painel'],
    ['projetos.html', 'Projetos'],    
  ],
  Aluno: [
    ['cadastrar-projeto.html', 'Cadastrar Projeto'],
  ],
  Avaliador: [
    ['avaliacoes.html', 'Avaliações'],
  ],
};

const acessoPorPagina = {
  'avaliacoes.html': ['Avaliador'],
  'ranking.html': ['Administrador'],
  'usuarios.html': ['Administrador'],
  'areas.html': ['Administrador'],
  'criterios.html': ['Administrador'],
  'cadastrar-projeto.html': ['Administrador', 'Professor', 'Aluno'],
  'editar-projeto.html': ['Administrador', 'Professor'],
};

const paginaInicial = (perfil) => {
  if (perfil === 'Aluno') return 'cadastrar-projeto.html';
  if (perfil === 'Avaliador') return 'avaliacoes.html';
  return 'painel.html';
};

const aplicarMenu = (usuario, pagina) => {
  const itens = menusPorPerfil[usuario.tipo] || [];
  qsa('.sidebar .nav').forEach((nav) => {
    nav.innerHTML = itens.map(([href, texto]) => (
      `<a class="nav-link ${href === pagina ? 'active' : ''}" href="${href}">${texto}</a>`
    )).join('');
  });

  qsa('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href === '#') return;
    const permitido = itens.some(([itemHref]) => itemHref === href);
    if (!permitido && acessoPorPagina[href]) link.closest('.col-md-3, .nav-item, li, a')?.classList.add('d-none');
  });
};

document.addEventListener('DOMContentLoaded', async () => {
  const pagina = location.pathname.split('/').pop();
  let usuario = null;
  if (!paginasPublicas.includes(pagina)) {
    usuario = await protegerPagina();
    if (!usuario) return;

    if (pagina === 'painel.html' && usuario.tipo === 'Avaliador') {
      location.href = 'avaliacoes.html';
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
