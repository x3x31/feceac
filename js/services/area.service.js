import { supabase } from '../supabase.js';

export const listarAreas = async () => {
  const { data, error } = await supabase
    .from('areas_conhecimento')
    .select('*')
    .order('nome');
  if (error) throw error;
  return data;
};

export const salvarArea = async (area) => {
  const { data, error } = await supabase
    .from('areas_conhecimento')
    .upsert(area)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const excluirArea = async (id) => {
  const { error } = await supabase.from('areas_conhecimento').delete().eq('id', id);
  if (error) throw error;
};

