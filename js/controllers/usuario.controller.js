import { escapeHtml, qs, validarFormulario } from '../util.js';
import { confirmar, toast } from '../ui.js';
import { buscarUsuarioAtual, excluirUsuario, listarUsuarios, salvarUsuario } from '../services/usuario.service.js';

let usuarios = [];

const ordenar = (lista, criterio) => {
  const copia = [...lista];
  switch (criterio) {
    case 'nome': return copia.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    case 'nome_desc': return copia.sort((a, b) => b.nome.localeCompare(a.nome, 'pt-BR'));
    case 'tipo': return copia.sort((a, b) => a.tipo.localeCompare(b.tipo, 'pt-BR'));
    case 'email': return copia.sort((a, b) => a.email.localeCompare(b.email, 'pt-BR'));
    default: return copia;
  }
};

const aplicarFiltros = () => {
  const nome = qs('#filtroNome').value.trim().toLowerCase();
  const tipo = qs('#filtroTipo').value;
  const ativo = qs('#filtroAtivo').value;
  const ordem = qs('#filtroOrdem').value;

  let filtrados = usuarios.filter(u => {
    if (nome && !u.nome.toLowerCase().includes(nome)) return false;
    if (tipo && u.tipo !== tipo) return false;
    if (ativo !== '' && String(u.ativo) !== ativo) return false;
    return true;
  });

  renderizar(ordenar(filtrados, ordem));
};

const renderizar = (lista) => {
  qs('#usuariosTabela').innerHTML = lista.map((usuario) => `
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

const carregar = async () => {
  usuarios = await listarUsuarios();
  aplicarFiltros();
};

document.addEventListener('DOMContentLoaded', async () => {
  const usuarioAtual = await buscarUsuarioAtual();
  if (usuarioAtual.tipo !== 'Administrador') {
    toast('Apenas Administradores podem gerenciar usuários.', 'danger');
    setTimeout(() => { location.href = 'painel.html'; }, 900);
    return;
  }

  await carregar();

  document.querySelectorAll('.filtro-usuario').forEach(el => {
    el.addEventListener('input', aplicarFiltros);
    el.addEventListener('change', aplicarFiltros);
  });

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

    if (botao.matches('.btn-excluir')) {
      if (!await confirmar('Deseja excluir este usuário?')) return;
      await excluirUsuario(botao.dataset.id);
      toast('Usuário excluído.');
      await carregar();
    }
  });
});
