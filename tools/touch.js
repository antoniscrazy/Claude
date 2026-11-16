<script>
/* Touch-Steuerung (nur auf Touch-Geraeten). Konfig: window.__TOUCH = {left:[[taste,beschriftung],...], right:[...]} */
(function(){
  var C=window.__TOUCH; if(!C) return;
  if(!(('ontouchstart' in window)||navigator.maxTouchPoints>0)) return;
  var KC={ArrowLeft:37,ArrowUp:38,ArrowRight:39,ArrowDown:40,Space:32,Enter:13,Escape:27,KeyA:65,KeyD:68,KeyW:87,KeyS:83,KeyZ:90,KeyX:88,KeyC:67,KeyE:69,KeyQ:81,KeyR:82,KeyF:70,KeyJ:74,KeyK:75,KeyL:76,KeyP:80,KeyM:77,KeyV:86,KeyB:66,KeyN:78,KeyG:71,KeyH:72,KeyT:84,ShiftLeft:16,Digit1:49,Digit2:50,Digit3:51,Digit4:52};
  function key(code){var k=code.replace(/^Key/,'').replace(/^Digit/,''); if(code==='Space')k=' '; if(code==='ShiftLeft')k='Shift'; return k.length===1&&/[A-Z]/.test(k)?k.toLowerCase():k}
  function fire(type,code){
    var e=new KeyboardEvent(type,{key:key(code),code:code,bubbles:true,cancelable:true});
    var kc=KC[code]||0; try{Object.defineProperty(e,'keyCode',{get:function(){return kc}});Object.defineProperty(e,'which',{get:function(){return kc}})}catch(x){}
    var t=document.activeElement&&document.activeElement!==document.documentElement?document.activeElement:document.body;
    t.dispatchEvent(e);
  }
  var st=document.createElement('style');
  st.textContent='.tz{position:fixed;z-index:2147483000;display:flex;gap:10px;bottom:14px;touch-action:none;-webkit-user-select:none;user-select:none}.tz.l{left:14px}.tz.r{right:14px}.tz b{min-width:64px;height:64px;padding:0 8px;box-sizing:border-box;border-radius:50%;background:rgba(255,255,255,.22);border:2px solid rgba(255,255,255,.55);color:#fff;font:700 18px sans-serif;display:flex;align-items:center;justify-content:center;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}.tz b.on{background:rgba(0,229,168,.55)}#tzt{position:fixed;z-index:2147483001;left:50%;bottom:6px;transform:translateX(-50%);padding:3px 12px;border-radius:12px;background:rgba(0,0,0,.45);color:#fff;font:12px sans-serif;touch-action:none}';
  function build(){
    document.head.appendChild(st);
    var zones=[];
    ['left','right'].forEach(function(side){
      if(!C[side]) return;
      var z=document.createElement('div'); z.className='tz '+(side==='left'?'l':'r'); zones.push(z);
      C[side].forEach(function(d){
        var b=document.createElement('b'); b.textContent=d[1]; var down=false;
        function dn(ev){ev.preventDefault();ev.stopPropagation();if(down)return;down=true;b.classList.add('on');fire('keydown',d[0])}
        function up(ev){ev.preventDefault();ev.stopPropagation();if(!down)return;down=false;b.classList.remove('on');fire('keyup',d[0])}
        b.addEventListener('pointerdown',dn);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up);
        b.addEventListener('contextmenu',function(e){e.preventDefault()});
        z.appendChild(b);
      });
      document.body.appendChild(z);
    });
    var t=document.createElement('div'); t.id='tzt'; t.textContent='Tasten ausblenden'; var vis=true;
    t.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();vis=!vis;zones.forEach(function(z){z.style.display=vis?'flex':'none'});t.textContent=vis?'Tasten ausblenden':'Tasten einblenden'});
    document.body.appendChild(t);
  }
  if(document.body) build(); else document.addEventListener('DOMContentLoaded',build);
})();
</script>
