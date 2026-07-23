import { buscarUsuarioAtual } from '../services/usuario.service.js';
import { escapeHtml, qs } from '../util.js';
import { setLoading, toast } from '../ui.js';
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

const renderizar = (lista) => {
  const container = qs('#relContainer');

  if (!lista.length) {
    container.classList.add('d-none');
    qs('#relTabela').innerHTML = '';
    return;
  }

  container.classList.remove('d-none');
  qs('#relTotal').textContent = `Total: ${lista.length} aluno(s) vinculado(s) a mais de um projeto`;

  qs('#relTabela').innerHTML = `
    <div class="table-responsive">
      <table class="table table-bordered table-sm rel-tabela mb-0">
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Matrícula</th>
            <th>Turma</th>
            <th>Turno</th>
            <th style="width:60px; text-align:center;">Qtd.</th>
            <th>Projetos</th>
          </tr>
        </thead>
        <tbody>
          ${lista.map(aluno => `
            <tr>
              <td>${escapeHtml(aluno.nome)}</td>
              <td>${escapeHtml(aluno.matricula || '-')}</td>
              <td>${escapeHtml(aluno.turma || '-')}</td>
              <td>${escapeHtml(aluno.turno || '-')}</td>
              <td style="text-align:center;">${aluno.projetos.length}</td>
              <td>
                ${aluno.projetos.map(p => `
                  <div class="projeto-item">
                    <strong>${escapeHtml(p.titulo)}</strong>
                    <span class="text-muted">(${escapeHtml(p.codigo || '-')})</span>
                    <span class="text-muted"> — Orientador: ${escapeHtml(p.orientador || '-')}${p.coorientador ? ' | Coorientador: ' + escapeHtml(p.coorientador) : ''}</span>
                  </div>
                `).join('')}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  qs('#relFooter').textContent = `FECEAC ${new Date().getFullYear()} — Gerado em ${new Date().toLocaleString('pt-BR')}`;
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

  qs('#btnImprimir').addEventListener('click', () => {
    window.print();
  });
});
