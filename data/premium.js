// RUTA DORADA (VIP): un nivel «Oro» más difícil junto a cada nivel normal del mapa.
//
// Los ejercicios se generan con código (semilla fija por nivel: siempre salen los mismos) y la respuesta
// se calcula en el momento. tests/validar.js los recalcula con código independiente.
// El campo "chequeo" solo lo usa el validador; la app lo ignora.
//
//  - PREMIUM: ajustes de la membresía (precio, enlace de pago, modo de pruebas).
//  - ORO:     { idDelNivelNormal: nivelOro }  (cada nivelOro tiene oro:true y el mismo formato que un nivel).
//  - CURSOS_ORO: lo mismo con forma de cursos, para el validador.

const PREMIUM = {
  nombre: 'VIP',
  precio: '4,99 €',
  periodo: 'al mes',
  // true  = MODO DE PRUEBAS: el botón activa 5 días de VIP en este dispositivo SIN cobrar (demostración).
  // false = COBRO REAL: entrar con el correo + pago con Stripe (hay que configurar Stripe antes; mira el LEEME).
  modoPrueba: true,
  // Proyecto de Supabase que guarda las cuentas y el VIP (la clave «publishable» es pública por diseño).
  nube: { url: 'https://coqptiznghgxbidhexps.supabase.co', clave: 'sb_publishable_xj7JE8sqhRY5_8h2zz-GDA_Hbakws9m' },
  diasPrueba: 5,
};

const ORO = {};
const CURSOS_ORO = [];


// (Los generadores de ejercicios están en data/generadores.js)
(function () {

  // [id del nivel normal, título Oro, receta]
  const RECETAS = {
    blackjack: [
      ['bj-1-1', 'Totales al límite', 'tot tot dur selD ordT tot'],
      ['bj-1-2', 'Manos sin red', 'dur tot emp dur ordT bla'],
      ['bj-2-1', 'Pedir o plantarte: modo experto', 'dur dur selD emp tot dur'],
      ['bj-2-2', 'Dobles de oro', 'dur bla selD dbl emp dur'],
      ['bj-2-3', 'Parejas peliagudas', 'par par selP emp par dur'],
      ['bj-2-4', 'Blandas de élite', 'bla bla selB emp tot bla'],
      ['bj-3-1', 'Hi-Lo a ritmo de casino', 'con selH conN ordC con selH'],
      ['bj-3-2', 'Cuenta corriente sin fallos', 'con con conN selH ordC con'],
      ['bj-3-3', 'Cuenta verdadera al detalle', 'verN verN ver ordC verN ver'],
      ['bj-3-4', 'Cuándo sube la cuenta', 'ver verN ordC con verN selH'],
      ['bj-3-5', 'Conteo y estrategia a la vez', 'ver con verN dur selH ordC'],
      ['bj-4-1', 'El seguro, al céntimo', 'seg seg dur seg selD dbl'],
      ['bj-4-2', 'Rendirse y pagos', 'ren nat dbl ren dur selD'],
      ['bj-4-3', 'Dinero bajo control', 'bank bank dur bank ordT seg'],
      ['bj-5-1', 'Gran reto de estrategia', 'dur bla par selD emp dur bla par'],
      ['bj-5-2', 'Gran reto de conteo', 'con verN ver conN ordC selH con ver'],
      ['bj-6-1', 'Totales de élite', 'tot tot ordT tot dur selD'],
      ['bj-6-2', 'Estrategia sin errores', 'dur bla par emp selP dur bla par'],
      ['bj-6-3', 'Conteo de élite', 'con conN selH verN ver ordC'],
      ['bj-6-4', 'Dinero de élite', 'seg ren nat dbl bank dur ordT'],
    ],
    poker: [
      ['pk-1-1', 'Manos sin pistas', 'mano mano ordP selC emP mano'],
      ['pk-1-2', 'El ranking de memoria', 'mano ordP emP mano selC mano'],
      ['pk-2-1', 'Outs bajo presión', 'outs outs selC emO outs dec'],
      ['pk-2-2', 'Probabilidades rápidas', 'outs outs dec emO selC outs'],
      ['pk-3-1', 'Leer la mesa', 'mano gana ordP emP gana mano'],
      ['pk-3-2', 'Pot odds de verdad', 'pot pot dec dec outs ordP'],
      ['pk-4-1', 'Ciegas y decisiones', 'gana mano ordP emP gana selC'],
      ['pk-4-2', 'Hablar último, ganar más', 'gana gana mano ordP emP selC'],
      ['pk-4-3', 'Cada ronda cuenta', 'mano gana pot ordP emP gana'],
      ['pk-5-1', 'Manos iniciales: examen', 'gana mano ordP emP pot outs'],
      ['pk-5-2', 'Outs de campeonato', 'outs dec outs dec selC emO'],
      ['pk-6-1', 'Duelos de manos', 'gana gana gana mano ordP emP'],
      ['pk-6-2', 'Tu mejor mano, sin dudas', 'mano mano gana selC ordP emP'],
      ['pk-6-3', 'Valor, farol y matemáticas', 'gana dec pot mano ordP emP'],
      ['pk-7-1', 'Manos de élite', 'mano mano gana ordP emP selC'],
      ['pk-7-2', 'Cálculo de élite', 'outs pot dec dec emO selC'],
      ['pk-7-3', 'Duelos de élite', 'gana gana gana mano ordP emP'],
    ],
    mus: [
      ['ms-1-1', 'Puntos y figuras', 'sel10 pun pun jue sel10 jue'],
      ['ms-1-2', 'Los lances a fondo', 'ordJ pun winG winC jue ordMG'],
      ['ms-2-1', 'Pares, medias y duples', 'cat winP winP ordMG sel10 cat'],
      ['ms-2-2', 'Juego y punto', 'jue jue pun ordJ winJ winJ'],
      ['ms-3-1', 'Mesa de campeonato', 'winG winC ordMC sel10 pun winP'],
      ['ms-3-2', 'Descartes con cabeza', 'sel10 pun winG jue ordMC cat'],
      ['ms-3-3', 'Contar piedras', 'pie fal sel10 fal jue ordJ'],
      ['ms-3-4', '¿Quién gana? Nivel experto', 'winG winC cat winJ ordMG ordJ'],
      ['ms-4-1', 'Puntos de élite', 'sel10 pun jue ordJ cat winJ'],
      ['ms-4-2', 'Lances de élite', 'winG winC winP ordMG cat jue'],
      ['ms-4-3', 'Marcador de élite', 'pie fal winJ ordMC sel10 pun'],
    ],
    baccarat: [
      ['ba-1-1', 'Valores al vuelo', 'val tot ordT emV tot val'],
      ['ba-1-2', 'Naturales sin dudar', 'nat tot gana nat ordT gana'],
      ['ba-1-3', 'Pagos de oro', 'pag emP mej pag perd bank'],
      ['ba-2-1', 'Jugador sin errores', 'pj pj tot ordT pj selB'],
      ['ba-2-2', 'La Banca decide', 'bP bP bR pj tot ordT'],
      ['ba-2-3', 'Tabla de la Banca', 'bR bR selB bR tot bR'],
      ['ba-2-4', 'Manos de campeonato', 'gana gana gana tot ordT selB'],
      ['ba-3-1', 'Ventaja al detalle', 'mej edO perd perd pag emP'],
      ['ba-3-2', 'Disciplina de oro', 'bank bank edO perd mej bank'],
    ],
    videopoker: [
      ['vp-1-1', 'Primeras manos de élite', 'vpMano vpMano vpPago vpOrd vpEm vpMano'],
      ['vp-1-2', 'Pagos de memoria', 'vpEm vpPago vpPago vpOrd vpMano vpPago'],
      ['vp-1-3', 'Ojo de crupier', 'vpMano vpMano vpMano vpEm vpOrd vpPago'],
      ['vp-2-1', 'Guardar con criterio', 'vpHecha gT dT gT vpPago dA'],
      ['vp-2-2', 'Parejas bajo presión', 'gP dP gP dP gA vpPago'],
      ['vp-2-3', 'Color o escalera', 'gC dC gC dC vpQuedan vpEm'],
      ['vp-2-4', 'A por la real', 'gR dR gR dR vpPago vpOrd'],
      ['vp-3-1', 'Duelos de élite', 'dA gA dA gA dA vpPago'],
      ['vp-3-2', 'Dinero de élite', 'vpCoste vpRet vpOrd dA vpRet vpCoste'],
    ],
  };

  const TABLAS = { blackjack: GEN.BJ, poker: GEN.PK, mus: GEN.MS, baccarat: CASINO.BAC, videopoker: CASINO.VP };

  for (const curso of CURSOS) {
    const recetas = RECETAS[curso.id];
    if (!recetas) continue;
    const base = {};
    curso.unidades.forEach((u) => u.lecciones.forEach((l) => (base[l.id] = l)));
    const lecciones = [];
    for (const [idBase, titulo, receta] of recetas) {
      const normal = base[idBase];
      if (!normal) continue;
      const id = 'oro-' + idBase;
      const nivel = {
        id, oro: true, base: idBase, titulo, icono: '👑', xp: normal.xp * 2,
        intro: `Nivel Oro de «${normal.titulo}»: las mismas ideas, pero con situaciones más difíciles y sin pistas fáciles. Si fallas no pasa nada: la explicación te dice por qué.`,
        ejercicios: GEN.construir(id, receta, TABLAS[curso.id] || GEN.BJ),
      };
      ORO[idBase] = nivel;
      lecciones.push(nivel);
    }
    CURSOS_ORO.push({
      id: curso.id, nombre: curso.nombre, icono: curso.icono, color: curso.color, descripcion: curso.descripcion, reglas: curso.reglas,
      unidades: [{ id: 'oro-' + curso.id, titulo: 'Ruta dorada', descripcion: 'Niveles avanzados VIP', lecciones }],
    });
  }
})();
