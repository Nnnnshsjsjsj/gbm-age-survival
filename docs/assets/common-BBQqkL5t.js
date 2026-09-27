import{g as s,y as m,A as h}from"./extends-CnXfhndJ.js";function g({light:t=!1,scale:o=1}={}){return new s({transparent:!0,depthWrite:!1,blending:t?m:h,uniforms:{uScale:{value:o},uPx:{value:1},uLight:{value:t?1:0}},vertexShader:`
      attribute vec3 color; attribute float size; attribute float alpha;
      uniform float uScale; uniform float uPx;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = size * uScale * uPx * (48.0 / max(0.5, -mv.z));
        vColor = color; vAlpha = alpha;
      }`,fragmentShader:`
      uniform float uLight;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - 0.5; float d = length(c);
        if (d > 0.5) discard;
        float core = smoothstep(0.5, 0.12, d);
        float halo = smoothstep(0.5, 0.0, d) * 0.5;
        float a = mix(core * 0.9 + halo, core, uLight) * vAlpha;
        gl_FragColor = vec4(vColor * mix(1.0 + core * 0.4, 0.9, uLight), a);
      }`})}function p(t){let o=2166136261;for(let e=0;e<t.length;e++)o^=t.charCodeAt(e),o=Math.imul(o,16777619);return()=>{o+=1831565813;let e=o;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function x(t){const o=Math.max(1e-9,t()),e=t();return Math.sqrt(-2*Math.log(o))*Math.cos(2*Math.PI*e)}function M(t,o,{pitchLimit:e=.9,onStart:a,onTap:l}={}){let n=null;const v=r=>{n={x:r.clientX,y:r.clientY,moved:!1,id:r.pointerId},o.dragging=!0,a==null||a()},c=r=>{if(!n)return;const d=r.clientX-n.x,u=r.clientY-n.y;if(!n.moved&&Math.hypot(d,u)>4){n.moved=!0;try{t.setPointerCapture(n.id)}catch{}}n.moved&&(o.yaw+=d*.006,o.pitch=Math.max(-e,Math.min(e,o.pitch+u*.004)),n.x=r.clientX,n.y=r.clientY,o.last=performance.now())},i=r=>{n&&!n.moved&&(l==null||l(r)),n=null,o.dragging=!1,o.last=performance.now()};return t.addEventListener("pointerdown",v),t.addEventListener("pointermove",c),t.addEventListener("pointerup",i),t.addEventListener("pointercancel",i),()=>{t.removeEventListener("pointerdown",v),t.removeEventListener("pointermove",c),t.removeEventListener("pointerup",i),t.removeEventListener("pointercancel",i)}}export{x as a,M as d,g,p as s};
