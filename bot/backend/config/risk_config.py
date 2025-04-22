"""
Risk Management configuration settings
"""

class RiskConfig:
    # Position Sizing
    MAX_POSITION_SIZE = 0.1  # 10% of portfolio
    MIN_POSITION_SIZE = 0.01  # 1% of portfolio
    
    # Risk Limits
    MAX_PORTFOLIO_VOLATILITY = 0.05  # 5%
    MAX_DRAWDOWN = 0.05  # 5%
    MAX_VAULT = 0.1  # 10% of portfolio
    
    # Stop Loss/Take Profit
    STOP_LOSS_PCT = 0.02  # 2%
    TAKE_PROFIT_PCT = 0.05  # 5%
    TRAILING_STOP_PCT = 0.01  # 1%
    
    # Confidence Thresholds
    MIN_CONFIDENCE_THRESHOLD = 0.7  # 70% confidence required
    HIGH_CONFIDENCE_THRESHOLD = 0.9  # 90% confidence for aggressive positions
    
    # Portfolio Diversification
    MAX_POSITIONS = 10  # Maximum number of positions
    MIN_POSITIONS = 2   # Minimum number of positions
    
    # Risk Metrics
    VOLATILITY_WINDOW = 20  # Days for volatility calculation
    CORRELATION_WINDOW = 60  # Days for correlation calculation
    
    # Position Management
    MAX_LEVERAGE = 1.0  # No leverage by default
    MARGIN_CALL_THRESHOLD = 0.02  # 2% margin requirement
    
    # Risk Assessment
    RISK_FREE_RATE = 0.02  # 2% annual risk-free rate
    CONFIDENCE_LEVEL = 0.95  # 95% confidence level for VaR
    
    # Portfolio Rebalancing
    REBALANCE_THRESHOLD = 0.1  # Rebalance if position drifts by 10%
    REBALANCE_INTERVAL = 3600  # Rebalance every hour
    
    # Historical Data
    LOOKBACK_PERIOD = 365  # Days of historical data
    MIN_DATA_POINTS = 252  # Minimum data points required
    
    # Risk Metrics Calculation
    ROLLING_WINDOW = 20  # Days for rolling calculations
    MIN_OBSERVATIONS = 30  # Minimum observations for statistical calculations
    
    # Position Sizing Strategy
    VOLATILITY_ADJUSTMENT = True  # Adjust position size based on volatility
    CORRELATION_ADJUSTMENT = True  # Adjust position size based on correlation
    
    # Risk Controls
    ENABLE_STOP_LOSS = True
    ENABLE_TAKE_PROFIT = True
    ENABLE_TRAILING_STOP = True
    
    # Portfolio Constraints
    MAX_SECTOR_EXPOSURE = 0.3  # 30% max exposure to any sector
    MAX_COUNTRY_EXPOSURE = 0.3  # 30% max exposure to any country
    MAX单个头寸暴露 = 0.1  # 10% max exposure to any single position
    
    # Risk Management Rules
    MAX_DAILY_TRADES = 50  # Maximum trades per day
    MAX_POSITION_DRAWDOWN = 0.05  # 5% max drawdown per position
    MAX_PORTFOLIO_DRAWDOWN = 0.1  # 10% max drawdown for entire portfolio
    
    # Risk Metrics Monitoring
    MONITOR_INTERVAL = 300  # Monitor risk metrics every 5 minutes
    ALERT_THRESHOLD = 0.05  # Alert if risk metrics exceed 5% threshold
    
    # Risk Management Logging
    LOG_LEVEL = 'INFO'
    LOG_FILE = 'risk_management.log'
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Risk Management Alerts
    ALERT_EMAIL = True
    ALERT_SLACK = True
    ALERT_TELEGRAM = True
