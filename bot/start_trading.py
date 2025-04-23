#!/usr/bin/env python3
"""
Trading Bot Startup Script
Initializes and runs the trading engine
"""

import os
import sys
import asyncio
import logging
from trading.trading_engine import TradingEngine
from config.trading_config import CONFIG

async def main():
    # Create necessary directories
    os.makedirs(CONFIG['system']['data_dir'], exist_ok=True)
    os.makedirs(CONFIG['system']['models_dir'], exist_ok=True)
    os.makedirs(CONFIG['system']['logs_dir'], exist_ok=True)
    
    # Initialize and run trading engine
    engine = TradingEngine()
    await engine.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Trading bot stopped by user")
    except Exception as e:
        logging.error(f"Trading bot stopped due to error: {e}")
        sys.exit(1)
