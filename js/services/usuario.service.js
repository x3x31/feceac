import { supabase } from '../supabase.js';

export const buscarUsuarioAtual = async () => {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return null;

  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (error) throw error;
  return data;
};

export const listarUsuarios = async () => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('nome');
  if (error) throw error;
  return data;
};

export const salvarUsuario = async (usuario) => {
  const { data, error } = await supabase
    .from('usuarios')
    .upsert(usuario)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const excluirUsuario = async (id) => {
  const { error } = await supabase.from('usuarios').delete().eq('id', id);
  if (error) throw error;
};

export const filtrarUsuarios = async (tipo, ativo) => {
  let query = supabase.from('usuarios').select('*');
  if (tipo) query = query.eq('tipo', tipo);
  if (ativo !== null && ativo !== undefined) query = query.eq('ativo', ativo);
  query = query.order('nome');
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const atualizarAtivoUsuarios = async (ids, ativo) => {
  const { error } = await supabase
    .from('usuarios')
    .update({ ativo })
    .in('id', ids);
  if (error) throw error;
};

