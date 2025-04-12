# Machine Learning Components Documentation

This document provides examples and usage instructions for the ML components in the CryptoTradingBot.

## Components Overview

1. Sentiment Analysis
2. Pattern Recognition
3. Anomaly Detection
4. Reinforcement Learning
5. Risk Management

## Usage Examples

### 1. Sentiment Analysis

```python
from ml.sentiment_analyzer import MarketSentimentAnalyzer

# Initialize analyzer
analyzer = MarketSentimentAnalyzer()

# Analyze market sentiment from text data
news_texts = [
    "Bitcoin price surges to new highs",
    "Market shows strong bullish signals"
]
sentiment_score = analyzer.analyze_text_sentiment(news_texts)

# Analyze market data
market_data = pd.DataFrame({
    'close': [100, 101, 99],
    'volume': [1000, 1100, 900]
})
market_sentiment = analyzer.analyze_market_data(market_data)

# Get overall market confidence
confidence = analyzer.get_market_confidence()
```

### 2. Pattern Recognition

```python
from ml.pattern_recognition import PatternRecognition

# Initialize pattern recognition
pattern_rec = PatternRecognition()

# Detect patterns in market data
patterns = pattern_rec.detect_candlestick_patterns(market_data)
technical_patterns = pattern_rec.detect_technical_patterns(market_data)

# Get trading signals
signals = pattern_rec.get_trading_signals(market_data)
print(f"Signal strength: {signals['signal_strength']}")
```

### 3. Anomaly Detection

```python
from ml.anomaly_detection import MarketAnomalyDetector

# Initialize detector
detector = MarketAnomalyDetector()

# Detect anomalies
result = detector.detect_anomalies(market_data)

if result['is_anomaly']:
    print(f"Anomaly detected! Score: {result['anomaly_score']}")
    print("Feature contributions:", result['feature_contributions'])
```

### 4. Reinforcement Learning

```python
from ml.reinforcement_learning import StrategyOptimizer
from ml.environment import TradingEnvironment

# Initialize environment and optimizer
env = TradingEnvironment(market_data)
optimizer = StrategyOptimizer(input_size=7, hidden_size=128, output_size=3)

# Train the model
metrics = optimizer.train(env, episodes=100, max_steps_per_episode=1000)

# Use the model for trading
state = env.get_current_state()
action, confidence = optimizer.select_action(state, training=False)

# Save and load models
optimizer.save_best_model(return_value=100.0)
optimizer.load_model('checkpoints/best_model.pt')
```

## Running Tests

To run the integration tests:

```bash
python -m unittest discover -s bot/tests
```

## Best Practices

1. Always validate input data before processing
2. Monitor model performance and confidence levels
3. Implement proper error handling
4. Regularly save model checkpoints
5. Use the risk management system to protect against losses

## Error Handling

All components implement comprehensive error handling:

```python
try:
    result = analyzer.analyze_market_data(data)
except ValidationError as e:
    logger.error(f"Validation error: {str(e)}")
except Exception as e:
    logger.error(f"Unexpected error: {str(e)}")
```

## Monitoring and Logging

Each component provides monitoring capabilities:

```python
# Get model summary
summary = optimizer.get_model_summary()

# Check anomaly detection history
context = detector.get_historical_context()

# Monitor sentiment trends
trend = analyzer.get_sentiment_trend()
```
