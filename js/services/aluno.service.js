import { supabase } from '../supabase.js';

export const listarAlunos = async () => {
  const { data, error } = await supabase
    .from('alunos')
    .select('*')
    .order('nome');
  if (error) throw error;
  return data;
};

export const salvarAluno = async (aluno) => {
  const { data, error } = await supabase
    .from('alunos')
    .upsert(aluno)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const excluirAluno = async (id) => {
  const { error } = await supabase.from('alunos').delete().eq('id', id);
  if (error) throw error;
};
