'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const slug=s=>s.trim().toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g,'');
let QT=null;const NQ=10,TL=20,P=new URLSearchParams(location.search);
// ===== Banco de dados: Firebase Realtime Database (REST). Sem URL = modo teste local =====
const okDb=u=>/^https:\/\/[a-z0-9.-]+\.(firebaseio\.com|firebasedatabase\.app)$/.test(u);
const clean=u=>(u||'').trim().replace(/\/+$/,'');
let DB=[clean(P.get('db')),clean(localStorage.getItem('mpDb'))].find(okDb)||'';
if(DB)localStorage.setItem('mpDb',DB);
const ID=localStorage.mpId||(localStorage.mpId=Math.random().toString(36).slice(2,10));
let SND=localStorage.mpSnd!=='0',TM=null,PR=null,Q=null;
function loc(path,m,body){const all=JSON.parse(localStorage.getItem('mpL')||'{}'),ps=path.split('/');let o=all;
 if(m==='GET'){for(const p of ps)o=o&&o[p];return o===undefined?null:o}
 for(const p of ps.slice(0,-1))o=o[p]=o[p]||{};o[ps[ps.length-1]]=body;localStorage.setItem('mpL',JSON.stringify(all));return body}
async function api(path,m,body){if(!DB)return loc(path,m,body);
 const r=await fetch(`${DB}/${path}.json`,{method:m,body:body===undefined?undefined:JSON.stringify(body)});if(!r.ok)throw new Error(r.status);return r.json()}
// ===== Utilidades =====
let AC;function beep(ok){if(!SND)return;try{AC=AC||new AudioContext();const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=ok?660:180;g.gain.value=.08;o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+.15)}catch(e){}}
function show(id){clearInterval(TM);clearInterval(QT);TM=null;$$('main>section').forEach(s=>s.hidden=s.id!=='s-'+id);scrollTo(0,0);const h=$('#s-'+id+' h1,#s-'+id+' h2');if(h){h.tabIndex=-1;h.focus()}}
const sorted=o=>Object.entries(o||{}).sort((a,b)=>(b[1].p-a[1].p)||(a[1].t-b[1].t));
const row=(i,x,bar)=>`<li><span>${['','',''][i]||(i+1)+'º'}</span><b>${esc(x.n)}</b>${bar?`<i class="pbar"><u style="width:${100*(+x.q||0)/NQ}%"></u></i>`:''}<span>${+x.p||0} pts</span></li>`;
function fig(g){const X=x=>140+20*x,Y=y=>140-20*y,{h=0,k=0,p=1,v=1,s=''}=g;let d='',gr='';
 for(let i=-6;i<=6;i++)gr+=`<path class="${i?'gl':'gx'}" d="M${X(i)} 0V280M0 ${Y(i)}H280"/>`;
 for(let t=-7;t<=7;t+=.2){const x=v?t:h+(t-k)**2/(4*p),y=v?k+(t-h)**2/(4*p):t;if(Math.abs(x)<=7&&Math.abs(y)<=7)d+=(d?'L':'M')+X(x).toFixed(1)+' '+Y(y).toFixed(1)}
 const V=[h,k],F=v?[h,k+p]:[h+p,k],pt=(c,l)=>`<circle cx="${X(c[0])}" cy="${Y(c[1])}" r="5" class="pt"/><text x="${X(c[0])+9}" y="${Y(c[1])-8}" class="pl">${l}</text>`;
 return `<svg viewBox="0 0 280 280" class="fg" role="img" aria-label="Gráfico de uma parábola">${gr}<path class="pc" d="${d}"/>${s.includes('D')?`<path class="pd" d="${v?`M0 ${Y(k-p)}H280`:`M${X(h-p)} 0V280`}"/>`:''}${s.includes('V')?pt(V,'V'):''}${s.includes('F')?pt(F,'F'):''}</svg>`}
function ask(box,q,cb,shuf,post,T){clearInterval(QT);const idx=q.o.map((_,i)=>i);if(shuf)idx.sort(()=>Math.random()-.5);
 box.innerHTML=`${T?'<div class="clock"><i></i><b>'+T+'s</b></div>':''}${q.g?`<div class="fig">${fig(q.g)}</div>`:''}<p class="q">${q.q}</p><div class="opts">${idx.map((i,n)=>`<button class="opt" data-i="${i}"><kbd>${'ABCD'[n]}</kbd><span>${q.o[i]}</span></button>`).join('')}</div><div class="fb" role="status" aria-live="polite"></div>`;
 let lock=false,left=T,t0=Date.now();
 const done=i=>{if(lock)return;lock=true;clearInterval(QT);const ok=i===q.a;$$('.opt',box).forEach(x=>{x.disabled=true;if(+x.dataset.i===q.a)x.classList.add('ok')});const b=$(`.opt[data-i="${i}"]`,box);if(b)b.classList.add(ok?'pop':'bad');
  const pts=cb(ok,left);$('.fb',box).innerHTML=`<b class="${ok?'g':'r'}">${ok?'Correto!'+(pts?' +'+pts+' pontos':''):(i<0?'Tempo esgotado. ':'Incorreta. ')+'Correta: '+q.o[q.a]}</b><br>${q.e}`;if(post)post(ok)};
 $$('.opt',box).forEach(b=>b.onclick=()=>done(+b.dataset.i));
 if(T){const c=$('.clock',box);QT=setInterval(()=>{left=Math.max(0,T-(Date.now()-t0)/1000);c.firstChild.style.transform=`scaleX(${left/T})`;c.lastChild.textContent=Math.ceil(left)+'s';c.classList.toggle('low',left<=5);if(left<=0)done(-1)},100)}}

// ===== Professor =====
async function profNew(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let c='';for(let i=0;i<5;i++)c+=A[Math.floor(Math.random()*A.length)];
 try{await api(`turmas/${c}/meta`,'PUT',{estado:'espera'})}catch(e){$('#dbMsg').textContent='Não consegui acessar o banco. Confira a URL e as regras.';$('#dbUrl').value=DB;show('setup');return}
 PR={c};const u=location.href.split(/[?#]/)[0]+'?sala='+c+(DB?'&db='+encodeURIComponent(DB):'');
 $('#pCode').textContent=c;$('#pLink').textContent=u;$('#pLink').href=u;$('#pqr').innerHTML='';
 const w=[];if(!DB)w.push('MODO TESTE: celulares NÃO conseguem entrar. Clique em “Banco de dados” e configure o Firebase.');if(location.protocol==='file:')w.push('Publique o jogo (ex.: GitHub Pages) para os alunos abrirem o link.');$('#pWarn').innerHTML=w.join('<br>');
 if(DB&&window.QRCode)new QRCode($('#pqr'),{text:u,width:200,height:200});
 show('prof');profTick();TM=setInterval(profTick,2000)}
async function profTick(){if(!PR)return;try{const d=await api('turmas/'+PR.c,'GET')||{},E=sorted(d.alunos),est=(d.meta||{}).estado||'espera';
 $('#pEst').textContent={espera:'Aguardando início',andamento:'Quiz em andamento',fim:'Quiz encerrado'}[est];
 $('#pCount').textContent=`${E.length} aluno(s) · ${E.filter(e=>e[1].fim).length} terminaram`;$('#pStart').hidden=est!=='espera';$('#pEnd').hidden=est!=='andamento';
 $('#pRank').innerHTML=E.length?E.map((e,i)=>row(i,e[1],1)).join(''):'<li class="mu">Nenhum aluno entrou ainda. Mostre o QR Code!</li>'}catch(e){$('#pEst').textContent='Sem conexão'}}
const setEst=async e=>{await api(`turmas/${PR.c}/meta`,'PUT',{estado:e});profTick()};
$('#pStart').onclick=()=>setEst('andamento');$('#pEnd').onclick=()=>setEst('fim');$('#pNew').onclick=profNew;
$('#pCfg').onclick=()=>{$('#dbUrl').value=DB;show('setup')};
$('#dbSave').onclick=()=>{const u=clean($('#dbUrl').value);if(!okDb(u)){$('#dbMsg').textContent='URL inválida: deve terminar em firebaseio.com ou firebasedatabase.app.';return}DB=u;localStorage.setItem('mpDb',u);profNew()};
$('#dbTest').onclick=()=>{DB='';localStorage.removeItem('mpDb');localStorage.mpTest='1';profNew()};
$('#bProf').onclick=()=>DB?profNew():show('setup');

// ===== Aluno =====
function order(s){let a=[...s].reduce((x,c)=>(x*31+c.charCodeAt(0))>>>0,7);const r=()=>(a=(a*1664525+1013904223)>>>0)/4294967296,ix=QB.map((_,i)=>i);
 for(let i=ix.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[ix[i],ix[j]]=[ix[j],ix[i]]}return ix.slice(0,NQ)}   // mesma ordem para toda a turma
async function join(){const n=$('#jName').value.trim(),s=$('#jCode').value.trim().toUpperCase(),m=$('#jMsg'),k=slug(n);m.textContent='';
 if(n.length<2||!k||!s){m.textContent='Digite seu nome e o código da turma.';return}
 try{const meta=await api(`turmas/${s}/meta`,'GET');if(!meta){m.textContent=DB?'Turma não encontrada. Confira o código com o professor.':'Este link não tem o banco de dados da turma. O professor precisa configurar o Firebase (não pode usar o modo teste) e gerar um novo QR Code.';return}
  let rec=await api(`turmas/${s}/alunos/${k}`,'GET');
  if(rec&&rec.id!==ID){m.textContent='Já existe alguém com este nome na turma. Use nome e sobrenome.';return}
  if(!rec){if(meta.estado==='fim'){m.textContent='Este quiz já foi encerrado pelo professor.';return}rec={id:ID,n,p:0,h:0,q:0,t:0,fim:0};await api(`turmas/${s}/alunos/${k}`,'PUT',rec)}
  localStorage.setItem('mpNome',n);Q={s,k,n,idx:order(s),i:rec.q,sc:rec.p,h:rec.h,el:rec.t,t0:Date.now()-rec.t*1000,st:0};
  if(rec.fim||Q.i>=NQ)return fim();lobby(meta.estado)}catch(e){m.textContent='Sem conexão com o banco. Tente novamente.'}}
function lobby(est){if(est==='andamento')return qNext(true);show('lobby');$('#lName').textContent=Q.n;
 TM=setInterval(async()=>{try{const m=await api(`turmas/${Q.s}/meta`,'GET');if(m&&m.estado==='andamento')qNext(true);else if(m&&m.estado==='fim')fim()}catch(e){}},2000)}
const sync=f=>api(`turmas/${Q.s}/alunos/${Q.k}`,'PUT',{id:ID,n:Q.n,p:Q.sc,h:Q.h,q:Q.i,t:Math.round((Date.now()-Q.t0)/1000),fim:f?1:0}).catch(()=>{});
function qNext(first){if(first){show('quiz');Q.t0=Date.now()-Q.el*1000}
 $('#qProg').textContent=`Pergunta ${Q.i+1} de ${NQ}`;$('#qBar').style.width=100*Q.i/NQ+'%';$('#qSc').textContent=Q.sc;
 ask($('#qBox'),QB[Q.idx[Q.i]],(ok,left)=>{beep(ok);let p=0;if(ok){Q.st++;p=100+Math.min(50,(Q.st-1)*10)+Math.round(left/TL*50);Q.sc+=p;Q.h++}else Q.st=0;Q.i++;$('#qSc').textContent=Q.sc;sync(Q.i>=NQ);return p},true,()=>{
  const b=document.createElement('button'),last=Q.i>=NQ;b.className='btn big2b';b.textContent=last?'Ver meu resultado':'Próxima pergunta ▶';b.onclick=()=>last?fim():qNext();$('#qBox').append(b);b.focus()},TL)}
function fim(){show('fim');$('#fRes').innerHTML=`<b>${esc(Q.n)}</b>, você fez <b>${Q.sc} pontos</b> (${Q.h} de ${NQ} acertos).`;fimTick();TM=setInterval(fimTick,3000)}
async function fimTick(){try{const E=sorted(await api(`turmas/${Q.s}/alunos`,'GET')),pos=E.findIndex(e=>e[0]===Q.k)+1;
 $('#fPos').textContent=pos?`Você está em ${pos}º lugar de ${E.length}!`:'';$('#fRank').innerHTML=E.slice(0,5).map((e,i)=>row(i,e[1])).join('')}catch(e){}}
$('#jGo').onclick=join;$$('#s-join input').forEach(i=>i.onkeydown=e=>{if(e.key==='Enter')join()});
$('#bAluno').onclick=()=>{$('#jName').value=localStorage.getItem('mpNome')||'';show('join')};

// ===== Perguntas (as mesmas para toda a turma) =====
const QB=[
['Olhe o gráfico. O ponto V marca o vértice. Quais são as coordenadas de V?',['(−2, 3)','(3, −2)','(2, −3)','(−2, −3)'],0,'Leia primeiro o x (2 para a esquerda = −2) e depois o y (3 para cima).',{h:-2,k:3,p:1,s:'V'}],
['Para que lado esta parábola abre?',['Para baixo','Para cima','Para a direita','Para a esquerda'],0,'A curva desce a partir do ponto mais alto: abre para baixo.',{h:0,k:2,p:-1}],
['V é o vértice e F é o foco. Qual é a distância p entre eles?',['2','1','4','0'],0,'Conte os quadradinhos de V até F: são 2.',{h:1,k:-2,p:2,s:'VF'}],
['A reta tracejada é a diretriz. Qual é a equação dela?',['y = −1','y = 3','x = −1','y = 1'],0,'A diretriz fica p = 2 abaixo do vértice (1 − 2 = −1).',{h:0,k:1,p:2,s:'VD'}],
['Esta parábola está deitada. Para que lado ela abre?',['Para a direita','Para a esquerda','Para cima','Para baixo'],0,'A curva se afasta do vértice rumo ao lado direito.',{h:-1,k:0,p:2,v:0,s:'V'}],
['A diretriz está 3 unidades abaixo do vértice V. Onde fica o foco?',['(0, 2)','(0, −4)','(3, −1)','(−3, −1)'],0,'O foco fica do lado oposto à diretriz, também a 3 unidades: (0, −1 + 3).',{h:0,k:-1,p:3,s:'VD'}],
['Uma antena parabólica capta o sinal de um satélite. Onde deve ficar o receptor?',['No foco','No vértice','Na diretriz','Longe do prato'],0,'Os raios chegam paralelos e se concentram no foco.'],
['Em um farol, o espelho é parabólico. Para o feixe sair paralelo, a lâmpada fica…',['No foco','Na diretriz','No vértice','Atrás do espelho'],0,'Fonte no foco gera feixe paralelo ao eixo.'],
['Uma bola é chutada para o alto. O ponto mais alto da trajetória é o…',['Vértice','Foco','Diretriz','Eixo'],0,'O ponto de virada da parábola é o vértice.'],
['Em x² = 12y, quanto vale p? (use 4p = 12)',['3','12','6','48'],0,'4p = 12 ⇒ p = 3.'],
['Em x² = 8y, o foco fica 2 unidades acima do vértice (0, 0). Qual é o foco?',['(0, 2)','(2, 0)','(0, −2)','(8, 0)'],0,'Sobe 2 no eixo y: F = (0, 2).'],
['Vértice de (x − 3)² = 4(y + 5)? Troque o sinal do que está nos parênteses.',['(3, −5)','(3, 5)','(−3, −5)','(−3, 5)'],0,'x − 3 ⇒ h = 3; y + 5 ⇒ k = −5.'],
['Em y = −2x² + 3x, o número a é negativo. A parábola abre…',['Para baixo','Para cima','Para a direita','Para a esquerda'],0,'a < 0 ⇒ concavidade para baixo.'],
['Em x² = 12y, p = 3. Qual é a diretriz?',['y = −3','y = 3','x = −3','y = −12'],0,'A diretriz fica p unidades abaixo do vértice: y = −3.'],
['Qualquer ponto P da parábola está à mesma distância de dois lugares. Quais?',['Do foco e da diretriz','Do vértice e do foco','De dois focos','Dos dois eixos'],0,'Essa é a definição de parábola.'],
['Qual reta divide a parábola em duas metades idênticas?',['O eixo de simetria','A diretriz','O eixo x sempre','Qualquer reta'],0,'O eixo passa pelo vértice e pelo foco.'],
['Vértice de y = x² − 4x + 3? Complete o quadrado: y = (x − 2)² − 1.',['(2, −1)','(−2, 1)','(2, 1)','(4, 3)'],0,'(x − 2)² − 1 ⇒ V(2, −1).'],
['Aumentando p (vértice fixo), a parábola fica…',['Mais aberta','Mais fechada','Igual','Uma reta'],0,'y = x²/(4p): p maior, curva mais larga.'],
['Em y² = 8x o foco é (2, 0). A parábola abre para…',['A direita','A esquerda','Cima','Baixo'],0,'Foco à direita do vértice ⇒ abre para a direita.']].map(([q,o,a,e,g])=>({q,o,a,e,g}));

// ===== Início =====
$('#home').onclick=()=>{PR=null;Q=null;show('home')};
$('#snd').textContent=SND?'':'';$('#snd').setAttribute('aria-label','Ligar ou desligar o som');
$('#snd').onclick=()=>{SND=!SND;localStorage.mpSnd=SND?'1':'0';$('#snd').textContent=SND?'':''};
if(P.get('sala')){$('#jCode').value=P.get('sala').toUpperCase().slice(0,8);$('#jName').value=localStorage.getItem('mpNome')||'';show('join')}else show('home');
