@echo off
echo 🚀 Deploying Trading Platform to Railway...

echo 📝 Adding all files to git...
git add .

echo 💾 Committing changes...
git commit -m "Configure monorepo for Railway deployment - Backend ready"

echo 🚀 Pushing to GitHub...
git push origin main

echo ✅ Deployment pushed! 
echo 📋 Next steps:
echo    1. Check Railway dashboard for build status
echo    2. Add environment variables in Railway
echo    3. Test health endpoint: https://your-app.railway.app/api/health

pause