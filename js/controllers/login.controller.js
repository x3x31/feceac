import { APP } from '../config.js';
import { cadastrarConta, login, obterSessao } from '../auth.js';
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

  qs('#cadastroForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validarFormulario(form)) return;

    const senha = qs('#cadastroSenha').value;
    const confirmarSenha = qs('#confirmarSenha').value;
    if (senha !== confirmarSenha) {
      toast('As senhas não conferem.', 'danger');
      return;
    }

    try {
      await cadastrarConta({
        nome: qs('#cadastroNome').value.trim(),
        email: qs('#cadastroEmail').value.trim(),
        password: senha,
        tipo: qs('#cadastroTipo').value,
      });
      bootstrap.Modal.getInstance(qs('#cadastroModal')).hide();
      form.reset();
      form.classList.remove('was-validated');
      toast('Cadastro enviado. Aguarde aprovação do Administrador.', 'success');
    } catch (error) {
      toast(error.message || 'Não foi possível cadastrar.', 'danger');
    }
  });
});
