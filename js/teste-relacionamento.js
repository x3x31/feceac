import { supabase } from './supabase.js';

(async () => {

  const { data, error } = await supabase
    .from('projetos')
    .select(`
      *,
      tipo:tipos_projeto(
        id,
        nome
      )
    `);

  console.log('ERRO');
  console.log(error);

  console.log('DADOS');
  console.log(data);

})();
