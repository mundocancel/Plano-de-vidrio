# Plano-de-vidrio
propuesta para planear pedidos de vidrio 
 primer propuesta ejemplo en html como ejemplo 
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Plano de Vidrio Templado</title>
<style>
*{box-sizing:border-box}body{font-family:Segoe UI,Arial;margin:0;background:#eef1f5}
.wrap{display:flex;gap:14px;padding:14px;align-items:flex-start}
.panel{width:330px;background:#fff;border-radius:10px;padding:14px;box-shadow:0 1px 5px rgba(0,0,0,.12)}
.panel h1{font-size:16px;margin:0 0 8px}
label{display:block;font-size:11.5px;margin:7px 0 2px;color:#333}
input,select,textarea{width:100%;padding:6px;border:1px solid #b9c2cc;border-radius:6px;font-size:13px}
textarea{font-family:Consolas,monospace;font-size:12px}
.row{display:flex;gap:8px}.row>div{flex:1}
button{margin-top:10px;padding:9px 12px;border:0;border-radius:7px;background:#0b66c3;color:#fff;font-size:13px;cursor:pointer}
button.gray{background:#5b6673}
#hoja{flex:1;background:#fff;border-radius:10px;padding:12px;box-shadow:0 1px 5px rgba(0,0,0,.12)}
#cajon svg{width:100%;height:auto}
table{border-collapse:collapse;width:100%;font-size:12px;margin-top:8px}
td,th{border:1px solid #999;padding:4px 6px;text-align:left}th{background:#f0f3f7}
@media print{.panel{display:none}.wrap{padding:0}#hoja{box-shadow:none;border-radius:0}}
</style>
</head>
<body>
<div class="wrap">
<div class="panel">
<h1>📐 Plano de vidrio templado</h1>
<label>Cliente / Obra</label><input id="cliente">
<div class="row"><div><label>Pieza</label><input id="pieza" value="V-01"></div>
<div><label>Cantidad</label><input id="cant" type="number" value="1"></div></div>
<div class="row"><div><label>Ancho (mm)</label><input id="ancho" type="number" value="900"></div>
<div><label>Alto (mm)</label><input id="alto" type="number" value="2100"></div></div>
<div class="row"><div><label>Espesor</label><select id="esp"><option>6 mm</option><option>8 mm</option><option selected>10 mm</option><option>12 mm</option><option>15 mm</option></select></div>
<div><label>Color</label><select id="color"><option>Claro</option><option>Gris</option><option>Bronce</option><option>Extra claro</option></select></div></div>
<label>Cantos</label><select id="cantos"><option selected>Pulido (resaque de cantos)</option><option>Pulido fino</option><option>Biselado</option><option>Corte crudo</option></select>
<label>Perforaciones — por línea: X,Y,Ø (mm desde borde izq. e inferior)</label>
<textarea id="perf" rows="3">100,100,12
800,100,12</textarea>
<label>Resaques — por línea: ESQUINA,ancho,alto (BI,BD,SI,SD)</label>
<textarea id="mues" rows="2">BI,80,80</textarea>
<label>Observaciones</label>
<textarea id="obs" rows="2">Vidrio templado. Perforaciones y resaques ANTES de templar. Cantos pulidos.</textarea>
<button onclick="window.print()">🖨 Imprimir / PDF</button>
<button class="gray" onclick="dxf()">⬇ Exportar DXF</button>
</div>
<div id="hoja"><div id="cajon"></div><div id="tabla"></div></div>
</div>
<script>
const $=id=>document.getElementById(id);
const line=(a,b,c,d,col='#111')=>`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${col}" stroke-width="1"/>`;
const tick=(x,y)=>line(x-4,y+4,x+4,y-4,'#111');
const txt=(x,y,t,an='start',col='#111',rot=0)=>`<text x="${x}" y="${y}" font-size="12" fill="${col}" text-anchor="${an}" ${rot?`transform="rotate(${rot} ${x} ${y})"`:''}>${t}</text>`;
function datos(){
 const perf=$('perf').value.split('\n').map(l=>l.trim()).filter(Boolean)
   .map(l=>l.split(/[,;\s]+/).map(Number)).filter(a=>a.length>=3&&a.every(n=>!isNaN(n)));
 const mues=$('mues').value.split('\n').map(l=>l.trim()).filter(Boolean)
   .map(l=>{const p=l.split(/[,;\s]+/);return{c:(p[0]||'').toUpperCase(),a:+p[1],b:+p[2]}})
   .filter(m=>['BI','BD','SI','SD'].includes(m.c)&&!isNaN(m.a)&&!isNaN(m.b));
 return{W:+$('ancho').value||1,H:+$('alto').value||1,perf,mues};
}
function poligono(d){
 const{W,H,mues}=d,g=c=>mues.find(m=>m.c===c);
 const bi=g('BI'),bd=g('BD'),si=g('SI'),sd=g('SD'),p=[];
 p.push(bi?[bi.a,0]:[0,0]); p.push(bd?[W-bd.a,0]:[W,0]);
 if(bd)p.push([W-bd.a,bd.b],[W,bd.b]);
 p.push(sd?[W,H-sd.b]:[W,H]);
 if(sd)p.push([W-sd.a,H-sd.b],[W-sd.a,H]);
 p.push(si?[si.a,H]:[0,H]);
 if(si)p.push([si.a,H-si.b],[0,H-si.b]);
 p.push(bi?[0,bi.b]:[0,0]);
 if(bi)p.push([bi.a,bi.b]);
 return p.filter((pt,i)=>i==0||pt[0]!==p[i-1][0]||pt[1]!==p[i-1][1]);
}
function render(){
 const d=datos(),MW=780,MH=470,ox=95,oy=75;
 const s=Math.min((MW-ox-50)/d.W,(MH-oy-60)/d.H),w=d.W*s,h=d.H*s;
 const P=poligono(d).map(([x,y])=>[ox+x*s,oy+(d.H-y)*s]);
 let svg=`<svg viewBox="0 0 ${MW} ${MH}" xmlns="http://www.w3.org/2000/svg">`;
 svg+=`<polygon points="${P.map(p=>p.join(',')).join(' ')}" fill="#e3f1fb" stroke="#111" stroke-width="2"/>`;
 svg+=line(ox,oy-18,ox+w,oy-18)+tick(ox,oy-18)+tick(ox+w,oy-18)+txt(ox+w/2,oy-24,d.W+' mm','middle');
 svg+=line(ox-18,oy,ox-18,oy+h)+tick(ox-18,oy)+tick(ox-18,oy+h)+txt(ox-26,oy+h/2,d.H+' mm','middle','#111',-90);
 d.perf.forEach(([x,y,di])=>{const cx=ox+x*s,cy=oy+(d.H-y)*s,r=Math.max(2,di*s/2);
  svg+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="#c00" stroke-width="1.5"/>`
   +line(cx-r-5,cy,cx+r+5,cy,'#c00')+line(cx,cy-r-5,cx,cy+r+5,'#c00')
   +txt(cx+r+6,cy+4,`Ø${di}  (${x}, ${y})`,'start','#c00');});
 d.mues.forEach(m=>{const pos={BI:[ox+4,oy+h-8],BD:[ox+w-4,oy+h-8],SI:[ox+4,oy+16],SD:[ox+w-4,oy+16]}[m.c];
  const an=m.c[0]==='B'?'start':'start';
  svg+=txt(pos[0],pos[1],`RESAQUE ${m.a}×${m.b}`,'start','#c00');});
 svg+='</svg>';
 $('cajon').innerHTML=svg;
 const f=new Date().toLocaleDateString('es');
 $('tabla').innerHTML=`
 <table><tr><th>Cliente/Obra</th><td>${$('cliente').value||'—'}</td><th>Pieza</th><td>${$('pieza').value}</td><th>Cant.</th><td>${$('cant').value}</td></tr>
 <tr><th>Medida</th><td>${d.W} × ${d.H} mm</td><th>Espesor</th><td>${$('esp').value} ${$('color').value}</td><th>Cantos</th><td>${$('cantos').value}</td></tr>
 <tr><th>Proceso</th><td colspan="3">Templado ${d.perf.length?`· ${d.perf.length} perforación(es)`:''} ${d.mues.length?`· ${d.mues.length} resaque(s)`:''}</td><th>Fecha</th><td>${f}</td></tr>
 <tr><th>Obs.</th><td colspan="5">${$('obs').value}</td></tr></table>
 ${d.perf.length?`<table><tr><th>#</th><th>X (mm)</th><th>Y (mm)</th><th>Ø (mm)</th></tr>${d.perf.map((p,i)=>`<tr><td>P${i+1}</td><td>${p[0]}</td><td>${p[1]}</td><td>${p[2]}</td></tr>`).join('')}</table>`:''}
 ${d.mues.length?`<table><tr><th>Resaque</th><th>Esquina</th><th>Ancho (mm)</th><th>Alto (mm)</th></tr>${d.mues.map((m,i)=>`<tr><td>R${i+1}</td><td>${m.c}</td><td>${m.a}</td><td>${m.b}</td></tr>`).join('')}</table>`:''}
 <p style="font-size:11px">Medidas en mm. Verificar en obra antes de templar. Vidrio templado no admite cortes ni resaques posteriores.</p>`;
}
function dxf(){
 const d=datos(),P=poligono(d),L=[];
 for(let i=0;i<P.length;i++){const[x1,y1]=P[i],[x2,y2]=P[(i+1)%P.length];
  L.push('0','LINE','8','VIDRIO','10',x1,'20',y1,'30','0','11',x2,'21',y2,'31','0');}
 d.perf.forEach(([x,y,di])=>L.push('0','CIRCLE','8','VIDRIO','10',x,'20',y,'30','0','40',di/2));
 const t='0\nSECTION\n2\nENTITIES\n'+L.join('\n')+'\n0\nENDSEC\n0\nEOF';
 const a=document.createElement('a');
 a.href=URL.createObjectURL(new Blob([t],{type:'application/dxf'}));
 a.download='vidrio_'+$('pieza').value+'.dxf';a.click();
}
document.querySelectorAll('input,select,textarea').forEach(e=>e.addEventListener('input',render));
render();
</script>
</body>
</html>
