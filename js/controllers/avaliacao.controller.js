import { buscarUsuarioAtual } from '../services/usuario.service.js';
import { listarProjetos } from '../services/projeto.service.js';
import { listarAvaliacoes, listarCriterios, salvarAvaliacao } from '../services/avaliacao.service.js';
import { escapeHtml, qs, qsa, validarFormulario } from '../util.js';
import { toast } from '../ui.js';

const carregarBase = async () => {
  const [projetos, criterios, avaliacoes] = await Promise.all([
    listarProjetos(),
    listarCriterios(),
    listarAvaliacoes(),
  ]);

  qs('#projeto_id').innerHTML = '<option value="">Selecione</option>' + projetos
    .map((projeto) => `<option value="${projeto.id}">${escapeHtml(projeto.titulo)}</option>`)
    .join('');

  qs('#criterios').innerHTML = criterios.map((criterio) => `
    <div class="col-md-6">
      <label class="form-label">${escapeHtml(criterio.descricao)} (${criterio.peso})</label>
      <input type="number" min="0" max="10" step="0.1" required class="form-control nota"
        data-criterio-id="${criterio.id}">
    </div>`).join('');

  qs('#avaliacoesTabela').innerHTML = avaliacoes.map((avaliacao) => `
    <tr>
      <td>${avaliacao.id}</td>
      <td>${escapeHtml(avaliacao.projeto?.titulo || '-')}</td>
      <td>${escapeHtml(avaliacao.avaliador?.nome || '-')}</td>
      <td>${avaliacao.data}</td>
      <td>${avaliacao.notas?.length || 0}</td>
    </tr>`).join('');
};

document.addEventListener('DOMContentLoaded', async () => {
  await carregarBase();

  qs('#avaliacaoForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validarFormulario(event.currentTarget)) return;

    const usuario = await buscarUsuarioAtual();
    const notas = qsa('.nota').map((input) => ({
      criterio_id: Number(input.dataset.criterioId),
      nota: Number(input.value),
    }));

    try {
      await salvarAvaliacao({
        projeto_id: Number(qs('#projeto_id').value),
        avaliador_id: usuario.id,
        data: qs('#data').value,
        notas,
      });
      toast('Avaliação salva.');
      await carregarBase();
    } catch (error) {
      toast(error.message || 'Erro ao salvar avaliação.', 'danger');
    }
  });
});

