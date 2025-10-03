/**
 * Migration script to add lastActivity field to existing sessions
 * Run this once: node scripts/migrate-sessions.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trading-platform');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const sessionsCollection = db.collection('sessions');

    // Count sessions that need migration
    const needsMigration = await sessionsCollection.countDocuments({
      lastActivity: { $exists: false }
    });

    if (needsMigration === 0) {
      console.log('✅ All sessions already have lastActivity field');
      await mongoose.disconnect();
      return;
    }

    console.log(`📝 Found ${needsMigration} sessions that need migration`);

    // Add lastActivity to all existing sessions (use createdAt or current time)
    const result = await sessionsCollection.updateMany(
      { lastActivity: { $exists: false } },
      [
        {
          $set: {
            lastActivity: {
              $ifNull: ['$createdAt', new Date()]
            }
          }
        }
      ]
    );

    console.log(`✅ Updated ${result.modifiedCount} sessions with lastActivity field`);

    // Create indexes
    console.log('🔄 Creating indexes...');
    
    await sessionsCollection.createIndex({ lastActivity: 1 });
    console.log('✅ Created index: { lastActivity: 1 }');
    
    await sessionsCollection.createIndex({ revoked: 1, lastActivity: 1 });
    console.log('✅ Created compound index: { revoked: 1, lastActivity: 1 }');

    // Display summary
    console.log('\n📊 Migration Summary:');
    const totalSessions = await sessionsCollection.countDocuments({});
    const activeSessions = await sessionsCollection.countDocuments({
      revoked: false,
      expiresAt: { $gt: new Date() }
    });
    
    console.log(`   Total sessions: ${totalSessions}`);
    console.log(`   Active sessions: ${activeSessions}`);
    console.log(`   Sessions migrated: ${result.modifiedCount}`);

    await mongoose.disconnect();
    console.log('\n✅ Migration complete! Session monitor is now ready to track activity.');
    console.log('💡 Users will be auto-logged out after 30 minutes of inactivity.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
