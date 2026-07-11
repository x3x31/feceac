import { buscarUsuarioAtual } from '../services/usuario.service.js';
import { listarRanking } from '../services/avaliacao.service.js';
import { escapeHtml, qs } from '../util.js';
import { toast } from '../ui.js';

const notaAvaliacao = (avaliacao) => {
  if (avaliacao.nota_final !== null && avaliacao.nota_final !== undefined) {
    return Number(avaliacao.nota_final);
  }

  const notas = avaliacao.notas || [];
  const totalPeso = notas.reduce((total, item) => total + Number(item.criterio?.peso || 0), 0);
  if (!totalPeso) return null;

  const soma = notas.reduce((total, item) => (
    total + Number(item.nota) * Number(item.criterio?.peso || 0)
  ), 0);
  return Number((soma / totalPeso).toFixed(2));
};

const notaProjeto = (projeto) => {
  const notas = (projeto.avaliacoes || [])
    .map(notaAvaliacao)
    .filter((nota) => nota !== null);
  if (!notas.length) return null;
  return Number((notas.reduce((total, nota) => total + nota, 0) / notas.length).toFixed(2));
};

const renderizarDetalhe = (projeto) => {
  const alunos = (projeto.alunos || []).map((item) => `
    <tr><td>${escapeHtml(item.aluno.nome)}</td><td>${escapeHtml(item.turma || item.aluno.turma || '-')}</td></tr>
  `).join('') || '<tr><td colspan="2">Nenhum aluno cadastrado.</td></tr>';

  const avaliacoes = (projeto.avaliacoes || []).map((avaliacao) => `
    <tr>
      <td>${escapeHtml(avaliacao.avaliador_id)}</td>
      <td>${escapeHtml(avaliacao.data)}</td>
      <td>${notaAvaliacao(avaliacao)?.toFixed(2) || '-'}</td>
    </tr>
  `).join('') || '<tr><td colspan="3">Nenhuma avaliação registrada.</td></tr>';

  return `
    <tr class="d-none ranking-detalhe" data-projeto-id="${projeto.id}">
      <td></td>
      <td colspan="7">
        <div class="row g-3">
          <div class="col-lg-5">
            <h2 class="h6">Alunos</h2>
            <table class="table table-sm mb-0"><thead><tr><th>Aluno</th><th>Turma</th></tr></thead><tbody>${alunos}</tbody></table>
          </div>
          <div class="col-lg-7">
            <h2 class="h6">Avaliações</h2>
            <table class="table table-sm mb-0"><thead><tr><th>Código do avaliador</th><th>Data</th><th>Nota</th></tr></thead><tbody>${avaliacoes}</tbody></table>
          </div>
        </div>
      </td>
    </tr>`;
};

const renderizar = (projetos) => {
  const ordenados = projetos
    .map((projeto) => ({ ...projeto, nota: notaProjeto(projeto) }))
    .sort((a, b) => (b.nota ?? -1) - (a.nota ?? -1));

  qs('#rankingTabela').innerHTML = ordenados.map((projeto, index) => `
    <tr>
      <td><button class="btn btn-sm btn-outline-secondary btn-expandir" data-id="${projeto.id}" type="button">+</button></td>
      <td>${index + 1}</td>
      <td>${escapeHtml(projeto.titulo)}</td>
      <td>${escapeHtml(projeto.area?.nome || '-')}</td>
      <td>${escapeHtml(projeto.tipo?.nome || '-')}</td>
      <td>${escapeHtml(projeto.orientador)}</td>
      <td>${escapeHtml(projeto.coorientador || '-')}</td>
      <td>${projeto.nota?.toFixed(2) || '-'}</td>
    </tr>
    ${renderizarDetalhe(projeto)}
  `).join('');
};

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = await buscarUsuarioAtual();
  if (usuario.tipo !== 'Administrador') {
    toast('Apenas Administradores podem acessar o ranking.', 'danger');
    setTimeout(() => { location.href = 'painel.html'; }, 800);
    return;
  }

  renderizar(await listarRanking());

  qs('#rankingTabela').addEventListener('click', (event) => {
    if (!event.target.matches('.btn-expandir')) return;
    const detalhe = qs(`.ranking-detalhe[data-projeto-id="${event.target.dataset.id}"]`);
    detalhe.classList.toggle('d-none');
    event.target.textContent = detalhe.classList.contains('d-none') ? '+' : '-';
  });
});
