import { buscarUsuarioAtual } from '../services/usuario.service.js';
import { qs } from '../util.js';
import { toast } from '../ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const usuario = await buscarUsuarioAtual();
    if (!usuario) return;
    qs('#bvUsuarioNome').textContent = usuario.nome || usuario.email;
  } catch (error) {
    toast(error.message || 'Erro ao carregar dados do usuário.', 'danger');
  }
});
