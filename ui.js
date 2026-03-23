/**
 * WealthQuest — UI Renderer
 * Pure DOM rendering with smooth transitions
 */

const UI = (() => {
  const app = document.getElementById('app');
  let tooltipTimeout = null;

  // ===== FORMAT HELPERS =====
  function formatCurrency(val) {
    return 'R' + Math.round(val).toLocaleString('en-ZA');
  }

  function formatPct(val) {
    const sign = val >= 0 ? '+' : '';
    return sign + (val * 100).toFixed(1) + '%';
  }

  function formatPctInt(val) {
    return val + '%';
  }

  // ===== CHART DRAWING =====
  function drawChart(canvas, data, colors) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    if (data.length < 2) return;

    const min = Math.min(...data) * 0.9;
    const max = Math.max(...data) * 1.1;
    const range = max - min || 1;
    const stepX = w / (data.length - 1);

    // Grid lines
    const style = getComputedStyle(document.documentElement);
    const gridColor = style.getPropertyValue('--color-border').trim();
    const textColor = style.getPropertyValue('--color-text-faint').trim();

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      const y = (h * i) / 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    const primaryColor = colors?.primary || style.getPropertyValue('--color-primary').trim();
    gradient.addColorStop(0, primaryColor + '40');
    gradient.addColorStop(1, primaryColor + '00');

    // Path
    ctx.beginPath();
    ctx.moveTo(0, h - ((data[0] - min) / range) * h);
    for (let i = 1; i < data.length; i++) {
      const x = i * stepX;
      const y = h - ((data[i] - min) / range) * h;
      // Smooth curve
      const prevX = (i - 1) * stepX;
      const prevY = h - ((data[i - 1] - min) / range) * h;
      const cpx = (prevX + x) / 2;
      ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
    }

    // Fill area
    const lastX = (data.length - 1) * stepX;
    ctx.lineTo(lastX, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(0, h - ((data[0] - min) / range) * h);
    for (let i = 1; i < data.length; i++) {
      const x = i * stepX;
      const y = h - ((data[i] - min) / range) * h;
      const prevX = (i - 1) * stepX;
      const prevY = h - ((data[i - 1] - min) / range) * h;
      const cpx = (prevX + x) / 2;
      ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
    }
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Last point dot
    const lastY = h - ((data[data.length - 1] - min) / range) * h;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = primaryColor;
    ctx.fill();
    ctx.strokeStyle = style.getPropertyValue('--color-surface').trim();
    ctx.lineWidth = 2;
    ctx.stroke();

    // Labels
    ctx.font = '500 11px General Sans, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.fillText(formatCurrency(max), 4, 14);
    ctx.fillText(formatCurrency(min), 4, h - 4);
  }

  // ===== TITLE SCREEN =====
  function renderTitle(onStart) {
    const horizonOptions = [
      { value: 5, label: '5 Years' },
      { value: 10, label: '10 Years' },
      { value: 20, label: '20 Years' },
      { value: 30, label: '30 Years' }
    ];

    const modeOptions = [
      { value: 'arcade', label: 'Arcade' },
      { value: 'strategy', label: 'Strategy' }
    ];

    let selectedHorizon = 10;
    let selectedMode = 'arcade';

    app.innerHTML = `
      <div class="title-screen">
        <div class="title-logo">Wealth<span>Quest</span></div>
        <div class="title-tagline">
          Build wealth, learn investing, and discover why patience beats luck. 
          A turn-based financial simulation inspired by classic trading games.
        </div>
        <div class="title-config">
          <div class="config-group">
            <div class="config-label">Time Horizon</div>
            <div class="config-options" id="horizon-options">
              ${horizonOptions.map(o => `
                <button class="config-option ${o.value === selectedHorizon ? 'active' : ''}" data-value="${o.value}">
                  ${o.label}
                </button>
              `).join('')}
            </div>
          </div>
          <div class="config-group">
            <div class="config-label">Game Mode</div>
            <div class="config-options" id="mode-options">
              ${modeOptions.map(o => `
                <button class="config-option ${o.value === selectedMode ? 'active' : ''}" data-value="${o.value}">
                  ${o.label}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
        <button class="btn-play" id="btn-start">Start Investing</button>
        <div class="pplx-footer">
          <a href="https://www.perplexity.ai/computer" target="_blank" rel="noopener noreferrer">
            Created with Perplexity Computer
          </a>
        </div>
      </div>
    `;

    // Horizon selection
    document.getElementById('horizon-options').addEventListener('click', (e) => {
      const btn = e.target.closest('.config-option');
      if (!btn) return;
      selectedHorizon = parseInt(btn.dataset.value);
      document.querySelectorAll('#horizon-options .config-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });

    // Mode selection
    document.getElementById('mode-options').addEventListener('click', (e) => {
      const btn = e.target.closest('.config-option');
      if (!btn) return;
      selectedMode = btn.dataset.value;
      document.querySelectorAll('#mode-options .config-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });

    // Start button
    document.getElementById('btn-start').addEventListener('click', () => {
      onStart({ horizon: selectedHorizon, mode: selectedMode, startingCapital: 10000 });
    });
  }

  // ===== GAME SCREEN =====
  function renderGame(state, result, callbacks) {
    const netWorth = state.capital;
    const prevNetWorth = state.history.netWorth.length > 1
      ? state.history.netWorth[state.history.netWorth.length - 2]
      : netWorth;
    const change = netWorth - prevNetWorth;
    const changePct = prevNetWorth > 0 ? change / prevNetWorth : 0;
    const isPositive = change >= 0;

    const event = result ? result.event : null;
    const isGameOver = state.turn >= state.totalTurns;

    app.innerHTML = `
      <div class="game-screen">
        <div class="game-header">
          <div class="header-left">
            <div class="header-logo">WQ</div>
            <div class="turn-badge">Year ${state.turn} / ${state.totalTurns}</div>
          </div>
          <div class="header-right">
            <button class="header-btn" id="btn-theme" aria-label="Toggle theme">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </button>
            <button class="header-btn" id="btn-learn" aria-label="Learn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="game-body">
          <div class="networth-hero">
            <div class="networth-label">Net Worth</div>
            <div class="networth-value">${formatCurrency(netWorth)}</div>
            ${state.turn > 0 ? `
              <div class="networth-change ${isPositive ? 'positive' : 'negative'}">
                ${isPositive ? '↑' : '↓'} ${formatCurrency(Math.abs(change))} (${formatPct(changePct)})
              </div>
            ` : ''}
          </div>

          <div class="chart-container">
            <canvas class="chart-canvas" id="chart"></canvas>
          </div>

          <div class="event-banner ${event ? 'visible' : ''}" id="event-banner">
            ${event ? `
              <div class="event-icon ${event.type}">${event.emoji}</div>
              <div class="event-content">
                <div class="event-title">${event.name}</div>
                <div class="event-desc">${event.desc}</div>
              </div>
              <button class="event-dismiss" id="btn-dismiss-event">Got it</button>
            ` : ''}
          </div>

          <div class="allocation-section">
            <div class="section-header">
              <div class="section-title">Allocation</div>
              <div class="section-hint">Must total 100%</div>
            </div>

            <div class="total-bar" id="total-bar">
              <div class="total-bar-seg invest" style="width:${state.allocation.invest}%"></div>
              <div class="total-bar-seg save" style="width:${state.allocation.save}%"></div>
              <div class="total-bar-seg bond" style="width:${state.allocation.bond}%"></div>
              <div class="total-bar-seg gamble" style="width:${state.allocation.gamble}%"></div>
            </div>
            <div class="alloc-warn" id="alloc-warn"></div>

            <div class="asset-cards">
              ${['invest', 'save', 'bond', 'gamble'].map(key => {
                const p = Engine.PROFILES[key];
                const ret = result && result.returns[key] !== undefined ? result.returns[key] : null;
                return `
                  <div class="asset-card" data-asset="${key}">
                    <div class="asset-top">
                      <div class="asset-name">
                        <span class="asset-dot"></span>
                        ${p.name}
                      </div>
                      <div class="asset-pct">${state.allocation[key]}%</div>
                    </div>
                    <div class="asset-risk">${p.risk}${ret !== null ? ' · ' + formatPct(ret) : ''}</div>
                    <div class="asset-slider-wrap">
                      <input type="range" class="asset-slider" data-key="${key}" min="0" max="100" step="5" value="${state.allocation[key]}">
                      <span class="slider-val">${formatCurrency(state.portfolio[key])}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="income-section">
            <div class="income-row">
              <div class="income-label">Monthly Income</div>
              <div class="income-val">${formatCurrency(state.salary)}</div>
            </div>
            ${state.emergencyFund ? `
              <div class="income-row">
                <div class="income-label">Emergency Fund</div>
                <div class="income-val" style="color:var(--color-success)">${formatCurrency(state.emergencyBalance)}</div>
              </div>
            ` : ''}
            <div class="income-row">
              <div class="income-label">Health Score</div>
              <div class="income-val" style="color:var(--color-primary)">${Engine.getHealthScore(state)} / 100</div>
            </div>
          </div>

          <div class="emergency-toggle" id="emergency-toggle">
            <div class="emergency-info">
              <div class="emergency-title">Emergency Fund</div>
              <div class="emergency-desc">Set aside 10% of income each turn</div>
            </div>
            <div class="toggle-switch ${state.emergencyFund ? 'active' : ''}" id="toggle-emergency"></div>
          </div>
        </div>

        <div class="game-footer">
          <button class="btn-advance" id="btn-advance">
            ${isGameOver ? 'View Results' : 'Advance Year →'}
          </button>
        </div>
      </div>
    `;

    // Draw chart
    requestAnimationFrame(() => {
      const canvas = document.getElementById('chart');
      if (canvas) {
        drawChart(canvas, state.history.netWorth);
      }
    });

    // ===== EVENT HANDLERS =====

    // Theme toggle
    document.getElementById('btn-theme').addEventListener('click', () => {
      const html = document.documentElement;
      const current = html.getAttribute('data-theme');
      html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
      // Re-render to update chart colors
      renderGame(state, result, callbacks);
    });

    // Learn button
    document.getElementById('btn-learn').addEventListener('click', () => {
      showTooltip({
        emoji: '📖',
        title: 'How to Play',
        body: 'Allocate your money across 4 asset classes using the sliders. Each year, your investments grow (or shrink) based on market conditions and random events. Your goal is to build wealth over ' + state.totalTurns + ' years while learning healthy financial habits.\n\nInvesting: Best for long-term growth (avg 8%/yr)\nSavings: Safe but barely beats inflation\nBonds: Moderate risk and return\nGambling: Exciting but you lose money on average'
      });
    });

    // Dismiss event
    const dismissBtn = document.getElementById('btn-dismiss-event');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        document.getElementById('event-banner').classList.remove('visible');
      });
    }

    // Sliders
    const sliders = document.querySelectorAll('.asset-slider');
    sliders.forEach(slider => {
      slider.addEventListener('input', () => {
        const key = slider.dataset.key;
        const newVal = parseInt(slider.value);
        const oldVal = state.allocation[key];
        const diff = newVal - oldVal;

        // Find other keys to adjust
        const otherKeys = ['invest', 'save', 'bond', 'gamble'].filter(k => k !== key);
        const otherTotal = otherKeys.reduce((sum, k) => sum + state.allocation[k], 0);

        if (otherTotal > 0 && diff !== 0) {
          // Distribute the difference proportionally among others
          let remaining = -diff;
          otherKeys.forEach((k, i) => {
            if (i === otherKeys.length - 1) {
              state.allocation[k] = Math.max(0, Math.min(100, state.allocation[k] + remaining));
            } else {
              const share = state.allocation[k] / otherTotal;
              const adj = Math.round(remaining * share / 5) * 5;
              state.allocation[k] = Math.max(0, Math.min(100, state.allocation[k] + adj));
              remaining -= adj;
            }
          });
        }

        state.allocation[key] = newVal;

        // Normalize to 100
        const total = Object.values(state.allocation).reduce((a, b) => a + b, 0);
        if (total !== 100) {
          const lastKey = otherKeys[otherKeys.length - 1];
          state.allocation[lastKey] += (100 - total);
          state.allocation[lastKey] = Math.max(0, state.allocation[lastKey]);
        }

        // Clamp all
        for (const k of ['invest', 'save', 'bond', 'gamble']) {
          state.allocation[k] = Math.max(0, Math.min(100, state.allocation[k]));
        }

        updateAllocationUI(state);
      });
    });

    // Emergency fund toggle
    document.getElementById('toggle-emergency').addEventListener('click', () => {
      state.emergencyFund = !state.emergencyFund;
      const toggle = document.getElementById('toggle-emergency');
      toggle.classList.toggle('active', state.emergencyFund);
    });

    // Advance button
    document.getElementById('btn-advance').addEventListener('click', () => {
      if (isGameOver) {
        callbacks.onGameOver();
      } else {
        callbacks.onAdvance();
      }
    });
  }

  function updateAllocationUI(state) {
    // Update cards
    ['invest', 'save', 'bond', 'gamble'].forEach(key => {
      const card = document.querySelector(`.asset-card[data-asset="${key}"]`);
      if (!card) return;
      card.querySelector('.asset-pct').textContent = state.allocation[key] + '%';
      const slider = card.querySelector('.asset-slider');
      slider.value = state.allocation[key];
      card.querySelector('.slider-val').textContent = formatCurrency(state.portfolio[key]);
    });

    // Update total bar
    const totalBar = document.getElementById('total-bar');
    if (totalBar) {
      totalBar.querySelector('.invest').style.width = state.allocation.invest + '%';
      totalBar.querySelector('.save').style.width = state.allocation.save + '%';
      totalBar.querySelector('.bond').style.width = state.allocation.bond + '%';
      totalBar.querySelector('.gamble').style.width = state.allocation.gamble + '%';
    }

    // Warn
    const total = Object.values(state.allocation).reduce((a, b) => a + b, 0);
    const warn = document.getElementById('alloc-warn');
    if (warn) {
      warn.textContent = total !== 100 ? `Total: ${total}% (must be 100%)` : '';
    }
  }

  // ===== RESULTS SCREEN =====
  function renderResults(state, callbacks) {
    const netWorth = state.capital;
    const rank = Engine.getRank(netWorth);
    const achievements = Engine.checkAchievements(state.history);
    const healthScore = Engine.getHealthScore(state);
    const altValue = Engine.computeAlternative(state);
    const totalReturn = ((netWorth / state.history.startingCapital) - 1) * 100;
    const earnedCount = achievements.filter(a => a.earned).length;

    app.innerHTML = `
      <div class="results-screen">
        <div class="results-header">
          <div class="results-title">Game Complete</div>
          <div class="results-subtitle">${state.totalTurns} years of financial decisions</div>
        </div>

        <div class="results-body">
          <div class="rank-badge">
            <div class="rank-icon">${rank.emoji}</div>
            <div class="rank-info">
              <div class="rank-level">${rank.name}</div>
              <div class="rank-desc">Final Net Worth: ${formatCurrency(netWorth)}</div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Return</div>
              <div class="stat-value" style="color: ${totalReturn >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}">${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(1)}%</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Health Score</div>
              <div class="stat-value" style="color: var(--color-primary)">${healthScore}/100</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Events Survived</div>
              <div class="stat-value">${state.history.events.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Achievements</div>
              <div class="stat-value" style="color: var(--color-gold)">${earnedCount}/${achievements.length}</div>
            </div>
          </div>

          <div class="insight-card">
            <div class="insight-title">💡 What if you invested 100%?</div>
            <div class="insight-compare">
              <div class="insight-metric">
                <div class="insight-metric-label">Your Result</div>
                <div class="insight-metric-value" style="color: ${netWorth >= altValue ? 'var(--color-success)' : 'var(--color-text)'}">${formatCurrency(netWorth)}</div>
              </div>
              <div class="insight-metric">
                <div class="insight-metric-label">100% Invested</div>
                <div class="insight-metric-value" style="color: var(--color-invest)">${formatCurrency(altValue)}</div>
              </div>
            </div>
            <div class="insight-text">
              ${netWorth >= altValue
                ? 'Your strategy outperformed a 100% stock portfolio. Well done — your diversification and decisions paid off.'
                : 'A fully invested portfolio would have grown more, thanks to compounding. The longer the horizon, the more powerful compounding becomes.'}
            </div>
          </div>

          <div class="allocation-section">
            <div class="section-title">Achievements</div>
            <div class="achievements-list">
              ${achievements.map(a => `
                <div class="achievement ${a.earned ? 'earned' : ''}">
                  <div class="achievement-icon">${a.emoji}</div>
                  <div class="achievement-text">
                    <div class="achievement-name">${a.name}</div>
                    <div class="achievement-desc">${a.desc}</div>
                  </div>
                  ${a.earned ? '<div class="achievement-check">✓</div>' : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <div class="insight-card">
            <div class="insight-title">📊 Final Breakdown</div>
            <div class="insight-text">
              Starting capital: ${formatCurrency(state.history.startingCapital)}<br>
              Total income earned: ${formatCurrency(state.history.totalContributions)}<br>
              Total investment returns: ${formatCurrency(state.history.totalReturns)}<br>
              ${state.emergencyBalance > 0 ? 'Emergency fund: ' + formatCurrency(state.emergencyBalance) + '<br>' : ''}
              Peak net worth: ${formatCurrency(state.history.peakNetWorth)}
            </div>
          </div>

          <button class="btn-replay" id="btn-replay">Play Again</button>

          <div class="pplx-footer">
            <a href="https://www.perplexity.ai/computer" target="_blank" rel="noopener noreferrer">
              Created with Perplexity Computer
            </a>
          </div>
        </div>
      </div>
    `;

    // Replay
    document.getElementById('btn-replay').addEventListener('click', () => {
      callbacks.onReplay();
    });
  }

  // ===== TOOLTIP =====
  function showTooltip(data) {
    const overlay = document.createElement('div');
    overlay.className = 'tooltip-overlay';
    overlay.innerHTML = `
      <div class="tooltip-card">
        <div class="tooltip-emoji">${data.emoji}</div>
        <div class="tooltip-title">${data.title}</div>
        <div class="tooltip-body">${data.body.replace(/\n/g, '<br>')}</div>
        <button class="tooltip-close">Got it</button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('.tooltip-close').addEventListener('click', () => {
      overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }

  return {
    renderTitle,
    renderGame,
    renderResults,
    showTooltip,
    formatCurrency,
    drawChart
  };
})();
