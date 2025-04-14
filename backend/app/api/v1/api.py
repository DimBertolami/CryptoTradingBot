from fastapi import APIRouter
from app.api.v1.endpoints import status, trading

api_router = APIRouter()

# Include routers
api_router.include_router(status.router, prefix="/status", tags=["status"])
api_router.include_router(trading.router, prefix="/trading", tags=["trading"])