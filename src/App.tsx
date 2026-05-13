import { useState, useMemo, useRef, useEffect } from "react";

// ─── CrankyMTB Palette ────────────────────────────────────────────────────────
// White base · charcoal structure · cyan-teal accent (from the bike/goggles)
const C = {
  bgPage:   "#f0f2f4",
  bgCard:   "#ffffff",
  bgMuted:  "#f7f8f9",
  border:   "#e2e4e8",
  borderMid:"#c8ccd4",
  txt:      "#1a1a1a",
  txtMid:   "#4a4a52",
  txtDim:   "#9a9aaa",

  // Hero accent — cyan-teal from the bike
  teal:     "#2ec4b6",
  tealDark: "#1a9e92",
  tealLight:"#e0f7f5",
  tealMid:  "#a8e8e2",

  // Supporting data colours — used only in charts/gauges/diagram
  blue:     "#3b82f6",
  blueSoft: "#dbeafe",
  green:    "#22c55e",
  greenSoft:"#dcfce7",
  red:      "#ef4444",
  redSoft:  "#fee2e2",
  amber:    "#f59e0b",
  amberSoft:"#fef3c7",
  purple:   "#8b5cf6",

  // Bike B overlay
  bikeB:    "#f97316",
};

const ST_COLOR = { published:"#22c55e", calculated:"#3b82f6", estimated:"#f59e0b", edited:"#8b5cf6", missing:"#9ca3af" };
const ST_SHORT = { published:"PUB", calculated:"CALC", estimated:"EST", edited:"EDIT", missing:"—" };
const ST_SCORE = { published:4, calculated:3, estimated:2, edited:2, missing:0 };

// Lemond method (×0.883), slightly reduced for MTB saddle position
const calcSaddleHeight = inseamCm => Math.round(inseamCm * 8.83);

const DEF_RIDER = {
  heightCm:176, inseamCm:76, armSpanCm:176, weightKg:80,
  saddleHeightMm: calcSaddleHeight(76),  // auto from inseam
  crankLengthMm:155,
};
const DEF_COCKPIT = {
  stemLength:{value:35,status:"estimated"}, stemAngle:{value:-6,status:"estimated"},
  spacerStack:{value:20,status:"estimated"}, barRise:{value:20,status:"estimated"},
  barWidth:{value:800,status:"estimated"}, barBacksweep:{value:9,status:"estimated"},
  barUpsweep:{value:5,status:"estimated"}, barRoll:{value:0,status:"estimated"},
};

const INIT_DB = [
  { id:"zendit-rr-ml", brand:"Mondraker", model:"Zendit RR", year:2027, size:"M/L",
    category:"eMTB Enduro", motor:"DJI Avinox", wheelSetup:"29/27.5", verified:false,
    confidenceNote:"Demo values. Replace with verified manufacturer geometry.",
    fields:{ reach:{value:470,status:"estimated"}, stack:{value:650,status:"estimated"},
      headAngle:{value:63.5,status:"estimated"}, headTubeLength:{value:120,status:"estimated"},
      effectiveSeatTubeAngle:{value:77.5,status:"estimated"}, actualSeatTubeAngle:{value:null,status:"missing"},
      seatTubeLength:{value:420,status:"estimated"}, chainstay:{value:445,status:"estimated"},
      wheelbase:{value:1280,status:"estimated"}, bbHeight:{value:350,status:"estimated"},
      bbDrop:{value:25,status:"estimated"}, forkTravel:{value:170,status:"estimated"},
      forkOffset:{value:44,status:"estimated"}, headset:{value:15,status:"estimated"}, anglesetOffset:{value:0,status:"estimated"},
      frontWheelDiameter:{value:749,status:"estimated"}, rearWheelDiameter:{value:715,status:"estimated"},
      bikeWeight:{value:25,status:"estimated"} }},
  { id:"crafty-2021-m", brand:"Mondraker", model:"Crafty", year:2021, size:"M",
    category:"eMTB Enduro", motor:"Bosch CX", wheelSetup:"29/29", verified:false,
    confidenceNote:"Demo values. Useful as old-bike comparison baseline.",
    fields:{ reach:{value:455,status:"estimated"}, stack:{value:623,status:"estimated"},
      headAngle:{value:65.5,status:"estimated"}, headTubeLength:{value:110,status:"estimated"},
      effectiveSeatTubeAngle:{value:76,status:"estimated"}, actualSeatTubeAngle:{value:null,status:"missing"},
      seatTubeLength:{value:420,status:"estimated"}, chainstay:{value:455,status:"estimated"},
      wheelbase:{value:1260,status:"estimated"}, bbHeight:{value:350,status:"estimated"},
      bbDrop:{value:25,status:"estimated"}, forkTravel:{value:160,status:"estimated"},
      forkOffset:{value:44,status:"estimated"}, headset:{value:15,status:"estimated"}, anglesetOffset:{value:0,status:"estimated"},
      frontWheelDiameter:{value:749,status:"estimated"}, rearWheelDiameter:{value:749,status:"estimated"},
      bikeWeight:{value:24,status:"estimated"} }},
  { id:"orbea-wild-m", brand:"Orbea", model:"Wild", year:2023, size:"M",
    category:"eMTB Enduro", motor:"Bosch CX", wheelSetup:"29/29", verified:false,
    confidenceNote:"Demo values.", fields:{
      reach:{value:455,status:"estimated"}, stack:{value:636,status:"estimated"},
      headAngle:{value:64,status:"estimated"}, headTubeLength:{value:115,status:"estimated"},
      effectiveSeatTubeAngle:{value:77.5,status:"estimated"}, actualSeatTubeAngle:{value:null,status:"missing"},
      seatTubeLength:{value:415,status:"estimated"}, chainstay:{value:448,status:"estimated"},
      wheelbase:{value:1255,status:"estimated"}, bbHeight:{value:350,status:"estimated"},
      bbDrop:{value:25,status:"estimated"}, forkTravel:{value:160,status:"estimated"},
      forkOffset:{value:44,status:"estimated"}, headset:{value:15,status:"estimated"}, anglesetOffset:{value:0,status:"estimated"},
      frontWheelDiameter:{value:749,status:"estimated"}, rearWheelDiameter:{value:749,status:"estimated"},
      bikeWeight:{value:23.5,status:"estimated"} }},
  { id:"amflow-pl-m", brand:"Amflow", model:"PL Carbon Pro", year:2025, size:"M",
    category:"Light eMTB", motor:"DJI Avinox", wheelSetup:"29/29", verified:false,
    confidenceNote:"Demo values.", fields:{
      reach:{value:452,status:"estimated"}, stack:{value:628,status:"estimated"},
      headAngle:{value:64.5,status:"estimated"}, headTubeLength:{value:105,status:"estimated"},
      effectiveSeatTubeAngle:{value:77,status:"estimated"}, actualSeatTubeAngle:{value:null,status:"missing"},
      seatTubeLength:{value:420,status:"estimated"}, chainstay:{value:445,status:"estimated"},
      wheelbase:{value:1245,status:"estimated"}, bbHeight:{value:348,status:"estimated"},
      bbDrop:{value:27,status:"estimated"}, forkTravel:{value:160,status:"estimated"},
      forkOffset:{value:44,status:"estimated"}, headset:{value:15,status:"estimated"}, anglesetOffset:{value:0,status:"estimated"},
      frontWheelDiameter:{value:749,status:"estimated"}, rearWheelDiameter:{value:749,status:"estimated"},
      bikeWeight:{value:20,status:"estimated"} }},
];

const GEO_FIELDS = [
  ["reach","Reach","mm",1],["stack","Stack","mm",1],
  ["headTubeLength","Head tube","mm",1],["headAngle","Head angle","°",0.1],
  ["effectiveSeatTubeAngle","Eff. STA","°",0.1],["actualSeatTubeAngle","Actual STA","°",0.1],
  ["seatTubeLength","Seat tube","mm",1],["chainstay","Chainstay","mm",1],
  ["wheelbase","Wheelbase","mm",1],["bbHeight","BB height","mm",1],
  ["bbDrop","BB drop","mm",1],["forkTravel","Fork travel","mm",1],
  ["forkOffset","Fork offset","mm",1],["headset","Headset stack","mm",1],
  ["anglesetOffset","Angleset offset","°",0.5],
  ["frontWheelDiameter","Front Ø","mm",1],["rearWheelDiameter","Rear Ø","mm",1],
  ["bikeWeight","Bike weight","kg",0.1],
];
const WHEEL_SIZES = [
  { label: '29"',             mm: 749 },
  { label: '27.5" / 650b',   mm: 699 },
  { label: '26"',             mm: 660 },
  { label: '32" (emerging)',  mm: 824, note: 'Estimated — standard not yet finalised' },
];

const COCKPIT_FIELDS = [
  ["stemLength","Stem length","mm",1],["stemAngle","Stem angle","°",1],
  ["spacerStack","Spacer stack","mm",1],["barRise","Bar rise","mm",1],
  ["barWidth","Bar width","mm",5],["barBacksweep","Backsweep","°",1],
  ["barUpsweep","Upsweep","°",1],["barRoll","Bar roll","°",1],
];

// ─── Utils ────────────────────────────────────────────────────────────────────
const cl  = o => JSON.parse(JSON.stringify(o));
const toR = d => d * Math.PI / 180;
const toD = r => r * 180 / Math.PI;
const num = (v,fb=0) => { const x=Number(v); return isFinite(x)?x:fb; };
const clp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const fv  = (bike,k,fb=0) => num(bike.fields[k]?.value,fb);

function makeBike(rec) {
  return { ...cl(rec), fields:{ ...cl(rec.fields), ...cl(DEF_COCKPIT) }};
}
function makeEmpty() {
  const f={};
  [...GEO_FIELDS,...COCKPIT_FIELDS].forEach(([k])=>{ f[k]={value:null,status:"missing"}; });
  return { id:`custom-${Date.now()}`, brand:"Custom", model:"Bike",
    year:new Date().getFullYear(), size:"M", category:"Trail", motor:"—",
    wheelSetup:"29/29", verified:false, confidenceNote:"Manually entered.",
    fields:{ ...f, forkOffset:{value:44,status:"estimated"},
      frontWheelDiameter:{value:749,status:"estimated"}, rearWheelDiameter:{value:749,status:"estimated"},
      bikeWeight:{value:24,status:"estimated"}, headset:{value:15,status:"estimated"}, anglesetOffset:{value:0,status:"estimated"}, ...cl(DEF_COCKPIT) }};
}

// ─── Unit conversion ──────────────────────────────────────────────────────────
const toImperial = {
  height:  cm  => `${Math.floor(cm/30.48)}'${Math.round((cm%30.48)/2.54)}"`,
  lengthCm: cm => (cm/2.54).toFixed(1),   // cm → inches
  weight:  kg  => (kg*2.205).toFixed(1),  // kg → lbs
};
const fromImperial = {
  lengthCm: inch => inch * 2.54,
  weight:   lbs  => lbs / 2.205,
};
function deriveBike(raw) {
  const bike=cl(raw); const f=bike.fields;
  const rR=num(f.rearWheelDiameter?.value,749)/2;
  if(!f.bbHeight?.value && f.bbDrop?.value!=null)
    f.bbHeight={value:rR-num(f.bbDrop.value),status:"calculated"};
  if(!f.bbDrop?.value && f.bbHeight?.value!=null)
    f.bbDrop={value:rR-num(f.bbHeight.value),status:"calculated"};
  const bbH=num(f.bbHeight?.value,340), cs=num(f.chainstay?.value,445);
  const rcH=Math.sqrt(Math.max(0,cs**2-(bbH-rR)**2));
  f.rearCentreHoriz={value:rcH,status:"calculated"};
  f.frontCentre={value:num(f.wheelbase?.value,1260)-rcH,status:"calculated"};
  return bike;
}

function hardPoints(raw, rider) {
  const bike=deriveBike(raw);
  const rR=fv(bike,"rearWheelDiameter",749)/2, fR=fv(bike,"frontWheelDiameter",749)/2;
  const wb=fv(bike,"wheelbase",1260), bbH=fv(bike,"bbHeight",340);
  const cs=fv(bike,"chainstay",445), reach=fv(bike,"reach",455), stack=fv(bike,"stack",630);
  const ha      = fv(bike,"headAngle",64);
  const haOffset= fv(bike,"anglesetOffset",0);
  const haEff   = ha + haOffset;  // effective HA — fork/steerer run at this angle
  const htl     = fv(bike,"headTubeLength",115);
  const hs      = fv(bike,"headset",15);
  const ESTA=fv(bike,"effectiveSeatTubeAngle",76.5);
  const ASTA=bike.fields.actualSeatTubeAngle?.value??ESTA;
  const stl=fv(bike,"seatTubeLength",420);
  const rearAxle={x:0,y:rR}, frontAxle={x:wb,y:fR};
  const bbX=Math.sqrt(Math.max(0,cs**2-(bbH-rR)**2));
  const bb={x:bbX,y:bbH};
  const headTop={x:bb.x+reach,y:bb.y+stack};
  // Head tube uses frame HA — fixed geometry of the frame
  const headBottom={x:headTop.x+htl*Math.cos(toR(ha)),y:headTop.y-htl*Math.sin(toR(ha))};
  // Steerer and fork use effective HA (frame HA ± angleset offset)
  const steererTop={x:headTop.x-hs*Math.cos(toR(haEff)),y:headTop.y+hs*Math.sin(toR(haEff))};
  const seatTop={x:bb.x-stl*Math.cos(toR(ASTA)),y:bb.y+stl*Math.sin(toR(ASTA))};
  // Seatstay junction — connects to seat tube slightly below the top tube junction
  const ssJctFrac = 0.85;
  const seatStayJct={
    x: bb.x - stl*ssJctFrac*Math.cos(toR(ASTA)),
    y: bb.y + stl*ssJctFrac*Math.sin(toR(ASTA)),
  };
  const sh=rider.saddleHeightMm;
  const saddle={x:bb.x-sh/Math.tan(toR(ESTA)),y:bb.y+sh};
  const stemL=fv(bike,"stemLength",35), stemA=fv(bike,"stemAngle",-6);
  const spacer=fv(bike,"spacerStack",20), barRise=fv(bike,"barRise",20);
  const halfW=fv(bike,"barWidth",770)/2;
  const bsw=fv(bike,"barBacksweep",9), busw=fv(bike,"barUpsweep",5);
  const stemClamp={x:steererTop.x-spacer*Math.cos(toR(haEff)),y:steererTop.y+spacer*Math.sin(toR(haEff))};
  const stemEnd={x:stemClamp.x+stemL*Math.cos(toR(stemA)),y:stemClamp.y+stemL*Math.sin(toR(stemA))};
  const grip={x:stemEnd.x-halfW*(1-Math.cos(toR(bsw))),y:stemEnd.y+barRise+halfW*Math.sin(toR(busw))};
  const pedal={x:bb.x+rider.crankLengthMm,y:bb.y};
  const trail=(fR*Math.cos(toR(haEff))-fv(bike,"forkOffset",44))/Math.sin(toR(haEff));
  return { bike,rR,fR,rearAxle,frontAxle,bb,headTop,headBottom,steererTop,
    stemClamp,stemEnd,seatTop,seatStayJct,saddle,grip,pedal,
    rearCP:{x:0,y:0},frontCP:{x:wb,y:0},rcH:bb.x,fcH:wb-bb.x,trail };
}

function calcMetrics(raw, rider) {
  const hp=hardPoints(raw,rider);
  const gX=hp.grip.x-hp.bb.x, gY=hp.grip.y-hp.bb.y;
  const rad=Math.sqrt(gX**2+gY**2), raad=toD(Math.atan2(gY,gX));
  const bikeWt=fv(hp.bike,"bikeWeight",24), sysWt=rider.weightKg+bikeWt;
  const wb=fv(hp.bike,"wheelbase",1260), bFB=hp.rcH/wb;
  const rFBS=clp(0.42+(gX-455)/900-(gY-680)/1800,0.36,0.58);
  const fStand=(bikeWt*bFB+rider.weightKg*rFBS)/sysWt;
  const rFBSeat=clp(0.38+(gX-455)/1600-((hp.saddle.x-hp.bb.x)+180)/1800,0.3,0.54);
  const fSeat=(bikeWt*bFB+rider.weightKg*rFBSeat)/sysWt;
  const sh=rider.saddleHeightMm, cl2=rider.crankLengthMm;
  const kneeA=180-toD(Math.acos(clp((sh**2+cl2**2-(sh-cl2)**2)/(2*sh*cl2),-1,1)));
  return {
    hp,gX,gY,rad,raad,trail:hp.trail,sysWt,bikeWt,riderWt:rider.weightKg,
    seatedReach:hp.grip.x-hp.saddle.x,saddleSetback:hp.bb.x-hp.saddle.x,
    fStandPct:fStand*100,rStandPct:(1-fStand)*100,
    fStandKg:sysWt*fStand,rStandKg:sysWt*(1-fStand),
    fSeatPct:fSeat*100,fSeatKg:sysWt*fSeat,frRatio:hp.fcH/hp.rcH,
    // Roominess: neutral for a 176cm rider is ~475mm Grip X after typical cockpit.
    // ±60mm from neutral = 0–100%. Tighter window correctly shows 210cm rider as very cramped on a medium bike.
    roomScore:clp(((gX - (((rider.heightCm/176)*0.60 + (rider.armSpanCm/176)*0.40) * 475))/60)*50+50, 0, 100),
    uprScore: clp(((raad-51)/8)*100,0,100),
    trailScore:clp(((hp.trail-105)/35)*100,0,100),
    frontScore:clp(((fStand*100-38)/14)*100,0,100),
    // ── Six-axis handling breakdown ─────────────────────────────────────────────
    handling:(()=>{
      const haEff= fv(hp.bike,"headAngle",64) + fv(hp.bike,"anglesetOffset",0);
      const wb   = fv(hp.bike,"wheelbase",1260);
      const cs   = fv(hp.bike,"chainstay",445);
      const fo   = fv(hp.bike,"forkOffset",44);
      const fWD  = fv(hp.bike,"frontWheelDiameter",749);
      const rWD  = fv(hp.bike,"rearWheelDiameter",749);
      const ESTA = fv(hp.bike,"effectiveSeatTubeAngle",76.5);
      const bbH  = hp.bb.y;
      const wbRef   = (rider.heightCm/176)*1200;
      const reachRef= (rider.heightCm/176)*455;
      const avgWhl  = fWD*0.65 + rWD*0.35;
      const tr      = hp.trail;
      const rearPct = 1 - fStand;

      return {
        // High-speed stability: slack HA, long wb, high trail, 29er
        hiSpeed: clp((
          clp((67-haEff)/4,0,1)*0.38 + clp((wb-wbRef)/120,0,1)*0.27 +
          clp((tr-100)/45,0,1)*0.22  + clp((avgWhl-699)/50,0,1)*0.13
        )*100,0,100),

        // Corner agility: steep HA, short cs, shorter wb, 27.5
        agility: clp((
          clp((haEff-63)/4,0,1)*0.35      + clp(1-(cs-415)/50,0,1)*0.30 +
          clp(1-(wb-wbRef)/120,0,1)*0.20  + clp(1-(avgWhl-699)/50,0,1)*0.15
        )*100,0,100),

        // Front-wheel confidence: high trail, slack HA, low offset
        frontConf: clp((
          clp((tr-100)/45,0,1)*0.42 + clp((67-haEff)/4,0,1)*0.33 +
          clp(1-(fo-38)/16,0,1)*0.25
        )*100,0,100),

        // Climbing bias: steep ESTA, short cs, rear weight bias, lower BB
        climbing: clp((
          clp((ESTA-74)/4,0,1)*0.38          + clp(1-(cs-415)/60,0,1)*0.27 +
          clp((rearPct-0.55)/0.12,0,1)*0.22  + clp(1-(bbH-330)/50,0,1)*0.13
        )*100,0,100),

        // Rider mobility: short reach, short wb, short cs (relative to rider)
        mobility: clp((
          clp(1-(gX-reachRef)/80,0,1)*0.40 + clp(1-(wb-wbRef)/120,0,1)*0.30 +
          clp(1-(cs-415)/55,0,1)*0.30
        )*100,0,100),

        // Playfulness: short cs, 27.5, higher BB, short wb
        playful: clp((
          clp(1-(cs-415)/55,0,1)*0.35        + clp(1-(avgWhl-699)/50,0,1)*0.25 +
          clp((bbH-330)/50,0,1)*0.20          + clp(1-(wb-wbRef)/120,0,1)*0.20
        )*100,0,100),
      };
    })(),
    kneeA,
  };
}

// ─── Viewport ─────────────────────────────────────────────────────────────────
function vport(mA,mB,overlay) {
  const pts=[];
  const add=m=>{ if(!m)return; const h=m.hp;
    [h.rearCP,h.frontCP,h.rearAxle,h.frontAxle,h.bb,h.headTop,h.headBottom,h.seatTop,h.saddle,h.grip].forEach(p=>pts.push(p)); };
  add(mA); if(overlay)add(mB);
  const minX=Math.min(...pts.map(p=>p.x))-110;
  const maxX=Math.max(...pts.map(p=>p.x))+150;
  const maxY=Math.max(...pts.map(p=>p.y))+85;
  const W=1040,H=510;
  const scale=Math.min(W/(maxX-minX),H/maxY)*0.90;
  return {W,H,scale,minX,ox:24,oy:46};
}
const sv=(p,vp)=>({x:vp.ox+(p.x-vp.minX)*vp.scale,y:vp.H-vp.oy-p.y*vp.scale});

// ─── Bike SVG ─────────────────────────────────────────────────────────────────
function BikeShape({m,vp,isB=false,viewMode,rider,label}) {
  const h=m.hp;
  const frameCol = isB ? C.bikeB : C.txt;
  const sRA=sv(h.rearAxle,vp),sFA=sv(h.frontAxle,vp),sBB=sv(h.bb,vp);
  const sHT=sv(h.headTop,vp),sHB=sv(h.headBottom,vp),sST=sv(h.seatTop,vp);
  const sSad=sv(h.saddle,vp),sGrip=sv(h.grip,vp),sPedal=sv(h.pedal,vp);
  const sSC=sv(h.stemClamp,vp),sSE=sv(h.stemEnd,vp);
  const rR=h.rR*vp.scale,fR=h.fR*vp.scale;

  // Fork must be parallel to effective head angle (frame HA ± angleset)
  const ha    = fv(h.bike,"headAngle",64);
  const haEff = ha + fv(h.bike,"anglesetOffset",0);
  const forkDX =  Math.cos(toR(haEff));
  const forkDY =  Math.sin(toR(haEff));
  const fox = -forkDY;
  const foy =  forkDX;
  const sSSTJct=sv(h.seatStayJct,vp);

  // Tube widths — differentiated like a real bike
  const DT = 15;  // downtube — thickest
  const HT = 17;  // head tube — largest diameter
  const TT = 12;  // top tube
  const ST = 14;  // seat tube — noticeably thicker than seat post
  const CS = 7;   // chainstay
  const SS = 5;   // seatstay

  const L=(a,b,sw,op=1,dash=null,col=frameCol)=>(
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={col} strokeWidth={sw}
      strokeLinecap="round" strokeDasharray={dash} opacity={op}/>
  );
  const sw=0.048*vp.scale;
  const sp=[[sSad.x-50*sw,sSad.y+3*sw],[sSad.x-22*sw,sSad.y-12*sw],
    [sSad.x+50*sw,sSad.y-5*sw],[sSad.x+60*sw,sSad.y+4*sw],[sSad.x+8*sw,sSad.y+12*sw]
  ].map(([x,y])=>`${x},${y}`).join(" ");

  const fLoad=m.fStandPct/100;
  const heatCol=load=>{
    const t=clp((load-0.3)/0.4,0,1);
    if(t<0.5) return `hsl(${160-t*100},70%,45%)`;
    return `hsl(${60-(t-0.5)*120},80%,45%)`;
  };

  // Fork perpendicular unit vector (used in fork shape below)
  const px=fox/5, py=foy/5;

  return (
    <g>
      {/* Tyres */}
      {[[sRA,rR,isB?C.bikeB:viewMode==="balance"?heatCol(1-fLoad):frameCol],
        [sFA,fR,isB?C.bikeB:viewMode==="balance"?heatCol(fLoad):frameCol]].map(([c,r,tc],i)=>(
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={r} fill="none" stroke={tc} strokeWidth={15} opacity={isB?0.2:0.12}/>
          <circle cx={c.x} cy={c.y} r={r} fill="none" stroke={tc} strokeWidth={2.5}/>
          <circle cx={c.x} cy={c.y} r={r-10*vp.scale} fill="none" stroke={tc} strokeWidth={1.2} opacity={0.3}/>
        </g>
      ))}
      {L(h.rearCP,h.frontCP,1,0.15,"6 7")}

      {/* Frame white halos for depth */}
      <g opacity={0.1}>
        <line x1={sBB.x} y1={sBB.y} x2={sRA.x} y2={sRA.y} stroke="white" strokeWidth={CS+5} strokeLinecap="round"/>
        <line x1={sSSTJct.x} y1={sSSTJct.y} x2={sRA.x} y2={sRA.y} stroke="white" strokeWidth={SS+4} strokeLinecap="round"/>
        <line x1={sBB.x} y1={sBB.y} x2={sST.x} y2={sST.y} stroke="white" strokeWidth={ST+5} strokeLinecap="round"/>
        <line x1={sST.x} y1={sST.y} x2={sHT.x} y2={sHT.y} stroke="white" strokeWidth={TT+5} strokeLinecap="round"/>
        <line x1={sBB.x} y1={sBB.y} x2={sHB.x} y2={sHB.y} stroke="white" strokeWidth={DT+6} strokeLinecap="round"/>
        <line x1={sHT.x} y1={sHT.y} x2={sHB.x} y2={sHB.y} stroke="white" strokeWidth={HT+6} strokeLinecap="round"/>
      </g>

      {/* Frame tubes — differentiated widths */}
      {L(sBB, sRA, CS)}           {/* chainstay */}
      {L(sSSTJct, sRA, SS)}       {/* seatstay — connects below top tube junction */}
      {L(sBB, sST, ST)}           {/* seat tube — thicker than seat post */}
      {L(sST, sHT, TT)}           {/* top tube */}
      {L(sBB, sHB, DT)}           {/* downtube — thickest */}
      {L(sHT, sHB, HT)}           {/* head tube — largest */}

      {/* Fork — drawn at head angle (parallel to head tube), Fox 38 style */}
      {(()=>{
        // Fork direction in screen space — same angle as head tube
        const stanchW = 7;   // stanchion half-width
        const lowerW  = 10;  // lower leg half-width
        const transF  = 0.46;

        // Compute fork length in screen px from headBottom to front axle
        const rawDx = sFA.x - sHB.x;
        const rawDy = sFA.y - sHB.y;
        const forkLen = Math.sqrt(rawDx**2 + rawDy**2);

        // Fork runs from sHB along head angle direction for forkLen
        const lt  = sHB;
        const lb  = { x: sHB.x + forkDX*forkLen, y: sHB.y + forkDY*forkLen };
        const ltr = { x: lt.x + (lb.x-lt.x)*transF, y: lt.y + (lb.y-lt.y)*transF };

        const pts = [
          `${lt.x+fox*stanchW} ${lt.y+foy*stanchW}`,
          `${ltr.x+fox*stanchW} ${ltr.y+foy*stanchW}`,
          `${ltr.x+fox*lowerW} ${ltr.y+foy*lowerW}`,
          `${lb.x+fox*lowerW} ${lb.y+foy*lowerW}`,
          `${lb.x-fox*lowerW} ${lb.y-foy*lowerW}`,
          `${ltr.x-fox*lowerW} ${ltr.y-foy*lowerW}`,
          `${ltr.x-fox*stanchW} ${ltr.y-foy*stanchW}`,
          `${lt.x-fox*stanchW} ${lt.y-foy*stanchW}`,
        ].join(" ");

        return (
          <g>
            <polygon points={pts} fill="black" opacity={0.08}
              transform={`translate(${fox*2},${foy*2})`}/>
            <polygon points={pts} fill={frameCol}/>
            {!isB && <line
              x1={lt.x+fox*2} y1={lt.y+foy*2}
              x2={ltr.x+fox*2} y2={ltr.y+foy*2}
              stroke="white" strokeWidth={2} strokeLinecap="round" opacity={0.22}/>}
          </g>
        );
      })()}

      {/* Seat post (thinner than seat tube) + saddle */}
      {L(sSad,sST,4)}
      <polygon points={sp} fill={frameCol}/>

      {/* Cockpit */}
      {L(sHT,sSC,5)}{L(sSC,sSE,5)}
      {L({x:sGrip.x-28*vp.scale,y:sGrip.y+2*vp.scale},{x:sGrip.x+18*vp.scale,y:sGrip.y-1*vp.scale},5)}

      {/* Nodes */}
      {!isB&&[
        {p:sRA,r:4,c:C.txtMid},{p:sFA,r:4,c:C.txtMid},
        {p:sBB,r:6.5,c:C.txt},{p:sGrip,r:5.5,c:C.teal},{p:sSad,r:5.5,c:C.blue},
      ].map(({p,r,c},i)=>(<circle key={i} cx={p.x} cy={p.y} r={r} fill={c}/>))}

      {/* Rider — proper stick figure using joint geometry */}
      {viewMode==="rider"&&!isB&&rider&&(()=>{
        const r2 = rider;
        const heightMm   = r2.heightCm * 10;
        const torsoLen   = heightMm * 0.28;
        const headRad_w  = heightMm * 0.065;
        const neckLen_w  = heightMm * 0.04;

        // Compute torso angle so shoulder roughly lines up with grip
        // Lean forward: 40° from horizontal feels natural for MTB
        const torsoAngle = 42; // degrees above horizontal, forward

        // World-coord joint positions
        const hip_w  = h.saddle;
        const hand_w = h.grip;
        const foot_w = h.pedal;

        const shoulder_w = {
          x: hip_w.x + torsoLen * Math.cos(toR(torsoAngle)),
          y: hip_w.y + torsoLen * Math.sin(toR(torsoAngle)),
        };

        // Elbow: 55% along shoulder→hand, bowed slightly outward (up in world)
        const elbow_w = {
          x: shoulder_w.x + 0.55*(hand_w.x - shoulder_w.x),
          y: shoulder_w.y + 0.55*(hand_w.y - shoulder_w.y) + 25,
        };

        // Knee: 52% along hip→foot, biased slightly forward
        const knee_w = {
          x: hip_w.x + 0.52*(foot_w.x - hip_w.x) + 20,
          y: hip_w.y + 0.52*(foot_w.y - hip_w.y),
        };

        // Head centre — above shoulder, slight forward lean
        const head_w = {
          x: shoulder_w.x + 8,
          y: shoulder_w.y + neckLen_w + headRad_w,
        };

        // Convert all to screen
        const hip      = sv(hip_w,      vp);
        const hand     = sv(hand_w,     vp);
        const foot_s   = sv(foot_w,     vp);
        const shoulder = sv(shoulder_w, vp);
        const elbow    = sv(elbow_w,    vp);
        const knee     = sv(knee_w,     vp);
        const head     = sv(head_w,     vp);
        const headR    = headRad_w * vp.scale;

        const ST=3.5; // stroke width for limbs

        return (
          <g opacity={0.72}>
            {/* Legs */}
            <line x1={hip.x} y1={hip.y} x2={knee.x} y2={knee.y} stroke={C.txtMid} strokeWidth={ST+1} strokeLinecap="round"/>
            <line x1={knee.x} y1={knee.y} x2={foot_s.x} y2={foot_s.y} stroke={C.txtMid} strokeWidth={ST+1} strokeLinecap="round"/>
            {/* Torso */}
            <line x1={hip.x} y1={hip.y} x2={shoulder.x} y2={shoulder.y} stroke={C.txtMid} strokeWidth={ST+2} strokeLinecap="round"/>
            {/* Arms */}
            <line x1={shoulder.x} y1={shoulder.y} x2={elbow.x} y2={elbow.y} stroke={C.txtMid} strokeWidth={ST} strokeLinecap="round"/>
            <line x1={elbow.x} y1={elbow.y} x2={hand.x} y2={hand.y} stroke={C.txtMid} strokeWidth={ST} strokeLinecap="round"/>
            {/* Head */}
            <circle cx={head.x} cy={head.y} r={headR} fill={C.txtMid} opacity={0.9}/>
            {/* Helmet dome */}
            <path d={`M ${head.x-headR*0.9} ${head.y} A ${headR} ${headR} 0 0 1 ${head.x+headR*0.9} ${head.y}`}
              fill={C.teal} opacity={0.85}/>
            {/* Joint dots */}
            {[hip,shoulder,elbow,knee].map((p,i)=>(
              <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={C.txtMid}/>
            ))}
          </g>
        );
      })()}

      {/* Dimensions */}
      {viewMode==="dimensions"&&!isB&&(
        <g>
          <line x1={sBB.x} y1={sBB.y} x2={sGrip.x} y2={sGrip.y} stroke={C.purple} strokeWidth={1.5} strokeDasharray="8 4" opacity={0.75}/>
          <line x1={sBB.x} y1={sGrip.y} x2={sGrip.x} y2={sGrip.y} stroke={C.teal} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.7}/>
          <line x1={sBB.x} y1={sBB.y} x2={sBB.x} y2={sGrip.y} stroke={C.blue} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.7}/>
          {[
            [C.teal,  (sBB.x+sGrip.x)/2, sGrip.y+18, `Grip X  ${Math.round(m.gX)}mm`],
            [C.blue,  sBB.x-46,           (sBB.y+sGrip.y)/2, `Grip Y  ${Math.round(m.gY)}mm`],
            [C.purple,(sBB.x+sGrip.x)/2+8,(sBB.y+sGrip.y)/2-15,`RAD ${Math.round(m.rad)}mm  ∠${m.raad.toFixed(1)}°`],
          ].map(([col,tx,ty,txt],i)=>(
            <g key={i}>
              <rect x={tx-txt.length*3.2} y={ty-11} width={txt.length*6.5} height={15} rx={4} fill={col} opacity={0.9}/>
              <text x={tx} y={ty} textAnchor="middle" fill="white" style={{fontSize:"10px",fontWeight:700,fontFamily:"system-ui"}}>{txt}</text>
            </g>
          ))}
          {(()=>{
            const ry=Math.max(sRA.y,sFA.y)+36, mid=(sRA.x+sFA.x)/2;
            const lbl=`Wheelbase  ${Math.round(fv(h.bike,"wheelbase",1260))}mm`;
            return <g>
              <line x1={sRA.x} y1={ry} x2={sFA.x} y2={ry} stroke={C.txtMid} strokeWidth={1.5} markerStart="url(#aG)" markerEnd="url(#aG)"/>
              <line x1={sRA.x} y1={sRA.y} x2={sRA.x} y2={ry} stroke={C.txtMid} strokeWidth={1} strokeDasharray="3 3" opacity={0.4}/>
              <line x1={sFA.x} y1={sFA.y} x2={sFA.x} y2={ry} stroke={C.txtMid} strokeWidth={1} strokeDasharray="3 3" opacity={0.4}/>
              <rect x={mid-lbl.length*3.2} y={ry+4} width={lbl.length*6.5} height={14} rx={4} fill={C.txtMid} opacity={0.88}/>
              <text x={mid} y={ry+14} textAnchor="middle" fill="white" style={{fontSize:"10px",fontWeight:700,fontFamily:"system-ui"}}>{lbl}</text>
            </g>;
          })()}
          {(()=>{
            const ry=Math.max(sRA.y,sBB.y)+18, mid=(sRA.x+sBB.x)/2;
            const lbl=`CS  ${Math.round(fv(h.bike,"chainstay",445))}mm`;
            return <g>
              <line x1={sRA.x} y1={ry} x2={sBB.x} y2={ry} stroke={C.tealDark} strokeWidth={1.5} markerStart="url(#aT)" markerEnd="url(#aT)"/>
              <rect x={mid-lbl.length*3.2} y={ry+4} width={lbl.length*6.5} height={14} rx={4} fill={C.tealDark} opacity={0.88}/>
              <text x={mid} y={ry+14} textAnchor="middle" fill="white" style={{fontSize:"10px",fontWeight:700,fontFamily:"system-ui"}}>{lbl}</text>
            </g>;
          })()}
        </g>
      )}

      {/* Pressure zones */}
      {viewMode==="balance"&&!isB&&(
        <g>
          {[[sv(h.rearCP,vp),`${m.rStandPct.toFixed(1)}%  rear`,heatCol(1-fLoad)],
            [sv(h.frontCP,vp),`${m.fStandPct.toFixed(1)}%  front`,heatCol(fLoad)]].map(([c,txt,hc],i)=>(
            <g key={i}>
              <circle cx={c.x} cy={c.y} r={16} fill={hc} opacity={0.35}/>
              <rect x={c.x-34} y={c.y+17} width={68} height={16} rx={5} fill={hc} opacity={0.92}/>
              <text x={c.x} y={c.y+28} textAnchor="middle" fill="white"
                style={{fontSize:"10px",fontWeight:800,fontFamily:"system-ui"}}>{txt}</text>
            </g>
          ))}
          <circle cx={sBB.x} cy={sBB.y} r={20} fill="none" stroke={C.teal} strokeWidth={2} opacity={0.4} strokeDasharray="4 3"/>
        </g>
      )}
      {/* Bike label rendered by parent SVG container, not here */}
    </g>
  );
}

// ─── UI Components ────────────────────────────────────────────────────────────
function SectionHead({children}) {
  return (
    <div style={{fontSize:"10px",fontWeight:800,color:C.txtMid,textTransform:"uppercase",
      letterSpacing:"0.09em",marginBottom:"8px",paddingBottom:"5px",
      borderBottom:`2px solid ${C.tealLight}`,display:"flex",alignItems:"center",gap:"6px"}}>
      {children}
    </div>
  );
}

function Tag({children,color}) {
  return (
    <span style={{fontSize:"9px",background:color?`${color}18`:C.tealLight,
      border:`1px solid ${color||C.teal}44`,
      color:color||C.tealDark,borderRadius:"99px",padding:"1px 6px",fontWeight:700,whiteSpace:"nowrap"}}>
      {children}
    </span>
  );
}

function FieldRow({label,item,suffix,step=1,onChange}) {
  const st=item?.status||"missing";
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 68px 22px 30px",gap:"4px",
      alignItems:"center",padding:"3px 0",borderBottom:`1px solid ${C.bgPage}`}}>
      <label style={{fontSize:"11px",color:C.txtMid,lineHeight:1.2}}>{label}</label>
      <input type="number" step={step} value={item?.value??""} placeholder="—"
        onChange={e=>onChange(e.target.value===""?null:Number(e.target.value))}
        style={{border:`1px solid ${C.border}`,borderRadius:"6px",padding:"3px 5px",fontSize:"12px",
          textAlign:"right",background:"white",color:C.txt,fontFamily:"DM Mono,monospace",width:"100%"}}/>
      <span style={{fontSize:"10px",color:C.txtDim}}>{suffix}</span>
      <span style={{fontSize:"8px",padding:"1px 3px",borderRadius:"3px",fontWeight:700,textAlign:"center",
        color:ST_COLOR[st],background:`${ST_COLOR[st]}14`,border:`1px solid ${ST_COLOR[st]}30`}}>
        {ST_SHORT[st]}
      </span>
    </div>
  );
}

function RField({label,value,suffix,onChange,min,max,step=1}) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:"8px",alignItems:"center",
      padding:"4px 0",borderBottom:`1px solid ${C.bgPage}`}}>
      <label style={{fontSize:"12px",color:C.txtMid}}>{label}</label>
      <div style={{display:"flex",alignItems:"center",gap:"4px"}}>
        <input type="number" value={value} min={min} max={max} step={step}
          onChange={e=>onChange(Number(e.target.value))}
          style={{width:"58px",border:`1px solid ${C.border}`,borderRadius:"6px",padding:"3px 6px",
            fontSize:"13px",fontWeight:700,textAlign:"right",background:"white",
            color:C.txt,fontFamily:"DM Mono,monospace"}}/>
        <span style={{fontSize:"11px",color:C.txtDim,width:"22px"}}>{suffix}</span>
      </div>
    </div>
  );
}

// Feel bar with teal→green gradient fill + coloured needle
function WheelSizeSelect({label, valueMm, onChange}) {
  const match = WHEEL_SIZES.find(w => Math.abs(w.mm - (valueMm||0)) < 10);
  const isCustom = valueMm && !match;
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:"6px",
      alignItems:"center",padding:"3px 0",borderBottom:`1px solid ${C.bgPage}`}}>
      <label style={{fontSize:"11px",color:C.txtMid}}>{label}</label>
      <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
        <select
          value={match ? match.mm : 'custom'}
          onChange={e => {
            if(e.target.value !== 'custom') onChange(Number(e.target.value));
          }}
          style={{border:`1px solid ${C.border}`,borderRadius:"6px",padding:"3px 6px",
            fontSize:"11px",color:C.txt,background:"white",fontFamily:"inherit",cursor:"pointer"}}>
          {WHEEL_SIZES.map(w => (
            <option key={w.mm} value={w.mm} title={w.note||''}>
              {w.label}{w.note ? ' *' : ''}
            </option>
          ))}
          {isCustom && <option value="custom">Custom ({valueMm}mm)</option>}
        </select>
        <span style={{fontSize:"10px",color:C.txtDim,fontFamily:"DM Mono,monospace",
          minWidth:"38px",textAlign:"right"}}>{valueMm}mm</span>
      </div>
    </div>
  );
}

function FeelBar({label,value,left,right,note,tag,tip}) {
  const pct=clp(value,0,100);
  const [show,setShow]=useState(false);
  // gradient: teal at low, green in mid, amber-red at high
  return (
    <div style={{marginBottom:"14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"5px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
          <span style={{fontSize:"12px",fontWeight:700,color:C.txt}}>{label}</span>
          {tag&&<Tag>{tag}</Tag>}
          {tip&&(
            <span onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}
              style={{fontSize:"10px",color:C.txtDim,cursor:"help",border:`1px solid ${C.border}`,
                borderRadius:"99px",padding:"0 5px",lineHeight:"15px",background:"white",
                position:"relative",userSelect:"none"}}>
              ⓘ
              {show&&<div style={{position:"absolute",left:"50%",transform:"translateX(-50%) translateY(-100%)",
                top:"-6px",background:C.txt,color:"white",padding:"8px 10px",borderRadius:"9px",
                fontSize:"10px",width:"180px",zIndex:100,lineHeight:1.5,whiteSpace:"normal",fontWeight:400}}>
                {tip}</div>}
            </span>
          )}
        </div>
        <span style={{fontSize:"11px",color:C.tealDark,fontFamily:"DM Mono,monospace",fontWeight:700}}>
          {Math.round(pct)}%
        </span>
      </div>
      <div style={{position:"relative",height:"10px",borderRadius:"99px",
        background:`linear-gradient(to right, ${C.teal}, ${C.green} 40%, ${C.amber} 70%, ${C.red})`,
        marginBottom:"4px"}}>
        <div style={{position:"absolute",top:"-4px",left:`${pct}%`,transform:"translateX(-50%)",
          width:"18px",height:"18px",borderRadius:"99px",background:"white",
          border:`2.5px solid ${C.tealDark}`,boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:"9px",color:C.txtDim,marginBottom:"2px"}}>
        <span>{left}</span><span>{right}</span>
      </div>
      {note&&<div style={{fontSize:"10px",color:C.txtMid,lineHeight:1.4}}>{note}</div>}
    </div>
  );
}

function Chip({label,value,sub,accent,tag}) {
  return (
    <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:"10px",
      padding:"10px 12px",borderTop:`3px solid ${accent||C.teal}`,position:"relative"}}>
      {tag&&<div style={{position:"absolute",top:"7px",right:"7px"}}><Tag>{tag}</Tag></div>}
      <div style={{fontSize:"10px",color:C.txtDim,textTransform:"uppercase",letterSpacing:"0.05em",
        marginBottom:"3px",paddingRight:tag?"52px":"0"}}>{label}</div>
      <div style={{fontSize:"19px",fontWeight:800,color:C.txt,fontFamily:"DM Mono,monospace",marginBottom:"1px"}}>{value}</div>
      {sub&&<div style={{fontSize:"10px",color:C.txtMid}}>{sub}</div>}
    </div>
  );
}

// Weight distribution bar with teal/charcoal split + coloured kg values
function WeightBar({m}) {
  const {fStandPct:fp,rStandPct:rp,fStandKg:fk,rStandKg:rk,sysWt,frRatio}=m;
  return (
    <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:"12px",padding:"14px",marginBottom:"14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"12px",fontWeight:800,color:C.txt}}>Predicted Standing Balance</span>
        </div>
        <span style={{fontSize:"11px",color:C.txtDim}}>{sysWt.toFixed(0)}kg total</span>
      </div>
      <div style={{fontSize:"10px",color:C.txtDim,marginBottom:"10px",lineHeight:1.4}}>
        Geometry-informed estimate only — not a measured value. Actual balance varies with rider position, suspension sag and terrain.
      </div>
      {/* Split bar */}
      <div style={{display:"flex",height:"24px",borderRadius:"8px",overflow:"hidden",marginBottom:"10px",gap:"2px"}}>
        <div style={{flex:fp,background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,
          display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"6px 0 0 6px"}}>
          <span style={{fontSize:"12px",fontWeight:800,color:"white"}}>~{fp.toFixed(0)}% F</span>
        </div>
        <div style={{flex:rp,background:`linear-gradient(135deg,#3f3f46,#1a1a1a)`,
          display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"0 6px 6px 0"}}>
          <span style={{fontSize:"12px",fontWeight:800,color:"white"}}>~{rp.toFixed(0)}% R</span>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",textAlign:"center"}}>
        {[
          [C.teal,   `~${fk.toFixed(0)}kg`, "Est. front bias"],
          [C.txtMid,  frRatio.toFixed(2),    "F/R tendency"],
          [C.txt,    `~${rk.toFixed(0)}kg`,  "Est. rear bias"],
        ].map(([col,val,lbl],i)=>(
          <div key={i} style={{background:C.bgMuted,borderRadius:"8px",padding:"8px",border:`1px solid ${C.border}`}}>
            <div style={{fontSize:"16px",fontWeight:800,color:col,fontFamily:"DM Mono,monospace"}}>{val}</div>
            <div style={{fontSize:"10px",color:C.txtDim}}>{lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// A vs B comparison with coloured deltas
function DeltaTable({mA,mB}) {
  const rows=[
    ["Grip X",mA.gX,mB.gX,"mm",0],["Grip Y",mA.gY,mB.gY,"mm",0],
    ["RAD",mA.rad,mB.rad,"mm",0],["RAAD",mA.raad,mB.raad,"°",1],
    ["Trail",mA.trail,mB.trail,"mm",0],["Balance tend.",mA.fStandPct,mB.fStandPct,"%",1],
    ["Wheelbase",fv(mA.hp.bike,"wheelbase",1260),fv(mB.hp.bike,"wheelbase",1260),"mm",0],
    ["BB height",mA.hp.bb.y,mB.hp.bb.y,"mm",0],
  ];
  return (
    <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:"12px",overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 72px 72px 72px",
        padding:"8px 12px",background:C.bgMuted,borderBottom:`1px solid ${C.border}`,
        fontSize:"10px",fontWeight:800,color:C.txtDim,textTransform:"uppercase",letterSpacing:"0.07em"}}>
        <span>Metric</span>
        <span style={{textAlign:"right",color:C.tealDark}}>A</span>
        <span style={{textAlign:"right",color:C.bikeB}}>B</span>
        <span style={{textAlign:"right"}}>A − B</span>
      </div>
      {rows.map(([l,a,b,u,d])=>{
        const delta=a-b;
        const dc=Math.abs(delta)<0.5?C.txtDim:delta>0?C.teal:C.bikeB;
        return (
          <div key={l} style={{display:"grid",gridTemplateColumns:"1fr 72px 72px 72px",
            padding:"7px 12px",borderBottom:`1px solid ${C.bgPage}`,fontSize:"12px",alignItems:"center"}}>
            <span style={{color:C.txtMid,fontWeight:500}}>{l}</span>
            <span style={{textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:600,color:C.tealDark}}>{a.toFixed(d)}{u}</span>
            <span style={{textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:600,color:C.bikeB}}>{b.toFixed(d)}{u}</span>
            <span style={{textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:800,color:dc}}>
              {delta>0?"+":""}{delta.toFixed(d)}{u}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TrailDiag({trail,ha}) {
  const W=130,H=108,cx=75,gY=95,axleY=gY-34;
  const saLen=82;
  const sa1x=cx+saLen/2*Math.cos(toR(ha)),sa1y=axleY-saLen/2*Math.sin(toR(ha));
  const sa2x=cx-saLen/2*Math.cos(toR(ha)),sa2y=axleY+saLen/2*Math.sin(toR(ha));
  const t2=(gY-sa1y)/((sa2y-sa1y)||1);
  const saGX=sa1x+t2*(sa2x-sa1x);
  const tPx=Math.min(Math.abs(trail)*0.08,30);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto",display:"block",borderRadius:"8px",background:C.bgMuted,border:`1px solid ${C.border}`}}>
      <line x1={0} y1={gY} x2={W} y2={gY} stroke={C.borderMid} strokeWidth={2}/>
      <circle cx={cx} cy={axleY} r={34} fill="none" stroke={C.border} strokeWidth={9}/>
      <circle cx={cx} cy={axleY} r={34} fill="none" stroke={C.txt} strokeWidth={2}/>
      <line x1={sa1x} y1={sa1y} x2={saGX} y2={gY} stroke={C.teal} strokeWidth={2} strokeDasharray="5 3"/>
      <line x1={cx} y1={gY} x2={cx+tPx} y2={gY} stroke={C.red} strokeWidth={3} strokeLinecap="round"/>
      <line x1={cx} y1={gY-5} x2={cx} y2={gY+5} stroke={C.txt} strokeWidth={2}/>
      <text x={(cx+cx+tPx)/2} y={gY-6} textAnchor="middle" fill={C.red}
        style={{fontSize:"9px",fontWeight:700,fontFamily:"system-ui"}}>{Math.round(trail)}mm</text>
      <text x={6} y={14} fill={C.teal} style={{fontSize:"9px",fontWeight:700,fontFamily:"system-ui"}}>Steering axis</text>
    </svg>
  );
}

function AddModal({onAdd,onClose}) {
  const [f,setF]=useState({brand:"",model:"",year:new Date().getFullYear(),size:"M",
    category:"Trail",motor:"—",wheelSetup:"29/29",
    reach:"",stack:"",headAngle:"",headTubeLength:"",effectiveSeatTubeAngle:"",
    seatTubeLength:"",chainstay:"",wheelbase:"",bbHeight:"",bbDrop:"",
    forkTravel:"",forkOffset:"44",frontWheelDiameter:749,rearWheelDiameter:749,bikeWeight:""});
  const upd=(k,v)=>setF(p=>({...p,[k]:v}));
  const inp=(k,lbl)=>(
    <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
      <label style={{fontSize:"10px",color:C.txtDim,textTransform:"uppercase",letterSpacing:"0.05em"}}>{lbl}</label>
      <input value={f[k]} onChange={e=>upd(k,e.target.value)}
        style={{border:`1px solid ${C.border}`,borderRadius:"7px",padding:"6px 8px",
          fontSize:"12px",color:C.txt,fontFamily:"inherit",background:"white"}}/>
    </div>
  );
  const save=()=>{
    if(!f.brand||!f.model)return;
    const bike=makeEmpty();
    bike.id=`${f.brand}-${f.model}-${f.size}-${Date.now()}`.toLowerCase().replace(/\s+/g,"-");
    Object.assign(bike,{brand:f.brand,model:f.model,year:Number(f.year),size:f.size,
      category:f.category,motor:f.motor,wheelSetup:f.wheelSetup});
    ["reach","stack","headAngle","headTubeLength","effectiveSeatTubeAngle","seatTubeLength",
     "chainstay","wheelbase","bbHeight","bbDrop","forkTravel","forkOffset",
     "frontWheelDiameter","rearWheelDiameter","bikeWeight"].forEach(k=>{
      bike.fields[k]={value:f[k]===""?null:Number(f[k]),status:f[k]!==""?"edited":"missing"};
    });
    onAdd(bike); onClose();
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:200,
      display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{background:"white",borderRadius:"18px",padding:"24px",width:"100%",
        maxWidth:"560px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.18)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px"}}>
          <h2 style={{margin:0,fontSize:"17px",fontWeight:800,color:C.txt}}>Add Bike</h2>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:"20px",cursor:"pointer",color:C.txtDim}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
          {inp("brand","Brand")}{inp("model","Model")}
          {inp("year","Year")}{inp("size","Size")}
          {inp("category","Category")}{inp("motor","Motor")}
          {inp("wheelSetup","Wheel Setup")}
        </div>
        <SectionHead>Geometry</SectionHead>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"10px"}}>
          {[["reach","Reach (mm)"],["stack","Stack (mm)"],["headAngle","Head Angle (°)"],
            ["headTubeLength","Head Tube (mm)"],["effectiveSeatTubeAngle","Eff. STA (°)"],
            ["seatTubeLength","Seat Tube (mm)"],["chainstay","Chainstay (mm)"],
            ["wheelbase","Wheelbase (mm)"],["bbHeight","BB Height (mm)"],["bbDrop","BB Drop (mm)"],
            ["forkTravel","Fork Travel (mm)"],["forkOffset","Fork Offset (mm)"],
            ["anglesetOffset","Angleset Offset (°, e.g. -0.5)"],
            ["bikeWeight","Bike Weight (kg)"]].map(([k,l])=>inp(k,l))}
        </div>
        {/* Wheel size selectors */}
        {["frontWheelDiameter","rearWheelDiameter"].map((key,i)=>(
          <div key={key} style={{marginBottom:"10px"}}>
            <label style={{fontSize:"10px",color:C.txtDim,textTransform:"uppercase",
              letterSpacing:"0.05em",display:"block",marginBottom:"4px"}}>
              {i===0?"Front wheel size":"Rear wheel size"}
            </label>
            <select
              value={f[key]||749}
              onChange={e=>upd(key,e.target.value)}
              style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:"7px",
                padding:"7px 8px",fontSize:"12px",color:C.txt,
                background:"white",fontFamily:"inherit"}}>
              {WHEEL_SIZES.map(w=>(
                <option key={w.mm} value={w.mm}>
                  {w.label} — {w.mm}mm{w.note?'  ⚠ '+w.note:''}
                </option>
              ))}
            </select>
          </div>
        ))}
        {(f.frontWheelDiameter==824||f.rearWheelDiameter==824)&&(
          <p style={{fontSize:"10px",color:C.amber,margin:"0 0 10px",lineHeight:1.4}}>
            ⚠ 32" diameter (~824mm) is an estimate. The standard is not yet finalised — update this value when confirmed.
          </p>
        )}
        <div style={{display:"flex",gap:"8px",justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{border:`1px solid ${C.border}`,background:"white",
            borderRadius:"8px",padding:"9px 16px",fontSize:"12px",cursor:"pointer",color:C.txtMid}}>Cancel</button>
          <button onClick={save} style={{background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,
            border:"none",borderRadius:"8px",padding:"9px 18px",fontSize:"12px",
            fontWeight:700,color:"white",cursor:"pointer"}}>Save to Database</button>
        </div>
        <p style={{fontSize:"11px",color:C.txtDim,marginTop:"12px",lineHeight:1.5}}>
          Use <strong>Export JSON</strong> from the toolbar to download this bike for submission to the verified database.
        </p>
      </div>
    </div>
  );
}

// ─── Cockpit Comparison SVG (Both mode) ──────────────────────────────────────
function CockpitCompare({mA, mB, bikeA, bikeB}) {
  const W=500, H=280, pad=28;

  function rel(m) {
    const h=m.hp;
    const off=(p)=>({x:p.x-h.bb.x, y:p.y-h.bb.y});
    return {
      headTop: off(h.headTop),
      grip:    off(h.grip),
    };
  }

  const rA=rel(mA), rB=rel(mB);

  const allPts=[rA.headTop, rB.headTop, rA.grip, rB.grip];
  const minX = Math.min(...allPts.map(p=>p.x)) - 20;
  const maxX = Math.max(...allPts.map(p=>p.x)) + 50;
  const minY = Math.min(...allPts.map(p=>p.y)) - 20;
  const maxY = Math.max(...allPts.map(p=>p.y)) + 20;
  const sc   = Math.min((W-pad*2)/(maxX-minX), (H-pad*2)/(maxY-minY));
  const s    = (p)=>({ x: pad+(p.x-minX)*sc, y: H-pad-(p.y-minY)*sc });

  const dX=Math.round(rA.grip.x - rB.grip.x);
  const dY=Math.round(rA.grip.y - rB.grip.y);

  // Grip icon — circle (side view of a cylindrical grip)
  function GripIcon({p, col, label}) {
    return (
      <g>
        <circle cx={p.x} cy={p.y} r={14} fill={col} opacity={0.15}/>
        <circle cx={p.x} cy={p.y} r={10} fill="none" stroke={col} strokeWidth={3}/>
        <circle cx={p.x} cy={p.y} r={3}  fill={col}/>
        {/* Label */}
        <rect x={p.x+16} y={p.y-10} width={label.length*7+8} height={16} rx={4} fill={col} opacity={0.92}/>
        <text x={p.x+20} y={p.y+1} fill="white"
          style={{fontSize:"10px",fontWeight:800,fontFamily:"system-ui"}}>{label}</text>
      </g>
    );
  }

  // HT top marker — simple diamond
  function HTMarker({p, col}) {
    const r=6;
    return (
      <g>
        <polygon points={`${p.x},${p.y-r} ${p.x+r},${p.y} ${p.x},${p.y+r} ${p.x-r},${p.y}`}
          fill={col} opacity={0.35}/>
        <polygon points={`${p.x},${p.y-r} ${p.x+r},${p.y} ${p.x},${p.y+r} ${p.x-r},${p.y}`}
          fill="none" stroke={col} strokeWidth={1.5}/>
        <text x={p.x+r+4} y={p.y+4} fill={col} opacity={0.7}
          style={{fontSize:"9px",fontWeight:700,fontFamily:"system-ui"}}>HT</text>
      </g>
    );
  }

  const gA=s(rA.grip), gB=s(rB.grip);
  const htA=s(rA.headTop), htB=s(rB.headTop);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
        <span style={{fontSize:"13px",fontWeight:800,color:C.txt}}>Cockpit Comparison</span>
        <div style={{display:"flex",gap:"8px"}}>
          <span style={{fontSize:"10px",color:C.tealDark,fontWeight:700,
            background:C.tealLight,border:`1px solid ${C.tealMid}`,
            borderRadius:"6px",padding:"2px 8px"}}>A: {bikeA.brand} {bikeA.model}</span>
          <span style={{fontSize:"10px",color:C.bikeB,fontWeight:700,
            background:"#fff4ed",border:`1px solid #fcd4aa`,
            borderRadius:"6px",padding:"2px 8px"}}>B: {bikeB.brand} {bikeB.model}</span>
        </div>
      </div>
      <p style={{fontSize:"11px",color:C.txtMid,margin:"0 0 10px",lineHeight:1.5}}>
        ◆ = top of head tube &nbsp;·&nbsp; ⊙ = actual grip position (side view).
      </p>

      <div style={{background:"white",border:`1px solid ${C.border}`,borderRadius:"12px",overflow:"hidden"}}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{display:"block",width:"100%",height:"auto"}}>
          <rect width={W} height={H} fill="white"/>
          {/* Subtle grid lines */}
          {Array.from({length:4}).map((_,i)=>(
            <line key={i} x1={0} y1={pad+i*(H-pad*2)/3} x2={W} y2={pad+i*(H-pad*2)/3}
              stroke={C.bgPage} strokeWidth={1}/>
          ))}

          {/* HT markers */}
          <HTMarker p={htB} col={C.bikeB}/>
          <HTMarker p={htA} col={C.tealDark}/>

          {/* Grip icons — B behind, A in front */}
          <GripIcon p={gB} col={C.bikeB}   label="B"/>
          <GripIcon p={gA} col={C.tealDark} label="A"/>

          {/* Delta line between grips */}
          {(Math.abs(dX)>2||Math.abs(dY)>2)&&(
            <line x1={gA.x} y1={gA.y} x2={gB.x} y2={gB.y}
              stroke={C.purple} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.5}/>
          )}
        </svg>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginTop:"10px"}}>
        {[
          ["↔ Reach difference", dX, `A is ${Math.abs(dX)}mm ${dX>0?"longer":"shorter"} than B`],
          ["↕ Height difference", dY, `A grip is ${Math.abs(dY)}mm ${dY>0?"higher":"lower"} than B`],
        ].map(([lbl,val,note])=>(
          <div key={lbl} style={{background:C.bgMuted,border:`1px solid ${C.border}`,
            borderRadius:"9px",padding:"10px",
            borderLeft:`3px solid ${val>0?C.tealDark:val<0?C.bikeB:C.borderMid}`}}>
            <div style={{fontSize:"10px",color:C.txtDim,marginBottom:"3px"}}>{lbl}</div>
            <div style={{fontSize:"20px",fontWeight:900,fontFamily:"DM Mono,monospace",
              color:val>0?C.tealDark:val<0?C.bikeB:C.txtMid}}>
              {val>0?"+":""}{val}mm
            </div>
            <div style={{fontSize:"10px",color:C.txtMid,marginTop:"2px"}}>{note}</div>
          </div>
        ))}
      </div>
      <p style={{fontSize:"10px",color:C.txtDim,margin:"8px 0 0",lineHeight:1.5}}>
        💡 Adjust stem, spacers or bar rise in the left panel to see this update in real time.
      </p>
    </div>
  );
}


function CockpitRealityCard({bike}) {
  const d    = deriveBike(bike);
  const ha   = fv(d,"headAngle",64);
  const hs   = fv(d,"headset",15);
  const sp   = fv(d,"spacerStack",20);
  const stL  = fv(d,"stemLength",35);
  const stA  = fv(d,"stemAngle",-6);
  const bR   = fv(d,"barRise",20);
  const hw   = fv(d,"barWidth",770)/2;
  const bsw  = fv(d,"barBacksweep",9);
  const busw = fv(d,"barUpsweep",5);
  const reach = fv(d,"reach",455);
  const stack = fv(d,"stack",630);

  // Each cockpit component's contribution relative to the head tube top
  // (which is the reach/stack datum point)
  const comps = [
    { label:"Headset + spacers", detail:`${hs+sp}mm along steerer at ${ha}° HA`,
      dx: -(hs+sp)*Math.cos(toR(ha)), dy: +(hs+sp)*Math.sin(toR(ha)) },
    { label:"Stem", detail:`${stL}mm @ ${stA>0?"+":""}${stA}°`,
      dx: stL*Math.cos(toR(stA)), dy: stL*Math.sin(toR(stA)) },
    { label:"Bar rise", detail:`${bR}mm`,
      dx: 0, dy: bR },
    { label:"Bar sweep", detail:`${bsw}° backsweep / ${busw}° upsweep`,
      dx: -hw*(1-Math.cos(toR(bsw))), dy: hw*Math.sin(toR(busw)) },
  ];

  const totalDX = comps.reduce((s,c)=>s+c.dx, 0);
  const totalDY = comps.reduce((s,c)=>s+c.dy, 0);
  const actualX = reach + totalDX;
  const actualY = stack + totalDY;
  const fmt = v => (v>=0?"+":"")+Math.round(v)+"mm";
  const deltaCol = v => Math.abs(v)<1 ? C.txtDim : v>0 ? C.tealDark : C.red;

  function CompBar({label, frame, actual}) {
    const max = Math.max(frame, actual) * 1.08;
    const delta = actual - frame;
    return (
      <div style={{marginBottom:"14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"6px"}}>
          <span style={{fontSize:"11px",fontWeight:700,color:C.txt}}>{label}</span>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontSize:"11px",color:C.txtDim}}>
              Frame: <span style={{fontFamily:"DM Mono,monospace",fontWeight:700,color:C.txtMid}}>{Math.round(frame)}mm</span>
            </span>
            <span style={{fontSize:"11px",color:C.txtDim}}>→</span>
            <span style={{fontSize:"13px",fontFamily:"DM Mono,monospace",fontWeight:800,color:C.tealDark}}>
              {Math.round(actual)}mm
            </span>
            <span style={{fontSize:"11px",fontFamily:"DM Mono,monospace",fontWeight:700,
              color:deltaCol(delta),background:Math.abs(delta)>1?`${deltaCol(delta)}14`:"none",
              borderRadius:"6px",padding:"1px 5px"}}>
              {fmt(delta)}
            </span>
          </div>
        </div>
        {/* Two-bar comparison */}
        <div style={{position:"relative",height:"22px",background:C.bgPage,borderRadius:"8px",overflow:"hidden"}}>
          {/* Frame bar — behind */}
          <div style={{position:"absolute",left:0,top:0,height:"100%",
            width:`${(frame/max)*100}%`,background:C.borderMid,borderRadius:"8px"}}/>
          {/* Actual bar — in front, teal */}
          <div style={{position:"absolute",left:0,top:0,height:"100%",
            width:`${(actual/max)*100}%`,
            background:`linear-gradient(90deg,${C.tealMid},${C.teal})`,
            borderRadius:"8px",opacity:0.85}}/>
          {/* Frame label */}
          <div style={{position:"absolute",left:"8px",top:"50%",transform:"translateY(-50%)",
            fontSize:"9px",fontWeight:700,color:"white",zIndex:2,textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
            Frame {Math.round(frame)}mm
          </div>
          {/* Actual label — only if different enough */}
          {Math.abs(delta)>5 && (
            <div style={{position:"absolute",right:"8px",top:"50%",transform:"translateY(-50%)",
              fontSize:"9px",fontWeight:800,color:"white",zIndex:2,textShadow:"0 1px 2px rgba(0,0,0,0.4)"}}>
              Your grip {Math.round(actual)}mm
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
        <span style={{fontSize:"13px",fontWeight:800,color:C.txt}}>Cockpit Reality Check</span>
        <Tag>✓ unique to this tool</Tag>
      </div>
      <p style={{fontSize:"11px",color:C.txtMid,margin:"0 0 14px",lineHeight:1.5}}>
        Published reach & stack describe the frame only. Your actual hand position shifts with every cockpit change — something other tools don't show.
      </p>

      <CompBar label="Reach — horizontal hand position" frame={reach} actual={actualX}/>
      <CompBar label="Stack — hand height" frame={stack} actual={actualY}/>

      <div style={{height:"1px",background:C.border,margin:"10px 0"}}/>

      {/* Per-component breakdown */}
      <div style={{fontSize:"10px",fontWeight:800,color:C.txtDim,textTransform:"uppercase",
        letterSpacing:"0.08em",marginBottom:"8px"}}>What's moving your hands</div>

      <div style={{border:`1px solid ${C.border}`,borderRadius:"10px",overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 58px 58px",
          padding:"6px 10px",background:C.bgMuted,
          fontSize:"9px",fontWeight:800,color:C.txtDim,
          textTransform:"uppercase",letterSpacing:"0.06em",
          borderBottom:`1px solid ${C.border}`}}>
          <span>Component</span>
          <span style={{textAlign:"right"}}>↔ Reach</span>
          <span style={{textAlign:"right"}}>↕ Height</span>
        </div>
        {comps.map((c,i)=>(
          <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 58px 58px",
            padding:"8px 10px",alignItems:"center",
            borderBottom:i<comps.length-1?`1px solid ${C.bgPage}`:"none",
            background:i%2===0?"white":C.bgCard}}>
            <div>
              <div style={{fontSize:"11px",fontWeight:600,color:C.txt}}>{c.label}</div>
              <div style={{fontSize:"9px",color:C.txtDim,marginTop:"1px"}}>{c.detail}</div>
            </div>
            <span style={{textAlign:"right",fontFamily:"DM Mono,monospace",fontSize:"12px",
              fontWeight:700,color:deltaCol(c.dx)}}>{fmt(c.dx)}</span>
            <span style={{textAlign:"right",fontFamily:"DM Mono,monospace",fontSize:"12px",
              fontWeight:700,color:deltaCol(c.dy)}}>{fmt(c.dy)}</span>
          </div>
        ))}
        {/* Net total row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 58px 58px",
          padding:"9px 10px",alignItems:"center",
          background:C.tealLight,borderTop:`2px solid ${C.tealMid}`}}>
          <span style={{fontSize:"11px",fontWeight:800,color:C.tealDark}}>Net cockpit effect</span>
          <span style={{textAlign:"right",fontFamily:"DM Mono,monospace",fontSize:"13px",
            fontWeight:900,color:deltaCol(totalDX)}}>{fmt(totalDX)}</span>
          <span style={{textAlign:"right",fontFamily:"DM Mono,monospace",fontSize:"13px",
            fontWeight:900,color:deltaCol(totalDY)}}>{fmt(totalDY)}</span>
        </div>
      </div>

      <div style={{marginTop:"10px",padding:"9px 11px",background:C.bgMuted,
        borderRadius:"9px",border:`1px solid ${C.border}`,
        fontSize:"10px",color:C.txtMid,lineHeight:1.5}}>
        💡 Change stem length, spacers, or bar rise in the left panel to see your actual grip position update in real time.
      </div>
    </div>
  );
}


export default function App() {
  const [db,setDb]       = useState(INIT_DB);
  const [rider,setRider] = useState(DEF_RIDER);
  // Track last auto-calculated saddle height — if user hasn't deviated, keep in sync with inseam
  const lastCalcSaddle = useRef(calcSaddleHeight(DEF_RIDER.inseamCm));
  useEffect(() => {
    const next = calcSaddleHeight(rider.inseamCm);
    if (Math.abs(rider.saddleHeightMm - lastCalcSaddle.current) < 4) {
      setRider(r => ({...r, saddleHeightMm: next}));
    }
    lastCalcSaddle.current = next;
  }, [rider.inseamCm]); // eslint-disable-line
  const [bikeA,setBikeA] = useState(()=>makeBike(INIT_DB[0]));
  const [bikeB,setBikeB] = useState(()=>makeBike(INIT_DB[1]));
  const [slot,setSlot]   = useState("A");
  const [vm,setVm]       = useState("dimensions");
  const [showB,setShowB] = useState(false);
  const [geoOpen,setGO]  = useState(false);
  const [ckOpen,setCK]   = useState(true);
  const [modal,setModal] = useState(false);
  const [heroOpen,setHO] = useState(true);
  const [rightTab,setRT] = useState("cockpit"); // cockpit | feel | compare | why

  const [units, setUnits] = useState("metric"); // "metric" | "imperial"
  const imp = units === "imperial";
  const active=slot==="A"?bikeA:bikeB;
  const setActive=slot==="A"?setBikeA:setBikeB;
  const derived=useMemo(()=>deriveBike(active),[active]);
  const mA=useMemo(()=>calcMetrics(bikeA,rider),[bikeA,rider]);
  const mB=useMemo(()=>calcMetrics(bikeB,rider),[bikeB,rider]);
  const mAct=slot==="A"?mA:mB;
  const mOther=slot==="A"?mB:mA;
  const bikeOther=slot==="A"?bikeB:bikeA;
  const vp=useMemo(()=>vport(mAct,showB?mOther:null,showB),[mAct,mOther,showB]);

  function updField(k,v) {
    const nx=cl(active);
    nx.fields[k]={...(nx.fields[k]||{}),value:v,status:v===null?"missing":"edited"};
    setActive(nx);
  }
  function loadBike(id) { const f=db.find(b=>b.id===id); if(f)setActive(makeBike(f)); }
  function exportBike() {
    const blob=new Blob([JSON.stringify(active,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download=`${active.brand}-${active.model}.json`.replace(/\s+/g,"-");
    a.click(); URL.revokeObjectURL(url);
  }

  const [mobilePane, setMobilePane] = useState("bikes");

  const frontNote=mAct.fStandPct<42?"Front-light — consider active front weighting."
    :mAct.fStandPct>47?"Front-loaded — confident grip, committed feel."
    :"Neutral standing load.";
  const radNote=mAct.raad>56?"Upright RAD shape."
    :mAct.raad<52?"Long/stretched RAD — more committed body position."
    :"Balanced RAD angle.";
  const trailNote=mAct.trail<112?"Quick steering — responsive but may feel nervous."
    :mAct.trail>128?"High trail — very stable, slower in switchbacks."
    :"Mid-trail — balanced modern geometry.";

  // Button styles
  const btnSm=(active,col=C.teal)=>({
    border:`1px solid ${active?col:C.border}`,borderRadius:"7px",
    padding:"5px 11px",fontSize:"11px",fontWeight:active?700:400,cursor:"pointer",
    background:active?col:"white",color:active?"white":C.txtMid,fontFamily:"inherit",
    transition:"all .15s",
  });
  const tabBtn=(active)=>({
    ...btnSm(active),flex:1,padding:"7px 6px",fontSize:"11px",
    borderRadius:"8px",textAlign:"center",
  });

  return (
    <div style={{minHeight:"100vh",background:C.bgPage,color:C.txt,fontFamily:'"DM Sans",system-ui,sans-serif'}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box}body{margin:0}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:${C.bgPage}}
        ::-webkit-scrollbar-thumb{background:${C.tealMid};border-radius:3px}
        details>summary::-webkit-details-marker{display:none}
        input[type=range]{accent-color:${C.teal};height:4px}
        input:focus{outline:2px solid ${C.tealMid};outline-offset:1px}
        select:focus{outline:2px solid ${C.tealMid};outline-offset:1px}
        .desktop-layout{display:grid;grid-template-columns:268px 1fr 288px;overflow:hidden}
        .mobile-layout{display:none;flex-direction:column;overflow-y:auto;background:${C.bgPage}}
        .mobile-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:52px;
          background:white;border-top:1px solid ${C.border};z-index:50;
          box-shadow:0 -2px 8px rgba(0,0,0,0.08)}
        .mobile-nav button{flex:1;border:none;background:none;font-family:inherit;
          font-size:10px;font-weight:700;color:${C.txtDim};cursor:pointer;
          display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 0}
        .mobile-nav button.mob-active{color:${C.tealDark};border-top:2px solid ${C.teal}}
        .mobile-nav button .nav-icon{font-size:20px;line-height:1}
        @media(max-width:900px){
          .desktop-layout{display:none!important}
          .mobile-layout{display:flex!important;min-height:0;flex:1;overflow-y:auto;height:calc(100vh - 50px - 52px - ${heroOpen?68:0}px)}
          .mobile-nav{display:flex!important}
          .hero-compact{padding:8px 14px!important}
          .hero-bullets{display:none!important}
        }
      `}</style>

      {/* ── Header — white with teal accent line ── */}
      <header style={{background:"white",borderBottom:`3px solid ${C.teal}`,padding:"0 20px",height:"50px",
        display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",
        boxShadow:"0 1px 8px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <div style={{width:"28px",height:"28px",background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,
              borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px"}}>⛰</div>
            <span style={{fontSize:"16px",fontWeight:900,letterSpacing:"-0.01em",color:C.txt}}>
              MTB Fit + Handling
            </span>
          </div>
          <span style={{background:C.tealLight,border:`1px solid ${C.tealMid}`,borderRadius:"5px",
            padding:"1px 8px",fontSize:"10px",color:C.tealDark,fontFamily:"DM Mono,monospace",fontWeight:600}}>
            v6
          </span>
        </div>
        <div style={{display:"flex",gap:"7px"}}>
          <button onClick={()=>setModal(true)} style={{...btnSm(true),background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,border:"none",padding:"6px 14px",fontSize:"12px"}}>
            + Add Bike
          </button>
          {[["Export JSON",exportBike],["Reset",()=>{setBikeA(makeBike(db[0]));setBikeB(makeBike(db[1]));setRider(DEF_RIDER);}]].map(([l,fn])=>(
            <button key={l} onClick={fn} style={{...btnSm(false),padding:"6px 12px",fontSize:"11px"}}>{l}</button>
          ))}
        </div>
      </header>

      {/* ── Hero strip ── */}
      {heroOpen&&(
        <div className="hero-compact" style={{background:"white",borderBottom:`1px solid ${C.border}`,padding:"10px 20px",
          display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px"}}>
          <div style={{flex:1}}>
            <div style={{fontSize:"13px",fontWeight:800,color:C.txt,marginBottom:"5px"}}>
              The MTB fit calculator that goes beyond frame geometry
            </div>
            <div className="hero-bullets" style={{display:"flex",gap:"16px",flexWrap:"wrap"}}>
              {[
                ["Real grip position","Stem, spacers, bar rise & sweep all factor into Grip X/Y"],
                ["Cockpit room score","Uses actual Grip X — a shorter stem changes everything"],
                ["Physics-based loads","Rider + bike weight, distributed by actual geometry"],
                ["Live geometry","Every field updates the diagram and metrics instantly"],
              ].map(([title,desc])=>(
                <div key={title} style={{display:"flex",gap:"5px",flex:"1 1 180px",maxWidth:"260px"}}>
                  <span style={{color:C.teal,fontWeight:800,marginTop:"1px",flexShrink:0}}>✓</span>
                  <div style={{fontSize:"11px"}}>
                    <span style={{fontWeight:700,color:C.txt}}>{title} — </span>
                    <span style={{color:C.txtMid}}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={()=>setHO(false)} style={{background:"none",border:`1px solid ${C.border}`,
            color:C.txtDim,borderRadius:"99px",width:"24px",height:"24px",cursor:"pointer",
            fontSize:"13px",fontWeight:700,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
            ×
          </button>
        </div>
      )}

      {/* ── Desktop 3-col layout ── */}
      <div className="desktop-layout" style={{height:`calc(100vh - ${heroOpen?118:50}px)`}}>

        {/* ══ LEFT ══ */}
        <div className="col-left" style={{background:C.bgCard,borderRight:`1px solid ${C.border}`,overflowY:"auto",padding:"14px"}}>

          <div style={{marginBottom:"14px"}}>
            <SectionHead>🚲 Bike Setup</SectionHead>
            <div style={{display:"flex",gap:"6px",marginBottom:"10px"}}>
              {["A","B"].map(s=>(
                <button key={s} onClick={()=>{setSlot(s);setShowB(false);}}
                  style={{...btnSm(slot===s&&!showB),flex:1,fontWeight:800,padding:"7px",fontSize:"12px",
                    ...(slot===s&&!showB?{background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,border:"none"}:{})}}>
                  Bike {s}
                </button>
              ))}
              <button onClick={()=>{
                  const next=!showB;
                  setShowB(next);
                  if(next) setVm("cockpitCompare");
                  else if(vm==="cockpitCompare") setVm("frame");
                }}
                style={{...btnSm(showB),flex:1,fontWeight:800,padding:"7px",fontSize:"12px",
                  ...(showB?{background:`linear-gradient(135deg,${C.tealDark},#1a1a1a)`,border:"none"}:{})}}>
                Both
              </button>
            </div>

            <select value={active.id} onChange={e=>loadBike(e.target.value)}
              style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:"7px",padding:"7px 8px",
                fontSize:"12px",marginBottom:"8px",color:C.txt,background:"white",fontFamily:"inherit"}}>
              {db.map(b=>(
                <option key={b.id} value={b.id}>{b.verified?"✓ ":""}{b.brand} {b.model} {b.year} — {b.size}</option>
              ))}
            </select>

            <div style={{background:C.tealLight,borderRadius:"8px",padding:"8px 10px",marginBottom:"10px",
              border:`1px solid ${C.tealMid}`,fontSize:"11px",color:C.tealDark,lineHeight:1.5,fontWeight:500}}>
              {active.category} · {active.wheelSetup} · {active.motor}
            </div>

            {/* Cockpit — prominent, open by default */}
            <details open={ckOpen} onToggle={e=>setCK(e.target.open)} style={{marginBottom:"8px"}}>
              <summary style={{fontSize:"11px",fontWeight:800,color:C.tealDark,textTransform:"uppercase",
                letterSpacing:"0.07em",cursor:"pointer",padding:"7px 0",display:"flex",
                justifyContent:"space-between",alignItems:"center",
                borderBottom:`2px solid ${C.tealMid}`,marginBottom:"8px"}}>
                <span style={{display:"flex",alignItems:"center",gap:"7px"}}>
                  🎛 Cockpit Setup {ckOpen?"▲":"▼"}
                  <Tag>affects real reach & height</Tag>
                </span>
              </summary>
              {COCKPIT_FIELDS.map(([k,l,u,s])=>(
                <FieldRow key={k} label={l} item={derived.fields[k]} suffix={u} step={s} onChange={v=>updField(k,v)}/>
              ))}
              <div style={{padding:"8px 0 2px"}}>
                <div style={{fontSize:"11px",color:C.txtMid,marginBottom:"5px"}}>
                  Bar width: <strong style={{color:C.tealDark,fontFamily:"DM Mono,monospace"}}>{derived.fields.barWidth?.value}mm</strong>
                </div>
                <input type="range" min={700} max={820} step={5}
                  value={num(derived.fields.barWidth?.value,770)}
                  onChange={e=>updField("barWidth",Number(e.target.value))}
                  style={{width:"100%"}}/>
              </div>
            </details>

            {/* Geometry — collapsed by default, lower priority */}
            <details open={geoOpen} onToggle={e=>setGO(e.target.open)}>
              <summary style={{fontSize:"10px",fontWeight:700,color:C.txtDim,textTransform:"uppercase",
                letterSpacing:"0.07em",cursor:"pointer",padding:"6px 0",display:"flex",
                justifyContent:"space-between",alignItems:"center",
                borderBottom:`1px solid ${C.border}`,marginBottom:"6px"}}>
                <span style={{display:"flex",alignItems:"center",gap:"6px"}}>
                  Frame Geometry {geoOpen?"▲":"▼"}
                  <span style={{fontSize:"9px",color:C.txtDim,fontWeight:500,
                    textTransform:"none",letterSpacing:"normal"}}>(fixed by manufacturer)</span>
                </span>
              </summary>
              {GEO_FIELDS.filter(([k])=>k!=='frontWheelDiameter'&&k!=='rearWheelDiameter').map(([k,l,u,s])=>(
                <FieldRow key={k} label={l} item={derived.fields[k]} suffix={u} step={s} onChange={v=>updField(k,v)}/>
              ))}
              <WheelSizeSelect label="Front wheel" valueMm={fv(derived,'frontWheelDiameter',749)}
                onChange={v=>updField('frontWheelDiameter',v)}/>
              <WheelSizeSelect label="Rear wheel" valueMm={fv(derived,'rearWheelDiameter',749)}
                onChange={v=>updField('rearWheelDiameter',v)}/>
              {derived.fields.frontWheelDiameter?.value===824||derived.fields.rearWheelDiameter?.value===824?(
                <div style={{fontSize:"9px",color:C.txtDim,padding:"3px 0",lineHeight:1.4}}>
                  * 32" diameter is an estimate (~824mm). Update when the standard is confirmed.
                </div>
              ):null}
            </details>
          </div>

          <div>
            <SectionHead>🔧 Saddle & Cranks</SectionHead>
            <div style={{marginBottom:"8px",padding:"8px 10px",background:C.tealLight,
              borderRadius:"8px",border:`1px solid ${C.tealMid}`,
              fontSize:"10px",color:C.tealDark,lineHeight:1.5}}>
              Saddle height = <strong>BB centre → top of saddle</strong>. Auto-estimated from your inseam using the Lemond method. Adjust to match your actual setup.
            </div>
            <RField label="Saddle height" value={rider.saddleHeightMm} suffix="mm" min={500} max={800}
              onChange={v=>setRider(r=>({...r,saddleHeightMm:v}))}/>
            {Math.abs(rider.saddleHeightMm - calcSaddleHeight(rider.inseamCm)) > 4 && (
              <div style={{fontSize:"10px",color:C.txtDim,marginTop:"3px",
                display:"flex",alignItems:"center",gap:"5px",paddingLeft:"2px"}}>
                <span>Lemond estimate: <strong style={{fontFamily:"DM Mono,monospace"}}>{calcSaddleHeight(rider.inseamCm)}mm</strong></span>
                <button onClick={()=>{
                  lastCalcSaddle.current = calcSaddleHeight(rider.inseamCm);
                  setRider(r=>({...r,saddleHeightMm:calcSaddleHeight(r.inseamCm)}));
                }} style={{background:"none",border:"none",color:C.teal,cursor:"pointer",
                  fontSize:"10px",padding:0,textDecoration:"underline",fontFamily:"inherit"}}>
                  reset to estimate
                </button>
              </div>
            )}
            <RField label="Crank length" value={rider.crankLengthMm} suffix="mm" min={140} max={180}
              onChange={v=>setRider(r=>({...r,crankLengthMm:v}))}/>
          </div>

          <div style={{marginBottom:"14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
              <SectionHead>👤 Rider</SectionHead>
              <div style={{display:"flex",gap:"4px",marginBottom:"5px"}}>
                {["metric","imperial"].map(u=>(
                  <button key={u} onClick={()=>setUnits(u)} style={{
                    ...btnSm(units===u), padding:"3px 9px", fontSize:"10px",
                    borderRadius:"6px", textTransform:"capitalize",
                  }}>{u==="metric"?"Metric (cm/kg)":"Imperial (in/lbs)"}</button>
                ))}
              </div>
            </div>
            {/* Height */}
            <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:"8px",alignItems:"center",
              padding:"4px 0",borderBottom:`1px solid ${C.bgPage}`}}>
              <label style={{fontSize:"12px",color:C.txtMid}}>Height</label>
              <div style={{display:"flex",alignItems:"center",gap:"4px"}}>
                {imp ? (
                  <>
                    <input type="number" value={Math.floor(rider.heightCm/30.48)} min={4} max={7} step={1}
                      onChange={e=>{
                        const ft=Number(e.target.value);
                        const inch=Math.round((rider.heightCm%30.48)/2.54);
                        setRider(r=>({...r,heightCm:Math.round(ft*30.48+inch*2.54)}));
                      }}
                      style={{width:"36px",border:`1px solid ${C.border}`,borderRadius:"6px",padding:"3px 4px",
                        fontSize:"13px",fontWeight:700,textAlign:"right",background:"white",color:C.txt,fontFamily:"DM Mono,monospace"}}/>
                    <span style={{fontSize:"11px",color:C.txtDim}}>ft</span>
                    <input type="number" value={Math.round((rider.heightCm%30.48)/2.54)} min={0} max={11} step={1}
                      onChange={e=>{
                        const ft=Math.floor(rider.heightCm/30.48);
                        setRider(r=>({...r,heightCm:Math.round(ft*30.48+Number(e.target.value)*2.54)}));
                      }}
                      style={{width:"36px",border:`1px solid ${C.border}`,borderRadius:"6px",padding:"3px 4px",
                        fontSize:"13px",fontWeight:700,textAlign:"right",background:"white",color:C.txt,fontFamily:"DM Mono,monospace"}}/>
                    <span style={{fontSize:"11px",color:C.txtDim}}>in</span>
                  </>
                ) : (
                  <>
                    <input type="number" value={rider.heightCm} min={140} max={220} step={1}
                      onChange={e=>setRider(r=>({...r,heightCm:Number(e.target.value)}))}
                      style={{width:"58px",border:`1px solid ${C.border}`,borderRadius:"6px",padding:"3px 6px",
                        fontSize:"13px",fontWeight:700,textAlign:"right",background:"white",color:C.txt,fontFamily:"DM Mono,monospace"}}/>
                    <span style={{fontSize:"11px",color:C.txtDim,width:"22px"}}>cm</span>
                  </>
                )}
              </div>
            </div>
            {/* Inseam, Arm span — show in inches if imperial */}
            {[
              ["inseamCm","Inseam",60,100],
              ["armSpanCm","Arm span",150,220],
            ].map(([k,l,mn,mx])=>(
              <div key={k} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:"8px",alignItems:"center",
                padding:"4px 0",borderBottom:`1px solid ${C.bgPage}`}}>
                <label style={{fontSize:"12px",color:C.txtMid}}>{l}</label>
                <div style={{display:"flex",alignItems:"center",gap:"4px"}}>
                  <input type="number"
                    value={imp ? parseFloat((rider[k]/2.54).toFixed(1)) : rider[k]}
                    min={imp ? (mn/2.54).toFixed(0) : mn}
                    max={imp ? (mx/2.54).toFixed(0) : mx}
                    step={imp ? 0.5 : 1}
                    onChange={e=>setRider(r=>({...r,[k]:imp ? Number(e.target.value)*2.54 : Number(e.target.value)}))}
                    style={{width:"58px",border:`1px solid ${C.border}`,borderRadius:"6px",padding:"3px 6px",
                      fontSize:"13px",fontWeight:700,textAlign:"right",background:"white",color:C.txt,fontFamily:"DM Mono,monospace"}}/>
                  <span style={{fontSize:"11px",color:C.txtDim,width:"22px"}}>{imp?"in":"cm"}</span>
                </div>
              </div>
            ))}
            {/* Weight */}
            <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:"8px",alignItems:"center",
              padding:"4px 0",borderBottom:`1px solid ${C.bgPage}`}}>
              <label style={{fontSize:"12px",color:C.txtMid}}>Weight</label>
              <div style={{display:"flex",alignItems:"center",gap:"4px"}}>
                <input type="number"
                  value={imp ? parseFloat((rider.weightKg*2.205).toFixed(1)) : rider.weightKg}
                  min={imp?88:40} max={imp?286:130} step={imp?1:1}
                  onChange={e=>setRider(r=>({...r,weightKg:imp ? Number(e.target.value)/2.205 : Number(e.target.value)}))}
                  style={{width:"58px",border:`1px solid ${C.border}`,borderRadius:"6px",padding:"3px 6px",
                    fontSize:"13px",fontWeight:700,textAlign:"right",background:"white",color:C.txt,fontFamily:"DM Mono,monospace"}}/>
                <span style={{fontSize:"11px",color:C.txtDim,width:"22px"}}>{imp?"lbs":"kg"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ CENTRE ══ */}
        <div className="col-centre" style={{overflowY:"auto",background:C.bgPage,display:"flex",flexDirection:"column"}}>

          {/* Toolbar */}
          <div style={{background:C.bgCard,borderBottom:`1px solid ${C.border}`,padding:"8px 14px",
            display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}}>
              {/* Active bike label — or both when overlay is on */}
              {(showB ? [["A",bikeA,C.tealDark],["B",bikeB,C.bikeB]] : [[slot,active,slot==="A"?C.tealDark:C.bikeB]]).map(([ltr,bike,col],i)=>(
                <div key={ltr} style={{display:"flex",alignItems:"center",gap:"6px"}}>
                  {i>0&&<span style={{color:C.borderMid,fontSize:"12px"}}>vs</span>}
                  <span style={{background:col,color:"white",borderRadius:"5px",
                    padding:"2px 8px",fontSize:"11px",fontWeight:800}}>{ltr}</span>
                  <span style={{fontSize:"12px",fontWeight:700,color:C.txt}}>
                    {bike.brand} {bike.model} {bike.year}
                  </span>
                  <span style={{fontSize:"11px",color:C.txtDim}}>{bike.size}</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap",alignItems:"center"}}>
              {(showB
                ? [["frame","Frame"],["dimensions","Dimensions"],["cockpitCompare","Cockpit"]]
                : [["frame","Frame"],["dimensions","Dimensions"],["balance","Balance"]]
              ).map(([v,l])=>(
                <button key={v} onClick={()=>setVm(v)} style={btnSm(vm===v)}>{l}</button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{background:"white",borderBottom:`1px solid ${C.bgPage}`,padding:"5px 14px",
            display:"flex",gap:"16px",flexWrap:"wrap",flexShrink:0}}>
            {[[C.teal,"● Grip"],[C.blue,"● Saddle"],[C.txt,"● BB"],
              [C.purple,"-- RAD"],[C.teal,"-- Grip X"],[C.txtMid,"-- Wheelbase"],
              ...(showB?[[C.bikeB,"— Bike B"]]:[])
            ].map(([col,lbl])=>(
              <span key={lbl} style={{fontSize:"10px",color:col,fontWeight:600}}>{lbl}</span>
            ))}
          </div>

          {/* SVG diagram — hidden in cockpitCompare mode */}
          {vm!=="cockpitCompare" && (
          <div style={{padding:"10px",flexShrink:0}}>
            <div style={{background:"white",borderRadius:"12px",border:`1px solid ${C.border}`,
              overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}>
              <svg viewBox={`0 0 ${vp.W} ${vp.H}`} style={{display:"block",width:"100%",height:"auto"}}>
                <defs>
                  {[["aG",C.txtMid],["aT",C.tealDark]].map(([id,col])=>(
                    <marker key={id} id={id} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                      <path d="M 0 0 L 6 3 L 0 6 Z" fill={col}/>
                    </marker>
                  ))}
                </defs>
                <rect width={vp.W} height={vp.H} fill="white"/>
                {Array.from({length:6}).map((_,i)=>(
                  <line key={i} x1={0} y1={vp.H-vp.oy-i*80*vp.scale} x2={vp.W} y2={vp.H-vp.oy-i*80*vp.scale}
                    stroke={C.bgPage} strokeWidth={1.5}/>
                ))}
                {showB&&<BikeShape m={mOther} vp={vp} isB viewMode="frame"/>}
                <BikeShape m={mAct} vp={vp} viewMode={vm} rider={rider}/>
                {/* Bike name labels — top right corner, stacked */}
                {(showB
                  ? [[slot, active, slot==="A"?C.tealDark:C.bikeB],
                     [slot==="A"?"B":"A", bikeOther, slot==="A"?C.bikeB:C.tealDark]]
                  : [[slot, active, slot==="A"?C.tealDark:C.bikeB]]
                ).map(([ltr,bike,col],i)=>{
                  const lbl=`${ltr} — ${bike.brand} ${bike.model} ${bike.year} (${bike.size})`;
                  const lw=lbl.length*6.4+14;
                  const lx=vp.W-lw-10;
                  const ly=10+i*22;
                  return (
                    <g key={ltr}>
                      <rect x={lx} y={ly} width={lw} height={17} rx={5} fill={col} opacity={0.92}/>
                      <text x={lx+7} y={ly+12} fill="white"
                        style={{fontSize:"10px",fontWeight:800,fontFamily:"system-ui"}}>{lbl}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
          )}

          {/* Cockpit compare view — Both + Cockpit mode */}
          {vm==="cockpitCompare" && showB && (
            <div style={{padding:"10px",flexShrink:0}}>
              <div style={{background:"white",borderRadius:"12px",border:`1px solid ${C.border}`,
                padding:"16px",boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}>
                <CockpitCompare mA={mAct} mB={mOther} bikeA={active} bikeB={bikeOther}/>
              </div>
            </div>
          )}
          {vm==="cockpitCompare" && !showB && (
            <div style={{padding:"20px 10px",textAlign:"center",color:C.txtDim,fontSize:"12px"}}>
              Select <strong>Both</strong> in the bike panel to compare cockpit positions.
            </div>
          )}



          {/* Metric chips */}
          <div style={{padding:"8px 10px",display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"7px"}}>
            <Chip label="Grip X" value={`${mAct.gX.toFixed(0)}mm`} sub="Actual horiz. reach" accent={C.teal} tag="✓ stem+bars"/>
            <Chip label="Grip Y" value={`${mAct.gY.toFixed(0)}mm`} sub="Actual grip height" accent={C.blue} tag="✓ spacers+rise"/>
            <Chip label="RAD" value={`${mAct.rad.toFixed(0)}mm`} sub="BB–grip distance" accent={C.purple}/>
            <Chip label="RAAD" value={`${mAct.raad.toFixed(1)}°`} sub="RAD angle" accent={C.purple}/>
            <Chip label="Seated reach" value={`${mAct.seatedReach.toFixed(0)}mm`} sub="Saddle to grip" accent={C.tealDark}/>
            <Chip label="Saddle setback" value={`${mAct.saddleSetback.toFixed(0)}mm`} sub="BB to saddle" accent={C.txtMid}/>
            <Chip label="BB drop" value={`${fv(derived,"bbDrop",25).toFixed(0)}mm`} sub="Axle to BB" accent={C.txtMid}/>
            <Chip label="Trail" value={`${mAct.trail.toFixed(0)}mm`} sub="Steering stability" accent={C.red}/>
            <Chip label="Balance tend. (stand)" value={`~${mAct.fStandPct.toFixed(0)}% F`} sub="Geometry estimate" accent={C.green} tag="est."/>
            <Chip label="Balance tend. (seated)" value={`~${mAct.fSeatPct.toFixed(0)}% F`} sub="Geometry estimate" accent={C.green}/>
          </div>
        </div>

        {/* ══ RIGHT ══ */}
        <div className="col-right" style={{background:C.bgCard,borderLeft:`1px solid ${C.border}`,overflowY:"auto",padding:"14px"}}>

          {/* Tab strip */}
          <div style={{display:"flex",gap:"6px",marginBottom:"14px"}}>
            {[["cockpit","Cockpit Fit"],["feel","Feel"],["compare","A vs B"],["why","Why different"]].map(([t,l])=>(
              <button key={t} onClick={()=>setRT(t)} style={tabBtn(rightTab===t)}>{l}</button>
            ))}
          </div>

          {rightTab==="cockpit"&&(
            <CockpitRealityCard bike={active}/>
          )}

          {rightTab==="feel"&&(
            <>
              <WeightBar m={mAct}/>
              <FeelBar label="Reach / Roominess" left="Cramped" right="Roomy" value={mAct.roomScore}
                tag="✓ actual Grip X"
                tip="Calculated from real Grip X — includes stem, spacers, bar rise and sweep. Not just frame reach."
                note="Horizontal cockpit room based on your actual hand position."/>
              <FeelBar label="Upright vs Stretched" left="Upright" right="Stretched" value={mAct.uprScore}
                tip="Based on RAAD angle. Higher = more upright relative to the bike."
                note={radNote}/>
              <FeelBar label="Front Load Tendency" left="Rear-biased" right="Front-biased" value={mAct.frontScore}
                tip="Geometry-based estimate of front/rear balance tendency while standing. Not a measured value — actual load depends on rider position, suspension sag and terrain."
                note={frontNote}/>

              <div style={{height:"1px",background:C.border,margin:"10px 0"}}/>
              <div style={{fontSize:"11px",fontWeight:800,color:C.txt,marginBottom:"4px"}}>
                Handling Character
              </div>
              <div style={{fontSize:"10px",color:C.txtDim,marginBottom:"10px",lineHeight:1.4}}>
                Geometry-based indicators. Suspension setup, tyres and terrain will also affect these significantly.
              </div>
              {[
                ["⚡ High-speed stability", mAct.handling.hiSpeed,  "Low", "High",
                  "Head angle, wheelbase, trail and wheel size. Slack + long = plants at speed."],
                ["🔄 Corner agility",       mAct.handling.agility,  "Sluggish", "Agile",
                  "Steeper HA, shorter chainstay and wheelbase. Snappier into corners."],
                ["🎯 Front-wheel confidence",mAct.handling.frontConf,"Skittish","Confident",
                  "Trail, head angle and fork offset. Higher trail = more self-steering grip."],
                ["⛰ Climbing bias",         mAct.handling.climbing, "Descender","Climber",
                  "Effective STA, chainstay length and rear weight bias."],
                ["🤸 Rider mobility",        mAct.handling.mobility, "Planted","Mobile",
                  "Reach and wheelbase relative to your height. Shorter = easier to move around."],
                ["🎪 Playfulness",           mAct.handling.playful,  "Stiff","Playful",
                  "Short chainstay, smaller wheels, higher BB. Easier to pop and manual."],
              ].map(([label,val,left,right,tip])=>(
                <FeelBar key={label} label={label} value={val} left={left} right={right} tip={tip}/>
              ))}
              <div style={{height:"1px",background:C.border,margin:"12px 0"}}/>
              <SectionHead>Steering & Trail</SectionHead>
              <TrailDiag trail={mAct.trail} ha={fv(derived,"headAngle",64)}/>
              <div style={{fontSize:"11px",color:C.txtMid,marginTop:"6px",lineHeight:1.4}}>
                <strong style={{color:mAct.trail<112?C.red:mAct.trail>128?C.green:C.amber}}>
                  {mAct.trail<112?"Low trail":"High trail"} — {Math.round(mAct.trail)}mm
                </strong><br/>
                Mechanical trail measures steering self-centering. It's one input to handling — see the Handling Feel score above for the full picture.
              </div>
            </>
          )}

          {rightTab==="compare"&&(
            <>
              {showB
                ? <DeltaTable mA={mA} mB={mB}/>
                : <div style={{padding:"20px",textAlign:"center",background:C.bgMuted,borderRadius:"10px",
                    border:`1px solid ${C.border}`,color:C.txtMid,fontSize:"12px",lineHeight:1.6}}>
                    Enable <strong>"Overlay Bike B"</strong> in the diagram toolbar to compare both bikes side by side.
                  </div>
              }
            </>
          )}

          {rightTab==="why"&&(
            <>
              {[
                [C.teal,"🎯 Real grip position","Stem length + angle, spacer stack, bar rise and sweep are all factored into Grip X and Y. Other tools only use reach and stack off the spec sheet."],
                [C.blue,"📐 Cockpit room score","Roominess is based on actual Grip X — a shorter stem on a long-reach bike can feel more cramped than a smaller bike with a longer stem."],
                [C.green,"⚖ Physics-based loads","Weight distribution uses rider AND bike weight, distributed by actual geometry. Motor and battery weight matters for eMTBs."],
                [C.purple,"🔄 Live geometry update","Change any field — stem length, head angle, bar rise — and the diagram and all metrics update instantly."],
                [C.amber,"📊 Bike A vs B","Compare two bikes head to head across all key metrics with coloured deltas showing which bike wins each dimension."],
              ].map(([col,title,desc])=>(
                <div key={title} style={{marginBottom:"10px",padding:"10px 12px",
                  background:C.bgMuted,borderRadius:"10px",border:`1px solid ${C.border}`,
                  borderLeft:`3px solid ${col}`}}>
                  <div style={{fontSize:"11px",fontWeight:700,color:col,marginBottom:"3px"}}>{title}</div>
                  <div style={{fontSize:"10px",color:C.txtMid,lineHeight:1.5}}>{desc}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MOBILE LAYOUT — purpose-built, shown only on ≤900px
          Four tabs: Bikes | Diagram | Fit | Setup
      ══════════════════════════════════════════════════════════════ */}
      <div className="mobile-layout" style={{padding:"0"}}>

        {/* ── BIKES tab ── */}
        {mobilePane==="bikes"&&(
          <div style={{padding:"14px",display:"flex",flexDirection:"column",gap:"12px"}}>
            {/* A/B/Both */}
            <div style={{display:"flex",gap:"8px"}}>
              {["A","B"].map(s=>(
                <button key={s} onClick={()=>{setSlot(s);setShowB(false);}}
                  style={{...btnSm(slot===s&&!showB),flex:1,fontWeight:800,padding:"10px",fontSize:"14px",
                    ...(slot===s&&!showB?{background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,border:"none"}:{})}}>
                  Bike {s}
                </button>
              ))}
              <button onClick={()=>{const next=!showB;setShowB(next);if(next)setVm("cockpitCompare");else if(vm==="cockpitCompare")setVm("frame");}}
                style={{...btnSm(showB),flex:1,fontWeight:800,padding:"10px",fontSize:"14px",
                  ...(showB?{background:`linear-gradient(135deg,${C.tealDark},#1a1a1a)`,border:"none"}:{})}}>
                Both
              </button>
            </div>

            {/* Bike A selector */}
            {[["A",bikeA,setBikeA],["B",bikeB,setBikeB]].map(([ltr,bike,setter])=>(
              <div key={ltr} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:"12px",padding:"12px",
                borderLeft:`4px solid ${ltr==="A"?C.tealDark:C.bikeB}`}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                  <span style={{background:ltr==="A"?C.tealDark:C.bikeB,color:"white",borderRadius:"5px",
                    padding:"2px 8px",fontSize:"12px",fontWeight:800}}>{ltr}</span>
                  <span style={{fontSize:"13px",fontWeight:700,color:C.txt}}>{bike.brand} {bike.model} {bike.year}</span>
                  <span style={{fontSize:"11px",color:C.txtDim}}>{bike.size}</span>
                </div>
                <select value={bike.id} onChange={e=>{const f=db.find(b=>b.id===e.target.value);if(f)setter(makeBike(f));}}
                  style={{width:"100%",border:`1px solid ${C.border}`,borderRadius:"8px",padding:"8px",
                    fontSize:"13px",color:C.txt,background:"white",fontFamily:"inherit"}}>
                  {db.map(b=>(
                    <option key={b.id} value={b.id}>{b.verified?"✓ ":""}{b.brand} {b.model} {b.year} — {b.size}</option>
                  ))}
                </select>
                <div style={{marginTop:"8px",fontSize:"11px",color:C.tealDark,background:C.tealLight,
                  borderRadius:"6px",padding:"5px 8px"}}>{bike.category} · {bike.wheelSetup} · {bike.motor}</div>
              </div>
            ))}

            {/* Quick comparison if Both selected */}
            {showB&&(
              <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:"12px",overflow:"hidden"}}>
                <div style={{padding:"10px 12px",background:C.bgMuted,fontSize:"11px",fontWeight:800,color:C.txtMid,
                  textTransform:"uppercase",letterSpacing:"0.07em"}}>Quick Comparison</div>
                {[["Grip X",mA.gX,mB.gX,"mm",0],["Grip Y",mA.gY,mB.gY,"mm",0],
                  ["Trail",mA.trail,mB.trail,"mm",0],["Balance",mA.fStandPct,mB.fStandPct,"%",1]
                ].map(([l,a,b,u,d])=>{
                  const delta=a-b;
                  return (
                    <div key={l} style={{display:"grid",gridTemplateColumns:"1fr 70px 70px 70px",
                      padding:"8px 12px",borderBottom:`1px solid ${C.bgPage}`,fontSize:"12px",alignItems:"center"}}>
                      <span style={{color:C.txtMid}}>{l}</span>
                      <span style={{textAlign:"right",fontFamily:"DM Mono,monospace",color:C.tealDark,fontWeight:700}}>{a.toFixed(d)}{u}</span>
                      <span style={{textAlign:"right",fontFamily:"DM Mono,monospace",color:C.bikeB,fontWeight:700}}>{b.toFixed(d)}{u}</span>
                      <span style={{textAlign:"right",fontFamily:"DM Mono,monospace",fontWeight:800,
                        color:Math.abs(delta)<0.5?C.txtDim:delta>0?C.tealDark:C.bikeB}}>
                        {delta>0?"+":""}{delta.toFixed(d)}{u}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {/* CTA */}
            <button onClick={()=>setMobilePane("diagram")} style={{
              background:`linear-gradient(135deg,${C.teal},${C.tealDark})`,
              border:"none",borderRadius:"12px",padding:"14px",
              color:"white",fontSize:"14px",fontWeight:800,cursor:"pointer",
              fontFamily:"inherit",textAlign:"center",marginTop:"4px",
            }}>
              View Diagram & Analysis →
            </button>
          </div>
        )}

        {/* ── DIAGRAM tab ── */}
        {mobilePane==="diagram"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"0"}}>
            {/* View controls */}
            <div style={{background:C.bgCard,borderBottom:`1px solid ${C.border}`,padding:"8px 12px",
              display:"flex",gap:"6px",flexWrap:"wrap",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:"6px",marginRight:"4px"}}>
                <span style={{background:C.tealDark,color:"white",borderRadius:"5px",
                  padding:"2px 7px",fontSize:"11px",fontWeight:800}}>{slot}</span>
                <span style={{fontSize:"12px",fontWeight:700,color:C.txt,whiteSpace:"nowrap",
                  overflow:"hidden",textOverflow:"ellipsis",maxWidth:"160px"}}>
                  {active.brand} {active.model}
                </span>
              </div>
              {(showB
                ?[["frame","Frame"],["dimensions","Dim"],["cockpitCompare","Cockpit"]]
                :[["frame","Frame"],["dimensions","Dim"],["balance","Balance"]]
              ).map(([v,l])=>(
                <button key={v} onClick={()=>setVm(v)} style={{...btnSm(vm===v),padding:"5px 10px",fontSize:"11px"}}>{l}</button>
              ))}
            </div>

            {/* SVG diagram */}
            {vm!=="cockpitCompare"&&(
              <div style={{background:"white",margin:"10px",borderRadius:"12px",
                border:`1px solid ${C.border}`,overflow:"hidden"}}>
                <svg viewBox={`0 0 ${vp.W} ${vp.H}`} style={{display:"block",width:"100%",height:"auto"}}>
                  <defs>
                    {[["aG",C.txtMid],["aT",C.tealDark]].map(([id,col])=>(
                      <marker key={id} id={`m-${id}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                        <path d="M 0 0 L 6 3 L 0 6 Z" fill={col}/>
                      </marker>
                    ))}
                  </defs>
                  <rect width={vp.W} height={vp.H} fill="white"/>
                  {showB&&<BikeShape m={mOther} vp={vp} isB viewMode="frame"/>}
                  <BikeShape m={mAct} vp={vp} viewMode={vm} rider={rider}/>
                  {(showB?[[slot,active,slot==="A"?C.tealDark:C.bikeB],[slot==="A"?"B":"A",bikeOther,slot==="A"?C.bikeB:C.tealDark]]:[[slot,active,slot==="A"?C.tealDark:C.bikeB]])
                    .map(([ltr,bike,col],i)=>{
                      const lbl=`${ltr} — ${bike.brand} ${bike.model} (${bike.size})`;
                      const lw=lbl.length*6.4+14; const lx=vp.W-lw-10; const ly=10+i*22;
                      return <g key={ltr}>
                        <rect x={lx} y={ly} width={lw} height={17} rx={5} fill={col} opacity={0.92}/>
                        <text x={lx+7} y={ly+12} fill="white" style={{fontSize:"10px",fontWeight:800,fontFamily:"system-ui"}}>{lbl}</text>
                      </g>;
                    })}
                </svg>
              </div>
            )}
            {vm==="cockpitCompare"&&showB&&(
              <div style={{margin:"10px",background:"white",borderRadius:"12px",
                border:`1px solid ${C.border}`,padding:"14px"}}>
                <CockpitCompare mA={mAct} mB={mOther} bikeA={active} bikeB={bikeOther}/>
              </div>
            )}

            {/* Key metrics — 2-col on mobile */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",padding:"0 10px 10px"}}>
              {[
                ["Grip X",`${mAct.gX.toFixed(0)}mm`,"Actual reach",C.teal],
                ["Grip Y",`${mAct.gY.toFixed(0)}mm`,"Grip height",C.blue],
                ["RAD",`${mAct.rad.toFixed(0)}mm`,"BB–grip dist.",C.purple],
                ["Trail",`${mAct.trail.toFixed(0)}mm`,"Steering",C.red],
              ].map(([l,v,s,a])=>(
                <div key={l} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:"10px",
                  padding:"10px",borderTop:`3px solid ${a}`}}>
                  <div style={{fontSize:"10px",color:C.txtDim,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"2px"}}>{l}</div>
                  <div style={{fontSize:"20px",fontWeight:800,color:C.txt,fontFamily:"DM Mono,monospace"}}>{v}</div>
                  <div style={{fontSize:"10px",color:C.txtMid}}>{s}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FIT tab ── */}
        {mobilePane==="fit"&&(
          <div style={{padding:"14px",display:"flex",flexDirection:"column",gap:"12px"}}>
            <CockpitRealityCard bike={active}/>
            <div style={{height:"1px",background:C.border}}/>
            <WeightBar m={mAct}/>
            <FeelBar label="Reach / Roominess" left="Cramped" right="Roomy" value={mAct.roomScore}
              tag="✓ actual Grip X"
              tip="Calculated from real Grip X — includes stem, spacers, bar rise and sweep."
              note="Horizontal cockpit room based on your actual hand position."/>
            <FeelBar label="Upright vs Stretched" left="Upright" right="Stretched" value={mAct.uprScore}
              tip="Based on RAAD angle." note={radNote}/>
            <FeelBar label="Front Load Tendency" left="Rear-biased" right="Front-biased" value={mAct.frontScore}
              tip="Geometry estimate — not measured." note={frontNote}/>
          </div>
        )}

        {/* ── SETUP tab ── */}
        {mobilePane==="setup"&&(
          <div style={{padding:"14px",display:"flex",flexDirection:"column",gap:"0"}}>
            {/* Rider */}
            <div style={{marginBottom:"14px"}}>
              <SectionHead>👤 Rider</SectionHead>
              <div style={{display:"flex",gap:"4px",marginBottom:"8px"}}>
                {["metric","imperial"].map(u=>(
                  <button key={u} onClick={()=>setUnits(u)} style={{
                    ...btnSm(units===u),padding:"4px 10px",fontSize:"10px",borderRadius:"6px"}}>
                    {u==="metric"?"Metric":"Imperial"}
                  </button>
                ))}
              </div>
              {[["heightCm","Height","cm",140,220],["inseamCm","Inseam","cm",60,100],
                ["armSpanCm","Arm span","cm",150,220],["weightKg","Weight","kg",40,130]
              ].map(([k,l,u,mn,mx])=>(
                <RField key={k} label={l} value={imp&&k!=="weightKg"?parseFloat((rider[k]/2.54).toFixed(1)):imp?parseFloat((rider[k]*2.205).toFixed(1)):rider[k]}
                  suffix={imp&&k!=="weightKg"?"in":imp?"lbs":u} min={mn} max={mx}
                  onChange={v=>setRider(r=>({...r,[k]:imp&&k!=="weightKg"?v*2.54:imp?v/2.205:v}))}/>
              ))}
            </div>

            {/* Saddle */}
            <div style={{marginBottom:"14px"}}>
              <SectionHead>🔧 Saddle & Cranks</SectionHead>
              <RField label="Saddle height" value={rider.saddleHeightMm} suffix="mm" min={500} max={800}
                onChange={v=>setRider(r=>({...r,saddleHeightMm:v}))}/>
              <RField label="Crank length" value={rider.crankLengthMm} suffix="mm" min={140} max={180}
                onChange={v=>setRider(r=>({...r,crankLengthMm:v}))}/>
            </div>

            {/* Cockpit */}
            <details open>
              <summary style={{fontSize:"11px",fontWeight:800,color:C.tealDark,textTransform:"uppercase",
                letterSpacing:"0.07em",cursor:"pointer",padding:"6px 0",display:"flex",
                justifyContent:"space-between",borderBottom:`2px solid ${C.tealMid}`,marginBottom:"8px"}}>
                🎛 Cockpit Setup ▼
              </summary>
              {COCKPIT_FIELDS.map(([k,l,u,s])=>(
                <FieldRow key={k} label={l} item={derived.fields[k]} suffix={u} step={s} onChange={v=>updField(k,v)}/>
              ))}
              <div style={{padding:"8px 0 2px"}}>
                <div style={{fontSize:"11px",color:C.txtMid,marginBottom:"5px"}}>
                  Bar width: <strong style={{color:C.tealDark,fontFamily:"DM Mono,monospace"}}>{derived.fields.barWidth?.value}mm</strong>
                </div>
                <input type="range" min={700} max={820} step={5} value={num(derived.fields.barWidth?.value,800)}
                  onChange={e=>updField("barWidth",Number(e.target.value))} style={{width:"100%"}}/>
              </div>
            </details>

            {/* Geometry */}
            <details style={{marginTop:"10px"}}>
              <summary style={{fontSize:"10px",fontWeight:700,color:C.txtDim,textTransform:"uppercase",
                letterSpacing:"0.07em",cursor:"pointer",padding:"6px 0",display:"flex",
                justifyContent:"space-between",borderBottom:`1px solid ${C.border}`,marginBottom:"6px"}}>
                Frame Geometry (fixed by manufacturer) ▼
              </summary>
              {GEO_FIELDS.filter(([k])=>k!=='frontWheelDiameter'&&k!=='rearWheelDiameter').map(([k,l,u,s])=>(
                <FieldRow key={k} label={l} item={derived.fields[k]} suffix={u} step={s} onChange={v=>updField(k,v)}/>
              ))}
              <WheelSizeSelect label="Front wheel" valueMm={fv(derived,'frontWheelDiameter',749)} onChange={v=>updField('frontWheelDiameter',v)}/>
              <WheelSizeSelect label="Rear wheel" valueMm={fv(derived,'rearWheelDiameter',749)} onChange={v=>updField('rearWheelDiameter',v)}/>
            </details>
          </div>
        )}
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav">
        {[["bikes","🚲","Bikes"],["diagram","📐","Diagram"],["fit","📏","Fit"],["setup","⚙️","Setup"]].map(([pane,icon,label])=>(
          <button key={pane} className={mobilePane===pane?"mob-active":""}
            onClick={()=>setMobilePane(pane)}>
            <span className="nav-icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {modal&&<AddModal onAdd={b=>{setDb(d=>[...d,b]);setActive(makeBike(b));}} onClose={()=>setModal(false)}/>}
    </div>
  );
}
