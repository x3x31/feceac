import { supabase } from '../supabase.js';

export const listarCriterios = async () => {
  const { data, error } = await supabase.from('criterios').select('*').order('id');
  if (error) throw error;
  return data;
};

export const salvarCriterio = async (criterio) => {
  const { data, error } = await supabase
    .from('criterios')
    .upsert(criterio)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const listarAvaliacoes = async () => {
  const { data, error } = await supabase
    .from('avaliacoes')
    .select('*, projeto:projetos(id,titulo), avaliador:usuarios(id,nome), notas(*, criterio:criterios(id,descricao,peso))')
    .order('data', { ascending: false });
  if (error) throw error;
  return data;
};

export const listarAvaliacoesDoUsuario = async (avaliadorId) => {
  const { data, error } = await supabase
    .from('avaliacoes')
    .select('*, projeto:projetos(id,titulo), notas(*, criterio:criterios(id,descricao,peso))')
    .eq('avaliador_id', avaliadorId)
    .order('data', { ascending: false });
  if (error) throw error;
  return data;
};

const calcularNotaFinal = async (notas) => {
  if (!notas.length) return null;
  const ids = notas.map((nota) => nota.criterio_id);
  const { data: criterios, error } = await supabase
    .from('criterios')
    .select('id,peso')
    .in('id', ids);
  if (error) throw error;

  const pesos = new Map(criterios.map((criterio) => [criterio.id, Number(criterio.peso)]));
  const totalPeso = notas.reduce((total, nota) => total + (pesos.get(nota.criterio_id) || 0), 0);
  if (!totalPeso) return null;

  const soma = notas.reduce((total, nota) => (
    total + Number(nota.nota) * (pesos.get(nota.criterio_id) || 0)
  ), 0);
  return Number((soma / totalPeso).toFixed(2));
};

export const salvarAvaliacao = async ({ notas = [], ...avaliacao }) => {
  const nota_final = await calcularNotaFinal(notas);
  const { data, error } = await supabase
    .from('avaliacoes')
    .upsert({ ...avaliacao, nota_final }, { onConflict: 'projeto_id,avaliador_id' })
    .select()
    .single();
  if (error) throw error;

  await supabase.from('notas').delete().eq('avaliacao_id', data.id);

  if (notas.length) {
    const linhas = notas.map((nota) => ({ ...nota, avaliacao_id: data.id }));
    const { error: notasError } = await supabase.from('notas').insert(linhas);
    if (notasError) throw notasError;
  }

  return data;
};

export const listarRanking = async () => {
  const { data, error } = await supabase
    .from('projetos')
    .select(`
      id, ano, titulo, orientador, coorientador,
      area:areas_conhecimento(id,nome),
      alunos:projeto_alunos(turma,aluno:alunos(id,nome,turma)),
      avaliacoes(id,avaliador_id,data,nota_final,notas(nota,criterio:criterios(peso)))
    `)
    .order('titulo');
  if (error) throw error;
  return data;
};

export const excluirAvaliacao = async (id) => {
  const { error } = await supabase.from('avaliacoes').delete().eq('id', id);
  if (error) throw error;
};
