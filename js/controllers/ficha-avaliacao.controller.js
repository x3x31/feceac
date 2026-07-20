import { escapeHtml, qs } from '../util.js';
import { toast } from '../ui.js';
import { obterProjeto, listarProjetos } from '../services/projeto.service.js';
import { listarCriterios } from '../services/avaliacao.service.js';
import { listarProfessores } from '../services/professor.service.js';
import { supabase } from '../supabase.js';

let todosProjetos = [];
let todosProfessores = [];
let projetosFiltrados = [];

const FILTRO_NUM_ALUNOS = 4;

const renderizarCriterios = (criterios) => {
  if (criterios.length === 0) {
    return '<div class="text-muted">Nenhum critério cadastrado para este tipo de projeto.</div>';
  }
  return `<table class="table table-bordered table-sm ficha-tabela-criterios mb-0">
    <thead><tr>
      <th style="width:90%">Critério</th>
      <th style="width:10%">Nota</th>
    </tr></thead>
    <tbody>${criterios.map((c) => `
      <tr>
        <td><strong>${escapeHtml(c.descricao)}</strong> <span class="text-muted">(peso: ${Number(c.peso)})</span>${c.observacoes ? '<br><span class="text-muted">' + escapeHtml(c.observacoes) + '</span>' : ''}</td>
        <td></td>
      </tr>`).join('')}
    </tbody>
  </table>`;
};

const renderizarFicha = (projeto, criterios) => {
  qs('#fichaTitulo').textContent = projeto.titulo || '-';
  qs('#fichaTipo').textContent = projeto.tipo?.nome || '-';
  qs('#fichaArea').textContent = projeto.area?.nome || '-';
  qs('#fichaOrientador').textContent = projeto.orientador?.nome || '-';
  qs('#fichaCoorientador').textContent = projeto.coorientador?.nome || '-';

  qs('#fichaCriterios').innerHTML = renderizarCriterios(criterios);

  const alunos = (projeto.alunos || []).map((pa) => pa.aluno).filter(Boolean);
  const linhasAlunos = [];
  for (let i = 0; i < Math.max(alunos.length, FILTRO_NUM_ALUNOS); i++) {
    const a = alunos[i];
    if (a) {
      linhasAlunos.push(`<div class="ficha-linha-aluno"><span class="ficha-linha-aluno-num">${i + 1}º</span><span class="ficha-linha-aluno-nome">${escapeHtml(a.nome)}${a.turma ? ' — ' + escapeHtml(a.turma) : ''}</span></div>`);
    } else {
      linhasAlunos.push(`<div class="ficha-linha-aluno"><span class="ficha-linha-aluno-num">${i + 1}º</span><div class="ficha-linha-aluno-linha"></div></div>`);
    }
  }
  qs('#fichaAlunosLinhas').innerHTML = linhasAlunos.join('');

  qs('#fichaContainer').classList.remove('d-none');
};

const aplicarFiltrosProjeto = () => {
  const tipoId = qs('#filtroTipo').value;
  const orientadorId = qs('#filtroOrientador').value;

  projetosFiltrados = todosProjetos.filter((p) => {
    if (tipoId && String(p.tipo_projeto_id) !== tipoId) return false;
    if (orientadorId && String(p.orientador_id) !== orientadorId) return false;
    return true;
  });

  popularDropdownProjetos(qs('#filtroProjetoBusca').value);
};

const popularDropdownProjetos = (termo = '') => {
  const dropdown = qs('#filtroProjetoDropdown');
  const lower = termo.toLowerCase();
  const filtrados = lower
    ? projetosFiltrados.filter((p) => p.titulo.toLowerCase().includes(lower))
    : projetosFiltrados;

  if (filtrados.length === 0) {
    dropdown.classList.add('d-none');
    return;
  }

  dropdown.innerHTML = filtrados.slice(0, 50).map((p) =>
    `<button type="button" class="list-group-item list-group-item-action" data-id="${p.id}">${escapeHtml(p.titulo)} — ${escapeHtml(p.tipo?.nome || '')}</button>`
  ).join('');
  dropdown.classList.remove('d-none');
};

const popularDropdownOrientadores = (termo = '') => {
  const dropdown = qs('#filtroOrientadorDropdown');
  const lower = termo.toLowerCase();
  const filtrados = lower
    ? todosProfessores.filter((p) => p.nome.toLowerCase().includes(lower))
    : todosProfessores;

  dropdown.innerHTML = `<button type="button" class="list-group-item list-group-item-action" data-id="">Todos</button>` +
    filtrados.slice(0, 50).map((p) =>
      `<button type="button" class="list-group-item list-group-item-action" data-id="${p.id}">${escapeHtml(p.nome)}</button>`
    ).join('');
  dropdown.classList.remove('d-none');
};

const carregarProjeto = async (id) => {
  try {
    const projeto = await obterProjeto(id);
    const criterios = await listarCriterios(projeto.tipo_projeto_id);
    renderizarFicha(projeto, criterios);
  } catch (error) {
    toast(error.message || 'Erro ao carregar projeto.', 'danger');
  }
};

const carregarCriteriosTipo = async () => {
  const tipoId = qs('#filtroTipo').value;
  if (!tipoId) {
    qs('#fichaCriterios').innerHTML = '<div class="text-muted">Selecione um tipo de projeto para ver os critérios.</div>';
    return;
  }
  try {
    const criterios = await listarCriterios(Number(tipoId));
    qs('#fichaCriterios').innerHTML = renderizarCriterios(criterios);
  } catch (error) {
    toast(error.message || 'Erro ao carregar critérios.', 'danger');
  }
};

const carregarTiposProjeto = async () => {
  const { data, error } = await supabase
    .from('tipos_projeto')
    .select('*')
    .order('nome');
  if (error) throw error;
  return data;
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const [projetos, professores, tipos] = await Promise.all([
      listarProjetos(),
      listarProfessores(),
      carregarTiposProjeto(),
    ]);
    todosProjetos = projetos;
    todosProfessores = professores;
    projetosFiltrados = projetos;

    const tiposSelect = qs('#filtroTipo');
    tiposSelect.innerHTML = '<option value="">Selecione</option>' +
      tipos.map((t) => `<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join('');
  } catch (error) {
    toast(error.message || 'Erro ao carregar dados.', 'danger');
    return;
  }

  const tiposSelect = qs('#filtroTipo');

  tiposSelect.addEventListener('change', () => {
    const tipoNome = tiposSelect.options[tiposSelect.selectedIndex]?.text || '';
    qs('#fichaTipo').textContent = tipoNome || '-';
    qs('#filtroOrientador').value = '';
    qs('#filtroOrientadorBusca').value = '';
    qs('#projetoId').value = '';
    qs('#filtroProjetoBusca').value = '';
    qs('#fichaContainer').classList.remove('d-none');
    aplicarFiltrosProjeto();
    carregarCriteriosTipo();
  });

  const orientadorInput = qs('#filtroOrientadorBusca');
  const orientadorDropdown = qs('#filtroOrientadorDropdown');
  const orientadorHidden = qs('#filtroOrientador');

  orientadorInput.addEventListener('input', () => {
    orientadorHidden.value = '';
    popularDropdownOrientadores(orientadorInput.value);
    qs('#projetoId').value = '';
    qs('#filtroProjetoBusca').value = '';
    if (!qs('#fichaContainer').classList.contains('d-none')) {
      qs('#fichaTipo').textContent = tiposSelect.options[tiposSelect.selectedIndex]?.text || '-';
    }
    aplicarFiltrosProjeto();
  });

  orientadorInput.addEventListener('focus', () => {
    popularDropdownOrientadores(orientadorInput.value);
  });

  orientadorDropdown.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-id]');
    if (!btn) return;
    orientadorHidden.value = btn.dataset.id;
    orientadorInput.value = btn.dataset.id
      ? todosProfessores.find((p) => String(p.id) === btn.dataset.id)?.nome || ''
      : '';
    orientadorDropdown.classList.add('d-none');
    qs('#projetoId').value = '';
    qs('#filtroProjetoBusca').value = '';
    aplicarFiltrosProjeto();
  });

  const projetoInput = qs('#filtroProjetoBusca');
  const projetoDropdown = qs('#filtroProjetoDropdown');
  const projetoHidden = qs('#projetoId');

  projetoInput.addEventListener('input', () => {
    projetoHidden.value = '';
    popularDropdownProjetos(projetoInput.value);
  });

  projetoInput.addEventListener('focus', () => {
    popularDropdownProjetos(projetoInput.value);
  });

  projetoDropdown.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-id]');
    if (!btn) return;
    projetoHidden.value = btn.dataset.id;
    const projeto = projetosFiltrados.find((p) => String(p.id) === btn.dataset.id);
    projetoInput.value = projeto ? projeto.titulo : '';
    projetoDropdown.classList.add('d-none');
    carregarProjeto(btn.dataset.id);
  });

  document.addEventListener('click', (event) => {
    if (!orientadorDropdown.contains(event.target) && event.target !== orientadorInput) {
      orientadorDropdown.classList.add('d-none');
    }
    if (!projetoDropdown.contains(event.target) && event.target !== projetoInput) {
      projetoDropdown.classList.add('d-none');
    }
  });

  qs('#btnImprimir').addEventListener('click', () => {
    window.print();
  });

  const params = new URLSearchParams(location.search);
  const projetoId = params.get('projeto_id');
  if (projetoId) {
    const projeto = todosProjetos.find((p) => String(p.id) === projetoId);
    if (projeto) {
      projetoInput.value = projeto.titulo;
      projetoHidden.value = projeto.id;
      if (projeto.tipo) {
        tiposSelect.value = projeto.tipo.id;
        await carregarCriteriosTipo();
      }
      if (projeto.orientador) {
        orientadorHidden.value = projeto.orientador.id;
        orientadorInput.value = projeto.orientador.nome;
      }
      aplicarFiltrosProjeto();
      carregarProjeto(projetoId);
    }
  }
});
