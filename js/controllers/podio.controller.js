import { buscarUsuarioAtual } from '../services/usuario.service.js';
import { listarRanking } from '../services/avaliacao.service.js';
import { escapeHtml, qs } from '../util.js';
import { setLoading, toast, mensagemVazia } from '../ui.js';
import { supabase } from '../supabase.js';

let todosProjetos = [];
let projetosPodio = [];
let tiposLista = [];
let logoEsq = null;
let logoDir = null;

const carregarImagem = (url) => new Promise((resolve) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    resolve(c.toDataURL('image/jpeg', 0.85));
  };
  img.onerror = () => resolve(null);
  img.src = url;
});

const notaAvaliacao = (avaliacao) => {
  if (avaliacao.nota_final !== null && avaliacao.nota_final !== undefined) {
    return Number(avaliacao.nota_final);
  }
  const notas = avaliacao.notas || [];
  const totalPeso = notas.reduce((t, n) => t + Number(n.criterio?.peso || 0), 0);
  if (!totalPeso) return null;
  const soma = notas.reduce((t, n) => t + Number(n.nota) * Number(n.criterio?.peso || 0), 0);
  return Number((soma / totalPeso).toFixed(2));
};

const notaProjeto = (projeto) => {
  const notas = (projeto.avaliacoes || []).map(notaAvaliacao).filter((n) => n !== null);
  if (!notas.length) return null;
  return Number((notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2));
};

const filtrarPodio = () => {
  const tipoId = qs('#filtroTipo').value;

  let projetos = todosProjetos.map((p) => ({ ...p, nota: notaProjeto(p) }));

  if (tipoId) {
    projetos = projetos.filter((p) => String(p.tipo?.id) === tipoId);
  }

  projetos.sort((a, b) => (b.nota ?? -1) - (a.nota ?? -1));

  const geral = projetos.filter((p) => p.nota !== null).slice(0, 3).map((p, i) => ({ ...p, posicao: i + 1, areaGrupo: '_geral' }));

  const porArea = {};
  projetos.forEach((p) => {
    const area = p.area?.nome || 'Sem área';
    if (!porArea[area]) porArea[area] = [];
    if (porArea[area].length < 3) porArea[area].push(p);
  });

  const areaLista = [];
  Object.entries(porArea).forEach(([area, lista]) => {
    lista.forEach((p, i) => {
      areaLista.push({ ...p, posicao: i + 1, areaGrupo: area });
    });
  });

  areaLista.sort((a, b) => {
    const area = a.areaGrupo.localeCompare(b.areaGrupo, 'pt-BR');
    if (area !== 0) return area;
    return a.posicao - b.posicao;
  });

  projetosPodio = { geral, areaLista };
  renderizarTabela(projetosPodio);
};

const renderizarTabela = (dados) => {
  const corpo = qs('#podioTabela');
  const apenasNomes = qs('#filtroExibicao').value === 'nomes';
  const thead = qs('#podioTabela').closest('table').querySelector('thead tr');

  const colCount = apenasNomes ? 3 : 7;
  thead.innerHTML = apenasNomes
    ? '<th>Posição</th><th>Projeto</th><th style="text-align:center;">Nota</th>'
    : '<th>Posição</th><th>Projeto</th><th>Código</th><th>Orientador</th><th>Coorientador</th><th>Área</th><th style="text-align:center;">Nota</th>';

  const medalha = (pos) => pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos + 'º';

  const todos = [...dados.geral, ...dados.areaLista];

  if (!todos.length) {
    corpo.innerHTML = `<tr><td colspan="${colCount}">${mensagemVazia('Nenhum projeto com nota para exibir no pódium.')}</td></tr>`;
    return;
  }

  corpo.innerHTML = todos.map((p) => {
    if (apenasNomes) {
      return `<tr>
        <td style="text-align:center; font-size:1.2rem;">${medalha(p.posicao)}</td>
        <td><strong>${escapeHtml(p.titulo)}</strong></td>
        <td style="text-align:center;"><strong>${p.nota?.toFixed(2) || '-'}</strong></td>
      </tr>`;
    }
    return `<tr>
      <td style="text-align:center; font-size:1.2rem;">${medalha(p.posicao)}</td>
      <td><strong>${escapeHtml(p.titulo)}</strong></td>
      <td>${escapeHtml(p.codigo || '-')}</td>
      <td>${escapeHtml(p.orientador?.nome || '-')}</td>
      <td>${escapeHtml(p.coorientador?.nome || '-')}</td>
      <td>${escapeHtml(p.area?.nome || '-')}</td>
      <td style="text-align:center;"><strong>${p.nota?.toFixed(2) || '-'}</strong></td>
    </tr>`;
  }).join('');
};

const gerarPDF = async () => {
  const { geral, areaLista } = projetosPodio;
  if (!geral.length && !areaLista.length) {
    toast('Nenhum projeto para imprimir.', 'warning');
    return;
  }

  const apenasNomes = qs('#filtroExibicao').value === 'nomes';
  const tipoFiltro = qs('#filtroTipo');
  const tipoLabel = tipoFiltro.value
    ? tipoFiltro.options[tipoFiltro.selectedIndex].text
    : 'Geral';
  const subtituloTipo = tipoLabel === 'Geral' ? 'Podium da Feira de Ciencias e Mostra Cultural' : `Podium da ${tipoLabel}`;
  const headerTipo = tipoLabel === 'Geral' ? 'Podium - Feira de Ciencias e Mostra Cultural' : `Podium - ${tipoLabel}`;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = 210;
  const pageH = 297;
  const margin = 14;

  const corPrimaria = [25, 135, 84];
  const corTexto = [33, 37, 41];
  const corCinza = [108, 117, 125];
  const corOuro = [255, 193, 7];
  const corPrata = [192, 192, 192];
  const corBronze = [205, 127, 50];
  const corPosicao = [null, corOuro, corPrata, corBronze];

  if (!logoEsq) logoEsq = await carregarImagem('assets/logos/feceac.jpeg');
  if (!logoDir) logoDir = await carregarImagem('assets/logos/logo-feceac.jpeg');

  const desenharCapa = () => {
    doc.addPage();

    if (logoEsq) doc.addImage(logoEsq, 'JPEG', margin, 20, 20, 16);
    if (logoDir) doc.addImage(logoDir, 'JPEG', pageW - margin - 20, 20, 20, 16);

    doc.setFillColor(...corPrimaria);
    doc.rect(0, 50, pageW, 1.5, 'F');

    let cy = 72;

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...corPrimaria);
    doc.text('FECEAC', pageW / 2, cy, { align: 'center' });
    cy += 12;

    doc.setFontSize(16);
    doc.setTextColor(...corTexto);
    doc.text(subtituloTipo, pageW / 2, cy, { align: 'center' });
    cy += 12;

    doc.setDrawColor(...corPrimaria);
    doc.setLineWidth(0.4);
    doc.line(pageW / 2 - 30, cy, pageW / 2 + 30, cy);
    cy += 14;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...corCinza);
    doc.text(`Tipo: ${tipoLabel}`, pageW / 2, cy, { align: 'center' });
    cy += 12;

    doc.setFontSize(10);
    doc.setTextColor(...corTexto);
    doc.setFont('helvetica', 'bold');
    doc.text('Conteudo do Relatorio:', pageW / 2, cy, { align: 'center' });
    cy += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...corCinza);

    if (geral.length) {
      doc.text(`- Podium Geral (${geral.length} projeto${geral.length !== 1 ? 's' : ''})`, pageW / 2, cy, { align: 'center' });
      cy += 7;
    }
    if (areaLista.length) {
      const numAreas = [...new Set(areaLista.map((p) => p.areaGrupo))].length;
      doc.text(`- Podium por Area de Conhecimento (${numAreas} area${numAreas !== 1 ? 's' : ''}, ${areaLista.length} projeto${areaLista.length !== 1 ? 's' : ''})`, pageW / 2, cy, { align: 'center' });
      cy += 10;
    }

    const total = geral.length + areaLista.length;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(pageW / 2 - 40, cy, 80, 12, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...corPrimaria);
    doc.text(`${total} projeto${total !== 1 ? 's' : ''} premiado${total !== 1 ? 's' : ''}`, pageW / 2, cy + 8, { align: 'center' });
    cy += 22;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...corCinza);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW / 2, cy, { align: 'center' });
  };

  const desenharCabecalho = (titulo) => {
    doc.setFillColor(...corPrimaria);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(titulo, margin, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW - margin, 18, { align: 'right' });
  };

  const headerH = 28;
  const topOffset = headerH + 6;

  const desenharSubtituloArea = (area) => {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...corPrimaria);
    doc.text(area, margin, y);
    y += 2;
    doc.setDrawColor(...corPrimaria);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
  };

  const desenharProjeto = (p) => {
    const posCor = corPosicao[p.posicao] || corTexto;

    if (apenasNomes) {
      const espacoNecessario = 16;
      if (y + espacoNecessario > pageH - margin) {
        doc.addPage();
        desenharCabecalho('Podium FECEAC');
        y = topOffset;
      }

      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, y - 2, pageW - margin * 2, espacoNecessario - 4, 2, 2, 'F');

      doc.setFillColor(...posCor);
      doc.roundedRect(margin + 2, y + 1, 20, 8, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(p.posicao + 'o Lugar', margin + 12, y + 6.5, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...corTexto);
      doc.text(p.titulo, margin + 26, y + 6.5);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...corPrimaria);
      doc.text(`Nota: ${p.nota?.toFixed(2) || '-'}`, pageW - margin - 2, y + 6.5, { align: 'right' });

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(margin, y + espacoNecessario - 4, pageW - margin, y + espacoNecessario - 4);
      y += espacoNecessario + 1;
    } else {
      const espacoNecessario = 42;
      if (y + espacoNecessario > pageH - margin) {
        doc.addPage();
        desenharCabecalho('Podium FECEAC');
        y = topOffset;
      }

      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, y - 2, pageW - margin * 2, espacoNecessario - 4, 2, 2, 'F');

      doc.setFillColor(...posCor);
      doc.roundedRect(margin + 2, y + 1, 20, 8, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(p.posicao + 'o Lugar', margin + 12, y + 6.5, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...corTexto);
      const tituloInicio = margin + 26;
      const espacoTitulo = pageW - margin - tituloInicio - 2;
      const linhasTitulo = doc.splitTextToSize(p.titulo, espacoTitulo);
      doc.text(linhasTitulo, tituloInicio, y + 7);
      const linhasExtras = Math.max(0, linhasTitulo.length - 1);

      let ly = y + 12 + linhasExtras * 5;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...corPrimaria);
      doc.text(`Nota: ${p.nota?.toFixed(2) || '-'}`, tituloInicio, ly);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...corTexto);
      doc.text(`Codigo: ${p.codigo || '-'}`, tituloInicio + 40, ly);
      ly += 5;

      doc.setFontSize(8);
      doc.setTextColor(85, 85, 85);
      doc.text(`Orientador: ${p.orientador?.nome || '-'}${p.coorientador?.nome ? '  |  Coorientador: ' + p.coorientador.nome : ''}`, tituloInicio, ly);
      ly += 5;

      const alunoStr = (p.alunos || []).map((a) => a.aluno?.nome).filter(Boolean).join(', ');
      if (alunoStr) {
        const linhasAlunos = doc.splitTextToSize('Alunos: ' + alunoStr, pageW - margin - tituloInicio - 2);
        doc.text(linhasAlunos, tituloInicio, ly);
        ly += linhasAlunos.length * 4;
      }

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(margin, ly + 2, pageW - margin, ly + 2);
      y = ly + 7;
    }
  };

  let y;

  desenharCapa();

  if (geral.length) {
    doc.addPage();
    desenharCabecalho(`FECEAC - ${headerTipo} - Geral`);
    y = topOffset;
    desenharSubtituloArea('Classificacao Geral');
    geral.forEach(desenharProjeto);
  }

  if (areaLista.length) {
    const agrupar = {};
    areaLista.forEach((p) => {
      if (!agrupar[p.areaGrupo]) agrupar[p.areaGrupo] = [];
      agrupar[p.areaGrupo].push(p);
    });

    const areasOrdenadas = Object.keys(agrupar).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    areasOrdenadas.forEach((area, idxArea) => {
      if (idxArea === 0) {
        desenharCabecalho(`FECEAC - ${headerTipo} - Por Area`);
      } else {
        doc.addPage();
        desenharCabecalho(`FECEAC - ${headerTipo} - Por Area`);
      }
      y = topOffset;
      desenharSubtituloArea(area);
      agrupar[area].forEach(desenharProjeto);
    });
  }

  const totalPaginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...corCinza);
    doc.text(
      `FECEAC ${new Date().getFullYear()} - Pagina ${i} de ${totalPaginas}`,
      pageW / 2, pageH - 6, { align: 'center' }
    );
  }

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

document.addEventListener('DOMContentLoaded', async () => {
  setLoading('#estadoPodio', true);

  try {
    const usuario = await buscarUsuarioAtual();
    if (!usuario || usuario.tipo !== 'Administrador') {
      toast('Apenas Administradores podem acessar este relatório.', 'danger');
      setTimeout(() => { location.href = 'painel.html'; }, 800);
      return;
    }

    const { data: tipos } = await supabase.from('tipos_projeto').select('*').order('nome');
    tiposLista = tipos || [];
    qs('#filtroTipo').innerHTML = '<option value="">Todos</option>' +
      tiposLista.map((t) => `<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join('');

    todosProjetos = await listarRanking();
    filtrarPodio();
  } catch (error) {
    toast(error.message || 'Erro ao carregar dados.', 'danger');
  } finally {
    setLoading('#estadoPodio', false);
  }

  qs('#filtroTipo').addEventListener('change', filtrarPodio);
  qs('#filtroExibicao').addEventListener('change', filtrarPodio);
  qs('#btnImprimir').addEventListener('click', gerarPDF);
});
