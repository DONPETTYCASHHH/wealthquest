/* BANKERX WealthQuest — v4 */
(function(){
const $=id=>document.getElementById(id);
const app=document.getElementById('app');
const R=v=>'R'+Math.round(v).toLocaleString('en-ZA');
const P=v=>(v>=0?'+':'')+((v*100).toFixed(1))+'%';
const rand=(min,max)=>min+Math.random()*(max-min);
const pick=a=>a[Math.floor(Math.random()*a.length)];
function randn(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v))}

const SHARE_URL='https://wealthquest.pages.dev/';

/* ===== REBALANCING PENALTY CONFIG ===== */
const REBALANCE_PENALTY_RATE=0.01; // 1% of total portfolio value (fees, admin & timing costs)

/* ===== ASSET PROFILES (SA market performance) ===== */
const ASSETS={
  eq:{name:'Stocks',icon:'📈',color:'#4a9ef0',cls:'eq',
    mean:.12,vol:.17,min:-.35,max:.42,
    desc:'ETFs & Index funds',riskScore:3},
  bond:{name:'Bonds',icon:'🏛️',color:'#c070ff',cls:'bond',
    mean:.095,vol:.04,min:-.05,max:.16,
    desc:'Government issued',riskScore:1},
  cash:{name:'Cash',icon:'💵',color:'#8888a0',cls:'cash',
    mean:0,vol:.005,min:-.08,max:.01,
    desc:'In case of emergency',riskScore:0},
  fd:{name:'Savings',icon:'🏦',color:'#00ddff',cls:'fd',
    mean:.075,vol:.01,min:.04,max:.10,
    desc:'Fixed deposits',riskScore:0.5},
  crypto:{name:'Crypto',icon:'₿',color:'#ff8844',cls:'crypto',
    mean:.20,vol:.60,min:-.70,max:3.0,
    desc:'Large cap crypto',riskScore:5},
  gamble:{name:'Gambling',icon:'🎰',color:'#ff3355',cls:'gamble',
    mean:-.12,vol:.50,min:-.90,max:4.0,
    desc:'The house always wins',riskScore:6}
};
const AKEYS=Object.keys(ASSETS);

/* SA inflation ~5-6% */
const SA_INFLATION=.055;

/* ===== RISK LABEL FOR AI PLAYERS ===== */
function aiRiskLabel(style){
  const map={
    balanced:{label:'Balanced',color:'var(--g)',emoji:'⚖️'},
    aggressive:{label:'Risky',color:'var(--orange)',emoji:'⚡'},
    conservative:{label:'Conservative',color:'#00ddff',emoji:'🧘'},
    crypto_bro:{label:'Extremely Risky',color:'var(--r)',emoji:'🔥'},
    gambler:{label:'Extremely Risky',color:'var(--r)',emoji:'🔥'},
    smart:{label:'Balanced',color:'var(--g)',emoji:'⚖️'},
    bonds_heavy:{label:'Conservative',color:'#00ddff',emoji:'🧘'},
    yolo:{label:'Extremely Risky',color:'var(--r)',emoji:'🔥'},
    index:{label:'Balanced',color:'var(--g)',emoji:'⚖️'}
  };
  return map[style]||{label:'Balanced',color:'var(--g)',emoji:'⚖️'};
}

/* Average risk profile across all rounds played */
function avgRiskProfile(){
  if(!G.allocHistory||G.allocHistory.length===0) return calcRiskProfile(G.alloc);
  // Average each asset's allocation across all rounds
  const avg={};
  AKEYS.forEach(k=>{ avg[k]=G.allocHistory.reduce((s,a)=>s+a[k],0)/G.allocHistory.length; });
  return calcRiskProfile(avg);
}

/* ===== RISK PROFILE CALCULATOR ===== */
function calcRiskProfile(alloc){
  const total=AKEYS.reduce((s,k)=>s+alloc[k],0)||100;
  const score=AKEYS.reduce((s,k)=>s+(alloc[k]/total)*ASSETS[k].riskScore,0);
  // Score 0-1: ultra conservative, 1-2: conservative, 2-3: balanced, 3-4: risky, 4+: extremely risky
  if(score<=0.8) return{label:'Ultra Conservative',color:'#4a9ef0',emoji:'🛡️'};
  if(score<=1.6) return{label:'Conservative',color:'#00ddff',emoji:'🧘'};
  if(score<=2.5) return{label:'Balanced',color:'var(--g)',emoji:'⚖️'};
  if(score<=3.5) return{label:'Risky',color:'var(--orange)',emoji:'⚡'};
  return{label:'Extremely Risky',color:'var(--r)',emoji:'🔥'};
}

/* ===== YEAR NARRATIVES PER ASSET ===== */
const YEAR_NOTES={
  eq:{
    pos:['JSE rallied on strong earnings','Tech stocks surged globally','Markets climbed on rate cut hopes','SA equities hit all-time highs','Index funds gained as economy grew'],
    neg:['Stock market crashed as tech failed','JSE dropped on global sell-off','Equities fell on recession fears','Markets slumped on political risk','Stocks plunged on rate hikes']
  },
  bond:{
    pos:['Bonds gained as rates were cut','Government bonds rallied','Bond yields fell, prices rose','Safe-haven demand boosted bonds','Fixed income outperformed'],
    neg:['Bond prices fell as rates surged','Government debt concerns grew','Inflation eroded bond returns','Rising yields hurt bond prices','Bond market sold off sharply']
  },
  cash:{
    pos:['Cash held steady','Low inflation preserved cash value'],
    neg:['Inflation ate into cash holdings','Your cash lost purchasing power','Rising prices eroded your savings','CPI surged — cash worth less','Inflation silently taxed your cash']
  },
  fd:{
    pos:['Fixed deposits earned steady returns','Savings accounts benefited from rate hikes','Bank deposits delivered reliable income','Your savings grew steadily'],
    neg:['Low rates squeezed deposit returns','Savings barely beat inflation','Fixed deposit rates disappointing']
  },
  crypto:{
    pos:['Crypto market surged with adoption','Bitcoin hit new all-time high','Institutional crypto buying exploded','Altcoins rallied on new tech','Crypto boomed on ETF approvals'],
    neg:['Crypto crashed on regulation fears','Bitcoin plummeted overnight','Crypto winter froze the market','Exchange collapse shook confidence','Digital assets wiped out']
  },
  gamble:{
    pos:['Lucky streak at the tables','Jackpot hit — rare win','Sports bets paid off this year','Beginner\'s luck struck'],
    neg:['Gambling losses mounted','The house won again','Betting losses piled up','Casino cleaned you out','Sports bets failed miserably']
  }
};

/* ===== MACRO EVENTS ===== */
const EVENTS=[
  {name:'Market Crash',emoji:'💥',type:'neg',prob:.07,
    impacts:{eq:-.28,bond:.02,cash:0,fd:.01,crypto:-.40,gamble:0},
    desc:'Global markets plunge on fear and panic!'},
  {name:'Bull Run',emoji:'🐂',type:'pos',prob:.10,
    impacts:{eq:.15,bond:.02,cash:0,fd:.005,crypto:.25,gamble:.02},
    desc:'Markets surge on economic optimism!'},
  {name:'Rate Hike',emoji:'🏛️',type:'mix',prob:.10,
    impacts:{eq:-.05,bond:-.03,cash:0,fd:.02,crypto:-.08,gamble:0},
    desc:'SARB hikes rates to fight inflation!'},
  {name:'Rate Cut',emoji:'📉',type:'pos',prob:.09,
    impacts:{eq:.08,bond:.05,cash:0,fd:-.01,crypto:.10,gamble:0},
    desc:'SARB slashes rates to boost growth!'},
  {name:'Inflation Shock',emoji:'🔥',type:'neg',prob:.08,
    impacts:{eq:-.04,bond:-.05,cash:-.08,fd:-.02,crypto:.05,gamble:0},
    desc:'CPI surges to 8%. Cash loses purchasing power!'},
  {name:'Tech Boom',emoji:'🚀',type:'pos',prob:.08,
    impacts:{eq:.20,bond:0,cash:0,fd:0,crypto:.30,gamble:.03},
    desc:'AI breakthrough sparks a massive tech rally!'},
  {name:'Crypto Winter',emoji:'❄️',type:'neg',prob:.07,
    impacts:{eq:-.02,bond:.01,cash:0,fd:.005,crypto:-.55,gamble:0},
    desc:'Crypto market crashes 50%+ on regulation fears!'},
  {name:'Rand Collapse',emoji:'💔',type:'neg',prob:.06,
    impacts:{eq:-.10,bond:-.04,cash:-.06,fd:-.01,crypto:.15,gamble:0},
    desc:'ZAR plunges on political instability!'},
  {name:'Commodity Boom',emoji:'⛏️',type:'pos',prob:.07,
    impacts:{eq:.12,bond:.01,cash:0,fd:.005,crypto:.08,gamble:0},
    desc:'Gold and platinum prices surge globally!'},
  {name:'Load Shedding Crisis',emoji:'🕯️',type:'neg',prob:.08,
    impacts:{eq:-.08,bond:-.01,cash:0,fd:0,crypto:0,gamble:0},
    desc:'Stage 6 load shedding hammers the economy!'},
  {name:'Bitcoin Halving Rally',emoji:'🌕',type:'pos',prob:.05,
    impacts:{eq:.02,bond:0,cash:0,fd:0,crypto:.50,gamble:0},
    desc:'Bitcoin halving triggers massive price surge!'},
  {name:'Global Recession',emoji:'🌍',type:'neg',prob:.05,
    impacts:{eq:-.18,bond:.03,cash:0,fd:.01,crypto:-.25,gamble:-.05},
    desc:'World economy contracts. Fear grips markets.'}
];

/* ===== IN-GAME DECISIONS (escalating risk, realistic outcomes) ===== */
/* Penny stocks, gambles, and speculative bets lose money MOST of the time */
const DECISIONS_BY_RISK=[
  /* Low risk — early years */
  [
    {emoji:'📊',title:'Index Fund Switch',desc:'Switch to a low-cost global ETF for better diversification?',risk:'low',
      yesCost:0,yesAsset:'eq',yesReturn:[.03,.10],loseProb:.15,lesson:'Low-cost index funds outperform most active managers.'},
    {emoji:'🏦',title:'Fixed Deposit Special',desc:'Bank offering 9.5% fixed deposit for 12 months. Lock in R500?',risk:'low',
      yesCost:500,yesAsset:'fd',yesReturn:[.085,.10],loseProb:.05,lesson:'Fixed deposits are safe and predictable.'},
    {emoji:'⚡',title:'Eskom Bond',desc:'Government-backed Eskom bond paying 11%. Invest R400?',risk:'low',
      yesCost:400,yesAsset:'bond',yesReturn:[.09,.12],loseProb:.10,lesson:'Government-backed bonds are safer, but carry credit risk.'},
    {emoji:'🏧',title:'Money Market Fund',desc:'Your bank offers a money market account at 8.5%. Park R600 there?',risk:'low',
      yesCost:600,yesAsset:'fd',yesReturn:[.07,.09],loseProb:.05,lesson:'Money market funds are low risk but barely beat inflation.'},
    {emoji:'📋',title:'Tax-Free Savings',desc:'Open a tax-free savings account and invest R500 in a balanced fund?',risk:'low',
      yesCost:500,yesAsset:'eq',yesReturn:[.05,.12],loseProb:.12,lesson:'Tax-free accounts let your returns compound without tax drag.'},
    {emoji:'🛡️',title:'Retirement Annuity Top-Up',desc:'Financial advisor suggests adding R400 to your RA for the tax deduction.',risk:'low',
      yesCost:400,yesAsset:'bond',yesReturn:[.06,.10],loseProb:.08,lesson:'Retirement annuities offer tax benefits but lock up your money.'},
    {emoji:'🏦',title:'Notice Deposit',desc:'32-day notice deposit at 9%. Lock R500?',risk:'low',
      yesCost:500,yesAsset:'fd',yesReturn:[.08,.095],loseProb:.03,lesson:'Notice deposits offer slightly higher rates for short lock-up periods.'},
    {emoji:'📈',title:'Satrix Top 40 ETF',desc:'Invest R500 in the Satrix Top 40 ETF tracking the JSE\'s biggest companies?',risk:'low',
      yesCost:500,yesAsset:'eq',yesReturn:[.04,.14],loseProb:.18,lesson:'Index ETFs give you broad market exposure at very low cost.'}
  ],
  /* Medium risk — mid years */
  [
    {emoji:'🏢',title:'Hot IPO Alert!',desc:'A new fintech company listed on the JSE. Subscribe for R500?',risk:'med',
      yesCost:500,yesAsset:'eq',yesReturn:[-.20,.60],loseProb:.45,lesson:'IPOs are exciting but risky. Most underperform in year one.'},
    {emoji:'🏠',title:'Property REIT',desc:'A SA property fund offers 8% dividends. Invest R600?',risk:'med',
      yesCost:600,yesAsset:'eq',yesReturn:[-.08,.18],loseProb:.30,lesson:'REITs offer steady income but are rate-sensitive.'},
    {emoji:'💎',title:'Crypto Staking',desc:'Stake your crypto for 15% APY. Locks funds for 6 months.',risk:'med',
      yesCost:0,yesAsset:'crypto',yesReturn:[-.15,.20],loseProb:.35,lesson:'Staking earns yield, but lock-ups add liquidity risk.'},
    {emoji:'🌍',title:'Offshore ETF',desc:'Move R600 into a USD-denominated global ETF for diversification?',risk:'med',
      yesCost:600,yesAsset:'eq',yesReturn:[-.10,.25],loseProb:.35,lesson:'Offshore exposure reduces SA-specific risk but adds currency risk.'},
    {emoji:'⛏️',title:'Mining Stock',desc:'A platinum miner is trading below book value. Buy R500 worth?',risk:'med',
      yesCost:500,yesAsset:'eq',yesReturn:[-.25,.40],loseProb:.40,lesson:'Commodity stocks are cyclical — cheap can get cheaper.'},
    {emoji:'🏗️',title:'Infrastructure Bond',desc:'New toll road project issuing bonds at 10.5%. Put in R400?',risk:'med',
      yesCost:400,yesAsset:'bond',yesReturn:[-.05,.12],loseProb:.25,lesson:'Infrastructure bonds can be solid but carry project completion risk.'},
    {emoji:'📱',title:'Tech Stock Tip',desc:'A colleague swears by a mid-cap tech company. Invest R500?',risk:'med',
      yesCost:500,yesAsset:'eq',yesReturn:[-.30,.50],loseProb:.45,lesson:'Stock tips from friends are rarely based on proper analysis.'},
    {emoji:'🔋',title:'Renewable Energy Fund',desc:'Green energy fund promising 12% returns. Invest R600?',risk:'med',
      yesCost:600,yesAsset:'eq',yesReturn:[-.12,.22],loseProb:.35,lesson:'Thematic funds can outperform but carry concentration risk.'},
    {emoji:'🏘️',title:'Property Crowdfunding',desc:'An online platform lets you invest R400 in a Sandton apartment block.',risk:'med',
      yesCost:400,yesAsset:'eq',yesReturn:[-.15,.20],loseProb:.40,lesson:'Property crowdfunding is illiquid and platforms can fail.'}
  ],
  /* High risk — later years (lose more often than win) */
  [
    {emoji:'₿',title:'Meme Coin Opportunity',desc:'A viral meme coin is pumping 500%. Throw R400 at it?',risk:'high',
      yesCost:400,yesAsset:'crypto',yesReturn:[-.90,5.0],loseProb:.80,lesson:'Meme coins are pure speculation. Most crash to zero.'},
    {emoji:'⚽',title:'Weekend Football Bet',desc:'Your mate says Chiefs vs Pirates is a sure thing. Bet R500?',risk:'high',
      yesCost:500,yesAsset:'gamble',yesReturn:[-.99,3.0],loseProb:.85,lesson:'Sports betting is entertainment, not investing.'},
    {emoji:'🎰',title:'Casino Night',desc:'Friends hitting the casino. Take R300 gambling money?',risk:'high',
      yesCost:300,yesAsset:'gamble',yesReturn:[-.99,8.0],loseProb:.88,lesson:'Casino games have a built-in house edge.'},
    {emoji:'🐎',title:'Horse Racing Tip',desc:'A "sure thing" at the Durban July. Put R400 on it?',risk:'high',
      yesCost:400,yesAsset:'gamble',yesReturn:[-.99,6.0],loseProb:.85,lesson:'Horse racing odds are set by bookmakers — they always profit.'},
    {emoji:'🪙',title:'New Crypto Token Launch',desc:'Pre-sale for a new DeFi token. Get in early with R500?',risk:'high',
      yesCost:500,yesAsset:'crypto',yesReturn:[-.95,8.0],loseProb:.82,lesson:'Most new token launches lose 90%+ within months.'},
    {emoji:'📉',title:'Short the Market',desc:'You think a crash is coming. Short the JSE with R600?',risk:'high',
      yesCost:600,yesAsset:'eq',yesReturn:[-.80,3.0],loseProb:.75,lesson:'Timing the market is nearly impossible. Most short sellers lose.'},
    {emoji:'🎯',title:'Sports Accumulator',desc:'6-leg accumulator bet with 50:1 odds. Put R200 on it?',risk:'high',
      yesCost:200,yesAsset:'gamble',yesReturn:[-.99,50],loseProb:.92,lesson:'Accumulators look tempting but multiply the house edge.'},
    {emoji:'💊',title:'Biotech Penny Stock',desc:'Small pharma company claims breakthrough drug. Invest R400?',risk:'high',
      yesCost:400,yesAsset:'eq',yesReturn:[-.85,6.0],loseProb:.80,lesson:'Biotech penny stocks fail clinical trials more often than not.'},
    {emoji:'🎮',title:'NFT Collection',desc:'A friend says this NFT collection will be the next big thing. Buy for R500?',risk:'high',
      yesCost:500,yesAsset:'crypto',yesReturn:[-.95,4.0],loseProb:.85,lesson:'Most NFTs lose 90%+ of their value within a year.'}
  ],
  /* Extreme risk — final years (almost always lose) */
  [
    {emoji:'🎲',title:'Lotto Ticket Spree',desc:'Powerball jackpot is R120M! Buy R200 worth of tickets?',risk:'extreme',
      yesCost:200,yesAsset:'gamble',yesReturn:[-.99,500],loseProb:.97,lesson:'Lotto odds are 1 in 42 million. Deeply negative expected value.'},
    {emoji:'🔥',title:'Leveraged Crypto Trade',desc:'10x leverage on Bitcoin. Could double or lose everything. R800?',risk:'extreme',
      yesCost:800,yesAsset:'crypto',yesReturn:[-.95,10],loseProb:.85,lesson:'Leverage amplifies gains AND losses. Most traders lose everything.'},
    {emoji:'💰',title:'All-in on Penny Stock',desc:'A penny stock tip from a stranger online. Throw R600 at it?',risk:'extreme',
      yesCost:600,yesAsset:'eq',yesReturn:[-.95,8.0],loseProb:.90,lesson:'Penny stocks are the most manipulated securities on the market.'},
    {emoji:'🃏',title:'Online Poker Tournament',desc:'R500 buy-in for an online poker tournament. Feeling lucky?',risk:'extreme',
      yesCost:500,yesAsset:'gamble',yesReturn:[-.99,20],loseProb:.90,lesson:'Professional poker players make up <5% of tournament winners.'},
    {emoji:'🌪️',title:'Forex Day Trading',desc:'Open a forex account and trade ZAR/USD with 50x leverage. R700?',risk:'extreme',
      yesCost:700,yesAsset:'gamble',yesReturn:[-.99,15],loseProb:.88,lesson:'Over 80% of retail forex traders lose money within 12 months.'},
    {emoji:'💎',title:'Unregulated Crypto Exchange',desc:'A new offshore exchange offers 100x leverage. Deposit R600?',risk:'extreme',
      yesCost:600,yesAsset:'crypto',yesReturn:[-.99,25],loseProb:.92,lesson:'Unregulated exchanges frequently exit-scam with customer funds.'},
    {emoji:'🏎️',title:'"Investment" Car Scheme',desc:'A WhatsApp group promises 50% monthly returns on luxury car rentals. Invest R800?',risk:'extreme',
      yesCost:800,yesAsset:'gamble',yesReturn:[-.99,2.0],loseProb:.95,lesson:'If it sounds too good to be true, it\'s a Ponzi scheme.'},
    {emoji:'📊',title:'Binary Options',desc:'A flashy app lets you bet on 60-second stock movements. Try R300?',risk:'extreme',
      yesCost:300,yesAsset:'gamble',yesReturn:[-.99,8.0],loseProb:.90,lesson:'Binary options are banned in most countries. The house always wins.'},
    {emoji:'🦍',title:'Reddit Meme Stock',desc:'An overseas meme stock is squeezing. YOLO R500 on it?',risk:'extreme',
      yesCost:500,yesAsset:'eq',yesReturn:[-.90,12],loseProb:.85,lesson:'Meme stock squeezes are over by the time retail investors hear about them.'}
  ]
];

/* ===== NEWS TICKER ITEMS (top banner) ===== */
const TICKER_HEADLINES=[
  {sym:'JSE',text:'JSE All Share',dir:()=>Math.random()>.45?'up':'down',val:()=>(rand(.1,2.5)).toFixed(1)+'%'},
  {sym:'BTC',text:'Bitcoin',dir:()=>Math.random()>.5?'up':'down',val:()=>(rand(.5,8)).toFixed(1)+'%'},
  {sym:'ZAR',text:'USD/ZAR',dir:()=>Math.random()>.5?'up':'down',val:()=>(rand(.1,1.5)).toFixed(2)},
  {sym:'GOLD',text:'Gold',dir:()=>Math.random()>.4?'up':'down',val:()=>(rand(.2,3)).toFixed(1)+'%'},
  {sym:'SARB',text:'Repo Rate',dir:()=>'flat',val:()=>(rand(7,9.5)).toFixed(2)+'%'},
  {sym:'NPN',text:'Naspers',dir:()=>Math.random()>.5?'up':'down',val:()=>(rand(.3,4)).toFixed(1)+'%'},
  {sym:'SOL',text:'Sasol',dir:()=>Math.random()>.5?'up':'down',val:()=>(rand(.2,3)).toFixed(1)+'%'},
  {sym:'ETH',text:'Ethereum',dir:()=>Math.random()>.5?'up':'down',val:()=>(rand(.5,6)).toFixed(1)+'%'},
  {sym:'CPI',text:'SA Inflation',dir:()=>'flat',val:()=>(rand(4.5,7)).toFixed(1)+'%'},
  {sym:'TOP40',text:'JSE Top 40',dir:()=>Math.random()>.45?'up':'down',val:()=>(rand(.1,2)).toFixed(1)+'%'},
];

/* ===== SCROLLING NEWS CAROUSEL =====
   Mix of misleading noise, contradictory signals, and 1-2 potentially useful hints.
   Designed to create uncertainty — hard to know what to trust.
*/
const NEWS_POOL={
  // Misleading / noise (most of the carousel)
  noise:[
    {text:'Analysts divided on whether rate cuts will come this quarter',type:'neu'},
    {text:'New study finds 90% of day traders lose money',type:'neu'},
    {text:'Influencer claims next 100x crypto gem found',type:'neu'},
    {text:'Financial advisor: "This time is different"',type:'neu'},
    {text:'Retail investors panic selling — contrarian signal?',type:'neu'},
    {text:'AI-generated trading signals gain popularity online',type:'neu'},
    {text:'Property developer denies rumours of insolvency',type:'neg'},
    {text:'Government to review pension fund regulations',type:'neu'},
    {text:'Social media buzz around new meme coin launch',type:'pos'},
    {text:'Fund manager predicts 40% crash — same as every year',type:'neg'},
    {text:'Crypto influencer arrested for pump and dump scheme',type:'neg'},
    {text:'"Buy the dip" trending on social media again',type:'pos'},
    {text:'Experts disagree on gold outlook for next 12 months',type:'neu'},
    {text:'Banks report record credit card debt levels',type:'neg'},
    {text:'Hedge fund billionaire bets against SA markets',type:'neg'},
    {text:'Small cap stocks quietly outperforming this month',type:'pos'},
    {text:'New online casino promises "guaranteed returns"',type:'neg'},
    {text:'Pension fund switches to passive index strategy',type:'pos'},
    {text:'Inflation expectations higher than actual CPI data',type:'neu'},
    {text:'Cryptocurrency regulation bill delayed until 2027',type:'neu'},
    {text:'Tip from a friend: "Trust me, this stock will moon"',type:'pos'},
    {text:'Market volatility index at highest level in 3 months',type:'neg'},
    {text:'Financial literacy survey: most SA adults can\'t read a balance sheet',type:'neu'},
    {text:'Forex traders warn of ZAR instability ahead of elections',type:'neg'},
    {text:'Rumours of major tech IPO on JSE — unconfirmed',type:'pos'},
    {text:'Global bond yields sending mixed signals to markets',type:'neu'},
  ],
  // Potentially useful (only 1-2 shown per round)
  useful:[
    {text:'SARB signals possible rate cut in next MPC meeting',type:'pos'},
    {text:'JSE Top 40 earnings revisions trending upward',type:'pos'},
    {text:'SA GDP contracts — recession risk growing',type:'neg'},
    {text:'Bitcoin hash rate hits all-time high ahead of halving',type:'pos'},
    {text:'Eskom secures emergency funding — load shedding eases',type:'pos'},
    {text:'Global recession fears intensify on weak US data',type:'neg'},
    {text:'Commodity prices surge on Chinese stimulus package',type:'pos'},
    {text:'Fixed deposit rates quietly climbing above 10%',type:'pos'},
    {text:'Crypto exchange liquidity drying up — warning sign',type:'neg'},
    {text:'SA government bonds downgraded to junk by Fitch',type:'neg'},
  ]
};

function generateNewsCarousel(){
  // Pick 8-12 items: mostly noise, 1-2 useful
  const count=Math.floor(rand(8,13));
  const usefulCount=Math.floor(rand(1,3)); // 1 or 2 useful
  const noiseCount=count-usefulCount;

  const shuffledNoise=[...NEWS_POOL.noise].sort(()=>Math.random()-.5);
  const shuffledUseful=[...NEWS_POOL.useful].sort(()=>Math.random()-.5);

  const items=[];
  for(let i=0;i<noiseCount&&i<shuffledNoise.length;i++) items.push(shuffledNoise[i]);
  for(let i=0;i<usefulCount&&i<shuffledUseful.length;i++) items.push(shuffledUseful[i]);

  // Shuffle so useful ones are hidden among noise
  return items.sort(()=>Math.random()-.5);
}

/* ===== LEADERBOARD PLAYERS ===== */
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
    prevAlloc:{eq:30,bond:15,cash:5,fd:20,crypto:20,gamble:10},
    portfolio:{eq:3000,bond:1500,cash:500,fd:2000,crypto:2000,gamble:1000},
    history:[10000], yearReturns:[], events:[], decisions:[],
    aiScores:AI_PLAYERS.map(p=>({...p,nw:10000})),
    totalContrib:0, yearNotes:[], totalFees:0,
    allocHistory:[] // track allocations each round for avg risk
  };
  renderGame();
}

/* ===== CALCULATE REBALANCING PENALTY ===== */
function calcRebalancePenalty(){
  // 1% of total portfolio value when allocation changes
  const pTotal=Object.values(G.portfolio).reduce((a,b)=>a+b,0);
  return pTotal*REBALANCE_PENALTY_RATE;
}

function hasAllocChanged(){
  return AKEYS.some(k=>G.alloc[k]!==G.prevAlloc[k]);
}

/* ===== SIMULATE YEAR ===== */
function simYear(){
  G.turn++;
  const result={event:null,decision:null,returns:{},notes:{},fees:0};

  // 1) Apply rebalancing penalty if allocation changed
  if(hasAllocChanged()){
    const penalty=calcRebalancePenalty();
    result.fees=penalty;
    G.totalFees+=penalty;
    // Deduct penalty proportionally from all positions
    const pTotal=Object.values(G.portfolio).reduce((a,b)=>a+b,0);
    if(pTotal>0){
      AKEYS.forEach(k=>{
        G.portfolio[k]=Math.max(0,G.portfolio[k]-(penalty*(G.portfolio[k]/pTotal)));
      });
    }
  }
  // Track allocation for average risk calculation
  G.allocHistory.push({...G.alloc});
  // Save current alloc as previous for next round
  G.prevAlloc={...G.alloc};

  // 2) Pick macro event
  const roll=Math.random();
  let cum=0;
  const shuffled=[...EVENTS].sort(()=>Math.random()-.5);
  for(const e of shuffled){cum+=e.prob;if(roll<cum){result.event=e;break;}}

  // 3) Compute returns per asset
  for(const k of AKEYS){
    const a=ASSETS[k];
    let mean=a.mean, vol=a.vol;
    if(result.event&&result.event.impacts[k])mean+=result.event.impacts[k];

    // Cash always loses to inflation
    if(k==='cash') mean=-SA_INFLATION;

    let r=mean+vol*randn();
    if(k==='crypto'&&Math.random()<.05)r=rand(.5,2.5);
    if(k==='gamble'){
      // Gambling loses most of the time
      if(Math.random()<.03)r=rand(1,4); // 3% chance of big win
      else if(Math.random()<.40)r=rand(-.8,-.3); // 40% chance of big loss
      else r=rand(-.3,-.05); // usually loses
    }
    r=clamp(r,a.min,a.max);
    result.returns[k]=r;

    // Pick narrative
    const notes=YEAR_NOTES[k];
    result.notes[k]=r>=0?pick(notes.pos):pick(notes.neg);

    const gain=G.portfolio[k]*r;
    G.portfolio[k]=Math.max(0,G.portfolio[k]+gain);
  }

  // 4) Add income
  const income=G.salary;
  const totalAlloc=AKEYS.reduce((s,k)=>s+G.alloc[k],0)||100;
  for(const k of AKEYS){
    const share=G.alloc[k]/totalAlloc;
    G.portfolio[k]+=income*share;
    G.totalContrib+=income*share;
  }

  // 5) Simulate AI players
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
  G.yearNotes.push(result.notes);
  if(result.event)G.events.push({turn:G.turn,event:result.event});

  return result;
}

/* ===== PICK DECISION (escalating risk) ===== */
function pickDecision(){
  if(Math.random()<.7){
    const progress=G.turn/G.horizon;
    let tier=0;
    if(progress>.25)tier=1;
    if(progress>.55)tier=2;
    if(progress>.8)tier=3;
    return pick(DECISIONS_BY_RISK[tier]);
  }
  return null;
}

/* ===== BENCHMARKS ===== */
function benchmarks(){
  const start=10000, inc=1500;
  const mixes=[
    {label:'100% Stocks Only',eq:1,bond:0,other:0},
    {label:'90/10 Stocks & Crypto',eq:.9,bond:0,other:.1}
  ];
  return mixes.map(m=>{
    let v=start;
    for(let i=0;i<G.turn;i++){
      const eqR=.12,bondR=.095,cryptoR=.15;
      v=v*(1+m.eq*eqR+m.bond*bondR+m.other*cryptoR)+inc;
    }
    return{label:m.label,value:Math.round(v)};
  });
}

/* 60/40 benchmark — classic balanced portfolio using actual game-year returns, no fees */
function sixtyForty(){
  const start=10000, inc=1500;
  let v=start;
  for(let i=0;i<G.turn;i++){
    const yr=G.yearReturns[i];
    if(yr){
      const blendedR=0.6*(yr.eq||0)+0.4*(yr.bond||0);
      v=v*(1+blendedR)+inc;
    } else {
      v+=inc;
    }
  }
  return Math.round(v);
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
  return((avg-.075)/std);
}

function calcScore(nw,sh){
  const totalRet=((nw/10000)-1);
  return Math.max(0,Math.round(totalRet*100*Math.max(0,sh)*10));
}

/* ===== IN-MEMORY LEADERBOARD ===== */
let _bestScore=null;
function getBestScore(){return _bestScore;}
function saveBestScore(entry){
  if(!_bestScore||entry.score>_bestScore.score)_bestScore=entry;
}

/* ===== TICKER HTML ===== */
function tickerHTML(){
  const items=TICKER_HEADLINES.map(t=>{
    const d=t.dir();
    const arrow=d==='up'?'▲':d==='down'?'▼':'●';
    return`<span class="ticker-item"><span class="sym">${t.sym}</span> <span class="${d}">${arrow} ${t.val()}</span></span>`;
  }).join('');
  // Triple the items for seamless loop
  return`<div class="ticker-track">${items}${items}${items}</div>`;
}

/* ===== NEWS CAROUSEL HTML ===== */
function newsCarouselHTML(){
  const news=generateNewsCarousel();
  const items=news.map(n=>`<div class="news-carousel-item ${n.type}"><span class="news-dot">●</span> ${n.text}</div>`).join('');
  // Triple for seamless infinite scroll
  return`<div class="news-carousel-track">${items}${items}${items}</div>`;
}

/* ===== RENDER: TITLE ===== */
function renderTitle(){
  let sel=10;
  app.innerHTML=`
  <div class="screen title-screen">
    <div class="title-bg"><img src="./splash.jpg" alt="Bull vs Bear"></div>
    <div class="title-content">
      <div class="title-presents">BANKERX PRESENTS</div>
      <div class="title-name">Wealth<span>Quest</span></div>
      <div class="title-tagline">Build wealth. Beat the market. Master investing.</div>
      <div class="title-config">
        <div class="config-label">Investment Horizon</div>
        <div class="config-row" id="hz-opts">
          <button class="config-btn" data-v="5">5 Years</button>
          <button class="config-btn active" data-v="10">10 Years</button>
          <button class="config-btn" data-v="20">20 Years</button>
        </div>
      </div>
      <button class="btn-play" id="btn-start">Start Investing</button>
      <div class="title-footer">
        <a href="https://www.perplexity.ai/computer" target="_blank" rel="noopener noreferrer">Powered by Perplexity Computer</a>
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
  const riskProfile=calcRiskProfile(G.alloc);
  const allocChanged=hasAllocChanged();
  const estFees=allocChanged?calcRebalancePenalty():0;

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
    <div class="news-ticker">${tickerHTML()}</div>
    <div class="game-body" id="gbody">
      <div class="alloc-section">
        <div class="alloc-header">
          <div class="alloc-title">Your Portfolio</div>
          <div class="alloc-total ${ok?'ok':total>100?'over':'under'}">${total}%</div>
        </div>
        <div id="alloc-warn-slot"></div>
        <div class="risk-indicator" id="risk-ind">
          <span class="ri-emoji">${riskProfile.emoji}</span>
          <span class="ri-label" style="color:${riskProfile.color}">${riskProfile.label}</span>
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
              <div class="asset-meta">${a.desc}</div>
              <input type="range" class="asset-slider ${a.cls}" data-k="${k}" min="0" max="100" step="5" value="${G.alloc[k]}">
              <div class="asset-meta">${R(G.portfolio[k])}</div>
            </div>`;
          }).join('')}
        </div>
        <div class="fee-notice" id="fee-notice" style="display:${allocChanged?'flex':'none'}">
          <span>💸</span>
          <span>Rebalancing penalty: ~${R(estFees)} (fees, admin & timing costs)</span>
        </div>
      </div>
      <div class="news-carousel">${newsCarouselHTML()}</div>
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

      const pTotal=Object.values(G.portfolio).reduce((a,b)=>a+b,0);
      AKEYS.forEach(k=>{G.portfolio[k]=pTotal*(G.alloc[k]/100)});
      const result=simYear();
      renderYearEnd(result);
    };
  }
}

function updateAllocUI(){
  const total=AKEYS.reduce((s,k)=>s+G.alloc[k],0);
  const ok=total===100;
  AKEYS.forEach(k=>{
    const card=document.querySelector(`.asset-card[data-k="${k}"]`);
    if(card)card.querySelector('.asset-pct').textContent=G.alloc[k]+'%';
  });
  const bar=$('abar');
  if(bar)AKEYS.forEach((k,i)=>{bar.children[i].style.width=G.alloc[k]+'%'});
  const tt=document.querySelector('.alloc-total');
  if(tt){tt.textContent=total+'%';tt.className='alloc-total '+(ok?'ok':total>100?'over':'under')}
  const warnSlot=$('alloc-warn-slot');
  if(warnSlot){
    if(total!==100){
      warnSlot.innerHTML=`<div class="alloc-warn">\u26A0\uFE0F Portfolio weightings must equal 100%</div>`;
    }else{
      warnSlot.innerHTML='';
    }
  }
  // Update risk indicator
  const riskProfile=calcRiskProfile(G.alloc);
  const ri=$('risk-ind');
  if(ri){
    ri.querySelector('.ri-emoji').textContent=riskProfile.emoji;
    const label=ri.querySelector('.ri-label');
    label.textContent=riskProfile.label;
    label.style.color=riskProfile.color;
  }
  // Update fee notice
  const allocChanged=hasAllocChanged();
  const feeNotice=$('fee-notice');
  if(feeNotice){
    if(allocChanged){
      const estFees=calcRebalancePenalty();
      feeNotice.style.display='flex';
      feeNotice.querySelector('span:last-child').textContent=`Rebalancing penalty: ~${R(estFees)} (fees, admin & timing costs)`;
    }else{
      feeNotice.style.display='none';
    }
  }
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
        <div class="ye-nw-val" style="color:${nw>=prev?'var(--g)':'var(--r)'}">${R(nw)}</div>
        <div class="ye-nw-change" style="color:${change>=0?'var(--g)':'var(--r)'}">
          ${change>=0?'↑':'↓'} ${R(Math.abs(change))} (${P(changePct)})
        </div>
      </div>

      ${result.fees>0?`<div class="fee-deducted">💸 Rebalancing penalty: ${R(result.fees)} (fees, admin & timing costs)</div>`:''}

      <table class="perf-table">
        <tr><th>Asset</th><th>Return</th><th>Value</th><th>What happened</th></tr>
        ${AKEYS.map(k=>{
          const ret=result.returns[k];
          const cls=ret>=0?'pos':'neg';
          return`<tr>
            <td><div class="asset-cell"><span class="dot bg-${ASSETS[k].cls}"></span>${ASSETS[k].name}</div></td>
            <td class="${cls}">${P(ret)}</td>
            <td>${R(G.portfolio[k])}</td>
            <td class="yr-note">${result.notes[k]}</td>
          </tr>`;
        }).join('')}
      </table>

      <div id="decision-slot"></div>
    </div>
    <div class="ye-footer">
      <button class="btn-advance" id="btn-continue">${G.turn>=G.horizon?'🏆 Final Results':'Continue →'}</button>
    </div>
  </div>`;

  // Show decision popup
  const dec=pickDecision();
  if(dec){
    setTimeout(()=>showDecision(dec),600);
  }

  $('btn-continue').onclick=()=>{
    if(G.turn>=G.horizon)renderFinalResults();
    else renderGame();
  };
}

/* ===== SHOW DECISION (realistic outcomes) ===== */
function showDecision(dec){
  const overlay=document.createElement('div');
  overlay.className='decision-overlay';
  const riskCls=dec.risk||'med';
  const riskLabel={low:'Low Risk',med:'Medium Risk',high:'High Risk',extreme:'Extreme Risk'}[riskCls]||'Risk';
  overlay.innerHTML=`
    <div class="decision-card">
      <div class="decision-emoji">${dec.emoji}</div>
      <div class="decision-title">${dec.title}</div>
      <div class="decision-desc">${dec.desc}</div>
      <div class="decision-risk ${riskCls}">${riskLabel}</div>
      <div class="decision-btns">
        <button class="decision-btn yes" id="dec-yes">Yes, I'm in!</button>
        <button class="decision-btn no" id="dec-no">No thanks</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector('#dec-yes').onclick=()=>{
    if(dec.yesCost>0){
      const total=Object.values(G.portfolio).reduce((a,b)=>a+b,0);
      AKEYS.forEach(k=>{
        G.portfolio[k]=Math.max(0,G.portfolio[k]-(dec.yesCost*(G.portfolio[k]/total)));
      });
    }

    // Use loseProb to determine if the decision loses money
    let ret;
    const loseProb=dec.loseProb||0.5;
    if(Math.random()<loseProb){
      // Loses money — pick from negative range
      ret=rand(dec.yesReturn[0],Math.min(0,dec.yesReturn[0]*0.3));
    }else{
      // Wins — pick from positive range
      ret=rand(0.01,dec.yesReturn[1]);
    }

    const gain=dec.yesCost>0?dec.yesCost*ret:G.portfolio[dec.yesAsset]*.05*ret;
    G.portfolio[dec.yesAsset]=Math.max(0,G.portfolio[dec.yesAsset]+gain);
    G.capital=Object.values(G.portfolio).reduce((a,b)=>a+b,0);
    G.history[G.history.length-1]=G.capital;
    G.decisions.push({turn:G.turn,...dec,accepted:true,result:ret});

    overlay.querySelector('.decision-card').innerHTML=`
      <div class="decision-emoji">${ret>=0?'🎉':'😬'}</div>
      <div class="decision-title">${ret>=0?'Nice move!':'Ouch...'}</div>
      <div class="decision-desc">${ret>=0?'That paid off! +'+R(Math.abs(gain)):'You lost '+R(Math.abs(gain))+'. Tough break.'}</div>
      <div style="font-size:11px;color:var(--txt2);line-height:1.4;margin-top:4px;padding:8px;background:var(--s2);border-radius:8px">📚 ${dec.lesson}</div>
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
  const annRet=G.turn>0?Math.pow(nw/10000,1/G.turn)-1:0;
  const ear=annRet*100;
  const bench=benchmarks();
  const score=calcScore(nw,sh);
  const sf=sixtyForty();
  const beatSF=nw>sf;

  // Save best score
  saveBestScore({score,nw:Math.round(nw),horizon:G.horizon,date:new Date().toISOString().slice(0,10)});
  const best=getBestScore();

  // Sharpe explanation
  let sharpeColor=sh>=1.5?'var(--g)':sh>=1?'#7dff7d':sh>=0.5?'var(--y)':sh>=0?'var(--orange)':'var(--r)';
  let sharpeGrade=sh>=1.5?'Excellent':sh>=1?'Good':sh>=0.5?'Average':sh>=0?'Below Average':'Poor';
  let sharpeExplain=`The Sharpe Ratio measures how much return you earned for each unit of risk you took. A ratio above 1.0 means your returns more than compensated for the volatility. Below 0 means you would've been better off in a risk-free savings account.`;
  let sharpePct=clamp((sh+1)/3*100,2,100);

  // Build leaderboard with AI + risk ratings
  const playerRisk=avgRiskProfile();
  const players=[...G.aiScores.map(p=>{
    const rl=aiRiskLabel(p.style);
    return{name:p.name,emoji:p.emoji,nw:Math.round(p.nw),you:false,risk:rl};
  }),
    {name:'You',emoji:'🎮',nw:Math.round(nw),you:true,risk:playerRisk}];
  players.sort((a,b)=>b.nw-a.nw);

  // 60/40 comparison
  const sfDiff=nw-sf;
  const sfPct=((nw/sf)-1)*100;

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

      <div class="bnh-card ${beatSF?'beat':'lost'}">
        <div class="bnh-icon">${beatSF?'🎯':'📉'}</div>
        <div class="bnh-body">
          <div class="bnh-title">You ${beatSF?'outperformed':'underperformed'} a classic 60/40 portfolio</div>
          <div class="bnh-detail">A 60/40 portfolio puts 60% in stocks and 40% in bonds — the most common balanced strategy. It would have returned ${R(sf)}. You ${beatSF?'beat':'trailed'} it by ${R(Math.abs(sfDiff))} (${sfPct>=0?'+':''}${sfPct.toFixed(1)}%).${G.totalFees>0?' Total rebalancing penalties paid: '+R(G.totalFees)+'.':''}</div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Return</div>
          <div class="stat-val" style="color:${totalRet>=0?'var(--g)':'var(--r)'}">
            ${totalRet>=0?'+':''}${totalRet.toFixed(1)}%
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Effective Annual Return</div>
          <div class="stat-val" style="color:${ear>=0?'var(--g)':'var(--r)'}">
            ${ear>=0?'+':''}${ear.toFixed(1)}% p.a.
          </div>
        </div>
      </div>

      <div class="sharpe-box">
        <div class="sb-title">📐 Risk-Adjusted Returns</div>
        <div class="sb-val" style="color:${sharpeColor}">Sharpe Ratio: ${sh.toFixed(2)}</div>
        <div class="sb-meter"><div class="sb-fill" style="width:${sharpePct}%;background:${sharpeColor}"></div></div>
        <div style="text-align:center;font-size:12px;font-weight:600;color:${sharpeColor}">${sharpeGrade}</div>
        <div class="sb-explain">${sharpeExplain}</div>
      </div>

      <div class="chart-card">
        <div class="bench-title">📈 Your Wealth Over Time</div>
        <canvas id="wealth-chart"></canvas>
      </div>

      <div class="bench-card">
        <div class="bench-title">📊 How You Compare</div>
        <div class="bench-row"><div class="bench-label">Your Result</div><div class="bench-val" style="color:var(--g)">${R(nw)}</div></div>
        <div class="bench-row"><div class="bench-label">60/40 Balanced (Stocks/Bonds)</div><div class="bench-val" style="color:var(--y)">${R(sf)}</div></div>
        ${bench.map(b=>`<div class="bench-row"><div class="bench-label">${b.label}</div><div class="bench-val" style="color:var(--b)">${R(b.value)}</div></div>`).join('')}
      </div>

      <div class="lb-card">
        <div class="lb-title">🏆 Leaderboard</div>
        ${players.slice(0,10).map((p,i)=>`
          <div class="lb-row ${p.you?'you':''}">
            <div class="lb-rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</div>
            <div style="font-size:16px">${p.emoji}</div>
            <div class="lb-name">${p.name}</div>
            <div class="lb-risk" style="color:${p.risk.color}">${p.risk.emoji} ${p.risk.label}</div>
            <div class="lb-score">${R(p.nw)}</div>
          </div>
        `).join('')}
        ${best?`<div style="text-align:center;margin-top:8px;font-size:11px;color:var(--y)">🏅 Your Best Score: ${best.score.toLocaleString()} pts (${R(best.nw)})</div>`:''}
      </div>

      <div class="newsletter-card">
        <div class="nl-title">Join the BANKERX Community</div>
        <div class="nl-desc">Get weekly insights on investing, markets & building wealth.</div>
        <a href="https://www.bankerx.org/join" target="_blank" rel="noopener noreferrer" class="nl-btn">Join BANKERX →</a>
      </div>

      <button class="btn-replay-blue" id="btn-again">🔄 Play Again</button>
      <div class="pplx-foot"><a href="https://www.perplexity.ai/computer" target="_blank" rel="noopener noreferrer">Powered by Perplexity Computer</a></div>
    </div>
  </div>`;

  // Draw chart
  setTimeout(()=>{
    const canvas=$('wealth-chart');
    if(canvas&&typeof Chart!=='undefined'){
      new Chart(canvas,{
        type:'line',
        data:{
          labels:G.history.map((_,i)=>i===0?'Start':'Y'+i),
          datasets:[{
            label:'Your Wealth',
            data:G.history.map(v=>Math.round(v)),
            borderColor:'#00ff88',
            backgroundColor:'rgba(0,255,136,.08)',
            fill:true,
            tension:.3,
            pointRadius:4,
            pointBackgroundColor:'#00ff88'
          }]
        },
        options:{
          responsive:true,
          maintainAspectRatio:false,
          plugins:{legend:{display:false}},
          scales:{
            x:{ticks:{color:'#666678',font:{size:10}},grid:{color:'rgba(34,34,51,.3)'}},
            y:{ticks:{color:'#666678',font:{size:10},callback:v=>'R'+Math.round(v/1000)+'K'},grid:{color:'rgba(34,34,51,.3)'}}
          }
        }
      });
    }
  },100);

  $('btn-again').onclick=()=>renderTitle();
}

/* ===== TEST HOOKS ===== */
window.render_game_to_text=()=>{
  if(!G)return JSON.stringify({phase:'title'});
  return JSON.stringify({phase:G.turn>=G.horizon?'end':'game',turn:G.turn,nw:Math.round(G.capital),alloc:G.alloc});
};

/* ===== INIT ===== */
renderTitle();
})();
