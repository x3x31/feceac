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

    <div class="col-md-6 mb-3">


      <label class="form-label d-flex justify-content-between align-items-center">

        <span>
          ${escapeHtml(criterio.descricao)}
          (${Number(criterio.peso).toFixed(2)})
        </span>


        ${
          criterio.observacoes
            ? `
              <button
                type="button"
                class="btn btn-sm btn-outline-info"
                onclick="mostrarObservacoes(${criterio.id}, '${escapeHtml(criterio.descricao)}')">

                <i class="bi bi-info-circle"></i> ❔

              </button>
            `
            : ''
        }


      </label>



      ${
        criterio.observacoes
          ? `
            <textarea
              id="obs-${criterio.id}"
              hidden>${criterio.observacoes}</textarea>
          `
          : ''
      }



      <select
        required
        class="form-select nota"
        data-criterio-id="${criterio.id}">


        <option value="" selected disabled>
          Selecione uma nota
        </option>


        <option value="5">
          5 - Fraco ou Ausente
        </option>


        <option value="6">
          6 - Regular
        </option>


        <option value="7">
          7 - Bom
        </option>


        <option value="8">
          8 - Ótimo
        </option>


        <option value="9">
          9 - Excelente
        </option>


        <option value="10">
          10 - Supera as expectativas
        </option>


      </select>


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
