// Define a altura da viewport real para lidar com barras de navegação móveis
function setVhProperty() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Chama a função inicialmente
setVhProperty();

// Chama a função novamente se a janela for redimensionada (ex: teclado aparece/desaparece, rotação)
window.addEventListener('resize', setVhProperty);

// Chama a função que esconde a logo ao rolar a tela - add 05/08
const header = document.querySelector('.sticky-header');
window.addEventListener("scroll", function() {
    if (window.scrollY > 10) {
        header.classList.add("hidden"); // Esconde a logo para sempre
    }
});