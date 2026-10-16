/**
 * Database config — disabled (in-memory only mode).
 * No MongoDB connection is attempted. All data lives in process memory.
 */

const connectDB = async () => {
  // No-op: this app uses in-memory storage only.
  console.log('[Database] Running in pure in-memory mode (no MongoDB).');
};

const getDBStatus = () => ({
  connected: false,
  readyState: 0,
  host: 'In-Memory Only',
  name: 'N/A',
});

module.exports = { connectDB, getDBStatus };
