"""
Model Optimization and Comparison
Implements automated hyperparameter tuning and model comparison
"""

import optuna
from optuna.trial import Trial
import numpy as np
from typing import Dict, List, Tuple
import tensorflow as tf
from sklearn.model_selection import TimeSeriesSplit
import joblib
import os
import logging
from datetime import datetime

logger = logging.getLogger("model_optimization")

class ModelOptimizer:
    def __init__(self, config: Dict):
        self.config = config
        self.study = None
        self.best_params = None
        self.model_comparisons = []
        
    def objective(self, trial: Trial, X: np.ndarray, y: np.ndarray) -> float:
        """Optuna objective function for hyperparameter optimization"""
        params = {
            'n_layers': trial.suggest_int('n_layers', 2, 5),
            'units_1': trial.suggest_int('units_1', 32, 256),
            'units_2': trial.suggest_int('units_2', 32, 256),
            'dropout': trial.suggest_float('dropout', 0.1, 0.5),
            'learning_rate': trial.suggest_loguniform('learning_rate', 1e-5, 1e-2),
            'batch_size': trial.suggest_categorical('batch_size', [16, 32, 64, 128])
        }
        
        # Add conditional layers
        for i in range(3, 6):
            if i <= params['n_layers']:
                params[f'units_{i}'] = trial.suggest_int(f'units_{i}', 32, 256)
        
        # Build and train model
        model = self._build_trial_model(params)
        cv = TimeSeriesSplit(n_splits=5)
        scores = []
        
        for train_idx, val_idx in cv.split(X):
            X_train, X_val = X[train_idx], X[val_idx]
            y_train, y_val = y[train_idx], y[val_idx]
            
            history = model.fit(
                X_train, y_train,
                epochs=50,
                batch_size=params['batch_size'],
                validation_data=(X_val, y_val),
                verbose=0
            )
            
            scores.append(min(history.history['val_loss']))
        
        return np.mean(scores)
    
    def _build_trial_model(self, params: Dict) -> tf.keras.Model:
        """Build model with trial parameters"""
        model = tf.keras.Sequential()
        
        # Input layer
        model.add(tf.keras.layers.Input(shape=(self.config['sequence_length'], self.config['n_features'])))
        
        # Add layers based on parameters
        for i in range(1, params['n_layers'] + 1):
            model.add(tf.keras.layers.LSTM(
                params[f'units_{i}'],
                return_sequences=i < params['n_layers']
            ))
            model.add(tf.keras.layers.Dropout(params['dropout']))
        
        model.add(tf.keras.layers.Dense(1))
        
        model.compile(
            optimizer=tf.keras.optimizers.Adam(params['learning_rate']),
            loss='mse',
            metrics=['mae']
        )
        
        return model
    
    def optimize(self, X: np.ndarray, y: np.ndarray, n_trials: int = 100):
        """Run hyperparameter optimization"""
        try:
            self.study = optuna.create_study(direction='minimize')
            self.study.optimize(
                lambda trial: self.objective(trial, X, y),
                n_trials=n_trials
            )
            
            self.best_params = self.study.best_params
            logger.info(f"Best parameters: {self.best_params}")
            
            # Save optimization results
            results_dir = os.path.join(self.config['model_dir'], 'optimization')
            os.makedirs(results_dir, exist_ok=True)
            
            joblib.dump(
                self.study,
                os.path.join(results_dir, f'optuna_study_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pkl')
            )
            
            return self.best_params
            
        except Exception as e:
            logger.error(f"Error in hyperparameter optimization: {e}")
            return None
    
    def compare_models(self, models: List[tf.keras.Model], X: np.ndarray, y: np.ndarray) -> Dict:
        """Compare different model architectures"""
        try:
            results = []
            cv = TimeSeriesSplit(n_splits=5)
            
            for i, model in enumerate(models):
                model_metrics = {
                    'model_name': f"Model_{i+1}",
                    'architecture': str(model.get_config()),
                    'cv_scores': [],
                    'training_time': [],
                    'inference_time': []
                }
                
                for train_idx, val_idx in cv.split(X):
                    X_train, X_val = X[train_idx], X[val_idx]
                    y_train, y_val = y[train_idx], y[val_idx]
                    
                    # Training time
                    start_time = datetime.now()
                    history = model.fit(
                        X_train, y_train,
                        epochs=50,
                        batch_size=32,
                        validation_data=(X_val, y_val),
                        verbose=0
                    )
                    training_time = (datetime.now() - start_time).total_seconds()
                    
                    # Inference time
                    start_time = datetime.now()
                    predictions = model.predict(X_val, verbose=0)
                    inference_time = (datetime.now() - start_time).total_seconds()
                    
                    model_metrics['cv_scores'].append(min(history.history['val_loss']))
                    model_metrics['training_time'].append(training_time)
                    model_metrics['inference_time'].append(inference_time)
                
                results.append({
                    'model_name': model_metrics['model_name'],
                    'mean_cv_score': np.mean(model_metrics['cv_scores']),
                    'std_cv_score': np.std(model_metrics['cv_scores']),
                    'mean_training_time': np.mean(model_metrics['training_time']),
                    'mean_inference_time': np.mean(model_metrics['inference_time'])
                })
            
            self.model_comparisons = results
            return results
            
        except Exception as e:
            logger.error(f"Error in model comparison: {e}")
            return []

class PerformanceAlert:
    def __init__(self, config: Dict):
        self.config = config
        self.alerts = []
        
    def check_model_performance(self, metrics: Dict) -> List[Dict]:
        """Check for performance issues and generate alerts"""
        new_alerts = []
        
        # Check accuracy drop
        if metrics['accuracy'] < self.config['min_accuracy']:
            new_alerts.append({
                'level': 'warning',
                'type': 'accuracy_drop',
                'message': f"Model accuracy ({metrics['accuracy']:.2f}) below threshold",
                'timestamp': datetime.now().isoformat()
            })
        
        # Check high loss
        if metrics['loss'] > self.config['max_loss']:
            new_alerts.append({
                'level': 'error',
                'type': 'high_loss',
                'message': f"Model loss ({metrics['loss']:.4f}) above threshold",
                'timestamp': datetime.now().isoformat()
            })
        
        # Check prediction deviation
        if abs(metrics['prediction_deviation']) > self.config['max_deviation']:
            new_alerts.append({
                'level': 'warning',
                'type': 'prediction_deviation',
                'message': f"High prediction deviation detected",
                'timestamp': datetime.now().isoformat()
            })
        
        self.alerts.extend(new_alerts)
        # Keep only recent alerts
        self.alerts = self.alerts[-100:]
        
        return new_alerts
    
    def get_active_alerts(self) -> List[Dict]:
        """Get list of active alerts"""
        return self.alerts
