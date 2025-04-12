import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const mockBacktestResults = {
  data: {
    strategy: 'RSI + MACD',
    timeframe: '1h',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    initialCapital: 10000,
    metrics: {
      totalReturn: 5.25,
      maxDrawdown: 2.1,
      sharpeRatio: 1.45,
      winRate: 65,
      averageWin: 1.2,
      averageLoss: -0.8,
      totalTrades: 120,
      profitableTrades: 78,
      losingTrades: 42,
      longestWinningStreak: 7,
      longestLosingStreak: 4,
      averageWinningStreak: 3,
      averageLosingStreak: 2,
      averageTradeDuration: '1.5h',
      maxTradeDuration: '4h',
      minTradeDuration: '30m',
      averageProfitPerTrade: 0.45,
      averageLossPerTrade: -0.35,
      totalProfit: 54.6,
      totalLoss: 14.7,
      netProfit: 39.9,
      profitFactor: 3.71,
      expectancy: 0.25,
      riskRewardRatio: 1.5,
      recoveryFactor: 2.3,
      riskOfRuin: 0.05,
      averageDailyReturn: 0.02,
      volatility: 0.15,
      correlationWithMarket: 0.65,
      beta: 1.2,
      alpha: 0.03,
      informationRatio: 0.45,
      trackingError: 0.08,
      downsideDeviation: 0.12,
      sortinoRatio: 1.85,
      calmarRatio: 1.2,
      omegaRatio: 1.35,
      tailRatio: 1.1,
      valueAtRisk: -0.05,
      conditionalValueAtRisk: -0.07,
      skewness: 0.85,
      kurtosis: 3.2,
      maxDailyLoss: -0.03,
      maxDailyGain: 0.04,
      averageDailyLoss: -0.015,
      averageDailyGain: 0.025,
      overallWinRate: 55,
      overallLossRate: 45,
      overallConsecutiveWinningDays: 3,
      overallConsecutiveLosingDays: 2,
      overallAverageWinningDays: 2.5,
      overallAverageLosingDays: 1.8,
      dailyProfitFactor: 1.8,
      dailyExpectancy: 0.01,
      dailyRiskRewardRatio: 1.2,
      dailyRecoveryFactor: 1.5,
      dailyRiskOfRuin: 0.03,
      dailyAverageReturn: 0.005,
      dailyVolatility: 0.01,
      dailyCorrelationWithMarket: 0.6,
      dailyBeta: 1.1,
      dailyAlpha: 0.02,
      dailyInformationRatio: 0.4,
      dailyTrackingError: 0.07,
      dailyDownsideDeviation: 0.012,
      dailySortinoRatio: 1.7,
      dailyCalmarRatio: 1.1,
      dailyOmegaRatio: 1.3,
      dailyTailRatio: 1.05,
      dailyValueAtRisk: -0.005,
      dailyConditionalValueAtRisk: -0.007,
      dailySkewness: 0.8,
      dailyKurtosis: 3.1,
      dailyMaxLoss: -0.025,
      dailyMaxGain: 0.035,
      dailyAverageLoss: -0.012,
      dailyAverageGain: 0.022,
      dailyWinRate: 54,
      dailyLossRate: 46,
      dailyConsecutiveWinningDays: 2.8,
      dailyConsecutiveLosingDays: 1.9,
      dailyAverageWinningDays: 2.4,
      dailyAverageLosingDays: 1.7
    },
    trades: [
      {
        timestamp: '2024-01-15T14:00:00Z',
        type: 'buy',
        price: 25000,
        amount: 0.04,
        fee: 0.00075,
        pnl: 0,
        duration: '0h',
        strategy: 'RSI + MACD'
      },
      {
        timestamp: '2024-01-15T16:00:00Z',
        type: 'sell',
        price: 25500,
        amount: 0.04,
        fee: 0.00075,
        pnl: 199.8,
        duration: '2h',
        strategy: 'RSI + MACD'
      }
    ]
  }
};

const handlers = [
  http.get('/backtest', () => {
    return HttpResponse.json(mockBacktestResults);
  })
];

export const server = setupServer(...handlers);
