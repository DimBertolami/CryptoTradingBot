from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from datetime import datetime
from .base_strategy import TradingStrategy

class VolumeProfileStrategy(TradingStrategy):
    """Volume Profile Strategy
    
    This strategy identifies price levels with significant volume activity:
    - Value Areas (VAH/VAL)
    - Point of Control (POC)
    - Volume Distribution
    """
    
    def __init__(self, config: Dict):
        super().__init__(config)
        self.lookback_period = config.get('lookback_period', 50)
        self.volume_threshold = config.get('volume_threshold', 0.7)
        self.price_levels = config.get('price_levels', 20)
        self.min_volume_cluster = config.get('min_volume_cluster', 0.1)
        
    def create_volume_profile(self, data: pd.DataFrame) -> Dict:
        """Create volume profile distribution"""
        # Calculate price ranges
        price_range = data['high'].max() - data['low'].min()
        price_increment = price_range / self.price_levels
        
        # Create price bins
        price_bins = np.arange(
            data['low'].min(),
            data['high'].max() + price_increment,
            price_increment
        )
        
        # Calculate volume at each price level
        volume_profile = {}
        for i in range(len(price_bins) - 1):
            low_bin = price_bins[i]
            high_bin = price_bins[i + 1]
            
            # Find volume in this price range
            volume = data[(data['low'] <= high_bin) & 
                        (data['high'] >= low_bin)]['volume'].sum()
            
            volume_profile[(low_bin, high_bin)] = volume
            
        return volume_profile
        
    def analyze_volume_profile(self, volume_profile: Dict) -> Dict:
        """Analyze volume profile for key levels"""
        total_volume = sum(volume_profile.values())
        
        # Find Point of Control (POC)
        poc = max(volume_profile.items(), key=lambda x: x[1])[0]
        
        # Find Value Areas
        sorted_volumes = sorted(volume_profile.items(), key=lambda x: x[1], reverse=True)
        cumulative_volume = 0
        value_areas = []
        
        for price_range, volume in sorted_volumes:
            cumulative_volume += volume
            value_areas.append(price_range)
            
            if cumulative_volume / total_volume >= self.volume_threshold:
                break
                
        return {
            'poc': poc,
            'value_areas': value_areas,
            'total_volume': total_volume
        }
        
    def analyze_market(self, data: pd.DataFrame) -> Dict:
        """Analyze market using volume profile"""
        if len(data) < self.lookback_period:
            return {'signal': 'wait', 'reason': 'Insufficient data'}
            
        # Create and analyze volume profile
        volume_profile = self.create_volume_profile(data)
        profile_analysis = self.analyze_volume_profile(volume_profile)
        
        current_price = data['close'].iloc[-1]
        
        # Check if price is near key levels
        near_poc = abs(current_price - profile_analysis['poc'][0]) < (profile_analysis['poc'][1] - profile_analysis['poc'][0])
        near_value_area = any(
            low <= current_price <= high 
            for low, high in profile_analysis['value_areas']
        )
        
        return {
            'current_price': current_price,
            'poc': profile_analysis['poc'],
            'value_areas': profile_analysis['value_areas'],
            'near_poc': near_poc,
            'near_value_area': near_value_area,
            'volume_profile': volume_profile
        }
        
    def generate_signals(self, data: pd.DataFrame) -> List[Dict]:
        """Generate signals based on volume profile"""
        analysis = self.analyze_market(data)
        signals = []
        
        # Generate buy signal if price is above POC with volume confirmation
        if (analysis['current_price'] > analysis['poc'][1] and 
            analysis['near_value_area']):
            
            signals.append({
                'type': 'buy',
                'price': analysis['current_price'],
                'timestamp': data.index[-1],
                'reason': 'Price above POC with volume support',
                'target': analysis['poc'][1] * 1.05  # Target above POC
            })
            
        # Generate sell signal if price is below POC with volume confirmation
        if (analysis['current_price'] < analysis['poc'][0] and 
            analysis['near_value_area']):
            
            signals.append({
                'type': 'sell',
                'price': analysis['current_price'],
                'timestamp': data.index[-1],
                'reason': 'Price below POC with volume support',
                'target': analysis['poc'][0] * 0.95  # Target below POC
            })
            
        return signals
        
    def calculate_position_size(self, signal: Dict, account_balance: float) -> float:
        """Calculate position size based on volume profile"""
        base_position = super().calculate_position_size(signal, account_balance)
        
        if 'volume_profile' in signal.get('analysis', {}):
            # Increase position size near strong volume areas
            volume_at_price = signal['analysis']['volume_profile'].get(
                tuple(signal['analysis']['poc']), 0
            )
            
            volume_multiplier = 1 + (volume_at_price / sum(signal['analysis']['volume_profile'].values()))
            return base_position * min(1.5, volume_multiplier)
            
        return base_position
