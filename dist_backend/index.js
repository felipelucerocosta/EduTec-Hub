const abrir = document.querySelector('#abrir-nav');
const cerrar = document.querySelector('#cerrar-nav');
const nav = document.querySelector('.nav-bar');
abrir?.addEventListener('click', () => {
    nav?.classList.toggle('active');
});
cerrar?.addEventListener('click', () => {
    nav?.classList.toggle('active');
});
