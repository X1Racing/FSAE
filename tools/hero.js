const C=require('../src/core.js'),fs=require('fs');
const P=eval('('+fs.readFileSync(__dirname + '/gen_step.js','utf8').match(/const P=(\{.*\});/)[1]+')');
const M=C.build(P);
const phi=-38*Math.PI/180, tilt=24*Math.PI/180;
const pr=p=>{const x=p.x*Math.cos(phi)-p.y*Math.sin(phi), y=p.x*Math.sin(phi)+p.y*Math.cos(phi);
 const yy=y*Math.cos(tilt)-p.z*Math.sin(tilt)*0, z=p.z*Math.cos(tilt)+y*Math.sin(tilt); return {u:x, v:-z, d:y};};
const mir=p=>({x:p.x,y:-p.y,z:p.z});
const items=[];
const COL={A:'#E07A2E',B:'#7FB0DE',C:'#A7B3BE',arm:'#86CFA3',link:'#86CFA3'};
const seg=(a,b,col,w)=>{const A=pr(a),B=pr(b);items.push({d:(A.d+B.d)/2,s:`<line x1="${A.u.toFixed(1)}" y1="${A.v.toFixed(1)}" x2="${B.u.toFixed(1)}" y2="${B.v.toFixed(1)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`});};
M.members.forEach(m=>seg(M.N[m.a],M.N[m.b],COL[m.cat],m.cat==='A'?30:25.4));
M.hoops.forEach(h=>{for(let i=0;i<h.pts.length-1;i++)seg(M.N[h.pts[i]],M.N[h.pts[i+1]],COL.A,26)});
M.comp.susp.forEach(s=>{seg(s.a,s.b,COL.arm,15);seg(mir(s.a),mir(s.b),COL.arm,15)});
// wheels
const {Rt,W}=M.comp;
M.comp.wheels.forEach(w=>{for(const off of [-W.w/2,W.w/2]){const s=w.spin;const e1={x:1,y:0,z:0},e2={x:s.y*0-s.z*0,y:0,z:1};
 const pts=[];for(let i=0;i<48;i++){const t=i/48*2*Math.PI;pts.push(pr({x:w.c.x+Rt*Math.cos(t),y:w.c.y+s.y*off,z:w.c.z+Rt*Math.sin(t)}))}
 const d=pts.reduce((a,p)=>a+p.d,0)/pts.length;
 items.push({d:d+ (off>0?1:0),s:`<polygon points="${pts.map(p=>p.u.toFixed(1)+','+p.v.toFixed(1)).join(' ')}" fill="#0E1317" stroke="#4A5763" stroke-width="10" fill-opacity="0.6"/>`});}});
// driver head & torso hint
const d=M.comp.driver;
items.sort((a,b)=>b.d-a.d);
const all=[];M.members.forEach(m=>{all.push(pr(M.N[m.a]),pr(M.N[m.b]))});M.comp.wheels.forEach(w=>{all.push(pr({x:w.c.x-Rt,y:w.c.y,z:0}),pr({x:w.c.x+Rt,y:w.c.y,z:2*Rt}))});
const us=all.map(p=>p.u),vs=all.map(p=>p.v);const pad=180;
const x0=Math.min(...us)-pad,x1=Math.max(...us)+pad,y0=Math.min(...vs)-pad,y1=Math.max(...vs)+pad;
const svg=`<svg class="hero-frame" viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${(x1-x0).toFixed(0)} ${(y1-y0).toFixed(0)}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Isometric view of the generated FSAE tube frame with suspension and wheels">${items.map(i=>i.s).join('')}</svg>`;
fs.writeFileSync(__dirname + '/../docs/hero.svg',svg);console.log(svg.length,(x1-x0).toFixed(0),(y1-y0).toFixed(0));
