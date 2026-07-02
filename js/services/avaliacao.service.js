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
    .select('*, projeto:projetos(id,titulo), avaliador:usuarios(id,nome), notas(*)')
    .order('data', { ascending: false });
  if (error) throw error;
  return data;
};

export const salvarAvaliacao = async ({ notas = [], ...avaliacao }) => {
  const { data, error } = await supabase
    .from('avaliacoes')
    .upsert(avaliacao, { onConflict: 'projeto_id,avaliador_id' })
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

export const excluirAvaliacao = async (id) => {
  const { error } = await supabase.from('avaliacoes').delete().eq('id', id);
  if (error) throw error;
};

