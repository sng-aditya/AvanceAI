#!/bin/bash
echo "🚀 Deploying Backend to Railway..."

cd backend

echo "📝 Adding files to git..."
git add .

echo "💾 Committing changes..."
git commit -m "Configure backend for Railway deployment"

echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Backend deployed! Check Railway dashboard for build status."