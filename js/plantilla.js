/**
 * PLANTILLAS DE VIDRIO TEMPLADO
 * Estándares reales de herrajería.
 * Coordenadas: origen en esquina inferior izquierda (X=izq, Y=abajo).
 *
 * Resaques de bisagra: B,lado(I/D),ref(T/B),dist,alto,prof,R
 *   - lado: I=izquierda (bisagras), D=derecha
 *   - ref: T=desde arriba, B=desde abajo
 *   - dist: distancia desde el extremo al borde del resaque
 *   - alto, prof: dimensiones del resaque (mm)
 *   - R: radio de redondeo interno
 */

const PLANTILLAS = {
  libre: {
    nombre: '✏️ Libre / personalizado',
    hint: 'Ingresa manualmente perforaciones y resaques.',
    perf: [],
    resaques: [],
    herrajes: ''
  },

  pbis: {
    nombre: '🚪 Puerta de baño (bisagras + manillón)',
    hint: 'Bisagras tipo DAWH a 228.6 mm (9") de extremos. Manillón Ø12.',
    // Genera perforaciones y resaques en función del alto H
    gen: (W, H) => ({
      perf: [
        [W - 76.2, 812.8, 12]       // Manillón: Ø12, 76.2mm del borde der, 812.8mm de abajo
      ],
      resaques: [
        { tipo: 'B', lado: 'I', ref: 'T', dist: 228.6, alto: 60, prof: 30, R: 8 },
        { tipo: 'B', lado: 'I', ref: 'B', dist: 228.6, alto: 60, prof: 30, R: 8 }
      ],
      herrajes: 'Bisagra vidrio-muro x2 · Manillón 180° · Tope inferior · Botahule'
    })
  },

  pcorr: {
    nombre: '↔️ Puerta corrediza de baño (riel)',
    hint: 'Carretillas ø16 arriba (4x) y ø10 abajo (2x). Riel 30×10.',
    gen: (W, H) => {
      const perf = [];
      // Carretillas superiores: 4 perforaciones Ø16
      perf.push([100, H - 80, 16]);
      perf.push([300, H - 80, 16]);
      perf.push([W - 300, H - 80, 16]);
      perf.push([W - 100, H - 80, 16]);
      // Carretillas inferiores: 2 perforaciones Ø10
      perf.push([W / 3, 40, 10]);
      perf.push([2 * W / 3, 40, 10]);
      // Manillón
      perf.push([W - 76.2, 812.8, 12]);
      return {
        perf,
        resaques: [],
        herrajes: 'Kit corrediza (riel 30×10) · 4 carretillas Ø16 · 2 carretillas Ø10 · Manillón · Topes'
      };
    }
  },

  fijo: {
    nombre: '🧱 Fijo de cancel (conectores)',
    hint: 'Conectores Ø14 cada 300 mm en bordes (típico).',
    gen: (W, H) => {
      const perf = [];
      const paso = 300;
      // Izquierdo
      for (let y = 150; y < H - 150; y += paso) perf.push([40, y, 14]);
      // Derecho
      for (let y = 150; y < H - 150; y += paso) perf.push([W - 40, y, 14]);
      // Inferior
      for (let x = 150; x < W - 150; x += paso) perf.push([x, 40, 14]);
      return {
        perf,
        resaques: [],
        herrajes: 'Conectores vidrio-muro Ø14 · Empaques U perimetral · Sellador neutro'
      };
    }
  },

  barandal: {
    nombre: '🛡️ Fijo barandal (sin mecanizados)',
    hint: 'Vidrio sin perforaciones. Sujetado con perfiles U o pasadores.',
    gen: () => ({
      perf: [],
      resaques: [],
      herrajes: 'Perfil U de aluminio c/empaque · Pasadores inox (si aplica)'
    })
  }
};