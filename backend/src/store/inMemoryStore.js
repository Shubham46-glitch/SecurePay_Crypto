// Shared in-memory data store for resilient offline/fallback operation
// Starts with 0 records (Strictly zero mock/fake data)

const inMemoryTransactions = [];
const inMemoryLogs = [];

module.exports = {
  inMemoryTransactions,
  inMemoryLogs,
};
