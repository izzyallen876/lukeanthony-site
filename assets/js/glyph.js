/* glyph.js: the shared text-drawing engine for v2.lukeanthony.co.
   The GlyphScreen engine and palettes are taken unchanged from
   ghost-in-the-grid-v2.html. The crystal below is new. */
(function(){
"use strict";
var GG = window.GG = {};
var RM = GG.RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
var $ = GG.$ = function(s){ return document.querySelector(s); };
var root = document.documentElement;
var TAU = GG.TAU = Math.PI*2;
function clamp(v,a,b){return v<a?a:(v>b?b:v)}
function lerp(a,b,t){return a+(b-a)*t}
function rad(d){return d*Math.PI/180}
function hash(x,y,z){
  var h = Math.imul(x|0,374761393) + Math.imul(y|0,668265263) + Math.imul(z|0,1274126177);
  h = Math.imul(h ^ (h>>>13), 1274126177); h ^= h>>>16;
  return (h>>>0)/4294967296;
}
GG.clamp = clamp; GG.lerp = lerp; GG.rad = rad; GG.hash = hash;

/* ---------- theme (the toggle itself lives in site.js) ---------- */
GG.theme = {dark:true, grid:'#2fe05f'};
function readTheme(){
  var th = root.getAttribute('data-theme');
  GG.theme.dark = th ? th === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  GG.theme.grid = getComputedStyle(root).getPropertyValue('--grid').trim() || GG.theme.grid;
}
GG.readTheme = readTheme;
readTheme();
document.addEventListener('themechange', readTheme);

/* ---------- title scramble ---------- */
GG.scramble = function(el, final, dur){
  var chars = '▓▒░#@%&*+=<>/\\|', start = performance.now();
  (function f(n){
    var p = Math.min(1,(n-start)/dur), s = '', i, ch;
    for(i=0;i<final.length;i++){
      ch = final.charAt(i);
      s += (ch===' '||ch==='\n') ? ch : (i/final.length < p ? ch : chars.charAt(Math.random()*chars.length|0));
    }
    el.textContent = s;
    if(p<1) requestAnimationFrame(f);
  })(start);
};

/* ---------- glyph engine ----------
   Scenes write one glyph + colour per character cell. The engine draws them
   as coloured text with a soft bloom of the same image underneath. */
var RAMP = ' .:-=+*cxoaX#%&@|/\\';
var FONT = '"SF Mono", ui-monospace, Menlo, Consolas, "DejaVu Sans Mono", "Liberation Mono", monospace';

function GlyphScreen(canvas, o){
  var ctx = canvas.getContext('2d');
  var tint = document.createElement('canvas'), tx = tint.getContext('2d');
  var wide = document.createElement('canvas'), wx = wide.getContext('2d');
  var cache = {};
  var S = {ready:false, canvas:canvas, cols:0, rows:0, cw:0, ch:0, fs:0, dpr:1, n:0, I:null, R:null, G:null, B:null, timg:null};
  S.resize = function(){
    var host = canvas.parentElement, W = host ? host.clientWidth : 0;
    if(!W) return false;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var cols = clamp(Math.round(W/o.cellPx), o.minCols, o.maxCols);
    var cw = W/cols;
    ctx.font = '700 100px ' + FONT;
    var adv = ctx.measureText('M').width/100;
    if(!(adv>0.3 && adv<1)) adv = 0.6;
    var fs = cw/adv, ch = fs;
    var rows = Math.max(8, Math.round(W*o.aspect/ch));
    S.cols = cols; S.rows = rows; S.cw = cw; S.ch = ch; S.fs = fs; S.dpr = dpr; S.n = cols*rows;
    canvas.style.width = W+'px'; canvas.style.height = (rows*ch)+'px';
    canvas.width = Math.round(W*dpr); canvas.height = Math.round(rows*ch*dpr);
    tint.width = cols; tint.height = rows;
    wide.width = Math.max(2, Math.ceil(cols/3)); wide.height = Math.max(2, Math.ceil(rows/3));
    S.I = new Uint8Array(S.n); S.R = new Uint8Array(S.n); S.G = new Uint8Array(S.n); S.B = new Uint8Array(S.n);
    S.timg = tx.createImageData(cols, rows);
    S.ready = true;
    return true;
  };
  S.draw = function(bg, bloom, wbloom){
    var cols = S.cols, rows = S.rows, cw = S.cw, ch = S.ch, n = S.n, I = S.I, R = S.R, G = S.G, B = S.B;
    var PW = cols*cw, PH = rows*ch, i, j, x, y, py, c, key, st, last = '';
    ctx.setTransform(S.dpr,0,0,S.dpr,0,0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    if(bg){ ctx.fillStyle = bg; ctx.fillRect(0,0,PW,PH); } else { ctx.clearRect(0,0,PW,PH); }
    if(bloom > 0 || wbloom > 0){
      var d = S.timg.data;
      for(i=0;i<n;i++){
        j = i*4;
        if(I[i]){ d[j] = R[i]; d[j+1] = G[i]; d[j+2] = B[i]; d[j+3] = 255; }
        else { d[j] = 0; d[j+1] = 0; d[j+2] = 0; d[j+3] = 0; }
      }
      tx.putImageData(S.timg, 0, 0);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true;
      if(bloom > 0){ ctx.globalAlpha = bloom; ctx.drawImage(tint, 0, 0, PW, PH); }
      if(wbloom > 0){
        wx.clearRect(0,0,wide.width,wide.height); wx.drawImage(tint, 0, 0, wide.width, wide.height);
        ctx.globalAlpha = wbloom; ctx.drawImage(wide, 0, 0, PW, PH);
      }
      ctx.restore();
    }
    ctx.font = '700 ' + S.fs.toFixed(2) + 'px ' + FONT;
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    i = 0;
    for(y=0;y<rows;y++){
      py = y*ch;
      for(x=0;x<cols;x++,i++){
        c = I[i]; if(!c) continue;
        key = ((R[i]>>3)<<10) | ((G[i]>>3)<<5) | (B[i]>>3);
        st = cache[key];
        if(st === undefined){ st = cache[key] = 'rgb(' + (R[i]&248) + ',' + (G[i]&248) + ',' + (B[i]&248) + ')'; }
        if(st !== last){ ctx.fillStyle = st; last = st; }
        ctx.fillText(RAMP.charAt(c), x*cw, py);
      }
    }
  };
  return S;
}

function ramp3(st, v, o){
  v = clamp(v,0,1);
  var i = 1;
  while(i < st.length-1 && v > st[i][0]) i++;
  var a = st[i-1], b = st[i], t = (v-a[0])/((b[0]-a[0])||1);
  o[0] = a[1]+(b[1]-a[1])*t; o[1] = a[2]+(b[2]-a[2])*t; o[2] = a[3]+(b[3]-a[3])*t;
}
var INKP  = [[0,2,2,40],[.3,6,8,150],[.65,22,24,236],[.9,80,96,255],[1,170,190,255]];
var GLOWP = [[0,8,12,52],[.3,10,34,180],[.6,40,104,255],[.85,126,196,255],[1,232,246,255]];

function dprCanvas(c){
  var d = Math.min(2, window.devicePixelRatio||1);
  var w = c.clientWidth, h = c.clientHeight;
  if(c.width !== Math.round(w*d) || c.height !== Math.round(h*d)){ c.width = Math.round(w*d); c.height = Math.round(h*d); }
  var g = c.getContext('2d'); g.setTransform(d,0,0,d,0,0);
  return {g:g,w:w,h:h};
}

GG.GlyphScreen = GlyphScreen; GG.ramp3 = ramp3; GG.INKP = INKP; GG.GLOWP = GLOWP; GG.dprCanvas = dprCanvas; GG.RAMP = RAMP;

/* ---------- retro grid ---------- */
GG.drawGrid = function(canvas, t){
  var o = dprCanvas(canvas), g = o.g, w = o.w, h = o.h, i, k;
  g.clearRect(0,0,w,h);
  var hy = h*0.6;
  g.strokeStyle = GG.theme.grid; g.lineWidth = 1; g.globalAlpha = .5;
  var off = (t*0.25)%1;
  for(i=0;i<16;i++){
    var p = (i+off)/16, y = hy + (h-hy)*p*p*p;
    g.beginPath(); g.moveTo(0,y); g.lineTo(w,y); g.stroke();
  }
  for(k=-24;k<=24;k++){
    g.beginPath(); g.moveTo(w/2 + k*w*0.012, hy); g.lineTo(w/2 + k*w*0.14, h); g.stroke();
  }
  g.globalAlpha = .9;
  g.beginPath(); g.moveTo(0,hy); g.lineTo(w,hy); g.stroke();
  g.globalAlpha = 1;
};

/* ---------- the crystal ----------
   A quartz point: a six-sided prism with one pointed end, plus a smaller
   point growing out beside it. It is built from triangles, lit from the
   upper left, then rasterised into text cells. Front and back faces are
   both kept, which is what makes it read as glass. */
function norm3(v){ var l = Math.hypot(v[0],v[1],v[2]) || 1; return [v[0]/l,v[1]/l,v[2]/l]; }
function cross3(a,b){ return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
var LIGHT = norm3([-0.5,-0.7,0.8]), HALFV = norm3([LIGHT[0],LIGHT[1],LIGHT[2]+1]);
var CRY_D = [[0,4,34,20],[.4,18,128,74],[.7,90,226,150],[.9,196,255,218],[1,240,255,248]];
var CRY_L = [[0,2,40,24],[.5,10,112,62],[1,64,156,112]];

/* one point: [a, b, c, e1, e2, e3], where eN says whether the edge facing
   vertex N is a real crystal edge (quad diagonals are not) */
function quartz(out, base, axis, r, lp, lt, n, seed){
  var u = norm3(axis), ref = Math.abs(u[1]) < .9 ? [0,1,0] : [1,0,0];
  var v = norm3(cross3(u, ref)), w = cross3(u, v);
  var rb = [], rt = [], k, th, rr, ox, oy, oz;
  for(k=0;k<n;k++){
    th = seed + k*TAU/n;
    rr = r*(.88 + .24*hash(k, (seed*97)|0, 3));
    ox = (Math.cos(th)*v[0] + Math.sin(th)*w[0])*rr;
    oy = (Math.cos(th)*v[1] + Math.sin(th)*w[1])*rr;
    oz = (Math.cos(th)*v[2] + Math.sin(th)*w[2])*rr;
    rb.push([base[0]+ox, base[1]+oy, base[2]+oz]);
    rt.push([base[0]+ox+u[0]*lp, base[1]+oy+u[1]*lp, base[2]+oz+u[2]*lp]);
  }
  var L = lp + lt, j = r*.12;
  var apex = [base[0]+u[0]*L+v[0]*j, base[1]+u[1]*L+v[1]*j, base[2]+u[2]*L+v[2]*j];
  for(k=0;k<n;k++){
    var k2 = (k+1)%n;
    out.push([rb[k], rb[k2], rt[k2], 1,0,1]);
    out.push([rb[k], rt[k2], rt[k], 1,1,0]);
    out.push([rt[k], rt[k2], apex, 1,1,1]);
    out.push([base, rb[k2], rb[k], 1,0,0]);
  }
}
function crystalModel(n){
  var tris = [];
  quartz(tris, [0.05, 0.63, 0.0], [0.12, -1, 0.05], 0.30, 0.80, 0.46, n, 0.35);
  quartz(tris, [-0.12, 0.67, 0.07], [-0.78, -1, 0.30], 0.15, 0.40, 0.24, n, 1.7);
  return tris;
}

GG.Crystal = function(S, o){
  var C = {sides:(o && o.sides) || 6, model:null};
  var nAlloc = -1, zF, zB, sF, sB, ed, P = [];
  C.setSides = function(n){ C.sides = clamp(n|0,3,12); C.model = crystalModel(C.sides); };
  C.setSides(C.sides);
  function alloc(){
    if(S.n === nAlloc) return;
    nAlloc = S.n;
    zF = new Float32Array(S.n); zB = new Float32Array(S.n);
    sF = new Float32Array(S.n); sB = new Float32Array(S.n); ed = new Uint8Array(S.n);
  }
  /* rot: spin in radians; mx, my: pointer offsets in -0.5..0.5 */
  C.render = function(t, rot, mx, my){
    if(!S || !S.ready) return;
    alloc();
    var cols = S.cols, rows = S.rows, cw = S.cw, ch = S.ch, half = cols*cw/2, midY = rows*ch/2, n = S.n;
    var bob = Math.sin(t*1.3)*0.035, tilt = Math.sin(t*.7)*.08 + mx*.22, pitch = -.2 + my*.22;
    var cr = Math.cos(rot), sr = Math.sin(rot), cp = Math.cos(pitch), sp = Math.sin(pitch), ct = Math.cos(tilt), st = Math.sin(tilt);
    function tf(p){
      var x = p[0]*cr + p[2]*sr, z = -p[0]*sr + p[2]*cr, y = p[1] - .03;
      var y2 = y*cp - z*sp, z2 = y*sp + z*cp;
      return [x*ct - y2*st, x*st + y2*ct + bob, z2];
    }
    var i, j, k, M = C.model;
    zF.fill(-1e9); zB.fill(-1e9); sF.fill(0); sB.fill(0); ed.fill(0);
    for(k=0;k<M.length;k++){
      var m = M[k], a = tf(m[0]), b = tf(m[1]), c = tf(m[2]);
      var nn = norm3(cross3([b[0]-a[0],b[1]-a[1],b[2]-a[2]],[c[0]-a[0],c[1]-a[1],c[2]-a[2]]));
      if(nn[2] < 0) nn = [-nn[0],-nn[1],-nn[2]];
      var dif = Math.max(0, nn[0]*LIGHT[0]+nn[1]*LIGHT[1]+nn[2]*LIGHT[2]);
      var spc = Math.pow(Math.max(0, nn[0]*HALFV[0]+nn[1]*HALFV[1]+nn[2]*HALFV[2]), 18);
      var shade = Math.min(1, .16 + dif*.7 + spc*.6 + (1 - Math.abs(nn[2]))*.35);
      /* to cell coordinates: cell (c, r) has its centre at (c, r) */
      var ax = (a[0]*half + half)/cw - .5, ay = (a[1]*half + midY)/ch - .5;
      var bx = (b[0]*half + half)/cw - .5, by = (b[1]*half + midY)/ch - .5;
      var cx = (c[0]*half + half)/cw - .5, cy = (c[1]*half + midY)/ch - .5;
      var den = (by-cy)*(ax-cx) + (cx-bx)*(ay-cy);
      if(Math.abs(den) < 1e-6) continue;
      var ha = Math.abs(den)/(Math.hypot(bx-cx, by-cy) || 1);
      var hb = Math.abs(den)/(Math.hypot(cx-ax, cy-ay) || 1);
      var hc = Math.abs(den)/(Math.hypot(ax-bx, ay-by) || 1);
      var c0 = Math.max(0, Math.floor(Math.min(ax,bx,cx))), c1 = Math.min(cols-1, Math.ceil(Math.max(ax,bx,cx)));
      var r0 = Math.max(0, Math.floor(Math.min(ay,by,cy))), r1 = Math.min(rows-1, Math.ceil(Math.max(ay,by,cy)));
      var rr, cc, l1, l2, l3, z, e;
      for(rr=r0; rr<=r1; rr++){
        for(cc=c0; cc<=c1; cc++){
          l1 = ((by-cy)*(cc-cx) + (cx-bx)*(rr-cy))/den;
          if(l1 < 0) continue;
          l2 = ((cy-ay)*(cc-cx) + (ax-cx)*(rr-cy))/den;
          if(l2 < 0) continue;
          l3 = 1 - l1 - l2;
          if(l3 < 0) continue;
          z = l1*a[2] + l2*b[2] + l3*c[2];
          e = (m[3] && l1*ha < .62) || (m[4] && l2*hb < .62) || (m[5] && l3*hc < .62) ? 1 : 0;
          i = rr*cols + cc;
          if(z > zF[i]){ zB[i] = zF[i]; sB[i] = sF[i]; zF[i] = z; sF[i] = shade; ed[i] = e; }
          else if(z > zB[i]){ zB[i] = z; sB[i] = shade; }
        }
      }
    }
    var DARK = GG.theme.dark, col = [0,0,0], tq = Math.floor(t*1.6), gi, v, q, x, y;
    for(y=0, i=0; y<rows; y++){
      for(x=0; x<cols; x++, i++){
        gi = 0;
        if(zF[i] > -1e8){
          v = Math.min(1, sF[i]*.74 + (zB[i] > -1e8 ? sB[i]*.22 : 0) + ed[i]*.26);
          if(DARK){ gi = Math.round(Math.pow(v,.9)*14)+1; ramp3(CRY_D, v, col); }
          else { gi = Math.round((.3 + .7*(1-v))*14)+1; ramp3(CRY_L, v, col); }
          gi = clamp(gi,1,15);
        } else {
          q = hash(x, y, tq + (x>>3));
          if(q > .994) gi = 5; else if(q > .985) gi = 1;
          if(gi){ col[0] = DARK?90:12; col[1] = DARK?255:120; col[2] = DARK?160:48; }
        }
        S.I[i] = gi; S.R[i] = col[0]; S.G[i] = col[1]; S.B[i] = col[2];
      }
    }
    S.draw(null, DARK ? .55 : 0, DARK ? .5 : 0);
  };
  return C;
};

/* run cb(true/false) as el scrolls in and out of view */
GG.watch = function(el, cb){
  if(!el) return;
  if(!('IntersectionObserver' in window)){ cb(true); return; }
  new IntersectionObserver(function(es){ es.forEach(function(e){ cb(e.isIntersecting); }); }).observe(el);
};
/* re-measure every screen after the window settles */
GG.onResize = function(fn){
  var tm = 0;
  window.addEventListener('resize', function(){ clearTimeout(tm); tm = setTimeout(fn, 120); });
  window.addEventListener('load', fn);
};
})();
