import { supabase } from '../supabase.js';

export const listarProfessores = async () => {
  const { data, error } = await supabase
    .from('professores')
    .select('*')
    .order('nome');
  if (error) throw error;
  return data;
};

export const salvarProfessor = async (professor) => {
  const { data, error } = await supabase
    .from('professores')
    .upsert(professor)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const excluirProfessor = async (id) => {
  const { error } = await supabase.from('professores').delete().eq('id', id);
  if (error) throw error;
};
