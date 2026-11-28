/* 수학 개념 카드 그림: 단정한 선 그림(파랑 선 + 연한 면 + 주황 강조 하나). FIG(key, 낱말) → SVG 문자열 */
(function(){
const B='#2f5fa3',F='#e9f0fb',A='#e0782f',AF='#fde9da',T='#33415c',G='#c9d5ea';
const W=240,H=150;
const sv=(b)=>`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" font-family="Gowun Dodum, sans-serif" font-size="13" fill="none" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
const ln=(x1,y1,x2,y2,c=B,w=2.5,d='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}"${d?` stroke-dasharray="${d}"`:''}/>`;
const tx=(x,y,s,c=T,a='middle',sz=13)=>`<text x="${x}" y="${y}" fill="${c}" stroke="none" text-anchor="${a}" font-size="${sz}">${s}</text>`;
const dot=(x,y,c=B,r=3.5)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="none"/>`;
const poly=(pts,f=F,c=B,w=2.5)=>`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" fill="${f}" stroke="${c}" stroke-width="${w}"/>`;
const pl=(pts,c=B,w=2.5,d='')=>`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" stroke="${c}" stroke-width="${w}"${d?` stroke-dasharray="${d}"`:''}/>`;
const arr=(x1,y1,x2,y2,c=B)=>{const a=Math.atan2(y2-y1,x2-x1),h=8;return ln(x1,y1,x2,y2,c)+pl([[x2-h*Math.cos(a-0.45),y2-h*Math.sin(a-0.45)],[x2,y2],[x2-h*Math.cos(a+0.45),y2-h*Math.sin(a+0.45)]],c)};
const arc=(cx,cy,r,a1,a2,c=A,w=2.5)=>{const p=a=>[cx+r*Math.cos(a*Math.PI/180),cy-r*Math.sin(a*Math.PI/180)];const[s,e]=[p(a1),p(a2)];return `<path d="M${s[0]},${s[1]} A${r},${r} 0 ${a2-a1>180?1:0} 0 ${e[0]},${e[1]}" stroke="${c}" stroke-width="${w}"/>`};
const rA=(x,y,dx,dy,s=12)=>pl([[x+dx*s,y],[x+dx*s,y+dy*s],[x,y+dy*s]],A,2);
const P={};
/* 수직선 */
P.line=w=>{let s=ln(20,80,220,80);const xs=[];for(let i=0;i<=10;i++){const x=20+i*20;s+=ln(x,74,x,86,B,2);}
 if(/음수|양수|정수|절댓값/.test(w)){for(let i=-5;i<=5;i++)s+=tx(120+i*20,104,i,i<0?A:i>0?B:T,'middle',12);
  if(w==='절댓값')s+=`<path d="M40,66 Q80,40 120,66" stroke="${A}" stroke-width="2.5"/><path d="M120,66 Q160,40 200,66" stroke="${A}" stroke-width="2.5"/>`+tx(80,42,'4칸',A)+tx(160,42,'4칸',A)+dot(40,80,A)+dot(200,80,A);
  else if(w==='음수')s+=ln(20,80,118,80,A,4)+tx(70,60,'0보다 작아요',A);
  else if(w==='양수')s+=ln(122,80,220,80,A,4)+tx(170,60,'0보다 커요',A);
  else{for(let i=-5;i<=5;i++)s+=dot(120+i*20,80,A)}
  return sv(s)}
 for(let i=0;i<=10;i++)s+=tx(20+i*20,104,i,T,'middle',12);
 if(w==='뛰어 세기')for(let i=0;i<5;i++)s+=`<path d="M${20+i*40},74 Q${40+i*40},44 ${60+i*40},74" stroke="${A}" stroke-width="2.5"/>`;
 else if(w==='덧셈')s+=`<path d="M120,74 Q140,40 160,74" stroke="${A}" stroke-width="2.5"/>`+dot(120,80)+dot(160,80,A)+tx(140,40,'5 + 2 = 7',A);
 else if(w==='뺄셈')s+=`<path d="M140,74 Q120,40 100,74" stroke="${A}" stroke-width="2.5"/>`+dot(140,80)+dot(100,80,A)+tx(120,40,'6 − 2 = 4',A);
 else if(w==='반올림'){s=ln(20,80,220,80);for(let i=0;i<=10;i++){const x=20+i*20;s+=ln(x,i%5?75:70,x,i%5?85:90,B,2)}s+=tx(20,110,'5')+tx(220,110,'6')+tx(120,110,'5.5',A)+dot(80,80,A)+tx(80,62,'5.3 → 5',A)+dot(160,80,A)+tx(160,62,'5.7 → 6',A);}
 else if(w==='소수(小數)'){s=ln(20,80,220,80);for(let i=0;i<=10;i++){const x=20+i*20;s+=ln(x,i%10?75:68,x,i%10?85:92,B,2)}s+=tx(20,112,'0')+tx(220,112,'1')+tx(40,62,'0.1',A)+dot(40,80,A)+tx(120,62,'0.5',A)+dot(120,80,A);}
 else if(w==='영')s+=dot(20,80,A,6)+tx(20,58,'0',A,'middle',18);
 else if(w==='수직선')s+=tx(120,40,'같은 간격으로 눈금',A);
 return sv(s)};
P.range=w=>{let s=ln(20,80,220,80);for(let i=0;i<=8;i++){const x=30+i*24;s+=ln(x,74,x,86,B,2)+tx(x,106,i+3,T,'middle',12)}
 const bx=30+2*24;/*5*/ const fill=w==='이상'||w==='이하';const right=w==='이상'||w==='초과';
 s+=`<circle cx="${bx}" cy="80" r="7" fill="${fill?A:'#fff'}" stroke="${A}" stroke-width="2.5"/>`;
 s+=right?arr(bx+8,80,218,80,A):arr(bx-8,80,22,80,A);
 s+=tx(120,42,{이상:'5 이상: 5도 들어가요',이하:'5 이하: 5도 들어가요',초과:'5 초과: 5는 빠져요',미만:'5 미만: 5는 빠져요'}[w],A);return sv(s)};
P.place=()=>{const c=['천','백','십','일'],d=['3','3','3','3'],v=['3000','300','30','3'];let s='';c.forEach((k,i)=>{const x=30+i*48;s+=`<rect x="${x}" y="30" width="44" height="44" rx="8" fill="${i===1?AF:F}" stroke="${i===1?A:B}" stroke-width="2"/>`+tx(x+22,62,d[i],i===1?A:B,'middle',24)+tx(x+22,22,c[i])+tx(x+22,96,v[i],i===1?A:T,'middle',12)});s+=tx(120,130,'같은 3이라도 자리마다 값이 달라요',T,'middle',12);return sv(s)};
P.vcalc=w=>{const sub=w==='받아내림';let s=`<rect x="70" y="10" width="100" height="125" rx="10" fill="#fff" stroke="${G}" stroke-width="1.5"/>`;
 if(sub)s+=tx(108,30,'3',A,'middle',13)+tx(130,30,'10',A,'middle',13)+ln(100,52,114,40,A,1.5)+tx(110,58,'4',B,'middle',22)+tx(134,58,'5',B,'middle',22)+tx(88,86,'−',B,'middle',22)+tx(110,86,'2',B,'middle',22)+tx(134,86,'7',B,'middle',22)+ln(82,96,150,96)+tx(110,122,'1',A,'middle',22)+tx(134,122,'8',A,'middle',22);
 else s+=tx(110,30,'1',A,'middle',14)+tx(110,58,'2',B,'middle',22)+tx(134,58,'7',B,'middle',22)+tx(88,86,'+',B,'middle',22)+tx(134,86,'8',B,'middle',22)+ln(82,96,150,96)+tx(110,122,'3',A,'middle',22)+tx(134,122,'5',A,'middle',22);
 return sv(s)};
P.array=()=>{let s='';for(let r=0;r<3;r++)for(let c=0;c<4;c++)s+=`<circle cx="${70+c*30}" cy="${35+r*30}" r="10" fill="${F}" stroke="${B}" stroke-width="2"/>`;s+=`<rect x="54" y="20" width="32" height="92" rx="10" stroke="${A}" stroke-width="2"/>`+tx(120,135,'3 × 4 = 4 × 3 = 12',T);return sv(s)};
P.grid99=()=>{let s='';for(let r=0;r<5;r++)for(let c=0;c<5;c++){const x=55+c*26,y=12+r*26;s+=`<rect x="${x}" y="${y}" width="26" height="26" fill="${r===0||c===0?F:'#fff'}" stroke="${G}"/>`;const v=r===0&&c===0?'×':r===0?c+5:c===0?r+5:(r+5)*(c+5);s+=tx(x+13,y+18,v,(r===2&&c===3)?A:r===0||c===0?B:T,'middle',11)}return sv(s)};
P.square=()=>{let s='';for(let r=0;r<3;r++)for(let c=0;c<3;c++)s+=`<rect x="${75+c*30}" y="${15+r*30}" width="30" height="30" fill="${F}" stroke="${B}" stroke-width="2"/>`;s+=tx(120,130,'3 × 3 = 3² = 9',A);return sv(s)};
/* 분수 원 */
const pie=(cx,cy,r,n,k,c2=A)=>{let s='';for(let i=0;i<n;i++){const a1=-90+i*360/n,a2=-90+(i+1)*360/n,p=a=>[cx+r*Math.cos(a*Math.PI/180),cy+r*Math.sin(a*Math.PI/180)];const[x1,y1]=p(a1),[x2,y2]=p(a2);s+=`<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2} Z" fill="${i<k?AF:F}" stroke="${i<k?c2:B}" stroke-width="2"/>`}return s};
const frac=(x,y,a,b,ca=B,cb=B)=>tx(x,y-6,a,ca,'middle',20)+ln(x-14,y,x+14,y,T,2)+tx(x,y+22,b,cb,'middle',20);
P.frac4=w=>sv(pie(80,75,52,4,3)+frac(180,72,'3','4',w==='분자'?A:B,w==='분모'?A:B)+(w==='분자'?tx(200,62,'분자',A,'start'):'')+(w==='분모'?tx(200,98,'분모',A,'start'):''));
P.frac8=w=>sv(pie(80,75,52,8,w==='전체'?8:1)+(w==='전체'?tx(180,80,'전체 = 1',A,'middle',16):frac(180,72,'1','8')));
P.frac6=()=>sv(pie(120,75,55,6,1)+tx(210,80,'6등분',A,'middle',14));
P.frac2=()=>sv(pie(90,75,52,2,1)+frac(185,72,'1','2'));
/* 선과 점 */
P.pt=()=>sv(dot(120,70,A,5)+tx(120,100,'점 ㄱ'));
P.lines=w=>{const hi={곧은선:1,'곧은 선':1,'굽은 선':2,곡선:2};const k=hi[w]||0;return sv(ln(30,45,210,45,k===1?A:B,3)+`<path d="M30,105 C70,60 110,140 150,95 S200,80 210,100" stroke="${k===2?A:B}" stroke-width="3"/>`+tx(120,30,'곧은 선',k===1?A:T)+tx(120,140,'굽은 선(곡선)',k===2?A:T))};
P.lineseg=w=>{let s='';const r=(y,a,b,c,l)=>{s+=ln(40,y,200,y,c,3);if(a)s+=arr(60,y,30,y,c);if(b)s+=arr(180,y,210,y,c);s+=dot(70,y)+dot(170,y)+tx(70,y+20,'ㄱ')+tx(170,y+20,'ㄴ')+tx(228,y+5,l,c,'end',12)};
 const k={직선:0,선분:1,반직선:2,거리:1}[w];
 s='';const rows=[['직선',1,1],['선분',0,0],['반직선',0,1]];rows.forEach((q,i)=>{const y=30+i*45,c=i===k?A:B;s+=ln(q[1]?62:100,y,q[2]?226:190,y,c,3);if(q[1])s+=pl([[70,y-6],[62,y],[70,y+6]],c);if(q[2])s+=pl([[218,y-6],[226,y],[218,y+6]],c);s+=dot(100,y,c)+dot(190,y,c)+tx(8,y+5,q[0],i===k?A:T,'start',12)});
 return sv(s)};
/* 각 */
const angleFig=(deg,lab)=>{const cx=70,cy=115,L=120,a=deg*Math.PI/180;let s=ln(cx,cy,cx+L,cy)+ln(cx,cy,cx+L*Math.cos(a),cy-L*Math.sin(a))+dot(cx,cy);s+=deg===90?rA(cx,cy,1,-1,16):arc(cx,cy,26,0,deg);s+=tx(cx+40*Math.cos(a/2)+8,cy-40*Math.sin(a/2)+4,lab,A,'start',14);return sv(s)};
P.ang=w=>{const s=angleFig(50,w==='각도'?'50°':'');return w==='각'?s.replace('</svg>',tx(62,135,'꼭짓점',T,'middle',11)+tx(200,108,'변',T)+tx(150,30,'변',T)+'</svg>'):s};
P.ang90=()=>angleFig(90,'90°');P.ang60=()=>angleFig(40,'40°');P.ang120=()=>angleFig(130,'130°');
P.ang180=()=>sv(ln(20,100,220,100)+dot(120,100)+arc(120,100,30,0,180)+tx(120,58,'180°',A,'middle',16));
P.prot=()=>sv(`<path d="M30,120 A90,90 0 0 1 210,120 Z" fill="${F}" stroke="${B}" stroke-width="2.5"/>`+(()=>{let s='';for(let i=0;i<=18;i++){const a=i*10*Math.PI/180;s+=ln(120+80*Math.cos(a),120-80*Math.sin(a),120+(i%9?72:62)*Math.cos(a),120-(i%9?72:62)*Math.sin(a),B,1.5)}return s})()+dot(120,120,A,4)+ln(120,120,120+85*Math.cos(1.05),120-85*Math.sin(1.05),A,2.5)+tx(120,140,'중심을 꼭짓점에',A,'middle',11));
P.perp=w=>sv(ln(30,110,210,110)+ln(120,20,120,110,w==='수선'?A:B)+rA(120,110,1,-1,14)+tx(170,40,w==='수선'?'수선':'직각으로 만나요',A,'middle'));
P.par=w=>sv(ln(30,45,210,45)+ln(30,105,210,105)+(w==='평행선 사이의 거리'?ln(120,45,120,105,A,3)+rA(120,105,1,-1,10)+tx(130,80,'거리',A,'start'):tx(120,80,'끝까지 늘여도 안 만나요',A)));
P.cross=w=>{let s=ln(40,30,200,120)+ln(40,120,200,30)+dot(120,75,w==='교점'?A:B,w==='교점'?5:3.5);if(w==='맞꼭지각')s+=arc(120,75,22,150,210)+arc(120,75,22,-30,30);else if(w==='교각')s+=arc(120,75,18,30,150)+arc(120,75,24,150,210,B)+arc(120,75,18,210,330)+arc(120,75,24,-30,30,B);s+=w==='교점'?tx(120,110,'교점',A):'';return sv(s)};
P.trans=w=>{let s=ln(20,45,220,45)+ln(20,105,220,105)+ln(80,15,170,135);const ix=a=>80+(a-15)*(90/120);const x1=ix(45),x2=ix(105);
 if(w==='동위각')s+=arc(x1,45,16,307,360)+arc(x2,105,16,307,360);else s+=arc(x1,45,16,307,360)+arc(x2,105,16,127,180);return sv(s+tx(100,144,'평행선에서는 크기가 같아요',T,'middle',11))};
P.mid=w=>sv(ln(30,90,210,90)+dot(30,90)+dot(210,90)+dot(120,90,A,5)+tx(30,115,'A')+tx(210,115,'B')+tx(120,115,'O',A)+ln(70,84,70,96,A,2)+ln(166,84,166,96,A,2)+(w==='수직이등분선'?ln(120,20,120,135,A,2.5)+rA(120,90,1,-1,12):''));
/* 다각형 */
const TRI=[[40,125],[200,125],[130,25]];
P.tri=w=>{let s=poly(TRI);if(w==='꼭짓점')TRI.forEach(p=>s+=dot(p[0],p[1],A,5));else if(w==='변')s+=ln(40,125,200,125,A,4)+tx(120,145,'변',A);else if(w==='내각')s+=arc(40,125,20,0,55)+arc(200,125,20,125,180)+arc(130,25,18,235,305)+tx(120,80,'합 180°',A);else if(w==='삼각형')s+=tx(120,95,'변 3 · 꼭짓점 3 · 각 3',T,'middle',11);return sv(s)};
P.trir=w=>sv(poly([[50,125],[190,125],[50,25]])+rA(50,125,1,-1,14)+(w==='빗변'?ln(190,125,50,25,A,4)+tx(135,65,'빗변',A,'start'):tx(150,105,'직각 하나',A)));
P.tria=()=>sv(poly([[50,125],[190,125],[120,22]])+tx(120,100,'세 각 모두 예각',A,'middle',12));
P.trio=()=>sv(poly([[20,120],[220,120],[70,70]])+arc(70,70,16,225,341.6)+tx(70,55,'둔각',A));
P.trii=w=>sv(poly([[50,125],[190,125],[120,20]])+ln(78,70,92,78,A,2)+ln(148,78,162,70,A,2)+(w==='밑각'||w==='이등변삼각형'?arc(50,125,22,0,56)+arc(190,125,22,124,180):''));
P.trie=()=>sv(poly([[50,125],[190,125],[120,4+4]])+tx(120,90,'60°씩',A,'middle',12));
P.trih=w=>sv(poly([[30,125],[210,125],[150,25]])+ln(150,25,150,125,A,2.5,'6 5')+rA(150,125,-1,-1,10)+(w==='밑변'?ln(30,125,210,125,A,4)+tx(120,145,'밑변',A):tx(162,85,'높이',A,'start')));
P.quad=()=>sv(poly([[40,120],[190,125],[210,40],[70,25]]));
P.trap=()=>sv(poly([[30,120],[210,120],[160,35],[80,35]])+ln(80,35,160,35,A,4)+ln(30,120,210,120,A,4)+tx(120,145,'한 쌍이 평행',A,'middle',12));
P.para=()=>sv(poly([[30,115],[170,115],[210,35],[70,35]])+ln(30,115,170,115,A,3.5)+ln(70,35,210,35,A,3.5)+tx(120,140,'두 쌍 모두 평행',A,'middle',12));
P.rhom=()=>sv(poly([[120,15],[195,75],[120,135],[45,75]])+ln(120,15,120,135,A,2,'5 4')+ln(45,75,195,75,A,2,'5 4')+rA(120,75,1,-1,9));
P.rect=w=>sv(poly([[40,30],[200,30],[200,120],[40,120]])+rA(40,30,1,1)+rA(200,30,-1,1)+rA(40,120,1,-1)+rA(200,120,-1,-1)+(w==='가로'?ln(40,120,200,120,A,4)+tx(120,142,'가로',A):w==='세로'?ln(200,30,200,120,A,4)+tx(218,80,'세로',A):w==='마주 보다'?ln(40,30,200,30,A,4)+ln(40,120,200,120,A,4):''));
P.sq=w=>sv(poly([[70,25],[170,25],[170,125],[70,125]])+(w==='둘레'?pl([[70,25],[170,25],[170,125],[70,125],[70,25]],A,4)+tx(205,80,'한 바퀴',A):rA(70,25,1,1)+rA(170,25,-1,1)+rA(70,125,1,-1)+rA(170,125,-1,-1)));
const reg=(n,cx,cy,r,f=F,c=B,rot=-90)=>poly(Array.from({length:n},(_,i)=>[cx+r*Math.cos((rot+i*360/n)*Math.PI/180),cy+r*Math.sin((rot+i*360/n)*Math.PI/180)]),f,c);
P.pent=()=>sv(reg(5,120,78,58));P.hex=()=>sv(reg(6,120,75,58,F,B,0));
P.polys=w=>sv(reg(3,40,85,32)+reg(4,98,85,30,F,B,45)+reg(5,158,85,30)+reg(6,212,85,26,F,B,0)+(w==='다각형'?tx(120,140,'선분으로 둘러싸인 도형',A,'middle',12):tx(120,140,'변과 각이 모두 같아요',A,'middle',12)));
P.diag=()=>sv(poly([[40,30],[200,30],[200,120],[40,120]])+ln(40,30,200,120,A,3)+ln(200,30,40,120,A,3));
P.tangram=()=>sv(`<g transform="translate(60,15)">`+poly([[0,0],[120,0],[60,60]])+poly([[0,0],[60,60],[0,120]],AF,A)+poly([[120,0],[120,60],[90,30]])+poly([[90,30],[120,60],[90,90],[60,60]])+poly([[60,60],[90,90],[30,90]])+poly([[0,120],[30,90],[90,90],[60,120]])+poly([[120,60],[120,120],[60,120]])+`</g>`);
P.pento=()=>{let s='';[[0,0],[1,0],[1,1],[1,2],[2,1]].forEach(([x,y])=>s+=`<rect x="${85+x*24}" y="${30+y*24}" width="24" height="24" fill="${AF}" stroke="${A}" stroke-width="2"/>`);return sv(s+tx(120,135,'정사각형 5개',T,'middle',12))};
P.tess=()=>{let s='';for(let r=0;r<4;r++)for(let c=0;c<6;c++){const x=30+c*36+(r%2)*18,y=20+r*30;s+=poly([[x,y],[x+36,y],[x+18,y+30]],(r+c)%2?F:AF,B,1.5)+poly([[x+36,y],[x+54,y+30],[x+18,y+30]],F,B,1.5)}return sv(`<clipPath id="tc"><rect x="20" y="15" width="200" height="120"/></clipPath><g clip-path="url(#tc)">${s}</g>`)};
/* 원 */
P.circ=w=>{const cx=120,cy=75,r=55;let s=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${F}" stroke="${w==='원주'||w==='원'?A:B}" stroke-width="${w==='원주'?4:2.5}"/>`+dot(cx,cy,w==='원의 중심'?A:B,w==='원의 중심'?5:3.5);
 if(w==='반지름')s+=ln(cx,cy,cx+r,cy,A,3.5)+tx(cx+28,cy-8,'반지름',A);
 else if(w==='원의 지름'||w==='지름')s+=ln(cx-r,cy,cx+r,cy,A,3.5)+tx(cx,cy-10,'지름',A);
 else if(w==='원주율')s+=ln(cx-r,cy,cx+r,cy,B,2.5)+tx(cx,cy+24,'원주 ÷ 지름 ≈ 3.14',A,'middle',12);
 else if(w==='원의 넓이')s=s.replace(`fill="${F}"`,`fill="${AF}"`)+ln(cx,cy,cx+r,cy)+tx(cx+28,cy-8,'r');
 else if(w==='원의 중심')s+=tx(cx,cy+22,'중심',A);
 return sv(s)};
P.arc=w=>{const cx=120,cy=78,r=58;const p=a=>[cx+r*Math.cos(a*Math.PI/180),cy-r*Math.sin(a*Math.PI/180)];const[a1,a2]=[p(20),p(140)];let s=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${F}" stroke="${B}" stroke-width="2.5"/>`+dot(cx,cy);
 s+=w==='현'?ln(a1[0],a1[1],a2[0],a2[1],A,3.5)+tx(cx,a2[1]+28,'현',A):arc(cx,cy,r,20,140,A,5)+tx(170,26,'호',A,'start');s+=dot(a1[0],a1[1])+dot(a2[0],a2[1]);return sv(s)};
P.sector=w=>{const cx=120,cy=80,r=60;const p=a=>[cx+r*Math.cos(a*Math.PI/180),cy-r*Math.sin(a*Math.PI/180)];const[a1,a2]=[p(30),p(110)];return sv(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${F}" stroke="${B}" stroke-width="2"/><path d="M${cx},${cy} L${a1[0]},${a1[1]} A${r},${r} 0 0 0 ${a2[0]},${a2[1]} Z" fill="${AF}" stroke="${A}" stroke-width="2.5"/>`+(w==='중심각'?arc(cx,cy,16,30,110,A,3):''))};
P.ellipse=()=>sv(`<ellipse cx="120" cy="75" rx="90" ry="45" fill="${F}" stroke="${B}" stroke-width="2.5"/>`+dot(120,75));
/* 합동 닮음 이동 */
const shp=(x,y,k=1,f=F,c=B)=>poly([[x,y],[x+60*k,y],[x+20*k,y-55*k]],f,c);
P.cong=()=>sv(shp(30,115)+shp(140,115,1,AF,A)+tx(120,140,'모양도 크기도 같아요',T,'middle',12));
P.sim=()=>sv(shp(25,115,0.7)+shp(115,125,1.6,AF,A)+tx(120,145,'모양은 같고 크기만 달라요',T,'middle',12));
const flag=(x,y,s=1,f=F,c=B,mir=false)=>{const m=v=>mir?-v:v;return poly([[x,y],[x,y-60*s],[x+m(45)*s,y-45*s],[x,y-30*s]],f,c)};
P.slide=()=>sv(flag(40,110)+flag(150,110,1,AF,A)+arr(80,125,145,125,A));
P.flip=w=>sv(ln(120,15,120,135,A,2,'6 5')+flag(110,110,1,F,B,true)+flag(130,110,1,AF,A)+(w==='반사'?tx(120,144,'거울',A,'middle',11):''));
P.turn=w=>{const ccw=w==='반시계 방향';return sv(dot(120,80)+poly([[120,80],[120,25],[150,40],[120,55]],F,B)+poly([[120,80],[175,80],[160,110],[145,80]],AF,A)+(ccw?`<path d="M80,50 A50,50 0 0 1 120,25" stroke="${A}" stroke-width="2.5"/>`+pl([[112,20],[120,25],[113,32]],A):`<path d="M150,30 A55,55 0 0 1 180,60" stroke="${A}" stroke-width="2.5"/>`+pl([[172,58],[180,60],[183,52]],A))+tx(120,140,ccw?'반시계 방향':'시계 방향으로 90°',A,'middle',12))};
P.symline=()=>sv(`<path d="M120,130 C40,80 60,20 120,50 C180,20 200,80 120,130 Z" fill="${F}" stroke="${B}" stroke-width="2.5"/>`+ln(120,10,120,140,A,2.5,'6 5'));
P.pointsym=()=>sv(poly([[50,110],[150,110],[190,40],[90,40]])+ln(50,110,190,40,G,1.5)+ln(150,110,90,40,G,1.5)+dot(120,75,A,5)+tx(120,135,'180° 돌려도 같아요',A,'middle',12));
/* 입체 */
const box=(x,y,w,h,d,hl)=>{const o=d*0.6,u=d*0.45;let s=poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]])+poly([[x,y],[x+o,y-u],[x+w+o,y-u],[x+w,y]],'#f4f7fd')+poly([[x+w,y],[x+w+o,y-u],[x+w+o,y+h-u],[x+w,y+h]],'#dfe8f7');s+=ln(x,y+h,x+o,y+h-u,B,1.8,'5 4')+ln(x+o,y+h-u,x+w+o,y+h-u,B,1.8,'5 4')+ln(x+o,y+h-u,x+o,y-u,B,1.8,'5 4');return s};
P.cube=w=>{let s=box(70,50,80,80,80);if(w==='꼭짓점')s+=dot(70,50,A,5);if(w==='모서리')s+=ln(70,130,150,130,A,4);if(w==='면'||w==='수직인 면')s=s.replace(`points="70,50 150,50 150,130 70,130" fill="${F}"`,`points="70,50 150,50 150,130 70,130" fill="${AF}"`);if(w==='겨냥도')s+=tx(200,140,'안 보이는 선: 점선',A,'end',11);if(w==='꼬인 위치')s+=ln(70,50,150,50,A,4)+ln(150,130,198,94,A,4);return sv(s)};
P.cuboid=()=>sv(box(45,60,120,70,60));
P.prism=w=>{const s=poly([[60,125],[140,125],[100,95]],w==='밑면'||w==='밑넓이'?AF:F,w==='밑면'||w==='밑넓이'?A:B)+poly([[60,45],[140,45],[100,15]],w==='밑면'?AF:F,w==='밑면'?A:B)+ln(60,45,60,125)+ln(140,45,140,125)+ln(100,15,100,95,B,1.8,'5 4');return sv(s+(w==='옆면'?poly([[60,45],[140,45],[140,125],[60,125]],AF,A):'')+(w==='옆면'?ln(60,45,60,125)+ln(140,45,140,125):''))};
P.prism5=()=>{const r=(cy)=>Array.from({length:5},(_,i)=>[120+55*Math.cos((-90+i*72)*Math.PI/180),cy+18*Math.sin((-90+i*72)*Math.PI/180)]);const t=r(35),b=r(115);let s=poly(t);[1,2,3,4].forEach(i=>s+=ln(t[i][0],t[i][1],b[i][0],b[i][1]));s+=pl([b[1],b[2],b[3],b[4]]);return sv(s)};
P.cyl=w=>sv(`<path d="M60,35 L60,115 A60,18 0 0 0 180,115 L180,35" fill="${w==='곡면'||w==='회전체'?AF:F}" stroke="${w==='곡면'?A:B}" stroke-width="2.5"/><ellipse cx="120" cy="35" rx="60" ry="18" fill="#f4f7fd" stroke="${B}" stroke-width="2.5"/>`+`<path d="M60,115 A60,18 0 0 1 180,115" stroke="${B}" stroke-width="1.8" stroke-dasharray="5 4"/>`+(w==='회전체'?ln(120,8,120,140,A,2,'6 5'):''));
P.pyr=()=>sv(poly([[40,120],[150,120],[200,95]],'#dfe8f7')+poly([[40,120],[150,120],[120,20]])+poly([[150,120],[200,95],[120,20]],'#dfe8f7')+ln(40,120,90,95,B,1.8,'5 4')+ln(90,95,200,95,B,1.8,'5 4')+ln(90,95,120,20,B,1.8,'5 4'));
P.pyrh=()=>sv(poly([[40,120],[150,120],[120,20]])+poly([[150,120],[200,95],[120,20]],'#dfe8f7')+ln(40,120,90,95,B,1.8,'5 4')+ln(90,95,200,95,B,1.8,'5 4')+ln(120,20,120,108,A,3)+tx(130,70,'높이',A,'start'));
P.cone=w=>sv(`<path d="M60,115 L120,20 L180,115" fill="${F}" stroke="${B}" stroke-width="2.5"/><ellipse cx="120" cy="115" rx="60" ry="17" fill="#f4f7fd" stroke="${B}" stroke-width="2.5"/>`+dot(120,20)+(w==='모선'?ln(120,20,180,115,A,4)+tx(165,60,'모선',A,'start'):w==='원뿔의 높이'?ln(120,20,120,115,A,3,'6 5')+tx(128,80,'높이',A,'start'):''));
P.sphere=()=>sv(`<circle cx="120" cy="75" r="58" fill="${F}" stroke="${B}" stroke-width="2.5"/><ellipse cx="120" cy="75" rx="58" ry="16" stroke="${A}" stroke-width="2"/>`+dot(120,75));
P.net=()=>{let s='';[[1,0],[0,1],[1,1],[2,1],[3,1],[1,2]].forEach(([x,y])=>s+=`<rect x="${40+x*38}" y="${18+y*38}" width="38" height="38" fill="${x===1&&y===1?AF:F}" stroke="${B}" stroke-width="2"/>`);return sv(s)};
/* 측정 */
P.ruler=w=>{let s=`<rect x="20" y="50" width="200" height="44" rx="6" fill="#fff" stroke="${B}" stroke-width="2"/>`;for(let i=0;i<=40;i++){const x=30+i*4.5;s+=ln(x,50,x,50+(i%10===0?18:i%5===0?12:7),B,1.4);if(i%10===0)s+=tx(x,84,i/10,T,'middle',11)}
 if(w==='밀리미터')s+=ln(30,40,34.5,40,A,4)+tx(32,32,'1mm',A,'start',12);else if(w==='센티미터'||w==='단위길이')s+=ln(30,40,75,40,A,4)+tx(52,32,'1cm',A,'middle',12);else if(w==='길이'||w==='자')s+=`<rect x="30" y="112" width="135" height="12" rx="6" fill="${AF}" stroke="${A}" stroke-width="2"/>`+tx(200,122,'3cm',A);else if(w==='눈금')s+=dot(75,46,A,4);return sv(s)};
P.grid=w=>{let s='';for(let r=0;r<4;r++)for(let c=0;c<6;c++){const on=(w==='넓이'&&r<2&&c<3)||((w==='단위넓이'||w==='제곱센티미터')&&r===0&&c===0);s+=`<rect x="${48+c*24}" y="${20+r*24}" width="24" height="24" fill="${on?AF:'#fff'}" stroke="${on?A:G}" stroke-width="${on?2:1.2}"/>`}
 s+=w==='넓이'?tx(120,135,'1cm² 6칸 = 6cm²',A,'middle',12):w==='모눈종이'?'':tx(120,135,'1cm × 1cm = 1cm²',A,'middle',12);return sv(s)};
P.geo=()=>{let s=`<rect x="50" y="15" width="140" height="120" rx="10" fill="${F}" stroke="${B}" stroke-width="2"/>`;for(let r=0;r<5;r++)for(let c=0;c<6;c++)s+=dot(70+c*20,30+r*22,B,2.5);return sv(s+poly([[70,118],[170,118],[110,30]],'none',A,3))};
P.bars=w=>sv(`<rect x="30" y="45" width="170" height="16" rx="8" fill="${w==='길다'?AF:F}" stroke="${w==='길다'?A:B}" stroke-width="2"/><rect x="30" y="90" width="90" height="16" rx="8" fill="${w==='짧다'?AF:F}" stroke="${w==='짧다'?A:B}" stroke-width="2"/>`+ln(30,30,30,120,T,1.5,'4 4')+tx(30,138,'끝을 맞춰요',T,'start',11));
P.scale=w=>{const L=w==='가볍다',H=w==='무겁다';let s=poly([[120,50],[100,128],[140,128]],F)+ln(70,128,170,128,B,3)+ln(40,40,200,62)+dot(120,51,B,4);
 const pan=(x,y,hl,r)=>ln(x,y,x-18,y+30,B,1.5)+ln(x,y,x+18,y+30,B,1.5)+`<path d="M${x-24},${y+30} L${x+24},${y+30} Q${x},${y+48} ${x-24},${y+30} Z" fill="#fff" stroke="${B}" stroke-width="2"/>`+`<circle cx="${x}" cy="${y+30-r}" r="${r}" fill="${hl?AF:F}" stroke="${hl?A:B}" stroke-width="2"/>`;
 return sv(s+pan(40,40,L,8)+pan(200,62,H,15))};
P.cup=w=>sv(`<path d="M80,25 L90,130 L150,130 L160,25" fill="#fff" stroke="${B}" stroke-width="2.5"/><path d="M84.5,65 L90,130 L150,130 L155.5,65 Z" fill="${AF}" stroke="none"/>`+ln(84.5,65,155.5,65,A,2)+tx(200,70,w==='밀리리터'?'500mL':'1L',A));
P.therm=()=>sv(`<rect x="110" y="15" width="20" height="100" rx="10" fill="#fff" stroke="${B}" stroke-width="2.5"/><circle cx="120" cy="122" r="15" fill="${AF}" stroke="${A}" stroke-width="2.5"/><rect x="116" y="70" width="8" height="45" fill="${A}" stroke="none"/>`+ln(130,60,145,60,B,1.5)+tx(150,64,'0°C',T,'start',12)+tx(150,94,'−3°C',A,'start',12));
P.clock=w=>{let s=`<circle cx="120" cy="75" r="58" fill="#fff" stroke="${B}" stroke-width="2.5"/>`;for(let i=1;i<=12;i++){const a=(i*30-90)*Math.PI/180;s+=tx(120+46*Math.cos(a),79+46*Math.sin(a),i,T,'middle',11)}s+=ln(120,75,120,32,B,2.5)+ln(120,75,135,98,A,4)+dot(120,75);return sv(s)};
/* 자료 */
const tbl=(r,hi)=>{let s='';const cw=r[0].length===2?[80,60]:[60,60];r.forEach((q,i)=>{let x=120-(cw[0]+cw[1])/2;q.forEach((v,j)=>{s+=`<rect x="${x}" y="${12+i*30}" width="${cw[j]}" height="30" fill="${i===0?F:hi(i,j)?AF:'#fff'}" stroke="${B}" stroke-width="1.5"/>`+tx(x+cw[j]/2,32+i*30,v,hi(i,j)?A:T,'middle',12);x+=cw[j]})});return sv(s)};
P.freqtab=w=>tbl([['키(cm)','학생 수'],['140~145','2'],['145~150','11'],['150~155','13']],(i,j)=>w==='계급'?j===0&&i>0:w==='도수'?j===1&&i>0:false);
P.corr=()=>{const r=[['내 나이','3','8','13'],['아빠 나이','30','35','40']];let s='';r.forEach((q,i)=>q.forEach((v,j)=>{const x=[10,90,140,190][j],wd=j?50:80;s+=`<rect x="${x}" y="${40+i*34}" width="${wd}" height="34" fill="${j===0?F:'#fff'}" stroke="${B}" stroke-width="1.5"/>`+tx(x+wd/2,62+i*34,v,j?A:T,'middle',13)}));return sv(s+tx(120,135,'아빠 나이 = 내 나이 + 27',T,'middle',12))};
P.table=()=>{const r=[['종류','개수'],['연필','4'],['지우개','2'],['합계','6']];let s='';r.forEach((q,i)=>q.forEach((v,j)=>{s+=`<rect x="${60+j*60}" y="${12+i*30}" width="60" height="30" fill="${i===0?F:i===3?AF:'#fff'}" stroke="${B}" stroke-width="1.5"/>`+tx(90+j*60,32+i*30,v,i===3?A:T,'middle',12)}));return sv(s)};
P.bar=()=>{let s=ln(40,125,215,125)+ln(40,15,40,125);[60,90,40,110].forEach((h,i)=>s+=`<rect x="${55+i*40}" y="${125-h}" width="24" height="${h}" fill="${i===3?AF:F}" stroke="${i===3?A:B}" stroke-width="2"/>`);return sv(s)};
P.lineg=w=>{let s=ln(40,125,215,125)+ln(40,15,40,125);const p=[[60,95],[95,80],[130,70],[165,45],[200,35]];s+=pl(p,A,3);p.forEach(q=>s+=dot(q[0],q[1],A));if(w==='물결선')s+=`<path d="M28,112 q6,-7 12,0 t12,0" stroke="${A}" stroke-width="3" fill="#fff"/>`+tx(60,140,'물결선',A,'start',12);return sv(s)};
P.band=()=>{const v=[40,25,20,15];let x=20,s='';v.forEach((p,i)=>{const w=p*2;s+=`<rect x="${x}" y="55" width="${w}" height="36" fill="${i===0?AF:F}" stroke="${i===0?A:B}" stroke-width="2"/>`+tx(x+w/2,78,p+'%',i===0?A:T,'middle',12);x+=w});return sv(s+tx(120,120,'띠 전체 = 100%',T,'middle',12))};
P.pie=()=>sv(pie(120,75,58,8,3)+tx(120,145,'원 전체 = 100%',T,'middle',12));
P.picg=()=>{let s='';const big=(x,y)=>`<circle cx="${x}" cy="${y}" r="11" fill="${AF}" stroke="${A}" stroke-width="2"/>`,sm=(x,y)=>`<circle cx="${x}" cy="${y}" r="6" fill="${F}" stroke="${B}" stroke-width="2"/>`;s+=tx(30,45,'가',T,'start')+big(70,40)+big(98,40)+sm(120,40)+tx(30,95,'나',T,'start')+big(70,90)+sm(92,90)+sm(108,90)+sm(124,90);s+=big(170,30)+tx(188,35,'10',T,'start',12)+sm(170,62)+tx(188,66,'1',T,'start',12);return sv(s)};
P.hist=()=>{let s=ln(30,125,215,125)+ln(30,15,30,125);[40,85,100,55].forEach((h,i)=>s+=`<rect x="${45+i*40}" y="${125-h}" width="40" height="${h}" fill="${i===2?AF:F}" stroke="${i===2?A:B}" stroke-width="2"/>`);return sv(s+tx(120,145,'기둥을 붙여 그려요',T,'middle',11))};
P.tree=()=>{let s=dot(30,75,B,5);const c=['빨','파','노'];c.forEach((k,i)=>{const y=25+i*50;s+=ln(30,75,100,y)+`<circle cx="110" cy="${y}" r="11" fill="${F}" stroke="${B}" stroke-width="2"/>`+tx(110,y+5,k,T,'middle',11);c.filter(q=>q!==k).forEach((q,j)=>{const y2=y-12+j*24;s+=ln(121,y,180,y2,A,2)+tx(195,y2+5,q,A,'middle',11)})});return sv(s)};
P.dice=()=>{let s=`<rect x="75" y="30" width="90" height="90" rx="16" fill="#fff" stroke="${B}" stroke-width="2.5"/>`;[[97,52],[143,52],[97,75],[143,75],[97,98],[143,98]].forEach(p=>s+=dot(p[0],p[1],A,7));return sv(s)};
P.venn=w=>{const c1=`<circle cx="95" cy="75" r="50" fill="${F}" fill-opacity=".8" stroke="${B}" stroke-width="2.5"/>`,c2=`<circle cx="150" cy="75" r="50" fill="${F}" fill-opacity=".8" stroke="${B}" stroke-width="2.5"/>`;
 if(w==='부분집합')return sv(`<circle cx="120" cy="75" r="62" fill="${F}" stroke="${B}" stroke-width="2.5"/><circle cx="110" cy="80" r="30" fill="${AF}" stroke="${A}" stroke-width="2.5"/>`+tx(110,85,'A',A,'middle',16)+tx(165,50,'B',B,'middle',16));
 let s=c1+c2;if(w==='교집합')s+=`<path d="M122.5,33 A50,50 0 0 1 122.5,117 A50,50 0 0 1 122.5,33 Z" fill="${AF}" stroke="${A}" stroke-width="2.5"/>`;if(w==='합집합')s=s.replace(/fill="#e9f0fb"/g,`fill="${AF}"`);return sv(s+tx(70,80,'A',B,'middle',15)+tx(175,80,'B',B,'middle',15))};
P.coord=w=>{let s='';for(let i=0;i<=6;i++)s+=ln(50+i*25,15,50+i*25,125,G,1)+ln(50,125-i*18,200,125-i*18,G,1);s+=arr(50,125,210,125)+arr(50,125,50,8)+dot(50,125,w==='원점'?A:B,w==='원점'?5:3.5)+tx(44,140,'O',w==='원점'?A:T);if(w!=='원점')s+=dot(125,89,A,5)+tx(132,82,'(3, 2)',A,'start')+ln(125,89,125,125,A,1.5,'4 4')+ln(50,89,125,89,A,1.5,'4 4');return sv(s)};
P.magic=()=>{const m=[[2,7,6],[9,5,1],[4,3,8]];let s='';m.forEach((r,i)=>r.forEach((v,j)=>s+=`<rect x="${75+j*30}" y="${15+i*30}" width="30" height="30" fill="${i===1?AF:'#fff'}" stroke="${B}" stroke-width="1.5"/>`+tx(90+j*30,36+i*30,v,T,'middle',15)));return sv(s+tx(120,130,'줄마다 합 15',A,'middle',12))};
window.FIG=(k,w)=>P[k]?P[k](w):'';
})();
