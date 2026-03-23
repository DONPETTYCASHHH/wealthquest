/**
 * WealthQuest — Simulation Engine
 * Turn-based investment simulation with stochastic returns and macro events
 */

const Engine = (() => {
  // ===== ASSET CLASS PROFILES =====
  const PROFILES = {
    invest: {
      name: 'Investing',
      desc: 'Stocks, ETFs & index funds',
      risk: 'Higher risk, higher reward',
      meanReturn: 0.08,    // 8% annual
      volatility: 0.16,    // 16% std dev
      minReturn: -0.40,
      maxReturn: 0.50,
      icon: '📈'
    },
    save: {
      name: 'Savings',
      desc: 'Cash & money market',
      risk: 'Low risk, low reward',
      meanReturn: 0.03,
      volatility: 0.005,
      minReturn: 0.005,
      maxReturn: 0.06,
      icon: '🏦'
    },
    bond: {
      name: 'Bonds',
      desc: 'Government & corporate',
      risk: 'Medium risk & return',
      meanReturn: 0.05,
      volatility: 0.06,
      minReturn: -0.10,
      maxReturn: 0.15,
      icon: '📊'
    },
    gamble: {
      name: 'Gambling',
      desc: 'Casino, bets & lotteries',
      risk: 'Very high risk, negative EV',
      meanReturn: -0.08,
      volatility: 0.45,
      minReturn: -0.80,
      maxReturn: 3.0,
      icon: '🎰'
    }
  };

  // ===== MACRO EVENTS =====
  const EVENTS = [
    {
      id: 'market_crash',
      name: 'Market Crash',
      desc: 'A major stock market correction hits. Diversified portfolios take a big hit, but bonds hold steady.',
      emoji: '💥',
      type: 'negative',
      probability: 0.08,
      impacts: { invest: -0.25, save: 0.0, bond: 0.03, gamble: 0.0 },
      lesson: 'Market crashes are painful but temporary. Staying invested through downturns is historically one of the best wealth-building strategies.'
    },
    {
      id: 'recession',
      name: 'Recession',
      desc: 'The economy contracts. Jobs are scarce, spending drops, and most assets decline.',
      emoji: '📉',
      type: 'negative',
      probability: 0.06,
      impacts: { invest: -0.15, save: -0.005, bond: 0.02, gamble: -0.05 },
      lesson: 'Recessions test your emergency fund. Those with cash reserves weather the storm better.'
    },
    {
      id: 'rate_hike',
      name: 'Interest Rate Hike',
      desc: 'Central bank raises rates to fight inflation. Savings earn more, but stocks and bonds dip.',
      emoji: '🏛️',
      type: 'neutral',
      probability: 0.10,
      impacts: { invest: -0.06, save: 0.015, bond: -0.04, gamble: 0.0 },
      lesson: 'Rate hikes make borrowing expensive but reward savers. Bonds lose value when rates rise because newer bonds pay more.'
    },
    {
      id: 'rate_cut',
      name: 'Interest Rate Cut',
      desc: 'Rates are slashed to stimulate the economy. Stocks and bonds rally, savings returns shrink.',
      emoji: '📈',
      type: 'positive',
      probability: 0.10,
      impacts: { invest: 0.08, save: -0.01, bond: 0.06, gamble: 0.0 },
      lesson: 'Rate cuts boost asset prices but hurt savers. This is why diversification matters.'
    },
    {
      id: 'inflation_shock',
      name: 'Inflation Shock',
      desc: 'Prices surge across the board. Cash loses purchasing power rapidly.',
      emoji: '🔥',
      type: 'negative',
      probability: 0.08,
      impacts: { invest: -0.03, save: -0.04, bond: -0.06, gamble: 0.0 },
      lesson: 'Inflation is the silent tax on cash. Over long periods, keeping money in savings alone means losing purchasing power.'
    },
    {
      id: 'tech_boom',
      name: 'Tech Boom',
      desc: 'A breakthrough technology drives a market rally. Growth stocks soar.',
      emoji: '🚀',
      type: 'positive',
      probability: 0.08,
      impacts: { invest: 0.18, save: 0.0, bond: 0.01, gamble: 0.05 },
      lesson: 'Bull markets reward patient investors. Those who stay invested capture the upside.'
    },
    {
      id: 'bull_market',
      name: 'Bull Market',
      desc: 'Broad economic optimism drives all markets higher.',
      emoji: '🐂',
      type: 'positive',
      probability: 0.10,
      impacts: { invest: 0.12, save: 0.005, bond: 0.03, gamble: 0.02 },
      lesson: 'Long bull markets are where most wealth is built. Time in the market beats timing the market.'
    },
    {
      id: 'medical_bill',
      name: 'Unexpected Medical Bill',
      desc: 'A major health expense forces a withdrawal. Your emergency fund absorbs the shock.',
      emoji: '🏥',
      type: 'negative',
      probability: 0.07,
      impacts: { invest: 0.0, save: 0.0, bond: 0.0, gamble: 0.0 },
      emergencyCost: 2000,
      lesson: 'Emergency funds exist for moments like these. Without one, you might be forced to sell investments at a loss.'
    },
    {
      id: 'job_loss',
      name: 'Job Loss',
      desc: 'You lose your income for this period. No salary contribution this turn.',
      emoji: '💼',
      type: 'negative',
      probability: 0.05,
      impacts: { invest: 0.0, save: 0.0, bond: 0.0, gamble: 0.0 },
      skipIncome: true,
      lesson: 'Job loss is why emergency funds are essential. 3-6 months of expenses in cash provides a safety net.'
    },
    {
      id: 'promotion',
      name: 'Promotion & Raise',
      desc: 'Great work pays off. Your monthly income increases by 20%.',
      emoji: '🎉',
      type: 'positive',
      probability: 0.08,
      impacts: { invest: 0.0, save: 0.0, bond: 0.0, gamble: 0.0 },
      raisePercent: 0.20,
      lesson: 'Higher income means more to invest. Avoid lifestyle creep — invest the difference.'
    },
    {
      id: 'windfall',
      name: 'Unexpected Windfall',
      desc: 'An inheritance or bonus adds R5,000 to your portfolio.',
      emoji: '💰',
      type: 'positive',
      probability: 0.05,
      impacts: { invest: 0.0, save: 0.0, bond: 0.0, gamble: 0.0 },
      windfall: 5000,
      lesson: 'Windfalls are opportunities. Investing them rather than spending can compound into significant wealth.'
    },
    {
      id: 'gambling_scandal',
      name: 'Gambling Platform Collapse',
      desc: 'A major betting platform goes bust. Gambling portfolios take a massive hit.',
      emoji: '🃏',
      type: 'negative',
      probability: 0.06,
      impacts: { invest: 0.0, save: 0.0, bond: 0.0, gamble: -0.50 },
      lesson: 'Gambling platforms can fail, taking your money with them. Unlike regulated markets, there\'s often no recovery.'
    },
    {
      id: 'bond_rally',
      name: 'Flight to Safety',
      desc: 'Global uncertainty drives investors to bonds. Bond values surge.',
      emoji: '🛡️',
      type: 'positive',
      probability: 0.07,
      impacts: { invest: -0.04, save: 0.005, bond: 0.10, gamble: 0.0 },
      lesson: 'Bonds often rise when stocks fall. This negative correlation is why balanced portfolios are more resilient.'
    }
  ];

  // ===== ACHIEVEMENTS =====
  const ACHIEVEMENTS = [
    { id: 'crash_survivor', name: 'Crash Survivor', desc: 'Stayed invested through a market crash', emoji: '🛡️', check: (h) => h.survivedCrash },
    { id: 'no_gambling', name: 'Clean Streak', desc: 'Zero gambling for 10+ turns', emoji: '🧘', check: (h) => h.noGambleTurns >= 10 },
    { id: 'emergency_ready', name: 'Safety Net', desc: 'Maintained emergency fund for 5+ turns', emoji: '🏥', check: (h) => h.emergencyTurns >= 5 },
    { id: 'diversified', name: 'Balanced Portfolio', desc: 'Held 3+ asset classes for 5+ turns', emoji: '⚖️', check: (h) => h.diversifiedTurns >= 5 },
    { id: 'doubler', name: 'Double Up', desc: 'Doubled your starting capital', emoji: '🏆', check: (h) => h.peakNetWorth >= h.startingCapital * 2 },
    { id: 'patient', name: 'Patient Investor', desc: 'Completed a 20+ year horizon', emoji: '⏳', check: (h) => h.totalTurns >= 20 },
    { id: 'compounder', name: 'Compound Machine', desc: 'Earned more from returns than contributions', emoji: '📈', check: (h) => h.totalReturns > h.totalContributions },
    { id: 'gambler_fallacy', name: 'Lesson Learned', desc: 'Lost 50%+ of gambling allocation in one turn', emoji: '🎲', check: (h) => h.bigGamblingLoss }
  ];

  // ===== RANKS =====
  const RANKS = [
    { threshold: 0,     name: 'Financial Rookie',     emoji: '🌱' },
    { threshold: 12000, name: 'Budget Builder',        emoji: '🔨' },
    { threshold: 18000, name: 'Smart Saver',           emoji: '💡' },
    { threshold: 30000, name: 'Market Apprentice',     emoji: '📘' },
    { threshold: 50000, name: 'Portfolio Pro',          emoji: '⭐' },
    { threshold: 80000, name: 'Wealth Architect',       emoji: '🏗️' },
    { threshold: 150000, name: 'Investment Master',     emoji: '👑' },
    { threshold: 300000, name: 'Financial Legend',      emoji: '🏆' }
  ];

  // ===== HELPER: Box-Muller for normal distribution =====
  function randn() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // ===== GAME STATE =====
  function createGameState(config) {
    const { horizon, mode, startingCapital } = config;
    const salary = mode === 'arcade' ? 1500 : 1000;

    return {
      config,
      turn: 0,
      totalTurns: horizon,
      mode,
      salary,
      baseSalary: salary,
      capital: startingCapital || 10000,
      allocation: { invest: 40, save: 30, bond: 20, gamble: 10 },
      portfolio: { invest: 4000, save: 3000, bond: 2000, gamble: 1000 },
      emergencyFund: false,
      emergencyBalance: 0,
      history: {
        netWorth: [startingCapital || 10000],
        events: [],
        allocations: [],
        survivedCrash: false,
        noGambleTurns: 0,
        emergencyTurns: 0,
        diversifiedTurns: 0,
        peakNetWorth: startingCapital || 10000,
        startingCapital: startingCapital || 10000,
        totalReturns: 0,
        totalContributions: 0,
        bigGamblingLoss: false,
        totalTurns: 0,
        gamblingPeakLoss: 0
      }
    };
  }

  // ===== SIMULATE ONE TURN =====
  function simulateTurn(state) {
    const result = {
      event: null,
      returns: {},
      portfolioBefore: { ...state.portfolio },
      emergencyUsed: 0,
      incomeAdded: 0,
      windfall: 0,
      insights: []
    };

    state.turn++;
    state.history.totalTurns = state.turn;

    // 1. Check for macro event
    let event = null;
    const roll = Math.random();
    let cumProb = 0;
    const shuffled = [...EVENTS].sort(() => Math.random() - 0.5);
    for (const e of shuffled) {
      cumProb += e.probability;
      if (roll < cumProb) {
        event = e;
        break;
      }
    }
    result.event = event;
    if (event) {
      state.history.events.push({ turn: state.turn, event });
    }

    // 2. Apply returns for each asset class
    const totalPortfolio = Object.values(state.portfolio).reduce((a, b) => a + b, 0);

    for (const key of ['invest', 'save', 'bond', 'gamble']) {
      const profile = PROFILES[key];
      let mean = profile.meanReturn;
      let vol = profile.volatility;

      // Adjust for mode
      if (state.mode === 'arcade') {
        vol *= 0.7;
      }

      // Apply event impact
      if (event && event.impacts[key]) {
        mean += event.impacts[key];
      }

      // Generate return using normal distribution
      let r = mean + vol * randn();

      // Gambling has fat tails: occasionally huge wins
      if (key === 'gamble') {
        const jackpotRoll = Math.random();
        if (jackpotRoll < 0.03) {
          r = 0.5 + Math.random() * 2.5; // Big win (50% to 300%)
          result.insights.push('Lucky break! But remember: the house always wins over time.');
        } else if (jackpotRoll < 0.15) {
          r = Math.min(r, -0.3); // Bad loss
        }
      }

      // Clamp returns
      r = clamp(r, profile.minReturn, profile.maxReturn);
      result.returns[key] = r;

      // Apply return
      const gain = state.portfolio[key] * r;
      state.portfolio[key] = Math.max(0, state.portfolio[key] + gain);
      state.history.totalReturns += gain;

      // Track big gambling loss
      if (key === 'gamble' && r < -0.40 && state.portfolio[key] > 100) {
        state.history.bigGamblingLoss = true;
      }
    }

    // 3. Handle event special effects
    if (event) {
      // Emergency cost
      if (event.emergencyCost) {
        const cost = event.emergencyCost;
        if (state.emergencyFund && state.emergencyBalance >= cost) {
          state.emergencyBalance -= cost;
          result.emergencyUsed = cost;
          result.insights.push('Your emergency fund covered this expense. Smart move!');
        } else {
          // Deduct from portfolio proportionally
          const total = Object.values(state.portfolio).reduce((a, b) => a + b, 0);
          if (total > 0) {
            for (const key of ['invest', 'save', 'bond', 'gamble']) {
              const share = state.portfolio[key] / total;
              state.portfolio[key] = Math.max(0, state.portfolio[key] - cost * share);
            }
          }
          result.insights.push('No emergency fund! You had to sell investments to cover this bill.');
        }
      }

      // Skip income
      if (event.skipIncome) {
        result.incomeAdded = 0;
      }

      // Raise
      if (event.raisePercent) {
        state.salary = Math.round(state.salary * (1 + event.raisePercent));
      }

      // Windfall
      if (event.windfall) {
        result.windfall = event.windfall;
      }

      // Track crash survival
      if (event.id === 'market_crash' && state.allocation.invest > 0) {
        state.history.survivedCrash = true;
      }
    }

    // 4. Add income
    if (!event || !event.skipIncome) {
      const income = state.salary;
      result.incomeAdded = income;

      // Emergency fund contribution (10% if enabled)
      let incomeForAllocation = income;
      if (state.emergencyFund) {
        const emergencyContrib = Math.round(income * 0.10);
        state.emergencyBalance += emergencyContrib;
        incomeForAllocation -= emergencyContrib;
      }

      // Add windfall
      incomeForAllocation += result.windfall;

      // Distribute by allocation
      const totalAlloc = state.allocation.invest + state.allocation.save + state.allocation.bond + state.allocation.gamble;
      if (totalAlloc > 0) {
        for (const key of ['invest', 'save', 'bond', 'gamble']) {
          const share = state.allocation[key] / totalAlloc;
          const amount = incomeForAllocation * share;
          state.portfolio[key] += amount;
          state.history.totalContributions += amount;
        }
      }
    }

    // 5. Update tracking
    const netWorth = Object.values(state.portfolio).reduce((a, b) => a + b, 0) + state.emergencyBalance;
    state.capital = netWorth;
    state.history.netWorth.push(netWorth);

    if (netWorth > state.history.peakNetWorth) {
      state.history.peakNetWorth = netWorth;
    }

    // No gambling tracking
    if (state.allocation.gamble === 0) {
      state.history.noGambleTurns++;
    } else {
      state.history.noGambleTurns = 0;
    }

    // Emergency fund tracking
    if (state.emergencyFund) {
      state.history.emergencyTurns++;
    }

    // Diversification tracking
    const activeAssets = ['invest', 'save', 'bond', 'gamble'].filter(k => state.allocation[k] > 5).length;
    if (activeAssets >= 3) {
      state.history.diversifiedTurns++;
    }

    state.history.allocations.push({ ...state.allocation });

    return result;
  }

  // ===== COMPUTE ALTERNATIVE SCENARIO =====
  function computeAlternative(state) {
    // What if the player had put everything in investing?
    const startCap = state.history.startingCapital;
    const turns = state.turn;
    const avgReturn = 0.08;
    const totalSalaryAdded = state.history.totalContributions;
    const annualContrib = totalSalaryAdded / Math.max(1, turns);

    // Simple compound: start + annual contributions
    let altValue = startCap;
    for (let i = 0; i < turns; i++) {
      altValue = altValue * (1 + avgReturn) + annualContrib;
    }

    return Math.round(altValue);
  }

  // ===== GET RANK =====
  function getRank(netWorth) {
    let rank = RANKS[0];
    for (const r of RANKS) {
      if (netWorth >= r.threshold) rank = r;
    }
    return rank;
  }

  // ===== CHECK ACHIEVEMENTS =====
  function checkAchievements(history) {
    return ACHIEVEMENTS.map(a => ({
      ...a,
      earned: a.check(history)
    }));
  }

  // ===== EDUCATIONAL TIPS =====
  function getTip(state, result) {
    const tips = [];

    if (state.allocation.gamble >= 50) {
      tips.push({
        emoji: '⚠️',
        title: 'Gambler\'s Fallacy',
        body: 'Allocating 50%+ to gambling is extremely risky. The expected return is negative — meaning on average, you lose money every turn. Past wins don\'t increase future odds.'
      });
    }

    if (state.allocation.save >= 80) {
      tips.push({
        emoji: '💡',
        title: 'Inflation Risk',
        body: 'Keeping 80%+ in savings feels safe, but inflation erodes your purchasing power over time. A R10,000 savings account earning 3% loses real value if inflation is 5%.'
      });
    }

    if (state.turn === 3 && !state.emergencyFund) {
      tips.push({
        emoji: '🏥',
        title: 'Emergency Fund',
        body: 'Consider enabling your emergency fund. Financial experts recommend 3-6 months of expenses set aside for unexpected events like medical bills or job loss.'
      });
    }

    if (state.allocation.invest === 0 && state.turn > 2) {
      tips.push({
        emoji: '📈',
        title: 'Time in the Market',
        body: 'You have 0% in investing. Historically, the stock market has returned ~8% annually over long periods. The earlier you start, the more compounding works in your favor.'
      });
    }

    if (result.event && result.event.lesson) {
      tips.push({
        emoji: '📚',
        title: 'Market Lesson',
        body: result.event.lesson
      });
    }

    return tips.length > 0 ? tips[0] : null;
  }

  // ===== GENERATE HEALTH SCORE =====
  function getHealthScore(state) {
    let score = 50;

    // Diversification bonus
    const active = ['invest', 'save', 'bond', 'gamble'].filter(k => state.allocation[k] > 10).length;
    score += active * 5;

    // Investing bonus
    if (state.allocation.invest >= 30) score += 10;
    if (state.allocation.invest >= 50) score += 5;

    // Gambling penalty
    if (state.allocation.gamble > 20) score -= 10;
    if (state.allocation.gamble > 40) score -= 15;

    // Emergency fund bonus
    if (state.emergencyFund) score += 10;

    // Growth bonus
    const growth = (state.capital / state.history.startingCapital - 1) * 100;
    if (growth > 50) score += 10;
    if (growth > 100) score += 5;

    return clamp(Math.round(score), 0, 100);
  }

  // ===== PUBLIC API =====
  return {
    PROFILES,
    EVENTS,
    ACHIEVEMENTS,
    RANKS,
    createGameState,
    simulateTurn,
    computeAlternative,
    getRank,
    checkAchievements,
    getTip,
    getHealthScore
  };
})();
