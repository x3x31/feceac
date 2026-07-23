import { buscarUsuarioAtual } from '../services/usuario.service.js';
import { escapeHtml, qs } from '../util.js';
import { setLoading, toast, mensagemVazia } from '../ui.js';
import { supabase } from '../supabase.js';

let alunosDados = [];
let alunosOrdenados = [];

const ordenar = (lista, criterio) => {
  const copia = [...lista];
  switch (criterio) {
    case 'aluno': return copia.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    case 'aluno_desc': return copia.sort((a, b) => b.nome.localeCompare(a.nome, 'pt-BR'));
    case 'orientador': return copia.sort((a, b) => (a.orientadores || []).join(', ').localeCompare((b.orientadores || []).join(', '), 'pt-BR'));
    case 'orientador_desc': return copia.sort((a, b) => (b.orientadores || []).join(', ').localeCompare((a.orientadores || []).join(', '), 'pt-BR'));
    case 'qtd_projetos': return copia.sort((a, b) => (b.projetos || []).length - (a.projetos || []).length);
    default: return copia;
  }
};

const alunoInfo = (aluno) => {
  const partes = [aluno.nome];
  if (aluno.matricula) partes.push(`Mat: ${aluno.matricula}`);
  if (aluno.turma) partes.push(`Turma: ${aluno.turma}`);
  if (aluno.turno) partes.push(`Turno: ${aluno.turno}`);
  return partes.join(' | ');
};

const alunoInfoQuebra = (aluno) => {
  const partes = [aluno.matricula, aluno.turma, aluno.turno].filter(Boolean);
  return partes.join(' / ') || '-';
};

const projetosResumo = (projetos) => {
  return projetos.map(p =>
    `${p.titulo} (${p.codigo || '-'}). Orientador: ${p.orientador}${p.coorientador ? ' | Coorientador: ' + p.coorientador : ''}`
  ).join('\n');
};

const renderizar = (lista) => {
  const corpo = qs('#alunosTabela');
  if (!lista.length) {
    corpo.innerHTML = `<tr><td colspan="3">${mensagemVazia('Nenhum aluno vinculado a mais de um projeto.')}</td></tr>`;
    return;
  }

  corpo.innerHTML = lista.map(aluno => `
    <tr>
      <td>
        <strong>${escapeHtml(aluno.nome)}</strong><br>
        <small class="text-muted">${escapeHtml(alunoInfoQuebra(aluno))}</small>
      </td>
      <td style="text-align:center;">${aluno.projetos.length}</td>
      <td>
        ${aluno.projetos.map(p => `
          <div class="mb-1">
            <strong>${escapeHtml(p.titulo)}</strong>
            <span class="text-muted">(${escapeHtml(p.codigo || '-')})</span>
            <br>
            <small class="text-muted">
              Orientador: ${escapeHtml(p.orientador || '-')}
              ${p.coorientador ? ' | Coorientador: ' + escapeHtml(p.coorientador) : ''}
            </small>
          </div>
        `).join('')}
      </td>
    </tr>
  `).join('');
};

const carregarDados = async () => {
  setLoading('#estadoAlunos', true);
  try {
    const { data: projetos, error } = await supabase
      .from('projetos')
      .select(`
        id,
        titulo,
        codigo,
        orientador:professores!projetos_orientador_id_fkey(
          id,
          nome
        ),
        coorientador:professores!projetos_coorientador_id_fkey(
          id,
          nome
        ),
        projeto_alunos(
          aluno:alunos(
            id,
            nome,
            matricula,
            turma,
            turno
          )
        )
      `);

    if (error) throw error;

    const mapaAlunos = {};

    projetos.forEach(projeto => {
      (projeto.projeto_alunos || []).forEach(pa => {
        const aluno = pa.aluno;
        if (!aluno) return;
        if (!mapaAlunos[aluno.id]) {
          mapaAlunos[aluno.id] = {
            id: aluno.id,
            nome: aluno.nome,
            matricula: aluno.matricula,
            turma: aluno.turma,
            turno: aluno.turno,
            projetos: [],
            orientadores: [],
          };
        }
        mapaAlunos[aluno.id].projetos.push({
          titulo: projeto.titulo,
          codigo: projeto.codigo,
          orientador: projeto.orientador?.nome || '-',
          coorientador: projeto.coorientador?.nome || '',
        });
        if (projeto.orientador?.nome && !mapaAlunos[aluno.id].orientadores.includes(projeto.orientador.nome)) {
          mapaAlunos[aluno.id].orientadores.push(projeto.orientador.nome);
        }
      });
    });

    alunosDados = Object.values(mapaAlunos).filter(a => a.projetos.length > 1);

    const ordem = qs('#filtroOrdenacao').value;
    alunosOrdenados = ordenar(alunosDados, ordem);
    renderizar(alunosOrdenados);
  } catch (error) {
    toast(error.message || 'Erro ao carregar dados.', 'danger');
  } finally {
    setLoading('#estadoAlunos', false);
  }
};

const gerarPDF = () => {
  if (!alunosOrdenados.length) {
    toast('Nenhum aluno para imprimir.', 'warning');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  const corPrimaria = [25, 135, 84];
  const corTexto = [33, 37, 41];
  const corCinza = [108, 117, 125];

  const desenharCabecalho = () => {
    doc.setFillColor(...corPrimaria);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FECEAC - Alunos em Multiplos Projetos', margin, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW - margin, 18, { align: 'right' });
  };

  desenharCabecalho();

  let y = 36;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...corPrimaria);
  doc.text(`Total: ${alunosOrdenados.length} aluno(s) vinculado(s) a mais de um projeto`, margin, y);
  y += 8;

  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Aluno', 'Qtd.', 'Projetos']],
    body: alunosOrdenados.map(aluno => [
      `${aluno.nome}\n${alunoInfoQuebra(aluno)}`,
      String(aluno.projetos.length),
      projetosResumo(aluno.projetos),
    ]),
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 2, valign: 'top' },
    headStyles: { fillColor: corPrimaria, fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 'auto' },
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        desenharCabecalho();
      }
    },
  });

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
  const usuario = await buscarUsuarioAtual();
  if (!usuario || usuario.tipo !== 'Administrador') {
    toast('Apenas Administradores podem acessar este relatório.', 'danger');
    setTimeout(() => { location.href = 'painel.html'; }, 800);
    return;
  }

  await carregarDados();

  qs('#filtroOrdenacao').addEventListener('change', () => {
    const ordem = qs('#filtroOrdenacao').value;
    alunosOrdenados = ordenar(alunosDados, ordem);
    renderizar(alunosOrdenados);
  });

  qs('#btnImprimir').addEventListener('click', gerarPDF);
});
