import { supabase } from '../supabase.js';

export const listarCriterios = async (tipoProjetoId = null) => {
  let query = supabase
    .from('criterios')
    .select('*, tipo:tipos_projeto(id, nome)')
    .order('id');

  if (tipoProjetoId) {
    query = query.eq('tipo_projeto_id', tipoProjetoId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data;
};

export const excluirCriterio = async (id) => {
  const { error } = await supabase.from('criterios').delete().eq('id', id);
  if (error) throw error;
};

export const salvarCriterio = async (criterio) => {
  const { data, error } = await supabase
    .from('criterios')
    .upsert(criterio)
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const listarAvaliacoes = async () => {
  const { data, error } = await supabase
    .from('avaliacoes')
    .select(`
      *,
      projeto:projetos(
        id,
        titulo,
        tipo:tipos_projeto(
          id,
          nome
        )
      ),
      avaliador:usuarios(
        id,
        nome
      ),
      notas(
        *,
        criterio:criterios(
          id,
          descricao,
          peso
        )
      )
    `)
    .order('data', { ascending: false });

  if (error) throw error;

  return data;
};

export const listarAvaliacoesDoUsuario = async (avaliadorId) => {
  const { data, error } = await supabase
    .from('avaliacoes')
    .select(`
      *,
      projeto:projetos(
        id,
        titulo,
        tipo:tipos_projeto(
          id,
          nome
        )
      ),
      notas(
        *,
        criterio:criterios(
          id,
          descricao,
          peso
        )
      )
    `)
    .eq('avaliador_id', avaliadorId)
    .order('data', { ascending: false });

  if (error) throw error;

  return data;
};

const calcularNotaFinal = async (notas) => {
  if (!notas.length) {
    return null;
  }

  for (const nota of notas) {
    if (
      Number.isNaN(Number(nota.nota)) ||
      nota.nota < 0 ||
      nota.nota > 10
    ) {
      throw new Error('Existem notas inválidas.');
    }
  }

  const ids = [...new Set(
    notas.map((nota) => nota.criterio_id)
  )];

  const { data: criterios, error } = await supabase
    .from('criterios')
    .select('id,peso')
    .in('id', ids);

  if (error) throw error;

  const pesos = new Map(
    criterios.map((criterio) => [
      criterio.id,
      Number(criterio.peso)
    ])
  );

  const totalPeso = notas.reduce(
    (total, nota) =>
      total + (pesos.get(nota.criterio_id) || 0),
    0
  );

  if (!totalPeso) {
    return null;
  }

  const soma = notas.reduce(
    (total, nota) =>
      total +
      Number(nota.nota) *
      (pesos.get(nota.criterio_id) || 0),
    0
  );

  return Number((soma / totalPeso).toFixed(2));
};

export const salvarAvaliacao = async ({
  notas = [],
  ...avaliacao
}) => {

  if (!notas.length) {
    throw new Error(
      'Informe ao menos uma nota.'
    );
  }

  const nota_final = await calcularNotaFinal(notas);

  const { data, error } = await supabase
    .from('avaliacoes')
    .upsert(
      {
        ...avaliacao,
        nota_final
      },
      {
        onConflict: 'projeto_id,avaliador_id'
      }
    )
    .select()
    .single();

  if (error) throw error;

  const { error: deleteError } = await supabase
    .from('notas')
    .delete()
    .eq('avaliacao_id', data.id);

  if (deleteError) throw deleteError;

  if (notas.length) {

    const linhas = notas.map((nota) => ({
      avaliacao_id: data.id,
      criterio_id: nota.criterio_id,
      nota: Number(nota.nota)
    }));

    const { error: notasError } = await supabase
      .from('notas')
      .insert(linhas);

    if (notasError) throw notasError;

  }

  return data;
};

export const listarRanking = async () => {

  const { data, error } = await supabase
    .from('projetos')
    .select(`
      id,
      ano,
      titulo,
      orientador,
      coorientador,

      tipo:tipos_projeto(
        id,
        nome
      ),

      area:areas_conhecimento(
        id,
        nome
      ),

      alunos:projeto_alunos(
        turma,
        aluno:alunos(
          id,
          nome,
          turma
        )
      ),

      avaliacoes(
        id,
        avaliador_id,
        data,
        nota_final,

        notas(
          nota,

          criterio:criterios(
            peso
          )
        )
      )
    `)
    .order('titulo');

  if (error) throw error;

  return data;
};

export const excluirAvaliacao = async (id) => {

  const { error } = await supabase
    .from('avaliacoes')
    .delete()
    .eq('id', id);

  if (error) throw error;

};
