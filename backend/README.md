# 🚀 AI-Powered Trading Platform Backend

## Production Deployment on Railway

### Environment Variables Required:
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://avanceai:avanceai@cluster0.cxtwu1s.mongodb.net/trading-platform?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=8f2a7e1d3c4b9a6f7d2e5c1a4f9b7e2d8c3a1f6b4e7d9c2f5a8b1d6c3f7e9a2f
JWT_EXPIRES_IN=3h
CORS_ORIGIN=https://avanceai.netlify.app
DHAN_ACCESS_TOKEN=your_token_here
DHAN_CLIENT_ID=1104166915
```

### Features:
- ✅ MongoDB Atlas integration
- ✅ Real-time WebSocket data
- ✅ JWT authentication
- ✅ Trading API integration
- ✅ CORS configured for production
- ✅ Health check endpoint

### Health Check:
`GET /api/health` - Returns server status and uptime

### Deployment:
1. Push to GitHub
2. Connect to Railway
3. Set environment variables
4. Deploy automatically