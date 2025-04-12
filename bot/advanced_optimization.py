from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from scipy.optimize import minimize
from ortools.linear_solver import pywraplp
from .ml_risk_predictor import MLRiskPredictor
from .market_indicators import MarketIndicators
from .portfolio_optimizer import PortfolioOptimizer

class AdvancedOptimization:
    """Advanced portfolio optimization techniques"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.ml_risk_predictor = MLRiskPredictor(config)
        self.market_indicators = None
        
    def hierarchical_risk_parity(self, strategy_signals: Dict[str, List[Dict]],
                               market_data: pd.DataFrame) -> Dict:
        """Hierarchical Risk Parity optimization"""
        # Calculate correlation matrix
        returns = self._calculate_returns(strategy_signals, market_data)
        corr = returns.corr()
        
        # Build hierarchical tree
        dist = np.sqrt(0.5 * (1 - corr))
        linkage = self._hierarchical_clustering(dist)
        
        # Get weights using recursive bisection
        weights = self._recursive_bisection(linkage, returns)
        
        return {
            'weights': weights,
            'metrics': {
                'diversification_ratio': self._calculate_diversification_ratio(returns, weights),
                'portfolio_risk': np.sqrt(
                    np.dot(
                        np.dot(list(weights.values()), returns.cov()),
                        list(weights.values())
                    )
                )
            }
        }
        
    def _hierarchical_clustering(self, dist: pd.DataFrame) -> np.ndarray:
        """Perform hierarchical clustering"""
        from scipy.cluster.hierarchy import linkage
        return linkage(dist, method='ward')
        
    def _recursive_bisection(self, linkage: np.ndarray, returns: pd.DataFrame) -> Dict[str, float]:
        """Recursive bisection for HRP"""
        n = len(returns.columns)
        weights = np.ones(n) / n
        
        # Get cluster assignments
        clusters = self._get_cluster_assignments(linkage, n)
        
        # Calculate cluster weights
        for i in range(n - 1):
            left = clusters[i]
            right = clusters[i + 1]
            
            # Calculate inverse variance weights
            left_var = returns[left].var()
            right_var = returns[right].var()
            
            left_weight = 1 / left_var
            right_weight = 1 / right_var
            
            total_weight = left_weight + right_weight
            
            weights[left] *= left_weight / total_weight
            weights[right] *= right_weight / total_weight
            
        return dict(zip(returns.columns, weights))
        
    def _get_cluster_assignments(self, linkage: np.ndarray, n: int) -> List[List[int]]:
        """Get cluster assignments from linkage matrix"""
        clusters = [[i] for i in range(n)]
        
        for i in range(n - 1):
            left = int(linkage[i][0])
            right = int(linkage[i][1])
            
            new_cluster = clusters[left] + clusters[right]
            clusters.append(new_cluster)
            
        return clusters
        
    def robust_optimization(self, strategy_signals: Dict[str, List[Dict]],
                          market_data: pd.DataFrame) -> Dict:
        """Robust optimization with uncertainty sets"""
        # Calculate returns and covariance matrix
        returns = self._calculate_returns(strategy_signals, market_data)
        cov_matrix = returns.cov()
        
        # Initialize solver
        solver = pywraplp.Solver.CreateSolver('GLOP')
        
        # Create variables
        n_strategies = len(strategy_signals)
        weights = [solver.NumVar(0, 1, f'w{i}') for i in range(n_strategies)]
        
        # Objective: Maximize robust return
        objective = solver.Objective()
        
        # Add uncertainty terms
        uncertainty = self._calculate_uncertainty(returns)
        
        for i in range(n_strategies):
            robust_return = returns.mean()[i] - uncertainty[i]
            objective.SetCoefficient(weights[i], robust_return)
        
        objective.SetMaximization()
        
        # Constraints
        # Sum of weights = 1
        constraint = solver.Constraint(1, 1)
        for w in weights:
            constraint.SetCoefficient(w, 1)
            
        # Robust risk constraint
        risk_constraint = solver.Constraint(
            -self.config.get('max_risk', 0.1),
            self.config.get('max_risk', 0.1)
        )
        for i in range(n_strategies):
            for j in range(n_strategies):
                robust_cov = cov_matrix.iloc[i, j] + uncertainty[i] * uncertainty[j]
                risk_constraint.SetCoefficient(
                    weights[i], robust_cov
                )
                
        # Solve
        solver.Solve()
        
        # Get results
        optimized_weights = {
            list(strategy_signals.keys())[i]: weights[i].solution_value()
            for i in range(n_strategies)
        }
        
        return {
            'weights': optimized_weights,
            'metrics': {
                'expected_return': returns.mean().dot(
                    [weights[i].solution_value() for i in range(n_strategies)]
                ),
                'portfolio_risk': np.sqrt(
                    np.dot(
                        np.dot(
                            [weights[i].solution_value() for i in range(n_strategies)],
                            cov_matrix
                        ),
                        [weights[i].solution_value() for i in range(n_strategies)]
                    )
                )
            }
        }
        
    def _calculate_uncertainty(self, returns: pd.DataFrame) -> np.ndarray:
        """Calculate uncertainty for each strategy"""
        return np.sqrt(returns.var()) * self.config.get('uncertainty_factor', 0.1)
        
    def multi_objective_optimization(self, strategy_signals: Dict[str, List[Dict]],
                                   market_data: pd.DataFrame) -> Dict:
        """Multi-objective optimization with Pareto front"""
        # Calculate returns and covariance matrix
        returns = self._calculate_returns(strategy_signals, market_data)
        cov_matrix = returns.cov()
        
        # Initialize NSGA-II algorithm
        from pymoo.algorithms.moo.nsga2 import NSGA2
        from pymoo.factory import get_sampling, get_crossover, get_mutation
        from pymoo.optimize import minimize
        
        # Define problem
        class PortfolioOptimization:
            def __init__(self, returns, cov_matrix):
                self.returns = returns
                self.cov_matrix = cov_matrix
                
            def _evaluate(self, x, out, *args, **kwargs):
                weights = x / np.sum(x)
                
                # Calculate objectives
                portfolio_return = np.dot(weights, self.returns.mean())
                portfolio_risk = np.sqrt(
                    np.dot(
                        np.dot(weights, self.cov_matrix),
                        weights
                    )
                )
                
                # Minimize risk and maximize return
                out["F"] = np.column_stack([portfolio_risk, -portfolio_return])
                
        problem = PortfolioOptimization(returns, cov_matrix)
        
        # Initialize algorithm
        algorithm = NSGA2(
            pop_size=100,
            sampling=get_sampling("real_random"),
            crossover=get_crossover("real_sbx", prob=0.9, eta=15),
            mutation=get_mutation("real_pm", eta=20),
            eliminate_duplicates=True
        )
        
        # Optimize
        res = minimize(
            problem,
            algorithm,
            ('n_gen', 200),
            seed=1,
            verbose=False
        )
        
        # Get Pareto front
        pareto_front = res.F
        optimal_weights = res.X
        
        # Choose optimal solution based on risk preference
        risk_preference = self.config.get('risk_preference', 0.5)
        optimal_idx = int(len(pareto_front) * risk_preference)
        
        return {
            'weights': dict(zip(
                returns.columns,
                optimal_weights[optimal_idx] / np.sum(optimal_weights[optimal_idx])
            )),
            'metrics': {
                'portfolio_return': -pareto_front[optimal_idx][1],
                'portfolio_risk': pareto_front[optimal_idx][0],
                'pareto_front': pareto_front
            }
        }
