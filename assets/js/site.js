/* site.js: theme toggle that sticks across pages, and copy buttons. */
(function(){
"use strict";
var root = document.documentElement;
function isDark(){ var th = root.getAttribute("data-theme"); return th ? th === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; }
function changed(){ document.dispatchEvent(new CustomEvent("themechange")); }
var btn = document.getElementById("theme");
if(btn) btn.addEventListener("click", function(){
  var next = isDark() ? "light" : "dark";
  root.setAttribute("data-theme", next);
  try{ localStorage.setItem("theme", next); }catch(e){}
  changed();
});
var mq = matchMedia("(prefers-color-scheme: dark)");
if(mq.addEventListener) mq.addEventListener("change", changed);

/* <button data-copy="text"> copies its text and says so */
[].forEach.call(document.querySelectorAll("[data-copy]"), function(b){
  var label = b.textContent, val = b.getAttribute("data-copy");
  b.addEventListener("click", function(){
    function done(){ b.textContent = "Copied"; setTimeout(function(){ b.textContent = label; }, 1600); }
    function fallback(){ window.prompt("Copy my email address:", val); }
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(val).then(done, fallback);
    else fallback();
  });
});
})();
