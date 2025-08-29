const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../../database/auth.db');

// Create database connection
const createDBConnection = () => {
  return new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    }
  });
};

// Promisify database methods
const dbRun = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
};

const dbGet = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const dbAll = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Simplified database interface
const db = createDBConnection();

const run = (sql, params = []) => dbRun(db, sql, params);
const get = (sql, params = []) => dbGet(db, sql, params);
const all = (sql, params = []) => dbAll(db, sql, params);

module.exports = {
  createDBConnection,
  dbRun,
  dbGet,
  dbAll,
  run,
  get,
  all
};