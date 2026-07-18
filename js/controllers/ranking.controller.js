import { buscarUsuarioAtual } from '../services/usuario.service.js';
import { listarRanking } from '../services/avaliacao.service.js';
import { escapeHtml, qs } from '../util.js';
import { toast } from '../ui.js';
import { supabase } from '../supabase.js';

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
    <tr><td colspan="2">Nenhum aluno cadastrado.</td></tr>
  `;

  const avaliacoes = (projeto.avaliacoes || []).map((avaliacao) => `
    <tr>
      <td>${escapeHtml(avaliacao.avaliador_id)}</td>
      <td>${escapeHtml(avaliacao.data)}</td>
      <td>${notaAvaliacao(avaliacao)?.toFixed(2) || '-'}</td>
    </tr>
  `).join('') || `
    <tr><td colspan="3">Nenhuma avaliação registrada.</td></tr>
  `;

  return `
    <div class="row g-3">
      <div class="col-lg-5">
        <h2 class="h6">Alunos</h2>
        <table class="table table-sm mb-0">
          <thead><tr><th>Aluno</th><th>Turma</th></tr></thead>
          <tbody>${alunos}</tbody>
        </table>
      </div>
      <div class="col-lg-7">
        <h2 class="h6">Avaliações</h2>
        <table class="table table-sm mb-0">
          <thead><tr><th>Código do avaliador</th><th>Data</th><th>Nota</th></tr></thead>
          <tbody>${avaliacoes}</tbody>
        </table>
      </div>
    </div>
  `;
};

const renderizar = (projetos) => {
  const ordenados = projetos
    .map((projeto) => ({ ...projeto, nota: notaProjeto(projeto) }))
    .sort((a, b) => {
      const tipo = (a.tipo?.nome || '').localeCompare(b.tipo?.nome || '', 'pt-BR');
      if (tipo !== 0) return tipo;
      const area = (a.area?.nome || '').localeCompare(b.area?.nome || '', 'pt-BR');
      if (area !== 0) return area;
      return (b.nota ?? -1) - (a.nota ?? -1);
    });

  rankingProjetos = ordenados;

  qs('#rankingTabela').innerHTML = ordenados.map((projeto, index) => `
    <tr data-projeto-id="${projeto.id}">
      <td><button class="btn btn-sm btn-outline-secondary btn-expandir" data-id="${projeto.id}" type="button">+</button></td>
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

const popularFiltrosRelatorio = async () => {
  const [tipos, areas] = await Promise.all([
    supabase.from('tipos_projeto').select('*').order('nome'),
    supabase.from('areas_conhecimento').select('*').order('nome'),
  ]);

  if (tipos.data) {
    qs('#filtroTipoRelatorio').innerHTML =
      '<option value="">Todos</option>' +
      tipos.data.map((t) => `<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join('');
  }

  if (areas.data) {
    qs('#filtroAreaRelatorio').innerHTML =
      '<option value="">Todas</option>' +
      areas.data.map((a) => `<option value="${a.id}">${escapeHtml(a.nome)}</option>`).join('');
  }
};

const gerarRelatorioPDF = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const filtroTipo = qs('#filtroTipoRelatorio').value;
  const filtroArea = qs('#filtroAreaRelatorio').value;
  const mostrarAlunos = qs('#chkMostrarAlunos').checked;
  const notasPorCriterio = qs('#chkNotasPorCriterio').checked;
  const ordenacao = qs('input[name="ordenacaoRelatorio"]:checked').value;

  let projetos = rankingProjetos.map((p) => ({ ...p, nota: notaProjeto(p) }));

  if (filtroTipo) {
    projetos = projetos.filter((p) => String(p.tipo_projeto_id) === filtroTipo);
  }
  if (filtroArea) {
    projetos = projetos.filter((p) => String(p.area_id) === filtroArea);
  }

  if (ordenacao === 'area_nota') {
    projetos.sort((a, b) => {
      const area = (a.area?.nome || '').localeCompare(b.area?.nome || '', 'pt-BR');
      if (area !== 0) return area;
      return (b.nota ?? -1) - (a.nota ?? -1);
    });
  } else {
    projetos.sort((a, b) => (b.nota ?? -1) - (a.nota ?? -1));
  }

  if (!projetos.length) {
    toast('Nenhum projeto encontrado para os filtros selecionados.', 'warning');
    return;
  }

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  const corPrimaria = [25, 135, 84];
  const corTexto = [33, 37, 41];
  const corCinza = [108, 117, 125];

  const desenharCabecalho = () => {
    doc.setFillColor(...corPrimaria);
    doc.rect(0, 0, pageW, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FECEAC - Ranking de Projetos', margin, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW - margin, 18, { align: 'right' });

    y = 36;
  };

  const desenharFiltros = () => {
    const partes = [];
    if (filtroTipo) {
      const nomeTipo = qs('#filtroTipoRelatorio').selectedOptions[0]?.text;
      partes.push(`Tipo: ${nomeTipo}`);
    }
    if (filtroArea) {
      const nomeArea = qs('#filtroAreaRelatorio').selectedOptions[0]?.text;
      partes.push(`Área: ${nomeArea}`);
    }
    partes.push(`Ordenação: ${ordenacao === 'area_nota' ? 'Área → Nota' : 'Nota'}`);
    partes.push(`Mostrar alunos: ${mostrarAlunos ? 'Sim' : 'Não'}`);
    partes.push(`Notas: ${notasPorCriterio ? 'Por critério' : 'Geral'}`);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...corCinza);
    doc.text(`Filtros: ${partes.join(' | ')}`, margin, y);
    y += 6;
  };

  const quebrarPagina = (espacoNecessario) => {
    if (y + espacoNecessario > pageH - margin) {
      doc.addPage();
      desenharCabecalho();
      return true;
    }
    return false;
  };

  const desenharTituloSecao = (texto) => {
    quebrarPagina(12);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...corPrimaria);
    doc.text(texto, margin, y);
    y += 2;
    doc.setDrawColor(...corPrimaria);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
  };

  desenharCabecalho();
  desenharFiltros();

  let posicao = 1;

  projetos.forEach((projeto) => {
    const notaFmt = projeto.nota !== null ? projeto.nota.toFixed(2) : '-';
    const temAlunos = mostrarAlunos && (projeto.alunos || []).length;
    const temNotasDetalhe = notasPorCriterio && (projeto.avaliacoes || []).length;

    let espacoNecessario = 18;
    if (temAlunos) espacoNecessario += 6 + (projeto.alunos.length + 1) * 5;
    if (temNotasDetalhe) espacoNecessario += 8 + projeto.avaliacoes.length * 6;

    quebrarPagina(espacoNecessario);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...corTexto);
    doc.text(`${posicao}º`, margin, y);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(projeto.titulo, margin + 10, y);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...corCinza);
    const notaTexto = `Nota: ${notaFmt}`;
    doc.text(notaTexto, pageW - margin, y, { align: 'right' });

    y += 5;

    doc.setFontSize(8);
    doc.setTextColor(...corTexto);
    doc.text(`Orientador: ${projeto.orientador}${projeto.coorientador ? ' | Coorientador: ' + projeto.coorientador : ''}`, margin + 10, y);
    y += 4;
    doc.text(`Tipo: ${projeto.tipo?.nome || '-'} | Área: ${projeto.area?.nome || '-'}`, margin + 10, y);
    y += 5;

    if (temAlunos) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Alunos:', margin + 10, y);
      y += 4;

      const linhasAlunos = projeto.alunos.map((item) => [
        item.aluno.nome,
        item.turma || item.aluno.turma || '-'
      ]);

      doc.autoTable({
        startY: y,
        margin: { left: margin + 10 },
        head: [['Aluno', 'Turma']],
        body: linhasAlunos,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: corPrimaria, fontSize: 7 },
        columnStyles: { 0: { cellWidth: 80 } },
      });

      y = doc.lastAutoTable.finalY + 4;
    }

    if (temNotasDetalhe) {
      quebrarPagina(20);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Avaliações por critério:', margin + 10, y);
      y += 4;

      const linhasNotas = [];
      projeto.avaliacoes.forEach((avaliacao) => {
        (avaliacao.notas || []).forEach((nota, idx) => {
          linhasNotas.push([
            idx === 0 ? (avaliacao.usuario?.nome || avaliacao.avaliador_id) : '',
            nota.criterio?.descricao || '-',
            Number(nota.criterio?.peso || 0).toFixed(2),
            String(nota.nota)
          ]);
        });
        linhasNotas.push([
          '', '', 'Nota Final:', notaAvaliacao(avaliacao)?.toFixed(2) || '-'
        ]);
      });

      doc.autoTable({
        startY: y,
        margin: { left: margin + 10 },
        head: [['Avaliador', 'Critério', 'Peso', 'Nota']],
        body: linhasNotas,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [108, 117, 125], fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 90 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
        },
      });

      y = doc.lastAutoTable.finalY + 4;
    } else if (!temAlunos) {
      y += 4;
    }

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageW - margin, y);
    y += 5;

    posicao++;
  });

  const totalPaginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...corCinza);
    doc.text(
      `FECEAC ${new Date().getFullYear()} — Página ${i} de ${totalPaginas}`,
      pageW / 2, pageH - 6, { align: 'center' }
    );
  }

  doc.save(`ranking_feceac_${new Date().toISOString().slice(0, 10)}.pdf`);
};

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = await buscarUsuarioAtual();

  if (usuario.tipo !== 'Administrador') {
    toast('Apenas Administradores podem acessar o ranking.', 'danger');
    setTimeout(() => { location.href = 'painel.html'; }, 800);
    return;
  }

  renderizar(await listarRanking());
  await popularFiltrosRelatorio();

  const tabela = $('#rankingDataTable').DataTable({
    language: { url: 'https://cdn.datatables.net/plug-ins/2.3.2/i18n/pt-BR.json' },
    order: [[7, 'desc']],
    columnDefs: [{ targets: 0, orderable: false }],
  });

  $('#rankingTabela').on('click', '.btn-expandir', function () {
    const tr = $(this).closest('tr');
    const row = tabela.row(tr);
    const projeto = rankingProjetos.find((p) => p.id === Number(this.dataset.id));
    if (!projeto) return;

    if (row.child.isShown()) {
      row.child.hide();
      this.textContent = '+';
    } else {
      row.child(renderizarDetalhe(projeto)).show();
      this.textContent = '-';
    }
  });

  qs('#btnGerarRelatorio').addEventListener('click', () => {
    gerarRelatorioPDF();
    bootstrap.Modal.getInstance(qs('#relatorioModal')).hide();
  });
});
