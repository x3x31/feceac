import { excluirArea, listarAreas, salvarArea } from '../services/area.service.js';
import { confirmar, toast } from '../ui.js';
import { escapeHtml, qs, validarFormulario } from '../util.js';

const carregar = async () => {
  const areas = await listarAreas();
  qs('#areasTabela').innerHTML = areas.map((area) => `
    <tr>
      <td>${area.id}</td>
      <td>${escapeHtml(area.nome)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${area.id}" data-nome="${escapeHtml(area.nome)}">Editar</button>
        <button class="btn btn-sm btn-outline-danger btn-excluir" data-id="${area.id}">Excluir</button>
      </td>
    </tr>`).join('');
};

document.addEventListener('DOMContentLoaded', async () => {
  await carregar();

  qs('#areaForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validarFormulario(event.currentTarget)) return;
    await salvarArea({ id: qs('#id').value || undefined, nome: qs('#nome').value.trim() });
    bootstrap.Modal.getInstance(qs('#areaModal')).hide();
    toast('Área salva.');
    event.currentTarget.reset();
    qs('#id').value = '';
    await carregar();
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

