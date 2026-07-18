import { supabase } from './supabase.js';

(async () => {

  const { data, error } = await supabase
    .from('projetos')
    .select(`
      *,
      tipo:tipos_projeto!projetos_tipo_projeto_id_fkey(
        id,
        nome
      )
    `);

  console.log(error);
  console.log(data);

})();
