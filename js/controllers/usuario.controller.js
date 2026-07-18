import { escapeHtml, qs, validarFormulario } from '../util.js';
import { confirmar, toast } from '../ui.js';
import { buscarUsuarioAtual, excluirUsuario, listarUsuarios, salvarUsuario } from '../services/usuario.service.js';

const renderizar = (usuarios) => {
  qs('#usuariosTabela').innerHTML = usuarios.map((usuario) => `
    <tr>
      <td>${escapeHtml(usuario.nome)}</td>
      <td>${escapeHtml(usuario.email)}</td>
      <td>${escapeHtml(usuario.tipo)}</td>
      <td>${usuario.ativo ? 'Sim' : 'Não'}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary btn-editar"
          data-id="${usuario.id}" data-nome="${escapeHtml(usuario.nome)}"
          data-email="${escapeHtml(usuario.email)}" data-tipo="${usuario.tipo}"
          data-ativo="${usuario.ativo}">Editar</button>
        <button class="btn btn-sm btn-outline-danger btn-excluir" data-id="${usuario.id}">Excluir</button>
      </td>
    </tr>`).join('');
};

const carregar = async () => renderizar(await listarUsuarios());

document.addEventListener('DOMContentLoaded', async () => {
  const usuarioAtual = await buscarUsuarioAtual();
  if (usuarioAtual.tipo !== 'Administrador') {
    toast('Apenas Administradores podem gerenciar usuários.', 'danger');
    setTimeout(() => { location.href = 'painel.html'; }, 900);
    return;
  }

  await carregar();

  qs('#usuarioForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!validarFormulario(form)) return;

    try {
      await salvarUsuario({
        id: qs('#id').value,
        nome: qs('#nome').value.trim(),
        email: qs('#email').value.trim(),
        tipo: qs('#tipo').value,
        ativo: qs('#ativo').checked,
      });
      bootstrap.Modal.getInstance(qs('#usuarioModal')).hide();
      toast('Usuário salvo.');
      form.reset();
      await carregar();
    } catch (error) {
      toast(error.message || 'Erro ao salvar usuário.', 'danger');
    }
  });

  qs('#usuariosTabela').addEventListener('click', async (event) => {
    const botao = event.target;
    if (botao.matches('.btn-editar')) {
      qs('#id').value = botao.dataset.id;
      qs('#nome').value = botao.dataset.nome;
      qs('#email').value = botao.dataset.email;
      qs('#tipo').value = botao.dataset.tipo;
      qs('#ativo').checked = botao.dataset.ativo === 'true';
      bootstrap.Modal.getOrCreateInstance(qs('#usuarioModal')).show();
    }

    if (botao.matches('.btn-excluir') && confirmar('Deseja excluir este usuário?')) {
      await excluirUsuario(botao.dataset.id);
      toast('Usuário excluído.');
      await carregar();
    }
  });
});
