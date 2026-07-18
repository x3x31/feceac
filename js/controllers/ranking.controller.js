import { buscarUsuarioAtual } from '../services/usuario.service.js';
import { listarRanking } from '../services/avaliacao.service.js';
import { escapeHtml, qs } from '../util.js';
import { toast } from '../ui.js';

let rankingProjetos = [];

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
    <tr>
      <td>${escapeHtml(item.aluno.nome)}</td>
      <td>${escapeHtml(item.turma || item.aluno.turma || '-')}</td>
    </tr>
  `).join('') || `
    <tr>
      <td colspan="2">
        Nenhum aluno cadastrado.
      </td>
    </tr>
  `;

  const avaliacoes = (projeto.avaliacoes || []).map((avaliacao) => `
    <tr>
      <td>${escapeHtml(avaliacao.avaliador_id)}</td>
      <td>${escapeHtml(avaliacao.data)}</td>
      <td>${notaAvaliacao(avaliacao)?.toFixed(2) || '-'}</td>
    </tr>
  `).join('') || `
    <tr>
      <td colspan="3">
        Nenhuma avaliação registrada.
      </td>
    </tr>
  `;

  return `

    <div class="row g-3">

      <div class="col-lg-5">

        <h2 class="h6">
          Alunos
        </h2>

        <table class="table table-sm mb-0">

          <thead>

            <tr>

              <th>Aluno</th>

              <th>Turma</th>

            </tr>

          </thead>

          <tbody>

            ${alunos}

          </tbody>

        </table>

      </div>

      <div class="col-lg-7">

        <h2 class="h6">
          Avaliações
        </h2>

        <table class="table table-sm mb-0">

          <thead>

            <tr>

              <th>Código do avaliador</th>

              <th>Data</th>

              <th>Nota</th>

            </tr>

          </thead>

          <tbody>

            ${avaliacoes}

          </tbody>

        </table>

      </div>

    </div>

  `;

};

const renderizar = (projetos) => {

  const ordenados = projetos
    .map((projeto) => ({
      ...projeto,
      nota: notaProjeto(projeto)
    }))
    .sort((a, b) => {

      const tipo = (a.tipo?.nome || '').localeCompare(
        b.tipo?.nome || '',
        'pt-BR'
      );

      if (tipo !== 0) return tipo;

      const area = (a.area?.nome || '').localeCompare(
        b.area?.nome || '',
        'pt-BR'
      );

      if (area !== 0) return area;

      return (b.nota ?? -1) - (a.nota ?? -1);

    });

  // Guarda os projetos já ordenados para uso na expansão
  rankingProjetos = ordenados;

  qs('#rankingTabela').innerHTML = ordenados.map((projeto, index) => `

    <tr data-projeto-id="${projeto.id}">

      <td>

        <button
          class="btn btn-sm btn-outline-secondary btn-expandir"
          data-id="${projeto.id}"
          type="button">

          +

        </button>

      </td>

      <td>${index + 1}</td>

      <td>${escapeHtml(projeto.titulo)}</td>

      <td>${escapeHtml(projeto.orientador)}</td>

      <td>${escapeHtml(projeto.coorientador || '-')}</td>

      <td>${escapeHtml(projeto.tipo?.nome || '-')}</td>

      <td>${escapeHtml(projeto.area?.nome || '-')}</td>

      <td>${projeto.nota?.toFixed(2) || '-'}</td>

    </tr>

  `).join('');

};

document.addEventListener('DOMContentLoaded', async () => {

  const usuario = await buscarUsuarioAtual();

  if (usuario.tipo !== 'Administrador') {

    toast(
      'Apenas Administradores podem acessar o ranking.',
      'danger'
    );

    setTimeout(() => {
      location.href = 'painel.html';
    }, 800);

    return;

  }

  renderizar(await listarRanking());

  const tabela = $('#rankingDataTable').DataTable({

    language: {
      url: 'https://cdn.datatables.net/plug-ins/2.3.2/i18n/pt-BR.json'
    },

    order: [
      [7, 'desc']
    ],

    columnDefs: [
      {
        targets: 0,
        orderable: false
      }
    ]

  });


  $('#rankingTabela').on(
    'click',
    '.btn-expandir',
    function () {

      const tr = $(this).closest('tr');

      const row = tabela.row(tr);

      const projetoId =
        Number(this.dataset.id);

      const projeto =
        rankingProjetos.find(
          p => p.id === projetoId
        );

      if (!projeto) {
        return;
      }

      if (row.child.isShown()) {

        row.child.hide();

        this.textContent = '+';

      } else {

        row.child(
          renderizarDetalhe(projeto)
        ).show();

        this.textContent = '-';

      }

    }

  );

});
