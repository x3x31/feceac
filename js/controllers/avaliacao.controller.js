import { buscarUsuarioAtual } from '../services/usuario.service.js';
import { listarProjetos } from '../services/projeto.service.js';
import { listarAvaliacoesDoUsuario, listarCriterios, salvarAvaliacao } from '../services/avaliacao.service.js';
import { escapeHtml, qs, qsa, validarFormulario } from '../util.js';
import { toast } from '../ui.js';

const carregarBase = async (usuario) => {
  const [projetos, criterios, avaliacoes] = await Promise.all([
    listarProjetos(),
    listarCriterios(),
    listarAvaliacoesDoUsuario(usuario.id),
  ]);

  qs('#projeto_id').innerHTML = '<option value="">Selecione</option>' + projetos
    .map((projeto) => `<option value="${projeto.id}">${escapeHtml(projeto.titulo)}</option>`)
    .join('');

  qs('#criterios').innerHTML = criterios.map((criterio) => `
    <div class="col-md-6">
      <label class="form-label">${escapeHtml(criterio.descricao)} (${criterio.peso})</label>
      <input type="number" min="5" max="10" step="1" required class="form-control nota"
        data-criterio-id="${criterio.id}">
    </div>`).join('');

  qs('#avaliacoesTabela').innerHTML = avaliacoes.map((avaliacao) => `
    <tr>
      <td>${avaliacao.id}</td>
      <td>${escapeHtml(avaliacao.projeto?.titulo || '-')}</td>
      <td>${avaliacao.data}</td>
      <td>${Number(avaliacao.nota_final ?? 0).toFixed(2)}</td>
      <td>${avaliacao.notas?.length || 0}</td>
    </tr>`).join('');
};

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = await buscarUsuarioAtual();
  if (usuario.tipo !== 'Avaliador') {
    toast('Apenas Avaliadores podem realizar avaliações.', 'danger');
    setTimeout(() => { location.href = 'painel.html'; }, 800);
    return;
  }

  await carregarBase(usuario);

  qs('#avaliacaoForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validarFormulario(event.currentTarget)) return;

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
      await carregarBase(usuario);
    } catch (error) {
      toast(error.message || 'Erro ao salvar avaliação.', 'danger');
    }
  });
});

