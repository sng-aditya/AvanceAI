# 📱 Mobile Access Guide - Test on Android Phone

## 🎯 Quick Access

### Your URLs for Android Phone:
- **Frontend (React)**: `http://10.16.233.230:5173`
- **Backend (API)**: `http://10.16.233.230:5000`

## 🔧 Configuration Changes Made

### 1. Frontend - Vite Configuration Updated ✅
**File**: `frontend/vite.config.ts`

Added network access:
```typescript
server: {
  host: true, // Allow access from network
  port: 5173,
  // ... proxy config
}
```

### 2. Backend - CORS Configuration Updated ✅
**File**: `backend/.env`

Added your local IP to allowed origins:
```
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://10.16.233.230:5173
```

The backend was already configured to listen on `0.0.0.0` (all network interfaces) ✅

## 📋 Step-by-Step Setup

### Step 1: Make Sure Both Are on Same WiFi Network
- ✅ Your computer: Connected to WiFi
- ✅ Your Android phone: Connected to **same WiFi network**

### Step 2: Start the Servers

#### Terminal 1 - Backend:
```powershell
cd C:\Users\adity\OneDrive\Desktop\project\backend
npm start
```

Wait for: `Server: ✅ Running on port 5000`

#### Terminal 2 - Frontend:
```powershell
cd C:\Users\adity\OneDrive\Desktop\project\frontend
npm run dev
```

You should see:
```
VITE v5.4.8  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: http://10.16.233.230:5173/
➜  press h + enter to show help
```

### Step 3: Access from Android Phone

Open Chrome/Firefox on your phone and navigate to:
```
http://10.16.233.230:5173
```

## 🔥 Firewall Configuration (Windows)

If you can't access from phone, you may need to allow the ports through Windows Firewall:

### Allow Vite (Port 5173):
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

### Allow Backend (Port 5000):
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Node Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

Or manually:
1. Open Windows Defender Firewall
2. Advanced Settings → Inbound Rules → New Rule
3. Port → TCP → Specific ports: `5173, 5000`
4. Allow the connection
5. Apply to all (Domain, Private, Public)
6. Name it "Dev Servers"

## 🧪 Testing

### Test Backend API:
Open Chrome on your phone:
```
http://10.16.233.230:5000/api/health
```

Should return:
```json
{
  "status": "ok",
  "websocket": "connected"
}
```

### Test Frontend:
```
http://10.16.233.230:5173
```

Should load the landing page.

## 📱 Expected Behavior on Phone

### ✅ What Should Work:
- Landing page loads
- Login/Authentication
- Dashboard views
- Market data display
- Real-time updates via WebSocket
- Chart viewing
- All navigation
- Dark mode toggle
- Responsive mobile design

### ⚠️ What to Check:
- Touch interactions (buttons, scrolling)
- Mobile menu (hamburger icon)
- Form inputs (keyboard behavior)
- Chart rendering on smaller screen
- Performance with real-time data

## 🐛 Troubleshooting

### Problem: Can't access from phone

**Solution 1**: Check if computer and phone are on same WiFi
```powershell
# On computer, check WiFi network:
netsh wlan show interfaces
```

**Solution 2**: Verify firewall allows connections
- Try temporarily disabling Windows Firewall to test
- If it works, add firewall rules as shown above

**Solution 3**: Check if IP address is correct
```powershell
# Get current IP:
ipconfig | Select-String -Pattern "IPv4"
```

### Problem: Frontend loads but API calls fail

**Check CORS settings**:
- Make sure `CORS_ORIGIN` in backend `.env` includes your IP
- Restart backend server after changing `.env`

**Check browser console**:
- Open Chrome DevTools on phone: `chrome://inspect`
- Look for CORS errors

### Problem: WebSocket not connecting

**Update WebSocket URL** if needed:
The frontend should automatically use the correct backend URL, but if not:
- Check `frontend/src/utils/api.ts` for API base URL configuration

## 💡 Tips for Mobile Testing

### 1. Use Chrome Remote Debugging:
On your computer:
1. Open Chrome
2. Go to `chrome://inspect`
3. Connect phone via USB
4. Enable "USB Debugging" on phone
5. Inspect mobile browser

### 2. Check Network Tab:
- Monitor API calls
- Check response times
- Verify WebSocket connection

### 3. Test Different Scenarios:
- Portrait and landscape modes
- Different network conditions
- Switch between WiFi and mobile data
- Background/foreground app transitions

### 4. Performance Testing:
- Monitor memory usage
- Check frame rate
- Test with real-time data streaming

## 🔄 If Your IP Address Changes

Your local IP (10.16.233.230) might change if:
- You reconnect to WiFi
- Router assigns new IP
- Computer restarts

**To update**:
1. Get new IP: `ipconfig | Select-String -Pattern "IPv4"`
2. Update `backend/.env` → `CORS_ORIGIN`
3. Restart backend server
4. Use new IP in phone browser

## 📊 Performance Considerations

### Mobile Network:
- WiFi is recommended for testing
- Real-time data may be slower on 4G/5G
- WebSocket reconnection should work seamlessly

### Mobile Browser:
- Chrome/Firefox recommended
- Safari may have different WebSocket behavior
- Check browser console for errors

## 🚀 Production Deployment

For actual production mobile app:
- Use a proper domain name
- Configure SSL/HTTPS
- Use environment variables for API URLs
- Consider building a native app wrapper (Capacitor/Cordova)
- Implement proper mobile error handling
- Add offline mode support

## 📝 Quick Reference

| What | URL |
|------|-----|
| Frontend (Computer) | http://localhost:5173 |
| Frontend (Phone) | http://10.16.233.230:5173 |
| Backend (Computer) | http://localhost:5000 |
| Backend (Phone) | http://10.16.233.230:5000 |
| API Health Check | http://10.16.233.230:5000/api/health |

## ✅ Checklist Before Testing

- [ ] Computer and phone on same WiFi
- [ ] Backend running (`npm start` in backend folder)
- [ ] Frontend running (`npm run dev` in frontend folder)
- [ ] Firewall allows ports 5173 and 5000
- [ ] CORS_ORIGIN includes your IP in backend/.env
- [ ] IP address is correct (run `ipconfig` to verify)
- [ ] Can access health endpoint from phone browser

## 🎉 You're All Set!

Open Chrome on your Android phone and navigate to:
**`http://10.16.233.230:5173`**

Happy testing! 📱✨
