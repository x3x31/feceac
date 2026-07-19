import { debounce, escapeHtml, qs, qsa, validarFormulario } from '../util.js';
import { confirmar, mensagemVazia, setLoading, toast } from '../ui.js';
import { buscarUsuarioAtual } from '../services/usuario.service.js';
import { excluirProfessor, listarProfessores, salvarProfessor } from '../services/professor.service.js';

let professores = [];

const renderizar = (lista) => {
  const corpo = qs('#professoresTabela');
  if (!lista.length) {
    corpo.innerHTML = `<tr><td colspan="4">${mensagemVazia()}</td></tr>`;
    return;
  }
  corpo.innerHTML = lista.map((p) => `
    <tr>
      <td>${p.id}</td>
      <td>${escapeHtml(p.nome)}</td>
      <td>${escapeHtml(p.matricula || '-')}</td>
      <td class="table-actions">
        <button class="btn btn-sm btn-outline-primary btn-editar"
          data-id="${p.id}" data-nome="${escapeHtml(p.nome)}" data-matricula="${escapeHtml(p.matricula || '')}">Editar</button>
        <button class="btn btn-sm btn-outline-danger btn-excluir" data-id="${p.id}">Excluir</button>
      </td>
    </tr>`).join('');
};

const carregar = async () => {
  professores = await listarProfessores();
  aplicarFiltros();
};

const aplicarFiltros = () => {
  const nome = qs('#filtroNome')?.value.trim().toLowerCase() || '';
  const matricula = qs('#filtroMatricula')?.value.trim().toLowerCase() || '';
  const filtrados = professores.filter((p) => {
    if (nome && !p.nome.toLowerCase().includes(nome)) return false;
    if (matricula && !(p.matricula || '').toLowerCase().includes(matricula)) return false;
    return true;
  });
  renderizar(filtrados);
};

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = await buscarUsuarioAtual();
  if (usuario?.tipo !== 'Administrador') {
    toast('Apenas Administradores podem gerenciar professores.', 'danger');
    setTimeout(() => { location.href = 'painel.html'; }, 800);
    return;
  }

  setLoading('#professoresTabela', true);
  await carregar();
  setLoading('#professoresTabela', false);

  qsa('.filtro-professor').forEach((campo) => {
    campo.addEventListener('input', debounce(aplicarFiltros));
  });

  qs('#btnNovoProfessor').addEventListener('click', () => {
    qs('#professorForm').reset();
    qs('#id').value = '';
    bootstrap.Modal.getOrCreateInstance(qs('#professorModal')).show();
  });

  qs('#professoresTabela').addEventListener('click', async (event) => {
    if (event.target.matches('.btn-editar')) {
      qs('#id').value = event.target.dataset.id;
      qs('#nome').value = event.target.dataset.nome;
      qs('#matricula').value = event.target.dataset.matricula;
      bootstrap.Modal.getOrCreateInstance(qs('#professorModal')).show();
    }
    if (event.target.matches('.btn-excluir')) {
      if (!await confirmar('Deseja excluir este professor?')) return;
      try {
        await excluirProfessor(event.target.dataset.id);
        toast('Professor excluído.');
        await carregar();
      } catch (error) {
        toast(error.message || 'Erro ao excluir professor.', 'danger');
      }
    }
  });

  qs('#professorForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validarFormulario(event.currentTarget)) return;
    try {
      await salvarProfessor({
        id: qs('#id').value ? Number(qs('#id').value) : undefined,
        nome: qs('#nome').value.trim(),
        matricula: qs('#matricula').value.trim(),
      });
      bootstrap.Modal.getInstance(qs('#professorModal')).hide();
      toast('Professor salvo.');
      await carregar();
    } catch (error) {
      toast(error.message || 'Erro ao salvar professor.', 'danger');
    }
  });
});
