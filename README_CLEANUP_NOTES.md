Cleanup changes made on 2025-09-17:

- Removed root package.json and package-lock.json (unused) to avoid workspace confusion; use frontend/backend package.json instead.
- Backend: Made CORS origin configurable via CORS_ORIGIN env (comma-separated).
- Backend: Fail fast if JWT_SECRET is missing in production.
- Backend: Fixed limitPrice calculation to respect uppercased priceType.
- Backend: Order history mapping aligned for executed fields and error fields.
- Backend: Order details route no longer returns remote payload in production responses.
- Frontend: Changed User.id type to string to match Mongo ObjectId.
- Frontend: Dispatch both 'orderPlaced' (new) and 'orderExecuted' (legacy) on successful placement.

SQLite Cleanup completed:
- ✅ Removed all SQLite database files and initialization scripts
- ✅ Removed unused MarketDataSnapshot and OptionChainSnapshot models
- ✅ Dropped unused MongoDB collections (marketdatasnapshots, optionchainsnapshots)
- ✅ Project now uses MongoDB exclusively with collections: users, sessions, orders, watchlists
