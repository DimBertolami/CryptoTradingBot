# CryptoTradingBot Documentation

## Overview
The CryptoTradingBot is a full-stack application for cryptocurrency trading with advanced risk management and portfolio tracking capabilities. This documentation provides detailed information about each component and its functionality.

## Frontend Components

### 1. RiskDashboard
**File**: `/src/components/RiskDashboard.tsx`

**Purpose**: Main dashboard for displaying trading bot metrics and risk analysis.

**Features**:
- Risk Level monitoring with visual indicators
- Bot Learning Metrics display
  - Cumulative Profit tracking
  - Bot Confidence metrics
  - Learning Progress visualization
- Portfolio Metrics
  - Sharpe Ratio
  - Sortino Ratio
  - Max Drawdown
  - Volatility
- Strategy Performance Chart
- Risk Heatmap for trading strategies

**Technical Details**:
- Built with React and TypeScript
- Uses Material-UI Grid system for responsive layout
- Implements Recharts for data visualization
- Uses React hooks for state management

### 2. Dashboard
**File**: `/src/components/Dashboard.tsx`

**Purpose**: General trading interface and market overview.

**Features**:
- Market data visualization
- Trading pair selection
- Performance metrics display
- Real-time price updates

### 3. PortfolioMetrics
**File**: `/src/components/PortfolioMetrics.tsx`

**Purpose**: Detailed portfolio analysis and performance tracking.

**Features**:
- Portfolio value tracking
- Asset allocation visualization
- Performance metrics
- Historical returns analysis

### 4. TechnicalAnalysisChart
**File**: `/src/components/TechnicalAnalysisChart.tsx`

**Purpose**: Advanced technical analysis visualization.

**Features**:
- Multiple technical indicators
- Customizable timeframes
- Price action analysis
- Trading signals display

## Backend Components

### 1. Base Trading Strategy
**File**: `/bot/strategies/base_strategy.py`

**Purpose**: Core trading logic and strategy implementation.

**Features**:
- Risk management system
- Position sizing logic
- Basic trading operations
- Performance tracking

**Supported Strategies**:
1. Moving Average
   - Simple and Exponential MA
   - Crossover signals
   - Trend following

2. RSI (Relative Strength Index)
   - Overbought/Oversold detection
   - Signal generation
   - Momentum tracking

3. MACD
   - Trend direction
   - Momentum measurement
   - Signal line crossovers

4. Bollinger Bands
   - Volatility measurement
   - Support/Resistance levels
   - Mean reversion signals

## Project Structure

```
/opt/lampp/htdocs/
├── src/
│   ├── components/
│   │   ├── RiskDashboard.tsx
│   │   ├── Dashboard.tsx
│   │   ├── PortfolioMetrics.tsx
│   │   ├── TechnicalAnalysisChart.tsx
│   │   └── ...
│   └── types/
│       └── ... (TypeScript type definitions)
├── bot/
│   └── strategies/
│       ├── base_strategy.py
│       └── ... (strategy implementations)
└── ...
```

## Dependencies

### Frontend
- React with TypeScript
- Material-UI for components
- Recharts for data visualization

### Backend
- Python for trading logic
- Machine learning libraries
- Data processing utilities

## Version Control

### Repository
- GitHub: [DimBertolami/CryptoTradingBot](https://github.com/DimBertolami/CryptoTradingBot)
- Branch Strategy: Feature branches with PR reviews
- Merge Strategy: Squash merging for clean history

## Development Guidelines

### TypeScript
- Use strict type checking
- Implement interfaces for data structures
- Maintain proper component typing

### React Components
- Use functional components with hooks
- Implement proper error handling
- Follow Material-UI best practices

### Code Style
- Follow consistent naming conventions
- Maintain clean code structure
- Document complex logic

## Deployment

### Frontend
- Build process optimized for production
- Asset optimization
- TypeScript compilation

### Backend
- Python environment management
- Dependency tracking
- Configuration management

## Testing

### Frontend
- Component testing
- Integration testing
- TypeScript type checking

### Backend
- Strategy backtesting
- Unit testing
- Integration testing

## Maintenance

### Regular Tasks
- Dependency updates
- Code quality checks
- Performance monitoring

### Best Practices
- Regular code reviews
- Documentation updates
- Performance optimization
