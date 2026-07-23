import { carregarPerfilAutenticado } from '../auth.js';
import { listarUsuarios } from '../services/usuario.service.js';
import { listarAvaliacoes, listarCriterios } from '../services/avaliacao.service.js';
import { listarProfessores } from '../services/professor.service.js';
import { qs } from '../util.js';
import { supabase } from '../supabase.js';

const contarAlunos = async () => {
  const { count, error } = await supabase
    .from('alunos')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
};

const contarAreas = async () => {
  const { count, error } = await supabase
    .from('areas_conhecimento')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
};

const contarProjetosPorTipo = async (tipoId) => {
  const { count, error } = await supabase
    .from('projetos')
    .select('id', { count: 'exact', head: true })
    .eq('tipo_projeto_id', tipoId);
  if (error) throw error;
  return count ?? 0;
};

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = await carregarPerfilAutenticado();
  if (!usuario) return;
  if (usuario.tipo === 'Avaliador') {
    location.href = 'avaliacoes.html';
    return;
  }

  qs('#nomeUsuario').textContent = usuario.nome;
  qs('#tipoUsuario').textContent = usuario.tipo;

  const [usuarios, avaliacoes, professores, alunos, areas, criterios, feira, mostra] = await Promise.allSettled([
    listarUsuarios(),
    listarAvaliacoes(),
    listarProfessores(),
    contarAlunos(),
    contarAreas(),
    listarCriterios(),
    contarProjetosPorTipo(1),
    contarProjetosPorTipo(2),
  ]);

  qs('#totalFeira').textContent = feira.status === 'fulfilled' ? feira.value : '-';
  qs('#totalMostra').textContent = mostra.status === 'fulfilled' ? mostra.value : '-';
  qs('#totalUsuarios').textContent = usuarios.status === 'fulfilled' ? usuarios.value?.length : '-';
  qs('#totalAvaliacoes').textContent = avaliacoes.status === 'fulfilled' ? avaliacoes.value?.length : '-';
  qs('#totalProfessores').textContent = professores.status === 'fulfilled' ? professores.value?.length : '-';
  qs('#totalAlunos').textContent = alunos.status === 'fulfilled' ? alunos.value : '-';
  qs('#totalAreas').textContent = areas.status === 'fulfilled' ? areas.value : '-';
  qs('#totalCriterios').textContent = criterios.status === 'fulfilled' ? criterios.value?.length : '-';
});
