import { escapeHtml, qs } from './util.js';

export const setLoading = (target, ativo = true, texto = 'Carregando...') => {
  const element = typeof target === 'string' ? qs(target) : target;
  if (!element) return;
  element.innerHTML = ativo
    ? `<div class="text-center py-4"><div class="spinner-border text-primary"></div><p class="mt-2 mb-0">${texto}</p></div>`
    : '';
};

export const toast = (mensagem, tipo = 'success') => {
  let container = qs('#toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(container);
  }

  const item = document.createElement('div');
  item.className = `toast text-bg-${tipo} border-0`;
  item.setAttribute('role', 'alert');
  item.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${escapeHtml(mensagem)}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
  container.appendChild(item);
  bootstrap.Toast.getOrCreateInstance(item, { delay: 4000 }).show();
  item.addEventListener('hidden.bs.toast', () => item.remove());
};

export const confirmar = (mensagem) => window.confirm(mensagem);

export const mensagemVazia = (texto = 'Nenhum registro encontrado.') => (
  `<div class="alert alert-light border text-center mb-0">${escapeHtml(texto)}</div>`
);

