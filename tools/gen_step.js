// Writes one STEP file per part plus the frame assembly to out/ from the default design.
// usage (repo root): node tools/gen_step.js
const C=require('../src/core.js'),fs=require('fs');fs.mkdirSync('out',{recursive:true});
const P={rearShockModel:'dhx-230x65',wheelbase:1650,fhGap:170,trackF:1220,trackR:1180,wheel:'13',rideH:40,backAngle:30,legReach:960,wheelReach:470,colAngle:28,driverGap:0,wheelClr:60,hoopTopClr:50,fhTopHW:230,pinionFwd:60,sisZ:300,chainCD:300,battLoc:'rear',gainF:'med',rcF:30,camF:-1,casterF:5,kpi:8,kpOff:55,bjSpan:220,spreadF:120,hwF:240,tieZF:-90,armF:85,gainR:'med',rcR:50,camR:-0.5,spreadR:170,hwR:225,tieZR:-60,maxSteer:32,rackCF:89,ackTarget:100,rackMode:'auto',rackWidth:410,rackStroke:90,rodSize:'3/8',rodOff:38,bjOff:32,shockLenF:200,shockLenR:220,mrF:0.35,mrR:0.5,shockStroke:57,springLen:100,wheelInset:22,rotorD:220,rodMis:22,mat:'4130',std:'imperial'};
const M=C.build(P);
let n=0;for(const p of M.parts){for(const f of C.stepFilesForPart(M,p)){fs.writeFileSync('out/'+f.name.replace(/[^A-Za-z0-9-]+/g,'_')+'.step',f.text);n++}}
const t=Date.now();const a=C.stepFrameAssembly(M);fs.writeFileSync('out/_frame.step',a);console.log('files',n,'assembly bytes',a.length,'ms',Date.now()-t);
