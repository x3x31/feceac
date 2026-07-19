import { debounce, escapeHtml, qs, qsa, validarFormulario } from '../util.js';
import { confirmar, mensagemVazia, setLoading, toast } from '../ui.js';
import { buscarUsuarioAtual } from '../services/usuario.service.js';
import { excluirAluno, listarAlunos, salvarAluno } from '../services/aluno.service.js';

let alunos = [];

const renderizar = (lista) => {
  const corpo = qs('#alunosTabela');
  if (!lista.length) {
    corpo.innerHTML = `<tr><td colspan="6">${mensagemVazia()}</td></tr>`;
    return;
  }
  corpo.innerHTML = lista.map((a) => `
    <tr>
      <td>${a.id}</td>
      <td>${escapeHtml(a.nome)}</td>
      <td>${escapeHtml(a.matricula || '-')}</td>
      <td>${escapeHtml(a.turma || '-')}</td>
      <td>${escapeHtml(a.turno || '-')}</td>
      <td class="table-actions">
        <button class="btn btn-sm btn-outline-primary btn-editar"
          data-id="${a.id}" data-nome="${escapeHtml(a.nome)}" data-matricula="${escapeHtml(a.matricula || '')}"
          data-turma="${escapeHtml(a.turma || '')}" data-turno="${escapeHtml(a.turno || '')}">Editar</button>
        <button class="btn btn-sm btn-outline-danger btn-excluir" data-id="${a.id}">Excluir</button>
      </td>
    </tr>`).join('');
};

const carregar = async () => {
  alunos = await listarAlunos();
  aplicarFiltros();
};

const aplicarFiltros = () => {
  const nome = qs('#filtroNome')?.value.trim().toLowerCase() || '';
  const matricula = qs('#filtroMatricula')?.value.trim().toLowerCase() || '';
  const turma = qs('#filtroTurma')?.value.trim().toLowerCase() || '';
  const filtrados = alunos.filter((a) => {
    if (nome && !a.nome.toLowerCase().includes(nome)) return false;
    if (matricula && !(a.matricula || '').toLowerCase().includes(matricula)) return false;
    if (turma && !(a.turma || '').toLowerCase().includes(turma)) return false;
    return true;
  });
  renderizar(filtrados);
};

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = await buscarUsuarioAtual();
  if (usuario?.tipo !== 'Administrador') {
    toast('Apenas Administradores podem gerenciar alunos.', 'danger');
    setTimeout(() => { location.href = 'painel.html'; }, 800);
    return;
  }

  setLoading('#alunosTabela', true);
  await carregar();
  setLoading('#alunosTabela', false);

  qsa('.filtro-aluno').forEach((campo) => {
    campo.addEventListener('input', debounce(aplicarFiltros));
  });

  qs('#btnNovoAluno').addEventListener('click', () => {
    qs('#alunoForm').reset();
    qs('#id').value = '';
    bootstrap.Modal.getOrCreateInstance(qs('#alunoModal')).show();
  });

  qs('#alunosTabela').addEventListener('click', async (event) => {
    if (event.target.matches('.btn-editar')) {
      qs('#id').value = event.target.dataset.id;
      qs('#nome').value = event.target.dataset.nome;
      qs('#matricula').value = event.target.dataset.matricula;
      qs('#turma').value = event.target.dataset.turma;
      qs('#turno').value = event.target.dataset.turno;
      bootstrap.Modal.getOrCreateInstance(qs('#alunoModal')).show();
    }
    if (event.target.matches('.btn-excluir')) {
      if (!await confirmar('Deseja excluir este aluno?')) return;
      try {
        await excluirAluno(event.target.dataset.id);
        toast('Aluno excluído.');
        await carregar();
      } catch (error) {
        toast(error.message || 'Erro ao excluir aluno.', 'danger');
      }
    }
  });

  qs('#alunoForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validarFormulario(event.currentTarget)) return;
    try {
      await salvarAluno({
        id: qs('#id').value ? Number(qs('#id').value) : undefined,
        nome: qs('#nome').value.trim(),
        matricula: qs('#matricula').value.trim() || null,
        turma: qs('#turma').value.trim() || null,
        turno: qs('#turno').value || null,
      });
      bootstrap.Modal.getInstance(qs('#alunoModal')).hide();
      toast('Aluno salvo.');
      await carregar();
    } catch (error) {
      toast(error.message || 'Erro ao salvar aluno.', 'danger');
    }
  });
});
