from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # FastAPI configuration
    title: str = "Crypto Trading Bot API"
    description: str = "API for cryptocurrency trading bot"
    version: str = "1.0.0"
    
    # Application settings
    PROJECT_NAME: str = "Crypto Trading Bot"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "your-secret-key-here"  # Change this in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database settings
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./trading_bot.db"
    
    # Binance API settings
    BINANCE_API_KEY: str = ""
    BINANCE_API_SECRET: str = ""
    
    # Trading settings
    TEST_MODE: bool = True
    INITIAL_CAPITAL: float = 10000.0
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()