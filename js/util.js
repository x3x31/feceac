export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

export const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export const getParam = (name) => new URLSearchParams(location.search).get(name);

export const redirect = (url) => {
  window.location.href = url;
};

export const formToObject = (form) => Object.fromEntries(new FormData(form).entries());

export const validarFormulario = (form) => {
  form.classList.add('was-validated');
  return form.checkValidity();
};

export const anoAtual = () => new Date().getFullYear();

export const debounce = (fn, delay = 350) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

