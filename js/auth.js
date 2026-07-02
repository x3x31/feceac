import { APP } from './config.js';
import { supabase } from './supabase.js';
import { buscarUsuarioAtual } from './services/usuario.service.js';
import { redirect } from './util.js';

export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const perfil = await buscarUsuarioAtual();
  if (!perfil?.ativo) {
    await supabase.auth.signOut();
    throw new Error('Cadastro pendente de aprovação pelo Administrador.');
  }
  return data;
};

export const cadastrarConta = async ({ nome, email, password, tipo }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome, tipo },
    },
  });
  if (error) throw error;

  if (data.session && data.user) {
    await supabase.from('usuarios').upsert({
      id: data.user.id,
      nome,
      email,
      tipo,
      ativo: false,
    });
    await supabase.auth.signOut();
  }

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
  const perfil = await buscarUsuarioAtual();
  if (!perfil?.ativo) {
    await supabase.auth.signOut();
    redirect(APP.paginaLogin);
    return null;
  }
  return perfil;
};

export const protegerPagina = async () => carregarPerfilAutenticado();
