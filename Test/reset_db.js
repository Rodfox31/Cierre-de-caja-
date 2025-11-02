// Reset SQLite DB tables 'cierres' and 'justificaciones' and restart AUTOINCREMENT
// Safety: Creates a timestamped backup before making changes

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.resolve(__dirname, '..', 'db.js.db');

function timestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${y}${m}${d}_${hh}${mm}${ss}`;
}

(async () => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.error(`DB file not found at ${DB_PATH}`);
      process.exit(1);
    }

    // 1) Backup
    const backupDir = path.resolve(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    const backupPath = path.join(backupDir, `db_backup_${timestamp()}.db`);
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`Backup created: ${backupPath}`);

    // 2) Open DB
    const db = new sqlite3.Database(DB_PATH);

    // Helpers
    const run = (sql, params=[]) => new Promise((resolve, reject) => {
      db.run(sql, params, function(err){
        if (err) return reject(err);
        resolve(this);
      });
    });
    const get = (sql, params=[]) => new Promise((resolve, reject) => {
      db.get(sql, params, function(err, row){
        if (err) return reject(err);
        resolve(row);
      });
    });

    // 3) Show counts before
    const beforeCierres = await get('SELECT COUNT(*) as c FROM cierres');
    const beforeJust = await get('SELECT COUNT(*) as c FROM justificaciones');
    console.log(`Before - cierres: ${beforeCierres.c}, justificaciones: ${beforeJust.c}`);

    await run('PRAGMA foreign_keys = ON');
    await run('BEGIN IMMEDIATE TRANSACTION');

    // 4) Delete child then parent
    await run('DELETE FROM justificaciones');
    await run('DELETE FROM cierres');

    // 5) Reset AUTOINCREMENT sequence
    await run("DELETE FROM sqlite_sequence WHERE name IN ('justificaciones','cierres')");

    await run('COMMIT');

    // 6) VACUUM to compact
    await run('VACUUM');

    // 7) Show counts after and sequence state
    const afterCierres = await get('SELECT COUNT(*) as c FROM cierres');
    const afterJust = await get('SELECT COUNT(*) as c FROM justificaciones');
    const seqRows = await new Promise((resolve, reject) => {
      db.all("SELECT name, seq FROM sqlite_sequence WHERE name IN ('justificaciones','cierres')", [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    console.log(`After  - cierres: ${afterCierres.c}, justificaciones: ${afterJust.c}`);
    if (!seqRows || seqRows.length === 0) {
      console.log('Sequences cleared. Next IDs will start at 1.');
    } else {
      console.log('Sequences state:', seqRows);
    }

    db.close();
    console.log('DB reset completed successfully.');
  } catch (err) {
    console.error('Error resetting DB:', err);
    process.exit(1);
  }
})();
