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
let logoEsq = null;
let logoDir = null;

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

const gerarPDF = async () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = 210;
  const pageH = 297;
  const margin = 14;
  const contentW = pageW - margin * 2;

  const corPrimaria = [25, 135, 84];
  const corTexto = [51, 51, 51];
  const corCinza = [108, 117, 125];
  const corLinha = [204, 204, 204];
  const corLinhaSecao = [222, 226, 230];

  if (!logoEsq) logoEsq = await carregarImagem('assets/logos/feceac.jpeg');
  if (!logoDir) logoDir = await carregarImagem('assets/logos/logo-feceac.jpeg');

  let y = 6;

  if (logoEsq) doc.addImage(logoEsq, 'JPEG', margin, y, 20, 16);
  if (logoDir) doc.addImage(logoDir, 'JPEG', pageW - margin - 20, y, 20, 16);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...corPrimaria);
  doc.text('Ficha de Avaliação', pageW / 2, y + 8, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...corCinza);
  doc.text('Feira de Ciências e Arte e Cultura', pageW / 2, y + 13, { align: 'center' });

  y += 20;

  doc.setDrawColor(...corPrimaria);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageW - margin, y);
  doc.setLineWidth(0.2);
  y += 6;

  const campoLinha = (label, valor, yPos) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...corTexto);
    doc.text(label + ':', margin, yPos);
    const labelW = doc.getTextWidth(label + ': ');
    const valorX = margin + labelW;
    const valorMaxW = contentW - labelW;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(85, 85, 85);
    doc.text(truncar(valor || '', valorMaxW, doc) || '', valorX, yPos);
    const textEnd = valorX + (doc.getTextWidth(truncar(valor || '', valorMaxW, doc)) || 0);
    doc.setDrawColor(...corLinha);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(textEnd + 1, yPos + 1, margin + contentW, yPos + 1);
    doc.setLineDashPattern([], 0);
    return yPos + 6;
  };

  const campoDuplo = (l1, v1, l2, v2, yPos) => {
    const halfW = contentW / 2 - 4;
    const col2x = margin + halfW + 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...corTexto);
    doc.text(l1 + ':', margin, yPos);
    const lw1 = doc.getTextWidth(l1 + ': ');
    const v1x = margin + lw1;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(85, 85, 85);
    const v1txt = truncar(v1 || '', halfW - lw1, doc) || '';
    doc.text(v1txt, v1x, yPos);
    const end1 = v1x + (doc.getTextWidth(v1txt) || 0);
    doc.setDrawColor(...corLinha);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(end1 + 1, yPos + 1, margin + halfW, yPos + 1);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...corTexto);
    doc.text(l2 + ':', col2x, yPos);
    const lw2 = doc.getTextWidth(l2 + ': ');
    const v2x = col2x + lw2;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(85, 85, 85);
    const v2txt = truncar(v2 || '', halfW - lw2, doc) || '';
    doc.text(v2txt, v2x, yPos);
    const end2 = v2x + (doc.getTextWidth(v2txt) || 0);
    doc.setDrawColor(...corLinha);
    doc.line(end2 + 1, yPos + 1, col2x + halfW, yPos + 1);
    doc.setLineDashPattern([], 0);
    return yPos + 6;
  };

  y = campoLinha('Título', projetoAtual?.titulo, y);
  y = campoDuplo('Código', projetoAtual?.codigo, 'Tipo', projetoAtual?.tipo?.nome, y);
  y = campoDuplo('Área', projetoAtual?.area?.nome, 'Orientador', projetoAtual?.orientador?.nome, y);
  y = campoLinha('Coorientador', projetoAtual?.coorientador?.nome, y);

  y += 2;

  const desenharSecao = (texto, yPos) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...corPrimaria);
    doc.text(texto, margin, yPos);
    doc.setDrawColor(...corLinhaSecao);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos + 1.5, pageW - margin, yPos + 1.5);
    doc.setLineWidth(0.2);
    return yPos + 6;
  };

  const legendaItens = [
    { nota: '5', desc: 'Fraco' },
    { nota: '6', desc: 'Regular' },
    { nota: '7', desc: 'Bom' },
    { nota: '8', desc: 'Ótimo' },
    { nota: '9', desc: 'Excelente' },
    { nota: '10', desc: 'Supera expectativas' },
  ];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...corPrimaria);
  doc.text('Critérios de Avaliação', margin, y);

  let badgeX = pageW - margin;
  for (let i = legendaItens.length - 1; i >= 0; i--) {
    const item = legendaItens[i];
    const descW = doc.getTextWidth(item.desc);
    badgeX -= descW;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...corCinza);
    doc.text(item.desc, badgeX, y);
    badgeX -= 2;
    const badgeW = item.nota === '10' ? 8 : 5;
    doc.setFillColor(...corPrimaria);
    doc.roundedRect(badgeX - badgeW, y - 3.5, badgeW, 4, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text(item.nota, badgeX - badgeW / 2, y - 0.5, { align: 'center' });
    badgeX -= 5;
  }

  doc.setDrawColor(...corLinhaSecao);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 1.5, pageW - margin, y + 1.5);
  doc.setLineWidth(0.2);
  y += 6;

  if (criteriosAtuais.length > 0) {
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
      styles: { fontSize: 8, cellPadding: 2, valign: 'middle', textColor: corTexto },
      headStyles: { fillColor: corPrimaria, fontSize: 8, textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: contentW - 18 },
        1: { cellWidth: 18, halign: 'center' },
      },
    });

    y = doc.lastAutoTable.finalY + 4;
  }

  y = desenharSecao('Nota Final', y);
  doc.setDrawColor(...corTexto);
  doc.setLineWidth(0.4);
  doc.line(pageW - margin - 30, y + 2, pageW - margin, y + 2);
  doc.setLineWidth(0.2);
  y += 10;

  y = desenharSecao('Alunos', y);

  const alunos = projetoAtual ? (projetoAtual.alunos || []).map((pa) => pa.aluno).filter(Boolean) : [];
  const numLinhas = Math.max(alunos.length, FILTRO_NUM_ALUNOS);

  for (let i = 0; i < numLinhas; i++) {
    const a = alunos[i];
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...corTexto);
    doc.text(`${i + 1}º`, margin, y);

    doc.setDrawColor(...corLinha);
    doc.setLineWidth(0.2);

    if (a) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(85, 85, 85);
      const nomeCompleto = a.turma ? `${a.nome} — ${a.turma}` : a.nome;
      const txt = truncar(nomeCompleto, contentW - 12, doc);
      doc.text(txt, margin + 8, y);
      const textW = doc.getTextWidth(txt);
      doc.line(margin + 8 + textW + 1, y + 1, margin + contentW, y + 1);
    } else {
      doc.line(margin + 8, y + 1, margin + contentW, y + 1);
    }
    y += 6;
  }

  y += 2;

  y = desenharSecao('Observações Gerais', y);
  for (let i = 0; i < 3; i++) {
    doc.setDrawColor(...corLinha);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 1, margin + contentW, y + 1);
    y += 6;
  }

  y += 10;
  const sigW = 65;
  const sigX = margin + (contentW - sigW) / 2;
  doc.setDrawColor(...corTexto);
  doc.setLineWidth(0.3);
  doc.line(sigX, y, sigX + sigW, y);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...corCinza);
  doc.text('Avaliador(a)', sigX + sigW / 2, y + 4, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(...corCinza);
  doc.text(
    `FECEAC ${new Date().getFullYear()}`,
    pageW / 2, pageH - 8, { align: 'center' }
  );

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
