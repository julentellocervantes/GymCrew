// MUNDOS: cada apartado de la barra y cada juego tiene su propia ambientación.
// <html data-seccion="juegos|util|campana|tienda|ajustes"> en las pantallas principales y
// <html data-juego="blackjack|poker|mus|baccarat|videopoker|ruleta"> dentro de un juego.
// Todo el aspecto vive en css/mundos.css; aquí solo se marca dónde estás.
(function () {
  const html = document.documentElement;
  const poner = (clave, valor) => { if (valor) html.dataset[clave] = valor; else delete html.dataset[clave]; };

  // La barra inferior sabe en qué pestaña estás: esa es la sección
  const barraOriginal = window.barra;
  window.barra = function (activa, ...resto) {
    poner('seccion', activa || '');
    if (activa) poner('juego', '');
    return barraOriginal.call(this, activa, ...resto);
  };

  // Al entrar en un juego (mapa, intro, lección, resultado, cofre, repaso) se marca cuál es
  ['mostrarMapa', 'mostrarIntro', 'mostrarLeccion', 'mostrarResultado', 'mostrarCofre', 'iniciarRepaso'].forEach((nombre) => {
    const original = window[nombre];
    if (typeof original !== 'function') return;
    window[nombre] = function (curso, ...resto) {
      const r = original.call(this, curso, ...resto);
      if (curso && typeof curso === 'object' && curso.id) { poner('juego', curso.id); poner('seccion', ''); }
      return r;
    };
  });
  const entreno = window.iniciarEntrenoTema;
  if (typeof entreno === 'function') window.iniciarEntrenoTema = function (cursoId, ...resto) { const r = entreno.call(this, cursoId, ...resto); poner('juego', cursoId); poner('seccion', ''); return r; };
})();
