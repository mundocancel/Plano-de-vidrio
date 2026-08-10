/**
 * Motor de dibujo técnico para planos de vidrio templado.
 * Genera SVG acotado y exporta DXF para templadoras/CNC.
 * Usa CLASES CSS para colores (compatible con tema blueprint).
 */

const Dibujo = (() => {

  const r1 = x => Math.round(x * 10) / 10;

  // === Elementos SVG (usan clases para que el CSS pinte los colores) ===
  const elem = {
    linea: (x1, y1, x2, y2, clase = 'contorno') =>
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${clase}" />`,

    circulo: (cx, cy, r, clase = 'mecanizado') =>
      `<circle cx="${cx}" cy="${cy}" r="${r}" class="${clase}" />`,

    texto: (x, y, txt, ancla = 'start', clase = 'cota') =>
      `<text x="${x}" y="${y}" class="${clase}" text-anchor="${ancla}">${txt}</text>`,

    arco: (cx, cy, r, a1, a2, clase = 'contorno') => {
      const rad1 = a1 * Math.PI / 180, rad2 = a2 * Math.PI / 180;
      const x1 = cx + r * Math.cos(rad1), y1 = cy - r * Math.sin(rad1);
      const x2 = cx + r * Math.cos(rad2), y2 = cy - r * Math.sin(rad2);
      const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
      const sweep = a2 > a1 ? 0 : 1;
      return `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${large} ${sweep} ${x2} ${y2}" class="${clase}" />`;
    }
  };

  // === Construye polígono del vidrio con resaques (incluye arcos en esquinas) ===
  function poligono(W, H, resaques) {
    const pts = [];
    const get = c => resaques.find(r => r.tipo === 'B' && r.lado === c);
    const bi = get('I'), bd = get('D'), si = get('SI'), sd = get('SD');

    // Vértices inferiores (de izq a der)
    if (bi) pts.push({ x: bi.dist, y: bi.alto, tipo: 'bi' });
    else pts.push({ x: 0, y: 0, tipo: 'esquina', esquina: 'BI' });

    if (bd) pts.push({ x: W - bd.dist, y: bd.alto, tipo: 'bd' });
    else pts.push({ x: W, y: 0, tipo: 'esquina', esquina: 'BD' });

    // Vértices superiores (de der a izq)
    if (sd) pts.push({ x: W - sd.dist, y: H - sd.alto, tipo: 'sd' });
    else pts.push({ x: W, y: H, tipo: 'esquina', esquina: 'SD' });

    if (si) pts.push({ x: si.dist, y: H - si.alto, tipo: 'si' });
    else pts.push({ x: 0, y: H, tipo: 'esquina', esquina: 'SI' });

    return pts;
  }

  /**
   * Genera el path SVG del contorno con arcos en las esquinas donde hay resaques.
   */
  function pathContorno(W, H, resaques, s, ox, oy) {
    // Función helper: convierte coordenadas reales a SVG (origen en esquina inferior izquierda)
    const px = x => ox + x * s;
    const py = y => oy + (H - y) * s;

    const pts = poligono(W, H, resaques);
    let path = '';

    for (let i = 0; i < pts.length; i++) {
      const cur = pts[i];
      const next = pts[(i + 1) % pts.length];
      const prev = pts[(i - 1 + pts.length) % pts.length];

      if (cur.tipo === 'esquina') {
        // Esquina recta normal
        if (i === 0) path += `M ${px(cur.x)} ${py(cur.y)} `;
        else path += `L ${px(cur.x)} ${py(cur.y)} `;
      } else {
        // Esquina con resaque: dos segmentos + arco de radio R
        const R = (cur.R || 6) * s;

        // Determina las direcciones de entrada y salida
        // Vector desde prev a cur
        const dx1 = cur.x - prev.x, dy1 = cur.y - prev.y;
        const len1 = Math.hypot(dx1, dy1);
        const nx1 = dx1 / len1, ny1 = dy1 / len1;

        // Vector desde cur a next
        const dx2 = next.x - cur.x, dy2 = next.y - cur.y;
        const len2 = Math.hypot(dx2, dy2);
        const nx2 = dx2 / len2, ny2 = dy2 / len2;

        // Puntos antes y después del arco
        const p1x = cur.x - nx1 * cur.R;
        const p1y = cur.y - ny1 * cur.R;
        const p2x = cur.x + nx2 * cur.R;
        const p2y = cur.y + ny2 * cur.R;

        // Determinar sweep (sentido del arco)
        const cross = dx1 * dy2 - dy1 * dx2;
        const sweep = cross < 0 ? 0 : 1;
        const r = cur.R || 6;

        if (i === 0) path += `M ${px(p1x)} ${py(p1y)} `;
        else path += `L ${px(p1x)} ${py(p1y)} `;

        path += `A ${r * s} ${r * s} 0 0 ${sweep} ${px(p2x)} ${py(p2y)} `;
      }
    }
    path += 'Z';
    return path;
  }

  // === Render principal: genera SVG completo ===
  function render(d) {
    const { W, H, perf, resaques } = d;
    const MW = 820, MH = 520;
    const ox = 95, oy = 60;
    const s = Math.min((MW - ox - 50) / W, (MH - oy - 60) / H);
    const w = W * s, h = H * s;
    const px = x => ox + x * s;
    const py = y => oy + (H - y) * s;

    let svg = `<svg viewBox="0 0 ${MW} ${MH}" xmlns="http://www.w3.org/2000/svg">`;

    // Contorno del vidrio (con resaques y arcos)
    const path = pathContorno(W, H, resaques, s, ox, oy);
    svg += `<path d="${path}" class="vidrio" />`;

    // Cota horizontal (ancho)
    svg += elem.linea(ox, oy - 20, ox + w, oy - 20, 'cota-linea');
    svg += elem.linea(ox - 4, oy - 16, ox + 4, oy - 24, 'cota-linea');
    svg += elem.linea(ox + w - 4, oy - 16, ox + w + 4, oy - 24, 'cota-linea');
    svg += elem.texto(ox + w / 2, oy - 28, W + ' mm', 'middle', 'cota');

    // Cota vertical (alto)
    svg += elem.linea(ox - 20, oy, ox - 20, oy + h, 'cota-linea');
    svg += elem.linea(ox - 16, oy - 4, ox - 24, oy + 4, 'cota-linea');
    svg += elem.linea(ox - 16, oy + h - 4, ox - 24, oy + h + 4, 'cota-linea');
    svg += `<text x="${ox - 28}" y="${oy + h / 2}" class="cota" text-anchor="middle" transform="rotate(-90 ${ox - 28} ${oy + h / 2})">${H} mm</text>`;

    // Perforaciones
    perf.forEach((p, i) => {
      const [x, y, di] = p;
      const cx = px(x), cy = py(y), radio = Math.max(2.5, (di * s) / 2);
      svg += elem.circulo(cx, cy, radio, 'mecanizado');
      svg += elem.linea(cx - radio - 5, cy, cx + radio + 5, cy, 'mecanizado');
      svg += elem.linea(cx, cy - radio - 5, cx, cy + radio + 5, 'mecanizado');
      svg += elem.texto(cx + radio + 6, cy + 4, `Ø${di}  (X=${x}, Y=${y})`, 'start', 'etiqueta-mec');
    });

    // Etiquetas de resaques
    resaques.forEach((r, i) => {
      let x, y;
      if (r.lado === 'I') { x = ox + 8; y = oy + h - 8; }
      else if (r.lado === 'D') { x = ox + w - 8; y = oy + h - 8; }
      else if (r.lado === 'SI') { x = ox + 8; y = oy + 14; }
      else { x = ox + w - 8; y = oy + 14; }
      const ancla = (r.lado === 'D' || r.lado === 'SD') ? 'end' : 'start';
      svg += elem.texto(x, y, `RESAQUE ${r.alto}×${r.prof} R${r.R || 6}`, ancla, 'etiqueta-mec');
    });

    // Cuadro técnico (esquina inferior derecha)
    svg += `<rect x="${MW - 230}" y="${MH - 90}" width="220" height="80" class="cuadro-tecnico" />`;
    svg += elem.texto(MW - 220, MH - 72, 'PLANO DE VIDRIO TEMPLADO', 'start', 'cuadro-titulo');
    svg += elem.texto(MW - 220, MH - 56, `Pieza: ${d.pieza || '—'}`, 'start', 'cuadro-texto');
    svg += elem.texto(MW - 220, MH - 42, `Medida: ${W} × ${H} mm`, 'start', 'cuadro-texto');
    svg += elem.texto(MW - 220, MH - 28, `Esp: ${d.esp || '—'} | ${d.color || '—'}`, 'start', 'cuadro-texto');
    svg += elem.texto(MW - 220, MH - 14, `Cantos: ${d.cantos || '—'}`, 'start', 'cuadro-texto');

    svg += '</svg>';
    return svg;
  }

  // === Export DXF (para templadora/CNC) ===
  function exportDXF(d) {
    const { W, H, perf, resaques } = d;
    const L = [];
    const poly = poligono(W, H, resaques);

    // Contorno como polilínea
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = [poly[i].x, poly[i].y];
      const [x2, y2] = [poly[(i + 1) % poly.length].x, poly[(i + 1) % poly.length].y];
      L.push('0', 'LINE', '8', 'VIDRIO',
        '10', x1, '20', y1, '30', 0,
        '11', x2, '21', y2, '31', 0);
    }

    // Perforaciones
    perf.forEach(([x, y, di]) => {
      L.push('0', 'CIRCLE', '8', 'PERFORACION',
        '10', x, '20', y, '30', 0,
        '40', di / 2);
    });

    return '0\nSECTION\n2\nENTITIES\n' + L.join('\n') + '\n0\nENDSEC\n0\nEOF';
  }

  return { render, exportDXF };
})();