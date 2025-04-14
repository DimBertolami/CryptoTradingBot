from setuptools import setup, find_packages

setup(
    name="crypto_trading_bot",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.100.0",
        "uvicorn>=0.23.0",
        "python-dotenv>=1.0.0",
        "requests>=2.31.0",
        "pandas>=2.0.0",
        "numpy>=1.24.0",
        "scikit-learn>=1.3.0",
        "tensorflow>=2.13.0",
        "pydantic>=2.0.0",
        "pydantic-settings>=2.0.0"
    ],
    entry_points={
        "console_scripts": [
            "crypto-bot=app.main:main"
        ]
    },
    python_requires=">=3.8",
    author="Dim Bertolami",
    description="Crypto Trading Bot Backend",
    url="https://github.com/DimBertolami/CryptoTradingBot",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
