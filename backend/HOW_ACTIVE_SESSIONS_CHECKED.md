# How Active Sessions Are Checked

## Overview
The Session Monitor checks for active user sessions by querying the MongoDB `sessions` collection every 30 seconds to determine if the WebSocket should be running.

## Session Check Query

The core query used to count active sessions:

```javascript
await Session.countDocuments({
  revoked: false,           // Session is NOT revoked (user hasn't logged out)
  expiresAt: { $gt: new Date() }  // Session has NOT expired yet
});
```

## Session Schema

Each session in the database has these fields:

```javascript
{
  user: ObjectId,           // Reference to the User
  jti: String,              // JWT Token ID (unique identifier)
  ip: String,               // User's IP address
  userAgent: String,        // User's browser/device info
  expiresAt: Date,          // When this session expires
  revoked: Boolean,         // true if user logged out
  createdAt: Date,          // Auto-generated timestamp
  updatedAt: Date           // Auto-generated timestamp
}
```

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Session Monitor                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Every 30 sec   │
                    └─────────────────┘
                              │
                              ▼
        ┌───────────────────────────────────────────┐
        │  Query MongoDB:                           │
        │  Session.countDocuments({                 │
        │    revoked: false,                        │
        │    expiresAt: { $gt: new Date() }        │
        │  })                                       │
        └───────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Count = ?      │
                    └─────────────────┘
                          │     │
                 ┌────────┘     └────────┐
                 │                       │
            Count > 0               Count = 0
                 │                       │
                 ▼                       ▼
        ┌─────────────────┐    ┌─────────────────┐
        │ Users Active!   │    │ No Users!       │
        │                 │    │                 │
        │ If WebSocket    │    │ If WebSocket    │
        │ NOT running:    │    │ IS running:     │
        │ → START IT      │    │ → STOP IT       │
        └─────────────────┘    └─────────────────┘
```

## Example Scenarios

### Scenario 1: User Logs In
```
1. User submits login credentials
2. authController creates a new Session:
   {
     user: "user_id_123",
     jti: "unique_token_id",
     expiresAt: Date.now() + 7 days,
     revoked: false
   }
3. Session saved to MongoDB
4. Within 30 seconds, Session Monitor checks
5. Finds: count = 1 (active session)
6. Starts WebSocket if not already running
```

### Scenario 2: User Logs Out
```
1. User clicks logout
2. authController updates Session:
   {
     revoked: true  ← Changed from false
   }
3. Session updated in MongoDB
4. Within 30 seconds, Session Monitor checks
5. Query finds: revoked: false → count = 0
6. Stops WebSocket if this was the last active session
```

### Scenario 3: Session Expires
```
1. Session created 7 days ago with:
   {
     expiresAt: "2025-10-01T10:00:00Z",
     revoked: false
   }
2. Current time: "2025-10-03T10:00:00Z"
3. Session Monitor checks
4. Query: expiresAt > now() → False!
5. Count = 0 (expired sessions excluded)
6. Stops WebSocket if no other active sessions
```

### Scenario 4: Multiple Users
```
1. User A logs in → count = 1 → Start WebSocket
2. User B logs in → count = 2 → WebSocket already running
3. User A logs out → count = 1 → Keep WebSocket running
4. User B logs out → count = 0 → Stop WebSocket
```

## Code Breakdown

### Step 1: Count Active Sessions
```javascript
const count = await Session.countDocuments({
  revoked: false,           // NOT logged out
  expiresAt: { $gt: new Date() }  // NOT expired
});
```

**What this does:**
- Queries MongoDB for ALL sessions
- Filters to only non-revoked sessions
- Filters to only non-expired sessions
- Returns the count (not the actual documents)

### Step 2: Update Internal State
```javascript
const previousCount = this.activeSessionCount;
this.activeSessionCount = count;
```

**What this does:**
- Stores the old count
- Updates with new count
- Used to detect changes

### Step 3: Log Changes (Development Only)
```javascript
if (previousCount !== count) {
  logger.debug(`Active sessions: ${count}`);
}
```

**What this does:**
- Only logs when count changes (reduces noise)
- Uses debug level (only shows in development)
- Example: "Active sessions: 3" → "Active sessions: 2"

### Step 4: Manage WebSocket
```javascript
if (count > 0 && !this.isWebSocketActive) {
  this.startWebSocket();
} else if (count === 0 && this.isWebSocketActive) {
  this.stopWebSocket();
}
```

**What this does:**
- **count > 0 AND WebSocket OFF** → Turn WebSocket ON
- **count = 0 AND WebSocket ON** → Turn WebSocket OFF
- **count > 0 AND WebSocket ON** → Do nothing (already on)
- **count = 0 AND WebSocket OFF** → Do nothing (already off)

## Performance Considerations

### Efficient Query
- **Indexed Fields**: `revoked` and `expiresAt` are indexed
- **Count Only**: Uses `countDocuments()` (faster than fetching all data)
- **No Data Transfer**: Only returns a number, not full documents

### Check Frequency
- **30 seconds** is a balance between:
  - ✅ Responsive (users see WebSocket connect quickly)
  - ✅ Efficient (not hammering the database)
  - ✅ Resource-friendly (only 120 checks/hour)

### Why Not Real-Time?
We don't use real-time change streams because:
- ❌ More complex to implement
- ❌ Requires MongoDB replica set
- ❌ More resource-intensive
- ✅ 30-second delay is acceptable for this use case

## Database Indexes

The Session model has indexes on:
```javascript
{ user: 1 }        // Find sessions by user
{ jti: 1 }         // Find session by token ID
{ expiresAt: 1 }   // Query for expired sessions (USED HERE!)
```

The `expiresAt` index makes our query very fast even with thousands of sessions.

## Monitoring

You can check active sessions manually:

### Using MongoDB Shell
```bash
mongo
use trading-platform
db.sessions.countDocuments({
  revoked: false,
  expiresAt: { $gt: new Date() }
})
```

### Using Node.js
```javascript
const sessionMonitor = require('./src/services/sessionMonitor');
console.log('Active sessions:', sessionMonitor.getActiveSessionCount());
```

### View All Active Sessions
```javascript
const { Session } = require('./src/models');
Session.find({
  revoked: false,
  expiresAt: { $gt: new Date() }
})
.populate('user', 'email first_name last_name')
.then(sessions => {
  console.log('Active sessions:', sessions);
});
```

## Session Cleanup

In addition to checking active sessions, the monitor also cleans up old data:

```javascript
// Runs every 5 minutes
await Session.deleteMany({
  $or: [
    // Revoked sessions older than 30 days
    { 
      revoked: true, 
      createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
    },
    // Expired sessions older than 7 days
    { 
      expiresAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
    }
  ]
});
```

This prevents the database from growing indefinitely with old session records.

## Summary

**Active sessions are checked by:**
1. ✅ Querying MongoDB every 30 seconds
2. ✅ Counting non-revoked sessions that haven't expired
3. ✅ Starting WebSocket if count > 0 (users active)
4. ✅ Stopping WebSocket if count = 0 (no users active)

**This approach is:**
- 🚀 Efficient (indexed queries, count-only)
- 🔒 Reliable (based on actual database state)
- 🎯 Simple (easy to understand and maintain)
- ⚡ Fast (30-second response time)
- 💾 Resource-friendly (minimal overhead)
