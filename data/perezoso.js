// NIVELES «PEREZOSOS»: los ejercicios de un nivel generado por código no se crean al abrir la app,
// sino la primera vez que se lee `nivel.ejercicios` (al abrir el nivel, repasar o validar).
// Así la app arranca rápido aunque haya cientos de niveles. Con la misma semilla salen siempre los mismos ejercicios.
//   GEN.perezoso(nivel, fabrica, conGanchos)  define nivel.ejercicios como una propiedad que se rellena al primer uso
//   GEN.aplicar(fn)                           ejecuta fn(nivel) sobre todos los niveles: ya hechos ahora, perezosos cuando se creen

(function () {
  const ganchos = [];
  const finales = []; // se aplican a TODOS los niveles (también los Oro) cuando ya están completos
  GEN.perezoso = function (nivel, fabrica, conGanchos = true) {
    const fijar = (v) => { nivel.listo = true; Object.defineProperty(nivel, 'ejercicios', { value: v, writable: true, enumerable: true, configurable: true }); };
    Object.defineProperty(nivel, 'ejercicios', {
      enumerable: true,
      configurable: true,
      get() {
        fijar(fabrica());
        if (conGanchos) ganchos.forEach((f) => f(nivel));
        finales.forEach((f) => f(nivel));
        return nivel.ejercicios;
      },
      set(v) { fijar(v); },
    });
    nivel.perezoso = true;
    return nivel;
  };
  GEN.aplicar = function (fn) {
    ganchos.push(fn);
    for (const curso of CURSOS) for (const u of curso.unidades) for (const l of u.lecciones) if (!l.perezoso || l.listo) fn(l);
  };
  // fn(nivel) se ejecuta una vez por nivel, cuando ya tiene todos sus ejercicios: los de los niveles ya hechos ahora y los perezosos al crearse
  GEN.transformar = function (fn, niveles) {
    finales.push(fn);
    for (const l of niveles) if (!l.perezoso || l.listo) fn(l);
  };
})();

const GENERADORES = GEN; // alias para archivos que usan su propio «GEN» local (data/variedad-generada.js)
