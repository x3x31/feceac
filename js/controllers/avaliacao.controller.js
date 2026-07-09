import { buscarUsuarioAtual } from '../services/usuario.service.js';
import { listarProjetos } from '../services/projeto.service.js';
import {
  listarAvaliacoesDoUsuario,
  listarCriterios,
  salvarAvaliacao
} from '../services/avaliacao.service.js';

import {
  escapeHtml,
  qs,
  qsa,
  validarFormulario
} from '../util.js';

import { toast } from '../ui.js';


let projetosDisponiveis = [];


const renderizarProjetos = (projetos) => {

  qs('#projeto_id').innerHTML =
    `
      <option value="">
        Selecione um projeto
      </option>
    `
    +
    projetos.map((projeto) => {

      const tipo =
        projeto.tipo?.nome
          ? ` - ${projeto.tipo.nome}`
          : '';

      return `
        <option value="${projeto.id}">
          ${escapeHtml(projeto.titulo)}${escapeHtml(tipo)}
        </option>
      `;

    }).join('');

};



const renderizarCriterios = (criterios) => {


  const container = qs('#criterios');

  const mensagem = qs('#criteriosMensagem');


  if (!criterios.length) {

    mensagem.classList.remove('d-none');

    mensagem.className =
      'alert alert-warning';

    mensagem.textContent =
      'Não existem critérios cadastrados para este tipo de projeto.';


    container.innerHTML = '';

    return;

  }



  mensagem.classList.add('d-none');



  container.innerHTML = criterios.map((criterio) => `

    <div class="col-md-6">

      <div class="card border shadow-sm h-100">

        <div class="card-body">


          <label class="form-label">

            ${escapeHtml(criterio.descricao)}

            <small class="text-muted">

              (Peso: ${Number(criterio.peso).toFixed(2)})

            </small>

          </label>


          <input

            type="number"

            min="0"

            max="10"

            step="0.1"

            required

            class="form-control nota"

            data-criterio-id="${criterio.id}"

            placeholder="Digite a nota (0 a 10)"

          >


        </div>

      </div>

    </div>

  `).join('');

};



const limparInformacoesProjeto = () => {

  const card = qs('#infoProjeto');

  card.classList.add('d-none');


  qs('#infoTipo').textContent = '-';
  qs('#infoArea').textContent = '-';
  qs('#infoOrientador').textContent = '-';
  qs('#infoCoorientador').textContent = '-';


};



const mostrarInformacoesProjeto = async (projeto) => {


  if (!projeto) {

    limparInformacoesProjeto();

    renderizarCriterios([]);

    return;

  }



  qs('#infoProjeto')
    .classList
    .remove('d-none');


  qs('#infoTipo').textContent =
    projeto.tipo?.nome || '-';


  qs('#infoArea').textContent =
    projeto.area?.nome || '-';


  qs('#infoOrientador').textContent =
    projeto.orientador || '-';


  qs('#infoCoorientador').textContent =
    projeto.coorientador || '-';



  try {


    const criterios =
      await listarCriterios(
        projeto.tipo_projeto_id
      );


    renderizarCriterios(criterios);


  } catch (error) {


    toast(
      'Erro ao carregar critérios.',
      'danger'
    );


  }


};



const renderizarAvaliacoes = (avaliacoes) => {


  qs('#avaliacoesTabela').innerHTML =

    avaliacoes.map((avaliacao) => `

      <tr>


        <td>
          ${avaliacao.id}
        </td>


        <td>

          ${escapeHtml(
            avaliacao.projeto?.titulo || '-'
          )}

        </td>


        <td>

          ${escapeHtml(
            avaliacao.projeto?.tipo?.nome || '-'
          )}

        </td>


        <td>
          ${avaliacao.data}
        </td>


        <td>

          ${Number(
            avaliacao.nota_final ?? 0
          ).toFixed(2)}

        </td>


        <td>

          ${avaliacao.notas?.length || 0}

        </td>


      </tr>


    `).join('');

};



const carregarBase = async (usuario) => {


  const [
    projetos,
    avaliacoes
  ] = await Promise.all([

    listarProjetos(),

    listarAvaliacoesDoUsuario(
      usuario.id
    )

  ]);



  projetosDisponiveis = projetos;


  renderizarProjetos(projetos);


  renderizarAvaliacoes(
    avaliacoes
  );


};




document.addEventListener(
  'DOMContentLoaded',
  async () => {


    const usuario =
      await buscarUsuarioAtual();



    if (!usuario || usuario.tipo !== 'Avaliador') {


      toast(
        'Apenas Avaliadores podem realizar avaliações.',
        'danger'
      );


      setTimeout(
        () => {

          location.href =
            'painel.html';

        },

        800

      );


      return;

    }



    await carregarBase(usuario);



    qs('#projeto_id')
      .addEventListener(
        'change',
        async (event) => {


          const projetoId =
            Number(event.target.value);



          const projeto =
            projetosDisponiveis.find(
              (item) =>
                item.id === projetoId
            );



          await mostrarInformacoesProjeto(
            projeto
          );


        }

      );




    qs('#avaliacaoForm')
      .addEventListener(
        'submit',
        async (event) => {


          event.preventDefault();



          if (
            !validarFormulario(
              event.currentTarget
            )
          ) {

            return;

          }




          const notas =
            qsa('.nota')
              .map((input) => ({

                criterio_id:
                  Number(
                    input.dataset.criterioId
                  ),

                nota:
                  Number(
                    input.value
                  )

              }));




          try {


            await salvarAvaliacao({

              projeto_id:
                Number(
                  qs('#projeto_id').value
                ),

              avaliador_id:
                usuario.id,


              data:
                qs('#data').value,


              notas

            });



            toast(
              'Avaliação salva com sucesso.'
            );



            await carregarBase(
              usuario
            );


            qs('#criterios').innerHTML = '';



          } catch (error) {


            toast(
              error.message ||
              'Erro ao salvar avaliação.',
              'danger'
            );


          }


        }

      );


  }

);
