require('dotenv').config();

const DB_TYPE = process.env.DB_TYPE || 'mysql';

// Tables without an 'id' column (have composite keys or other primary keys)
const tablesWithoutId = ['profile_interests', 'interest_category_translations', 'interest_translations'];

let pool;

if (DB_TYPE === 'postgres') {
  // PostgreSQL configuration
  const { Pool } = require('pg');

  // Support both DATABASE_URL (Fly.io, Render, etc.) and individual env vars
  const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    : {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 5432,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };

  pool = new Pool(poolConfig);

  // Test connection
  pool.query('SELECT NOW()')
    .then(() => {
      console.log('✓ PostgreSQL Database connected successfully');
    })
    .catch(err => {
      console.error('✗ PostgreSQL Database connection failed:', err.message);
    });

  // Store original query before overriding
  const originalQuery = pool.query.bind(pool);

  // Make pg compatible with mysql2 API
  pool.queryCompat = async function(sql, params = []) {
    const queryType = sql.trim().split(/\s+/)[0].toUpperCase();

    // Convert ? placeholders to $1, $2, etc. for PostgreSQL
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);

    // For INSERT queries, add RETURNING id only for tables that have an id column
    if (queryType === 'INSERT' && !sql.toUpperCase().includes('RETURNING')) {
      // Extract table name from INSERT INTO table_name
      const tableMatch = sql.match(/INSERT\s+(?:IGNORE\s+)?INTO\s+([^\s(]+)/i);
      const tableName = tableMatch ? tableMatch[1].toLowerCase() : null;

      // Only add RETURNING id if table is not in the exclusion list
      if (tableName && !tablesWithoutId.includes(tableName)) {
        const pgSqlWithReturning = pgSql.trim().replace(/;?\s*$/, '') + ' RETURNING id';
        const result = await originalQuery(pgSqlWithReturning, params);

        return [{
          affectedRows: result.rowCount,
          insertId: result.rows && result.rows[0] ? result.rows[0].id : undefined,
          rowCount: result.rowCount
        }, undefined];
      }
    }

    // Use originalQuery directly to avoid infinite loop
    const result = await originalQuery(pgSql, params);

    if (queryType === 'SELECT' || queryType === 'SHOW' || queryType === 'DESCRIBE') {
      // SELECT query - return rows
      return [result.rows, result.fields];
    } else if (queryType === 'INSERT') {
      // INSERT without RETURNING - return standard format
      return [{
        affectedRows: result.rowCount,
        insertId: undefined,
        rowCount: result.rowCount
      }, undefined];
    } else {
      // UPDATE/DELETE - create a mysql2-compatible result object
      return [{
        affectedRows: result.rowCount,
        rowCount: result.rowCount
      }, undefined];
    }
  };

  // Override query to use queryCompat by default for compatibility
  pool.query = async function(...args) {
    // Always use queryCompat to ensure mysql2-compatible return format
    if (typeof args[0] === 'string') {
      return await pool.queryCompat(...args);
    }
    // For non-string queries (rare), use native query
    return await originalQuery(...args);
  };

} else {
  // MySQL/MariaDB configuration (default)
  const mysql = require('mysql2/promise');

  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00',
    dateStrings: true
  });

  // Test connection
  pool.getConnection()
    .then(connection => {
      console.log('✓ MySQL/MariaDB Database connected successfully');
      connection.release();
    })
    .catch(err => {
      console.error('✗ MySQL/MariaDB Database connection failed:', err.message);
    });
}

// Export database type info
pool.dbType = DB_TYPE;

// Add execute alias for compatibility (mysql2 uses execute, pg uses query)
// Both work the same way with our wrapper
pool.execute = pool.query;

// Add getConnection method for transaction support
if (DB_TYPE === 'postgres') {
  pool.getConnection = async function() {
    const client = await pool.connect();

    // Wrap the client to match mysql2 API
    const wrappedClient = {
      query: async function(sql, params = []) {
        const queryType = sql.trim().split(/\s+/)[0].toUpperCase();

        // Convert ? placeholders to $1, $2, etc.
        let paramIndex = 1;
        const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);

        // For INSERT queries, add RETURNING id only for tables that have an id column
        if (queryType === 'INSERT' && !sql.toUpperCase().includes('RETURNING')) {
          // Extract table name from INSERT INTO table_name
          const tableMatch = sql.match(/INSERT\s+(?:IGNORE\s+)?INTO\s+([^\s(]+)/i);
          const tableName = tableMatch ? tableMatch[1].toLowerCase() : null;

          // Only add RETURNING id if table is not in the exclusion list
          if (tableName && !tablesWithoutId.includes(tableName)) {
            const pgSqlWithReturning = pgSql.trim().replace(/;?\s*$/, '') + ' RETURNING id';
            const result = await client.query(pgSqlWithReturning, params);

            return [{
              affectedRows: result.rowCount,
              insertId: result.rows && result.rows[0] ? result.rows[0].id : undefined,
              rowCount: result.rowCount
            }, undefined];
          }
        }

        const result = await client.query(pgSql, params);

        if (queryType === 'SELECT' || queryType === 'SHOW' || queryType === 'DESCRIBE') {
          return [result.rows, result.fields];
        } else if (queryType === 'INSERT') {
          return [{
            affectedRows: result.rowCount,
            insertId: undefined,
            rowCount: result.rowCount
          }, undefined];
        } else {
          return [{
            affectedRows: result.rowCount,
            rowCount: result.rowCount
          }, undefined];
        }
      },
      beginTransaction: async function() {
        await client.query('BEGIN');
      },
      commit: async function() {
        await client.query('COMMIT');
      },
      rollback: async function() {
        await client.query('ROLLBACK');
      },
      release: function() {
        client.release();
      }
    };

    return wrappedClient;
  };
}

module.exports = pool;
