#!/bin/bash
# Build script for Netlify deployment

# Build frontend with Vite (outputs to dist/public)
npm run build:base

# Copy dist/public to dist/client for Netlify
rm -rf dist/client
cp -r dist/public dist/client

echo "Build complete: frontend in dist/client, backend in dist/"
