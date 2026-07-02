import { anoAtual, debounce, escapeHtml, getParam, qs, qsa, validarFormulario } from '../util.js';
import { confirmar, mensagemVazia, setLoading, toast } from '../ui.js';
import { listarAreas } from '../services/area.service.js';
import { excluirProjeto, listarProjetos, obterProjeto, salvarProjeto } from '../services/projeto.service.js';

const TURMAS = [
  'EMPINT1A', 'EMPM1A', 'EMPM1B', 'EMPM1C', 'EMPM1D', 'EMPM1E', 'EMPM1F', 'EMPM1G',
  'EMPM2A', 'EMPM2B', 'EMPM2C', 'EMPM2D', 'EMPM2E', 'EMPM2F', 'EMPM2G',
  'EMPM3A', 'EMPM3B', 'EMPM3C', 'EMPM3D', 'EMPM3E', 'EMPM3F',
  'EMPV1A', 'EMPV1B', 'EMPV2A', 'EMPV2B', 'EMPV3A', 'EMPV3B',
  'INFIINT1A', 'INFV2A', 'INFV3A',
];

const opcoesTurma = (valor = '') => TURMAS
  .map((turma) => `<option value="${turma}" ${turma === valor ? 'selected' : ''}>${turma}</option>`)
  .join('');

const carregarSelectAreas = async (select, valor = '') => {
  const areas = await listarAreas();
  select.innerHTML = '<option value="">Selecione</option>' + areas
    .map((area) => `<option value="${area.id}">${escapeHtml(area.nome)}</option>`)
    .join('');
  select.value = valor || '';
};

const linhaAluno = (nome = '', turma = 'EMPM1A') => `
  <div class="input-group aluno-item mb-2">
    <input class="form-control aluno-nome" value="${escapeHtml(nome)}" required placeholder="Nome do aluno">
    <select class="form-select aluno-turma" required aria-label="Turma do aluno">${opcoesTurma(turma)}</select>
    <button class="btn btn-outline-danger btn-remover-aluno" type="button">Remover</button>
  </div>`;

const adicionarAluno = (nome = '', turma = 'EMPM1A') => {
  qs('#alunosContainer').insertAdjacentHTML('beforeend', linhaAluno(nome, turma));
};

const iniciarFormularioProjeto = async () => {
  const form = qs('#projetoForm');
  const id = getParam('id');
  qs('#ano').value = anoAtual();
  await carregarSelectAreas(qs('#area_id'));
  adicionarAluno();

  if (id) {
    const projeto = await obterProjeto(id);
    qs('#formTitulo').textContent = 'Editar Projeto';
    qs('#id').value = projeto.id;
    qs('#ano').value = projeto.ano;
    qs('#titulo').value = projeto.titulo;
    qs('#area_id').value = projeto.area_id;
    qs('#orientador').value = projeto.orientador;
    qs('#coorientador').value = projeto.coorientador || '';
    qs('#alunosContainer').innerHTML = '';
    projeto.alunos.forEach((item) => adicionarAluno(item.aluno.nome, item.aluno.turma));
  }

  qs('#btnAdicionarAluno').addEventListener('click', () => adicionarAluno());
  qs('#alunosContainer').addEventListener('click', (event) => {
    if (!event.target.matches('.btn-remover-aluno')) return;
    event.target.closest('.aluno-item').remove();
    if (!qsa('.aluno-item').length) adicionarAluno();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validarFormulario(form)) return;

    const payload = {
      id: qs('#id').value || undefined,
      ano: Number(qs('#ano').value),
      titulo: qs('#titulo').value.trim(),
      area_id: Number(qs('#area_id').value),
      orientador: qs('#orientador').value.trim(),
      coorientador: qs('#coorientador').value.trim() || null,
      alunos: qsa('.aluno-item').map((item) => ({
        nome: qs('.aluno-nome', item).value.trim(),
        turma: qs('.aluno-turma', item).value,
      })),
    };

    try {
      await salvarProjeto(payload);
      toast('Projeto salvo com sucesso.');
      setTimeout(() => { location.href = 'projetos.html'; }, 800);
    } catch (error) {
      toast(error.message || 'Erro ao salvar projeto.', 'danger');
    }
  });
};

const renderizarProjetos = (projetos) => {
  const corpo = qs('#projetosTabela');
  if (!projetos.length) {
    corpo.innerHTML = `<tr><td colspan="8">${mensagemVazia()}</td></tr>`;
    return;
  }

  corpo.innerHTML = projetos.map((projeto) => `
    <tr>
      <td><button class="btn btn-sm btn-outline-secondary btn-expandir" data-id="${projeto.id}" type="button">+</button></td>
      <td>${projeto.id}</td>
      <td>${projeto.ano}</td>
      <td>${escapeHtml(projeto.titulo)}</td>
      <td>${escapeHtml(projeto.area?.nome || '-')}</td>
      <td>${escapeHtml(projeto.orientador)}</td>
      <td>${projeto.alunos?.length || 0}</td>
      <td class="table-actions">
        <a class="btn btn-sm btn-outline-primary" href="editar-projeto.html?id=${projeto.id}">Editar</a>
        <button class="btn btn-sm btn-outline-danger btn-excluir" data-id="${projeto.id}">Excluir</button>
      </td>
    </tr>
    <tr class="d-none alunos-detalhe" data-projeto-id="${projeto.id}">
      <td></td>
      <td colspan="7">
        <div class="table-responsive">
          <table class="table table-sm mb-0">
            <thead><tr><th>Aluno</th><th>Turma</th></tr></thead>
            <tbody>${(projeto.alunos || []).map((item) => `
              <tr><td>${escapeHtml(item.aluno.nome)}</td><td>${escapeHtml(item.aluno.turma || '-')}</td></tr>
            `).join('') || '<tr><td colspan="2">Nenhum aluno cadastrado.</td></tr>'}</tbody>
          </table>
        </div>
      </td>
    </tr>`).join('');
};

const carregarProjetos = async () => {
  const filtros = {
    nome: qs('#filtroNome')?.value.trim(),
    area_id: qs('#filtroArea')?.value,
    ano: qs('#filtroAno')?.value,
  };
  const projetos = await listarProjetos(filtros);
  renderizarProjetos(projetos);
};

const iniciarListagemProjetos = async () => {
  await carregarSelectAreas(qs('#filtroArea'));
  await carregarProjetos();

  qsa('.filtro-projeto').forEach((campo) => {
    campo.addEventListener('input', debounce(carregarProjetos));
    campo.addEventListener('change', carregarProjetos);
  });

  qs('#projetosTabela').addEventListener('click', async (event) => {
    if (event.target.matches('.btn-expandir')) {
      const id = event.target.dataset.id;
      const detalhe = qs(`.alunos-detalhe[data-projeto-id="${id}"]`);
      detalhe.classList.toggle('d-none');
      event.target.textContent = detalhe.classList.contains('d-none') ? '+' : '-';
      return;
    }

    if (!event.target.matches('.btn-excluir')) return;
    if (!confirmar('Deseja excluir este projeto?')) return;
    try {
      await excluirProjeto(event.target.dataset.id);
      toast('Projeto excluído.');
      await carregarProjetos();
    } catch (error) {
      toast(error.message || 'Erro ao excluir projeto.', 'danger');
    }
  });
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (qs('#projetoForm')) await iniciarFormularioProjeto();
    if (qs('#projetosTabela')) {
      setLoading('#estadoProjetos', true);
      await iniciarListagemProjetos();
      setLoading('#estadoProjetos', false);
    }
  } catch (error) {
    toast(error.message || 'Erro ao carregar projetos.', 'danger');
  }
});
