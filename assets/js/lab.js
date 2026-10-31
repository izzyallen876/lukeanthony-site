/* lab.js: two images redrawn in text, and the crystal with adjustable sides. */
(function(){
"use strict";
var GG = window.GG, $ = GG.$, RM = GG.RM, clamp = GG.clamp, hash = GG.hash;
var LOCAL = "This view needs the live site or a local server, so you are seeing the original image. The README shows how to run one.";

function Specimen(view, opts){
  var canvas = view.querySelector("canvas"), img = view.querySelector(".fallback"), msg = view.querySelector(".vmsg");
  var sp = {S:null, data:null, lens:null, mode:"text", vis:false, last:0, dirty:true};
  var small = document.createElement("canvas"), sx = small.getContext("2d", {willReadFrequently:true});
  function fail(){ view.classList.remove("live"); msg.textContent = LOCAL; msg.hidden = false; sp.data = null; }
  function sample(){
    var S = sp.S;
    small.width = S.cols; small.height = S.rows;
    sx.imageSmoothingEnabled = true; sx.imageSmoothingQuality = "high";
    sx.clearRect(0, 0, S.cols, S.rows); sx.drawImage(img, 0, 0, S.cols, S.rows);
    sp.data = sx.getImageData(0, 0, S.cols, S.rows).data; /* throws when opened as a plain file */
  }
  function resize(){
    if(!sp.S) return;
    try{ if(sp.S.resize()){ sample(); view.classList.add("live"); draw(0); } }
    catch(err){ fail(); }
  }
  function draw(t){
    var S = sp.S; if(!S || !sp.data) return;
    var d = sp.data, n = S.n, i, o, r, g, b, mx, mn, L, s, gi, h, fl = RM ? 0 : Math.floor(t*8);
    for(i=0;i<n;i++){
      o = i*4; r = d[o]; g = d[o+1]; b = d[o+2];
      mx = Math.max(r,g,b); mn = Math.min(r,g,b);
      L = (r*.299 + g*.587 + b*.114)/255; s = mx ? (mx-mn)/mx : 0;
      if(opts.skip(L, s, mx/255)){ S.I[i] = 0; continue; }
      gi = Math.round(Math.pow(L,.85)*13) + 2;
      h = hash(i, 11, fl); if(h < .05) gi += h < .025 ? 1 : -1;
      S.I[i] = clamp(gi, 1, 15);
      S.R[i] = Math.min(255, r*1.08 + 14); S.G[i] = Math.min(255, g*1.08 + 14); S.B[i] = Math.min(255, b*1.08 + 14);
    }
    S.draw("#000", .32, .26);
    if(sp.lens) lens(S);
  }
  /* a detection box that shows the original image through the text */
  function lens(S){
    var ctx = canvas.getContext("2d"), W = S.cols*S.cw, H = S.rows*S.ch, size = Math.max(72, W*.26);
    var x0 = clamp(sp.lens.x - size/2, 0, W - size), y0 = clamp(sp.lens.y - size/2, 0, H - size);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, size, size); ctx.clip();
    ctx.drawImage(img, 0, 0, W, H); ctx.restore();
    ctx.strokeStyle = "#f2e14c"; ctx.lineWidth = 1.5; ctx.strokeRect(x0 + .75, y0 + .75, size - 1.5, size - 1.5);
    ctx.font = "700 11px ui-monospace, Menlo, Consolas, monospace"; ctx.fillStyle = "#f2e14c";
    ctx.textBaseline = y0 > 16 ? "bottom" : "top";
    ctx.fillText(opts.tag, x0 + 2, y0 > 16 ? y0 - 3 : y0 + 4);
  }
  function setLens(e){
    if(sp.mode !== "text" || !sp.data) return;
    var rc = canvas.getBoundingClientRect(); sp.lens = {x:e.clientX - rc.left, y:e.clientY - rc.top};
    sp.dirty = true; if(RM) draw(0);
  }
  view.addEventListener("pointermove", setLens);
  view.addEventListener("pointerdown", setLens);
  view.addEventListener("pointerleave", function(){ sp.lens = null; sp.dirty = true; if(RM) draw(0); });
  var btns = [].slice.call(document.querySelectorAll("[data-for=\"" + view.id + "\"] [data-mode]"));
  btns.forEach(function(bt){
    bt.addEventListener("click", function(){
      sp.mode = bt.getAttribute("data-mode");
      view.classList.toggle("src", sp.mode === "source");
      btns.forEach(function(x){ x.setAttribute("aria-pressed", x === bt ? "true" : "false"); });
      sp.lens = null; sp.dirty = true; if(RM) draw(0);
    });
  });
  GG.watch(view, function(on){ sp.vis = on; });
  function start(){
    sp.S = GG.GlyphScreen(canvas, {aspect:img.naturalHeight/img.naturalWidth, cellPx:5.6, minCols:60, maxCols:150});
    resize();
  }
  if(img.complete && img.naturalWidth) start(); else img.addEventListener("load", start);
  sp.resize = resize;
  sp.tick = function(ts){
    if(!sp.vis || !sp.data || sp.mode !== "text") return;
    if(sp.dirty || ts - sp.last > 125){ sp.last = ts; sp.dirty = false; draw(ts/1000); }
  };
  return sp;
}

var specs = [];
var vt = $("#v-thermal"), vp = $("#v-portrait");
if(vt) specs.push(Specimen(vt, {tag:"LENS_01XY", skip:function(L){ return L < .085; }}));
if(vp) specs.push(Specimen(vp, {tag:"LENS_02XY", skip:function(L, s, v){ return s < .12 && v > .86; }}));

/* the crystal, up close */
var cv = $("#v-crystal"), C = null, CS = null, angle = .6, spin = !RM, drag = null, cvis = false, clast = 0, cdirty = true;
function still(){ if(C) C.render(0, angle, 0, 0); }
if(cv){
  CS = GG.GlyphScreen(cv.querySelector("canvas"), {aspect:1.0, cellPx:6.2, minCols:56, maxCols:120});
  C = GG.Crystal(CS, {sides:6});
  var range = $("#sides"), out = $("#sides-out"), spinB = $("#spin");
  range.addEventListener("input", function(){ C.setSides(+range.value); out.textContent = range.value; cdirty = true; if(RM) still(); });
  spinB.setAttribute("aria-pressed", spin ? "true" : "false");
  if(RM) spinB.disabled = true;
  spinB.addEventListener("click", function(){ spin = !spin; spinB.setAttribute("aria-pressed", spin ? "true" : "false"); });
  cv.addEventListener("pointerdown", function(e){ drag = {x:e.clientX, a:angle}; try{ cv.setPointerCapture(e.pointerId); }catch(err){} });
  cv.addEventListener("pointermove", function(e){ if(!drag) return; angle = drag.a + (e.clientX - drag.x)*.012; cdirty = true; if(RM) still(); });
  cv.addEventListener("pointerup", function(){ drag = null; });
  cv.addEventListener("pointercancel", function(){ drag = null; });
  cv.addEventListener("keydown", function(e){
    if(e.key === "ArrowLeft" || e.key === "ArrowRight"){ e.preventDefault(); angle += e.key === "ArrowLeft" ? -.2 : .2; cdirty = true; if(RM) still(); }
  });
  GG.watch(cv, function(on){ cvis = on; });
  document.addEventListener("themechange", function(){ cdirty = true; if(RM) still(); });
}

GG.onResize(function(){ specs.forEach(function(s){ s.resize(); }); if(CS){ CS.resize(); cdirty = true; if(RM) still(); } });
if(CS){ CS.resize(); still(); }

var prev = 0;
function loop(ts){
  var dt = prev ? Math.min(.05, (ts - prev)/1000) : 0; prev = ts;
  specs.forEach(function(s){ s.tick(ts); });
  if(C && cvis){
    if(spin && !drag){ angle += dt*.9; cdirty = true; }
    if(cdirty && ts - clast > 33){ clast = ts; cdirty = false; C.render(ts/1000, angle, 0, 0); }
  }
  requestAnimationFrame(loop);
}
if(!RM) requestAnimationFrame(loop);
})();
