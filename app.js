(function () {
'use strict';

// Storage is optional: previews with restricted storage still work in memory.
function readSaved(key, fallback) {
  try { var value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; }
  catch (_) { return fallback; }
}
function writeSaved(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
}
var toastTimer;
function notify(message) {
  var box = document.getElementById('toast');
  box.textContent = message;
  box.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { box.classList.remove('visible'); }, 2800);
}
function downloadFile(filename, contents, type) {
  var blob = contents instanceof Blob ? contents : new Blob([contents], {type: type || 'text/plain'});
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); notify('Copied to clipboard'); }
  catch (_) {
    var field = document.createElement('textarea');
    field.value = text;
    field.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:.01';
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, text.length);
    var copied = false;
    try { copied = document.execCommand('copy'); } catch (_) {}
    field.remove();
    notify(copied ? 'Copied to clipboard' : 'Clipboard unavailable here. Use the download instead.');
  }
}

// DEMO EDIT: try a different initial mode or palette.
var CONFIG={mode:'wave',palette:'plasma',count:720,speed:1.2};
var palettes={plasma:['#788bff','#bc78ff','#57cbfa','#f383c8'],glacier:['#8be8da','#58becf','#4b8bf7','#a8d4ff'],ember:['#ffe3a0','#ffae62','#ff696d','#c56786']};
var names={wave:'WAVE FIELD',vortex:'VORTEX',cross:'CROSSCURRENT'};
var canvas=document.getElementById('field'), ctx=canvas.getContext('2d');
var width=0,height=0,particles=[],phase=0,frameId=0,last=0;
var running=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var pointer={x:0,y:0,active:false};
function spawn(p){
 p.x=Math.random()*width;p.y=Math.random()*height;p.life=Math.random()*180+80;p.color=Math.floor(Math.random()*4);
 return p;
}
function seed(){
 particles=Array.from({length:CONFIG.count},function(){return spawn({});});
 ctx.fillStyle='#080e1b';ctx.fillRect(0,0,width,height);
 // Render a finished field immediately, including when motion is disabled.
 for(var i=0;i<58;i++)step(false);
}
function resize(){
 var rect=canvas.getBoundingClientRect();
 width=Math.max(1,rect.width);height=Math.max(1,rect.height);
 var ratio=Math.min(2,window.devicePixelRatio||1);
 canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
 ctx.setTransform(ratio,0,0,ratio,0,0);seed();
}
function angleAt(x,y){
 var scale=.007;
 if(CONFIG.mode==='vortex'){
  var dx=x-width*.5,dy=y-height*.5;
  return Math.atan2(dy,dx)+Math.PI*.5+Math.sin(Math.sqrt(dx*dx+dy*dy)*.008+phase)*.52;
 }
 if(CONFIG.mode==='cross')return Math.sin(x*scale+phase*.2)*2.2-Math.cos(y*scale*1.3-phase*.3)*1.5;
 return Math.sin(x*scale+phase*.24)*1.9+Math.cos(y*scale*.8+phase*.18)*1.4;
}
function step(advance){
 ctx.fillStyle='rgba(8,14,27,0.038)';ctx.fillRect(0,0,width,height);
 ctx.lineWidth=.85;
 var speed=CONFIG.speed*1.7, colors=palettes[CONFIG.palette];
 colors.forEach(function(color,index){
  ctx.beginPath();ctx.strokeStyle=color;
  particles.forEach(function(p){
   if(p.color!==index)return;
   var angle=angleAt(p.x,p.y), ox=p.x,oy=p.y;
   if(pointer.active){
    var dx=p.x-pointer.x,dy=p.y-pointer.y,distance=Math.sqrt(dx*dx+dy*dy);
    if(distance<160)angle+=(Math.atan2(dy,dx)+Math.PI*.5-angle)*(1-distance/160)*.65;
   }
   p.x+=Math.cos(angle)*speed;p.y+=Math.sin(angle)*speed;p.life--;
   if(p.x<0||p.x>width||p.y<0||p.y>height||p.life<=0){spawn(p);return;}
   ctx.moveTo(ox,oy);ctx.lineTo(p.x,p.y);
  });
  ctx.stroke();
 });
 if(advance)phase+=.006;
}
function loop(time){
 if(!running||document.hidden){frameId=0;return;}
 if(time-last>=32){step(true);last=time;}
 frameId=requestAnimationFrame(loop);
}
function setRunning(next){
 running=next;
 document.getElementById('pause').textContent=running?'Pause Ⅱ':'Play ▶';
 document.getElementById('pause').setAttribute('aria-label',running?'Pause animation':'Play animation');
 document.getElementById('state-label').textContent=running?'FLOWING':'STILL FRAME';
 document.getElementById('live-dot').classList.toggle('paused',!running);
 if(running&&!frameId)frameId=requestAnimationFrame(loop);
 if(!running&&frameId){cancelAnimationFrame(frameId);frameId=0;}
}
function updateLabels(){
 document.getElementById('field-title').textContent=names[CONFIG.mode]+' / '+CONFIG.palette.toUpperCase();
 document.getElementById('particle-count').textContent=CONFIG.count+' PARTICLES';
 document.getElementById('density-value').textContent=CONFIG.count;
 document.getElementById('speed-value').textContent=CONFIG.speed.toFixed(1)+'×';
}
document.getElementById('mode').addEventListener('change',function(){CONFIG.mode=this.value;phase=0;seed();updateLabels();});
document.getElementById('speed').addEventListener('input',function(){CONFIG.speed=Number(this.value);updateLabels();if(!running)seed();});
document.getElementById('density').addEventListener('input',function(){CONFIG.count=Number(this.value);seed();updateLabels();});
document.querySelectorAll('[data-palette]').forEach(function(button){
 button.addEventListener('click',function(){
  CONFIG.palette=button.dataset.palette;
  document.querySelectorAll('[data-palette]').forEach(function(b){var on=b===button;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});
  seed();updateLabels();
 });
});
document.getElementById('pause').addEventListener('click',function(){setRunning(!running);});
document.getElementById('reseed').addEventListener('click',function(){phase=Math.random()*12;seed();});
function movePointer(event){var r=canvas.getBoundingClientRect();pointer.x=event.clientX-r.left;pointer.y=event.clientY-r.top;pointer.active=true;}
canvas.addEventListener('pointermove',movePointer);
canvas.addEventListener('pointerdown',movePointer);
canvas.addEventListener('pointerleave',function(){pointer.active=false;});
canvas.addEventListener('pointerup',function(event){if(event.pointerType!=='mouse')pointer.active=false;});
canvas.addEventListener('pointercancel',function(){pointer.active=false;});
document.getElementById('save-image').addEventListener('click',function(){
 canvas.toBlob(function(blob){if(blob)downloadFile('flux-'+CONFIG.mode+'-'+CONFIG.palette+'.png',blob,'image/png');else notify('Image export unavailable in this preview.');},'image/png');
});
document.addEventListener('visibilitychange',function(){if(!document.hidden&&running&&!frameId)frameId=requestAnimationFrame(loop);});
var resizeTimer;window.addEventListener('resize',function(){clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,100);});
document.getElementById('mode').value=CONFIG.mode;
document.getElementById('density').value=CONFIG.count;
document.getElementById('speed').value=CONFIG.speed;
resize();updateLabels();setRunning(running);
})();
