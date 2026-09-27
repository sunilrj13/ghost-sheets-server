const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' }); // or .env.local

async function setup() {
  console.log('Connecting to MySQL...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('Creating database ghost_sheets_db...');
    await connection.query('CREATE DATABASE IF NOT EXISTS ghost_sheets_db;');
    
    console.log('Using database...');
    await connection.query('USE ghost_sheets_db;');

    console.log('Creating License table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS License (
        id VARCHAR(255) PRIMARY KEY,
        \`key\` VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        maxDevices INT DEFAULT 1,
        expiresAt DATETIME NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        customerName VARCHAR(255)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Creating Device table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS Device (
        id VARCHAR(255) PRIMARY KEY,
        licenseId VARCHAR(255) NOT NULL,
        hardwareId VARCHAR(255) NOT NULL,
        deviceName VARCHAR(255),
        lastActive DATETIME DEFAULT CURRENT_TIMESTAMP,
        isRevoked BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (licenseId) REFERENCES License(id) ON DELETE CASCADE,
        UNIQUE (licenseId, hardwareId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Setup complete! The database and tables are ready.');
    await connection.end();
  } catch (error) {
    console.error('❌ Error during setup:', error);
  }
}

setup();
