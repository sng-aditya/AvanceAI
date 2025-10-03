# 🚀 Quick Deployment Guide - Heartbeat & Activity Tracking

## Pre-Deployment Steps

### 1. Verify All Changes
```bash
# Check backend changes
cd backend
git status

# Check frontend changes  
cd ../frontend
git status
```

**Modified Backend Files:**
- `src/models/Session.js` - Added lastActivity, revokedReason
- `src/middleware/auth.js` - Activity tracking
- `src/services/sessionMonitor.js` - Inactivity checks
- `src/routes/auth.js` - Heartbeat endpoint
- `src/controllers/authController.js` - Logout enhancement

**Modified Frontend Files:**
- `src/context/AuthContext.tsx` - Heartbeat integration
- `tsconfig.app.json` - Added allowJs

**New Files:**
- `backend/scripts/migrate-sessions.js` - Migration script
- `frontend/src/services/heartbeat.js` - Heartbeat service
- `frontend/src/services/heartbeat.d.ts` - TypeScript declarations
- `backend/HEARTBEAT_IMPLEMENTATION.md` - Documentation

---

## Deployment Order

### Step 1: Deploy Backend First

```bash
cd backend

# Install dependencies (if needed)
npm install

# Run migration script to update existing sessions
node scripts/migrate-sessions.js

# Expected output:
# ✅ Migration completed successfully!
# Updated sessions: X
# Sessions already up to date: Y
# Created indexes: lastActivity, compound(revoked, lastActivity)

# Start the backend
npm start

# Verify logs show:
# "📊 Session monitor started"
# "🔍 Checking for inactive sessions..."
```

### Step 2: Deploy Frontend

```bash
cd frontend

# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Deploy the build folder to your hosting (Netlify/Vercel/etc)
```

---

## Post-Deployment Verification

### Test 1: Login & Heartbeat Start
1. Open browser DevTools → Network tab
2. Login to the application
3. Look for heartbeat requests every 5 minutes at `/api/auth/heartbeat`
4. ✅ Should see: 200 OK response with `{ success: true, sessionActive: true }`

### Test 2: Database Check
```javascript
// In MongoDB shell
db.sessions.findOne({ revoked: false })

// Should show:
// {
//   ...
//   lastActivity: ISODate("2024-01-08T12:00:00.000Z"), // Recent timestamp
//   revokedReason: null,
//   ...
// }
```

### Test 3: Logout
1. Click logout button
2. Check session in database
3. ✅ Should show: `revoked: true, revokedReason: "logout"`

### Test 4: Inactivity (Optional - Takes 30+ minutes)
1. Login, then close all browser tabs
2. Wait 32 minutes (30 min timeout + 2 min check interval)
3. Check session in database
4. ✅ Should show: `revoked: true, revokedReason: "inactivity"`

---

## Monitoring Commands

### Check Active Sessions
```javascript
// Sessions active in last 5 minutes
db.sessions.find({
  revoked: false,
  lastActivity: { $gt: new Date(Date.now() - 5 * 60 * 1000) }
}).count()
```

### Check Heartbeat Endpoint Health
```bash
# Using curl (replace with your actual token)
curl -X POST http://localhost:5000/api/auth/heartbeat \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected: {"success":true,"sessionActive":true,"expiresAt":"...","lastActivity":"..."}
```

### Monitor Backend Logs
```bash
# In production mode, logs are minimal:
# - Session monitor status
# - Error messages only

# In development mode, logs are verbose:
# - Every heartbeat request
# - Session activity updates
# - Inactivity checks
```

---

## Rollback Plan (If Needed)

If something goes wrong, you can rollback by:

### Backend Rollback
```bash
cd backend

# Revert migration (remove new fields - they're non-breaking so optional)
# Or just deploy previous version - new fields won't cause issues

# Stop and restart with previous version
git checkout <previous-commit>
npm start
```

### Frontend Rollback
```bash
cd frontend

# Remove heartbeat integration
git checkout <previous-commit>
npm run build

# Deploy previous build
```

**Note**: The backend changes are backward compatible. Old frontend will work with new backend. Only issue: sessions won't get heartbeat updates (but will still work for 7 days).

---

## Environment Variables (Optional)

Add these to your `.env` if you want to customize timeouts:

```bash
# Backend (.env)
SESSION_INACTIVITY_TIMEOUT=1800000  # 30 minutes in ms
SESSION_CHECK_INTERVAL=120000        # 2 minutes in ms

# Frontend (.env or config)
VITE_HEARTBEAT_INTERVAL=300000      # 5 minutes in ms
```

---

## Troubleshooting

### Issue: Migration script fails
```bash
# Check MongoDB connection
node -e "require('./src/config/db').connectDB().then(() => console.log('Connected')).catch(e => console.error(e))"

# Run migration with more logs
NODE_ENV=development node scripts/migrate-sessions.js
```

### Issue: Heartbeat requests not appearing
1. Check browser console for errors
2. Verify token in localStorage: `localStorage.getItem('token')`
3. Check if heartbeatService started: Add `console.log` in `heartbeat.js` start method
4. Verify backend endpoint: `curl -X POST http://localhost:5000/api/auth/heartbeat -H "Authorization: Bearer <token>"`

### Issue: Sessions still timing out
1. Check backend logs for inactivity checks
2. Verify heartbeat interval: Should be < 30 minutes (default: 5 minutes)
3. Check network tab: Heartbeat should succeed with 200 status
4. Verify lastActivity updates in database after heartbeat

---

## Success Criteria

✅ Backend starts without errors  
✅ Migration script runs successfully  
✅ Login works normally  
✅ Heartbeat requests appear every 5 minutes  
✅ Sessions show recent lastActivity in database  
✅ Logout sets revokedReason: "logout"  
✅ Inactive sessions auto-revoke after 30 minutes  
✅ No breaking changes to existing functionality  

---

## Support

If you encounter issues:

1. **Check logs**: Backend logs will show any errors
2. **Check database**: Verify session documents have lastActivity field
3. **Check network**: Browser DevTools → Network → Look for heartbeat requests
4. **Review docs**: See `HEARTBEAT_IMPLEMENTATION.md` for detailed info

---

## Next Steps After Deployment

1. **Monitor for 24 hours**: Watch for any unexpected session terminations
2. **Check metrics**: Track number of inactive session revocations
3. **User feedback**: Ensure users aren't experiencing unexpected logouts
4. **Fine-tune timeouts**: Adjust inactivity timeout if needed (currently 30 minutes)

---

**Deployment Time Estimate**: 15-20 minutes  
**Downtime Required**: None (rolling deployment supported)  
**Risk Level**: Low (all changes are additive, no breaking changes)

Ready to deploy! 🚀
