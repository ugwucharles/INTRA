const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../backups');
  const backupFile = path.join(backupDir, `intra-backup-${timestamp}.sql`);

  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log(`🗄️  Starting database backup...`);
  console.log(`📁 Backup file: ${backupFile}`);

  // Use pg_dump to backup the database
  const command = `pg_dump "${databaseUrl}" > "${backupFile}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Backup failed: ${error.message}`);
      process.exit(1);
    }
    if (stderr) {
      console.error(`⚠️  Warning: ${stderr}`);
    }

    console.log(`✅ Database backup completed successfully`);
    console.log(`📦 Backup size: ${fs.statSync(backupFile).size} bytes`);

    // Clean up old backups (keep last 7 days)
    const files = fs.readdirSync(backupDir);
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    files.forEach(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;

      if (fileAge > sevenDaysMs) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Deleted old backup: ${file}`);
      }
    });

    console.log(`🧹 Cleanup completed. Keeping backups from last 7 days.`);
  });
}

backupDatabase();
