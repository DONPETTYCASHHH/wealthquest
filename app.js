/**
 * WealthQuest — App Controller
 * Game loop, state management, and screen transitions
 */

(function () {
  let gameState = null;
  let lastResult = null;
  let tipShownThisTurn = false;

  // ===== START SCREEN =====
  function showTitle() {
    UI.renderTitle((config) => {
      startGame(config);
    });
  }

  // ===== START GAME =====
  function startGame(config) {
    gameState = Engine.createGameState(config);
    lastResult = null;
    tipShownThisTurn = false;

    // Distribute starting capital according to initial allocation
    const total = gameState.capital;
    for (const key of ['invest', 'save', 'bond', 'gamble']) {
      gameState.portfolio[key] = total * (gameState.allocation[key] / 100);
    }

    renderGameScreen();
  }

  // ===== RENDER GAME =====
  function renderGameScreen() {
    UI.renderGame(gameState, lastResult, {
      onAdvance: advanceTurn,
      onGameOver: showResults
    });
  }

  // ===== ADVANCE TURN =====
  function advanceTurn() {
    // Re-distribute portfolio according to current allocation before simulating
    const totalPortfolio = Object.values(gameState.portfolio).reduce((a, b) => a + b, 0);
    for (const key of ['invest', 'save', 'bond', 'gamble']) {
      gameState.portfolio[key] = totalPortfolio * (gameState.allocation[key] / 100);
    }

    // Simulate
    const result = Engine.simulateTurn(gameState);
    lastResult = result;

    // Re-render
    renderGameScreen();

    // Show educational tip if applicable
    const tip = Engine.getTip(gameState, result);
    if (tip && !tipShownThisTurn) {
      tipShownThisTurn = true;
      setTimeout(() => {
        UI.showTooltip(tip);
        tipShownThisTurn = false;
      }, 600);
    } else {
      tipShownThisTurn = false;
    }
  }

  // ===== SHOW RESULTS =====
  function showResults() {
    UI.renderResults(gameState, {
      onReplay: showTitle
    });
  }

  // ===== EXPOSE TEST HOOKS =====
  window.render_game_to_text = function () {
    if (!gameState) return JSON.stringify({ phase: 'title' });
    return JSON.stringify({
      phase: gameState.turn >= gameState.totalTurns ? 'results' : 'game',
      turn: gameState.turn,
      totalTurns: gameState.totalTurns,
      netWorth: Math.round(gameState.capital),
      allocation: { ...gameState.allocation },
      portfolio: {
        invest: Math.round(gameState.portfolio.invest),
        save: Math.round(gameState.portfolio.save),
        bond: Math.round(gameState.portfolio.bond),
        gamble: Math.round(gameState.portfolio.gamble)
      },
      emergencyFund: gameState.emergencyFund,
      emergencyBalance: Math.round(gameState.emergencyBalance),
      salary: gameState.salary,
      healthScore: Engine.getHealthScore(gameState),
      events: gameState.history.events.length
    });
  };

  window.advanceTime = function (ms) {
    // For testing: advance one turn
    if (gameState && gameState.turn < gameState.totalTurns) {
      advanceTurn();
    }
  };

  // ===== INIT =====
  showTitle();

  // Handle resize for chart redraw
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (gameState) {
        const canvas = document.getElementById('chart');
        if (canvas) {
          UI.drawChart(canvas, gameState.history.netWorth);
        }
      }
    }, 200);
  });
})();
