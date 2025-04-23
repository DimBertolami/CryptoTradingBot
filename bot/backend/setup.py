from setuptools import setup, find_packages

setup(
    name="paper_trading_bot",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "flask>=2.0.0",
        "flask-cors>=3.0.0",
        "python-dotenv>=0.19.0",
        "requests>=2.25.0",
        "pandas>=1.3.0",
        "numpy>=1.21.0",
        "ccxt>=4.0.0",
        "ta>=0.11.0",
        "python-binance>=1.0.0",
        "websockets>=10.0"
    ],
    python_requires='>=3.7',
    author="Trading Bot Team",
    description="Paper Trading Bot Backend",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
