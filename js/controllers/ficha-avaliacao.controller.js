import { escapeHtml, qs, qsa } from '../util.js';
import { toast } from '../ui.js';
import { obterProjeto, listarProjetos } from '../services/projeto.service.js';
import { listarCriterios } from '../services/avaliacao.service.js';

let todosProjetos = [];

const renderizarFicha = (projeto, criterios) => {
  qs('#fichaTitulo').textContent = projeto.titulo || '-';
  qs('#fichaTipo').textContent = projeto.tipo?.nome || '-';
  qs('#fichaArea').textContent = projeto.area?.nome || '-';
  qs('#fichaOrientador').textContent = projeto.orientador?.nome || '-';
  qs('#fichaCoorientador').textContent = projeto.coorientador?.nome || '-';

  const alunos = (projeto.alunos || [])
    .map((pa) => pa.aluno)
    .filter(Boolean);

  qs('#fichaAlunos').innerHTML = alunos.length > 0
    ? alunos.map((a, i) => `<div class="ficha-alunos-item">${i + 1}. ${escapeHtml(a.nome)}${a.turma ? ' — ' + escapeHtml(a.turma) : ''}</div>`).join('')
    : '<div class="ficha-alunos-item text-muted">Nenhum aluno cadastrado</div>';

  qs('#fichaCriterios').innerHTML = criterios.map((c, i) => `
    <tr>
      <td class="text-center">${i + 1}</td>
      <td class="criterio-desc">${escapeHtml(c.descricao)}${c.observacoes ? '<br><small class="text-muted">' + escapeHtml(c.observacoes) + '</small>' : ''}</td>
      <td class="text-center">${Number(c.peso)}</td>
      <td class="criterio-obs">&nbsp;</td>
      <td class="criterio-nota">&nbsp;</td>
    </tr>`).join('');

  qs('#fichaContainer').classList.remove('d-none');
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

const popularDropdown = (termo = '') => {
  const dropdown = qs('#filtroProjetoDropdown');
  const lower = termo.toLowerCase();
  const filtrados = lower
    ? todosProjetos.filter((p) => p.titulo.toLowerCase().includes(lower))
    : todosProjetos;

  if (filtrados.length === 0) {
    dropdown.classList.add('d-none');
    return;
  }

  dropdown.innerHTML = filtrados.slice(0, 50).map((p) =>
    `<button type="button" class="list-group-item list-group-item-action" data-id="${p.id}">${escapeHtml(p.titulo)} — ${escapeHtml(p.tipo?.nome || '')}</button>`
  ).join('');
  dropdown.classList.remove('d-none');
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const projetos = await listarProjetos();
    todosProjetos = projetos;
  } catch (error) {
    toast(error.message || 'Erro ao carregar projetos.', 'danger');
    return;
  }

  const input = qs('#filtroProjeto');
  const dropdown = qs('#filtroProjetoDropdown');
  const hiddenId = qs('#projetoId');

  input.addEventListener('input', () => {
    hiddenId.value = '';
    popularDropdown(input.value);
  });

  input.addEventListener('focus', () => {
    popularDropdown(input.value);
  });

  dropdown.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-id]');
    if (!btn) return;
    hiddenId.value = btn.dataset.id;
    const projeto = todosProjetos.find((p) => String(p.id) === btn.dataset.id);
    input.value = projeto ? projeto.titulo : '';
    dropdown.classList.add('d-none');
    carregarProjeto(btn.dataset.id);
  });

  document.addEventListener('click', (event) => {
    if (!dropdown.contains(event.target) && event.target !== input) {
      dropdown.classList.add('d-none');
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
      input.value = projeto.titulo;
      hiddenId.value = projeto.id;
      carregarProjeto(projetoId);
    }
  }
});
