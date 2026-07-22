import { supabase } from '../supabase.js';

const selectProjeto = `
  *,
  area:areas_conhecimento!projetos_area_id_fkey(
    id,
    nome
  ),
  tipo:tipos_projeto!projetos_tipo_projeto_id_fkey(
    id,
    nome
  ),
  orientador:professores!projetos_orientador_id_fkey(
    id,
    nome
  ),
  coorientador:professores!projetos_coorientador_id_fkey(
    id,
    nome
  ),
  alunos:projeto_alunos(
    turma,
    aluno:alunos(
      id,
      nome,
      matricula,
      turma,
      turno
    )
  ),
  avaliacoes(
    id,
    data,
    nota_final,
    avaliador_id,
    usuario:usuarios(
      id,
      nome
    ),
    notas(
      nota,
      criterio:criterios(
        id,
        descricao,
        peso
      )
    )
  )
`;

export const listarProjetos = async (filtros = {}) => {
  let query = supabase.from('projetos').select(selectProjeto).order('titulo');

  if (filtros.nome) query = query.or(`titulo.ilike.%${filtros.nome}%,codigo.ilike.%${filtros.nome}%`);
  if (filtros.tipo_projeto_id) query = query.eq('tipo_projeto_id', filtros.tipo_projeto_id);
  if (filtros.area_id) query = query.eq('area_id', filtros.area_id);
  if (filtros.orientador_id) query = query.eq('orientador_id', filtros.orientador_id);
  if (filtros.ano) query = query.eq('ano', filtros.ano);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const obterProjeto = async (id) => {
  const { data, error } = await supabase
    .from('projetos')
    .select(selectProjeto)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const salvarProjeto = async ({ alunos = [], ...projeto }) => {
  const { data: projetoSalvo, error } = await supabase
    .from('projetos')
    .upsert(projeto)
    .select()
    .single();
  if (error) throw error;

  await supabase.from('projeto_alunos').delete().eq('projeto_id', projetoSalvo.id);

  for (const aluno of alunos.filter((item) => item.nome?.trim())) {
    const turma = aluno.turma?.trim() || 'EMPM1A';

    let alunoId = aluno.id ? Number(aluno.id) : null;

    if (!alunoId && aluno.matricula) {
      const { data: existente } = await supabase
        .from('alunos')
        .select('id')
        .eq('matricula', aluno.matricula)
        .maybeSingle();
      if (existente) alunoId = existente.id;
    }

    if (!alunoId) {
      const { data: existente } = await supabase
        .from('alunos')
        .select('id')
        .ilike('nome', aluno.nome.trim())
        .maybeSingle();
      if (existente) alunoId = existente.id;
    }

    if (!alunoId) {
      const { data: alunoSalvo, error: alunoError } = await supabase
        .from('alunos')
        .upsert({
          nome: aluno.nome.trim(),
          turma,
          matricula: aluno.matricula || null,
          turno: aluno.turno || null
        }, { onConflict: 'id', ignoreDuplicates: false })
        .select()
        .single();
      if (alunoError) throw alunoError;
      alunoId = alunoSalvo.id;
    }

    const { error: relError } = await supabase
      .from('projeto_alunos')
      .upsert({ projeto_id: projetoSalvo.id, aluno_id: alunoId, turma }, { onConflict: 'projeto_id,aluno_id' });
    if (relError) throw relError;
  }

  return obterProjeto(projetoSalvo.id);
};

export const excluirProjeto = async (id) => {
  const { error } = await supabase.from('projetos').delete().eq('id', id);
  if (error) throw error;
};

export const contarProjetos = async () => {
  const { count, error } = await supabase
    .from('projetos')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
};
