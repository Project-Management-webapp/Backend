// Migration script to add Google Auth columns
require('dotenv').config();
const mysql = require('mysql2/promise');

async function addGoogleAuthColumns() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log('Connected to database');

    // Add google_auth_enabled column
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN google_auth_enabled TINYINT(1) DEFAULT 0 
        COMMENT 'Whether Google Authenticator 2FA is enabled'
      `);
      console.log('✓ Added google_auth_enabled column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ google_auth_enabled column already exists');
      } else {
        throw err;
      }
    }

    // Add google_auth_secret column
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN google_auth_secret VARCHAR(255) DEFAULT NULL 
        COMMENT 'Google Authenticator secret key'
      `);
      console.log('✓ Added google_auth_secret column');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ google_auth_secret column already exists');
      } else {
        throw err;
      }
    }

    console.log('\n✅ Migration completed successfully!');
    
    // Show table structure
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM users WHERE Field LIKE 'google_auth%'
    `);
    
    console.log('\nGoogle Auth columns:');
    console.table(columns);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addGoogleAuthColumns();
