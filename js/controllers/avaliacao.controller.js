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
  const dropdown = qs('#projetoDropdown');
  dropdown.innerHTML = projetos.length
    ? projetos.map((projeto) => `
      <button type="button" class="list-group-item list-group-item-action" data-id="${projeto.id}" data-titulo="${escapeHtml(projeto.titulo)}" data-codigo="${escapeHtml(projeto.codigo || '')}">
        ${escapeHtml(projeto.titulo)}${projeto.codigo ? ' (' + escapeHtml(projeto.codigo) + ')' : ''}
      </button>
    `).join('')
    : '<div class="list-group-item text-muted">Nenhum projeto encontrado</div>';
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


  qs('#infoNomeProjeto').textContent = '-';
  qs('#infoCodigo').textContent = '-';
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


  qs('#infoNomeProjeto').textContent =
    projeto.titulo || '-';

  qs('#infoCodigo').textContent =
    projeto.codigo || '-';

  qs('#infoTipo').textContent =
    projeto.tipo?.nome || '-';


  qs('#infoArea').textContent =
    projeto.area?.nome || '-';


  qs('#infoOrientador').textContent =
    projeto.orientador?.nome || '-';


  qs('#infoCoorientador').textContent =
    projeto.coorientador?.nome || '-';



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
           ${avaliacao.data
              ? avaliacao.data.split('-').reverse().join('/')
              : '-'}
        </td>

        <td>
          ${Number(
            avaliacao.nota_final ?? 0
          ).toFixed(2)}
        </td>

      </tr>

    `).join('');

};



const carregarBase = async (usuario) => {

  const filtros = {};

  if (usuario.tipo === 'Professor') {
    filtros.tipo_projeto_id = 2;
  } else if (usuario.tipo === 'Avaliador') {
    filtros.tipo_projeto_id = 1;
  }

  const [
    projetos,
    avaliacoes
  ] = await Promise.all([

    listarProjetos(filtros),

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


const mostrarObservacoes = (criterioId, descricao) => {

  const textarea = document.querySelector(`#obs-${criterioId}`);

  if (!textarea) {
    return;
  }

  const observacoes = textarea.value?.trim();

  if (!observacoes) {
    toast(
      'Não existem observações para este critério.',
      'info'
    );
    return;
  }

  let modal = document.getElementById('modalObservacoes');

  if (!modal) {

    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal fade" id="modalObservacoes" tabindex="-1" aria-hidden="true">

        <div class="modal-dialog modal-lg modal-dialog-centered">

          <div class="modal-content">

            <div class="modal-header bg-primary text-white">

              <h5 class="modal-title" id="modalObservacoesTitulo"></h5>

              <button
                type="button"
                class="btn-close btn-close-white"
                data-bs-dismiss="modal"
                aria-label="Fechar">
              </button>

            </div>

            <div class="modal-body">

              <div
                id="modalObservacoesTexto"
                style="white-space: pre-wrap;">
              </div>

            </div>

            <div class="modal-footer">

              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal">

                Fechar

              </button>

            </div>

          </div>

        </div>

      </div>
    `);

    modal = document.getElementById('modalObservacoes');

  }

  document.getElementById('modalObservacoesTitulo').textContent = descricao;

  document.getElementById('modalObservacoesTexto').textContent = observacoes;

  bootstrap.Modal.getOrCreateInstance(modal).show();

};


window.mostrarObservacoes = mostrarObservacoes;

document.addEventListener(
  'DOMContentLoaded',
  async () => {


    const usuario =
      await buscarUsuarioAtual();



    if (!usuario || !['Avaliador', 'Administrador', 'Professor'].includes(usuario.tipo)) {


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

    const buscaInput = qs('#projetoBusca');
    const dropdown = qs('#projetoDropdown');
    const hiddenInput = qs('#projeto_id');

    buscaInput.addEventListener('input', () => {
      const termo = buscaInput.value.trim().toLowerCase();
      const itens = dropdown.querySelectorAll('.list-group-item[data-id]');
      let visiveis = 0;
      itens.forEach((item) => {
        const titulo = item.dataset.titulo.toLowerCase();
        const codigo = (item.dataset.codigo || '').toLowerCase();
        const mostra = !termo || titulo.includes(termo) || codigo.includes(termo);
        item.classList.toggle('d-none', !mostra);
        if (mostra) visiveis++;
      });
      dropdown.classList.remove('d-none');
      if (!visiveis && termo) {
        dropdown.innerHTML = '<div class="list-group-item text-muted">Nenhum projeto encontrado</div>';
      } else if (!termo) {
        renderizarProjetos(projetosDisponiveis);
      }
    });

    buscaInput.addEventListener('focus', () => {
      renderizarProjetos(projetosDisponiveis);
      dropdown.classList.remove('d-none');
    });

    dropdown.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-id]');
      if (!btn) return;
      hiddenInput.value = btn.dataset.id;
      buscaInput.value = btn.dataset.titulo + (btn.dataset.codigo ? ' (' + btn.dataset.codigo + ')' : '');
      dropdown.classList.add('d-none');
      const projeto = projetosDisponiveis.find((p) => p.id === Number(btn.dataset.id));
      mostrarInformacoesProjeto(projeto);
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('#projetoBusca') && !event.target.closest('#projetoDropdown')) {
        dropdown.classList.add('d-none');
      }
    });




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

            qs('#projeto_id').value = '';
            qs('#projetoBusca').value = '';
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
