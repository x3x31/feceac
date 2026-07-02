import { protegerPagina, logout } from './auth.js';
import { qs } from './util.js';

const paginasPublicas = ['login.html', 'index.html', ''];

document.addEventListener('DOMContentLoaded', async () => {
  const pagina = location.pathname.split('/').pop();
  if (!paginasPublicas.includes(pagina)) {
    await protegerPagina();
  }

  qs('#btnLogout')?.addEventListener('click', logout);
});

