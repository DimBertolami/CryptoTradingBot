from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from scipy.optimize import minimize
from ortools.linear_solver import pywraplp
from .market_indicators import MarketIndicators
from .ml_risk_predictor import MLRiskPredictor
from .risk_manager import RiskManager

class PortfolioManager:
    """Comprehensive portfolio management system"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.risk_manager = RiskManager(config)
        self.ml_risk_predictor = MLRiskPredictor(config)
        self.current_portfolio = None
        self.rebalance_threshold = config.get('rebalance_threshold', 0.05)
        self.diversification_rules = self._initialize_diversification_rules()
        
    def _initialize_diversification_rules(self) -> Dict:
        """Initialize comprehensive diversification rules"""
        return {
            # Core diversification rules
            'max_single_asset': 0.2,
            'max_sector_exposure': 0.3,
            'min_assets': 5,
            'max_assets': 20,
            'correlation_threshold': 0.8,
            
            # Asset class diversification
            'asset_classes': {
                'equities': 0.4,
                'bonds': 0.3,
                'cryptocurrencies': 0.2,
                'commodities': 0.1,
                'alternatives': 0.1
            },
            
            # Geographic diversification
            'regions': {
                'north_america': 0.4,
                'europe': 0.3,
                'asia': 0.2,
                'emerging_markets': 0.1
            },
            
            # Market cap diversification
            'market_caps': {
                'large_cap': 0.5,
                'mid_cap': 0.3,
                'small_cap': 0.2
            },
            
            # Style diversification
            'styles': {
                'growth': 0.4,
                'value': 0.4,
                'balanced': 0.2
            },
            
            # Risk factor weights
            'risk_factors': {
                'volatility': 0.4,
                'market_regime': 0.3,
                'sector_risk': 0.2,
                'liquidity': 0.1,
                'geographic_risk': 0.1,
                'asset_class_risk': 0.1,
                'regulatory_risk': 0.05,
                'political_risk': 0.05
            },
            
            # Concentration limits
            'concentration_limits': {
                'single_security': 0.1,
                'single_sector': 0.3,
                'single_region': 0.4,
                'single_asset_class': 0.5,
                'single_style': 0.5
            },
            
            # Dynamic adjustment factors
            'adjustment_factors': {
                'market_volatility': 0.1,
                'liquidity_premium': 0.05,
                'regime_impact': 0.1,
                'correlation_impact': 0.05
            }
        }
        
    def calculate_asset_allocation(self, market_data: pd.DataFrame) -> Dict:
        """Calculate optimal asset allocation"""
        # Get market conditions
        market_indicators = MarketIndicators(market_data)
        risk_prediction = self.ml_risk_predictor.predict_risk(market_data)
        
        # Calculate returns and covariance
        returns = self._calculate_returns(market_data)
        cov_matrix = returns.cov()
        
        # Initialize solver
        solver = pywraplp.Solver.CreateSolver('GLOP')
        
        # Create variables
        n_assets = len(market_data.columns)
        weights = [solver.NumVar(0, 1, f'w{i}') for i in range(n_assets)]
        
        # Objective: Maximize risk-adjusted return
        objective = solver.Objective()
        for i in range(n_assets):
            # Adjust returns based on risk prediction
            adjusted_return = returns.mean()[i] * (1 - risk_prediction['risk_class'] * 0.1)
            objective.SetCoefficient(weights[i], adjusted_return)
        objective.SetMaximization()
        
        # Constraints
        # Sum of weights = 1
        constraint = solver.Constraint(1, 1)
        for w in weights:
            constraint.SetCoefficient(w, 1)
            
        # Diversification constraints
        self._add_diversification_constraints(solver, weights, market_data)
        
        # Risk constraints
        self._add_risk_constraints(solver, weights, cov_matrix)
        
        # Solve
        solver.Solve()
        
        # Get results
        optimized_weights = {
            asset: weights[i].solution_value()
            for i, asset in enumerate(market_data.columns)
        }
        
        return {
            'weights': optimized_weights,
            'metrics': {
                'expected_return': returns.mean().dot(
                    [weights[i].solution_value() for i in range(n_assets)]
                ),
                'portfolio_risk': np.sqrt(
                    np.dot(
                        np.dot(
                            [weights[i].solution_value() for i in range(n_assets)],
                            cov_matrix
                        ),
                        [weights[i].solution_value() for i in range(n_assets)]
                    )
                )
            }
        }
        
    def _add_diversification_constraints(self, solver: pywraplp.Solver,
                                        weights: List[pywraplp.Variable],
                                        market_data: pd.DataFrame) -> None:
        """Add diversification constraints"""
        n_assets = len(market_data.columns)
        
        # Max single asset constraint
        for w in weights:
            solver.Constraint(0, self.diversification_rules['max_single_asset']).SetCoefficient(w, 1)
            
        # Min assets constraint
        total_assets = solver.Sum(weights)
        solver.Constraint(self.diversification_rules['min_assets'], n_assets).SetCoefficient(total_assets, 1)
        
        # Max assets constraint
        solver.Constraint(0, self.diversification_rules['max_assets']).SetCoefficient(total_assets, 1)
        
        # Correlation constraint
        returns = self._calculate_returns(market_data)
        corr_matrix = returns.corr()
        for i in range(n_assets):
            for j in range(i + 1, n_assets):
                if corr_matrix.iloc[i, j] > self.diversification_rules['correlation_threshold']:
                    solver.Constraint(
                        0,
                        self.diversification_rules['max_single_asset']
                    ).SetCoefficient(weights[i], 1).SetCoefficient(weights[j], 1)
                    
    def _add_risk_constraints(self, solver: pywraplp.Solver,
                            weights: List[pywraplp.Variable],
                            cov_matrix: pd.DataFrame) -> None:
        """Add risk constraints"""
        n_assets = len(cov_matrix)
        
        # Portfolio risk constraint
        risk_constraint = solver.Constraint(
            -self.config.get('max_risk', 0.1),
            self.config.get('max_risk', 0.1)
        )
        for i in range(n_assets):
            for j in range(n_assets):
                risk_constraint.SetCoefficient(
                    weights[i], cov_matrix.iloc[i, j]
                )
                
        # Sector risk constraint
        if 'sector' in market_data.columns:
            sectors = market_data['sector'].unique()
            for sector in sectors:
                sector_assets = market_data[market_data['sector'] == sector].index
                sector_weight = solver.Sum([weights[i] for i in sector_assets])
                solver.Constraint(
                    0,
                    self.diversification_rules['max_sector_exposure']
                ).SetCoefficient(sector_weight, 1)
                
    def rebalance_portfolio(self, current_portfolio: Dict, 
                          new_allocation: Dict, 
                          market_data: pd.DataFrame) -> Dict:
        """Rebalance portfolio if necessary"""
        # Calculate rebalancing threshold
        rebalance_needed = False
        for asset, current_weight in current_portfolio.items():
            if abs(current_weight - new_allocation.get(asset, 0)) > self.rebalance_threshold:
                rebalance_needed = True
                break
                
        if not rebalance_needed:
            return current_portfolio
            
        # Get market conditions
        market_indicators = MarketIndicators(market_data)
        risk_level = self.risk_manager.get_risk_metrics()['current_drawdown']
        
        # Adjust weights based on market conditions
        adjusted_weights = {}
        for asset, weight in new_allocation.items():
            # Adjust for risk level
            risk_adjusted_weight = weight * (1 - risk_level)
            
            # Apply diversification rules
            if risk_adjusted_weight > self.diversification_rules['max_single_asset']:
                risk_adjusted_weight = self.diversification_rules['max_single_asset']
                
            adjusted_weights[asset] = risk_adjusted_weight
            
        # Normalize weights
        total_weight = sum(adjusted_weights.values())
        if total_weight > 0:
            for asset in adjusted_weights:
                adjusted_weights[asset] /= total_weight
                
        return adjusted_weights
        
    def calculate_risk_adjusted_returns(self, market_data: pd.DataFrame) -> pd.DataFrame:
        """Calculate risk-adjusted returns"""
        returns = self._calculate_returns(market_data)
        
        # Calculate risk factors
        risk_factors = self._calculate_risk_factors(market_data)
        
        # Adjust returns based on risk factors
        adjusted_returns = returns.copy()
        for asset in adjusted_returns.columns:
            risk_score = risk_factors[asset]
            adjusted_returns[asset] = adjusted_returns[asset] * (1 - risk_score)
            
        return adjusted_returns
        
    def _calculate_risk_factors(self, market_data: pd.DataFrame) -> Dict:
        """Calculate risk factors for each asset"""
        risk_factors = {}
        
        for asset in market_data.columns:
            # Calculate individual risk factors
            volatility = market_data[asset].std()
            volume = market_data[asset].volume.mean() if 'volume' in market_data.columns else 1
            
            # Get market regime impact
            market_indicators = MarketIndicators(market_data)
            regime_impact = self._get_regime_impact(market_indicators.indicators['market_regime'])
            
            # Calculate risk score
            risk_score = (
                volatility * self.diversification_rules['risk_factors']['volatility'] +
                regime_impact * self.diversification_rules['risk_factors']['market_regime'] +
                (1 / volume) * self.diversification_rules['risk_factors']['liquidity']
            )
            
            risk_factors[asset] = risk_score
            
        return risk_factors
        
    def _get_regime_impact(self, regime: str) -> float:
        """Get impact of market regime on risk"""
        regime_impact = {
            'volatile': 0.2,
            'trending': 0.1,
            'range_bound': 0.15,
            'volume_spike': 0.25,
            'neutral': 0.1
        }
        return regime_impact.get(regime, 0.1)
        
    def _calculate_returns(self, market_data: pd.DataFrame) -> pd.DataFrame:
        """Calculate returns for each asset"""
        returns = market_data.pct_change()
        return returns.dropna()
        
    def get_portfolio_metrics(self, portfolio_weights: Dict, 
                            market_data: pd.DataFrame) -> Dict:
        """Calculate portfolio metrics"""
        returns = self._calculate_returns(market_data)
        
        # Calculate portfolio metrics
        portfolio_return = returns.mean().dot(list(portfolio_weights.values()))
        portfolio_volatility = np.sqrt(
            np.dot(
                np.dot(list(portfolio_weights.values()), returns.cov()),
                list(portfolio_weights.values())
            )
        )
        
        # Calculate diversification metrics
        diversification_ratio = self._calculate_diversification_ratio(returns, portfolio_weights)
        
        # Calculate risk metrics
        risk_metrics = self._calculate_portfolio_risk_metrics(returns, portfolio_weights)
        
        return {
            'return': portfolio_return,
            'volatility': portfolio_volatility,
            'diversification_ratio': diversification_ratio,
            'risk_metrics': risk_metrics,
            'expected_return': portfolio_return * 252,  # Annualized
            'sharpe_ratio': portfolio_return / portfolio_volatility if portfolio_volatility != 0 else 0,
            'sortino_ratio': self._calculate_sortino_ratio(returns, portfolio_weights)
        }
        
    def _calculate_diversification_ratio(self, returns: pd.DataFrame, 
                                        weights: Dict) -> float:
        """Calculate diversification ratio"""
        weighted_returns = returns.dot(list(weights.values()))
        portfolio_volatility = weighted_returns.std()
        
        # Calculate weighted average volatility
        individual_vols = returns.std()
        weighted_avg_vol = np.dot(list(weights.values()), individual_vols)
        
        return weighted_avg_vol / portfolio_volatility if portfolio_volatility != 0 else 0
        
    def _calculate_portfolio_risk_metrics(self, returns: pd.DataFrame, 
                                         weights: Dict) -> Dict:
        """Calculate comprehensive risk metrics"""
        portfolio_returns = returns.dot(list(weights.values()))
        
        return {
            'max_drawdown': self._calculate_max_drawdown(portfolio_returns),
            'value_at_risk': self._calculate_value_at_risk(portfolio_returns),
            'conditional_value_at_risk': self._calculate_conditional_value_at_risk(portfolio_returns),
            'volatility': portfolio_returns.std() * np.sqrt(252),  # Annualized
            'downside_risk': portfolio_returns[portfolio_returns < 0].std() * np.sqrt(252)
        }
        
    def _calculate_max_drawdown(self, returns: pd.Series) -> float:
        """Calculate maximum drawdown"""
        cumulative_returns = (1 + returns).cumprod()
        running_max = cumulative_returns.cummax()
        drawdown = (cumulative_returns - running_max) / running_max
        return drawdown.min()
        
    def _calculate_value_at_risk(self, returns: pd.Series, confidence: float = 0.95) -> float:
        """Calculate Value at Risk"""
        return -np.percentile(returns, 100 * (1 - confidence))
        
    def _calculate_conditional_value_at_risk(self, returns: pd.Series, confidence: float = 0.95) -> float:
        """Calculate Conditional Value at Risk"""
        var = self._calculate_value_at_risk(returns, confidence)
        return -returns[returns <= -var].mean()

    def _calculate_additional_risk_metrics(self, returns: pd.DataFrame, 
                                         weights: Dict) -> Dict:
        """Calculate additional risk metrics"""
        portfolio_returns = returns.dot(list(weights.values()))
        
        return {
            # Tail risk metrics
            'tail_risk': self._calculate_tail_risk(portfolio_returns),
            'downside_deviation': self._calculate_downside_deviation(portfolio_returns),
            'upside_capture': self._calculate_upside_capture(portfolio_returns, returns.mean()),
            'downside_capture': self._calculate_downside_capture(portfolio_returns, returns.mean()),
            
            # Liquidity metrics
            'liquidity_score': self._calculate_liquidity_score(returns, weights),
            'turnover_ratio': self._calculate_turnover_ratio(returns, weights),
            
            # Concentration metrics
            'herfindahl_index': self._calculate_herfindahl_index(weights),
            'gini_coefficient': self._calculate_gini_coefficient(weights),
            
            # Scenario analysis
            'stress_test_metrics': self._run_stress_tests(returns, weights),
            
            # Risk decomposition
            'risk_contributions': self._calculate_risk_contributions(returns, weights)
        }
        
    def _calculate_tail_risk(self, returns: pd.Series, tail_prob: float = 0.05) -> float:
        """Calculate tail risk (extreme losses)"""
        return -returns.quantile(tail_prob)
        
    def _calculate_downside_deviation(self, returns: pd.Series, target_return: float = 0) -> float:
        """Calculate downside deviation"""
        downside_returns = returns[returns < target_return]
        return np.sqrt(np.mean((downside_returns - target_return)**2))
        
    def _calculate_upside_capture(self, portfolio_returns: pd.Series, benchmark: pd.Series) -> float:
        """Calculate upside capture ratio"""
        up_market = benchmark > 0
        return (portfolio_returns[up_market].mean() / benchmark[up_market].mean()) * 100
        
    def _calculate_downside_capture(self, portfolio_returns: pd.Series, benchmark: pd.Series) -> float:
        """Calculate downside capture ratio"""
        down_market = benchmark < 0
        return (portfolio_returns[down_market].mean() / benchmark[down_market].mean()) * 100
        
    def _calculate_liquidity_score(self, returns: pd.DataFrame, weights: Dict) -> float:
        """Calculate portfolio liquidity score"""
        # Calculate average daily volume
        volumes = returns.apply(lambda x: x.abs().mean())
        weighted_volumes = volumes * list(weights.values())
        return weighted_volumes.mean()
        
    def _calculate_turnover_ratio(self, returns: pd.DataFrame, weights: Dict) -> float:
        """Calculate portfolio turnover ratio"""
        # Calculate daily changes in weights
        weight_changes = np.diff(list(weights.values()))
        return np.abs(weight_changes).sum() / 2
        
    def _calculate_herfindahl_index(self, weights: Dict) -> float:
        """Calculate Herfindahl index for concentration"""
        weights_array = np.array(list(weights.values()))
        return (weights_array**2).sum()
        
    def _calculate_gini_coefficient(self, weights: Dict) -> float:
        """Calculate Gini coefficient for concentration"""
        weights_array = np.array(list(weights.values()))
        weights_array = np.sort(weights_array)
        n = len(weights_array)
        
        if n == 0:
            return 0
            
        index = np.arange(1, n + 1)
        return ((2 * index - n - 1) * weights_array).sum() / (n * weights_array.sum())
        
    def _run_stress_tests(self, returns: pd.DataFrame, weights: Dict) -> Dict:
        """Run stress tests on portfolio"""
        portfolio_returns = returns.dot(list(weights.values()))
        
        return {
            'market_crash': self._simulate_market_crash(portfolio_returns),
            'liquidity_crisis': self._simulate_liquidity_crisis(returns, weights),
            'regime_shift': self._simulate_regime_shift(returns, weights)
        }
        
    def _calculate_risk_contributions(self, returns: pd.DataFrame, weights: Dict) -> Dict:
        """Calculate risk contributions of each asset"""
        cov_matrix = returns.cov()
        portfolio_volatility = np.sqrt(
            np.dot(
                np.dot(list(weights.values()), cov_matrix),
                list(weights.values())
            )
        )
        
        risk_contributions = {}
        for i, asset in enumerate(returns.columns):
            marginal_contribution = np.dot(
                cov_matrix.iloc[i],
                list(weights.values())
            )
            risk_contributions[asset] = marginal_contribution * weights[asset] / portfolio_volatility
            
        return risk_contributions
