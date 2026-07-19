import { anoAtual, debounce, escapeHtml, getParam, qs, qsa, validarFormulario } from '../util.js';
import { confirmar, mensagemVazia, setLoading, toast } from '../ui.js';
import { listarAreas } from '../services/area.service.js';
import { excluirProjeto, listarProjetos, obterProjeto, salvarProjeto } from '../services/projeto.service.js';
import { buscarUsuarioAtual } from '../services/usuario.service.js';
import { supabase } from '../supabase.js';

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

const opcoesTurno = (valor = '') => {
  const turnos = ['', 'MATUTINO', 'VESPERTINO', 'INTEGRAL'];
  const labels = { '': 'Turno', MATUTINO: 'Matutino', VESPERTINO: 'Vespertino', INTEGRAL: 'Integral' };
  return turnos
    .map((t) => `<option value="${t}" ${t === valor ? 'selected' : ''}>${labels[t]}</option>`)
    .join('');
};

const carregarSelectProfessores = async (select, valor = '', placeholder = 'Selecione') => {
  const { data, error } = await supabase
    .from('professores')
    .select('*')
    .order('nome');
  if (error) throw error;
  select.innerHTML = `<option value="">${placeholder}</option>` + data
    .map((p) => `<option value="${p.id}" ${p.id == valor ? 'selected' : ''}>${escapeHtml(p.nome)}</option>`)
    .join('');
};

const carregarSelectAreas = async (select, valor = '', tipoId = null) => {
  const areas = await listarAreas(tipoId);
  select.innerHTML = '<option value="">Selecione</option>' + areas
    .map((area) => `<option value="${area.id}">${escapeHtml(area.nome)}</option>`)
    .join('');
  select.value = valor || '';
};

const carregarSelectTipos = async (select, valor = '') => {
  const { data, error } = await supabase
    .from('tipos_projeto')
    .select('*')
    .order('nome');
  if (error) throw error;
  select.innerHTML = '<option value="">Selecione</option>' + data
    .map((t) => `<option value="${t.id}" ${t.id == valor ? 'selected' : ''}>${escapeHtml(t.nome)}</option>`)
    .join('');
};

const linhaAluno = (nome = '', turma = 'EMPM1A', id = '', matricula = '', turno = '') => {
  const vinculado = !!id;
  const disabled = vinculado ? 'disabled' : '';
  const readonly = vinculado ? 'readonly' : '';
  return `
  <div class="aluno-item mb-2">
    <input type="hidden" class="aluno-id" value="${id}">
    <div class="aluno-grid">
      <input class="form-control aluno-nome" value="${escapeHtml(nome)}" required placeholder="Nome do aluno" ${readonly}>
      <input class="form-control aluno-matricula" value="${escapeHtml(matricula)}" placeholder="Matrícula" ${readonly}>
      <select class="form-select aluno-turno" aria-label="Turno do aluno" ${disabled}>${opcoesTurno(turno)}</select>
      <select class="form-select aluno-turma" required aria-label="Turma do aluno" ${disabled}>${opcoesTurma(turma)}</select>
      <button class="btn btn-outline-danger btn-remover-aluno" type="button">Remover</button>
    </div>
  </div>`;
};

const adicionarAluno = (nome = '', turma = 'EMPM1A', id = '', matricula = '', turno = '') => {
  qs('#alunosContainer').insertAdjacentHTML('beforeend', linhaAluno(nome, turma, id, matricula, turno));
};

const iniciarModalAlunos = () => {
  const turnoSelect = qs('#filtroTurno');
  const turmaSelect = qs('#filtroTurma');

  qs('#filtroTurno').addEventListener('change', async () => {
    const turno = turnoSelect.value;
    turmaSelect.innerHTML = '<option value="">Carregando...</option>';
    turmaSelect.disabled = true;

    if (!turno) {
      turmaSelect.innerHTML = '<option value="">Selecione o turno primeiro</option>';
      return;
    }

    const { data, error } = await supabase
      .from('alunos')
      .select('turma')
      .eq('turno', turno)
      .order('turma');

    if (error || !data) {
      turmaSelect.innerHTML = '<option value="">Erro ao carregar turmas</option>';
      return;
    }

    const turmasUnicas = [...new Set(data.map((a) => a.turma))].filter(Boolean);
    turmaSelect.innerHTML = '<option value="">Selecione a turma</option>' +
      turmasUnicas.map((t) => `<option value="${t}">${t}</option>`).join('');
    turmaSelect.disabled = false;
  });

  qs('#btnBuscarAlunos').addEventListener('click', () => {
    qs('#alunosModalTabela').innerHTML = '';
    qs('#alunosModalMensagem').classList.add('d-none');
    qs('#marcarTodosAlunos').checked = false;
    turnoSelect.value = '';
    turmaSelect.innerHTML = '<option value="">Selecione o turno primeiro</option>';
    turmaSelect.disabled = true;
    bootstrap.Modal.getOrCreateInstance(qs('#alunosModal')).show();
  });

  qs('#btnFiltrarAlunos').addEventListener('click', async () => {
    const turma = turmaSelect.value;
    if (!turma) {
      toast('Selecione uma turma.', 'warning');
      return;
    }

    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('turma', turma)
      .order('nome');

    if (error) {
      toast('Erro ao buscar alunos.', 'danger');
      return;
    }

    const tabela = qs('#alunosModalTabela');
    const msg = qs('#alunosModalMensagem');
    qs('#marcarTodosAlunos').checked = false;

    if (!data.length) {
      tabela.innerHTML = '';
      msg.classList.remove('d-none');
      return;
    }

    msg.classList.add('d-none');
    tabela.innerHTML = data.map((aluno) => `
      <tr class="aluno-linha" data-id="${aluno.id}" data-nome="${escapeHtml(aluno.nome)}" data-turma="${escapeHtml(aluno.turma)}" data-turno="${escapeHtml(aluno.turno || '')}">
        <td><input type="checkbox" class="form-check-input aluno-check" data-id="${aluno.id}" data-nome="${escapeHtml(aluno.nome)}" data-turma="${escapeHtml(aluno.turma)}" data-matricula="${escapeHtml(aluno.matricula || '')}" data-turno="${escapeHtml(aluno.turno || '')}"></td>
        <td>${escapeHtml(aluno.nome)}</td>
        <td>${escapeHtml(aluno.matricula || '-')}</td>
      </tr>
    `).join('');
  });

  qs('#alunosModalTabela').addEventListener('click', (event) => {
    const linha = event.target.closest('.aluno-linha');
    if (!linha) return;
    const cb = linha.querySelector('.aluno-check');
    if (event.target.classList.contains('aluno-check')) {
      linha.style.backgroundColor = cb.checked ? '#b4cdf0' : '';
      return;
    }
    cb.checked = !cb.checked;
    linha.style.backgroundColor = cb.checked ? '#b4cdf0' : '';
  });

  qs('#marcarTodosAlunos').addEventListener('change', (event) => {
    qsa('.aluno-check').forEach((cb) => {
      cb.checked = event.target.checked;
      cb.closest('.aluno-linha').style.backgroundColor = cb.checked ? '#b4cdf0' : '';
    });
  });

  qs('#btnConfirmarAlunos').addEventListener('click', () => {
    const marcados = qsa('.aluno-check:checked');
    if (!marcados.length) {
      toast('Selecione ao menos um aluno.', 'warning');
      return;
    }

    const nomesExistentes = new Set(
      qsa('.aluno-nome').map((input) => input.value.trim().toLowerCase())
    );

    let adicionados = 0;
    marcados.forEach((cb) => {
      const nome = cb.dataset.nome;
      if (!nomesExistentes.has(nome.toLowerCase())) {
        adicionarAluno(nome, cb.dataset.turma, cb.dataset.id, cb.dataset.matricula || '', cb.dataset.turno || '');
        nomesExistentes.add(nome.toLowerCase());
        adicionados++;
      }
    });

    bootstrap.Modal.getInstance(qs('#alunosModal')).hide();

    if (adicionados) {
      toast(`${adicionados} aluno(s) adicionado(s).`);
    } else {
      toast('Todos os alunos selecionados já estão na lista.', 'info');
    }
  });
};

const iniciarFormularioProjeto = async () => {
  const form = qs('#projetoForm');
  const id = getParam('id');
  qs('#ano').value = anoAtual();
  await carregarSelectTipos(qs('#tipo_projeto_id'));
  await Promise.all([
    carregarSelectAreas(qs('#area_id'), '', qs('#tipo_projeto_id').value || null),
    carregarSelectProfessores(qs('#orientador_id')),
    carregarSelectProfessores(qs('#coorientador_id')),
  ]);

  qs('#tipo_projeto_id').addEventListener('change', async () => {
    const valorAtual = qs('#area_id').value;
    await carregarSelectAreas(qs('#area_id'), '', qs('#tipo_projeto_id').value || null);
    if (valorAtual && qs(`#area_id option[value="${valorAtual}"]`)) {
      qs('#area_id').value = valorAtual;
    }
  });

  adicionarAluno();
  iniciarModalAlunos();

  if (id) {
    const projeto = await obterProjeto(id);
    qs('#formTitulo').textContent = 'Editar Projeto';
    qs('#id').value = projeto.id;
    qs('#ano').value = projeto.ano;
    qs('#titulo').value = projeto.titulo;
    qs('#tipo_projeto_id').value = projeto.tipo_projeto_id || '';
    await carregarSelectAreas(qs('#area_id'), projeto.area_id, projeto.tipo_projeto_id || null);
    qs('#orientador_id').value = projeto.orientador_id || '';
    qs('#coorientador_id').value = projeto.coorientador_id || '';
    qs('#alunosContainer').innerHTML = '';
    projeto.alunos.forEach((item) => adicionarAluno(item.aluno.nome, item.turma || item.aluno.turma, item.aluno.id, item.aluno.matricula, item.aluno.turno || ''));
  }

  qs('#btnAdicionarAluno').addEventListener('click', () => adicionarAluno());
  qs('#alunosContainer').addEventListener('click', async (event) => {
    if (!event.target.matches('.btn-remover-aluno')) return;
    if (!await confirmar('Deseja remover este aluno do projeto?')) return;
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
      tipo_projeto_id: Number(qs('#tipo_projeto_id').value) || null,
      area_id: Number(qs('#area_id').value),
      orientador_id: Number(qs('#orientador_id').value),
      coorientador_id: Number(qs('#coorientador_id').value) || null,
      alunos: qsa('.aluno-item').map((item) => ({
        id: qs('.aluno-id', item).value || null,
        matricula: qs('.aluno-matricula', item).value || null,
        nome: qs('.aluno-nome', item).value.trim(),
        turma: qs('.aluno-turma', item).value,
        turno: qs('.aluno-turno', item).value || null,
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

const renderizarProjetos = (projetos, ehAdmin = false) => {
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
      <td>${escapeHtml(projeto.orientador?.nome || '-')}</td>
      <td>${projeto.alunos?.length || 0}</td>
      <td class="table-actions">
        <a class="btn btn-sm btn-outline-primary" href="editar-projeto.html?id=${projeto.id}">Editar</a>
        ${ehAdmin ? `<button class="btn btn-sm btn-outline-danger btn-excluir" data-id="${projeto.id}">Excluir</button>` : ''}
      </td>
    </tr>
   <tr class="d-none alunos-detalhe" data-projeto-id="${projeto.id}">
  <td></td>
  <td colspan="7">

    <div class="row">

      <div class="col-md-4">

        <h6>Alunos</h6>

        <div class="table-responsive">
          <table class="table table-sm table-bordered mb-0">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Turma</th>
              </tr>
            </thead>

            <tbody>

              ${(projeto.alunos || []).map((item) => `
                <tr>
                  <td>${escapeHtml(item.aluno.nome)}</td>
                  <td>${escapeHtml(item.turma || item.aluno.turma || '-')}</td>
                </tr>
              `).join('') || `
                <tr>
                  <td colspan="2">
                    Nenhum aluno cadastrado.
                  </td>
                </tr>
              `}

            </tbody>

          </table>
        </div>

      </div>

      <div class="col-md-8">

        <h6>Avaliações</h6>

        <div class="table-responsive">

          <table class="table table-sm table-bordered mb-0">

            <thead>

              <th>Avaliador</th>
              <th>Critério</th>
              <th>Peso</th>
              <th>Nota</th>

            </thead>

            <tbody>

            ${

              (projeto.avaliacoes || []).length

              ? projeto.avaliacoes.map((avaliacao) =>

                  (avaliacao.notas || []).map((nota) => `

                    <tr>

                      <td>
                        ${escapeHtml(avaliacao.avaliador_id)}
                      </td>

                      <td>
                        ${escapeHtml(nota.criterio?.descricao || '-')}
                      </td>

                      <td>
                        ${Number(nota.criterio?.peso || 0).toFixed(2)}
                      </td>

                      <td>
                        ${nota.nota}
                      </td>

                    </tr>

                  `).join('')

                ).join('')

              : `

                <tr>

                  <td colspan="4">
                    Nenhuma avaliação registrada.
                  </td>

                </tr>

              `

            }

            </tbody>

          </table>

        </div>

      </div>

    </div>

  </td>
</tr>
    `).join('');
};

let ehAdmin = false;

const carregarProjetos = async () => {
  const filtros = {
    nome: qs('#filtroNome')?.value.trim(),
    area_id: qs('#filtroArea')?.value,
    orientador_id: qs('#filtroOrientador')?.value,
    ano: qs('#filtroAno')?.value,
  };
  const projetos = await listarProjetos(filtros);
  renderizarProjetos(projetos, ehAdmin);
};

const iniciarListagemProjetos = async () => {
  const usuario = await buscarUsuarioAtual();
  ehAdmin = usuario?.tipo === 'Administrador';
  await Promise.all([
    carregarSelectAreas(qs('#filtroArea')),
    carregarSelectProfessores(qs('#filtroOrientador'), '', 'Todos'),
  ]);
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

    if (event.target.matches('.btn-excluir')) {
      if (!await confirmar('Deseja excluir este projeto?')) return;
      try {
        await excluirProjeto(event.target.dataset.id);
        toast('Projeto excluído.');
        await carregarProjetos();
      } catch (error) {
        toast(error.message || 'Erro ao excluir projeto.', 'danger');
      }
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
