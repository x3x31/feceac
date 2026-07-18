import { listarCriterios, salvarCriterio } from '../services/avaliacao.service.js';
import { supabase } from '../supabase.js';
import { confirmar, toast } from '../ui.js';
import { escapeHtml, qs, validarFormulario } from '../util.js';

const excluirCriterio = async (id) => {
  const { error } = await supabase.from('criterios').delete().eq('id', id);
  if (error) throw error;
};

const carregar = async () => {
  const criterios = await listarCriterios();
  qs('#criteriosTabela').innerHTML = criterios.map((criterio) => `
    <tr>
      <td>${criterio.id}</td>
      <td>${escapeHtml(criterio.descricao)}</td>
      <td>${criterio.peso}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary btn-editar"
          data-id="${criterio.id}" data-descricao="${escapeHtml(criterio.descricao)}"
          data-peso="${criterio.peso}">Editar</button>
        <button class="btn btn-sm btn-outline-danger btn-excluir" data-id="${criterio.id}">Excluir</button>
      </td>
    </tr>`).join('');
};

document.addEventListener('DOMContentLoaded', async () => {
  await carregar();

  qs('#criterioForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validarFormulario(event.currentTarget)) return;
    await salvarCriterio({
      id: qs('#id').value || undefined,
      descricao: qs('#descricao').value.trim(),
      peso: Number(qs('#peso').value),
    });
    bootstrap.Modal.getInstance(qs('#criterioModal')).hide();
    toast('Critério salvo.');
    event.currentTarget.reset();
    qs('#id').value = '';
    await carregar();
  });

  qs('#criteriosTabela').addEventListener('click', async (event) => {
    if (event.target.matches('.btn-editar')) {
      qs('#id').value = event.target.dataset.id;
      qs('#descricao').value = event.target.dataset.descricao;
      qs('#peso').value = event.target.dataset.peso;
      bootstrap.Modal.getOrCreateInstance(qs('#criterioModal')).show();
    }
    if (event.target.matches('.btn-excluir') && confirmar('Deseja excluir este critério?')) {
      await excluirCriterio(event.target.dataset.id);
      toast('Critério excluído.');
      await carregar();
    }
  });
});

