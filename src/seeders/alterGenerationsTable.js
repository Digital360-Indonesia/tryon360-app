const database = require('../config/database');

/**
 * Alter Generations Table
 * Add missing columns to existing generations table
 */

async function alterGenerationsTable() {
  try {
    console.log('🔧 Starting generations table alteration...');

    // Connect to database
    await database.connect();
    const pool = database.getPool();

    // Check if columns exist first
    console.log('🔍 Checking existing columns...');
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'generations'
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('📋 Existing columns:', existingColumns);

    // Add progress column if not exists
    if (!existingColumns.includes('progress')) {
      console.log('➕ Adding progress column...');
      await pool.query(`
        ALTER TABLE generations
        ADD COLUMN progress INT DEFAULT 0
      `);
      console.log('✅ Progress column added');
    } else {
      console.log('⏭️  Progress column already exists');
    }

    // Add error column if not exists
    if (!existingColumns.includes('error')) {
      console.log('➕ Adding error column...');
      await pool.query(`
        ALTER TABLE generations
        ADD COLUMN error TEXT
      `);
      console.log('✅ Error column added');
    } else {
      console.log('⏭️  Error column already exists');
    }

    // Add endTime column if not exists
    if (!existingColumns.includes('endTime')) {
      console.log('➕ Adding endTime column...');
      await pool.query(`
        ALTER TABLE generations
        ADD COLUMN endTime TIMESTAMP NULL
      `);
      console.log('✅ EndTime column added');
    } else {
      console.log('⏭️  EndTime column already exists');
    }

    // Add processingTime column if not exists
    if (!existingColumns.includes('processingTime')) {
      console.log('➕ Adding processingTime column...');
      await pool.query(`
        ALTER TABLE generations
        ADD COLUMN processingTime INT
      `);
      console.log('✅ ProcessingTime column added');
    } else {
      console.log('⏭️  ProcessingTime column already exists');
    }

    // Add metadata column if not exists
    if (!existingColumns.includes('metadata')) {
      console.log('➕ Adding metadata column...');
      await pool.query(`
        ALTER TABLE generations
        ADD COLUMN metadata JSON
      `);
      console.log('✅ Metadata column added');
    } else {
      console.log('⏭️  Metadata column already exists');
    }

    // Add userIp column if not exists
    if (!existingColumns.includes('userIp')) {
      console.log('➕ Adding userIp column...');
      await pool.query(`
        ALTER TABLE generations
        ADD COLUMN userIp VARCHAR(45)
      `);
      console.log('✅ UserIp column added');
    } else {
      console.log('⏭️  UserIp column already exists');
    }

    // Add userAgent column if not exists
    if (!existingColumns.includes('userAgent')) {
      console.log('➕ Adding userAgent column...');
      await pool.query(`
        ALTER TABLE generations
        ADD COLUMN userAgent TEXT
      `);
      console.log('✅ UserAgent column added');
    } else {
      console.log('⏭️  UserAgent column already exists');
    }

    // Add imagePath column if not exists
    if (!existingColumns.includes('imagePath')) {
      console.log('➕ Adding imagePath column...');
      await pool.query(`
        ALTER TABLE generations
        ADD COLUMN imagePath VARCHAR(500)
      `);
      console.log('✅ ImagePath column added');
    } else {
      console.log('⏭️  ImagePath column already exists');
    }

    // Show final table structure
    console.log('\n📊 Final table structure:');
    const [finalColumns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'generations'
      ORDER BY ORDINAL_POSITION
    `);

    finalColumns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE})${col.COLUMN_DEFAULT ? ` default ${col.COLUMN_DEFAULT}` : ''}`);
    });

    console.log('\n✅ Generations table alteration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Table alteration failed:', error);
    process.exit(1);
  }
}

// Run alteration
alterGenerationsTable();
