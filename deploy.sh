#!/bin/bash

# Exit on error
set -e

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building the application..."
npm run build

# Install gh-pages if not already installed
if ! command -v gh-pages &> /dev/null; then
  echo "Installing gh-pages..."
  npm install -g gh-pages
fi

# Deploy to GitHub Pages
echo "Deploying to GitHub Pages..."
npm run deploy

echo "Deployment completed successfully!"
echo "Your application should be live at: https://<your-username>.github.io/<repository-name>/"
