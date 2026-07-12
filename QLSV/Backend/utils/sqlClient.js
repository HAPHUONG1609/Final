const isWindows = process.platform === "win32";

if (isWindows) {
  module.exports = require("msnodesqlv8");
  return;
}

const mssql = require("mssql");

let poolPromise = null;

function parseConnectionString(connectionString) {
  const parts = String(connectionString || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);

  const config = {};
  for (const part of parts) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim().toLowerCase();
    const value = part.slice(index + 1).trim();
    config[key] = value;
  }

  const serverRaw = config.server || process.env.SQL_SERVER || "localhost";
  const [server, portRaw] = serverRaw.split(",");
  const port = Number(portRaw || config.port || 1433);

  return {
    server: server.trim(),
    port: Number.isFinite(port) ? port : 1433,
    database: config.database || process.env.SQL_DATABASE || "master",
    user: config.uid || process.env.SQL_USER || "",
    password: config.pwd || process.env.SQL_PASSWORD || "",
    options: {
      encrypt: String(config.encrypt || "false").toLowerCase() === "true",
      trustServerCertificate:
        String(config.trustservercertificate || "true").toLowerCase() === "true",
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

function getPool(connectionString) {
  if (!poolPromise) {
    const config = parseConnectionString(connectionString);
    poolPromise = new mssql.ConnectionPool(config)
      .connect()
      .catch((error) => {
        poolPromise = null;
        throw error;
      });
  }
  return poolPromise;
}

function bindParams(request, params = []) {
  params.forEach((value, index) => {
    request.input(`p${index}`, value);
  });
}

function normalizeQuery(query, params = []) {
  let index = 0;
  return String(query).replace(/\?/g, () => `@p${index++}`);
}

async function runQuery(executor, queryText, params = []) {
  const request = executor.request();
  bindParams(request, params);
  const sqlText = normalizeQuery(queryText, params);
  const result = await request.query(sqlText);
  return result.recordset || [];
}

function query(connectionString, queryText, params, callback) {
  let finalParams = params;
  let finalCallback = callback;

  if (typeof finalParams === "function") {
    finalCallback = finalParams;
    finalParams = [];
  }

  getPool(connectionString)
    .then((pool) => runQuery(pool, queryText, finalParams || []))
    .then((rows) => finalCallback(null, rows))
    .catch((error) => finalCallback(error));
}

function open(connectionString, callback) {
  getPool(connectionString)
    .then((pool) => {
      const transaction = new mssql.Transaction(pool);
      let transactionStarted = false;

      const conn = {
        query(queryText, params, cb) {
          let finalParams = params;
          let finalCallback = cb;

          if (typeof finalParams === "function") {
            finalCallback = finalParams;
            finalParams = [];
          }

          const executor = transactionStarted ? transaction : pool;
          runQuery(executor, queryText, finalParams || [])
            .then((rows) => finalCallback(null, rows))
            .catch((error) => finalCallback(error));
        },
        beginTransaction(cb) {
          transaction
            .begin()
            .then(() => {
              transactionStarted = true;
              cb(null);
            })
            .catch((error) => cb(error));
        },
        commit(cb) {
          if (!transactionStarted) return cb(null);
          transaction
            .commit()
            .then(() => {
              transactionStarted = false;
              cb(null);
            })
            .catch((error) => cb(error));
        },
        rollback(cb) {
          if (!transactionStarted) return cb(null);
          transaction
            .rollback()
            .then(() => {
              transactionStarted = false;
              cb(null);
            })
            .catch(() => cb(null));
        },
        close(cb) {
          if (typeof cb === "function") {
            cb(null);
          }
        },
      };

      callback(null, conn);
    })
    .catch((error) => callback(error));
}

module.exports = {
  query,
  open,
};
