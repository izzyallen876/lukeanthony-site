/* home.js: the grid, the crystal and the name. */
(function(){
"use strict";
var GG = window.GG, $ = GG.$, RM = GG.RM;
var grid = $("#grid"), title = $("#title"), hero = $(".hero");
var S = GG.GlyphScreen($("#crystal"), {aspect:1.0, cellPx:6.2, minCols:56, maxCols:120});
var C = GG.Crystal(S, {sides:6});
var mx = 0, my = 0;
window.addEventListener("pointermove", function(e){ mx = e.clientX/innerWidth - .5; my = e.clientY/innerHeight - .5; });
var text = "israel\nallen";
if(!RM) GG.scramble(title, text, 1100);
title.addEventListener("pointerenter", function(){ if(!RM) GG.scramble(title, text, 600); });
function still(){ GG.drawGrid(grid, 0); C.render(0, .6, 0, 0); }
function resize(){ S.resize(); if(RM) still(); }
GG.onResize(resize);
resize();
document.addEventListener("themechange", function(){ if(RM) still(); });
var vis = true, last = 0;
GG.watch(hero, function(on){ vis = on; });
function loop(ts){
  var t = ts/1000;
  if(vis){ GG.drawGrid(grid, t); if(ts - last > 33){ last = ts; C.render(t, t*.9 + mx*2.2, mx, my); } }
  requestAnimationFrame(loop);
}
if(RM) still(); else requestAnimationFrame(loop);
})();
