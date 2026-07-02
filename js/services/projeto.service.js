import { supabase } from '../supabase.js';

const selectProjeto = `
  *,
  area:areas_conhecimento(id,nome),
  alunos:projeto_alunos(aluno:alunos(id,nome))
`;

export const listarProjetos = async (filtros = {}) => {
  let query = supabase.from('projetos').select(selectProjeto).order('created_at', { ascending: false });

  if (filtros.nome) query = query.ilike('titulo', `%${filtros.nome}%`);
  if (filtros.area_id) query = query.eq('area_id', filtros.area_id);
  if (filtros.ano) query = query.eq('ano', filtros.ano);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const obterProjeto = async (id) => {
  const { data, error } = await supabase
    .from('projetos')
    .select(selectProjeto)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const salvarProjeto = async ({ alunos = [], ...projeto }) => {
  const { data: projetoSalvo, error } = await supabase
    .from('projetos')
    .upsert(projeto)
    .select()
    .single();
  if (error) throw error;

  await supabase.from('projeto_alunos').delete().eq('projeto_id', projetoSalvo.id);

  for (const aluno of alunos.filter((item) => item.nome?.trim())) {
    const { data: alunoSalvo, error: alunoError } = await supabase
      .from('alunos')
      .insert({ nome: aluno.nome.trim() })
      .select()
      .single();
    if (alunoError) throw alunoError;

    const { error: relError } = await supabase
      .from('projeto_alunos')
      .insert({ projeto_id: projetoSalvo.id, aluno_id: alunoSalvo.id });
    if (relError) throw relError;
  }

  return obterProjeto(projetoSalvo.id);
};

export const excluirProjeto = async (id) => {
  const { error } = await supabase.from('projetos').delete().eq('id', id);
  if (error) throw error;
};

export const contarProjetos = async () => {
  const { count, error } = await supabase
    .from('projetos')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
};

