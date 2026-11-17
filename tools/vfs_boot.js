
(function(){
  var VFS = window.__VFS, MIME = window.__MIME, URLS = {}, ROOT = "https://game.local/";
  function blobFor(p){ if(!(p in VFS)) return null; if(!URLS[p]){ var b=atob(VFS[p]), a=new Uint8Array(b.length); for(var i=0;i<b.length;i++) a[i]=b.charCodeAt(i); URLS[p]=URL.createObjectURL(new Blob([a],{type:MIME[p]||"application/octet-stream"})); } return URLS[p]; }
  function map(u){
    try{ var s=String(u&&u.url||u); if(/^(blob:|data:|about:)/.test(s)) return s;
      var x=new URL(s, ROOT); if(x.origin!==new URL(ROOT).origin) return "blob:null/blocked";
      var p=decodeURIComponent(x.pathname.replace(/^\//,"")); var b=blobFor(p); return b||"blob:null/missing-"+encodeURIComponent(p);
    }catch(e){ return u; }
  }
  window.__vfsMap = map;
  var xo=XMLHttpRequest.prototype.open; XMLHttpRequest.prototype.open=function(m,u){ arguments[1]=map(u); return xo.apply(this,arguments); };
  var f=window.fetch; window.fetch=function(r,i){ var m=map(r); return f.call(this,(typeof r==="string"||r instanceof URL)?m:new Request(m,r),i); };
  function hookSrc(proto){ var d=Object.getOwnPropertyDescriptor(proto,"src"); if(!d||!d.set) return; Object.defineProperty(proto,"src",{get:d.get,set:function(v){ d.set.call(this,map(v)); },configurable:true}); var sa=proto.setAttribute; }
  hookSrc(HTMLImageElement.prototype); hookSrc(HTMLScriptElement.prototype); hookSrc(HTMLMediaElement.prototype);
  var sa=Element.prototype.setAttribute; Element.prototype.setAttribute=function(n,v){ if(n==="src"&&/^(IMG|SCRIPT|AUDIO|VIDEO|SOURCE)$/.test(this.tagName)) v=map(v); return sa.call(this,n,v); };
  var W=window.Worker; window.Worker=function(u,o){ return new W(map(u),o); }; window.Worker.prototype=W.prototype;
  if(window.AudioWorklet){ var am=AudioWorklet.prototype.addModule; AudioWorklet.prototype.addModule=function(u,o){ return am.call(this,map(u),o); }; }
  if(navigator.sendBeacon) navigator.sendBeacon=function(){return false;};
  window.open=function(){return null;};
})();
window.__vfsCss = function (css) {
  return String(css).replace(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/g, function (m, q, u) {
    if (/^(data:|blob:)/.test(u)) return m;
    return 'url("' + window.__vfsMap(u) + '")';
  });
};
(function () {
  var FF = window.FontFace; if (!FF) return;
  window.FontFace = function (fam, src, desc) { if (typeof src === "string") src = window.__vfsCss(src); return new FF(fam, src, desc); };
  window.FontFace.prototype = FF.prototype;
})();
