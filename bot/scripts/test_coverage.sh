#!/bin/bash
# Test Coverage Script

cd "$(dirname "$(readlink -f "$0")")"/.. || exit

cd frontend || exit

# Run tests with coverage
npm run test:coverage

# Generate report
npx nyc report --reporter=html

# Check coverage thresholds
npx nyc check-coverage --statements 80 --branches 70 --functions 80 --lines 80
