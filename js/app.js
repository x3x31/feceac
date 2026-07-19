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
  'ranking.html': ['Administrador'],
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
