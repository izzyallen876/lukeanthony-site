/* 404.js: the grid keeps scrolling even when the page is missing. */
(function(){
"use strict";
var GG = window.GG, $ = GG.$, RM = GG.RM;
var grid = $("#grid"), title = $("#title");
if(!RM) GG.scramble(title, "404", 900);
title.addEventListener("pointerenter", function(){ if(!RM) GG.scramble(title, "404", 500); });
function still(){ GG.drawGrid(grid, 0); }
if(RM){ still(); GG.onResize(still); document.addEventListener("themechange", still); }
else (function loop(ts){ GG.drawGrid(grid, (ts || 0)/1000); requestAnimationFrame(loop); })();
})();
