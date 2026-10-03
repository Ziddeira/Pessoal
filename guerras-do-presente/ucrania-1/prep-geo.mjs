// Prepara src/geo.json a partir do Natural Earth (world-atlas) e do mapa de
// regiões da Ucrânia (@svg-maps/ukraine). Rode uma vez: `npm run geo`.
//
// - Mantém só os países da Eurásia, Norte da África e Oriente Médio.
// - Separa a Crimeia do polígono da Rússia (o Natural Earth 50m a desenha como
//   russa); no vídeo ela é uma região própria, ucraniana até 2014.
// - Converte as regiões da Ucrânia de coordenadas SVG para longitude/latitude,
//   ajustando o SVG ao contorno do país em projeção de Mercator.
// - Simplifica os contornos (Douglas-Peucker) para o render ficar leve.
import fs from 'node:fs';
import { feature } from 'topojson-client';
import ukraine from '@svg-maps/ukraine';

const topo = JSON.parse(fs.readFileSync(new URL('./node_modules/world-atlas/countries-50m.json', import.meta.url)));
const countries = feature(topo, topo.objects.countries).features;

const R = Math.PI / 180;
const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * R) / 2));

function pointInRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Anel fechado: divide no ponto mais distante do primeiro e simplifica as duas metades.
function simplify(points, tol) {
  if (points.length < 4) return points;
  let far = 1;
  let farD = 0;
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(points[i][0] - points[0][0], points[i][1] - points[0][1]);
    if (d > farD) {
      farD = d;
      far = i;
    }
  }
  return [...simplifyOpen(points.slice(0, far + 1), tol).slice(0, -1), ...simplifyOpen(points.slice(far), tol)];
}

function simplifyOpen(points, tol) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1e-9;
    let best = -1;
    let bestD = tol;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * (points[i][0] - ax) - dx * (points[i][1] - ay)) / len;
      if (d > bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best > 0) {
      keep[best] = 1;
      stack.push([a, best], [best, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

// Anel -> array plano [lon, lat, lon, lat, ...] com 2 casas decimais.
function pack(ring, tol = 0.025) {
  const s = simplify(ring, tol);
  if (s.length < 4) return null;
  const out = [];
  for (const [x, y] of s) out.push(Math.round(x * 100) / 100, Math.round(y * 100) / 100);
  return out;
}

const REGION = { lon: [-26, 180], lat: [12, 82] };
const paises = {};
let crimeia = null;

for (const f of countries) {
  const name = f.properties.name;
  const g = f.geometry;
  if (!g) continue;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  const rings = [];
  for (const poly of polys) {
    let outer = poly[0];
    // anel que cruza a linha de data (Chukotka): leva as longitudes negativas para além de 180
    if (outer.some((p) => p[0] > 170) && outer.some((p) => p[0] < -170)) outer = outer.map(([x, y]) => [x < 0 ? x + 360 : x, y]);
    const lons = outer.map((p) => p[0]);
    const lats = outer.map((p) => p[1]);
    const [x0, x1, y0, y1] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
    if (x1 < REGION.lon[0] || x0 > REGION.lon[1] || y1 < REGION.lat[0] || y0 > REGION.lat[1]) continue;
    if (name === 'Russia' && x1 < 0) continue; // pedaço de Chukotka além da linha de data
    if (name === 'Russia' && pointInRing([34.1, 45.0], outer)) {
      crimeia = [pack(outer, 0.01)];
      continue;
    }
    const tol = x1 - x0 < 1.5 && y1 - y0 < 1.5 ? 0.01 : 0.025;
    const p = pack(outer, tol);
    if (p) rings.push(p);
  }
  if (rings.length) paises[name] = rings;
}
if (!crimeia) throw new Error('Crimeia não encontrada no polígono da Rússia');

// ------------------------------------------------------- regiões da Ucrânia
function parsePath(d) {
  const rings = [];
  let cur = null;
  let x = 0;
  let y = 0;
  let cmd = 'M';
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g);
  for (let i = 0; i < tokens.length; ) {
    const tk = tokens[i];
    if (/[a-zA-Z]/.test(tk)) {
      cmd = tk;
      i++;
      if (cmd === 'z' || cmd === 'Z') {
        if (cur) rings.push(cur);
        cur = null;
      }
      continue;
    }
    const a = parseFloat(tokens[i]);
    const b = parseFloat(tokens[i + 1]);
    i += 2;
    if (cmd === 'M' || cmd === 'm') {
      if (cur) rings.push(cur);
      x = cmd === 'm' ? x + a : a;
      y = cmd === 'm' ? y + b : b;
      cur = [[x, y]];
      cmd = cmd === 'm' ? 'l' : 'L';
    } else if (cmd === 'l') {
      x += a;
      y += b;
      cur.push([x, y]);
    } else if (cmd === 'L') {
      x = a;
      y = b;
      cur.push([x, y]);
    }
  }
  if (cur) rings.push(cur);
  return rings;
}

const svgRegions = ukraine.locations.map((l) => ({ id: l.id, rings: parsePath(l.path) }));
const svgPts = svgRegions.flatMap((r) => r.rings.flat());
const sx = svgPts.map((p) => p[0]);
const sy = svgPts.map((p) => p[1]);
const svgBox = [Math.min(...sx), Math.max(...sx), Math.min(...sy), Math.max(...sy)];

// Contorno geográfico da Ucrânia + Crimeia, em Mercator.
const uaPts = [...paises.Ukraine, ...crimeia].flatMap((r) => {
  const o = [];
  for (let i = 0; i < r.length; i += 2) o.push([r[i] * R, mercY(r[i + 1])]);
  return o;
});
const gx = uaPts.map((p) => p[0]);
const gy = uaPts.map((p) => p[1]);
const geoBox = [Math.min(...gx), Math.max(...gx), Math.min(...gy), Math.max(...gy)];

const toLonLat = ([x, y]) => {
  const mx = geoBox[0] + ((x - svgBox[0]) / (svgBox[1] - svgBox[0])) * (geoBox[1] - geoBox[0]);
  const my = geoBox[3] - ((y - svgBox[2]) / (svgBox[3] - svgBox[2])) * (geoBox[3] - geoBox[2]);
  return [mx / R, (2 * Math.atan(Math.exp(my)) - Math.PI / 2) / R];
};

const regioes = {};
for (const r of svgRegions) {
  regioes[r.id] = r.rings.map((ring) => pack(ring.map(toLonLat), 0.012)).filter(Boolean);
}

// Conferência: o centro da região de Kiev (cidade) deve cair perto de 30,5E 50,45N.
const kc = regioes['kyiv-city'][0];
let cx = 0;
let cy = 0;
for (let i = 0; i < kc.length; i += 2) {
  cx += kc[i];
  cy += kc[i + 1];
}
console.log('Kiev (cidade) no ajuste:', (cx / (kc.length / 2)).toFixed(2), (cy / (kc.length / 2)).toFixed(2), '(esperado ~30.5, 50.45)');
console.log('proporção SVG', ((svgBox[1] - svgBox[0]) / (svgBox[3] - svgBox[2])).toFixed(3), 'Mercator', ((geoBox[1] - geoBox[0]) / (geoBox[3] - geoBox[2])).toFixed(3));

const out = { fonte: 'Natural Earth 1:50m (world-atlas, domínio público) e @svg-maps/ukraine (CC BY 4.0)', paises, crimeia, regioes };
fs.writeFileSync(new URL('./src/geo.json', import.meta.url), JSON.stringify(out));
console.log('países:', Object.keys(paises).length, '· tamanho:', (fs.statSync(new URL('./src/geo.json', import.meta.url)).size / 1024).toFixed(0), 'KB');
