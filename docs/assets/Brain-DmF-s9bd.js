import{S as We,j as ie}from"./index-DeUWq8NZ.js";import{r as K}from"./vendor-_nAbmPak.js";import{V,c as Ie,B as Pe,d as Y,e as $e,f as ae,g as se,D as be,L as Ue,A as Fe,N as Ge,R as Me,M as ze,h as qe,i as Ze,I as Xe,F as Ke,j as Ye,k as Je,P as Qe,G as Ae,l as X,m as et,n as tt,o as ot,u as Oe,a as je}from"./extends-CnXfhndJ.js";import{H as nt}from"./Html-DR1Yhxyt.js";const W=new Float32Array([1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1]);function Ce(e=7){const t=new Uint8Array(512),n=new Uint8Array(256);for(let o=0;o<256;o++)n[o]=o;let a=e>>>0||1;for(let o=255;o>0;o--){a=Math.imul(a,1664525)+1013904223>>>0;const u=a%(o+1),g=n[o];n[o]=n[u],n[u]=g}for(let o=0;o<512;o++)t[o]=n[o&255];const l=new Uint8Array(512);for(let o=0;o<512;o++)l[o]=t[o]%12*3;const m=1/3,i=1/6;function h(o,u,g){const r=(o+u+g)*m,f=Math.floor(o+r),b=Math.floor(u+r),s=Math.floor(g+r),p=(f+b+s)*i,d=o-(f-p),v=u-(b-p),S=g-(s-p);let j,F,A,z,N,D;d>=v?v>=S?(j=1,F=0,A=0,z=1,N=1,D=0):d>=S?(j=1,F=0,A=0,z=1,N=0,D=1):(j=0,F=0,A=1,z=1,N=0,D=1):v<S?(j=0,F=0,A=1,z=0,N=1,D=1):d<S?(j=0,F=1,A=0,z=0,N=1,D=1):(j=0,F=1,A=0,z=1,N=1,D=0);const B=d-j+i,_=v-F+i,H=S-A+i,ee=d-z+2*i,I=v-N+2*i,G=S-D+2*i,te=d-1+3*i,ne=v-1+3*i,E=S-1+3*i,q=f&255,Z=b&255,$=s&255;let U=0,M=.6-d*d-v*v-S*S;if(M>0){const R=l[q+t[Z+t[$]]];M*=M,U+=M*M*(W[R]*d+W[R+1]*v+W[R+2]*S)}if(M=.6-B*B-_*_-H*H,M>0){const R=l[q+j+t[Z+F+t[$+A]]];M*=M,U+=M*M*(W[R]*B+W[R+1]*_+W[R+2]*H)}if(M=.6-ee*ee-I*I-G*G,M>0){const R=l[q+z+t[Z+N+t[$+D]]];M*=M,U+=M*M*(W[R]*ee+W[R+1]*I+W[R+2]*G)}if(M=.6-te*te-ne*ne-E*E,M>0){const R=l[q+1+t[Z+1+t[$+1]]];M*=M,U+=M*M*(W[R]*te+W[R+1]*ne+W[R+2]*E)}return 32*U}function c(o,u,g,r=3,f=2.03,b=.5){let s=1,p=1,d=0,v=0;for(let S=0;S<r;S++)d+=s*h(o*p,u*p,g*p),v+=s,s*=b,p*=f;return d/v}return{noise3:h,fbm:c}}function at(e=1){let t=e>>>0||1;return()=>(t^=t<<13,t>>>=0,t^=t>>>17,t^=t<<5,t>>>=0,t/4294967296)}const w=(e,t,n)=>{const a=Math.min(1,Math.max(0,(n-e)/(t-e)));return a*a*(3-2*a)},oe=(e,t,n)=>e+(t-e)*n,T=(e,t)=>Math.exp(-(e*e)/(t*t)),Q={frontal:0,parietal:1,temporal:2,occipital:3,cerebellum:4,stem:5};function Ne(e){const t=(1+Math.sqrt(5))/2,n=[],a=(m,i,h)=>{const c=Math.hypot(m,i,h);return n.push(m/c,i/c,h/c),n.length/3-1};[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].forEach(([m,i,h])=>a(m,i,h));let l=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];for(let m=0;m<e;m++){const i=new Map,h=(u,g)=>{const r=u<g?u*1e7+g:g*1e7+u;let f=i.get(r);return f===void 0&&(f=a(n[u*3]+n[g*3],n[u*3+1]+n[g*3+1],n[u*3+2]+n[g*3+2]),i.set(r,f)),f},c=new Array(l.length*4);let o=0;for(let u=0;u<l.length;u+=3){const g=l[u],r=l[u+1],f=l[u+2],b=h(g,r),s=h(r,f),p=h(f,g);c[o++]=g,c[o++]=b,c[o++]=p,c[o++]=r,c[o++]=s,c[o++]=b,c[o++]=f,c[o++]=p,c[o++]=s,c[o++]=b,c[o++]=s,c[o++]=p}l=c}return{pos:new Float32Array(n),index:l.length>65535*3?new Uint32Array(l):new Uint32Array(l)}}function le(e,t,n={}){const a=new Pe;a.setAttribute("position",new Y(e,3));for(const[l,[m,i]]of Object.entries(n))a.setAttribute(l,new Y(m,i));return a.setIndex(new Y(t,1)),a.computeVertexNormals(),a.computeBoundingSphere(),a}const J=(e,t)=>Math.sign(e)*Math.abs(e)**(2/t),he=.02,rt=e=>.8-.17*w(-.05,.95,e)-.08*w(-.45,-1,e)+.02*T(e+.3,.35),st=e=>{const t=e>0?2.7:2.45;return Math.max(0,1-Math.abs(e)**t)**(1/t)},it=e=>-.03+.12*w(.3,.95,e)-.03*w(-.5,-1,e),ct=e=>.72+.05*T(e+.1,.55)-.12*w(-.35,-1,e)-.05*w(.45,1,e),lt=e=>{const t=oe(-.15,-.56,w(.46,.28,e)),n=oe(-.56,-.34,w(-.38,-.74,e));return e>-.1?t:Math.max(t,n)},ut=e=>oe(-.15,-.28,w(.55,.15,e))+.02*w(-.4,-.85,e);function mt(e,t,n){const a=n,l=Math.hypot(e,t)||1e-9,m=e/l,i=t/l,h=st(a),c=rt(a)*h,o=it(a),u=.075*Math.sqrt(h),g=w(.46,.3,a)*w(-.74,-.36,a);let r,f;if(i>=0){const b=(ct(a)-o)*h;r=m>=0?he+u+(c-u)*J(m,2.05):he+u+u*J(m,2.4),f=o+b*J(i,2)}else{const b=w(-.4,.7,m),s=(o-oe(ut(a),lt(a),b))*h,p=c*.52,d=1+.08*g*Math.sin(Math.PI*Math.min(1,-i*1.4))*Math.max(0,m);r=m>=0?he+p+(c-p)*J(m,2)*d:he+p+p*J(m,3.2),f=o+s*J(i,2.5)}return[r,f,a]}function ft(e,t,n){let a=1e9,l=0,m=0,i=0;for(let h=0;h<n.length-1;h++)i+=Math.hypot(n[h+1][0]-n[h][0],n[h+1][1]-n[h][1]);for(let h=0;h<n.length-1;h++){const[c,o]=n[h],[u,g]=n[h+1],r=u-c,f=g-o,b=r*r+f*f,s=Math.sqrt(b);let p=((e-c)*r+(t-o)*f)/b;p=Math.max(0,Math.min(1,p));const d=Math.hypot(e-(c+p*r),t-(o+p*f));d<a&&(a=d,l=(m+p*s)/i),m+=s}return[a,l]}const re=[[.4,-.2],[.22,-.1],[0,-.04],[-.22,.02],[-.38,.1],[-.46,.22]],_e=e=>{for(let t=0;t<re.length-1;t++){const[n,a]=re[t],[l,m]=re[t+1];if(e<=n&&e>=l)return oe(a,m,(n-e)/(n-l))}return e>re[0][0]?re[0][1]:re[re.length-1][1]},Ve=e=>-.1+.26*w(.72,-.02,e)+.022*Math.sin(e*19)+.012*Math.sin(e*41+1.3);function ge(e,t=1,n=11){const{pos:a,index:l}=Ne(e),m=a.length/3,i=new Float32Array(m*3);for(let s=0;s<m;s++){const p=mt(a[s*3],a[s*3+1],a[s*3+2]);i[s*3]=p[0],i[s*3+1]=p[1],i[s*3+2]=p[2]}const h=le(i.slice(),l),c=h.getAttribute("normal").array;h.dispose();const{noise3:o}=Ce(n+(t>0?0:101)),u=new Float32Array(m),g=new Float32Array(m),r=4.6,f=.11,b=.06;for(let s=0;s<m;s++){const p=i[s*3],d=i[s*3+1],v=i[s*3+2],S=c[s*3],j=c[s*3+1],F=c[s*3+2],A=w(.15,.6,S),z=w(-.5,-.9,S),N=p+f*o(p*1.7+11.3,d*1.7,v*1.7),D=d+f*o(p*1.7,d*1.7+7.1,v*1.7),B=v+f*o(p*1.7,d*1.7,v*1.7+3.7),_=_e(v),H=Ve(d),ee=w(_-.02,_+.08,d),I=w(H+.1,H+.3,v)*ee,G=(1-ee)*w(-.7,-.4,v)*(1-z),te=Math.max(I*.75,G*.8),ne=oe(1,.52,te),E=o(N*r,D*r,B*r),q=o(N*r*1.08+40,D*r*1.08,B*r*ne),Z=oe(E,q,te),$=Math.abs(Z);let U=(1-w(0,.24,$))**1.4;const M=1-w(.1,.6,$),R=o(N*r*1.9+17,D*r*1.9,B*r*1.9),de=(1-w(0,.12,Math.abs(R)))*w(.3,.6,$),me=v-H,y=ee*(1-z*.6)*w(-.1,.25,j+S),C=y*T(me,.13);U*=1-.25*C;let x=b*(.8*U+.2*M)+b*.28*de*(1-C*.7);const k=x,[L,P]=ft(v,d,re),Se=T(L,.034)*A*(1-.45*P)*w(.46,.36,v);x+=.12*Se,x+=.1*T(L,.055)*w(.12,.4,v)*w(.5,.36,v)*w(-.5,.1,S)*(1-z);const He=T(me,.018)*y*w(_+.02,_+.1,d);x+=.065*He,x+=.042*T(me-.15,.017)*y*w(_+.05,_+.14,d),x+=.04*T(me+.14,.017)*y*w(_+.08,_+.16,d)*w(.62,.45,d+0);const Ee=T(d-(_-.14-.05*w(.1,-.4,v)),.018)*A*w(.36,.2,v)*w(-.72,-.5,v);x+=.045*Ee;const De=w(H+.18,H+.26,v)*w(.92,.7,v)*A;x+=.035*T(d-(.45-.12*w(.2,.9,v)),.016)*De,x+=.03*T(d-(.19-.02*w(.2,.9,v)),.016)*De,i[s*3]=p-S*x,i[s*3+1]=d-j*x,i[s*3+2]=v-F*x,u[s]=Math.min(1,Math.max(k/b,(x-k)/.05+k/b*.5));let pe=Q.parietal;d<_-.01&&v>-.62&&!(z>.5&&d>-.1)?pe=Q.temporal:v>H?pe=Q.frontal:v<-.66+.1*w(.6,0,d)&&(pe=Q.occipital),g[s]=pe}if(t<0){for(let s=0;s<m;s++)i[s*3]*=-1;for(let s=0;s<l.length;s+=3){const p=l[s+1];l[s+1]=l[s+2],l[s+2]=p}}return le(i,l,{aDepth:[u,1],aRegion:[g,1]})}function vt(e,t,n){const a=_e(n),l=Ve(t),m=Math.abs(e)<.09;return t<a-.01&&n>-.62&&!(m&&t>-.1)?Q.temporal:n>l?Q.frontal:n<-.66+.1*w(.6,0,t)?Q.occipital:Q.parietal}const fe=[0,-.5,-.5];function Te(e,t=5){const{pos:n,index:a}=Ne(e),l=n.length/3,{noise3:m}=Ce(t),i=new Float32Array(l*3);for(let r=0;r<l;r++){const f=n[r*3],b=n[r*3+1],s=n[r*3+2];let p=.57*J(f,2.3),d=b>0?.14*J(b,3):.25*J(b,2.1),v=s>0?.2*s:.34*J(s,2.2);const S=T(p,.09);v*=1-.16*S*w(.1,-.7,s),d*=1-.1*S*w(0,-.8,b),d+=.09*s-.08*p*p+.035*Math.max(0,b)*S,i[r*3]=p+fe[0],i[r*3+1]=d+fe[1],i[r*3+2]=v+fe[2]}const h=le(i.slice(),a),c=h.getAttribute("normal").array;h.dispose();const o=new Float32Array(l),u=new Float32Array(l).fill(Q.cerebellum);let g=0;for(let r=0;r<l;r++){const f=i[r*3],b=i[r*3+1]-fe[1],s=i[r*3+2]-fe[2],p=Math.atan2(b+.02,Math.hypot(s,.55*f))*1.6+.05*m(f*4,b*4,s*4),d=Math.sin(p*13);let v=.012*(1-w(0,.5,Math.abs(d)));v+=.03*T(p-.05,.035),v+=.022*T(p-1.35,.04),v+=.02*T(f,.03)*w(.2,-.5,s/.3);const S=c[r*3],j=c[r*3+1],F=c[r*3+2];i[r*3]-=S*v,i[r*3+1]-=j*v,i[r*3+2]-=F*v,o[r]=v,v>g&&(g=v)}for(let r=0;r<l;r++)o[r]=Math.min(1,o[r]/(g*.7));return le(i,a,{aDepth:[o,1],aRegion:[u,1]})}function Re(e=72,t=48){const n=new Ie([new V(0,-.12,-.08),new V(0,-.38,-.12),new V(0,-.62,-.2),new V(0,-.86,-.3)]);n.computeFrenetFrames(e,!1);const a=[],l=[],m=[];for(let c=0;c<=e;c++){const o=c/e,u=n.getPointAt(o),g=n.getTangentAt(o),r=new V(0,0,1).addScaledVector(g,-g.z).normalize(),f=new V().crossVectors(g,r).normalize(),b=oe(.15,.092,w(.3,1,o));for(let s=0;s<=t;s++){const p=s/t*Math.PI*2,d=Math.cos(p),v=Math.sin(p),S=.6*T(o-.33,.13)*Math.max(0,d)**1.2+.16*T(o-.33,.14),j=.06*T(o-.72,.16)*Math.max(0,d)*(1-Math.abs(v)*.3),F=.012*T(o-.34,.1)*Math.max(0,d)*(.5+.5*Math.sin(o*160)),A=b*(1+S+j)-F*.4,z=1+.25*T(o-.33,.18)+.3*w(.15,0,o);a.push(u.x+(r.x*d+f.x*v*z)*A,u.y+(r.y*d+f.y*v*z)*A,u.z+(r.z*d+f.z*v*z)*A),l.push(.15+F*20)}}const i=t+1;for(let c=0;c<e;c++)for(let o=0;o<t;o++){const u=c*i+o,g=u+i;m.push(u,u+1,g,g,u+1,g+1)}const h=a.length/3;return le(new Float32Array(a),new Uint32Array(m),{aDepth:[new Float32Array(l),1],aRegion:[new Float32Array(h).fill(Q.stem),1]})}const O=new V(.43,-.08,.26);function ce(e,t,n,a,l,m=[1,1,1],i=3){const{pos:h,index:c}=Ne(e),{fbm:o}=Ce(l),u=h.length/3,g=new Float32Array(u*3),r=new Float32Array(u);for(let f=0;f<u;f++){const b=h[f*3],s=h[f*3+1],p=h[f*3+2],d=o(b*a,s*a,p*a,i),v=t*(1+n*d);g[f*3]=O.x+b*v*m[0],g[f*3+1]=O.y+s*v*m[1],g[f*3+2]=O.z+p*v*m[2],r[f]=d*.5+.5}return le(g,c,{aNoise:[r,1]})}const dt=[new V(.3,.55,.75).normalize(),new V(-.85,.35,-.2).normalize(),new V(.2,-.3,-.9).normalize(),new V(.1,.9,-.35).normalize()],ke=[.3,.3,.22,.18];function pt(e,t=3){const n=at(t),a=new Float32Array(e*3),l=new Float32Array(e*3),m=new Float32Array(e),i=new Float32Array(e),h=new Float32Array(e),c=new Float32Array(e),o=new V,u=new V,g=new V;for(let f=0;f<e;f++){o.set(n()*2-1,(n()*2-1)*.75,(n()*2-1)*1.25),o.lengthSq()<1e-4&&o.set(0,0,1),o.normalize(),g.set(n()*2-1,n()*2-1,n()*2-1),u.crossVectors(o,g).normalize();let b=n(),s=0;for(;s<3&&b>ke[s];)b-=ke[s],s++;const p=o.x>0?oe(.44,.2,o.x):Math.min(.5,(O.x-.08)/Math.max(.05,-o.x)),d=Math.max(.2,p*(.6+.5*n()));a.set([o.x,o.y,o.z],f*3),l.set([u.x,u.y,u.z],f*3),m[f]=n(),i[f]=s,h[f]=d,c[f]=.6+n()*.9}const r=new Pe;return r.setAttribute("position",new Y(new Float32Array(e*3),3)),r.setAttribute("aDir",new Y(a,3)),r.setAttribute("aPerp",new Y(l,3)),r.setAttribute("aSeed",new Y(m,1)),r.setAttribute("aState",new Y(i,1)),r.setAttribute("aLen",new Y(h,1)),r.setAttribute("aSize",new Y(c,1)),r.boundingSphere=new $e(O.clone(),.6),r}const Vt={core:[O.x,O.y,O.z],rim:[O.x+.06,O.y+.1,O.z+.05],oedema:[O.x+.12,O.y-.14,O.z+.12],infiltration:[O.x-.22,O.y+.2,O.z-.2],frontal:[.42,.4,.8],temporal:[.8,-.34,.2],cerebellum:[.36,-.7,-.74]};function ht({mobile:e}){return e?{hemi:5,cereb:4,stemRings:48,cells:1600}:{hemi:6,cereb:5,stemRings:72,cells:3200}}const ue={dark:{deep:"#020605",base:"#1b2c29",crown:"#3a5752",a:"#5EF2B8",b:"#4CC9F0",cut:"#12201f",cutLine:"#274a46"},light:{deep:"#5f6f6b",base:"#b9c9c4",crown:"#e6eeeb",a:"#0E9F6E",b:"#0B7FAB",cut:"#dfe8e5",cutLine:"#9fb5ae"}},xe=e=>new ae().setStyle(e,Je),Be="#include <clipping_planes_pars_vertex>",ve="#include <clipping_planes_pars_fragment>",Le=`
  attribute float aDepth;
  attribute float aRegion;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vObj;
  varying float vDepth;
  varying float vRegion;
  ${Be}
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = -mvPosition.xyz;
    vObj = position;
    vDepth = aDepth;
    vRegion = aRegion;
    gl_Position = projectionMatrix * mvPosition;
    #include <clipping_planes_vertex>
  }
`,gt=`
  uniform vec3 uDeep; uniform vec3 uBase; uniform vec3 uCrown; uniform vec3 uA; uniform vec3 uB;
  uniform vec3 uCut; uniform vec3 uCutLine;
  uniform float uOpacity; uniform float uTime; uniform float uScan; uniform float uRim;
  uniform float uHover; uniform float uSelect; uniform float uDim; uniform float uLight;
  varying vec3 vN; varying vec3 vV; varying vec3 vObj; varying float vDepth; varying float vRegion;
  ${ve}
  void main() {
    #include <clipping_planes_fragment>
    if (!gl_FrontFacing) {
      // the far wall seen through a cross-section: draw it flat, like a cut surface of solid tissue
      float lines = smoothstep(0.92, 1.0, abs(sin(vObj.y * 90.0))) * 0.35 + smoothstep(0.96, 1.0, abs(sin(vObj.z * 60.0))) * 0.2;
      gl_FragColor = vec4(mix(uCut, uCutLine, lines), 1.0);
      return;
    }
    vec3 N = normalize(vN);
    vec3 V = normalize(vV);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 2.2);
    float crown = 1.0 - vDepth;
    vec3 L1 = normalize(vec3(0.45, 0.8, 0.6));
    vec3 L2 = normalize(vec3(-0.6, -0.2, 0.4));
    float key = max(dot(N, L1), 0.0);
    float fill = max(dot(N, L2), 0.0);
    // folds: sulci go dark, gyral crowns catch a little light
    float cav = smoothstep(0.0, 0.85, crown);
    // cerebellar folia: fine leaves too small for the mesh, drawn per pixel
    if (vRegion > 3.5 && vRegion < 4.5) {
      vec3 q = vObj - vec3(0.0, -0.5, -0.5);
      float th = atan(q.y + 0.02, length(vec2(q.z, 0.55 * q.x))) * 1.6;
      float ph = th * 46.0;
      float fw = fwidth(ph) + 1e-4;
      float f = abs(sin(ph));
      crown *= mix(mix(0.3, 1.0, smoothstep(0.0, 0.6, f)), 0.8, smoothstep(0.6, 1.6, fw));
      cav = smoothstep(0.0, 0.85, crown);
    }
    vec3 col = mix(uDeep, uBase, cav);
    col = mix(col, uCrown, pow(crown, 2.0) * 0.6 * key);
    col *= 0.22 + 1.05 * key + 0.25 * fill;
    col *= mix(0.18, 1.0, cav);
    // contour at the sulcal walls: the gyri read as outlined ridges, like a surface scan
    float w = fwidth(vDepth) * 1.2 + 1e-4;
    float iso = 1.0 - smoothstep(0.0, w, abs(vDepth - 0.42));
    col += mix(uB, uA, 0.5) * iso * 0.16 * (1.0 - uLight * 0.6);
    // spec-like sheen on crowns
    vec3 H = normalize(L1 + V);
    col += uA * pow(max(dot(N, H), 0.0), 40.0) * 0.12 * crown;
    // accent rim, gradient from mint (top) to cyan (bottom)
    vec3 rimCol = mix(uB, uA, clamp(vObj.y * 0.7 + 0.5, 0.0, 1.0));
    col += rimCol * fres * uRim * (0.6 + 0.4 * crown);
    // scan sweep, front → back every ~6 s
    float zs = 1.35 - mod(uTime, 6.0) / 6.0 * 2.9;
    float band = exp(-pow((vObj.z - zs) / 0.022, 2.0));
    float trail = exp(-max(0.0, vObj.z - zs) * 9.0) * step(zs, vObj.z) * 0.18;
    col += rimCol * (band * 0.7 + trail * 0.35) * uScan * (0.4 + 0.6 * crown);
    // hover / selection highlight of a region
    float hov = 1.0 - step(0.5, abs(vRegion - uHover));
    float sel = 1.0 - step(0.5, abs(vRegion - uSelect));
    col += rimCol * (hov * 0.12 + sel * 0.2) * (0.3 + crown);
    col *= mix(1.0, 0.55, uDim * (1.0 - max(hov, sel)));
    float a = mix(uOpacity, 1.0, fres * 0.55);
    gl_FragColor = vec4(col, a);
  }
`;function yt(e="dark"){const t=ue[e]||ue.dark;return{uDeep:{value:new ae(t.deep)},uBase:{value:new ae(t.base)},uCrown:{value:new ae(t.crown)},uA:{value:new ae(t.a)},uB:{value:new ae(t.b)},uCut:{value:new ae(t.cut)},uCutLine:{value:new ae(t.cutLine)},uOpacity:{value:.96},uTime:{value:0},uScan:{value:1},uRim:{value:1},uHover:{value:-1},uSelect:{value:-1},uDim:{value:0},uLight:{value:e==="light"?1:0}}}function wt(e,t){const n=ue[t]||ue.dark;e.uDeep.value.set(n.deep),e.uBase.value.set(n.base),e.uCrown.value.set(n.crown),e.uA.value.set(n.a),e.uB.value.set(n.b),e.uCut.value.set(n.cut),e.uCutLine.value.set(n.cutLine),e.uLight.value=t==="light"?1:0}function bt(e,t=[]){const n=new se({vertexShader:Le,fragmentShader:`${ve}
void main(){
#include <clipping_planes_fragment>
gl_FragColor=vec4(0.0);}`,uniforms:{},colorWrite:!1,depthWrite:!0,transparent:!0,clipping:!0,clippingPlanes:t}),a=new se({vertexShader:Le,fragmentShader:gt,uniforms:e,transparent:!0,depthWrite:!1,depthFunc:Ue,side:be,clipping:!0,clippingPlanes:t});return{prepass:n,color:a}}const ye=`
  attribute float aNoise;
  varying vec3 vN; varying vec3 vV; varying float vNoise; varying vec3 vObj;
  ${Be}
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = -mvPosition.xyz;
    vNoise = aNoise; vObj = position;
    gl_Position = projectionMatrix * mvPosition;
    #include <clipping_planes_vertex>
  }
`,xt=`
  uniform float uTime; uniform float uHi;
  varying vec3 vN; varying vec3 vV; varying float vNoise; varying vec3 vObj;
  ${ve}
  void main() {
    #include <clipping_planes_fragment>
    vec3 N = normalize(vN); vec3 V = normalize(vV);
    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.0);
    float key = max(dot(N, normalize(vec3(0.4, 0.8, 0.6))), 0.0);
    vec3 col = mix(vec3(0.06, 0.02, 0.022), vec3(0.28, 0.09, 0.07), vNoise * vNoise) * (0.35 + 0.9 * key);
    col += vec3(0.6, 0.18, 0.12) * fres * 0.55;
    col += vec3(1.0, 0.55, 0.36) * uHi * (0.12 + fres * 0.5);
    gl_FragColor = vec4(col, 1.0);
  }
`,St=`
  uniform float uTime; uniform float uPulse; uniform float uHi; uniform float uXray;
  varying vec3 vN; varying vec3 vV; varying float vNoise; varying vec3 vObj;
  ${ve}
  void main() {
    #include <clipping_planes_fragment>
    vec3 N = normalize(vN); vec3 V = normalize(vV);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 1.6);
    float pulse = 0.82 + 0.18 * sin(uTime * 0.9) * uPulse;
    vec3 coral = vec3(1.0, 0.54, 0.36);
    vec3 amber = vec3(0.96, 0.70, 0.36);
    vec3 col = mix(coral, amber, smoothstep(0.3, 0.75, vNoise));
    float key = max(dot(N, normalize(vec3(0.4, 0.8, 0.6))), 0.0);
    // ring enhancement: bright at the grazing edges, see-through in the middle so the dark core shows
    vec3 c = col * (0.5 + 0.45 * key + 0.9 * fres) * pulse;
    float a = 0.07 + 0.93 * pow(fres, 1.35);
    if (!gl_FrontFacing) { c = col * 0.5 * pulse; a = 0.05 + 0.3 * pow(fres, 2.0); }
    c += col * uHi * 0.4;
    gl_FragColor = vec4(c, min(1.0, a + uHi * 0.15));
  }
`,Mt=`
  uniform float uTime; uniform float uXray; uniform float uPulse;
  varying vec3 vN; varying vec3 vV; varying float vNoise; varying vec3 vObj;
  void main() {
    vec3 N = normalize(vN); vec3 V = normalize(vV);
    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 1.4);
    float pulse = 0.8 + 0.2 * sin(uTime * 0.9) * uPulse;
    vec3 col = mix(vec3(1.0, 0.54, 0.36), vec3(0.96, 0.70, 0.36), vNoise);
    gl_FragColor = vec4(col * (0.25 + fres) * uXray * pulse, 1.0);
  }
`,At=`
  uniform float uOpacity; uniform float uHi; uniform float uTime;
  varying vec3 vN; varying vec3 vV; varying float vNoise; varying vec3 vObj;
  ${ve}
  void main() {
    #include <clipping_planes_fragment>
    vec3 N = normalize(vN); vec3 V = normalize(vV);
    float fres = pow(1.0 - abs(dot(N, V)), 2.0);
    vec3 cyan = vec3(0.30, 0.79, 0.94);
    float bands = 0.5 + 0.5 * sin(length(vObj - vec3(${O.x.toFixed(3)}, ${O.y.toFixed(3)}, ${O.z.toFixed(3)})) * 160.0 - uTime * 0.6);
    float a = (0.04 + 0.42 * fres + 0.05 * bands * fres) * uOpacity * (1.0 + uHi * 0.8);
    gl_FragColor = vec4(cyan * (0.8 + 0.4 * vNoise), a);
  }
`;function Ft(){return{uTime:{value:0},uPulse:{value:1},uXray:{value:.16},uHiCore:{value:0},uHiRim:{value:0},uHiOedema:{value:0},uOedema:{value:1}}}function zt(e,t=[]){const n={uTime:e.uTime,uPulse:e.uPulse,uXray:e.uXray},a=new se({vertexShader:ye,fragmentShader:xt,uniforms:{...n,uHi:e.uHiCore},clipping:!0,clippingPlanes:t}),l=new se({vertexShader:ye,fragmentShader:St,uniforms:{...n,uHi:e.uHiRim},side:be,transparent:!0,depthWrite:!1,clipping:!0,clippingPlanes:t}),m=new se({vertexShader:ye,fragmentShader:Mt,uniforms:n,transparent:!0,depthTest:!1,depthWrite:!1,blending:Fe}),i=new se({vertexShader:ye,fragmentShader:At,uniforms:{uOpacity:e.uOedema,uHi:e.uHiOedema,uTime:e.uTime},transparent:!0,depthWrite:!1,side:be,blending:Fe,clipping:!0,clippingPlanes:t});return{core:a,rim:l,xray:m,oedema:i}}const Ct=`
  attribute vec3 aDir; attribute vec3 aPerp; attribute float aSeed; attribute float aState; attribute float aLen; attribute float aSize;
  uniform float uTime; uniform float uSpeed; uniform float uCluster; uniform float uSize; uniform float uPR; uniform vec3 uCentre;
  uniform vec3 uStateDir[4]; uniform vec3 uStateCol[4]; uniform vec3 uSingle; uniform float uMode;
  varying float vAlpha; varying vec3 vCol;
  void main() {
    int st = int(aState + 0.5);
    vec3 sd = uStateDir[0]; vec3 sc = uStateCol[0];
    if (st == 1) { sd = uStateDir[1]; sc = uStateCol[1]; }
    else if (st == 2) { sd = uStateDir[2]; sc = uStateCol[2]; }
    else if (st == 3) { sd = uStateDir[3]; sc = uStateCol[3]; }
    vec3 dir = normalize(mix(aDir, sd, uCluster * 0.55));
    float s = fract(aSeed + uTime * uSpeed * (0.6 + 0.4 * aSize));
    float r = mix(0.1, aLen, pow(s, 0.8));
    vec3 p = uCentre + dir * r + aPerp * (s * s) * 0.09 * aLen / 0.3;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aSize * uPR * (1.0 / max(0.2, -mv.z)) * (1.0 - 0.4 * s);
    vAlpha = smoothstep(0.0, 0.06, s) * pow(1.0 - s, 1.35);
    vCol = mix(uSingle, sc, uMode);
  }
`,Nt=`
  uniform float uOpacity;
  varying float vAlpha; varying vec3 vCol;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vCol * (0.6 + 0.8 * core * core), vAlpha * core * uOpacity);
  }
`;function Dt(e=1){const t={uTime:{value:0},uSpeed:{value:.035},uCluster:{value:0},uSize:{value:11},uPR:{value:e},uCentre:{value:O.clone()},uMode:{value:0},uOpacity:{value:1},uSingle:{value:xe("#FFB08A")},uStateCol:{value:We.map(xe)},uStateDir:{value:[]}};return new se({vertexShader:Ct,fragmentShader:Nt,uniforms:t,transparent:!0,depthWrite:!1,blending:Fe})}function Ot(e){const t={depthWrite:!1,depthTest:!1,colorWrite:!1,stencilWrite:!0,stencilFunc:Ze,clippingPlanes:e,transparent:!0},n=new ze({...t,side:qe});n.stencilFail=n.stencilZFail=n.stencilZPass=Xe;const a=new ze({...t,side:Ke});return a.stencilFail=a.stencilZFail=a.stencilZPass=Ye,{back:n,front:a}}const Tt=`
  varying vec3 vW;
  void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
`,Rt=`
  uniform vec3 uColor; uniform vec3 uLine; uniform float uAlpha; uniform float uKind; uniform float uTime;
  varying vec3 vW;
  void main() {
    vec3 c = uColor;
    if (uKind < 0.5) {
      // tissue: faint scan grid
      vec2 g = abs(fract(vW.yz * 20.0) - 0.5);
      float line = 1.0 - smoothstep(0.0, 0.035, min(g.x, g.y));
      c = mix(uColor, uLine, line * 0.55);
    } else if (uKind < 1.5) {
      // oedema: soft diagonal hatching
      float h = smoothstep(0.35, 0.5, abs(fract((vW.y + vW.z) * 60.0) - 0.5));
      c = uColor * (0.75 + 0.35 * h);
    } else if (uKind < 2.5) {
      // enhancing rim: coral → amber mottling, slow pulse
      float mott = 0.5 + 0.5 * sin(vW.y * 70.0 + sin(vW.z * 55.0) * 2.0);
      c = mix(uColor, uLine, mott * 0.6) * (0.86 + 0.1 * sin(uTime * 0.9));
    } else {
      float mott = 0.5 + 0.5 * sin(vW.y * 90.0 + sin(vW.z * 80.0) * 2.5);
      c = uColor * (0.7 + 0.5 * mott);
    }
    gl_FragColor = vec4(c, uAlpha);
  }
`;function we({color:e,line:t=e,alpha:n=1,kind:a=0,time:l}){const m=new se({vertexShader:Tt,fragmentShader:Rt,uniforms:{uColor:{value:xe(e)},uLine:{value:xe(t)},uAlpha:{value:n},uKind:{value:a},uTime:l||{value:0}},transparent:!0,depthWrite:!0,depthTest:!1,side:be,stencilWrite:!0,stencilRef:0,stencilFunc:Ge});return m.stencilFail=Me,m.stencilZFail=Me,m.stencilZPass=Me,m}function kt({mobile:e=!1,theme:t="dark",pixelRatio:n=1}={}){const a=ht({mobile:e}),l=new Qe(new V(-1,0,0),10),m=[l],i=yt(t),h=bt(i,m),c=Ft(),o=zt(c,m),u=Dt(n);u.uniforms.uStateDir.value=dt.map(y=>y.clone());const g=new Ae;g.name="brain";const r=[],f=(y,C,x)=>{const k=new X(y,h.prepass);k.renderOrder=2,k.name=`${C}-depth`;const L=new X(y,h.color);return L.renderOrder=3,L.name=C,k.userData.layer=x,L.userData.layer=x,g.add(k,L),r.push(k,L),L},b=f(ge(a.hemi,1),"hemisphere-right","cortex"),s=f(ge(a.hemi,-1),"hemisphere-left","cortex"),p=f(Te(a.cereb),"cerebellum","hind"),d=f(Re(a.stemRings),"brainstem","hind"),v=ce(e?3:4,.068,.3,2,21,[1,.92,1.1],2),S=ce(e?4:5,.12,.22,2.2,22,[1,.9,1.12],2),j=ce(e?3:4,.215,.26,1.6,23,[.95,.85,1.25]),F=new X(v,o.core);F.renderOrder=0,F.name="core";const A=new X(S,o.rim);A.renderOrder=0,A.name="rim";const z=new X(S,o.xray);z.renderOrder=4,z.name="rim-xray";const N=new X(j,o.oedema);N.renderOrder=1,N.name="oedema";const D=new et(pt(a.cells),u);D.renderOrder=1,D.name="cells",D.frustumCulled=!1,F.userData.layer="core",A.userData.layer="rim",z.userData.layer="rim",N.userData.layer="oedema",D.userData.layer="cells",g.add(F,A,N,D,z);const B=new Ae;B.visible=!1,B.name="caps";const _=new tt(3.2,3.2).rotateY(Math.PI/2),H=ue[t]||ue.dark,ee=[{meshes:[b,s,p],mat:we({color:H.cut,line:H.cutLine,kind:0}),layer:"cortex"},{meshes:[N],mat:we({color:"#1d5a70",alpha:.8,kind:1}),layer:"oedema"},{meshes:[A],mat:we({color:"#E8764F",line:"#F5B35C",kind:2,time:c.uTime}),layer:"rim"},{meshes:[F],mat:we({color:"#3a1511",kind:3}),layer:"core"}],I=[];let G=10;for(const y of ee){const C=Ot(m);for(const k of y.meshes){const L=new X(k.geometry,C.back);L.renderOrder=G;const P=new X(k.geometry,C.front);P.renderOrder=G+1,L.userData.layer=y.layer,P.userData.layer=y.layer,B.add(L,P),I.push(L,P)}const x=new X(_,y.mat);x.renderOrder=G+2,x.userData.layer=y.layer,x.userData.cap=!0,B.add(x),I.push(x),G+=3}g.add(B);const te=[...r,F,A,z,N,D,...I],ne=new ze({visible:!1}),E=(y,C,x)=>{const k=new X(y,ne);return k.userData={key:C,layer:x},k},q=[E(ge(3,1),"cerebrum","cortex"),E(ge(3,-1),"cerebrum","cortex"),E(Te(3),"cerebellum","hind"),E(Re(16,12),"stem","hind"),E(ce(2,.215,.26,1.6,23,[.95,.85,1.25]),"oedema","oedema"),E(ce(2,.12,.22,2.2,22,[1,.9,1.12],2),"rim","rim"),E(ce(2,.068,.3,2,21,[1,.92,1.1],2),"core","core")],Z=new Ae;Z.name="pick",Z.add(...q),g.add(Z);const $={cortex:!0,hind:!0,oedema:!0,rim:!0,core:!0,cells:!0},U=new ot,M=["frontal","parietal","temporal","occipital"],R=[b,s,p,d,F,A,N];let de=0;for(const y of[b,s,p,d,F,A,N])de+=y.geometry.index.count/3;return{group:g,clipPlane:l,cortexUniforms:i,tumourUniforms:c,cellsMaterial:u,pickable:R,triangles:de,lod:a,meshes:{right:b,left:s,cereb:p,stem:d,core:F,rim:A,xray:z,oedema:N,cells:D},setTime(y){i.uTime.value=y,c.uTime.value=y,u.uniforms.uTime.value=y},setLayer(y,C){$[y]=C;for(const x of te)x.userData.layer===y&&(x.visible=C)},pick(y,C){U.setFromCamera(y,C);const x=l.constant,k=U.intersectObjects(q.filter(P=>$[P.userData.layer]),!1).filter(P=>P.point.x<=x+.001);if(!k.length)return null;for(const P of["core","rim","oedema"])if(k.some(Se=>Se.object.userData.key===P))return P;const L=k[0];if(L.object.userData.key==="cerebrum"){const P=L.point.clone();return g.worldToLocal(P),M[vt(P.x,P.y,P.z)]}return L.object.userData.key},setTheme(y){wt(i,y)},setCut(y){const C=y!=null;l.constant=C?y:10,B.visible=C;for(const x of I)x.userData.cap&&(x.position.x=C?y:0);z.material.visible=!C,u.depthTest=!C,D.renderOrder=C?40:1},setRegionHighlight(y,C){i.uHover.value=y??-1,i.uSelect.value=C??-1},setTumourHighlight(y){c.uHiCore.value=y==="core"?1:0,c.uHiRim.value=y==="rim"?1:0,c.uHiOedema.value=y==="oedema"?1:0},dispose(){for(const y of te)y.geometry.dispose();for(const y of[h.prepass,h.color,o.core,o.rim,o.xray,o.oedema,u])y.dispose();for(const y of I)y.material.dispose();_.dispose();for(const y of q)y.geometry.dispose();ne.dispose()}}}const Bt=K.forwardRef(function({mobile:t=!1,theme:n="dark",still:a=!1,children:l},m){const i=Oe(u=>u.gl),h=Oe(u=>u.viewport.dpr),c=K.useMemo(()=>kt({mobile:t,theme:n,pixelRatio:i.getPixelRatio()}),[t]);K.useEffect(()=>()=>c.dispose(),[c]),K.useEffect(()=>{c.setTheme(n)},[c,n]),K.useEffect(()=>{c.cellsMaterial.uniforms.uPR.value=h},[c,h]),K.useImperativeHandle(m,()=>c,[c]),K.useEffect(()=>{a&&c.setTime(1.2)},[c,a]);const o=K.useRef(!1);return je(u=>{a||c.setTime(u.clock.elapsedTime),o.current||(o.current=!0,requestAnimationFrame(()=>{document.documentElement.dataset.brain="ready",document.documentElement.dataset.brainTris=String(c.triangles)}))}),K.useEffect(()=>()=>{delete document.documentElement.dataset.brain},[]),ie.jsx("primitive",{object:c.group,children:l})});function Ht({at:e,text:t,side:n="right",on:a=!0,onClick:l,selected:m=!1,watch:i,interactive:h=!1}){const c=K.useRef(null);return je(()=>{if(!i||!c.current)return;const o=!!i();c.current.classList.contains("on")!==o&&c.current.classList.toggle("on",o)}),ie.jsx(nt,{position:e,zIndexRange:[30,0],style:{pointerEvents:h?"auto":"none"},children:ie.jsxs("div",{ref:c,className:`blabel ${n}${a&&!i?" on":""}${m?" sel":""}`,"aria-hidden":h?void 0:"true",children:[ie.jsx("i",{className:"bl-dot"}),ie.jsx("i",{className:"bl-line"}),h?ie.jsx("button",{type:"button",className:"bl-chip",onClick:l,"aria-pressed":m,tabIndex:a?0:-1,children:t}):ie.jsx("span",{className:"bl-chip",children:t})]})})}export{Vt as A,Bt as B,Ht as L,O as T};
