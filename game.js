/* BANKERX WealthQuest — Ultra-Gamified Investing Simulator */
(function(){
const $=id=>document.getElementById(id);
const app=document.getElementById('app');
const R=v=>'R'+Math.round(v).toLocaleString('en-ZA');
const P=v=>(v>=0?'+':'')+((v*100).toFixed(1))+'%';
const rand=(min,max)=>min+Math.random()*(max-min);
const pick=a=>a[Math.floor(Math.random()*a.length)];
function randn(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}

/* ===== ASSET PROFILES (SA-focused) ===== */
const ASSETS={
  eq:{name:'Equities',icon:'📈',color:'#4a9ef0',cls:'eq',
    mean:.13,vol:.18,min:-.35,max:.45,
    desc:'JSE stocks, ETFs & global equities',risk:'High risk, 12-15% avg'},
  bond:{name:'Gov Bonds',icon:'🏛️',color:'#c070ff',cls:'bond',
    mean:.095,vol:.04,min:-.05,max:.16,
    desc:'SA government & corporate bonds',risk:'Low-med risk, 9-10% avg'},
  cash:{name:'Cash',icon:'💵',color:'#8888a0',cls:'cash',
    mean:.0,vol:.005,min:-.02,max:.02,
    desc:'Physical cash, zero yield',risk:'No risk, zero return'},
  fd:{name:'Fixed Deposit',icon:'🏦',color:'#00ddff',cls:'fd',
    mean:.075,vol:.01,min:.04,max:.10,
    desc:'Bank fixed deposits & money market',risk:'Very low risk, 7-8% avg'},
  crypto:{name:'Crypto',icon:'₿',color:'#ff8844',cls:'crypto',
    mean:.20,vol:.60,min:-.70,max:3.0,
    desc:'Bitcoin, Ethereum & altcoins',risk:'Extreme risk, wild swings'},
  gamble:{name:'Gambling',icon:'🎰',color:'#ff3355',cls:'gamble',
    mean:-.12,vol:.50,min:-.90,max:4.0,
    desc:'Sports bets, casino & lotteries',risk:'Negative EV, house always wins'}
};
const AKEYS=Object.keys(ASSETS);

/* ===== MACRO EVENTS ===== */
const EVENTS=[
  {name:'Market Crash',emoji:'💥',type:'neg',prob:.07,
    impacts:{eq:-.28,bond:.02,cash:0,fd:.01,crypto:-.40,gamble:0},
    desc:'Global markets plunge on fear and panic!',
    lesson:'Crashes are painful but temporary. Those who stay invested recover.'},
  {name:'Bull Run',emoji:'🐂',type:'pos',prob:.10,
    impacts:{eq:.15,bond:.02,cash:0,fd:.005,crypto:.25,gamble:.02},
    desc:'Markets surge on economic optimism!',
    lesson:'Bull markets are where most wealth is built. Time in > timing.'},
  {name:'Rate Hike',emoji:'🏛️',type:'mix',prob:.10,
    impacts:{eq:-.05,bond:-.03,cash:0,fd:.02,crypto:-.08,gamble:0},
    desc:'SARB hikes rates to fight inflation!',
    lesson:'Rate hikes reward savers but pressure stocks and bonds.'},
  {name:'Rate Cut',emoji:'📉',type:'pos',prob:.09,
    impacts:{eq:.08,bond:.05,cash:0,fd:-.01,crypto:.10,gamble:0},
    desc:'SARB slashes rates to boost growth!',
    lesson:'Rate cuts make borrowing cheap and boost asset prices.'},
  {name:'Inflation Shock',emoji:'🔥',type:'neg',prob:.08,
    impacts:{eq:-.04,bond:-.05,cash:-.06,fd:-.02,crypto:.05,gamble:0},
    desc:'CPI surges to 8%. Cash loses purchasing power!',
    lesson:'Inflation is a silent tax on cash. Invest to protect your money.'},
  {name:'Tech Boom',emoji:'🚀',type:'pos',prob:.08,
    impacts:{eq:.20,bond:0,cash:0,fd:0,crypto:.30,gamble:.03},
    desc:'AI breakthrough sparks a massive tech rally!',
    lesson:'Innovation creates wealth. Patient investors capture the upside.'},
  {name:'Crypto Winter',emoji:'❄️',type:'neg',prob:.07,
    impacts:{eq:-.02,bond:.01,cash:0,fd:.005,crypto:-.55,gamble:0},
    desc:'Crypto market crashes 50%+ on regulation fears!',
    lesson:'Crypto is extremely volatile. Never invest more than you can lose.'},
  {name:'Rand Collapse',emoji:'💔',type:'neg',prob:.06,
    impacts:{eq:-.10,bond:-.04,cash:-.05,fd:-.01,crypto:.15,gamble:0},
    desc:'ZAR plunges on political instability!',
    lesson:'Currency risk affects all SA investments. Diversify globally.'},
  {name:'Commodity Boom',emoji:'⛏️',type:'pos',prob:.07,
    impacts:{eq:.12,bond:.01,cash:0,fd:.005,crypto:.08,gamble:0},
    desc:'Gold and platinum prices surge globally!',
    lesson:'SA is resource-rich. Commodity booms boost the JSE.'},
  {name:'Load Shedding Crisis',emoji:'🕯️',type:'neg',prob:.08,
    impacts:{eq:-.08,bond:-.01,cash:0,fd:0,crypto:0,gamble:0},
    desc:'Stage 6 load shedding hammers the economy!',
    lesson:'Infrastructure risk is real. Diversification protects you.'},
  {name:'Gambling Platform Bust',emoji:'🃏',type:'neg',prob:.05,
    impacts:{eq:0,bond:0,cash:0,fd:0,crypto:0,gamble:-.60},
    desc:'A major betting platform goes bankrupt!',
    lesson:'Gambling platforms can collapse, taking your money with them.'},
  {name:'Bitcoin Halving Rally',emoji:'🌕',type:'pos',prob:.05,
    impacts:{eq:.02,bond:0,cash:0,fd:0,crypto:.50,gamble:0},
    desc:'Bitcoin halving triggers massive price surge!',
    lesson:'Crypto cycles are driven by supply dynamics, but timing is risky.'},
  {name:'Global Recession',emoji:'🌍',type:'neg',prob:.05,
    impacts:{eq:-.18,bond:.03,cash:0,fd:.01,crypto:-.25,gamble:-.05},
    desc:'World economy contracts. Fear grips markets.',
    lesson:'Recessions test your resolve. Emergency funds are your lifeline.'}
];

/* ===== IN-GAME DECISIONS ===== */
const DECISIONS=[
  {emoji:'🏢',title:'Hot IPO Alert!',
    desc:'A new fintech company just listed on the JSE. Subscribe for R500?',
    yesCost:500,yesAsset:'eq',yesReturn:[-.30,.80],
    lesson:'IPOs are exciting but risky. Most underperform in year one.'},
  {emoji:'⚽',title:'Weekend Football Bet',
    desc:'Your mate says Chiefs vs Pirates is a sure thing. Bet R300?',
    yesCost:300,yesAsset:'gamble',yesReturn:[-.99,3.0],
    lesson:'Sports betting is entertainment, not investing. The house edge is real.'},
  {emoji:'₿',title:'Meme Coin Opportunity',
    desc:'A viral meme coin is pumping 500%. Throw R400 at it?',
    yesCost:400,yesAsset:'crypto',yesReturn:[-.80,5.0],
    lesson:'Meme coins are pure speculation. Most crash to near zero.'},
  {emoji:'🏠',title:'Property REIT',
    desc:'A new SA property fund offers 8% dividends. Invest R600?',
    yesCost:600,yesAsset:'eq',yesReturn:[-.05,.15],
    lesson:'REITs offer steady income but are sensitive to interest rates.'},
  {emoji:'🎰',title:'Casino Night',
    desc:'Friends are hitting the slots tonight. Take R200 gambling money?',
    yesCost:200,yesAsset:'gamble',yesReturn:[-.99,8.0],
    lesson:'Casino games have a built-in house edge. The longer you play, the more you lose.'},
  {emoji:'💎',title:'Crypto Staking',
    desc:'Stake your crypto for 12% APY? Locks funds for 6 months.',
    yesCost:0,yesAsset:'crypto',yesReturn:[.08,.18],
    lesson:'Staking can earn yield, but lock-up periods add liquidity risk.'},
  {emoji:'📊',title:'Index Fund Switch',
    desc:'Switch to a low-cost global ETF for better diversification?',
    yesCost:0,yesAsset:'eq',yesReturn:[.05,.12],
    lesson:'Low-cost index funds outperform most active managers over time.'},
  {emoji:'🏦',title:'Fixed Deposit Special',
    desc:'Bank offering a 9.5% fixed deposit for 12 months. Lock in R500?',
    yesCost:500,yesAsset:'fd',yesReturn:[.085,.10],
    lesson:'Fixed deposits are safe and predictable. Great for emergency funds.'},
  {emoji:'⚡',title:'Eskom Bond',
    desc:'Government-backed Eskom bond paying 11%. Invest R400?',
    yesCost:400,yesAsset:'bond',yesReturn:[.09,.12],
    lesson:'Government-backed bonds are safer, but still carry credit risk.'},
  {emoji:'🎲',title:'Lotto Ticket',
    desc:'Powerball jackpot is R80M! Buy tickets for R100?',
    yesCost:100,yesAsset:'gamble',yesReturn:[-.99,500],
    lesson:'Lotto odds are about 1 in 42 million. Expected value is deeply negative.'}
];

/* ===== LEADERBOARD AI PLAYERS ===== */
const AI_PLAYERS=[
  {name:'Thabo M.',style:'balanced',emoji:'😎'},
  {name:'Naledi K.',style:'aggressive',emoji:'🔥'},
  {name:'Sipho D.',style:'conservative',emoji:'🧘'},
  {name:'Zanele P.',style:'crypto_bro',emoji:'🚀'},
  {name:'Mandla R.',style:'gambler',emoji:'🎰'},
  {name:'Ayanda L.',style:'smart',emoji:'💡'},
  {name:'Lerato N.',style:'bonds_heavy',emoji:'🏦'},
  {name:'Bongani W.',style:'yolo',emoji:'🤪'},
  {name:'Nomsa T.',style:'index',emoji:'📈'},
];

const RANKS=[
  {t:0,name:'Broke Student',emoji:'📚'},
  {t:12000,name:'Side Hustler',emoji:'💪'},
  {t:18000,name:'Smart Saver',emoji:'💡'},
  {t:30000,name:'Market Rookie',emoji:'📘'},
  {t:50000,name:'Portfolio Pro',emoji:'⭐'},
  {t:80000,name:'Wealth Builder',emoji:'🏗️'},
  {t:150000,name:'Investment Mogul',emoji:'👑'},
  {t:500000,name:'BankerX Legend',emoji:'🏆'}
];

/* ===== GAME STATE ===== */
let G=null;

function newGame(horizon){
  G={
    horizon, turn:0, capital:10000, salary:1500,
    alloc:{eq:30,bond:15,cash:5,fd:20,crypto:20,gamble:10},
    portfolio:{eq:3000,bond:1500,cash:500,fd:2000,crypto:2000,gamble:1000},
    history:[10000], yearReturns:[], events:[], decisions:[],
    aiScores:AI_PLAYERS.map(p=>({...p,nw:10000})),
    totalContrib:0
  };
  renderGame();
}

/* ===== SIMULATE YEAR ===== */
function simYear(){
  G.turn++;
  const result={event:null,decision:null,returns:{},decisionResult:null};

  // 1) Pick macro event
  const roll=Math.random();
  let cum=0;
  const shuffled=[...EVENTS].sort(()=>Math.random()-.5);
  for(const e of shuffled){cum+=e.prob;if(roll<cum){result.event=e;break;}}

  // 2) Compute returns per asset
  const total=Object.values(G.portfolio).reduce((a,b)=>a+b,0);
  for(const k of AKEYS){
    const a=ASSETS[k];
    let mean=a.mean, vol=a.vol;
    if(result.event&&result.event.impacts[k])mean+=result.event.impacts[k];

    let r=mean+vol*randn();
    // Fat tails for crypto & gambling
    if(k==='crypto'&&Math.random()<.05)r=rand(.5,2.5);
    if(k==='gamble'){
      if(Math.random()<.04)r=rand(1,4); // jackpot
      else if(Math.random()<.2)r=rand(-.8,-.3);
    }
    r=clamp(r,a.min,a.max);
    result.returns[k]=r;

    const gain=G.portfolio[k]*r;
    G.portfolio[k]=Math.max(0,G.portfolio[k]+gain);
  }

  // 3) Add income
  const income=G.salary;
  const totalAlloc=AKEYS.reduce((s,k)=>s+G.alloc[k],0)||100;
  for(const k of AKEYS){
    const share=G.alloc[k]/totalAlloc;
    G.portfolio[k]+=income*share;
    G.totalContrib+=income*share;
  }

  // 4) Simulate AI players
  G.aiScores.forEach(p=>{
    let r;
    switch(p.style){
      case'balanced':r=rand(.04,.12);break;
      case'aggressive':r=rand(-.05,.22);break;
      case'conservative':r=rand(.03,.08);break;
      case'crypto_bro':r=rand(-.30,.50);break;
      case'gambler':r=rand(-.25,.15);break;
      case'smart':r=rand(.06,.14);break;
      case'bonds_heavy':r=rand(.05,.10);break;
      case'yolo':r=rand(-.40,.60);break;
      case'index':r=rand(.06,.13);break;
      default:r=rand(.02,.10);
    }
    if(result.event&&result.event.type==='neg')r-=rand(.02,.10);
    if(result.event&&result.event.type==='pos')r+=rand(.02,.08);
    p.nw=Math.max(1000,p.nw*(1+r)+rand(800,1500));
  });

  G.capital=Object.values(G.portfolio).reduce((a,b)=>a+b,0);
  G.history.push(G.capital);
  G.yearReturns.push(result.returns);
  if(result.event)G.events.push({turn:G.turn,event:result.event});

  return result;
}

/* ===== PICK DECISION ===== */
function pickDecision(){
  if(Math.random()<.55)return DECISIONS[Math.floor(Math.random()*DECISIONS.length)];
  return null;
}

/* ===== BENCHMARKS ===== */
function benchmarks(){
  const start=10000, inc=1500;
  const mixes=[
    {label:'100% Equities / 0% Bonds',eq:1,bond:0},
    {label:'80/20 Equity/Bond',eq:.8,bond:.2},
    {label:'60/40 Balanced',eq:.6,bond:.4},
    {label:'50/50 Conservative',eq:.5,bond:.5}
  ];
  return mixes.map(m=>{
    let v=start;
    for(let i=0;i<G.turn;i++){
      const eqR=.13,bondR=.095;
      v=v*(1+m.eq*eqR+m.bond*bondR)+inc;
    }
    return{label:m.label,value:Math.round(v)};
  });
}

function getRank(nw){
  let r=RANKS[0];
  for(const rk of RANKS)if(nw>=rk.t)r=rk;
  return r;
}

function sharpe(){
  if(G.yearReturns.length<2)return 0;
  const rets=[];
  for(let i=1;i<G.history.length;i++){
    rets.push((G.history[i]-G.history[i-1])/G.history[i-1]);
  }
  const avg=rets.reduce((a,b)=>a+b,0)/rets.length;
  const std=Math.sqrt(rets.reduce((a,b)=>a+(b-avg)**2,0)/rets.length)||.01;
  return((avg-.075)/std); // risk-free ~7.5% (SA)
}

function getLesson(result){
  if(result.event)return{icon:'📚',text:result.event.lesson};
  const g=G.alloc.gamble;
  if(g>=40)return{icon:'⚠️',text:'Over 40% in gambling? The expected return is negative. The house always wins.'};
  if(G.alloc.cash>=50)return{icon:'💡',text:'50%+ in cash earns nothing. Inflation eats your money every year.'};
  if(G.alloc.crypto>=50)return{icon:'🎢',text:'50%+ in crypto is extremely volatile. One crash could wipe half your portfolio.'};
  if(G.alloc.eq>=40&&G.alloc.gamble<=5)return{icon:'✅',text:'Solid equity allocation with low gambling. Compounding is working for you!'};
  return{icon:'📖',text:'Diversification is your best defense. Spread risk across assets to smooth returns.'};
}

/* ===== RENDER: TITLE ===== */
function renderTitle(){
  let sel=10;
  app.innerHTML=`
  <div class="screen title-screen">
    <div class="title-bg"><img src="./splash.png" alt="Bull vs Bear"><div></div></div>
    <div class="title-content">
      <div class="title-brand">BANKERX</div>
      <div class="title-name">Wealth<span>Quest</span></div>
      <div class="title-tagline">Build wealth. Beat the market. Learn investing through the most addictive game you'll ever play.</div>
      <div class="title-config">
        <div class="config-label">Investment Horizon</div>
        <div class="config-row" id="hz-opts">
          <button class="config-btn" data-v="1">1 Year</button>
          <button class="config-btn" data-v="5">5 Years</button>
          <button class="config-btn active" data-v="10">10 Years</button>
          <button class="config-btn" data-v="20">20 Years</button>
        </div>
      </div>
      <button class="btn-play" id="btn-start">Start Investing</button>
      <div class="title-footer">
        <a href="https://www.perplexity.ai/computer" target="_blank" rel="noopener noreferrer">Created with Perplexity Computer</a>
      </div>
    </div>
  </div>`;
  $('hz-opts').onclick=e=>{
    const b=e.target.closest('.config-btn');
    if(!b)return;
    sel=+b.dataset.v;
    $('hz-opts').querySelectorAll('.config-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
  };
  $('btn-start').onclick=()=>newGame(sel);
}

/* ===== RENDER: GAME ===== */
function renderGame(){
  const total=AKEYS.reduce((s,k)=>s+G.alloc[k],0);
  const ok=total===100;
  const isEnd=G.turn>=G.horizon;

  app.innerHTML=`
  <div class="screen game-screen">
    <div class="game-header">
      <div class="hdr-left">
        <div class="hdr-logo">BANKERX</div>
        <div class="hdr-year">Year ${G.turn} / ${G.horizon}</div>
      </div>
      <div class="hdr-right">
        <div class="hdr-nw">
          <div class="hdr-nw-label">Net Worth</div>
          <div class="hdr-nw-val">${R(G.capital)}</div>
        </div>
      </div>
    </div>
    <div class="game-body" id="gbody">
      <div class="alloc-section">
        <div class="alloc-header">
          <div class="alloc-title">Your Portfolio</div>
          <div class="alloc-total ${ok?'ok':total>100?'over':'under'}">${total}%</div>
        </div>
        <div class="alloc-bar" id="abar">
          ${AKEYS.map(k=>`<div class="alloc-seg bg-${ASSETS[k].cls}" style="width:${G.alloc[k]}%"></div>`).join('')}
        </div>
        <div class="alloc-grid">
          ${AKEYS.map(k=>{
            const a=ASSETS[k];
            return`<div class="asset-card" data-k="${k}">
              <div class="asset-top">
                <div class="asset-name"><span class="asset-icon">${a.icon}</span> ${a.name}</div>
                <div class="asset-pct c-${a.cls}">${G.alloc[k]}%</div>
              </div>
              <div class="asset-meta">${a.risk}</div>
              <input type="range" class="asset-slider ${a.cls}" data-k="${k}" min="0" max="100" step="5" value="${G.alloc[k]}">
              <div class="asset-meta">${R(G.portfolio[k])}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div id="lesson-slot"></div>
    </div>
    <div class="game-footer">
      <button class="btn-advance" id="btn-go" ${!ok||isEnd?'disabled':''}>${isEnd?'View Final Results':'⚡ Advance Year'}</button>
    </div>
  </div>`;

  // Slider logic
  document.querySelectorAll('.asset-slider').forEach(sl=>{
    sl.oninput=()=>{
      const k=sl.dataset.k;
      G.alloc[k]=+sl.value;
      updateAllocUI();
    };
  });

  if(isEnd){
    $('btn-go').disabled=false;
    $('btn-go').textContent='🏆 View Final Results';
    $('btn-go').onclick=()=>renderFinalResults();
  }else{
    $('btn-go').onclick=()=>{
      if(AKEYS.reduce((s,k)=>s+G.alloc[k],0)!==100)return;
      // Rebalance portfolio
      const pTotal=Object.values(G.portfolio).reduce((a,b)=>a+b,0);
      AKEYS.forEach(k=>{G.portfolio[k]=pTotal*(G.alloc[k]/100)});
      const result=simYear();
      renderYearEnd(result);
    };
  }

  // Show lesson
  const lesson=getLesson({event:null});
  $('lesson-slot').innerHTML=`<div class="lesson-bar"><span class="lb-icon">${lesson.icon}</span><span>${lesson.text}</span></div>`;
}

function updateAllocUI(){
  const total=AKEYS.reduce((s,k)=>s+G.alloc[k],0);
  const ok=total===100;
  // Update percentages
  AKEYS.forEach(k=>{
    const card=document.querySelector(`.asset-card[data-k="${k}"]`);
    if(card)card.querySelector('.asset-pct').textContent=G.alloc[k]+'%';
  });
  // Update bar
  const bar=$('abar');
  if(bar)AKEYS.forEach((k,i)=>{bar.children[i].style.width=G.alloc[k]+'%'});
  // Update total
  const tt=document.querySelector('.alloc-total');
  if(tt){tt.textContent=total+'%';tt.className='alloc-total '+(ok?'ok':total>100?'over':'under')}
  // Update button
  const btn=$('btn-go');
  if(btn&&G.turn<G.horizon)btn.disabled=!ok;
}

/* ===== RENDER: YEAR-END ===== */
function renderYearEnd(result){
  const nw=G.capital;
  const prev=G.history[G.history.length-2]||10000;
  const change=nw-prev;
  const changePct=change/prev;

  app.innerHTML=`
  <div class="screen yearend-screen">
    <div class="ye-header">
      <div class="ye-title">📊 Year ${G.turn} Results</div>
      <div class="ye-sub">Here's how your portfolio performed</div>
    </div>
    <div class="ye-body" id="ye-body">
      ${result.event?`
      <div class="event-flash">
        <div class="ef-icon">${result.event.emoji}</div>
        <div class="ef-body">
          <div class="ef-title">${result.event.name}</div>
          <div class="ef-desc">${result.event.desc}</div>
        </div>
      </div>`:''}

      <div class="ye-nw">
        <div class="ye-nw-label">Net Worth</div>
        <div class="ye-nw-val">${R(nw)}</div>
        <div class="ye-nw-change" style="color:${change>=0?'var(--g)':'var(--r)'}">
          ${change>=0?'↑':'↓'} ${R(Math.abs(change))} (${P(changePct)})
        </div>
      </div>

      <table class="perf-table">
        <tr><th>Asset</th><th>Allocation</th><th>Return</th><th>Value</th></tr>
        ${AKEYS.map(k=>{
          const ret=result.returns[k];
          const cls=ret>=0?'pos':'neg';
          return`<tr>
            <td><div class="asset-cell"><span class="dot bg-${ASSETS[k].cls}"></span>${ASSETS[k].name}</div></td>
            <td>${G.alloc[k]}%</td>
            <td class="${cls}">${P(ret)}</td>
            <td>${R(G.portfolio[k])}</td>
          </tr>`;
        }).join('')}
      </table>

      <div class="lesson-bar">
        <span class="lb-icon">${getLesson(result).icon}</span>
        <span>${getLesson(result).text}</span>
      </div>

      <div id="decision-slot"></div>
    </div>
    <div class="ye-footer">
      <button class="btn-advance" id="btn-continue">${G.turn>=G.horizon?'🏆 Final Results':'Continue →'}</button>
    </div>
  </div>`;

  // Maybe show a decision
  const dec=pickDecision();
  if(dec&&G.turn<G.horizon){
    setTimeout(()=>showDecision(dec),800);
  }

  $('btn-continue').onclick=()=>{
    if(G.turn>=G.horizon)renderFinalResults();
    else renderGame();
  };
}

/* ===== SHOW DECISION ===== */
function showDecision(dec){
  const overlay=document.createElement('div');
  overlay.className='decision-overlay';
  overlay.innerHTML=`
    <div class="decision-card">
      <div class="decision-emoji">${dec.emoji}</div>
      <div class="decision-title">${dec.title}</div>
      <div class="decision-desc">${dec.desc}</div>
      <div class="decision-btns">
        <button class="decision-btn yes" id="dec-yes">Yes, I'm in!</button>
        <button class="decision-btn no" id="dec-no">No thanks</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector('#dec-yes').onclick=()=>{
    // Apply decision
    if(dec.yesCost>0){
      const total=Object.values(G.portfolio).reduce((a,b)=>a+b,0);
      // Take cost proportionally
      AKEYS.forEach(k=>{
        G.portfolio[k]=Math.max(0,G.portfolio[k]-(dec.yesCost*(G.portfolio[k]/total)));
      });
    }
    const ret=rand(dec.yesReturn[0],dec.yesReturn[1]);
    const gain=dec.yesCost>0?dec.yesCost*ret:G.portfolio[dec.yesAsset]*.05*ret;
    G.portfolio[dec.yesAsset]=Math.max(0,G.portfolio[dec.yesAsset]+gain);
    G.capital=Object.values(G.portfolio).reduce((a,b)=>a+b,0);
    G.history[G.history.length-1]=G.capital;
    G.decisions.push({turn:G.turn,...dec,accepted:true,result:ret});

    overlay.querySelector('.decision-card').innerHTML=`
      <div class="decision-emoji">${ret>=0?'🎉':'😬'}</div>
      <div class="decision-title">${ret>=0?'Nice move!':'Ouch...'}</div>
      <div class="decision-desc">${ret>=0?'That paid off! +'+R(Math.abs(gain)):'You lost '+R(Math.abs(gain))+'. Tough break.'}</div>
      <div class="lesson-bar" style="margin-top:8px"><span class="lb-icon">📚</span><span>${dec.lesson}</span></div>
      <button class="btn-advance" style="margin-top:12px" onclick="this.closest('.decision-overlay').remove()">Got it</button>`;
  };

  overlay.querySelector('#dec-no').onclick=()=>{
    G.decisions.push({turn:G.turn,...dec,accepted:false,result:0});
    overlay.remove();
  };
}

/* ===== RENDER: FINAL RESULTS ===== */
function renderFinalResults(){
  const nw=G.capital;
  const rank=getRank(nw);
  const sh=sharpe();
  const totalRet=((nw/10000)-1)*100;
  const bench=benchmarks();

  // Build leaderboard
  const players=[...G.aiScores.map(p=>({name:p.name,emoji:p.emoji,nw:Math.round(p.nw),you:false})),
    {name:'You',emoji:'🎮',nw:Math.round(nw),you:true}];
  players.sort((a,b)=>b.nw-a.nw);
  const yourRank=players.findIndex(p=>p.you)+1;

  app.innerHTML=`
  <div class="screen results-screen">
    <div class="res-header">
      <div class="res-title">🏆 Game Complete</div>
      <div class="res-sub">${G.horizon} year${G.horizon>1?'s':''} of financial decisions</div>
    </div>
    <div class="res-body">
      <div class="rank-card">
        <div class="rank-emoji">${rank.emoji}</div>
        <div>
          <div class="rank-name">${rank.name}</div>
          <div class="rank-desc">Final Net Worth: ${R(nw)}</div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Return</div>
          <div class="stat-val" style="color:${totalRet>=0?'var(--g)':'var(--r)'}">${totalRet>=0?'+':''}${totalRet.toFixed(1)}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Sharpe Ratio</div>
          <div class="stat-val" style="color:${sh>=1?'var(--g)':sh>=0?'var(--y)':'var(--r)'}">${sh.toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Your Ranking</div>
          <div class="stat-val" style="color:var(--y)">#${yourRank} / ${players.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Events Survived</div>
          <div class="stat-val">${G.events.length}</div>
        </div>
      </div>

      <div class="bench-card">
        <div class="bench-title">📊 Balanced Portfolio Comparison</div>
        <div class="bench-row"><div class="bench-label">Your Result</div><div class="bench-val" style="color:var(--g)">${R(nw)}</div></div>
        ${bench.map(b=>`<div class="bench-row"><div class="bench-label">${b.label}</div><div class="bench-val" style="color:var(--b)">${R(b.value)}</div></div>`).join('')}
      </div>

      <div class="lb-card">
        <div class="lb-title">🏆 Leaderboard</div>
        ${players.map((p,i)=>`
          <div class="lb-row ${p.you?'you':''}">
            <div class="lb-rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</div>
            <div style="font-size:16px">${p.emoji}</div>
            <div class="lb-name">${p.name}</div>
            <div class="lb-score">${R(p.nw)}</div>
          </div>
        `).join('')}
      </div>

      <div class="bench-card">
        <div class="bench-title">📈 Risk-Adjusted Performance</div>
        <div class="bench-row"><div class="bench-label">Annualized Return</div><div class="bench-val">${(totalRet/Math.max(1,G.turn)).toFixed(1)}% p.a.</div></div>
        <div class="bench-row"><div class="bench-label">Sharpe Ratio</div><div class="bench-val" style="color:${sh>=1?'var(--g)':sh>=0?'var(--y)':'var(--r)'}">${sh.toFixed(2)}</div></div>
        <div class="bench-row"><div class="bench-label">Max Drawdown</div><div class="bench-val" style="color:var(--r)">${(maxDrawdown()*100).toFixed(1)}%</div></div>
        <div class="bench-row"><div class="bench-label">Total Contributions</div><div class="bench-val">${R(G.totalContrib+10000)}</div></div>
        <div class="bench-row"><div class="bench-label">Investment Returns</div><div class="bench-val" style="color:${nw-G.totalContrib-10000>=0?'var(--g)':'var(--r)'}">${R(nw-G.totalContrib-10000)}</div></div>
      </div>

      <div class="newsletter-card">
        <div class="nl-title">Join the BANKERX Community</div>
        <div class="nl-desc">Get weekly insights on investing, markets & building wealth. Join 10,000+ members.</div>
        <a href="https://www.bankerx.org/join" target="_blank" rel="noopener noreferrer" class="nl-btn">Join BANKERX →</a>
      </div>

      <button class="btn-replay" id="btn-again">Play Again</button>
      <div class="pplx-foot"><a href="https://www.perplexity.ai/computer" target="_blank" rel="noopener noreferrer">Created with Perplexity Computer</a></div>
    </div>
  </div>`;

  $('btn-again').onclick=()=>renderTitle();
}

function maxDrawdown(){
  let peak=0,dd=0;
  for(const v of G.history){
    if(v>peak)peak=v;
    const d=(peak-v)/peak;
    if(d>dd)dd=d;
  }
  return dd;
}

/* ===== TEST HOOKS ===== */
window.render_game_to_text=()=>{
  if(!G)return JSON.stringify({phase:'title'});
  return JSON.stringify({phase:G.turn>=G.horizon?'end':'game',turn:G.turn,nw:Math.round(G.capital),alloc:G.alloc});
};

/* ===== INIT ===== */
renderTitle();
})();
