import { APP } from './config.js';
import { supabase } from './supabase.js';
import { buscarUsuarioAtual } from './services/usuario.service.js';
import { redirect } from './util.js';

export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const logout = async () => {
  await supabase.auth.signOut();
  redirect(APP.paginaLogin);
};

export const obterSessao = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

export const verificarSessao = async () => {
  const session = await obterSessao();
  if (!session) {
    redirect(APP.paginaLogin);
    return null;
  }
  return session;
};

export const carregarPerfilAutenticado = async () => {
  const session = await verificarSessao();
  if (!session) return null;
  return buscarUsuarioAtual();
};

export const protegerPagina = async () => carregarPerfilAutenticado();

