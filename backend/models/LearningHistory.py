from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class LearningIteration(Base):
    __tablename__ = 'learning_iterations'
    
    id = Column(Integer, primary_key=True)
    iteration_number = Column(Integer)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    algorithm = Column(String)
    strategy = Column(String)
    parameters = Column(JSON)
    performance_metrics = Column(JSON)
    risk_metrics = Column(JSON)
    feature_importance = Column(JSON)
    action_distribution = Column(JSON)
    state_space_coverage = Column(JSON)
    training_duration = Column(Float)  # in seconds
    total_trades = Column(Integer)
    successful_trades = Column(Integer)
    failed_trades = Column(Integer)
    profit_loss = Column(Float)
    sharpe_ratio = Column(Float)
    max_drawdown = Column(Float)
    volatility = Column(Float)
    win_rate = Column(Float)
    learning_rate = Column(Float)
    exploration_rate = Column(Float)
    policy_stability = Column(Float)
    risk_score = Column(Float)
    notes = Column(String)
    
    # Relationships
    trade_history = relationship('LearningTrade', back_populates='iteration')
    model_snapshots = relationship('LearningModel', back_populates='iteration')
    
    def __repr__(self):
        return f"LearningIteration(id={self.id}, iteration_number={self.iteration_number}, algorithm='{self.algorithm}')"

class LearningTrade(Base):
    __tablename__ = 'learning_trades'
    
    id = Column(Integer, primary_key=True)
    iteration_id = Column(Integer, ForeignKey('learning_iterations.id'))
    trade_id = Column(String)
    timestamp = Column(DateTime)
    symbol = Column(String)
    action = Column(String)
    entry_price = Column(Float)
    exit_price = Column(Float)
    quantity = Column(Float)
    profit_loss = Column(Float)
    duration = Column(Float)  # in minutes
    risk_level = Column(Float)
    reward_risk = Column(Float)
    confidence_score = Column(Float)
    prediction_accuracy = Column(Float)
    feature_weights = Column(JSON)
    
    # Relationships
    iteration = relationship('LearningIteration', back_populates='trade_history')
    
    def __repr__(self):
        return f"LearningTrade(id={self.id}, symbol='{self.symbol}', action='{self.action}')"

class LearningModel(Base):
    __tablename__ = 'learning_models'
    
    id = Column(Integer, primary_key=True)
    iteration_id = Column(Integer, ForeignKey('learning_iterations.id'))
    model_type = Column(String)
    model_version = Column(String)
    model_path = Column(String)
    training_metrics = Column(JSON)
    validation_metrics = Column(JSON)
    feature_importance = Column(JSON)
    hyperparameters = Column(JSON)
    training_duration = Column(Float)
    training_samples = Column(Integer)
    validation_samples = Column(Integer)
    test_samples = Column(Integer)
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    auc_roc = Column(Float)
    
    # Relationships
    iteration = relationship('LearningIteration', back_populates='model_snapshots')
    
    def __repr__(self):
        return f"LearningModel(id={self.id}, model_type='{self.model_type}', version='{self.model_version}')"

class LearningMetric(Base):
    __tablename__ = 'learning_metrics'
    
    id = Column(Integer, primary_key=True)
    iteration_id = Column(Integer, ForeignKey('learning_iterations.id'))
    metric_type = Column(String)
    metric_name = Column(String)
    value = Column(Float)
    timestamp = Column(DateTime)
    period = Column(Integer)  # in minutes
    confidence_interval = Column(JSON)
    
    def __repr__(self):
        return f"LearningMetric(id={self.id}, metric_name='{self.metric_name}', value={self.value})"

class LearningProgress(Base):
    __tablename__ = 'learning_progress'
    
    id = Column(Integer, primary_key=True)
    iteration_id = Column(Integer, ForeignKey('learning_iterations.id'))
    timestamp = Column(DateTime)
    progress_percentage = Column(Float)
    current_state = Column(String)
    status = Column(String)
    message = Column(String)
    
    def __repr__(self):
        return f"LearningProgress(id={self.id}, progress_percentage={self.progress_percentage})"