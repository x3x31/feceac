import { supabase } from '../supabase.js';

export const listarAreas = async (tipoId = null) => {
  let query = supabase
    .from('areas_conhecimento')
    .select('*, tipo:tipos_projeto(id, nome)')
    .order('nome');
  if (tipoId) query = query.eq('tipo_projeto_id', tipoId);
  const { data, error } = await query;
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
