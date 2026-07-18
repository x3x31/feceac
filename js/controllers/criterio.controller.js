import { listarCriterios, salvarCriterio, excluirCriterio } from '../services/avaliacao.service.js';
import { confirmar, toast } from '../ui.js';
import { escapeHtml, qs, qsa, validarFormulario } from '../util.js';
import { supabase } from '../supabase.js';

let tiposProjeto = [];

const carregarTipos = async () => {
  const { data, error } = await supabase
    .from('tipos_projeto')
    .select('*')
    .order('nome');
  if (error) throw error;
  tiposProjeto = data;
};

const popularSelectTipos = (valor = '') => {
  const select = qs('#tipo_projeto_id');
  if (!select) return;
  select.innerHTML = '<option value="">Selecione</option>' +
    tiposProjeto.map((t) =>
      `<option value="${t.id}" ${t.id == valor ? 'selected' : ''}>${escapeHtml(t.nome)}</option>`
    ).join('');
};

const carregar = async () => {
  const criterios = await listarCriterios();
  qs('#criteriosTabela').innerHTML = criterios.map((criterio) => {
    const hasObs = criterio.observacoes && criterio.observacoes.trim();
    return `
    <tr>
      <td>${criterio.id}</td>
      <td>${escapeHtml(criterio.descricao)}</td>
      <td>${criterio.peso}</td>
      <td>${escapeHtml(criterio.tipo?.nome || '-')}</td>
      <td class="table-actions">
        ${hasObs ? `<button class="btn btn-sm btn-outline-secondary btn-expandir" data-id="${criterio.id}" type="button">+</button>` : ''}
        <button class="btn btn-sm btn-outline-primary btn-editar"
          data-id="${criterio.id}" data-descricao="${escapeHtml(criterio.descricao)}"
          data-peso="${criterio.peso}" data-tipo="${criterio.tipo_projeto_id || ''}"
          data-observacoes="${escapeHtml(criterio.observacoes || '')}">Editar</button>
        <button class="btn btn-sm btn-outline-danger btn-excluir" data-id="${criterio.id}">Excluir</button>
      </td>
    </tr>
    ${hasObs ? `
    <tr class="d-none obs-detalhe" data-criterio-id="${criterio.id}">
      <td></td>
      <td colspan="4">
        <h6>Observações</h6>
        <div class="border rounded p-3 bg-light" style="white-space: pre-wrap;">${escapeHtml(criterio.observacoes)}</div>
      </td>
    </tr>` : ''}
    `;
  }).join('');
};

document.addEventListener('DOMContentLoaded', async () => {
  await carregarTipos();
  await carregar();

  qs('#criterioForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validarFormulario(event.currentTarget)) return;
    const tipoId = qs('#tipo_projeto_id').value || null;
    await salvarCriterio({
      id: qs('#id').value || undefined,
      descricao: qs('#descricao').value.trim(),
      peso: Number(qs('#peso').value),
      observacoes: qs('#observacoes').value.trim() || null,
      tipo_projeto_id: tipoId ? Number(tipoId) : null,
    });
    bootstrap.Modal.getInstance(qs('#criterioModal')).hide();
    toast('Critério salvo.');
    event.currentTarget.reset();
    qs('#id').value = '';
    await carregar();
  });

  let editandoTipo = '';

  qs('#criterioModal').addEventListener('show.bs.modal', () => {
    popularSelectTipos(editandoTipo);
    editandoTipo = '';
  });

  qs('#criteriosTabela').addEventListener('click', async (event) => {
    if (event.target.matches('.btn-expandir')) {
      const id = event.target.dataset.id;
      const detalhe = qs(`.obs-detalhe[data-criterio-id="${id}"]`);
      detalhe.classList.toggle('d-none');
      event.target.textContent = detalhe.classList.contains('d-none') ? '+' : '-';
      return;
    }

    if (event.target.matches('.btn-editar')) {
      qs('#id').value = event.target.dataset.id;
      qs('#descricao').value = event.target.dataset.descricao;
      qs('#peso').value = event.target.dataset.peso;
      qs('#observacoes').value = event.target.dataset.observacoes;
      editandoTipo = event.target.dataset.tipo;
      bootstrap.Modal.getOrCreateInstance(qs('#criterioModal')).show();
    }
    if (event.target.matches('.btn-excluir') && confirmar('Deseja excluir este critério?')) {
      await excluirCriterio(event.target.dataset.id);
      toast('Critério excluído.');
      await carregar();
    }
  });
});
