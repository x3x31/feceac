import { APP } from '../config.js';
import { login, obterSessao } from '../auth.js';
import { qs, redirect, validarFormulario } from '../util.js';
import { toast } from '../ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (await obterSessao()) redirect(APP.paginaPainel);

  qs('#loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validarFormulario(form)) return;

    const botao = qs('#btnEntrar');
    botao.disabled = true;
    botao.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Entrando';

    try {
      await login(qs('#email').value.trim(), qs('#senha').value);
      redirect(APP.paginaPainel);
    } catch (error) {
      toast(error.message || 'Não foi possível entrar.', 'danger');
      botao.disabled = false;
      botao.textContent = 'Entrar';
    }
  });
});

