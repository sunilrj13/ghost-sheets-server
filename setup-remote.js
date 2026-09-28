const mysql = require('mysql2/promise');

async function setup() {
  console.log('Connecting to Hostinger MySQL...');
  try {
    const connection = await mysql.createConnection({
      host: 'srv1946.hstgr.io',
      user: 'u258725744_ghost01',
      password: 'Ghost@2611',
      database: 'u258725744_gsheets_db'
    });

    console.log('Successfully connected to Hostinger Database!');

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

    console.log('✅ Remote Setup complete! The tables are ready on Hostinger.');
    await connection.end();
  } catch (error) {
    console.error('❌ Error during setup:', error);
  }
}

setup();
