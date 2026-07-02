import { carregarPerfilAutenticado } from '../auth.js';
import { contarProjetos } from '../services/projeto.service.js';
import { listarUsuarios } from '../services/usuario.service.js';
import { listarAvaliacoes } from '../services/avaliacao.service.js';
import { qs } from '../util.js';

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = await carregarPerfilAutenticado();
  if (!usuario) return;
  if (usuario.tipo === 'Avaliador') {
    location.href = 'avaliacoes.html';
    return;
  }

  qs('#nomeUsuario').textContent = usuario.nome;
  qs('#tipoUsuario').textContent = usuario.tipo;

  const [projetos, usuarios, avaliacoes] = await Promise.allSettled([
    contarProjetos(),
    listarUsuarios(),
    listarAvaliacoes(),
  ]);

  qs('#totalProjetos').textContent = projetos.value ?? '-';
  qs('#totalUsuarios').textContent = usuarios.value?.length ?? '-';
  qs('#totalAvaliacoes').textContent = avaliacoes.value?.length ?? '-';
});
