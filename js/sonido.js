// Efectos de sonido: se generan con Web Audio (no hay archivos de audio, así que funcionan sin conexión).
// Uso: sonido('acierto'). Se pueden desactivar en Ajustes (progreso.ajustes.sonido).
(function () {
  let ctx = null;
  let maestro = null;

  // Una nota: oscilador con ataque rápido y caída suave
  function nota(c, destino, t0, freq, inicio, dur, opciones) {
    const o = Object.assign({ tipo: 'sine', vol: 0.22, hasta: null }, opciones);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.tipo;
    osc.frequency.setValueAtTime(freq, t0 + inicio);
    if (o.hasta) osc.frequency.exponentialRampToValueAtTime(o.hasta, t0 + inicio + dur);
    g.gain.setValueAtTime(0.0001, t0 + inicio);
    g.gain.exponentialRampToValueAtTime(o.vol, t0 + inicio + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + inicio + dur);
    osc.connect(g).connect(destino);
    osc.start(t0 + inicio);
    osc.stop(t0 + inicio + dur + 0.02);
  }

  // Un soplido corto de ruido filtrado: suena a carta que se reparte
  function ruido(c, destino, t0, inicio, dur, freq, vol) {
    const n = Math.max(1, Math.floor(c.sampleRate * dur));
    const buffer = c.createBuffer(1, n, c.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < n; i++) datos[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const fuente = c.createBufferSource();
    fuente.buffer = buffer;
    const filtro = c.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.frequency.value = freq;
    filtro.Q.value = 0.9;
    const g = c.createGain();
    g.gain.value = vol;
    fuente.connect(filtro).connect(g).connect(destino);
    fuente.start(t0 + inicio);
  }

  const SONIDOS = {
    toque: (c, d, t) => nota(c, d, t, 560, 0, 0.06, { tipo: 'triangle', vol: 0.1 }),
    acierto: (c, d, t) => {
      nota(c, d, t, 660, 0, 0.14, { tipo: 'triangle' });
      nota(c, d, t, 880, 0.09, 0.22, { tipo: 'triangle' });
    },
    error: (c, d, t) => {
      nota(c, d, t, 233, 0, 0.16, { tipo: 'sawtooth', vol: 0.1, hasta: 200 });
      nota(c, d, t, 175, 0.13, 0.26, { tipo: 'sawtooth', vol: 0.1, hasta: 140 });
    },
    unir: (c, d, t) => {
      nota(c, d, t, 740, 0, 0.1, { tipo: 'sine', vol: 0.2 });
      nota(c, d, t, 988, 0.06, 0.16, { tipo: 'sine', vol: 0.2 });
    },
    carta: (c, d, t) => {
      ruido(c, d, t, 0, 0.09, 2400, 0.5);
      nota(c, d, t, 180, 0, 0.05, { tipo: 'sine', vol: 0.08, hasta: 120 });
    },
    nivel: (c, d, t) => [523, 659, 784, 1047].forEach((f, i) => nota(c, d, t, f, i * 0.11, i === 3 ? 0.5 : 0.2, { tipo: 'triangle', vol: 0.2 })),
    meta: (c, d, t) => [784, 988, 1175, 1568].forEach((f, i) => nota(c, d, t, f, i * 0.08, 0.28, { tipo: 'sine', vol: 0.18 })),
    logro: (c, d, t) => {
      [1319, 1568, 1976].forEach((f, i) => nota(c, d, t, f, i * 0.07, 0.35, { tipo: 'sine', vol: 0.16 }));
      nota(c, d, t, 659, 0, 0.4, { tipo: 'triangle', vol: 0.1 });
    },
    rango: (c, d, t) => {
      [392, 523, 659, 784].forEach((f, i) => nota(c, d, t, f, i * 0.12, 0.22, { tipo: 'square', vol: 0.07 }));
      [784, 1047].forEach((f, i) => nota(c, d, t, f, 0.5 + i * 0.12, 0.5, { tipo: 'triangle', vol: 0.2 }));
    },
  };

  function contexto() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
        maestro = ctx.createGain();
        maestro.gain.value = 0.6;
        maestro.connect(ctx.destination);
      } catch (e) {
        ctx = null;
        return null;
      }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  const activo = () => !(typeof progreso === 'object' && progreso && progreso.ajustes && progreso.ajustes.sonido === false);

  function sonido(nombre, retraso) {
    if (!SONIDOS[nombre] || !activo()) return;
    sonido.registro.push(nombre); // lo leen las pruebas automáticas
    if (sonido.registro.length > 200) sonido.registro.shift();
    const reproducir = () => {
      const c = contexto();
      if (!c) return;
      try {
        SONIDOS[nombre](c, maestro, c.currentTime + 0.01);
      } catch (e) {
        // un fallo de audio nunca debe romper la app
      }
    };
    if (retraso) setTimeout(reproducir, retraso);
    else reproducir();
  }
  sonido.registro = [];
  sonido.generar = (nombre, c, destino) => SONIDOS[nombre](c, destino, 0); // para pruebas con OfflineAudioContext
  sonido.nombres = Object.keys(SONIDOS);
  window.sonido = sonido;
})();
