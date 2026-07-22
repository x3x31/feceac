import { escapeHtml, qs, validarFormulario } from '../util.js';
import { confirmar, toast } from '../ui.js';
import { buscarUsuarioAtual, excluirUsuario, listarUsuarios, salvarUsuario, filtrarUsuarios, atualizarAtivoUsuarios } from '../services/usuario.service.js';

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
  qs('#usuariosContador').textContent = `Total: ${lista.length} usuário(s)`;
};

const carregar = async () => {
  usuarios = await listarUsuarios();
  aplicarFiltros();
};

const carregarAtivacao = async () => {
  const tipo = qs('#filtroAtivacaoTipo').value;
  const ativo = qs('#filtroAtivacaoStatus').value === 'true';
  const lista = await filtrarUsuarios(tipo, ativo);

  qs('#chkSelecionarTodosAtivacao').checked = false;
  qs('#chkSelecionarTodosAtivacao').indeterminate = false;

  const inativos = ativo === false;
  const btn = qs('#btnAtivarInativar');
  btn.disabled = true;
  if (inativos) {
    btn.textContent = 'Ativar selecionados';
    btn.classList.remove('btn-warning');
    btn.classList.add('btn-success');
  } else {
    btn.textContent = 'Inativar selecionados';
    btn.classList.remove('btn-success');
    btn.classList.add('btn-warning');
  }

  const tbody = qs('#ativacaoTabela');
  const vazio = qs('#ativacaoVazio');

  if (lista.length === 0) {
    tbody.innerHTML = '';
    vazio.classList.remove('d-none');
    return;
  }

  vazio.classList.add('d-none');
  tbody.innerHTML = lista.map(u => `
    <tr>
      <td><input class="form-check-input chk-ativacao" type="checkbox" data-id="${u.id}"></td>
      <td>${escapeHtml(u.nome)}</td>
      <td>${escapeHtml(u.email)}</td>
    </tr>`).join('');

  tbody.querySelectorAll('.chk-ativacao').forEach(chk => {
    chk.addEventListener('change', () => {
      const todos = tbody.querySelectorAll('.chk-ativacao');
      const marcados = tbody.querySelectorAll('.chk-ativacao:checked');
      qs('#chkSelecionarTodosAtivacao').checked = todos.length === marcados.length;
      qs('#chkSelecionarTodosAtivacao').indeterminate = marcados.length > 0 && todos.length !== marcados.length;
      btn.disabled = marcados.length === 0;
    });
  });
};

const toggleAllAtivacao = (marcar) => {
  qs('#ativacaoTabela').querySelectorAll('.chk-ativacao').forEach(chk => { chk.checked = marcar; });
  qs('#btnAtivarInativar').disabled = !marcar;
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

  const modalAtivacao = bootstrap.Modal.getOrCreateInstance(qs('#ativacaoModal'));
  await carregarAtivacao();
  modalAtivacao.show();

  qs('#filtroAtivacaoTipo').addEventListener('change', carregarAtivacao);
  qs('#filtroAtivacaoStatus').addEventListener('change', carregarAtivacao);

  qs('#chkSelecionarTodosAtivacao').addEventListener('change', (e) => {
    toggleAllAtivacao(e.target.checked);
  });

  qs('#btnAtivarInativar').addEventListener('click', async () => {
    const marcados = [...qs('#ativacaoTabela').querySelectorAll('.chk-ativacao:checked')].map(c => c.dataset.id);
    if (marcados.length === 0) return;

    const ativar = qs('#btnAtivarInativar').classList.contains('btn-success');
    const texto = ativar ? 'ativar' : 'inativar';
    if (!await confirmar(`Deseja ${texto} ${marcados.length} usuário(s)?`)) return;

    await atualizarAtivoUsuarios(marcados, ativar);
    toast(`${marcados.length} usuário(s) ${texto === 'ativar' ? 'ativado(s)' : 'inativado(s)'}.`);
    modalAtivacao.hide();
    await carregar();
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
