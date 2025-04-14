from fastapi import APIRouter, Depends
from app.core.config import get_settings

router = APIRouter()

@router.get("/backend")
async def get_backend_status(settings: get_settings = Depends()):
    return {
        "is_running": True,
        "status": "active",
        "mode": "test" if settings.TEST_MODE else "live",
        "last_updated": "2025-04-14T01:43:00Z",
        "details": {
            "version": "1.0.0",
            "environment": "development"
        }
    }

@router.get("/signals")
async def get_signals_status():
    return {
        "is_running": True,
        "status": "active",
        "mode": "test",
        "last_updated": "2025-04-14T01:43:00Z",
        "details": {
            "strategy": "moving_average",
            "parameters": {
                "short_window": 20,
                "long_window": 50
            }
        }
    }

@router.get("/paper_trading")
async def get_paper_trading_status():
    return {
        "is_running": True,
        "status": "active",
        "mode": "paper",
        "last_updated": "2025-04-14T01:43:00Z",
        "details": {
            "initial_capital": 10000.0,
            "current_balance": 10000.0,
            "positions": []
        }
    }

@router.get("/database")
async def get_database_status():
    return {
        "is_running": True,
        "status": "active",
        "mode": "test",
        "last_updated": "2025-04-14T01:43:00Z",
        "details": {
            "type": "sqlite",
            "size": "10MB",
            "records": 1000
        }
    }