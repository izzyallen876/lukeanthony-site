/* work.js: draws the timeline from the data-from / data-to dates on each role.
   To add a role, copy an <article class="job"> in work.html and change its dates. */
(function(){
"use strict";
var host = document.getElementById("tl"); if(!host) return;
var jobs = [].slice.call(document.querySelectorAll(".job[data-from]")); if(!jobs.length) return;
var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var d = new Date(), NOW = d.getFullYear()*12 + d.getMonth() + (d.getDate()-1)/31;
function ym(s){ var p = s.split("-"); return (+p[0])*12 + (+p[1]) - 1; }
function end(j){ return j.dataset.to === "now" ? NOW : ym(j.dataset.to) + 1; }
var t0 = Math.min.apply(null, jobs.map(function(j){ return ym(j.dataset.from); }));
var t1 = Math.max(NOW, Math.max.apply(null, jobs.map(end)));
var span = Math.max(1, t1 - t0);
function pc(v){ return Math.max(0, Math.min(100, (v - t0)/span*100)); }

jobs.slice().sort(function(a,b){ return ym(a.dataset.from) - ym(b.dataset.from); }).forEach(function(job){
  var from = ym(job.dataset.from), to = end(job), live = job.dataset.to === "now";
  var row = document.createElement("a"); row.className = "tl-row"; row.href = "#" + job.id;
  var label = document.createElement("span"); label.className = "tl-label";
  var name = document.createElement("b"); name.textContent = job.dataset.short;
  var when = document.createElement("span"); when.textContent = job.querySelector(".when").textContent;
  label.appendChild(name); label.appendChild(when);
  var track = document.createElement("span"); track.className = "tl-track";
  track.style.backgroundSize = (100/span).toFixed(3) + "% 100%";
  var bar = document.createElement("span"); bar.className = "tl-bar" + (live ? " live" : "");
  bar.style.left = pc(from).toFixed(2) + "%";
  bar.style.width = Math.max(.8, pc(to) - pc(from)).toFixed(2) + "%";
  track.appendChild(bar); row.appendChild(label); row.appendChild(track); host.appendChild(row);
  function on(){ job.classList.add("hl"); } function off(){ job.classList.remove("hl"); }
  row.addEventListener("mouseenter", on); row.addEventListener("mouseleave", off);
  row.addEventListener("focus", on); row.addEventListener("blur", off);
  job.addEventListener("mouseenter", function(){ row.classList.add("on"); });
  job.addEventListener("mouseleave", function(){ row.classList.remove("on"); });
});

var axis = document.createElement("div"); axis.className = "tl-axis"; axis.setAttribute("aria-hidden", "true");
var step = host.clientWidth < 520 ? 12 : 6;
for(var m = t0; m < NOW - 2.5; m += step){
  var tk = document.createElement("span"); tk.textContent = MON[m % 12] + " " + Math.floor(m/12);
  tk.style.left = pc(m).toFixed(2) + "%"; axis.appendChild(tk);
}
var today = document.createElement("span"); today.className = "today"; today.textContent = "today";
today.style.left = pc(NOW).toFixed(2) + "%"; axis.appendChild(today);
host.appendChild(axis);
})();
