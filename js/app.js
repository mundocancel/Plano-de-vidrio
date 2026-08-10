/**
 * Controlador de la aplicación.
 * Conecta UI ↔ plantillas ↔ motor de dibujo.
 */

const App = (() => {

  const $ = id => document.getElementById(id);
  const CAMPOS = ['cliente', 'pieza', 'cant', 'ancho', 'alto', 'esp', 'color', 'cantos', 'perf', 'mues', 'herr', 'obs'];

  // Inicializa el selector de plantillas
  function initPlantillas() {
    const sel = $('tpl');
    sel.innerHTML = Object.entries(PLANTILLAS)
      .map(([k, p]) => `<option value="${k}">${p.nombre}</option>`)
      .join('');
    sel.addEventListener('change', aplicarPlantilla);
    aplicarPlantilla();
  }

  // Aplica una plantilla: llena perforaciones, resaques y herrajes
  function aplicarPlantilla() {
    const tpl = PLANTILLAS[$('tpl').value];
    $('hintTpl').textContent = tpl.hint;

    const W = +$('ancho').value || 650;
    const H = +$('alto').value || 1900;

    if (tpl.gen) {
      const d = tpl.gen(W, H);
      $('perf').value = d.perf.map(p => p.join(',')).join('\n');
      $('mues').value = d.resaques.map(r =>
        `B,${r.lado},${r.ref},${r.dist},${r.alto},${r.prof},${r.R}`
      ).join('\n');
      $('herr').value = d.herrajes;
    } else {
      $('perf').value = '';
      $('mues').value = '';
      $('herr').value = '';
    }
    render();
  }

  // Lee y parsea los datos del formulario
  function leerDatos() {
    const perf = $('perf').value
      .split('\n').map(l => l.trim()).filter(Boolean)
      .map(l => l.split(/[,;\s]+/).map(Number))
      .filter(a => a.length >= 3 && a.every(n => !isNaN(n)));

    const resaques = $('mues').value
      .split('\n').map(l => l.trim()).filter(Boolean)
      .map(l => {
        const p = l.split(/[,;\s]+/);
        return {
          tipo: p[0], lado: p[1], ref: p[2],
          dist: +p[3], alto: +p[4], prof: +p[5], R: +p[6] || 6
        };
      })
      .filter(r => r.tipo === 'B' && r.lado && r.dist && r.alto && r.prof);

    return {
      W: +$('ancho').value || 1,
      H: +$('alto').value || 1,
      pieza: $('pieza').value,
      cant: $('cant').value,
      cliente: $('cliente').value,
      esp: $('esp').value,
      color: $('color').value,
      cantos: $('cantos').value,
      obs: $('obs').value,
      herr: $('herr').value,
      perf, resaques
    };
  }

  // Renderiza SVG y tablas
  function render() {
    const d = leerDatos();

    // SVG
    $('cajon').innerHTML = Dibujo.render(d);

    // Tablas de datos
    const fecha = new Date().toLocaleDateString('es');
    let html = `
      <table>
        <tr>
          <th>Cliente</th><td>${d.cliente || '—'}</td>
          <th>Pieza</th><td>${d.pieza}</td>
          <th>Cant.</th><td>${d.cant}</td>
        </tr>
        <tr>
          <th>Medida</th><td>${d.W} × ${d.H} mm</td>
          <th>Espesor</th><td>${d.esp}</td>
          <th>Color</th><td>${d.color}</td>
        </tr>
        <tr>
          <th>Cantos</th><td colspan="3">${d.cantos}</td>
          <th>Fecha</th><td>${fecha}</td>
        </tr>
        <tr>
          <th>Proceso</th>
          <td colspan="5">Templado · ${d.perf.length} perforación(es) · ${d.resaques.length} resaque(s)</td>
        </tr>
        ${d.obs ? `<tr><th>Obs.</th><td colspan="5">${d.obs}</td></tr>` : ''}
        ${d.herr ? `<tr><th>Herrajes</th><td colspan="5">${d.herr}</td></tr>` : ''}
      </table>`;

    if (d.perf.length) {
      html += `<table>
        <tr><th>#</th><th>X (mm)</th><th>Y (mm)</th><th>Ø (mm)</th></tr>
        ${d.perf.map((p, i) => `<tr><td>P${i + 1}</td><td>${p[0]}</td><td>${p[1]}</td><td>${p[2]}</td></tr>`).join('')}
      </table>`;
    }
    if (d.resaques.length) {
      html += `<table>
        <tr><th>#</th><th>Lado</th><th>Ref.</th><th>Dist.</th><th>Alto</th><th>Prof.</th><th>R</th></tr>
        ${d.resaques.map((r, i) => `<tr>
          <td>R${i + 1}</td><td>${r.lado}</td><td>${r.ref}</td>
          <td>${r.dist}</td><td>${r.alto}</td><td>${r.prof}</td><td>${r.R}</td>
        </tr>`).join('')}
      </table>`;
    }
    html += `<p class="hint">⚠️ Mecanizados a realizar ANTES del templado. Verificar medidas en obra.</p>`;
    $('tabla').innerHTML = html;
  }

  function imprimir() { window.print(); }

  function dxf() {
    const d = leerDatos();
    const contenido = Dibujo.exportDXF(d);
    const blob = new Blob([contenido], { type: 'application/dxf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vidrio_${d.pieza || 'plano'}.dxf`;
    a.click();
  }

  // Eventos globales
  function init() {
    CAMPOS.forEach(id => $(id).addEventListener('input', render));
    $('ancho').addEventListener('input', aplicarPlantilla);
    $('alto').addEventListener('input', aplicarPlantilla);
    initPlantillas();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { imprimir, dxf };
})();