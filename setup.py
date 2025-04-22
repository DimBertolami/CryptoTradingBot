from setuptools import setup, find_packages
import os

# Read README.md for long description
with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

# Get version from version.py
version_file = os.path.join("cryptobot", "version.py")
version = {}
with open(version_file) as f:
    exec(f.read(), version)

setup(
    name="cryptobot",
    version=version["__version__"],
    author="Dimi Bertolami",
    author_email="dimitri.bertolami@hotmail.com",
    description="Advanced cryptocurrency trading bot with ML capabilities",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/DimBertolami/CryptoTradingBot",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.8',
    install_requires=[
        'numpy>=1.19.5',
        'pandas>=1.3.0',
        'scikit-learn>=0.24.2',
        'scipy>=1.7.0',
        'ccxt>=4.0.0',
        'pytest>=6.2.0',
        'pytest-asyncio>=0.26.0',
        'matplotlib>=3.4.0',
        'seaborn>=0.11.0',
        'websockets>=8.0',
        'ortools>=9.0.0',
        'python-dotenv>=0.19.0'
    ],
    extras_require={
        'dev': [
            'pytest>=6.2.0',
            'pytest-asyncio>=0.26.0',
            'black>=21.0',
            'flake8>=3.9.0',
            'mypy>=0.800'
        ]
    },
    entry_points={
        'console_scripts': [
            'cryptobot=cryptobot.cli:main',
        ],
    },
)
