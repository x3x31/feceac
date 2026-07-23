import { escapeHtml, qs } from '../util.js';
import { toast } from '../ui.js';
import { obterProjeto, listarProjetos } from '../services/projeto.service.js';
import { listarCriterios } from '../services/avaliacao.service.js';
import { listarProfessores } from '../services/professor.service.js';
import { supabase } from '../supabase.js';

let todosProjetos = [];
let todosProfessores = [];
let projetosFiltrados = [];
let projetoAtual = null;
let criteriosAtuais = [];

const FILTRO_NUM_ALUNOS = 4;

const renderizarCriterios = (criterios) => {
  if (criterios.length === 0) {
    return '<div class="text-muted">Nenhum critério cadastrado para este tipo de projeto.</div>';
  }
  return `<table class="table table-bordered table-sm ficha-tabela-criterios mb-0">
    <thead><tr>
      <th style="width:90%">Critério</th>
      <th style="width:10%">Nota</th>
    </tr></thead>
    <tbody>${criterios.map((c) => `
      <tr>
        <td><strong>${escapeHtml(c.descricao)}</strong> <span class="text-muted">(peso: ${Number(c.peso)})</span>${c.observacoes ? '<br><span class="text-muted">' + escapeHtml(c.observacoes) + '</span>' : ''}</td>
        <td></td>
      </tr>`).join('')}
    </tbody>
  </table>`;
};

const renderizarFicha = (projeto, criterios) => {
  projetoAtual = projeto;
  criteriosAtuais = criterios;

  qs('#fichaTitulo').textContent = projeto.titulo || '-';
  qs('#fichaCodigo').textContent = projeto.codigo || '-';
  qs('#fichaTipo').textContent = projeto.tipo?.nome || '-';
  qs('#fichaArea').textContent = projeto.area?.nome || '-';
  qs('#fichaOrientador').textContent = projeto.orientador?.nome || '-';
  qs('#fichaCoorientador').textContent = projeto.coorientador?.nome || '-';

  qs('#fichaCriterios').innerHTML = renderizarCriterios(criterios);

  const alunos = (projeto.alunos || []).map((pa) => pa.aluno).filter(Boolean);
  const linhasAlunos = [];
  for (let i = 0; i < Math.max(alunos.length, FILTRO_NUM_ALUNOS); i++) {
    const a = alunos[i];
    if (a) {
      linhasAlunos.push(`<div class="ficha-linha-aluno"><span class="ficha-linha-aluno-num">${i + 1}º</span><span class="ficha-linha-aluno-nome">${escapeHtml(a.nome)}${a.turma ? ' — ' + escapeHtml(a.turma) : ''}</span></div>`);
    } else {
      linhasAlunos.push(`<div class="ficha-linha-aluno"><span class="ficha-linha-aluno-num">${i + 1}º</span><div class="ficha-linha-aluno-linha"></div></div>`);
    }
  }
  qs('#fichaAlunosLinhas').innerHTML = linhasAlunos.join('');

  qs('#fichaContainer').classList.remove('d-none');
};

const aplicarFiltrosProjeto = () => {
  const tipoId = qs('#filtroTipo').value;
  const orientadorId = qs('#filtroOrientador').value;

  projetosFiltrados = todosProjetos.filter((p) => {
    if (tipoId && String(p.tipo_projeto_id) !== tipoId) return false;
    if (orientadorId && String(p.orientador_id) !== orientadorId) return false;
    return true;
  });

  popularDropdownProjetos(qs('#filtroProjetoBusca').value);
};

const popularDropdownProjetos = (termo = '') => {
  const dropdown = qs('#filtroProjetoDropdown');
  const lower = termo.toLowerCase();
  const filtrados = lower
    ? projetosFiltrados.filter((p) => p.titulo.toLowerCase().includes(lower) || (p.codigo || '').toLowerCase().includes(lower))
    : projetosFiltrados;

  if (filtrados.length === 0) {
    dropdown.classList.add('d-none');
    return;
  }

  dropdown.innerHTML = filtrados.slice(0, 50).map((p) =>
    `<button type="button" class="list-group-item list-group-item-action" data-id="${p.id}">${escapeHtml(p.codigo ? p.codigo + ' - ' + p.titulo : p.titulo)} — ${escapeHtml(p.tipo?.nome || '')}</button>`
  ).join('');
  dropdown.classList.remove('d-none');
};

const popularDropdownOrientadores = (termo = '') => {
  const dropdown = qs('#filtroOrientadorDropdown');
  const lower = termo.toLowerCase();
  const filtrados = lower
    ? todosProfessores.filter((p) => p.nome.toLowerCase().includes(lower))
    : todosProfessores;

  dropdown.innerHTML = `<button type="button" class="list-group-item list-group-item-action" data-id="">Todos</button>` +
    filtrados.slice(0, 50).map((p) =>
      `<button type="button" class="list-group-item list-group-item-action" data-id="${p.id}">${escapeHtml(p.nome)}</button>`
    ).join('');
  dropdown.classList.remove('d-none');
};

const carregarProjeto = async (id) => {
  try {
    const projeto = await obterProjeto(id);
    const criterios = await listarCriterios(projeto.tipo_projeto_id);
    renderizarFicha(projeto, criterios);
  } catch (error) {
    toast(error.message || 'Erro ao carregar projeto.', 'danger');
  }
};

const carregarCriteriosTipo = async () => {
  const tipoId = qs('#filtroTipo').value;
  if (!tipoId) {
    qs('#fichaCriterios').innerHTML = '<div class="text-muted">Selecione um tipo de projeto para ver os critérios.</div>';
    return;
  }
  try {
    const criterios = await listarCriterios(Number(tipoId));
    qs('#fichaCriterios').innerHTML = renderizarCriterios(criterios);
    criteriosAtuais = criterios;
  } catch (error) {
    toast(error.message || 'Erro ao carregar critérios.', 'danger');
  }
};

const carregarTiposProjeto = async () => {
  const { data, error } = await supabase
    .from('tipos_projeto')
    .select('*')
    .order('nome');
  if (error) throw error;
  return data;
};

const truncar = (texto, maxW, doc) => {
  if (!texto) return '';
  if (doc.getTextWidth(texto) <= maxW) return texto;
  while (texto.length > 0 && doc.getTextWidth(texto + '...') > maxW) {
    texto = texto.slice(0, -1);
  }
  return texto + '...';
};

const gerarPDF = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = 210;
  const pageH = 297;
  const margin = 14;
  const contentW = pageW - margin * 2;

  const corPrimaria = [25, 135, 84];
  const corTexto = [33, 37, 41];
  const corCinza = [108, 117, 125];
  const corFundo = [248, 249, 250];

  const headerH = 22;

  const desenharCabecalho = () => {
    doc.setFillColor(...corPrimaria);
    doc.rect(0, 0, pageW, headerH, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Ficha de Avaliação', margin, 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Feira de Ciências e Arte e Cultura', pageW - margin, 14, { align: 'right' });
  };

  const desenharRodape = (pagAtual, totalPaginas) => {
    doc.setFontSize(7);
    doc.setTextColor(...corCinza);
    doc.text(
      `FECEAC ${new Date().getFullYear()} — Página ${pagAtual} de ${totalPaginas}`,
      pageW / 2, pageH - 6, { align: 'center' }
    );
  };

  desenharCabecalho();

  let y = headerH + 8;
  const labelW = 30;

  const campoLinha = (label, valor, y) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...corTexto);
    doc.text(label + ':', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...corCinza);
    const valorX = margin + labelW;
    const valorMaxW = contentW - labelW;
    doc.text(truncar(valor || '-', valorMaxW, doc), valorX, y);
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(valorX, y + 1, valorX + valorMaxW, y + 1);
    doc.setLineDashPattern([], 0);
    return y + 7;
  };

  const campoDuplo = (label1, valor1, label2, valor2, y) => {
    const halfW = contentW / 2 - 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...corTexto);
    doc.text(label1 + ':', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...corCinza);
    const v1x = margin + labelW;
    doc.text(truncar(valor1 || '-', halfW - labelW, doc), v1x, y);
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(v1x, y + 1, v1x + halfW - labelW, y + 1);

    const col2x = margin + halfW + 10;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...corTexto);
    doc.text(label2 + ':', col2x, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...corCinza);
    const v2x = col2x + labelW;
    doc.text(truncar(valor2 || '-', halfW - labelW, doc), v2x, y);
    doc.line(v2x, y + 1, v2x + halfW - labelW, y + 1);
    doc.setLineDashPattern([], 0);
    return y + 7;
  };

  y = campoLinha('Título', projetoAtual?.titulo, y);
  y = campoDuplo('Código', projetoAtual?.codigo, 'Tipo', projetoAtual?.tipo?.nome, y);
  y = campoDuplo('Área', projetoAtual?.area?.nome, 'Orientador', projetoAtual?.orientador?.nome, y);
  y = campoLinha('Coorientador', projetoAtual?.coorientador?.nome, y);

  y += 4;

  const legendaY = y;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...corTexto);
  doc.text('Escala:', margin, legendaY);

  const legendaItens = [
    { nota: '5', desc: 'Fraco' },
    { nota: '6', desc: 'Regular' },
    { nota: '7', desc: 'Bom' },
    { nota: '8', desc: 'Ótimo' },
    { nota: '9', desc: 'Excelente' },
    { nota: '10', desc: 'Supera expectativas' },
  ];

  let lx = margin + 14;
  doc.setFont('helvetica', 'normal');
  legendaItens.forEach((item) => {
    doc.setFillColor(...corPrimaria);
    doc.roundedRect(lx - 1, legendaY - 3.5, 7, 4, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text(item.nota, lx + 2.5, legendaY - 0.5, { align: 'center' });
    doc.setTextColor(...corCinza);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(item.desc, lx + 9, legendaY - 0.5);
    lx += 9 + doc.getTextWidth(item.desc) + 5;
  });

  y = legendaY + 8;

  if (criteriosAtuais.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...corPrimaria);
    doc.text('Critérios de Avaliação', margin, y);
    doc.setDrawColor(...corPrimaria);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 1.5, margin + 40, y + 1.5);
    doc.setLineWidth(0.2);
    y += 6;

    const critBody = criteriosAtuais.map((c) => [
      `${c.descricao}${c.observacoes ? '\n(' + c.observacoes + ')' : ''}`,
      `${Number(c.peso)}`,
    ]);

    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Critério', 'Peso']],
      body: critBody,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, valign: 'top', textColor: corTexto },
      headStyles: { fillColor: corPrimaria, fontSize: 8 },
      columnStyles: {
        0: { cellWidth: contentW - 20 },
        1: { cellWidth: 20, halign: 'center' },
      },
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...corPrimaria);
  doc.text('Nota Final', margin, y);
  doc.setDrawColor(...corTexto);
  doc.setLineWidth(0.5);
  doc.line(margin + 25, y + 1, margin + 60, y + 1);
  doc.setLineWidth(0.2);
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...corPrimaria);
  doc.text('Alunos', margin, y);
  doc.setDrawColor(...corPrimaria);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 1.5, margin + 15, y + 1.5);
  doc.setLineWidth(0.2);
  y += 6;

  const alunos = projetoAtual ? (projetoAtual.alunos || []).map((pa) => pa.aluno).filter(Boolean) : [];
  const numLinhasAlunos = Math.max(alunos.length, FILTRO_NUM_ALUNOS);

  for (let i = 0; i < numLinhasAlunos; i++) {
    const a = alunos[i];
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...corTexto);
    doc.text(`${i + 1}º`, margin, y);

    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.2);

    if (a) {
      doc.setFont('helvetica', 'normal');
      const nomeCompleto = a.turma ? `${a.nome} — ${a.turma}` : a.nome;
      doc.text(truncar(nomeCompleto, contentW - 20, doc), margin + 10, y);
      const textW = doc.getTextWidth(truncar(nomeCompleto, contentW - 20, doc));
      doc.setLineDashPattern([1, 1], 0);
      doc.line(margin + 10 + textW + 2, y + 1, margin + contentW, y + 1);
      doc.setLineDashPattern([], 0);
    } else {
      doc.setLineDashPattern([], 0);
      doc.line(margin + 10, y + 1, margin + contentW, y + 1);
    }

    y += 7;
  }

  y += 3;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...corPrimaria);
  doc.text('Observações Gerais', margin, y);
  doc.setDrawColor(...corPrimaria);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 1.5, margin + 40, y + 1.5);
  doc.setLineWidth(0.2);
  y += 6;

  for (let i = 0; i < 4; i++) {
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 1, margin + contentW, y + 1);
    y += 7;
  }

  y += 5;

  const sigW = 60;
  const sigX = margin + (contentW - sigW) / 2;
  doc.setDrawColor(corTexto);
  doc.setLineWidth(0.3);
  doc.line(sigX, y + 12, sigX + sigW, y + 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...corCinza);
  doc.text('Avaliador(a)', sigX + sigW / 2, y + 16, { align: 'center' });

  desenharRodape(1, 1);

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const [projetos, professores, tipos] = await Promise.all([
      listarProjetos(),
      listarProfessores(),
      carregarTiposProjeto(),
    ]);
    todosProjetos = projetos;
    todosProfessores = professores;
    projetosFiltrados = projetos;

    const tiposSelect = qs('#filtroTipo');
    tiposSelect.innerHTML = '<option value="">Selecione</option>' +
      tipos.map((t) => `<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join('');
  } catch (error) {
    toast(error.message || 'Erro ao carregar dados.', 'danger');
    return;
  }

  const tiposSelect = qs('#filtroTipo');

  tiposSelect.addEventListener('change', () => {
    const tipoNome = tiposSelect.options[tiposSelect.selectedIndex]?.text || '';
    qs('#fichaTipo').textContent = tipoNome || '-';
    qs('#filtroOrientador').value = '';
    qs('#filtroOrientadorBusca').value = '';
    qs('#projetoId').value = '';
    qs('#filtroProjetoBusca').value = '';
    qs('#fichaContainer').classList.remove('d-none');
    aplicarFiltrosProjeto();
    carregarCriteriosTipo();
  });

  const orientadorInput = qs('#filtroOrientadorBusca');
  const orientadorDropdown = qs('#filtroOrientadorDropdown');
  const orientadorHidden = qs('#filtroOrientador');

  orientadorInput.addEventListener('input', () => {
    orientadorHidden.value = '';
    popularDropdownOrientadores(orientadorInput.value);
    qs('#projetoId').value = '';
    qs('#filtroProjetoBusca').value = '';
    if (!qs('#fichaContainer').classList.contains('d-none')) {
      qs('#fichaTipo').textContent = tiposSelect.options[tiposSelect.selectedIndex]?.text || '-';
    }
    aplicarFiltrosProjeto();
  });

  orientadorInput.addEventListener('focus', () => {
    popularDropdownOrientadores(orientadorInput.value);
  });

  orientadorDropdown.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-id]');
    if (!btn) return;
    orientadorHidden.value = btn.dataset.id;
    orientadorInput.value = btn.dataset.id
      ? todosProfessores.find((p) => String(p.id) === btn.dataset.id)?.nome || ''
      : '';
    orientadorDropdown.classList.add('d-none');
    qs('#projetoId').value = '';
    qs('#filtroProjetoBusca').value = '';
    aplicarFiltrosProjeto();
  });

  const projetoInput = qs('#filtroProjetoBusca');
  const projetoDropdown = qs('#filtroProjetoDropdown');
  const projetoHidden = qs('#projetoId');

  projetoInput.addEventListener('input', () => {
    projetoHidden.value = '';
    popularDropdownProjetos(projetoInput.value);
  });

  projetoInput.addEventListener('focus', () => {
    popularDropdownProjetos(projetoInput.value);
  });

  projetoDropdown.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-id]');
    if (!btn) return;
    projetoHidden.value = btn.dataset.id;
    const projeto = projetosFiltrados.find((p) => String(p.id) === btn.dataset.id);
    projetoInput.value = projeto ? projeto.titulo : '';
    projetoDropdown.classList.add('d-none');
    carregarProjeto(btn.dataset.id);
  });

  document.addEventListener('click', (event) => {
    if (!orientadorDropdown.contains(event.target) && event.target !== orientadorInput) {
      orientadorDropdown.classList.add('d-none');
    }
    if (!projetoDropdown.contains(event.target) && event.target !== projetoInput) {
      projetoDropdown.classList.add('d-none');
    }
  });

  qs('#btnImprimir').addEventListener('click', gerarPDF);

  const params = new URLSearchParams(location.search);
  const projetoId = params.get('projeto_id');
  if (projetoId) {
    const projeto = todosProjetos.find((p) => String(p.id) === projetoId);
    if (projeto) {
      projetoInput.value = projeto.titulo;
      projetoHidden.value = projeto.id;
      if (projeto.tipo) {
        tiposSelect.value = projeto.tipo.id;
        await carregarCriteriosTipo();
      }
      if (projeto.orientador) {
        orientadorHidden.value = projeto.orientador.id;
        orientadorInput.value = projeto.orientador.nome;
      }
      aplicarFiltrosProjeto();
      carregarProjeto(projetoId);
    }
  }
});
