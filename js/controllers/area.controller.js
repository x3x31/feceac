import { excluirArea, listarAreas, salvarArea } from '../services/area.service.js';
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
  const areas = await listarAreas();
  qs('#areasTabela').innerHTML = areas.map((area) => `
    <tr>
      <td>${area.id}</td>
      <td>${escapeHtml(area.nome)}</td>
      <td>${escapeHtml(area.tipo?.nome || '-')}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary btn-editar"
          data-id="${area.id}" data-nome="${escapeHtml(area.nome)}"
          data-tipo="${area.tipo_projeto_id || ''}">Editar</button>
        <button class="btn btn-sm btn-outline-danger btn-excluir" data-id="${area.id}">Excluir</button>
      </td>
    </tr>`).join('');
};

document.addEventListener('DOMContentLoaded', async () => {
  await carregarTipos();
  await carregar();

  qs('#areaForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validarFormulario(event.currentTarget)) return;
    const tipoId = qs('#tipo_projeto_id').value || null;
    await salvarArea({
      id: qs('#id').value || undefined,
      nome: qs('#nome').value.trim(),
      tipo_projeto_id: tipoId ? Number(tipoId) : null,
    });
    bootstrap.Modal.getInstance(qs('#areaModal')).hide();
    toast('Área salva.');
    event.currentTarget.reset();
    qs('#id').value = '';
    await carregar();
  });

  qs('#areaModal').addEventListener('show.bs.modal', (event) => {
    const btn = event.relatedTarget;
    if (btn && btn.matches('.btn-editar')) {
      popularSelectTipos(btn.dataset.tipo);
    } else {
      popularSelectTipos();
    }
  });

  qs('#areasTabela').addEventListener('click', async (event) => {
    if (event.target.matches('.btn-editar')) {
      qs('#id').value = event.target.dataset.id;
      qs('#nome').value = event.target.dataset.nome;
      bootstrap.Modal.getOrCreateInstance(qs('#areaModal')).show();
    }
    if (event.target.matches('.btn-excluir') && confirmar('Deseja excluir esta área?')) {
      await excluirArea(event.target.dataset.id);
      toast('Área excluída.');
      await carregar();
    }
  });
});
