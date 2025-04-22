#!/bin/bash
# Coverage Analyzer Script

cd "$(dirname "$(readlink -f "$0")")"/.. || exit

cd frontend || exit

# Run coverage analysis
npm run coverage

# Generate report
npx nyc report --reporter=html

# Open report in browser
xdg-open coverage/index.html
