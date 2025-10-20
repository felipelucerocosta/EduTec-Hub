const abrir = document.querySelector<HTMLElement>('#abrir-nav');
const cerrar = document.querySelector<HTMLElement>('#cerrar-nav');
const nav = document.querySelector<HTMLElement>('.nav-bar');


abrir?.addEventListener('click', () => {
  nav?.classList.toggle('active');
});

cerrar?.addEventListener('click', () => {
  nav?.classList.toggle('active');
});