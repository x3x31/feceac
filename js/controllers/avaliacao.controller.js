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
    <div class="col-md-6 mb-3">
      <label class="form-label d-flex justify-content-between align-items-center">
        <span>${escapeHtml(criterio.descricao)} (${criterio.peso})</span>
  
        ${criterio.observacoes ? `
          <button
            type="button"
            class="btn btn-sm btn-outline-info"
            onclick="mostrarObservacoes('${escapeHtml(
              criterio.descricao
            )}', ${JSON.stringify(criterio.observacoes)})">
            <i class="bi bi-info-circle"></i> Observações
          </button>
        ` : ''}
      </label>
  
      <select required class="form-select nota" data-criterio-id="${criterio.id}">
        <option value="" selected disabled>Selecione uma nota</option>
        <option value="5">5 - Fraco ou Ausente</option>
        <option value="6">6 - Regular</option>
        <option value="7">7 - Bom</option>
        <option value="8">8 - Ótimo</option>
        <option value="9">9 - Excelente</option>
        <option value="10">10 - Supera as expectativas</option>
      </select>
    </div>
  `).join('');

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

