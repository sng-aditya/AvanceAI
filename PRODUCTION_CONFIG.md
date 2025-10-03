# Production Configuration Guide

## ✅ Production URLs
- **Frontend**: https://avanceai.netlify.app/
- **Backend**: https://avanceai-production.up.railway.app/
- **API Base**: https://avanceai-production.up.railway.app/api

## 🔧 Configuration Status

### ✅ Frontend Configuration (Netlify)

#### `.env.production`
```bash
VITE_API_URL=https://avanceai-production.up.railway.app
VITE_NODE_ENV=production
```

#### `netlify.toml`
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18
- **API Proxy**: `/api/*` → `https://avanceai-production.up.railway.app/api/:splat`
- **SPA Redirect**: All routes redirect to `index.html` for React Router

### ✅ Backend Configuration (Railway)

#### Environment Variables to Set in Railway Dashboard
```bash
# MongoDB
MONGODB_URI=mongodb+srv://avanceai:avanceai@cluster0.cxtwu1s.mongodb.net/trading-platform?retryWrites=true&w=majority&appName=Cluster0

# Auth
JWT_SECRET=9f2a7e1d3c4b9a6f7d2e5c1a4f9b7e2d8c3a1f6b4e7d9c2f5a8b1d6c3f7e9a2a
JWT_EXPIRES_IN=3h

# Server
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://avanceai.netlify.app

# Dhan API
DHAN_ACCESS_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzU5NTU1NDg5LCJpYXQiOjE3NTk0NjkwODksInRva2VuQ29uc3VtZXJUeXBlIjoiU0VMRiIsIndlYmhvb2tVcmwiOiIiLCJkaGFuQ2xpZW50SWQiOiIxMTA0MTY2OTE1In0.fkt1xUbEMPtBKQVBJMSbopDTWXvJWlUovjwtYQRh9dl_1sdGy4vD5hQZHQ0uF6CG1wyk_OdUQRicFJPtNq7o2g
DHAN_CLIENT_ID=1104166915
```

#### `railway.json`
- **Builder**: NIXPACKS
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check**: `/api/health`
- **Restart Policy**: On failure, max 10 retries

## 🚀 Deployment Steps

### Deploy Backend to Railway
1. **Push to GitHub** (Railway auto-deploys from GitHub):
   ```bash
   cd backend
   git add .
   git commit -m "Update production config"
   git push origin main
   ```

2. **Set Environment Variables in Railway Dashboard**:
   - Go to: https://railway.app/project/[your-project-id]/service/[service-id]/variables
   - Add all variables listed above
   - **CRITICAL**: Set `NODE_ENV=production` and `CORS_ORIGIN=https://avanceai.netlify.app`

3. **Verify Deployment**:
   - Health check: https://avanceai-production.up.railway.app/api/health
   - Should return: `{"status":"ok","timestamp":"..."}`

### Deploy Frontend to Netlify
1. **Build Locally** (optional test):
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy via Git**:
   ```bash
   git add .
   git commit -m "Update production config"
   git push origin main
   ```
   - Netlify auto-deploys from GitHub

3. **Or Deploy Manually**:
   ```bash
   cd frontend
   npm run build
   netlify deploy --prod --dir=dist
   ```

4. **Verify Deployment**:
   - Visit: https://avanceai.netlify.app/
   - Test login and API calls

## 🔒 Security Checklist

### Backend (Railway)
- [x] CORS restricted to production frontend URL
- [x] JWT secret set (strong random string)
- [x] NODE_ENV=production
- [ ] MongoDB connection uses SSL/TLS
- [ ] Rate limiting enabled (check `backend/src/app.js`)
- [ ] Helmet.js security headers enabled

### Frontend (Netlify)
- [x] HTTPS enabled (automatic with Netlify)
- [x] API calls use HTTPS backend URL
- [x] Environment variables properly set
- [ ] CSP headers configured (optional, in `netlify.toml`)

## 🧪 Testing Checklist

### Frontend
- [ ] Login/Logout works
- [ ] Real-time market data loads
- [ ] Stock charts display correctly
- [ ] Watchlist functionality
- [ ] Order placement
- [ ] Mobile responsive design

### Backend
- [ ] `/api/health` returns 200 OK
- [ ] `/api/auth/login` works
- [ ] `/api/auth/register` works
- [ ] `/api/market/stock-ohlc/:symbol` returns chart data
- [ ] WebSocket connections establish
- [ ] Session monitoring active

### Integration
- [ ] CORS allows frontend requests
- [ ] JWT tokens work across frontend/backend
- [ ] Real-time WebSocket data flows
- [ ] API rate limiting doesn't block legitimate requests

## 🐛 Troubleshooting

### CORS Errors
**Problem**: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution**: 
1. Check Railway environment variable `CORS_ORIGIN` includes `https://avanceai.netlify.app`
2. Restart Railway service after changing env vars
3. Check backend logs for CORS configuration

### 502 Bad Gateway
**Problem**: Netlify shows 502 when calling `/api/*`

**Solution**:
1. Verify backend is running: https://avanceai-production.up.railway.app/api/health
2. Check `netlify.toml` proxy configuration
3. Ensure Railway service is deployed and not sleeping

### Login Fails in Production
**Problem**: Login works locally but fails in production

**Solution**:
1. Check browser console for specific error
2. Verify `VITE_API_URL` in `.env.production`
3. Check Railway logs for backend errors
4. Verify JWT_SECRET is set in Railway env vars

### Charts Don't Load
**Problem**: Stock charts show "Failed to fetch data"

**Solution**:
1. Check Dhan API token hasn't expired
2. Verify security ID mapping in `backend/src/routes/marketData.js`
3. Check Railway logs for Dhan API errors
4. Test endpoint directly: https://avanceai-production.up.railway.app/api/market/stock-ohlc/NIFTY_50

## 📊 Monitoring

### Railway Logs
```bash
# View real-time logs
railway logs --follow

# Or use Railway dashboard
https://railway.app/project/[your-project-id]/deployments
```

### Netlify Logs
- Go to: https://app.netlify.com/sites/avanceai/deploys
- Click on latest deployment
- View "Deploy log" and "Function log"

### Health Monitoring
- Set up uptime monitoring (e.g., UptimeRobot, Pingdom)
- Monitor endpoint: https://avanceai-production.up.railway.app/api/health
- Alert if health check fails

## 🔄 Environment Comparison

| Config | Local Dev | Production |
|--------|-----------|------------|
| **Frontend URL** | http://localhost:5173 | https://avanceai.netlify.app |
| **Backend URL** | http://localhost:5000 | https://avanceai-production.up.railway.app |
| **Database** | MongoDB Atlas | MongoDB Atlas (same) |
| **NODE_ENV** | development | production |
| **CORS Origin** | localhost + local IP | Netlify URL only |

## 📝 Notes

- **Local `.env` file**: Keep your local `.env` for development (with localhost URLs)
- **Railway Environment**: Set production values directly in Railway dashboard
- **Netlify Environment**: Uses `.env.production` file from git repository
- **Database**: Both dev and prod use the same MongoDB Atlas cluster (consider separate DBs for prod)
- **Dhan API Token**: Expires on **2025-10-30** - update before expiry!

## ✅ Current Status

**Local Development**:
- ✅ Frontend: `http://10.16.233.230:5173` (network accessible for mobile testing)
- ✅ Backend: `http://10.16.233.230:5000` (network accessible)
- ✅ CORS: Allows localhost and local IP

**Production**:
- ✅ Frontend `.env.production`: Points to Railway backend
- ✅ Backend CORS: Includes Netlify frontend URL
- ✅ Netlify proxy: Configured for `/api/*` routes
- ✅ Railway health check: Configured

**Next Steps**:
1. Push changes to GitHub
2. Verify Railway auto-deploys with new CORS setting
3. Verify Netlify auto-deploys with updated proxy
4. Test production login and API calls
5. Monitor Railway logs for any errors
